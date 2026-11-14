import { ELO_K_FACTOR } from './constants.js';

export interface RatingDelta {
  playerXNewRating: number;
  playerONewRating: number;
  deltaX: number;
  deltaO: number;
}

/**
 * Standard Elo Rating calculation.
 * outcome: 1 if Player X wins, 0 if Player O wins, 0.5 if Draw.
 */
export function calculateEloDelta(
  ratingX: number,
  ratingO: number,
  outcome: 1 | 0 | 0.5,
  kFactor: number = ELO_K_FACTOR
): RatingDelta {
  const expectedX = 1 / (1 + Math.pow(10, (ratingO - ratingX) / 400));
  const expectedO = 1 - expectedX;

  const actualX = outcome;
  const actualO = 1 - outcome;

  const deltaX = Math.round(kFactor * (actualX - expectedX));
  const deltaO = Math.round(kFactor * (actualO - expectedO));

  return {
    playerXNewRating: Math.max(100, ratingX + deltaX),
    playerONewRating: Math.max(100, ratingO + deltaO),
    deltaX,
    deltaO,
  };
}
