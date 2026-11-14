export interface EloCalculationResult {
  whiteAfter: number;
  blackAfter: number;
  whiteDelta: number;
  blackDelta: number;
}

/**
 * Computes standard FIDE/Lichess-inspired K-factor ELO updates.
 * Score for White: 1 = White win, 0.5 = Draw, 0 = Black win.
 */
export function calculateChessElo(
  whiteElo: number,
  blackElo: number,
  whiteScore: 1 | 0.5 | 0,
  whiteGamesPlayed: number = 0,
  blackGamesPlayed: number = 0
): EloCalculationResult {
  const expectedWhite = 1 / (1 + Math.pow(10, (blackElo - whiteElo) / 400));
  const expectedBlack = 1 - expectedWhite;

  const kWhite = whiteGamesPlayed < 30 || whiteElo < 2100 ? 32 : 24;
  const kBlack = blackGamesPlayed < 30 || blackElo < 2100 ? 32 : 24;

  const rawWhiteDelta = Math.round(kWhite * (whiteScore - expectedWhite));
  const rawBlackDelta = Math.round(kBlack * ((1 - whiteScore) - expectedBlack));

  const whiteAfter = Math.max(400, whiteElo + rawWhiteDelta);
  const blackAfter = Math.max(400, blackElo + rawBlackDelta);

  return {
    whiteAfter,
    blackAfter,
    whiteDelta: whiteAfter - whiteElo,
    blackDelta: blackAfter - blackElo,
  };
}
