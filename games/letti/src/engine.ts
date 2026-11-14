import { BaseGameEngine, GameExecutionInput, GameExecutionOutput } from '@nova/game-engine';
import { ProvablyFair } from '@nova/fairness';
import { LettiCard, LettiOutcome, LettiParams, LettiStep, LettiSuit } from '@nova/types';

export class LettiEngine extends BaseGameEngine<LettiParams, LettiOutcome> {
  public static SUITS: LettiSuit[] = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
  public static LABELS: string[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  public static PAYOUT_MULTIPLIER = 1.90;

  constructor(houseEdgePercent: number = 2.0) {
    super({
      gameId: 'letti',
      name: 'Letti 52-Card Match',
      houseEdgePercent,
      minBet: 1,
      maxBet: 10000,
    });
  }

  public static cardFromIndex(index: number): LettiCard {
    const safeIdx = Math.max(0, Math.min(51, Math.floor(index)));
    const suitIndex = Math.floor(safeIdx / 13);
    const rankIndex = safeIdx % 13;
    const suit = LettiEngine.SUITS[suitIndex];
    const rank = rankIndex + 1;
    const label = LettiEngine.LABELS[rankIndex];
    const color = suit === 'HEARTS' || suit === 'DIAMONDS' ? 'RED' : 'BLACK';
    return { index: safeIdx, rank, suit, label, color };
  }

  public static createFullDeck(): LettiCard[] {
    return Array.from({ length: 52 }, (_, i) => LettiEngine.cardFromIndex(i));
  }

  protected validateParams(params: LettiParams): { valid: boolean; error?: string } {
    if (!params || typeof params.pickedCardIndex !== 'number') {
      return { valid: false, error: 'Please pick a card from the 52-card deck' };
    }
    if (params.pickedCardIndex < 0 || params.pickedCardIndex > 51 || !Number.isInteger(params.pickedCardIndex)) {
      return { valid: false, error: 'Picked card index must be an integer between 0 and 51' };
    }
    return { valid: true };
  }

  /**
   * Deterministic Fisher-Yates shuffle of the remaining 51 cards (excluding pickedCardIndex).
   * Shared by both round preparation and independent verification.
   */
  public static buildShuffledOrder(
    pickedCardIndex: number,
    serverSeed: string,
    clientSeed: string,
    nonce: number
  ): number[] {
    const safePicked = Math.max(0, Math.min(51, Math.floor(pickedCardIndex)));
    const remainingIndices = Array.from({ length: 52 }, (_, i) => i).filter((i) => i !== safePicked);

    for (let i = remainingIndices.length - 1; i > 0; i--) {
      const floatVal = ProvablyFair.generateFloat(
        serverSeed,
        clientSeed,
        nonce * 100 + (remainingIndices.length - i)
      );
      const j = Math.floor(floatVal * (i + 1));
      const tmp = remainingIndices[i];
      remainingIndices[i] = remainingIndices[j];
      remainingIndices[j] = tmp;
    }

    return remainingIndices;
  }

  /**
   * Deterministic Fisher-Yates shuffle of the remaining 50 cards for 1v1 Letti
   * (excluding both Player 1's and Player 2's private secret card indices).
   */
  public static buildDuelShuffledOrder(
    playerOnePickIndex: number,
    playerTwoPickIndex: number,
    serverSeed: string,
    clientSeed: string,
    nonce: number
  ): number[] {
    const p1 = Math.max(0, Math.min(51, Math.floor(playerOnePickIndex)));
    const p2 = Math.max(0, Math.min(51, Math.floor(playerTwoPickIndex)));
    const remainingIndices = Array.from({ length: 52 }, (_, i) => i).filter(
      (i) => i !== p1 && i !== p2
    );

    for (let i = remainingIndices.length - 1; i > 0; i--) {
      const floatVal = ProvablyFair.generateFloat(
        serverSeed,
        clientSeed,
        nonce * 100 + (remainingIndices.length - i)
      );
      const j = Math.floor(floatVal * (i + 1));
      const tmp = remainingIndices[i];
      remainingIndices[i] = remainingIndices[j];
      remainingIndices[j] = tmp;
    }

    return remainingIndices;
  }

  /**
   * Evaluates a Letti round deterministically from an authoritative 51-card shuffled order.
   */
  public static evaluateFromOrder(
    amount: number,
    pickedCardIndex: number,
    shuffledOrder: number[]
  ): GameExecutionOutput<LettiOutcome> {
    const pickedCard = LettiEngine.cardFromIndex(pickedCardIndex);
    const steps: LettiStep[] = [];
    let winnerSide: 'USER' | 'SYSTEM' = 'SYSTEM';
    let matchedCard: LettiCard = LettiEngine.cardFromIndex(shuffledOrder[0]);

    // Step-by-step alternating flip: User side first (0, 2, 4...), then System side (1, 3, 5...)
    for (let i = 0; i < shuffledOrder.length; i++) {
      const side: 'USER' | 'SYSTEM' = i % 2 === 0 ? 'USER' : 'SYSTEM';
      const card = LettiEngine.cardFromIndex(shuffledOrder[i]);
      const matched = card.rank === pickedCard.rank;

      steps.push({
        step: i + 1,
        side,
        card,
        matched,
      });

      if (matched) {
        winnerSide = side;
        matchedCard = card;
        break;
      }
    }

    const won = winnerSide === 'USER';
    const multiplier = won ? LettiEngine.PAYOUT_MULTIPLIER : 0;
    const payout = won ? Math.floor(amount * multiplier) : 0;
    const profit = payout - amount;

    return {
      won,
      payout,
      profit,
      multiplier,
      outcome: {
        pickedCard,
        steps,
        winnerSide,
        matchedCard,
        totalFlips: steps.length,
      },
    };
  }

  public evaluate(input: GameExecutionInput<LettiParams>): GameExecutionOutput<LettiOutcome> {
    const shuffledOrder = LettiEngine.buildShuffledOrder(
      input.params.pickedCardIndex,
      input.serverSeed,
      input.clientSeed,
      input.nonce
    );
    return LettiEngine.evaluateFromOrder(input.amount, input.params.pickedCardIndex, shuffledOrder);
  }
}
