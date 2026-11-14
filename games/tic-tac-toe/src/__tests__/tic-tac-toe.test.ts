import test from 'node:test';
import assert from 'node:assert';
import {
  createInitialBoard,
  validateMove,
  applyMove,
  checkWinner,
  getAvailableMoves,
  computeAiMove,
  calculateEloDelta,
  TttBoard,
} from '../index.js';

test('Tic-Tac-Toe Engine - Initial Board', () => {
  const board = createInitialBoard();
  assert.strictEqual(board.length, 9);
  assert.ok(board.every((cell) => cell === null));
  assert.strictEqual(getAvailableMoves(board).length, 9);
});

test('Tic-Tac-Toe Engine - Move Validation', () => {
  const board = createInitialBoard();

  // Legal move
  const v1 = validateMove(board, 'X', 0, 'X');
  assert.strictEqual(v1.valid, true);

  // Illegal: Not X's turn
  const v2 = validateMove(board, 'X', 0, 'O');
  assert.strictEqual(v2.valid, false);
  assert.match(v2.reason || '', /Not X's turn/);

  // Illegal: Out of bounds
  const v3 = validateMove(board, 'X', 9, 'X');
  assert.strictEqual(v3.valid, false);

  // Illegal: Cell already occupied
  board[0] = 'X';
  const v4 = validateMove(board, 'O', 0, 'O');
  assert.strictEqual(v4.valid, false);
  assert.match(v4.reason || '', /already occupied/);
});

test('Tic-Tac-Toe Engine - Horizontal Win Detection', () => {
  let board = createInitialBoard();

  // X plays row 0: 0, 1, 2
  // O plays row 1: 3, 4
  const m1 = applyMove(board, 'X', 0, 'X');
  board = m1.board;
  const m2 = applyMove(board, 'O', 3, 'O');
  board = m2.board;
  const m3 = applyMove(board, 'X', 1, 'X');
  board = m3.board;
  const m4 = applyMove(board, 'O', 4, 'O');
  board = m4.board;
  const m5 = applyMove(board, 'X', 2, 'X');
  board = m5.board;

  assert.strictEqual(m5.valid, true);
  assert.strictEqual(m5.winner, 'X');
  assert.deepStrictEqual(m5.winningLine, [0, 1, 2]);
  assert.strictEqual(m5.isGameOver, true);
  assert.strictEqual(m5.isDraw, false);
});

test('Tic-Tac-Toe Engine - Vertical Win Detection', () => {
  const board: TttBoard = [
    'O', 'X', null,
    'O', 'X', null,
    'O', null, null,
  ];
  const { winner, winningLine } = checkWinner(board);
  assert.strictEqual(winner, 'O');
  assert.deepStrictEqual(winningLine, [0, 3, 6]);
});

test('Tic-Tac-Toe Engine - Diagonal Win Detection', () => {
  const board1: TttBoard = [
    'X', 'O', null,
    'O', 'X', null,
    null, 'O', 'X',
  ];
  const r1 = checkWinner(board1);
  assert.strictEqual(r1.winner, 'X');
  assert.deepStrictEqual(r1.winningLine, [0, 4, 8]);

  const board2: TttBoard = [
    null, 'X', 'O',
    null, 'O', 'X',
    'O', null, 'X',
  ];
  const r2 = checkWinner(board2);
  assert.strictEqual(r2.winner, 'O');
  assert.deepStrictEqual(r2.winningLine, [2, 4, 6]);
});

test('Tic-Tac-Toe Engine - Draw Detection', () => {
  const board: TttBoard = [
    'X', 'O', 'X',
    'X', 'O', 'O',
    'O', 'X', 'X',
  ];
  const { winner, winningLine } = checkWinner(board);
  assert.strictEqual(winner, 'DRAW');
  assert.strictEqual(winningLine, null);
});

test('Tic-Tac-Toe AI - Hard Mode (Minimax) Blocks Immediate Loss', () => {
  // X is about to win at index 2
  const board: TttBoard = [
    'X', 'X', null,
    'O', null, null,
    null, null, null,
  ];
  const aiMove = computeAiMove(board, 'O', 'HARD');
  assert.strictEqual(aiMove, 2, 'AI must block X at index 2');
});

test('Tic-Tac-Toe AI - Hard Mode (Minimax) Takes Immediate Win', () => {
  // O can win at index 8
  const board: TttBoard = [
    'O', 'O', null,
    'X', 'X', null,
    null, null, null,
  ];
  const aiMove = computeAiMove(board, 'O', 'HARD');
  assert.strictEqual(aiMove, 2, 'AI must take immediate winning cell 2');
});

test('Tic-Tac-Toe AI - Hard Mode Self-Play Always Draws or Wins (Never Loses)', () => {
  // Play 10 games of Hard AI vs Hard AI
  for (let g = 0; g < 10; g++) {
    let board = createInitialBoard();
    let currentTurn: 'X' | 'O' = 'X';
    let moves = 0;

    while (moves < 9) {
      const move = computeAiMove(board, currentTurn, 'HARD');
      assert.notStrictEqual(move, -1);
      board[move] = currentTurn;
      moves++;

      const { winner } = checkWinner(board);
      if (winner !== null) {
        // Optimal play against optimal play in standard Tic-Tac-Toe MUST end in a DRAW
        assert.strictEqual(winner, 'DRAW', `Optimal self-play must draw. Ended with: ${winner}`);
        break;
      }

      currentTurn = currentTurn === 'X' ? 'O' : 'X';
    }
  }
});

test('Tic-Tac-Toe Rating - Elo Calculation', () => {
  // Evenly matched players (1000 vs 1000)
  const winX = calculateEloDelta(1000, 1000, 1);
  assert.strictEqual(winX.deltaX, 16);
  assert.strictEqual(winX.deltaO, -16);
  assert.strictEqual(winX.playerXNewRating, 1016);
  assert.strictEqual(winX.playerONewRating, 984);

  // Draw
  const draw = calculateEloDelta(1000, 1000, 0.5);
  assert.strictEqual(draw.deltaX, 0);
  assert.strictEqual(draw.deltaO, 0);

  // Underdog wins (900 beats 1100)
  const underdogWin = calculateEloDelta(900, 1100, 1);
  assert.ok(underdogWin.deltaX > 20); // Big rating gain
});
