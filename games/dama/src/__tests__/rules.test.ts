import assert from 'node:assert';
import {
  applyMove,
  boardFromAscii,
  createInitialState,
  getLegalMoves,
  IllegalMoveError,
  isDarkSquare,
  type Color,
  type GameState,
  type Pos,
} from '../rules.js';

function expect(actual: any) {
  return {
    toBe(expected: any) {
      assert.strictEqual(actual, expected);
    },
    toEqual(expected: any) {
      assert.deepStrictEqual(actual, expected);
    },
    toHaveLength(expected: number) {
      assert.strictEqual(actual.length, expected);
    },
    toThrow(expectedError?: any) {
      assert.throws(actual, expectedError);
    },
  };
}

let testCount = 0;
let passedCount = 0;

function describe(suiteName: string, fn: () => void) {
  console.log(`\n📋 SUITE: ${suiteName}`);
  fn();
}

function it(testName: string, fn: () => void) {
  testCount++;
  try {
    fn();
    passedCount++;
    console.log(`  ✅ ${testName}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${testName}`);
    console.error(err);
    process.exit(1);
  }
}

function S(rows: string[], turn: Color = 'W', quietPlies = 0): GameState {
  return { board: boardFromAscii(rows), turn, quietPlies };
}

const P = (r: number, c: number): Pos => [r, c];

describe('Dama rules (12 pieces, dark squares, diagonal play)', () => {
  it('sets up 12 pieces each, all on dark squares, with 7 opening moves', () => {
    const s = createInitialState();
    const pieces = (color: Color) => {
      const found: Pos[] = [];
      s.board.forEach((row, r) => row.forEach((p, c) => p?.color === color && found.push([r, c])));
      return found;
    };
    expect(pieces('W')).toHaveLength(12);
    expect(pieces('B')).toHaveLength(12);
    expect([...pieces('W'), ...pieces('B')].every(([r, c]) => isDarkSquare(r, c))).toBe(true);
    expect(getLegalMoves(s)).toHaveLength(7);
    expect(getLegalMoves(createInitialState('W'))).toHaveLength(7);
  });

  it('men move one square diagonally forward only', () => {
    const s = S([
      '.b......',
      '........',
      '........',
      '........',
      '...w....',
      '........',
      '........',
      '........',
    ]);
    const dests = getLegalMoves(s).map((m) => m.path[0].join(','));
    expect(dests.sort()).toEqual(['3,2', '3,4']);
  });

  it('capture is compulsory (a quiet move is not allowed when a capture exists)', () => {
    const s = S([
      '........',
      '........',
      '........',
      '..b.....',
      '...w....',
      '........',
      '........',
      '........',
    ]);
    const moves = getLegalMoves(s);
    expect(moves).toHaveLength(1);
    expect(moves[0].path).toEqual([P(2, 1)]);
    expect(moves[0].captured).toEqual([P(3, 2)]);
  });

  it('men cannot capture backward by default, but can when the option is on', () => {
    const rows = [
      '........',
      '........',
      '........',
      '........',
      '...w....',
      '....b...',
      '........',
      '........',
    ];
    expect(getLegalMoves(S(rows)).every((m) => m.captured.length === 0)).toBe(true);

    const withBackward = getLegalMoves(S(rows), { menCaptureBackward: true });
    expect(withBackward).toHaveLength(1);
    expect(withBackward[0].captured).toEqual([P(5, 4)]);
  });

  it('completes multi-jumps', () => {
    const s = S([
      '........',
      '........',
      '........',
      '....b...',
      '........',
      '..b.....',
      '.w......',
      '........',
    ]);
    const moves = getLegalMoves(s);
    expect(moves).toHaveLength(1);
    expect(moves[0].path).toEqual([P(4, 3), P(2, 5)]);
    expect(moves[0].captured).toEqual([P(5, 2), P(3, 4)]);
  });

  it('majority rule: only the longest capture is legal when enabled', () => {
    const rows = [
      '........',
      '........',
      '........',
      '....b...',
      '.b......',
      'w.b.....',
      '.w......',
      '........',
    ];
    const strict = getLegalMoves(S(rows), { requireMaxCapture: true });
    expect(strict).toHaveLength(1);
    expect(strict[0].captured).toHaveLength(2);

    const loose = getLegalMoves(S(rows), { requireMaxCapture: false });
    expect(loose).toHaveLength(2);
  });

  it('a man reaching the far row becomes a king', () => {
    const s = S([
      '........',
      '..w.....',
      '........',
      '........',
      '........',
      '........',
      '........',
      'B.......',
    ]);
    const { state } = applyMove(s, { from: P(1, 2), path: [P(0, 3)] });
    expect(state.board[0][3]).toEqual({ color: 'W', king: true });
    expect(state.turn).toBe('B');
  });

  it('kings move one square in all four diagonals, or slide when flying kings are on', () => {
    const rows = [
      '.b......',
      '........',
      '........',
      '........',
      '...W....',
      '........',
      '........',
      '........',
    ];
    expect(getLegalMoves(S(rows))).toHaveLength(4);
    expect(getLegalMoves(S(rows), { flyingKings: true })).toHaveLength(13);
  });

  it('flying kings may land on any empty square beyond the captured piece', () => {
    const rows = [
      '........',
      '........',
      '........',
      '....b...',
      '........',
      '........',
      '.W......',
      '........',
    ];
    const flying = getLegalMoves(S(rows), { flyingKings: true });
    expect(flying).toHaveLength(3);
    expect(flying.every((m) => m.captured.length === 1 && m.captured[0].join(',') === '3,4')).toBe(true);

    // Without flying kings the same king has no capture, only 4 quiet steps.
    const plain = getLegalMoves(S(rows));
    expect(plain).toHaveLength(4);
    expect(plain.every((m) => m.captured.length === 0)).toBe(true);
  });

  it('rejects moves that are not in the legal list', () => {
    const s = createInitialState('W');
    expect(() => applyMove(s, { from: P(3, 3), path: [P(4, 3)] })).toThrow(IllegalMoveError);
    expect(() => applyMove(s, { from: P(5, 0), path: [P(6, 1)] })).toThrow(IllegalMoveError);
    expect(() => applyMove(s, { from: P(5, 0), path: [P(4, 0)] })).toThrow(IllegalMoveError);
  });

  it('wins when the opponent has no pieces left', () => {
    const s = S([
      '........',
      '........',
      '........',
      '..b.....',
      '...w....',
      '........',
      '........',
      '........',
    ]);
    const { result } = applyMove(s, { from: P(4, 3), path: [P(2, 1)] });
    expect(result).toEqual({ status: 'win', winner: 'W', reason: 'no-pieces' });
  });

  it('is drawn after too many quiet plies', () => {
    const s = S(
      [
        '.......B',
        '........',
        '........',
        '........',
        '........',
        '........',
        '........',
        'W.......',
      ],
      'W',
      79,
    );
    const { result } = applyMove(s, { from: P(7, 0), path: [P(6, 1)] });
    expect(result).toEqual({ status: 'draw', reason: 'quiet-plies' });
  });
});

console.log(`\n🎉 ALL ${passedCount}/${testCount} DAMA TESTS PASSED SUCCESSFULLY!\n`);
