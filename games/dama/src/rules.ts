/**
 * Dama (Ethiopian draughts/checkers) rules engine.
 *
 * Pure and deterministic: no I/O, no randomness, no clocks. The server holds the only
 * authoritative GameState and validates every client move with applyMove().
 *
 * Board and setup (as described for the Ethiopian game):
 *  - 8x8 board; pieces sit and move ONLY on the dark squares ((row + col) is odd).
 *  - 12 pieces each, filling the three rows closest to each player.
 *  - Row 7 is White's back row (White moves up, row - 1); row 0 is Black's back row.
 *
 * Movement (defaults follow standard draughts; every item is configurable in RuleOptions):
 *  - Men move one square diagonally forward onto an empty dark square.
 *  - Men capture by jumping an adjacent enemy diagonally forward onto the empty square behind it
 *    (backward captures optional).
 *  - Capturing is compulsory and multi-jumps must be completed. A piece can't be jumped twice
 *    (captured pieces are removed after the whole sequence).
 *  - A man reaching the far row becomes a king. Kings move/capture diagonally in all four
 *    directions, one square at a time (flying kings optional).
 *  - You lose with no pieces or no legal move. Long runs without captures or man moves are a draw.
 *
 * Only the setup (12 pieces, dark squares, diagonals) is confirmed so far. Confirm the options
 * below with real Ethiopian players before launch.
 */

export const SIZE = 8;

export type Color = 'W' | 'B';
export interface Piece {
  color: Color;
  king: boolean;
}
export type Cell = Piece | null;
export type Board = Cell[][];
/** [row, col] */
export type Pos = [number, number];

/** What a client sends: the starting square and every landing square in order. */
export interface Move {
  from: Pos;
  path: Pos[];
}

export interface LegalMove extends Move {
  captured: Pos[];
}

export interface RuleOptions {
  /** Must take the sequence that captures the most pieces. */
  requireMaxCapture: boolean;
  /** Men may capture backward (they never MOVE backward). */
  menCaptureBackward: boolean;
  /** Kings slide any distance diagonally, and capture from a distance. */
  flyingKings: boolean;
  /** A man that lands on the far row mid-capture stops there and is crowned. */
  promotionEndsCapture: boolean;
  /** Draw after this many plies with no capture and no man move. */
  maxQuietPlies: number;
}

export const DEFAULT_OPTIONS: RuleOptions = {
  requireMaxCapture: false,
  menCaptureBackward: false,
  flyingKings: false,
  promotionEndsCapture: true,
  maxQuietPlies: 80,
};

export interface GameState {
  board: Board;
  turn: Color;
  quietPlies: number;
}

export type Result =
  | { status: 'ongoing' }
  | { status: 'win'; winner: Color; reason: 'no-pieces' | 'no-moves' }
  | { status: 'draw'; reason: 'quiet-plies' };

export class IllegalMoveError extends Error {
  constructor(message = 'Illegal move') {
    super(message);
    this.name = 'IllegalMoveError';
  }
}

const DIAGS: Pos[] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const forward = (c: Color) => (c === 'W' ? -1 : 1);
const promotionRow = (c: Color) => (c === 'W' ? 0 : SIZE - 1);
const other = (c: Color): Color => (c === 'W' ? 'B' : 'W');
const manMoveDirs = (c: Color): Pos[] => [[forward(c), -1], [forward(c), 1]];
const inBounds = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
const key = (r: number, c: number) => r * SIZE + c;
const full = (o?: Partial<RuleOptions>): RuleOptions => ({ ...DEFAULT_OPTIONS, ...o });

/** Playable ("black") squares. */
export const isDarkSquare = (r: number, c: number) => (r + c) % 2 === 1;

export function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

/** 12 pieces each on the three rows nearest each player. `firstMover` plays first. */
export function createInitialState(firstMover: Color = 'B'): GameState {
  const board = emptyBoard();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!isDarkSquare(r, c)) continue;
      if (r <= 2) board[r][c] = { color: 'B', king: false };
      if (r >= 5) board[r][c] = { color: 'W', king: false };
    }
  }
  return { board, turn: firstMover, quietPlies: 0 };
}

/** Build a board from 8 strings of 8 chars: '.' empty, w/b men, W/B kings (dark squares only). */
export function boardFromAscii(rows: string[]): Board {
  if (rows.length !== SIZE) throw new Error('Expected 8 rows');
  return rows.map((line, r) => {
    if (line.length !== SIZE) throw new Error('Each row needs 8 characters');
    return [...line].map((ch, c): Cell => {
      if (ch === '.') return null;
      if (!isDarkSquare(r, c)) throw new Error(`Piece on a light square at row ${r}, col ${c}`);
      switch (ch) {
        case 'w': return { color: 'W', king: false };
        case 'W': return { color: 'W', king: true };
        case 'b': return { color: 'B', king: false };
        case 'B': return { color: 'B', king: true };
        default: throw new Error(`Bad board character "${ch}"`);
      }
    });
  });
}

export function boardToAscii(board: Board): string[] {
  return board.map((row) =>
    row
      .map((cell) => {
        if (!cell) return '.';
        const ch = cell.color === 'W' ? 'w' : 'b';
        return cell.king ? ch.toUpperCase() : ch;
      })
      .join(''),
  );
}

function simpleMoves(board: Board, from: Pos, piece: Piece, o: RuleOptions): LegalMove[] {
  const out: LegalMove[] = [];
  const dirs = piece.king ? DIAGS : manMoveDirs(piece.color);
  const slide = piece.king && o.flyingKings;
  for (const [dr, dc] of dirs) {
    let r = from[0] + dr;
    let c = from[1] + dc;
    while (inBounds(r, c) && board[r][c] === null) {
      out.push({ from, path: [[r, c]], captured: [] });
      if (!slide) break;
      r += dr;
      c += dc;
    }
  }
  return out;
}

/** Every complete capture sequence for one piece. */
function captureSequences(board: Board, from: Pos, piece: Piece, o: RuleOptions): LegalMove[] {
  const work = cloneBoard(board);
  work[from[0]][from[1]] = null; // the moving piece has left its square

  const results: LegalMove[] = [];
  const captured = new Set<number>();
  const capList: Pos[] = [];
  const path: Pos[] = [];
  const flying = piece.king && o.flyingKings;
  const dirs = piece.king || o.menCaptureBackward ? DIAGS : manMoveDirs(piece.color);

  const record = () =>
    results.push({
      from,
      path: path.map((p) => [p[0], p[1]] as Pos),
      captured: capList.map((p) => [p[0], p[1]] as Pos),
    });

  const dfs = (r: number, c: number) => {
    let extended = false;

    for (const [dr, dc] of dirs) {
      if (flying) {
        let rr = r + dr;
        let cc = c + dc;
        while (inBounds(rr, cc) && work[rr][cc] === null) {
          rr += dr;
          cc += dc;
        }
        if (!inBounds(rr, cc)) continue;
        const target = work[rr][cc]!;
        // Own pieces and already-captured pieces (still on the board) block the way.
        if (target.color === piece.color || captured.has(key(rr, cc))) continue;

        let lr = rr + dr;
        let lc = cc + dc;
        while (inBounds(lr, lc) && work[lr][lc] === null) {
          extended = true;
          captured.add(key(rr, cc));
          capList.push([rr, cc]);
          path.push([lr, lc]);
          dfs(lr, lc);
          path.pop();
          capList.pop();
          captured.delete(key(rr, cc));
          lr += dr;
          lc += dc;
        }
      } else {
        const mr = r + dr;
        const mc = c + dc;
        const lr = r + 2 * dr;
        const lc = c + 2 * dc;
        if (!inBounds(lr, lc)) continue;
        const target = work[mr][mc];
        if (!target || target.color === piece.color || captured.has(key(mr, mc))) continue;
        if (work[lr][lc] !== null) continue;

        extended = true;
        captured.add(key(mr, mc));
        capList.push([mr, mc]);
        path.push([lr, lc]);
        if (!piece.king && o.promotionEndsCapture && lr === promotionRow(piece.color)) record();
        else dfs(lr, lc);
        path.pop();
        capList.pop();
        captured.delete(key(mr, mc));
      }
    }

    if (!extended && path.length > 0) record();
  };

  dfs(from[0], from[1]);
  return results;
}

export function getLegalMoves(state: GameState, options?: Partial<RuleOptions>): LegalMove[] {
  const o = full(options);
  const captures: LegalMove[] = [];
  const simples: LegalMove[] = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const piece = state.board[r][c];
      if (!piece || piece.color !== state.turn) continue;
      captures.push(...captureSequences(state.board, [r, c], piece, o));
      simples.push(...simpleMoves(state.board, [r, c], piece, o));
    }
  }

  if (captures.length === 0) return simples; // capturing is compulsory when available
  if (!o.requireMaxCapture) return captures;
  const most = Math.max(...captures.map((m) => m.captured.length));
  return captures.filter((m) => m.captured.length === most);
}

export function getResult(state: GameState, options?: Partial<RuleOptions>): Result {
  const o = full(options);
  let ownPieces = 0;
  for (const row of state.board) for (const cell of row) if (cell?.color === state.turn) ownPieces++;

  if (ownPieces === 0) return { status: 'win', winner: other(state.turn), reason: 'no-pieces' };
  if (getLegalMoves(state, o).length === 0) {
    return { status: 'win', winner: other(state.turn), reason: 'no-moves' };
  }
  if (state.quietPlies >= o.maxQuietPlies) return { status: 'draw', reason: 'quiet-plies' };
  return { status: 'ongoing' };
}

const samePos = (a: Pos, b: Pos) => a[0] === b[0] && a[1] === b[1];

function sameMove(a: Move, b: Move): boolean {
  return (
    Array.isArray(a?.from) &&
    Array.isArray(a?.path) &&
    samePos(a.from, b.from) &&
    a.path.length === b.path.length &&
    a.path.every((p, i) => Array.isArray(p) && samePos(p, b.path[i]))
  );
}

/**
 * Validate a client move against the full legal-move list and apply it.
 * Never trusts the client: anything not in the generated list is rejected.
 */
export function applyMove(
  state: GameState,
  move: Move,
  options?: Partial<RuleOptions>,
): { state: GameState; result: Result; move: LegalMove } {
  const o = full(options);
  const legal = getLegalMoves(state, o).find((m) => sameMove(move, m));
  if (!legal) throw new IllegalMoveError();

  const board = cloneBoard(state.board);
  const [fr, fc] = legal.from;
  const mover = board[fr][fc]!;
  board[fr][fc] = null;
  for (const [r, c] of legal.captured) board[r][c] = null;

  const end = legal.path[legal.path.length - 1];
  const wasKing = mover.king;
  const placed: Piece =
    !wasKing && end[0] === promotionRow(mover.color) ? { color: mover.color, king: true } : { ...mover };
  board[end[0]][end[1]] = placed;

  const quietPlies = legal.captured.length > 0 || !wasKing ? 0 : state.quietPlies + 1;
  const next: GameState = { board, turn: other(state.turn), quietPlies };
  return { state: next, result: getResult(next, o), move: legal };
}
