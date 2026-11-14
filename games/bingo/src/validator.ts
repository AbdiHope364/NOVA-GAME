import { BingoCardData, BingoPattern } from '@nova/types';

export interface ValidationResult {
  valid: boolean;
  patternAchieved?: string;
  matchedCoords?: [number, number][];
}

type Coord = [number, number];

export class BingoValidator {
  /**
   * 12 Standard lines on a 5x5 card (5 rows, 5 columns, 2 diagonals)
   */
  private static readonly LINES: { name: string; coords: Coord[] }[] = [
    // 5 Horizontal rows
    { name: 'ROW_1', coords: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
    { name: 'ROW_2', coords: [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]] },
    { name: 'ROW_3', coords: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
    { name: 'ROW_4', coords: [[3, 0], [3, 1], [3, 2], [3, 3], [3, 4]] },
    { name: 'ROW_5', coords: [[4, 0], [4, 1], [4, 2], [4, 3], [4, 4]] },
    // 5 Vertical columns
    { name: 'COL_B', coords: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
    { name: 'COL_I', coords: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]] },
    { name: 'COL_N', coords: [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]] },
    { name: 'COL_G', coords: [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3]] },
    { name: 'COL_O', coords: [[0, 4], [1, 4], [2, 4], [3, 4], [4, 4]] },
    // 2 Diagonals
    { name: 'DIAG_MAIN', coords: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]] },
    { name: 'DIAG_ANTI', coords: [[0, 4], [1, 3], [2, 2], [3, 1], [4, 0]] },
  ];

  /**
   * Builds a 5x5 boolean matrix of daubed spaces.
   * In 75-ball bingo, (2,2) is the permanent FREE center space.
   */
  public static getMarkedMatrix(card: BingoCardData, drawnNumbers: number[]): boolean[][] {
    const drawnSet = new Set(drawnNumbers);
    drawnSet.add(0); // FREE space number is 0

    return card.grid.map((row, r) =>
      row.map((num, c) => (r === 2 && c === 2) || drawnSet.has(num))
    );
  }

  /**
   * Helper: checks if all given coords are marked in the matrix
   */
  private static areCoordsMarked(matrix: boolean[][], coords: Coord[]): boolean {
    return coords.every(([r, c]) => matrix[r] && matrix[r][c]);
  }

  /**
   * Returns all lines currently completed on the card
   */
  public static getCompletedLines(matrix: boolean[][]): { name: string; coords: Coord[] }[] {
    return this.LINES.filter((line) => this.areCoordsMarked(matrix, line.coords));
  }

  /**
   * Validates if the card meets the requested BingoPattern
   */
  public static validateClaim(
    card: BingoCardData,
    drawnNumbers: number[],
    pattern: BingoPattern = 'ANY_LINE'
  ): ValidationResult {
    const matrix = this.getMarkedMatrix(card, drawnNumbers);

    switch (pattern) {
      case 'ANY_LINE':
        return this.checkOneLine(matrix);

      case 'TWO_LINES':
        return this.checkTwoLines(matrix);

      case 'FOUR_CORNERS':
        return this.checkFourCorners(matrix);

      case 'TOP_MIDDLE_BOTTOM':
        return this.checkTopMiddleBottom(matrix);

      case 'CLOCK':
        return this.checkClock(matrix);

      case 'ARROW':
        return this.checkArrow(matrix);

      case 'PYRAMID':
        return this.checkPyramid(matrix);

      case 'SQUARE':
        return this.checkSquare(matrix);

      case 'LETTER_T':
        return this.checkLetterT(matrix);

      case 'T_AND_LINE':
        return this.checkTAndLine(matrix);

      case 'SQUARE_AND_LINE':
        return this.checkSquareAndLine(matrix);

      case 'FULL_HOUSE':
        return this.checkFullHouse(matrix);

      default:
        return this.checkOneLine(matrix);
    }
  }

  // --------------------------------------------------------------------------
  // PATTERN 1: 1 Line (Any Horizontal, Vertical, or Diagonal line of 5 numbers)
  // --------------------------------------------------------------------------
  public static checkOneLine(matrix: boolean[][]): ValidationResult {
    const completed = this.getCompletedLines(matrix);
    if (completed.length >= 1) {
      return {
        valid: true,
        patternAchieved: `1 Line (${completed[0].name})`,
        matchedCoords: completed[0].coords,
      };
    }
    return { valid: false };
  }

  // --------------------------------------------------------------------------
  // PATTERN 2: 2 Lines (Two distinct lines on the same card)
  // --------------------------------------------------------------------------
  public static checkTwoLines(matrix: boolean[][]): ValidationResult {
    const completed = this.getCompletedLines(matrix);
    if (completed.length >= 2) {
      const names = `${completed[0].name} & ${completed[1].name}`;
      const matchedCoords: Coord[] = [];
      const set = new Set<string>();
      for (const line of [completed[0], completed[1]]) {
        for (const [r, c] of line.coords) {
          const key = `${r},${c}`;
          if (!set.has(key)) {
            set.add(key);
            matchedCoords.push([r, c]);
          }
        }
      }
      return {
        valid: true,
        patternAchieved: `2 Lines (${names})`,
        matchedCoords,
      };
    }
    return { valid: false };
  }

  // --------------------------------------------------------------------------
  // PATTERN 3: Four Corners (4 corner spaces of the card)
  // --------------------------------------------------------------------------
  public static checkFourCorners(matrix: boolean[][]): ValidationResult {
    const corners: Coord[] = [[0, 0], [0, 4], [4, 0], [4, 4]];
    const valid = this.areCoordsMarked(matrix, corners);
    return {
      valid,
      patternAchieved: valid ? 'Four Corners' : undefined,
      matchedCoords: valid ? corners : undefined,
    };
  }

  // --------------------------------------------------------------------------
  // PATTERN 4: Top Middle Bottom Line (Layer Cake - Rows 0, 2, 4 daubed)
  // --------------------------------------------------------------------------
  public static checkTopMiddleBottom(matrix: boolean[][]): ValidationResult {
    const row0 = this.LINES[0].coords;
    const row2 = this.LINES[2].coords;
    const row4 = this.LINES[4].coords;

    const valid =
      this.areCoordsMarked(matrix, row0) &&
      this.areCoordsMarked(matrix, row2) &&
      this.areCoordsMarked(matrix, row4);

    if (valid) {
      return {
        valid: true,
        patternAchieved: 'Top Middle Bottom (Layer Cake)',
        matchedCoords: [...row0, ...row2, ...row4],
      };
    }
    return { valid: false };
  }

  // --------------------------------------------------------------------------
  // PATTERN 5: Clock (Outer circle of 12 numbers + center + 1 clock hand space)
  // Leaves 11 free spaces on the 25-space card (14 spaces daubed)
  // --------------------------------------------------------------------------
  public static checkClock(matrix: boolean[][]): ValidationResult {
    // 12 outer circle border coordinates (excluding corners)
    const circleCoords: Coord[] = [
      [0, 1], [0, 2], [0, 3],
      [1, 0],                 [1, 4],
      [2, 0],                 [2, 4],
      [3, 0],                 [3, 4],
      [4, 1], [4, 2], [4, 3],
    ];

    if (!this.areCoordsMarked(matrix, circleCoords)) {
      return { valid: false };
    }

    // Center pivot (2,2)
    if (!matrix[2][2]) return { valid: false };

    // Clock hand: at least one space pointing from center to circle
    const possibleHands: { name: string; coord: Coord }[] = [
      { name: '12 o\'clock', coord: [1, 2] },
      { name: '1:30 o\'clock', coord: [1, 3] },
      { name: '3 o\'clock', coord: [2, 3] },
      { name: '4:30 o\'clock', coord: [3, 3] },
      { name: '6 o\'clock', coord: [3, 2] },
      { name: '7:30 o\'clock', coord: [3, 1] },
      { name: '9 o\'clock', coord: [2, 1] },
      { name: '10:30 o\'clock', coord: [1, 1] },
    ];

    for (const hand of possibleHands) {
      const [hr, hc] = hand.coord;
      if (matrix[hr][hc]) {
        return {
          valid: true,
          patternAchieved: `Clock (${hand.name})`,
          matchedCoords: [...circleCoords, [2, 2], hand.coord],
        };
      }
    }

    return { valid: false };
  }

  // --------------------------------------------------------------------------
  // PATTERN 6: Arrow (9 spaces pointing to any of the 4 corners)
  // --------------------------------------------------------------------------
  public static checkArrow(matrix: boolean[][]): ValidationResult {
    const arrows: { name: string; coords: Coord[] }[] = [
      {
        name: 'Top-Left Arrow',
        coords: [
          // Diagonal shaft
          [0, 0], [1, 1], [2, 2], [3, 3], [4, 4],
          // Arrowhead barbs
          [0, 1], [0, 2], [1, 0], [2, 0],
        ],
      },
      {
        name: 'Top-Right Arrow',
        coords: [
          // Diagonal shaft
          [0, 4], [1, 3], [2, 2], [3, 1], [4, 0],
          // Arrowhead barbs
          [0, 2], [0, 3], [1, 4], [2, 4],
        ],
      },
      {
        name: 'Bottom-Right Arrow',
        coords: [
          // Diagonal shaft
          [0, 0], [1, 1], [2, 2], [3, 3], [4, 4],
          // Arrowhead barbs
          [4, 2], [4, 3], [2, 4], [3, 4],
        ],
      },
      {
        name: 'Bottom-Left Arrow',
        coords: [
          // Diagonal shaft
          [0, 4], [1, 3], [2, 2], [3, 1], [4, 0],
          // Arrowhead barbs
          [4, 1], [4, 2], [2, 0], [3, 0],
        ],
      },
    ];

    for (const arrow of arrows) {
      if (this.areCoordsMarked(matrix, arrow.coords)) {
        return {
          valid: true,
          patternAchieved: `Arrow (${arrow.name})`,
          matchedCoords: arrow.coords,
        };
      }
    }

    return { valid: false };
  }

  // --------------------------------------------------------------------------
  // PATTERN 7: Pyramid (9 spaces: 5 at horizontal base, 3 in middle, 1 at apex)
  // --------------------------------------------------------------------------
  public static checkPyramid(matrix: boolean[][]): ValidationResult {
    // Upright horizontal pyramids (1 apex, 3 mid, 5 base)
    const pyramids: { name: string; coords: Coord[] }[] = [
      // Grounded at bottom row 4 (Standard)
      {
        name: 'Pyramid (Row 4 Base)',
        coords: [
          [2, 2],                         // Apex (Row 2)
          [3, 1], [3, 2], [3, 3],         // Middle (Row 3)
          [4, 0], [4, 1], [4, 2], [4, 3], [4, 4], // Base (Row 4)
        ],
      },
      // Centered at row 3 base
      {
        name: 'Pyramid (Row 3 Base)',
        coords: [
          [1, 2],                         // Apex (Row 1)
          [2, 1], [2, 2], [2, 3],         // Middle (Row 2)
          [3, 0], [3, 1], [3, 2], [3, 3], [3, 4], // Base (Row 3)
        ],
      },
      // Upper pyramid at row 2 base
      {
        name: 'Pyramid (Row 2 Base)',
        coords: [
          [0, 2],                         // Apex (Row 0)
          [1, 1], [1, 2], [1, 3],         // Middle (Row 1)
          [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], // Base (Row 2)
        ],
      },
    ];

    for (const pyr of pyramids) {
      if (this.areCoordsMarked(matrix, pyr.coords)) {
        return {
          valid: true,
          patternAchieved: pyr.name,
          matchedCoords: pyr.coords,
        };
      }
    }

    return { valid: false };
  }

  // --------------------------------------------------------------------------
  // PATTERN 8: Square (4 spaces forming a 2x2 square)
  // --------------------------------------------------------------------------
  public static getAllSquares(): Coord[][] {
    const squares: Coord[][] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        squares.push([
          [r, c],
          [r, c + 1],
          [r + 1, c],
          [r + 1, c + 1],
        ]);
      }
    }
    return squares;
  }

  public static checkSquare(matrix: boolean[][]): ValidationResult {
    const squares = this.getAllSquares();
    for (const sq of squares) {
      if (this.areCoordsMarked(matrix, sq)) {
        return {
          valid: true,
          patternAchieved: `Square (${sq[0][0] + 1},${sq[0][1] + 1})`,
          matchedCoords: sq,
        };
      }
    }
    return { valid: false };
  }

  // --------------------------------------------------------------------------
  // PATTERN 9: Letter T (5 spaces: 3-wide horizontal top bar + 2-tall stem)
  // --------------------------------------------------------------------------
  public static getAllLetterTs(): { name: string; coords: Coord[] }[] {
    const tPatterns: { name: string; coords: Coord[] }[] = [];

    // Upright T: bar of 3 on row r (cols c, c+1, c+2), stem going down at c+1
    for (let r = 0; r <= 2; r++) {
      for (let c = 0; c <= 2; c++) {
        tPatterns.push({
          name: `T at Row ${r + 1}, Col ${c + 2}`,
          coords: [
            // Top horizontal bar (3 spaces)
            [r, c], [r, c + 1], [r, c + 2],
            // Vertical stem down (2 spaces)
            [r + 1, c + 1], [r + 2, c + 1],
          ],
        });
      }
    }

    return tPatterns;
  }

  public static checkLetterT(matrix: boolean[][]): ValidationResult {
    const tPatterns = this.getAllLetterTs();
    for (const t of tPatterns) {
      if (this.areCoordsMarked(matrix, t.coords)) {
        return {
          valid: true,
          patternAchieved: `Letter T (${t.name})`,
          matchedCoords: t.coords,
        };
      }
    }
    return { valid: false };
  }

  // --------------------------------------------------------------------------
  // PATTERN 10: T & Line (5 spaces of T and an independent line of 5 spaces)
  // Two patterns must be independent (disjoint with 0 shared coordinates)
  // --------------------------------------------------------------------------
  public static checkTAndLine(matrix: boolean[][]): ValidationResult {
    const tPatterns = this.getAllLetterTs();
    const completedLines = this.getCompletedLines(matrix);

    for (const t of tPatterns) {
      if (!this.areCoordsMarked(matrix, t.coords)) continue;

      const tSet = new Set(t.coords.map(([r, c]) => `${r},${c}`));

      for (const line of completedLines) {
        // Check for independence (no shared coords)
        const sharesCoord = line.coords.some(([r, c]) => tSet.has(`${r},${c}`));
        if (!sharesCoord) {
          return {
            valid: true,
            patternAchieved: `T & Line (${t.name} & ${line.name})`,
            matchedCoords: [...t.coords, ...line.coords],
          };
        }
      }
    }

    return { valid: false };
  }

  // --------------------------------------------------------------------------
  // PATTERN 11: Square & Line (4 spaces of Square and an independent 5-space Line)
  // Also supports Square & T as described in prompt text for full robustness.
  // --------------------------------------------------------------------------
  public static checkSquareAndLine(matrix: boolean[][]): ValidationResult {
    const squares = this.getAllSquares();
    const completedLines = this.getCompletedLines(matrix);
    const tPatterns = this.getAllLetterTs();

    // 1. Check Square & Line (disjoint 4 + 5 = 9 spaces)
    for (const sq of squares) {
      if (!this.areCoordsMarked(matrix, sq)) continue;

      const sqSet = new Set(sq.map(([r, c]) => `${r},${c}`));

      for (const line of completedLines) {
        const sharesCoord = line.coords.some(([r, c]) => sqSet.has(`${r},${c}`));
        if (!sharesCoord) {
          return {
            valid: true,
            patternAchieved: `Square & Line (${line.name})`,
            matchedCoords: [...sq, ...line.coords],
          };
        }
      }

      // 2. Also check Square & T (disjoint 4 + 5 = 9 spaces)
      for (const t of tPatterns) {
        if (!this.areCoordsMarked(matrix, t.coords)) continue;
        const sharesCoord = t.coords.some(([r, c]) => sqSet.has(`${r},${c}`));
        if (!sharesCoord) {
          return {
            valid: true,
            patternAchieved: `Square & T (${t.name})`,
            matchedCoords: [...sq, ...t.coords],
          };
        }
      }
    }

    return { valid: false };
  }

  // --------------------------------------------------------------------------
  // PATTERN 12: Full House (All 25 spaces on the card daubed)
  // --------------------------------------------------------------------------
  public static checkFullHouse(matrix: boolean[][]): ValidationResult {
    const valid = matrix.every((row) => row.every((marked) => marked));
    const allCoords: Coord[] = [];
    if (valid) {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          allCoords.push([r, c]);
        }
      }
    }
    return {
      valid,
      patternAchieved: valid ? 'Full House (Blackout)' : undefined,
      matchedCoords: valid ? allCoords : undefined,
    };
  }
}
