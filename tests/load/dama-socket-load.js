/**
 * ==============================================================================
 * NOVA Gaming Platform - 500 Concurrent Socket.IO / 100 Match Load Test Suite
 * ==============================================================================
 * Simulates high-concurrency traffic:
 *   - 500 concurrent WebSocket / long-polling client connections
 *   - 100 simultaneous active PvP matches
 *   - Rapid moves and retransmission latency measurement (P50, P95, P99)
 *
 * Usage:
 *   node tests/load/dama-socket-load.js [TARGET_URL]
 * Example:
 *   node tests/load/dama-socket-load.js http://localhost:5000
 */

import { io } from 'socket.io-client';
import axios from 'axios';

const TARGET_URL = process.argv[2] || process.env.API_URL || 'http://localhost:5000';
const NUM_SOCKETS = 500;
const NUM_MATCHES = 100;

console.log(`\n================================================================`);
console.log(`🚀 NOVA GAMING HIGH-CONCURRENCY REAL-TIME LOAD TEST`);
console.log(`   Target Server: ${TARGET_URL}`);
console.log(`   Simulated Clients: ${NUM_SOCKETS}`);
console.log(`   Simultaneous Matches: ${NUM_MATCHES}`);
console.log(`================================================================\n`);

const latencies = [];
let connectionsEstablished = 0;
let connectionErrors = 0;
let movesPlayed = 0;
let matchErrors = 0;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runLoadTest() {
  const startTime = Date.now();
  const sockets = [];

  // Phase 1: Establish 500 concurrent socket connections
  console.log(`⏳ Phase 1: Spawning ${NUM_SOCKETS} concurrent Socket.IO connections...`);
  const connectPromises = [];

  for (let i = 0; i < NUM_SOCKETS; i++) {
    const p = new Promise((resolve) => {
      const socket = io(TARGET_URL, {
        transports: ['websocket', 'polling'],
        auth: { token: 'demo-guest-token' },
        reconnection: false,
        timeout: 10000,
      });

      socket.on('connect', () => {
        connectionsEstablished++;
        resolve(socket);
      });

      socket.on('connect_error', () => {
        connectionErrors++;
        resolve(null);
      });

      sockets.push(socket);
    });

    connectPromises.push(p);
    if (i % 50 === 0) await sleep(50); // slight stagger to simulate real user arrival
  }

  await Promise.all(connectPromises);
  const connectDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Phase 1 Complete in ${connectDuration}s:`);
  console.log(`   Connected: ${connectionsEstablished} / ${NUM_SOCKETS}`);
  console.log(`   Errors: ${connectionErrors}`);

  // Phase 2: Create and join 100 simultaneous matches
  console.log(`\n⏳ Phase 2: Orchestrating ${NUM_MATCHES} simultaneous matches...`);
  const activeMatches = [];

  for (let m = 0; m < NUM_MATCHES; m++) {
    const hostIdx = m * 2;
    const guestIdx = m * 2 + 1;

    if (hostIdx >= sockets.length || guestIdx >= sockets.length) break;

    const hostSocket = sockets[hostIdx];
    const guestSocket = sockets[guestIdx];

    if (!hostSocket?.connected || !guestSocket?.connected) continue;

    try {
      // 1. Create challenge via REST
      const createRes = await axios.post(
        `${TARGET_URL}/api/v1/matches`,
        { stakeMinor: '5000', isPrivate: false },
        { headers: { Authorization: 'Bearer demo-guest-token' } }
      );
      const matchId = createRes.data?.data?.id;

      if (!matchId) continue;

      // 2. Host joins socket room
      hostSocket.emit('JOIN_MATCH', { matchId });

      // 3. Guest accepts challenge via REST
      await axios.post(
        `${TARGET_URL}/api/v1/matches/${matchId}/join`,
        {},
        { headers: { Authorization: 'Bearer demo-guest-token' } }
      );

      // 4. Guest joins socket room
      guestSocket.emit('JOIN_MATCH', { matchId });

      activeMatches.push({ matchId, hostSocket, guestSocket });
    } catch {
      matchErrors++;
    }
  }

  console.log(`✅ Phase 2 Complete: ${activeMatches.length} matches initiated and paired.`);

  // Phase 3: Concurrent Move Simulation
  console.log(`\n⏳ Phase 3: Firing concurrent moves across all matches...`);
  const movePromises = activeMatches.map(({ matchId, hostSocket }) => {
    return new Promise((resolve) => {
      const moveStart = Date.now();

      hostSocket.once('MATCH_UPDATE', () => {
        const duration = Date.now() - moveStart;
        latencies.push(duration);
        movesPlayed++;
        resolve();
      });

      hostSocket.once('MATCH_ERROR', () => {
        matchErrors++;
        resolve();
      });

      // Send standard opening move: [5, 2] -> [[4, 3]]
      hostSocket.emit('MATCH_MOVE', {
        matchId,
        from: [5, 2],
        path: [[4, 3]],
        ply: 0,
      });

      // Timeout safety
      setTimeout(resolve, 5000);
    });
  });

  await Promise.all(movePromises);

  // Compute Latency Percentiles
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p90 = latencies[Math.floor(latencies.length * 0.9)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Teardown
  for (const s of sockets) {
    if (s?.connected) s.disconnect();
  }

  console.log(`\n================================================================`);
  console.log(`📊 LOAD TEST PERFORMANCE SUMMARY`);
  console.log(`================================================================`);
  console.log(`   Total Duration:          ${totalDuration}s`);
  console.log(`   Sockets Connected:       ${connectionsEstablished} / ${NUM_SOCKETS}`);
  console.log(`   Concurrent Matches:      ${activeMatches.length} / ${NUM_MATCHES}`);
  console.log(`   Moves Executed:          ${movesPlayed}`);
  console.log(`   Error Rate:              ${((matchErrors / (NUM_MATCHES || 1)) * 100).toFixed(2)}%`);
  console.log(`   Latency P50:             ${p50} ms`);
  console.log(`   Latency P90:             ${p90} ms`);
  console.log(`   Latency P95:             ${p95} ms`);
  console.log(`   Latency P99:             ${p99} ms`);
  console.log(`================================================================\n`);
}

runLoadTest().catch(console.error);
