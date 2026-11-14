# NOVA GAMING — NOVA Ludo Game Specification (v2.0 Revised)

**Status:** Reviewed Pre-Implementation Specification (Do Not Implement Until Open Decisions Are Signed Off)  
**Target Monorepo Modules:** `games/ludo` (`@nova/game-ludo`), `packages/database`, `packages/fairness`, `packages/i18n` (`en`, `am`, `om`), `packages/ui`, `apps/api`, `apps/web`, `apps/admin`

---

## 1. Executive Summary of Revisions (Why These Changes Were Made)

Before writing any code, this specification resolves six architectural and rule ambiguities found in the initial Ludo draft:

1. **Exact Single-Source Board Geometry:** Defined the complete `15×15` (`0..14` row/col) coordinate table covering all `52` outer loop squares, `8` safe squares, `4` private home columns, and center goal squares (`144 + 52 + 20 + 9 = 225` exact cells). Both `@nova/api` and `@nova/web` must import this map directly from `packages`/workspace engine `@nova/game-ludo` rather than maintaining independent coordinate math.
2. **Official Default Ruleset & Disabled Blockades (v1):** Standardized one official NOVA Ludo ruleset across all matches, disabling blockades in v1 and defining explicit behavior when multiple tokens occupy safe vs. unsafe squares.
3. **Deterministic 2 / 3 / 4 Player Seating:** Replaced vague "spread seats out" wording with an explicit seating table (`RED/YELLOW` opposite for 2-player; `RED/GREEN/YELLOW` for 3-player; `RED/GREEN/YELLOW/BLUE` for 4-player).
4. **Non-Strategic Timeout Policy & Timer/Reconnect Precedence:** Eliminated secret server-chosen strategic moves on timeout. Turn timers pause/yield cleanly to the `45s` reconnect grace timer when a player disconnects.
5. **Bias-Free Versioned Provably Fair Dice (`LUDO_HMAC_V1`):** Specified unbiased byte-level rejection sampling (`byte < 252`), deterministic `:retryN` digest fallback, client-seed lock deadline before round 1 rolls, and independent offline verification.
6. **Signal-Based Anti-Cheat & Financial Safety:** Replaced automatic IP/phone hard bans with weighted fraud risk flags (`AbuseFlag` + `UserReport`) reviewed by Admin before suspension, plus atomic stake locking, full refunds on pre-start cancellation, and single-settlement idempotency guards. Keep real-money stakes disabled by admin flag (`realMoneyEnabled: false`) until legal/compliance sign-off.

---

## 2. Revised Complete Game Requirements

### 2.1 Supported Modes
- **Multiplayer Cash / Promo PvP Rooms:** `2-player`, `3-player`, and `4-player` real-time matches (gated by Admin `realMoneyEnabled` flag; configurable Free Entry mode supported with `stakeSantim = 0`).
- **Quick Match Queue:** Automatically pairs players sharing `(playerCount, stakeSantim)`.
- **Private Room & Friend Invites:** Shareable room code (`LD-XXXX`) + integration with `SocialService` (`GameInvite` `gameType = 'LUDO_PVP'`).
- **Free Practice vs. Computer AI:** Zero-wallet, zero-ledger client/local or practice-session mode (`EASY`, `MEDIUM`, `HARD`) running on the exact same `@nova/game-ludo` pure rules engine.

### 2.2 Localization & UI Requirements
- Full translations in `packages/i18n/src/translations/{en,am,om}.ts` (**English**, **Amharic**, **Afaan Oromoo**) for rules modal, lobby, turn status, countdowns, and settlement receipts.
- **Required Screens:** Ludo Lobby (Create / Join / Quick Match / Free AI / Rules modal), Live Match Table (mobile-first `15×15` SVG/CSS grid board, active turn pulse, dice roll synced with server outcome, movable token highlights, countdown timer, last-move trail, reconnecting overlay), Match Result Modal (winner, rankings, stake breakdown, fairness verification trigger), Fairness Verifier Drawer.

---

## 3. Exact 15×15 Board Coordinate Specification

All coordinates use zero-based `(row, col)` where `row 0` is the Top edge, `row 14` is the Bottom edge, `col 0` is the Left edge, and `col 14` is the Right edge.

### 3.1 Board Partition (`225` total cells = `15 × 15`)
- **Yards (`4 × 36 = 144` cells):**
  - `RED` (Top-Left): `row 0..5, col 0..5` — Token slots: `(1,1), (1,4), (4,1), (4,4)`
  - `GREEN` (Top-Right): `row 0..5, col 9..14` — Token slots: `(1,10), (1,13), (4,10), (4,13)`
  - `YELLOW` (Bottom-Right): `row 9..14, col 9..14` — Token slots: `(10,10), (10,13), (13,10), (13,13)`
  - `BLUE` (Bottom-Left): `row 9..14, col 0..5` — Token slots: `(10,1), (10,4), (13,1), (13,4)`
- **Shared Outer Loop (`52` cells):** `trackIdx = 0..51` traveling clockwise.
- **Private Home Columns (`4 × 5 = 20` cells):** `progress = 51..55`.
- **Center Goal Block (`3 × 3 = 9` cells):** `row 6..8, col 6..8` (Home finish targets adjacent to each home column + center triangle at `(7,7)`).

### 3.2 Complete 52-Square Clockwise Outer Track (`trackIdx 0..51`)

| `trackIdx` | `(row, col)` | Special Designation | `trackIdx` | `(row, col)` | Special Designation |
|---:|---|---|---:|---|---|
| **0** | `(6, 1)` | **SAFE — RED Start** | **26** | `(8, 13)` | **SAFE — YELLOW Start** |
| **1** | `(6, 2)` | Normal | **27** | `(8, 12)` | Normal |
| **2** | `(6, 3)` | Normal | **28** | `(8, 11)` | Normal |
| **3** | `(6, 4)` | Normal | **29** | `(8, 10)` | Normal |
| **4** | `(6, 5)` | Corner before Top arm | **30** | `(8, 9)` | Corner before Bottom arm |
| **5** | `(5, 6)` | Top arm entry | **31** | `(9, 8)` | Bottom arm entry |
| **6** | `(4, 6)` | Normal | **32** | `(10, 8)` | Normal |
| **7** | `(3, 6)` | Normal | **33** | `(11, 8)` | Normal |
| **8** | `(2, 6)` | **SAFE — Star #1** | **34** | `(12, 8)` | **SAFE — Star #3** |
| **9** | `(1, 6)` | Normal | **35** | `(13, 8)` | Normal |
| **10** | `(0, 6)` | Normal | **36** | `(14, 8)` | Normal |
| **11** | `(0, 7)` | **GREEN Home Turn-In** (`progress = 50` for Green) | **37** | `(14, 7)` | **BLUE Home Turn-In** (`progress = 50` for Blue) |
| **12** | `(0, 8)` | Normal | **38** | `(14, 6)` | Normal |
| **13** | `(1, 8)` | **SAFE — GREEN Start** | **39** | `(13, 6)` | **SAFE — BLUE Start** |
| **14** | `(2, 8)` | Normal | **40** | `(12, 6)` | Normal |
| **15** | `(3, 8)` | Normal | **41** | `(11, 6)` | Normal |
| **16** | `(4, 8)` | Normal | **42** | `(10, 6)` | Normal |
| **17** | `(5, 8)` | Corner before Right arm | **43** | `(9, 6)` | Corner before Left arm |
| **18** | `(6, 9)` | Right arm entry | **44** | `(8, 5)` | Left arm entry |
| **19** | `(6, 10)` | Normal | **45** | `(8, 4)` | Normal |
| **20** | `(6, 11)` | Normal | **46** | `(8, 3)` | Normal |
| **21** | `(6, 12)` | **SAFE — Star #2** | **47** | `(8, 2)` | **SAFE — Star #4** |
| **22** | `(6, 13)` | Normal | **48** | `(8, 1)` | Normal |
| **23** | `(6, 14)` | Normal | **49** | `(8, 0)` | Normal |
| **24** | `(7, 14)` | **YELLOW Home Turn-In** (`progress = 50` for Yellow) | **50** | `(7, 0)` | **RED Home Turn-In** (`progress = 50` for Red) |
| **25** | `(8, 14)` | Normal | **51** | `(6, 0)` | Wraps to `0` (`(6,1)`) for non-Red |

### 3.3 Private Home Columns (`progress = 51..55`) & Finish (`progress = 56`)

A token's logical state is an integer `progress` in `[-1, 56]`:
- `-1`: Inside base yard.
- `0..50`: On the shared outer loop at `trackIdx = (colorStartIdx + progress) % 52`.
- `51..55`: Inside that color's private Home Column (unreachable by any opponent).
- `56`: Finished inside Home Goal.

| Color | `colorStartIdx` | Turn-In `trackIdx` (`progress=50`) | Home Column (`51..55`) | Finish Cell (`56`) |
|---|---:|---|---|---|
| **RED** | `0` `(6,1)` | `50` `(7,0)` | `(7,1), (7,2), (7,3), (7,4), (7,5)` | `(7,6)` |
| **GREEN** | `13` `(1,8)` | `11` `(0,7)` | `(1,7), (2,7), (3,7), (4,7), (5,7)` | `(6,7)` |
| **YELLOW** | `26` `(8,13)` | `24` `(7,14)` | `(7,13), (7,12), (7,11), (7,10), (7,9)` | `(7,8)` |
| **BLUE** | `39` `(13,6)` | `37` `(14,7)` | `(13,7), (12,7), (11,7), (10,7), (9,7)` | `(8,7)` |

---

## 4. Seat & Color Assignment Specification

Seats are always filled in deterministic order, and turn order always progresses **clockwise**:

| Player Count | Seat 1 | Seat 2 | Seat 3 | Seat 4 | Turn Order |
|---|---|---|---|---|---|
| **2 Players** | `RED` | `YELLOW` *(opposite)* | — | — | `RED -> YELLOW` |
| **3 Players** | `RED` | `GREEN` | `YELLOW` | — | `RED -> GREEN -> YELLOW` |
| **4 Players** | `RED` | `GREEN` | `YELLOW` | `BLUE` | `RED -> GREEN -> YELLOW -> BLUE` |

- Seat `1` rolls first unless randomized before turn 1; if Seat 1 is assigned randomly, the PRNG selection must use `ProvablyFair` (`nonce = 0`) and be recorded in match metadata.

---

## 5. Official NOVA Ludo Ruleset (`NOVA_CLASSIC_V1`)

| Rule Area | Official Specification |
|---|---|
| **Players & Tokens** | `2–4` players, `4` tokens each, single `d6` die (`1..6`). |
| **Leaving Base** | Requires rolling a `6`. Moves token from `-1` to `progress = 0` (`startIdx`, which is Safe). |
| **Movement** | Clockwise `progress + diceValue`. Exact roll required to reach `progress = 56` (`progress + diceValue <= 56`). |
| **Extra Turns** | Awarded on: **(a)** Rolling a `6`, **(b)** Capturing one or more opponent tokens, or **(c)** Moving a token onto exact finish `progress = 56`. *Extra turns do not stack from a single move — at most 1 bonus roll per completed turn.* |
| **Three Consecutive Sixes** | Rolling a third consecutive `6` in one turn chain **cancels that 3rd roll immediately** (no token moves for the 3rd roll; previous 2 moves stand) and passes the turn clockwise cleanly. |
| **Blockades (v1)** | **Disabled.** No token stacks block passing or capturing. |
| **Multi-Token Stacking & Captures** | - **Safe Squares (`0, 8, 13, 21, 26, 34, 39, 47`):** Multiple tokens of any colors may coexist peacefully. Captures are impossible.<br>- **Home Column (`51..55`) & Finish (`56`):** Accessible only to that owner's color; immune to capture.<br>- **Unsafe Normal Squares:** Multiple **same-color** tokens may stand together. If an arriving token lands on an unsafe square occupied by **1 opponent token**, that opponent token is captured (`progress -> -1`). If an arriving token lands on **2+ opponent tokens of a single enemy color** on an unsafe square: **all opponent tokens on that square are captured together** *(alternatively: disallowed stacking or capture-one — captured-all matches standard fast-paced Ethiopian/Indian digital Ludo; documented as `captureStackMode = 'CAPTURE_ALL'`)*. A player's own tokens never capture each other. |
| **Auto-Pass** | If no legal move exists (`legalMoves(state, dice) === []`), the server immediately records a forced pass and advances turn without waiting for user input. |
| **Victory Condition** | First player to land all `4` tokens on `progress = 56` wins `100%` of the net prize pool (winner-take-all). |

---

## 6. Timeout, Disconnect & Reconnection Policy

### 6.1 Non-Strategic Turn Timeout (`30s` Turn Window)
1. If a player fails to press **Roll Dice** within `30s` of turn start:
   - Server automatically rolls the provably fair die for that turn and logs `autoRolled: true`.
   - If the auto-rolled value yields **zero legal moves**, turn automatically passes clockwise.
   - If legal moves exist, the player receives a **`12s` Move-Selection Window** (`moveTimer`) to pick a token manually.
2. **Never Play Strategic Moves Silently:** If the player fails to select a move within the move-selection window, the server **does NOT choose a capture/finish move**. It records a **Missed Turn** (`missedTurnCount++`), passes the turn without moving any token, and emits a transparent timeout notification.
3. **Timeout Forfeiture Threshold:** Accumulating `3` consecutive timeouts marks the player **FORFEITED** cleanly. In a 2-player match, the remaining active player wins immediately; in 3–4 player matches, the forfeited player's tokens remain frozen in base/safe-removed and remaining active players continue for the full pot.

### 6.2 Precedence Between 30s Turn Timer & 45s Reconnect Grace Period
- When a player's Socket.IO connection drops during their active turn:
  1. Server marks the player `DISCONNECTED`, pauses the `30s` turn timer (recording remaining `turnRemainingMs`), and starts a **`45s` Reconnect Grace Clock** visible to all players.
  2. If the player reconnects before `45s` expires: grace timer cancels, server pushes authoritative sanitized match state (`ludo:state-sync`), and the paused `turnRemainingMs` resumes (minimum `10s` floor on resume).
  3. If the player does NOT reconnect within `45s`: the player is forfeited cleanly (`disconnectForfeited = true`), remaining players continue (3–4 players) or settle immediately (2 players). A player forfeiting forfeits their locked stake into the existing match prize pool (explicitly disclosed in the Pre-Match Modal before joining).

---

## 7. Versioned Provably Fair Dice Specification (`LUDO_HMAC_V1`)

1. **Pre-Match Seed Commitment:**
   - Before Match Start, server generates a 32-byte random `serverSeed` (`64` hex chars) and computes `serverSeedHash = SHA256(serverSeed)`.
   - Players have up to `5 seconds` in `PRE_START` countdown (or upon room join before Round 1 Roll 1) to confirm or customize their `clientSeed`. Once the **first roll** begins, `clientSeed` and `serverSeedHash` are **permanently locked** (`seedsLockedAt`). Players cannot alter seeds mid-match.
   - Combined client seed for deterministic multi-player fairness: `combinedClientSeed = SHA256(seat1Seed + ":" + seat2Seed + ... + ":" + matchId)` (logged openly in match metadata).
2. **Unbiased Rejection Sampling Algorithm (`LUDO_HMAC_V1`):**
   - `message = "LUDO_HMAC_V1:" + combinedClientSeed + ":" + nonce + ":" + retryAttempt` (`retryAttempt` starts at `0`, increments `1, 2...` if needed).
   - Compute `digest = HMAC_SHA256(key = serverSeed, message = message)` as a `32`-byte raw buffer (`byte 0 .. byte 31`).
   - Iterate `i = 0` to `31`: read unsigned uint8 `b = digest[i]`.
   - Accept if `b < 252` (`252 = 6 × 42`, guaranteeing exact uniform probability `1/6` per face with **zero modulo bias**). Return `dice = (b % 6) + 1`.
   - If all 32 bytes are `>= 252` (`probability = (4/256)^32 ≈ 2^-192`), increment `retryAttempt` and repeat deterministically.
3. **Verification:**
   - After match completion, `serverSeed` is revealed on match history & Fairness Drawer.
   - `verifyLudoRoll(serverSeed, serverSeedHash, combinedClientSeed, nonce, algorithmVersion)` runs standalone in `@nova/fairness` with zero server state.

---

## 8. Wallet, Settlement, Refunds & Match Integrity

### 8.1 Prize & Fee Transparency (Pre-Join Modal)
Every room lobby modal displays exact ETB math before locking funds:
- **Example (4 players × 50 ETB stake, 5% house rake):** `Total Pot = 200 ETB` · `Platform Fee (5%) = 10 ETB` · `Winner Payout = 190 ETB`.
- **Example (2 players × 50 ETB stake, 5% house rake):** `Total Pot = 100 ETB` · `Platform Fee (5%) = 5 ETB` · `Winner Payout = 95 ETB`.
- Free Practice (`mode = 'AI'`) and Zero-Stake Friendly Rooms (`stakeSantim = 0`) never read or write `Wallet` / `LedgerEntry`.

### 8.2 Ledger & Transaction Integrity
- Reuses existing `WalletService` / `LedgerService` (`STAKE_LOCK`, `MATCH_PAYOUT`, `STAKE_REFUND`, `HOUSE_RAKE`).
- **On Join:** Atomically deducts cash balance (`allowBonusBalance` configurable in `LudoConfig`, default `false` — real cash only) with idempotency key `ludo:lock:${roomId}:${userId}`.
- **On Pre-Start Cancel / Expiry:** Atomically refunds every locked seat via `ludo:refund:${roomId}:${userId}`.
- **On Settlement:** Uses conditional SQL update `UPDATE LudoMatch SET settled = true WHERE id = ? AND settled = false` inside `prisma.$transaction` so even duplicate triggers or crash recovery never pays twice.
- **Integrity Invariants:**
  - Cannot start until `joinedSeats === requiredPlayers`.
  - `@@unique([roomId, userId])` and `@@unique([roomId, seat])` enforce 1 seat per user.
  - Completed/cancelled matches are immutable.

---

## 9. Anti-Cheat & Moderation Policy

Consistent with `AbuseService` (`apps/api/src/services/abuse.service.ts`), shared networks/carrier NATs in Ethiopia (university Wi-Fi, Ethio Telecom mobile NAT, households) must **never** auto-ban legitimate players.
- **Weighted Fraud Signals Only:** Matching IP hash, matching payment destination, or device fingerprint increments a soft collusion score and logs an `AbuseFlag` (`SHARED_SIGNAL`, `REPEAT_PAIRING`, `ONE_SIDED_TRANSFER`, `RAPID_MOVES`).
- **Action Escalation:** Automated prevention blocks **duplicate accounts joining the same 2–4 player room** ONLY when multiple high-confidence signals match simultaneously (e.g., exact same `userId` or active `UserBlock` between players). All account suspensions require **Admin review** with a mandatory persisted reason in `AdminAuditLog`.

---

## 10. Database, API, Socket.IO & I18n Requirements

### 10.1 Database Models (`packages/database/prisma/schema.prisma` & `schema.postgresql.prisma`)
Reuse `User`, `Wallet`, `LedgerEntry`, `AbuseFlag`, `UserReport`, `GameInvite`, and `AdminAuditLog`. Add:
- `LudoConfig`: `id: "default"`, `enabled`, `realMoneyEnabled` (`false` by default until compliance review), `quickMatchEnabled`, `privateRoomsEnabled`, `aiEnabled`, `minStakeSantim`, `maxStakeSantim`, `platformFeeBps` (`500`), `turnTimeoutSeconds` (`30`), `moveWindowSeconds` (`12`), `reconnectGraceSeconds` (`45`), `maxMissedTurns` (`3`), `allowBonusBalance` (`false`).
- `LudoRoom`: `id`, `roomCode` unique, `roomType` (`QUICK_MATCH`, `PRIVATE`), `playerCount` (`2..4`), `status` (`WAITING`, `PRE_START`, `PLAYING`, `COMPLETED`, `CANCELLED`, `EXPIRED`), `stakeSantim`, `hostId`, `expiresAt`, timestamps.
- `LudoPlayer`: `id`, `roomId`, `userId`, `seat` (`1..4`), `color` (`RED|GREEN|YELLOW|BLUE`), `clientSeed`, `stakeLocked`, `forfeited`, `missedTurns`, `connectionStatus`, `disconnectedAt`, `disconnectCount` (`@@unique([roomId, userId])`, `@@unique([roomId, seat])`).
- `LudoMatch`: `id`, `roomId` unique, `status` (`PRE_START`, `ACTIVE`, `COMPLETED`, `CANCELLED`), `rulesetVersion` (`NOVA_CLASSIC_V1`), `fairnessVersion` (`LUDO_HMAC_V1`), `serverSeed`, `serverSeedHash`, `combinedClientSeed`, `nonce` (`0+`), `turnSeat`, `turnPhase` (`ROLL`, `MOVE`), `diceValue`, `consecutiveSixes`, `gameStateJson`, `winnerId`, `totalPotSantim`, `platformFeeSantim`, `payoutSantim`, `settled`, timestamps.
- `LudoAction`: `id`, `matchId`, `sequenceNumber` (`@@unique([matchId, sequenceNumber])`), `userId`, `seat`, `actionType` (`ROLL`, `MOVE`, `AUTO_ROLL`, `PASS`, `FORFEIT`), `diceValue`, `tokenId`, `fromProgress`, `toProgress`, `capturedTokensJson`, `idempotencyKey` (`@unique`), timestamps.

### 10.2 API & Socket.IO Contract
- **HTTP `/api/v1/ludo/*`:** `GET /config`, `GET /lobby`, `GET /active`, `GET /history`, `GET /matches/:matchId/verify`, `POST /quick-match`, `POST /rooms`, `POST /rooms/join`, `POST /rooms/:roomId/leave`, `POST /rooms/:roomId/client-seed`, `POST /matches/:matchId/roll`, `POST /matches/:matchId/move`.
- **Admin `/api/v1/admin/ludo/*`:** `GET /`, `PUT /config`, `POST /rooms/:roomId/cancel`, `GET /flags`, auditing via `AdminAuditLog`.
- **Socket.IO Events:** `ludo:join-room`, `ludo:roll-dice`, `ludo:move-token`, `ludo:forfeit`, `ludo:state-sync`, `ludo:dice-rolled`, `ludo:token-moved`, `ludo:player-disconnected`, `ludo:player-reconnected`, `ludo:match-ended`, `ludo:error`.

---

## 11. Revised Test Plan

1. **Board Geometry Verification:** Assert all `52` outer cells are unique, adjacent (`|dr|+|dc| <= 2` at corners, `1` elsewhere), start indices `[0, 13, 26, 39]` match yards, turn-in indices `[50, 11, 24, 37]` connect smoothly to private home columns `[51..55]`, and finish cells never collide.
2. **100,000-Game Simulation (`@nova/game-ludo`):** Run randomized/bot games across **2-player, 3-player, and 4-player** modes with a max-turn guard (`maxTurns = 1500` to detect stalled/infinite games), measuring average turns, capture rates, and **Seat 1 win-rate bias** across `2/3/4` players.
3. **Rules Unit Tests:** Leave base on 6 only, extra turn on 6/capture/home finish, 3 consecutive 6s cancellation without rolling back earlier 2 moves, exact finish `<= 56`, safe square multi-color coexistence, unsafe stack capture rules.
4. **Provably Fair Tests (`@nova/fairness`):** Chi-square uniformity distribution check across `100,000` `LUDO_HMAC_V1` rolls (`faces 1..6`), `:retry` edge case simulation when first digest bytes `>= 252`, client-seed lock enforcement after roll #1, independent verification of every roll recorded in a test match.
5. **Multiplayer, Wallet & Crash Recovery Integration Tests (`@nova/api`):** Concurrent 2/3/4 player joins, duplicate seat rejection, timeout auto-roll -> move window -> miss counter -> forfeit, disconnect `45s` timer vs `30s` turn timer pause/resume, atomic stake lock/refund/payout idempotency, double-settlement guard, active match recovery after server restart.
6. **Mobile UI Acceptance Tests:** `390×844` layout fit (no horizontal overflow), touch target sizes on tokens, synced dice animation vs server result, Amharic (`am`) & Afaan Oromoo (`om`) translations completeness.

---

## 12. Open Decisions to Confirm Before Implementation Starts

1. **Multi-Token Stacking on Unsafe Normal Squares:** Confirm whether landing on `2+` enemy tokens on an unsafe square should **capture all** (`CAPTURE_ALL`), **capture only the first**, or **prohibit stacking >1 same-color token on unsafe squares**. *(Recommended: `CAPTURE_ALL` to encourage tactical risk).*
2. **Minimum Human Players Before AI Fill:** In `3-player` or `4-player` Quick Match, if a room waits longer than `60s` with only `2` players, should it **stay waiting until all human seats fill** *(Recommended for real-money PvP)* or convert/offer downgrade to `2-player`?
3. **Real-Money Launch Gate:** Confirm launching **Free AI Practice + 0-ETB Friendly Rooms first** (`realMoneyEnabled = false`) before enabling staked matches (`realMoneyEnabled = true`).
4. **3-Consecutive-Sixes Penalty Behavior:** Confirmed spec cancels only the **3rd move** (preserving the 1st and 2nd moves) and passes the turn; confirm if you prefer that vs. reverting all 3 moves of the turn.
