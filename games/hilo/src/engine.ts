import { BaseGameEngine, GameExecutionInput, GameExecutionOutput } from '@nova/game-engine';
import { ProvablyFair } from '@nova/fairness';
import { HiLoParams, HiLoOutcome, HiLoCard, HiLoStep, HiLoSuit } from '@nova/types';

export class HiLoEngine extends BaseGameEngine<HiLoParams, HiLoOutcome> {
  public static SUITS: HiLoSuit[] = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
  public static LABELS: string[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  constructor(houseEdgePercent: number = 1.0) {
    super({
      gameId: 'hilo',
      name: 'Hi-Lo Cards',
      houseEdgePercent,
      minBet: 1,
      maxBet: 10000,
    });
  }

  /**
   * Generates a deterministic playing card from seeds, nonce, and draw step
   */
  public static generateCard(serverSeed: string, clientSeed: string, nonce: number, step: number): HiLoCard {
    const floatVal = ProvablyFair.generateFloat(serverSeed, clientSeed, nonce * 1000 + step);
    const index = Math.floor(floatVal * 52);
    const suitIndex = Math.floor(index / 13);
    const rankIndex = index % 13;
    const suit = HiLoEngine.SUITS[suitIndex];
    const rank = rankIndex + 1; // 1 to 13
    const label = HiLoEngine.LABELS[rankIndex];
    const color = suit === 'HEARTS' || suit === 'DIAMONDS' ? 'RED' : 'BLACK';

    return {
      index,
      rank,
      suit,
      label,
      color,
    };
  }

  /**
   * Calculates step multipliers and probabilities based on current card rank
   * House edge 1% (factor = 0.99)
   */
  public static calculateStepOdds(currentRank: number, houseEdgePercent: number = 1.0) {
    const edgeFactor = (100 - houseEdgePercent) / 100; // 0.99
    
    // Higher or same: cards with rank >= currentRank (count: 14 - currentRank out of 13)
    const hiCount = 14 - currentRank;
    const hiProb = hiCount / 13;
    const rawHiMult = edgeFactor / Math.max(0.001, hiProb);
    const nextHiMultiplier = Math.max(0.99, Math.floor(rawHiMult * 100) / 100);

    // Lower or same: cards with rank <= currentRank (count: currentRank out of 13)
    const loCount = currentRank;
    const loProb = loCount / 13;
    const rawLoMult = edgeFactor / Math.max(0.001, loProb);
    const nextLoMultiplier = Math.max(0.99, Math.floor(rawLoMult * 100) / 100);

    return {
      nextHiMultiplier,
      nextLoMultiplier,
      nextHiProbability: Math.round(hiProb * 10000) / 100,
      nextLoProbability: Math.round(loProb * 10000) / 100,
    };
  }

  protected validateParams(params: HiLoParams): { valid: boolean; error?: string } {
    if (!params) {
      return { valid: false, error: 'Hi-Lo parameters required' };
    }
    if (params.action && !['START', 'GUESS', 'CASHOUT'].includes(params.action)) {
      return { valid: false, error: "Invalid action. Must be 'START', 'GUESS', or 'CASHOUT'" };
    }
    if (params.action === 'GUESS' && !params.guess) {
      return { valid: false, error: "Guess ('HI', 'LO', or 'SKIP') is required for GUESS action" };
    }
    return { valid: true };
  }

  public evaluate(input: GameExecutionInput<HiLoParams>): GameExecutionOutput<HiLoOutcome> {
    const { action = 'START', guess, history = [], currentMultiplier = 1.0 } = input.params;
    const stepCount = history.length;

    // 1. Initial round start: deal first card at step 0
    if (action === 'START' || stepCount === 0) {
      const startCard = HiLoEngine.generateCard(input.serverSeed, input.clientSeed, input.nonce, 0);
      const odds = HiLoEngine.calculateStepOdds(startCard.rank, this.config.houseEdgePercent);

      const initialHistory: HiLoStep[] = [{ card: startCard }];

      return {
        won: false,
        multiplier: 1.0,
        payout: 0,
        profit: -input.amount,
        outcome: {
          currentCard: startCard,
          history: initialHistory,
          currentMultiplier: 1.0,
          nextHiMultiplier: odds.nextHiMultiplier,
          nextLoMultiplier: odds.nextLoMultiplier,
          nextHiProbability: odds.nextHiProbability,
          nextLoProbability: odds.nextLoProbability,
          isGameOver: false,
          cashedOut: false,
        },
      };
    }

    // 2. Cashout action: lock in current multiplier
    if (action === 'CASHOUT') {
      const finalMultiplier = Math.max(1.0, Math.floor(currentMultiplier * 100) / 100);
      const { payout, profit } = this.calculatePayout(input.amount, finalMultiplier);
      const lastStep = history[history.length - 1];
      const odds = HiLoEngine.calculateStepOdds(lastStep.card.rank, this.config.houseEdgePercent);

      return {
        won: true,
        multiplier: finalMultiplier,
        payout,
        profit,
        outcome: {
          currentCard: lastStep.card,
          history,
          currentMultiplier: finalMultiplier,
          nextHiMultiplier: odds.nextHiMultiplier,
          nextLoMultiplier: odds.nextLoMultiplier,
          nextHiProbability: odds.nextHiProbability,
          nextLoProbability: odds.nextLoProbability,
          isGameOver: true,
          cashedOut: true,
        },
      };
    }

    // 3. Guess action: deal next card and verify against guess
    const currentCard = history[history.length - 1].card;
    const nextCard = HiLoEngine.generateCard(input.serverSeed, input.clientSeed, input.nonce, stepCount);
    const odds = HiLoEngine.calculateStepOdds(currentCard.rank, this.config.houseEdgePercent);

    let isCorrect = false;
    let stepMult = 1.0;

    if (guess === 'HI') {
      isCorrect = nextCard.rank >= currentCard.rank;
      stepMult = odds.nextHiMultiplier;
    } else if (guess === 'LO') {
      isCorrect = nextCard.rank <= currentCard.rank;
      stepMult = odds.nextLoMultiplier;
    } else if (guess === 'SKIP') {
      isCorrect = true;
      stepMult = 1.0;
    }

    if (!isCorrect) {
      // Guess failed: player loses round
      const newHistory: HiLoStep[] = [
        ...history,
        { card: nextCard, guess, stepMultiplier: stepMult, correct: false },
      ];
      const nextOdds = HiLoEngine.calculateStepOdds(nextCard.rank, this.config.houseEdgePercent);

      return {
        won: false,
        multiplier: 0,
        payout: 0,
        profit: -input.amount,
        outcome: {
          currentCard: nextCard,
          history: newHistory,
          currentMultiplier: 0,
          nextHiMultiplier: nextOdds.nextHiMultiplier,
          nextLoMultiplier: nextOdds.nextLoMultiplier,
          nextHiProbability: nextOdds.nextHiProbability,
          nextLoProbability: nextOdds.nextLoProbability,
          isGameOver: true,
          cashedOut: false,
        },
      };
    }

    // Correct guess: compound multiplier
    const compoundedMultiplier = Math.floor(currentMultiplier * stepMult * 100) / 100;
    const newHistory: HiLoStep[] = [
      ...history,
      { card: nextCard, guess, stepMultiplier: stepMult, correct: true },
    ];
    const nextOdds = HiLoEngine.calculateStepOdds(nextCard.rank, this.config.houseEdgePercent);

    return {
      won: true,
      multiplier: compoundedMultiplier,
      payout: Math.floor(input.amount * compoundedMultiplier),
      profit: Math.floor(input.amount * (compoundedMultiplier - 1)),
      outcome: {
        currentCard: nextCard,
        history: newHistory,
        currentMultiplier: compoundedMultiplier,
        nextHiMultiplier: nextOdds.nextHiMultiplier,
        nextLoMultiplier: nextOdds.nextLoMultiplier,
        nextHiProbability: nextOdds.nextHiProbability,
        nextLoProbability: nextOdds.nextLoProbability,
        isGameOver: false,
        cashedOut: false,
      },
    };
  }
}
