import assert from 'node:assert';
import {
  createInitialState,
  boardFromAscii,
  applyMove,
  type GameState,
  type Pos,
} from '../rules.js';
import { findBestMove, evaluateBoard } from '../ai.js';

console.log('\n📋 SUITE: Dama AI Engine (Dark Squares)');

// 1. Initial position produces a valid opening move for White
const s0 = createInitialState('W');
const bestOpening = findBestMove(s0, 'medium');
assert(bestOpening !== null, 'AI finds a valid move from opening position');
assert(bestOpening.captured.length === 0, 'Opening move is a quiet move');
console.log(`  ✅ Opening move selected: [${bestOpening.from}] -> [${bestOpening.path[0]}]`);

// 2. AI prioritizes compulsory captures on diagonal
const capturePos: GameState = {
  board: boardFromAscii([
    '........',
    '........',
    '........',
    '..b.....',
    '...w....',
    '........',
    '........',
    '........',
  ]),
  turn: 'W',
  quietPlies: 0,
};
const forcedCap = findBestMove(capturePos, 'hard');
assert(forcedCap !== null, 'AI returns forced capture move');
assert(forcedCap.captured.length === 1, 'Forced capture captures 1 piece');
assert(forcedCap.path[0][0] === 2 && forcedCap.path[0][1] === 1, 'Lands on [2, 1]');
console.log('  ✅ AI selects compulsory diagonal capture correctly');

// 3. AI takes winning move when opponent has 1 piece left
const winPos: GameState = {
  board: boardFromAscii([
    '........',
    '........',
    '........',
    '..b.....',
    '...w....',
    '........',
    '........',
    '........',
  ]),
  turn: 'W',
  quietPlies: 0,
};
const winMove = findBestMove(winPos, 'hard');
assert(winMove !== null, 'AI finds winning capture');
const afterWin = applyMove(winPos, winMove);
assert(afterWin.result.status === 'win' && afterWin.result.winner === 'W', 'Move leads to victory');
console.log('  ✅ AI successfully executes immediate win');

// 4. Board evaluation scores
const whiteAhead: GameState = {
  board: boardFromAscii([
    '........',
    '........',
    '........',
    '........',
    '........',
    '..w.....',
    '........',
    '........',
  ]),
  turn: 'W',
  quietPlies: 0,
};
const evalW = evaluateBoard(whiteAhead, 'W');
assert(evalW > 0, `White ahead score is positive: ${evalW}`);
const evalB = evaluateBoard(whiteAhead, 'B');
assert(evalB < 0, `Black behind score is negative: ${evalB}`);
console.log('  ✅ Evaluation perspective calculation verified');

console.log('\n🎉 ALL DAMA AI TESTS PASSED SUCCESSFULLY!\n');
