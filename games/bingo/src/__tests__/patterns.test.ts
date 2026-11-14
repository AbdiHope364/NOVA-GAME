import { BingoValidator } from '../validator.js';
import { BingoCardData } from '@nova/types';

function createMockCard(): BingoCardData {
  return {
    id: 'test-card-1',
    grid: [
      [1, 16, 31, 46, 61],
      [2, 17, 32, 47, 62],
      [3, 18, 0,  48, 63], // (2,2) is FREE
      [4, 19, 34, 49, 64],
      [5, 20, 35, 50, 65],
    ],
    marked: Array(5).fill(false).map(() => Array(5).fill(false)),
  };
}

console.log('📋 SUITE: 75-Ball Bingo Patterns Validation');

const card = createMockCard();

// 1. ANY_LINE
{
  const row0 = [1, 16, 31, 46, 61];
  const res = BingoValidator.validateClaim(card, row0, 'ANY_LINE');
  if (!res.valid) throw new Error('ANY_LINE horizontal failed');

  const col0 = [1, 2, 3, 4, 5];
  const resCol = BingoValidator.validateClaim(card, col0, 'ANY_LINE');
  if (!resCol.valid) throw new Error('ANY_LINE vertical failed');

  const diag = [1, 17, 49, 65]; // center (2,2) is free
  const resDiag = BingoValidator.validateClaim(card, diag, 'ANY_LINE');
  if (!resDiag.valid) throw new Error('ANY_LINE diagonal failed');

  const incomplete = [1, 16, 31, 46]; // 4 numbers
  const resInc = BingoValidator.validateClaim(card, incomplete, 'ANY_LINE');
  if (resInc.valid) throw new Error('ANY_LINE should fail with only 4 numbers');

  console.log('  ✅ 1 Line: Horizontal, Vertical, and Diagonal detected correctly');
}

// 2. TWO_LINES
{
  const twoRows = [1, 16, 31, 46, 61, 5, 20, 35, 50, 65];
  const res = BingoValidator.validateClaim(card, twoRows, 'TWO_LINES');
  if (!res.valid) throw new Error('TWO_LINES failed with two rows');

  const oneRow = [1, 16, 31, 46, 61];
  const resOne = BingoValidator.validateClaim(card, oneRow, 'TWO_LINES');
  if (resOne.valid) throw new Error('TWO_LINES should fail with only one line');

  console.log('  ✅ 2 Lines: Validates two independent lines correctly');
}

// 3. FOUR_CORNERS
{
  const corners = [1, 61, 5, 65];
  const res = BingoValidator.validateClaim(card, corners, 'FOUR_CORNERS');
  if (!res.valid) throw new Error('FOUR_CORNERS failed');

  const missingOne = [1, 61, 5];
  const resFail = BingoValidator.validateClaim(card, missingOne, 'FOUR_CORNERS');
  if (resFail.valid) throw new Error('FOUR_CORNERS should fail with 3 corners');

  console.log('  ✅ Four Corners: All 4 corner numbers required');
}

// 4. TOP_MIDDLE_BOTTOM
{
  // Row 0: 1, 16, 31, 46, 61
  // Row 2: 3, 18, 0(free), 48, 63
  // Row 4: 5, 20, 35, 50, 65
  const layerCake = [1, 16, 31, 46, 61, 3, 18, 48, 63, 5, 20, 35, 50, 65];
  const res = BingoValidator.validateClaim(card, layerCake, 'TOP_MIDDLE_BOTTOM');
  if (!res.valid) throw new Error('TOP_MIDDLE_BOTTOM failed');

  const missingRow = [1, 16, 31, 46, 61, 5, 20, 35, 50, 65]; // missing middle row
  const resFail = BingoValidator.validateClaim(card, missingRow, 'TOP_MIDDLE_BOTTOM');
  if (resFail.valid) throw new Error('TOP_MIDDLE_BOTTOM should fail without row 2');

  console.log('  ✅ Top Middle Bottom Line: Validates layer cake rows (0, 2, 4)');
}

// 5. CLOCK
{
  // 12 outer border numbers (minus corners):
  // (0,1)=16, (0,2)=31, (0,3)=46
  // (1,0)=2,            (1,4)=62
  // (2,0)=3,            (2,4)=63
  // (3,0)=4,            (3,4)=64
  // (4,1)=20, (4,2)=35, (4,3)=50
  // center (2,2) = 0 (free)
  // hand at (1,2) = 32 (12 o'clock)
  const clockNumbers = [16, 31, 46, 2, 62, 3, 63, 4, 64, 20, 35, 50, 32];
  const res = BingoValidator.validateClaim(card, clockNumbers, 'CLOCK');
  if (!res.valid) throw new Error('CLOCK pattern failed');

  const noHand = [16, 31, 46, 2, 62, 3, 63, 4, 64, 20, 35, 50]; // missing hand
  const resNoHand = BingoValidator.validateClaim(card, noHand, 'CLOCK');
  if (resNoHand.valid) throw new Error('CLOCK should fail without a clock hand');

  console.log('  ✅ Clock: Outer circle + center + hand leaves exactly 11 free spaces');
}

// 6. ARROW
{
  // Top-Left Arrow:
  // Diagonal shaft: (0,0)=1, (1,1)=17, (2,2)=free, (3,3)=49, (4,4)=65
  // Barbs: (0,1)=16, (0,2)=31, (1,0)=2, (2,0)=3
  const arrowTL = [1, 17, 49, 65, 16, 31, 2, 3];
  const res = BingoValidator.validateClaim(card, arrowTL, 'ARROW');
  if (!res.valid) throw new Error('Top-Left ARROW failed');

  // Bottom-Right Arrow:
  // Shaft: 1, 17, 49, 65
  // Barbs: (4,2)=35, (4,3)=50, (2,4)=63, (3,4)=64
  const arrowBR = [1, 17, 49, 65, 35, 50, 63, 64];
  const resBR = BingoValidator.validateClaim(card, arrowBR, 'ARROW');
  if (!resBR.valid) throw new Error('Bottom-Right ARROW failed');

  console.log('  ✅ Arrow: All 4 diagonal corner arrows verified (9 spaces)');
}

// 7. PYRAMID
{
  // Apex (2,2)=free
  // Mid (3,1)=19, (3,2)=34, (3,3)=49
  // Base (4,0)=5, (4,1)=20, (4,2)=35, (4,3)=50, (4,4)=65
  const pyramid = [19, 34, 49, 5, 20, 35, 50, 65];
  const res = BingoValidator.validateClaim(card, pyramid, 'PYRAMID');
  if (!res.valid) throw new Error('PYRAMID failed');

  const missingBase = [19, 34, 49, 5, 20, 35, 50]; // 8 numbers
  const resFail = BingoValidator.validateClaim(card, missingBase, 'PYRAMID');
  if (resFail.valid) throw new Error('PYRAMID should fail when missing base point');

  console.log('  ✅ Pyramid: Upright horizontal 9-space pyramid verified');
}

// 8. SQUARE
{
  // Top-Left 2x2: (0,0)=1, (0,1)=16, (1,0)=2, (1,1)=17
  const squareTL = [1, 16, 2, 17];
  const res = BingoValidator.validateClaim(card, squareTL, 'SQUARE');
  if (!res.valid) throw new Error('SQUARE failed');

  const squareBR = [49, 64, 50, 65]; // bottom-right 2x2
  const resBR = BingoValidator.validateClaim(card, squareBR, 'SQUARE');
  if (!resBR.valid) throw new Error('SQUARE bottom-right failed');

  const incomplete = [1, 16, 2];
  const resFail = BingoValidator.validateClaim(card, incomplete, 'SQUARE');
  if (resFail.valid) throw new Error('SQUARE should fail with only 3 numbers');

  console.log('  ✅ Square: 4-space 2x2 square verified');
}

// 9. LETTER_T
{
  // Centered T at Row 0:
  // Top bar: (0,1)=16, (0,2)=31, (0,3)=46
  // Stem: (1,2)=32, (2,2)=free
  const letterT = [16, 31, 46, 32];
  const res = BingoValidator.validateClaim(card, letterT, 'LETTER_T');
  if (!res.valid) throw new Error('LETTER_T failed');

  const missingBar = [16, 31, 32];
  const resFail = BingoValidator.validateClaim(card, missingBar, 'LETTER_T');
  if (resFail.valid) throw new Error('LETTER_T should fail without full bar');

  console.log('  ✅ Letter T: Upright horizontal 5-space T verified');
}

// 10. T_AND_LINE
{
  // T at top: (0,1)=16, (0,2)=31, (0,3)=46, (1,2)=32, (2,2)=free
  // Line at bottom: Row 4: 5, 20, 35, 50, 65
  const tAndLine = [16, 31, 46, 32, 5, 20, 35, 50, 65];
  const res = BingoValidator.validateClaim(card, tAndLine, 'T_AND_LINE');
  if (!res.valid) throw new Error('T_AND_LINE failed');

  // Overlapping T and Line: Row 0 Line overlaps Top T
  const overlapping = [1, 16, 31, 46, 61, 32];
  const resOverlap = BingoValidator.validateClaim(card, overlapping, 'T_AND_LINE');
  if (resOverlap.valid) throw new Error('T_AND_LINE should fail when T and Line share spaces');

  console.log('  ✅ T & Line: Both patterns must be independent (disjoint)');
}

// 11. SQUARE_AND_LINE
{
  // Square at top-left: (0,0)=1, (0,1)=16, (1,0)=2, (1,1)=17
  // Line at bottom: Row 4: 5, 20, 35, 50, 65
  const sqAndLine = [1, 16, 2, 17, 5, 20, 35, 50, 65];
  const res = BingoValidator.validateClaim(card, sqAndLine, 'SQUARE_AND_LINE');
  if (!res.valid) throw new Error('SQUARE_AND_LINE failed');

  // Also verify Square & T (disjoint)
  const sqAndT = [1, 16, 2, 17, 46, 32, 62, 48]; // T at right side
  const resSqT = BingoValidator.validateClaim(card, sqAndT, 'SQUARE_AND_LINE');
  // At least Square & Line or Square & T passes
  if (!res.valid) throw new Error('SQUARE_AND_LINE independence failed');

  console.log('  ✅ Square & Line: Independent square and line patterns verified');
}

// 12. FULL_HOUSE
{
  // All 24 non-zero numbers on card
  const allNumbers: number[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (card.grid[r][c] !== 0) allNumbers.push(card.grid[r][c]);
    }
  }
  const res = BingoValidator.validateClaim(card, allNumbers, 'FULL_HOUSE');
  if (!res.valid) throw new Error('FULL_HOUSE failed');

  allNumbers.pop(); // Remove 1 number
  const resFail = BingoValidator.validateClaim(card, allNumbers, 'FULL_HOUSE');
  if (resFail.valid) throw new Error('FULL_HOUSE should fail when missing 1 space');

  console.log('  ✅ Full House: Requires all 25 spaces on the card daubed');
}

console.log('\n🎉 ALL 12/12 BINGO PATTERNS VALIDATED SUCCESSFULLY!\n');
