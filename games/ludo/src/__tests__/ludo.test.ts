import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LUDO_HOME_COLUMNS,
  LUDO_OUTER_TRACK,
  LUDO_SAFE_TRACK_INDICES,
  LUDO_SEAT_COLOR_ORDER,
  LUDO_START_TRACK_INDEX,
  LUDO_YARD_SLOTS,
  applyLudoMissedTurn,
  applyLudoMove,
  applyLudoRoll,
  chooseLudoAiMove,
  createLudoMatchState,
  getLegalLudoMoves,
  progressToTrackIndex,
} from '../index.js';

test('Board coordinate integrity: 52 outer + 20 home + 144 yard + 9 center = 225 unique cells', () => {
  assert.equal(LUDO_OUTER_TRACK.length, 52);
  assert.equal(LUDO_SAFE_TRACK_INDICES.size, 8);

  const seen = new Set<string>();
  for (const c of LUDO_OUTER_TRACK) {
    assert.ok(c.row >= 0 && c.row <= 14 && c.col >= 0 && c.col <= 14);
    const key = `${c.row},${c.col}`;
    assert.equal(seen.has(key), false, `Duplicate outer coordinate ${key}`);
    seen.add(key);
  }

  for (const color of ['RED', 'GREEN', 'YELLOW', 'BLUE'] as const) {
    assert.equal(LUDO_HOME_COLUMNS[color].length, 5);
    assert.equal(LUDO_SAFE_TRACK_INDICES.has(LUDO_START_TRACK_INDEX[color]), true);
    for (const c of LUDO_HOME_COLUMNS[color]) {
      const key = `${c.row},${c.col}`;
      assert.equal(seen.has(key), false, `Home col overlap at ${key}`);
      seen.add(key);
    }
    for (const c of LUDO_YARD_SLOTS[color]) {
      const key = `${c.row},${c.col}`;
      assert.equal(seen.has(key), false, `Yard overlap at ${key}`);
    }
  }
});

test('Deterministic seating for 2, 3, and 4 players', () => {
  assert.deepEqual(LUDO_SEAT_COLOR_ORDER[2], ['RED', 'YELLOW']);
  assert.deepEqual(LUDO_SEAT_COLOR_ORDER[3], ['RED', 'GREEN', 'YELLOW']);
  assert.deepEqual(LUDO_SEAT_COLOR_ORDER[4], ['RED', 'GREEN', 'YELLOW', 'BLUE']);
});

test('Leaving base on 6, three consecutive sixes cancels 3rd roll, and exact finish required', () => {
  let state = createLudoMatchState([
    { userId: 'u1', username: 'P1' },
    { userId: 'u2', username: 'P2' },
  ]);

  // Roll 4 with all tokens in yard -> auto pass
  const r1 = applyLudoRoll(state, 4);
  assert.equal(r1.autoPassed, true);
  assert.equal(r1.nextState.currentTurnSeat, 2);

  // Back to Seat 1: roll 6 #1 -> move token 0 out
  state = applyLudoRoll(state, 6).nextState;
  state = applyLudoMove(state, 0).nextState;
  assert.equal(state.seats[0].tokens[0].progress, 0);
  assert.equal(state.currentTurnSeat, 1);

  // Roll 6 #2 -> move token 0 forward 6
  state = applyLudoRoll(state, 6).nextState;
  state = applyLudoMove(state, 0).nextState;
  assert.equal(state.seats[0].tokens[0].progress, 6);
  assert.equal(state.currentTurnSeat, 1);

  // Roll 6 #3 -> cancelled immediately, turn passes to Seat 2, earlier 2 moves preserved!
  const rSix3 = applyLudoRoll(state, 6);
  assert.equal(rSix3.tripleSixCancelled, true);
  assert.equal(rSix3.nextState.currentTurnSeat, 2);
  assert.equal(rSix3.nextState.seats[0].tokens[0].progress, 6);

  // Test exact finish requirement at progress = 54 (needs 2 to reach 56)
  state.currentTurnSeat = 1;
  state.turnPhase = 'ROLL';
  state.consecutiveSixes = 0;
  state.seats[0].tokens[0].progress = 54;
  assert.equal(getLegalLudoMoves(state, 3).some((m) => m.tokenIndex === 0), false);
  assert.equal(getLegalLudoMoves(state, 2).some((m) => m.tokenIndex === 0), true);
});

test('Blockade rule: two same-color tokens block opponents from passing or landing when enabled', () => {
  // 1. With blockades enabled
  let state = createLudoMatchState(
    [
      { userId: 'u1', username: 'P1' },
      { userId: 'u2', username: 'P2' },
    ],
    1,
    { blockadesEnabled: true }
  );

  // Seat 2 (YELLOW, start=26): 2 tokens at track index 15 (progress = (15 - 26 + 52) = 41)
  state.seats[1].tokens[0].progress = 41;
  state.seats[1].tokens[1].progress = 41;
  assert.equal(progressToTrackIndex('YELLOW', 41), 15);

  // Seat 1 (RED, start=0): token 0 at track index 13 (progress 13)
  state.seats[0].tokens[0].progress = 13;
  assert.equal(progressToTrackIndex('RED', 13), 13);

  // Red rolls 2 (would land on 15) -> BLOCKED
  let legal = getLegalLudoMoves(state, 2);
  assert.equal(legal.some((m) => m.tokenIndex === 0), false, 'Red cannot land on Yellow block');

  // Red rolls 4 (would pass through 15 to 17) -> BLOCKED
  legal = getLegalLudoMoves(state, 4);
  assert.equal(legal.some((m) => m.tokenIndex === 0), false, 'Red cannot pass through Yellow block');

  // Red rolls 1 (lands on 14, before block) -> LEGAL
  legal = getLegalLudoMoves(state, 1);
  assert.equal(legal.some((m) => m.tokenIndex === 0), true, 'Red can move before block');

  // Yellow's OWN token at progress 39 (track 13) rolls 2 -> Yellow can join its own block!
  state.currentTurnSeat = 2;
  state.seats[1].tokens[2].progress = 39;
  let yellowLegal = getLegalLudoMoves(state, 2);
  assert.equal(yellowLegal.some((m) => m.tokenIndex === 2), true, 'Yellow can join its own block');

  // 2. With blockades disabled (default)
  let noBlockState = createLudoMatchState(
    [
      { userId: 'u1', username: 'P1' },
      { userId: 'u2', username: 'P2' },
    ],
    1,
    { blockadesEnabled: false }
  );
  noBlockState.seats[1].tokens[0].progress = 41;
  noBlockState.seats[1].tokens[1].progress = 41;
  noBlockState.seats[0].tokens[0].progress = 13;

  // Red rolls 2 -> lands on 15 and captures both tokens!
  let noBlockLegal = getLegalLudoMoves(noBlockState, 2);
  assert.equal(noBlockLegal.some((m) => m.tokenIndex === 0), true);
  assert.equal(noBlockLegal[0].wouldCapture.length, 2);
});

test('Configurable options: mustRollSixToStart, exactFinishRequired, extraTurnOnCapture', () => {
  // Option 1: mustRollSixToStart = false
  let stateCasual = createLudoMatchState(
    [
      { userId: 'u1', username: 'P1' },
      { userId: 'u2', username: 'P2' },
    ],
    1,
    { mustRollSixToStart: false }
  );
  // Roll 3 can leave base
  let casualMoves = getLegalLudoMoves(stateCasual, 3);
  assert.equal(casualMoves.length, 4);
  assert.equal(casualMoves[0].wouldLeaveBase, true);

  // Option 2: exactFinishRequired = false
  let stateEasyFinish = createLudoMatchState(
    [
      { userId: 'u1', username: 'P1' },
      { userId: 'u2', username: 'P2' },
    ],
    1,
    { exactFinishRequired: false }
  );
  stateEasyFinish.seats[0].tokens[0].progress = 54; // needs 2 for exact 56
  // Roll 5 -> finishes directly (capped at 56)
  let finishMoves = getLegalLudoMoves(stateEasyFinish, 5);
  assert.equal(finishMoves.some((m) => m.tokenIndex === 0 && m.wouldFinish), true);

  // Option 3: extraTurnOnCapture = false
  let stateNoBonus = createLudoMatchState(
    [
      { userId: 'u1', username: 'P1' },
      { userId: 'u2', username: 'P2' },
    ],
    1,
    { extraTurnOnCapture: false }
  );
  stateNoBonus.seats[1].tokens[0].progress = 2; // track 28
  stateNoBonus.seats[0].tokens[0].progress = 25;
  stateNoBonus = applyLudoRoll(stateNoBonus, 3).nextState;
  const movedNoBonus = applyLudoMove(stateNoBonus, 0);
  assert.equal(movedNoBonus.move.captured.length, 1);
  // Since dice was 3 (not 6) and extraTurnOnCapture is false, NO extra turn granted!
  assert.equal(movedNoBonus.move.extraTurnGranted, false);
  assert.equal(movedNoBonus.nextState.currentTurnSeat, 2);
});

test('Capture on unsafe square vs safe square protection & CAPTURE_ALL stacking', () => {
  let state = createLudoMatchState([
    { userId: 'u1', username: 'P1' },
    { userId: 'u2', username: 'P2' },
  ]);

  // Seat 2 (YELLOW, start=26) places 2 tokens at progress 2 -> trackIdx 28 (unsafe)
  state.seats[1].tokens[0].progress = 2;
  state.seats[1].tokens[1].progress = 2;
  // Seat 1 (RED, start=0) places token at progress 25 -> rolls 3 -> trackIdx 28 (unsafe)
  state.seats[0].tokens[0].progress = 25;

  state = applyLudoRoll(state, 3).nextState;
  const moved = applyLudoMove(state, 0);
  assert.equal(moved.move.captured.length, 2);
  assert.equal(moved.move.extraTurnGranted, true);
  assert.equal(moved.nextState.seats[1].tokens[0].progress, -1);
  assert.equal(moved.nextState.seats[1].tokens[1].progress, -1);

  // Test safe square index 8 (no capture allowed)
  let safeState = createLudoMatchState([
    { userId: 'u1', username: 'P1' },
    { userId: 'u2', username: 'P2' },
  ]);
  // Yellow trackIdx 8 corresponds to progress (8 - 26 + 52) = 34
  safeState.seats[1].tokens[0].progress = 34;
  assert.equal(progressToTrackIndex('YELLOW', 34), 8);
  safeState.seats[0].tokens[0].progress = 5;
  safeState = applyLudoRoll(safeState, 3).nextState;
  const safeMoved = applyLudoMove(safeState, 0);
  assert.equal(safeMoved.move.captured.length, 0);
  assert.equal(safeMoved.nextState.seats[1].tokens[0].progress, 34);
});

test('Non-strategic missed turns result in forfeiture after 3 misses', () => {
  let state = createLudoMatchState([
    { userId: 'u1', username: 'P1' },
    { userId: 'u2', username: 'P2' },
  ]);
  for (let i = 0; i < 3; i++) {
    state.currentTurnSeat = 1;
    state.turnPhase = 'MOVE';
    state.currentDice = 6;
    const res = applyLudoMissedTurn(state, 3);
    state = res.nextState;
    if (i < 2) assert.equal(res.forfeited, false);
    else {
      assert.equal(res.forfeited, true);
      assert.equal(res.gameEnded, true);
      assert.equal(state.winnerSeat, 2);
    }
  }
});

test('Simulation across 2P, 3P, and 4P games (maxTurns=1500 stall check & finish verification)', () => {
  const simulateN = (playerCount: 2 | 3 | 4, games: number) => {
    const players = Array.from({ length: playerCount }, (_, i) => ({
      userId: `sim-${i + 1}`,
      username: `Bot${i + 1}`,
    }));
    let stalled = 0;
    const winsBySeat: Record<number, number> = {};

    // High-bit 32-bit LCG PRNG avoiding low-bit parity bias
    let seed = 1337 + playerCount * 97;
    const nextDie = () => {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      return ((seed >>> 16) % 6) + 1;
    };

    for (let g = 0; g < games; g++) {
      let st = createLudoMatchState(players, 1);
      let turns = 0;
      while (st.turnPhase !== 'FINISHED' && turns < 1500) {
        turns++;
        const die = nextDie();
        const rolled = applyLudoRoll(st, die);
        st = rolled.nextState;
        if (!rolled.autoPassed && st.turnPhase === 'MOVE') {
          const mv = chooseLudoAiMove(st, 'MEDIUM');
          if (!mv) break;
          st = applyLudoMove(st, mv.tokenIndex).nextState;
        }
      }
      if (st.turnPhase !== 'FINISHED') stalled++;
      else if (st.winnerSeat) {
        winsBySeat[st.winnerSeat] = (winsBySeat[st.winnerSeat] || 0) + 1;
      }
    }
    return { stalled, winsBySeat };
  };

  for (const cnt of [2, 3, 4] as const) {
    const res = simulateN(cnt, 2000);
    assert.equal(res.stalled, 0, `Detected stalled games in ${cnt}P simulation`);
    const totalWins = Object.values(res.winsBySeat).reduce((a, b) => a + b, 0);
    assert.equal(totalWins, 2000);
  }
});
