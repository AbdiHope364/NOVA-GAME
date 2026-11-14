import {
  LUDO_SAFE_TRACK_INDICES,
  LUDO_SEAT_COLOR_ORDER,
  progressToTrackIndex,
} from './board.js';
import {
  LegalLudoMove,
  LudoColor,
  LudoMatchState,
  LudoMoveRecord,
  LudoPlayerCount,
  LudoRulesetOptions,
  LudoSeatState,
} from './types.js';

export const DEFAULT_LUDO_RULESET_OPTIONS: LudoRulesetOptions = {
  blockadesEnabled: false,
  extraTurnOnCapture: true,
  mustRollSixToStart: true,
  exactFinishRequired: true,
};

function cloneState(state: LudoMatchState): LudoMatchState {
  return {
    ...state,
    rulesetOptions: state.rulesetOptions ? { ...state.rulesetOptions } : undefined,
    seats: state.seats.map((s) => ({
      ...s,
      tokens: s.tokens.map((t) => ({ ...t })),
    })),
    lastMove: state.lastMove
      ? { ...state.lastMove, captured: [...state.lastMove.captured] }
      : null,
  };
}

export function hasOpponentBlockade(
  state: LudoMatchState,
  myColor: LudoColor,
  trackIdx: number
): boolean {
  for (const oppSeat of state.seats) {
    if (oppSeat.color === myColor || oppSeat.forfeited) continue;
    let count = 0;
    for (const oppTok of oppSeat.tokens) {
      if (progressToTrackIndex(oppSeat.color, oppTok.progress) === trackIdx) {
        count++;
        if (count >= 2) return true;
      }
    }
  }
  return false;
}

function getNextActiveSeat(state: LudoMatchState, currentSeat: number): number {
  const ordered = state.seats.filter((s) => !s.forfeited);
  if (ordered.length === 0) return currentSeat;
  const idx = state.seats.findIndex((s) => s.seat === currentSeat);
  for (let offset = 1; offset <= state.seats.length; offset++) {
    const cand = state.seats[(idx + offset) % state.seats.length];
    if (!cand.forfeited && cand.finishedRank === undefined) {
      return cand.seat;
    }
  }
  return ordered[0].seat;
}

export function createLudoMatchState(
  players: Array<{ userId: string; username: string }>,
  firstSeat: number = 1,
  options?: Partial<LudoRulesetOptions>
): LudoMatchState {
  if (players.length < 2 || players.length > 4) {
    throw new Error('Ludo requires 2 to 4 players');
  }
  const playerCount = players.length as LudoPlayerCount;
  const colors = LUDO_SEAT_COLOR_ORDER[playerCount];

  const seats: LudoSeatState[] = players.map((p, idx) => ({
    seat: idx + 1,
    color: colors[idx],
    userId: p.userId,
    username: p.username,
    tokens: [0, 1, 2, 3].map((tokenIndex) => ({
      tokenIndex,
      progress: -1,
    })),
    forfeited: false,
    missedTurns: 0,
  }));

  const validFirst = seats.some((s) => s.seat === firstSeat) ? firstSeat : 1;

  return {
    rulesetVersion: 'NOVA_CLASSIC_V1',
    rulesetOptions: {
      ...DEFAULT_LUDO_RULESET_OPTIONS,
      ...options,
    },
    playerCount,
    turnPhase: 'ROLL',
    currentTurnSeat: validFirst,
    currentDice: null,
    consecutiveSixes: 0,
    turnNumber: 1,
    seats,
    winnerSeat: null,
    winnerColor: null,
    lastMove: null,
  };
}

export function getLegalLudoMoves(
  state: LudoMatchState,
  diceValue: number,
  optionsOverride?: Partial<LudoRulesetOptions>
): LegalLudoMove[] {
  if (state.turnPhase === 'FINISHED' || diceValue < 1 || diceValue > 6) {
    return [];
  }
  const activeSeat = state.seats.find((s) => s.seat === state.currentTurnSeat);
  if (!activeSeat || activeSeat.forfeited) return [];

  const options: LudoRulesetOptions = {
    ...DEFAULT_LUDO_RULESET_OPTIONS,
    ...(state.rulesetOptions || {}),
    ...(optionsOverride || {}),
  };

  const moves: LegalLudoMove[] = [];

  for (const token of activeSeat.tokens) {
    if (token.progress === 56) continue;

    if (token.progress === -1) {
      const canLeave = options.mustRollSixToStart ? diceValue === 6 : true;
      if (!canLeave) continue;
      const targetTrackIdx = progressToTrackIndex(activeSeat.color, 0)!;
      // If blockades enabled, check if opponent has a blockade on our start square
      if (options.blockadesEnabled && hasOpponentBlockade(state, activeSeat.color, targetTrackIdx)) {
        continue;
      }
      moves.push({
        tokenIndex: token.tokenIndex,
        fromProgress: -1,
        toProgress: 0,
        wouldLeaveBase: true,
        wouldFinish: false,
        targetTrackIdx,
        wouldCapture: [], // Start square is ALWAYS Safe
      });
      continue;
    }

    let toProgress = token.progress + diceValue;
    if (options.exactFinishRequired) {
      if (toProgress > 56) continue;
    } else {
      if (toProgress > 56) toProgress = 56;
    }

    // Check if intermediate squares or target square has an opponent blockade
    if (options.blockadesEnabled) {
      let isBlocked = false;
      for (let step = 1; step <= diceValue; step++) {
        const intermediateProgress = token.progress + step;
        if (intermediateProgress <= 50) {
          const stepTrackIdx = progressToTrackIndex(activeSeat.color, intermediateProgress);
          if (stepTrackIdx !== null && hasOpponentBlockade(state, activeSeat.color, stepTrackIdx)) {
            isBlocked = true;
            break;
          }
        }
      }
      if (isBlocked) continue;
    }

    const targetTrackIdx = progressToTrackIndex(activeSeat.color, toProgress);
    const wouldCapture: Array<{ color: LudoColor; tokenIndex: number }> = [];

    if (targetTrackIdx !== null && !LUDO_SAFE_TRACK_INDICES.has(targetTrackIdx)) {
      const oppBlocked = options.blockadesEnabled && hasOpponentBlockade(state, activeSeat.color, targetTrackIdx);
      if (!oppBlocked) {
        for (const oppSeat of state.seats) {
          if (oppSeat.color === activeSeat.color || oppSeat.forfeited) continue;
          for (const oppTok of oppSeat.tokens) {
            const oppTrackIdx = progressToTrackIndex(oppSeat.color, oppTok.progress);
            if (oppTrackIdx === targetTrackIdx) {
              wouldCapture.push({
                color: oppSeat.color,
                tokenIndex: oppTok.tokenIndex,
              });
            }
          }
        }
      }
    }

    moves.push({
      tokenIndex: token.tokenIndex,
      fromProgress: token.progress,
      toProgress,
      wouldLeaveBase: false,
      wouldFinish: toProgress === 56,
      targetTrackIdx,
      wouldCapture,
    });
  }

  return moves;
}

export function applyLudoRoll(
  state: LudoMatchState,
  diceValue: number
): {
  nextState: LudoMatchState;
  legalMoves: LegalLudoMove[];
  tripleSixCancelled: boolean;
  autoPassed: boolean;
} {
  if (state.turnPhase !== 'ROLL') {
    throw new Error('Cannot roll dice outside ROLL phase');
  }
  if (diceValue < 1 || diceValue > 6) {
    throw new Error('Invalid dice value');
  }

  const next = cloneState(state);
  const nextSixes = diceValue === 6 ? next.consecutiveSixes + 1 : 0;

  // 3rd consecutive 6 cancels the 3rd move & passes clockwise
  if (nextSixes >= 3) {
    next.currentDice = diceValue;
    next.consecutiveSixes = 0;
    next.currentTurnSeat = getNextActiveSeat(next, next.currentTurnSeat);
    next.turnPhase = 'ROLL';
    next.turnNumber += 1;
    return {
      nextState: next,
      legalMoves: [],
      tripleSixCancelled: true,
      autoPassed: true,
    };
  }

  next.currentDice = diceValue;
  next.consecutiveSixes = nextSixes;

  const legalMoves = getLegalLudoMoves(next, diceValue);
  if (legalMoves.length === 0) {
    next.currentTurnSeat = getNextActiveSeat(next, next.currentTurnSeat);
    next.turnPhase = 'ROLL';
    next.consecutiveSixes = 0;
    next.turnNumber += 1;
    return {
      nextState: next,
      legalMoves: [],
      tripleSixCancelled: false,
      autoPassed: true,
    };
  }

  next.turnPhase = 'MOVE';
  return {
    nextState: next,
    legalMoves,
    tripleSixCancelled: false,
    autoPassed: false,
  };
}

export function applyLudoMove(
  state: LudoMatchState,
  tokenIndex: number
): { nextState: LudoMatchState; move: LudoMoveRecord; gameEnded: boolean } {
  if (state.turnPhase !== 'MOVE' || state.currentDice === null) {
    throw new Error('Cannot move token outside MOVE phase');
  }

  const legal = getLegalLudoMoves(state, state.currentDice);
  const chosen = legal.find((m) => m.tokenIndex === tokenIndex);
  if (!chosen) {
    throw new Error(`Illegal Ludo move for token ${tokenIndex} with dice ${state.currentDice}`);
  }

  const next = cloneState(state);
  const activeSeat = next.seats.find((s) => s.seat === next.currentTurnSeat)!;
  const token = activeSeat.tokens[chosen.tokenIndex];
  const dice = next.currentDice!;

  token.progress = chosen.toProgress;
  activeSeat.missedTurns = 0;

  // CAPTURE_ALL on unsafe square
  const capturedList: Array<{ color: LudoColor; tokenIndex: number; trackIdx: number }> = [];
  if (chosen.targetTrackIdx !== null && !LUDO_SAFE_TRACK_INDICES.has(chosen.targetTrackIdx)) {
    for (const oppSeat of next.seats) {
      if (oppSeat.color === activeSeat.color || oppSeat.forfeited) continue;
      for (const oppTok of oppSeat.tokens) {
        const oppTrack = progressToTrackIndex(oppSeat.color, oppTok.progress);
        if (oppTrack === chosen.targetTrackIdx) {
          oppTok.progress = -1; // Sent back to base
          capturedList.push({
            color: oppSeat.color,
            tokenIndex: oppTok.tokenIndex,
            trackIdx: chosen.targetTrackIdx,
          });
        }
      }
    }
  }

  const allFinished = activeSeat.tokens.every((t) => t.progress === 56);
  const options: LudoRulesetOptions = {
    ...DEFAULT_LUDO_RULESET_OPTIONS,
    ...(state.rulesetOptions || {}),
  };
  const extraTurnGranted =
    !allFinished &&
    (dice === 6 || (options.extraTurnOnCapture && capturedList.length > 0) || chosen.wouldFinish);

  const moveRecord: LudoMoveRecord = {
    color: activeSeat.color,
    seat: activeSeat.seat,
    tokenIndex: chosen.tokenIndex,
    dice,
    fromProgress: chosen.fromProgress,
    toProgress: chosen.toProgress,
    captured: capturedList,
    reachedHome: chosen.wouldFinish,
    extraTurnGranted,
  };

  next.lastMove = moveRecord;
  next.currentDice = null;

  if (allFinished) {
    activeSeat.finishedRank = 1;
    next.turnPhase = 'FINISHED';
    next.winnerSeat = activeSeat.seat;
    next.winnerColor = activeSeat.color;
    return { nextState: next, move: moveRecord, gameEnded: true };
  }

  if (extraTurnGranted) {
    next.turnPhase = 'ROLL';
    // Keep consecutiveSixes counter only if extra turn came from rolling 6
    if (dice !== 6) {
      next.consecutiveSixes = 0;
    }
  } else {
    next.consecutiveSixes = 0;
    next.currentTurnSeat = getNextActiveSeat(next, next.currentTurnSeat);
    next.turnPhase = 'ROLL';
  }

  next.turnNumber += 1;
  return { nextState: next, move: moveRecord, gameEnded: false };
}

/**
 * Applied ONLY on move-selection timeout so the server NEVER selects a strategic move silently.
 */
export function applyLudoMissedTurn(
  state: LudoMatchState,
  maxMissedTurns: number = 3
): { nextState: LudoMatchState; forfeited: boolean; gameEnded: boolean } {
  const next = cloneState(state);
  const seat = next.seats.find((s) => s.seat === next.currentTurnSeat);
  if (!seat) {
    return { nextState: next, forfeited: false, gameEnded: false };
  }

  seat.missedTurns += 1;
  if (seat.missedTurns >= maxMissedTurns) {
    return forfeitLudoPlayer(next, seat.seat);
  }

  next.currentDice = null;
  next.consecutiveSixes = 0;
  next.turnPhase = 'ROLL';
  next.currentTurnSeat = getNextActiveSeat(next, next.currentTurnSeat);
  next.turnNumber += 1;
  return { nextState: next, forfeited: false, gameEnded: false };
}

export function forfeitLudoPlayer(
  state: LudoMatchState,
  seatNumber: number
): { nextState: LudoMatchState; forfeited: boolean; gameEnded: boolean } {
  const next = cloneState(state);
  const target = next.seats.find((s) => s.seat === seatNumber);
  if (!target || target.forfeited) {
    return { nextState: next, forfeited: false, gameEnded: next.turnPhase === 'FINISHED' };
  }

  target.forfeited = true;
  // Freeze forfeited player's unfinished tokens back to base so they cannot block/skew captures
  for (const tok of target.tokens) {
    if (tok.progress < 56) tok.progress = -1;
  }

  const remaining = next.seats.filter((s) => !s.forfeited);
  if (remaining.length === 1) {
    const survivor = remaining[0];
    survivor.finishedRank = 1;
    next.turnPhase = 'FINISHED';
    next.winnerSeat = survivor.seat;
    next.winnerColor = survivor.color;
    return { nextState: next, forfeited: true, gameEnded: true };
  }

  if (next.currentTurnSeat === seatNumber) {
    next.currentDice = null;
    next.consecutiveSixes = 0;
    next.turnPhase = 'ROLL';
    next.currentTurnSeat = getNextActiveSeat(next, seatNumber);
    next.turnNumber += 1;
  }

  return { nextState: next, forfeited: true, gameEnded: false };
}

// Canonical aliases matching UI request conventions
export const getLegalMoves = getLegalLudoMoves;
export const applyMove = applyLudoMove;
