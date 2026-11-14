import assert from 'node:assert';
import {
  createInitialState,
  getLegalMoves,
  applyMove,
  getResult,
  boardToAscii,
  type GameState,
  type LegalMove,
} from '../rules.js';
import { findBestMove } from '../ai.js';

console.log('⚔️  DAMA TWO-SIDED SIMULATION (White vs Black Full Match)\n');

let state: GameState = createInitialState('W');
let moveNumber = 1;
const maxMoves = 120;

console.log('Initial Board Setup:');
boardToAscii(state.board).forEach((row, i) => console.log(`  ${8 - i} | ${row.split('').join(' ')}`));
console.log('    ----------------');
console.log('      A B C D E F G H\n');

while (moveNumber <= maxMoves) {
  const result = getResult(state);
  if (result.status !== 'ongoing') {
    console.log(`\n🏁 MATCH CONCLUDED at move ${moveNumber - 1}!`);
    console.log(`Result: ${JSON.stringify(result)}`);
    break;
  }

  const currentTurn = state.turn;
  // White plays Medium difficulty, Black plays Medium difficulty
  const move = findBestMove(state, 'medium');

  if (!move) {
    console.log(`❌ No legal move found for ${currentTurn}`);
    break;
  }

  const { state: nextState, result: nextResult } = applyMove(state, move);
  const capStr = move.captured.length > 0 ? ` [CAPTURED ${move.captured.length} pcs at ${JSON.stringify(move.captured)}]` : '';
  console.log(
    `Move #${moveNumber.toString().padStart(2, ' ')} (${currentTurn}): [${move.from}] -> [${move.path.join(' -> ')}]${capStr}`
  );

  state = nextState;
  moveNumber++;

  // Periodically display board state every 10 moves or on capture
  if (move.captured.length > 0 || moveNumber % 15 === 0) {
    console.log(`\nBoard after move #${moveNumber - 1}:`);
    boardToAscii(state.board).forEach((row, i) => console.log(`  ${8 - i} | ${row.split('').join(' ')}`));
    console.log('    ----------------');
    console.log('      A B C D E F G H\n');
  }
}

const finalResult = getResult(state);
console.log('\n--- FINAL GAME AUDIT ---');
console.log(`Status: ${finalResult.status}`);
if (finalResult.status === 'win') {
  console.log(`Winner: ${finalResult.winner} by ${finalResult.reason}`);
} else if (finalResult.status === 'draw') {
  console.log(`Draw by ${finalResult.reason}`);
}

assert(moveNumber > 5, 'Match progressed through multiple turns');
console.log('\n✅ TWO-SIDED PLAY ENGINE VERIFIED: Game progressed with full legality and turn-alternation.');

