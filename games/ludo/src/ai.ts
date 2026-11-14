import { LUDO_SAFE_TRACK_INDICES, progressToTrackIndex } from './board.js';
import { getLegalLudoMoves } from './engine.js';
import { LegalLudoMove, LudoDifficulty, LudoMatchState } from './types.js';

function isSquareThreatened(
  state: LudoMatchState,
  myColor: string,
  trackIdx: number | null
): boolean {
  if (trackIdx === null || LUDO_SAFE_TRACK_INDICES.has(trackIdx)) return false;
  for (const opp of state.seats) {
    if (opp.color === myColor || opp.forfeited) continue;
    for (const tok of opp.tokens) {
      const oppTrack = progressToTrackIndex(opp.color, tok.progress);
      if (oppTrack === null) continue;
      const dist = (trackIdx - oppTrack + 52) % 52;
      if (dist >= 1 && dist <= 6) {
        // Check that opponent doesn't enter home before reaching this trackIdx
        if (tok.progress + dist <= 50) return true;
      }
    }
  }
  return false;
}

/**
 * Chooses a legal move strictly following the approved priority hierarchy:
 * 1. Finish a token (exact home goal)
 * 2. Capture opponent(s)
 * 3. Leave base when rolling 6
 * 4. Escape immediate opponent threat
 * 5. Advance token furthest toward home
 */
export function chooseLudoAiMove(
  state: LudoMatchState,
  difficulty: LudoDifficulty = 'MEDIUM'
): LegalLudoMove | null {
  if (state.turnPhase !== 'MOVE' || state.currentDice === null) return null;
  const legal = getLegalLudoMoves(state, state.currentDice);
  if (legal.length === 0) return null;

  if (difficulty === 'EASY') {
    return legal[Math.floor(Math.random() * legal.length)];
  }

  const activeSeat = state.seats.find((s) => s.seat === state.currentTurnSeat);
  if (!activeSeat) return legal[0];

  const scored = legal.map((mv) => {
    let score = 0;

    // 1. Finish token
    if (mv.wouldFinish) score += 10_000;

    // 2. Capture opponent(s)
    if (mv.wouldCapture.length > 0) score += 6_000 + mv.wouldCapture.length * 500;

    // 3. Leave base
    if (mv.wouldLeaveBase) score += 3_500;

    // 4. Advance furthest token / enter private home column safely
    if (mv.toProgress >= 51 && mv.fromProgress <= 50) score += 2_200;
    score += mv.toProgress * 18;

    // 5. Threat assessment for HARD difficulty
    if (difficulty === 'HARD') {
      const curTrack = progressToTrackIndex(activeSeat.color, mv.fromProgress);
      const wasInDanger = isSquareThreatened(state, activeSeat.color, curTrack);
      const targetSafe =
        mv.targetTrackIdx === null || LUDO_SAFE_TRACK_INDICES.has(mv.targetTrackIdx);
      const willBeInDanger = isSquareThreatened(state, activeSeat.color, mv.targetTrackIdx);

      if (wasInDanger && targetSafe) score += 1_800;
      else if (wasInDanger && !willBeInDanger) score += 1_100;

      if (targetSafe) score += 600;
      if (willBeInDanger && mv.wouldCapture.length === 0) score -= 950;
    }

    return { mv, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].mv;
}
