import {
  CapturedSummary,
  ChessMoveOption,
  ChessMoveRecord,
  ChessPiece,
  ChessTermination,
  PieceColor,
  PieceType,
  PromotionPiece,
} from './types.js';

export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const FILES = 'abcdefgh';
const RANKS = '87654321';
const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const START_COUNTS: Record<Exclude<PieceType, 'k'>, number> = {
  q: 1,
  r: 2,
  b: 2,
  n: 2,
  p: 8,
};

interface InternalMove {
  fromIdx: number;
  toIdx: number;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PromotionPiece;
  isCastleKing?: boolean;
  isCastleQueen?: boolean;
  isEnPassant?: boolean;
  isDoublePawn?: boolean;
}

export function squareToCoords(sq: string): [number, number] | null {
  if (!sq || sq.length !== 2) return null;
  const f = FILES.indexOf(sq[0]);
  const r = RANKS.indexOf(sq[1]);
  if (f < 0 || r < 0) return null;
  return [r, f];
}

export function squareToIndex(sq: string): number {
  const coords = squareToCoords(sq);
  if (!coords) return -1;
  return coords[0] * 8 + coords[1];
}

export function indexToSquare(idx: number): string {
  const r = Math.floor(idx / 8);
  const f = idx % 8;
  return `${FILES[f]}${RANKS[r]}`;
}

function inside(r: number, f: number): boolean {
  return r >= 0 && r < 8 && f >= 0 && f < 8;
}

export class ChessEngine {
  private board: Array<ChessPiece | null> = new Array(64).fill(null);
  private turn: PieceColor = 'w';
  private castling = { K: true, Q: true, k: true, q: true };
  private epIndex: number | null = null;
  private halfmoveClock = 0;
  private fullmoveNumber = 1;
  private history: ChessMoveRecord[] = [];
  private positionCounts = new Map<string, number>();

  constructor(fen: string = STARTING_FEN, existingMoves: ChessMoveRecord[] = []) {
    this.loadFen(fen);
    if (existingMoves.length > 0) {
      this.history = [...existingMoves];
    }
  }

  static fromMoves(ucis: string[], startFen: string = STARTING_FEN): ChessEngine {
    const engine = new ChessEngine(startFen);
    for (const uci of ucis) {
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promo = uci.length > 4 ? (uci[4] as PromotionPiece) : undefined;
      const mv = engine.makeMove({ from, to, promotion: promo });
      if (!mv) break;
    }
    return engine;
  }

  clone(): ChessEngine {
    const copy = new ChessEngine(this.getFen(), this.history);
    copy.positionCounts = new Map(this.positionCounts);
    return copy;
  }

  loadFen(fen: string): void {
    const parts = fen.trim().split(/\s+/);
    if (parts.length < 4) {
      throw new Error(`Invalid FEN: ${fen}`);
    }

    const [placement, activeColor, castlingStr, epStr, halfStr, fullStr] = parts;
    const rows = placement.split('/');
    if (rows.length !== 8) {
      throw new Error(`Invalid FEN placement: ${placement}`);
    }

    this.board.fill(null);
    for (let r = 0; r < 8; r++) {
      let f = 0;
      for (const ch of rows[r]) {
        if (ch >= '1' && ch <= '8') {
          f += Number(ch);
        } else {
          const lower = ch.toLowerCase() as PieceType;
          const color: PieceColor = ch === ch.toUpperCase() ? 'w' : 'b';
          if (!['p', 'n', 'b', 'r', 'q', 'k'].includes(lower) || f >= 8) {
            throw new Error(`Invalid piece in FEN: ${ch}`);
          }
          this.board[r * 8 + f] = { type: lower, color };
          f++;
        }
      }
      if (f !== 8) {
        throw new Error(`Invalid rank width in FEN row ${r}`);
      }
    }

    this.turn = activeColor === 'b' ? 'b' : 'w';
    this.castling = {
      K: castlingStr.includes('K'),
      Q: castlingStr.includes('Q'),
      k: castlingStr.includes('k'),
      q: castlingStr.includes('q'),
    };
    this.epIndex = epStr && epStr !== '-' ? squareToIndex(epStr) : null;
    if (this.epIndex === -1) this.epIndex = null;
    this.halfmoveClock = Number.isFinite(Number(halfStr)) ? Math.max(0, Number(halfStr)) : 0;
    this.fullmoveNumber = Number.isFinite(Number(fullStr)) ? Math.max(1, Number(fullStr)) : 1;

    this.positionCounts.clear();
    const key = this.getRepetitionKey();
    this.positionCounts.set(key, 1);
  }

  getFen(): string {
    const rows: string[] = [];
    for (let r = 0; r < 8; r++) {
      let rowStr = '';
      let empty = 0;
      for (let f = 0; f < 8; f++) {
        const p = this.board[r * 8 + f];
        if (!p) {
          empty++;
        } else {
          if (empty > 0) {
            rowStr += String(empty);
            empty = 0;
          }
          rowStr += p.color === 'w' ? p.type.toUpperCase() : p.type;
        }
      }
      if (empty > 0) rowStr += String(empty);
      rows.push(rowStr);
    }

    const castlingStr =
      (this.castling.K ? 'K' : '') +
        (this.castling.Q ? 'Q' : '') +
        (this.castling.k ? 'k' : '') +
        (this.castling.q ? 'q' : '') || '-';
    const epStr = this.epIndex !== null ? indexToSquare(this.epIndex) : '-';
    return `${rows.join('/')} ${this.turn} ${castlingStr} ${epStr} ${this.halfmoveClock} ${this.fullmoveNumber}`;
  }

  private getRepetitionKey(): string {
    const fenParts = this.getFen().split(' ');
    return fenParts.slice(0, 4).join(' ');
  }

  getTurn(): PieceColor {
    return this.turn;
  }

  getBoard(): Array<ChessPiece | null> {
    return [...this.board];
  }

  getPieceAt(sq: string): ChessPiece | null {
    const idx = squareToIndex(sq);
    if (idx < 0) return null;
    return this.board[idx];
  }

  getMoveHistory(): ChessMoveRecord[] {
    return [...this.history];
  }

  private findKing(color: PieceColor): number {
    for (let i = 0; i < 64; i++) {
      const p = this.board[i];
      if (p && p.color === color && p.type === 'k') return i;
    }
    return -1;
  }

  isSquareAttacked(idx: number, byColor: PieceColor): boolean {
    const r = Math.floor(idx / 8);
    const f = idx % 8;

    // 1. Pawns
    const pawnDir = byColor === 'w' ? 1 : -1; // Pawn attacks come from r + pawnDir
    for (const df of [-1, 1]) {
      const pr = r + pawnDir;
      const pf = f + df;
      if (inside(pr, pf)) {
        const p = this.board[pr * 8 + pf];
        if (p && p.color === byColor && p.type === 'p') return true;
      }
    }

    // 2. Knights
    const knightSteps = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ];
    for (const [dr, df] of knightSteps) {
      const nr = r + dr;
      const nf = f + df;
      if (inside(nr, nf)) {
        const p = this.board[nr * 8 + nf];
        if (p && p.color === byColor && p.type === 'n') return true;
      }
    }

    // 3. Kings
    for (let dr = -1; dr <= 1; dr++) {
      for (let df = -1; df <= 1; df++) {
        if (dr === 0 && df === 0) continue;
        const kr = r + dr;
        const kf = f + df;
        if (inside(kr, kf)) {
          const p = this.board[kr * 8 + kf];
          if (p && p.color === byColor && p.type === 'k') return true;
        }
      }
    }

    // 4. Orthogonal sliding (Rook / Queen)
    const orthoDirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const [dr, df] of orthoDirs) {
      let cr = r + dr;
      let cf = f + df;
      while (inside(cr, cf)) {
        const p = this.board[cr * 8 + cf];
        if (p) {
          if (p.color === byColor && (p.type === 'r' || p.type === 'q')) return true;
          break;
        }
        cr += dr;
        cf += df;
      }
    }

    // 5. Diagonal sliding (Bishop / Queen)
    const diagDirs = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    for (const [dr, df] of diagDirs) {
      let cr = r + dr;
      let cf = f + df;
      while (inside(cr, cf)) {
        const p = this.board[cr * 8 + cf];
        if (p) {
          if (p.color === byColor && (p.type === 'b' || p.type === 'q')) return true;
          break;
        }
        cr += dr;
        cf += df;
      }
    }

    return false;
  }

  isInCheck(color: PieceColor = this.turn): boolean {
    const kingIdx = this.findKing(color);
    if (kingIdx < 0) return false;
    return this.isSquareAttacked(kingIdx, color === 'w' ? 'b' : 'w');
  }

  private generatePseudoLegalMoves(forColor: PieceColor = this.turn): InternalMove[] {
    const moves: InternalMove[] = [];
    const enemy: PieceColor = forColor === 'w' ? 'b' : 'w';

    for (let idx = 0; idx < 64; idx++) {
      const p = this.board[idx];
      if (!p || p.color !== forColor) continue;
      const r = Math.floor(idx / 8);
      const f = idx % 8;

      if (p.type === 'p') {
        const dir = forColor === 'w' ? -1 : 1;
        const startRank = forColor === 'w' ? 6 : 1;
        const promoRank = forColor === 'w' ? 0 : 7;

        const oneR = r + dir;
        if (inside(oneR, f) && !this.board[oneR * 8 + f]) {
          const toIdx = oneR * 8 + f;
          if (oneR === promoRank) {
            for (const promo of ['q', 'r', 'b', 'n'] as PromotionPiece[]) {
              moves.push({ fromIdx: idx, toIdx, piece: 'p', color: forColor, promotion: promo });
            }
          } else {
            moves.push({ fromIdx: idx, toIdx, piece: 'p', color: forColor });
            const twoR = r + dir * 2;
            if (r === startRank && inside(twoR, f) && !this.board[twoR * 8 + f]) {
              moves.push({
                fromIdx: idx,
                toIdx: twoR * 8 + f,
                piece: 'p',
                color: forColor,
                isDoublePawn: true,
              });
            }
          }
        }

        // Captures + En Passant
        for (const df of [-1, 1]) {
          const cr = r + dir;
          const cf = f + df;
          if (!inside(cr, cf)) continue;
          const toIdx = cr * 8 + cf;
          const target = this.board[toIdx];
          if (target && target.color === enemy) {
            if (cr === promoRank) {
              for (const promo of ['q', 'r', 'b', 'n'] as PromotionPiece[]) {
                moves.push({
                  fromIdx: idx,
                  toIdx,
                  piece: 'p',
                  color: forColor,
                  captured: target.type,
                  promotion: promo,
                });
              }
            } else {
              moves.push({
                fromIdx: idx,
                toIdx,
                piece: 'p',
                color: forColor,
                captured: target.type,
              });
            }
          } else if (this.epIndex !== null && toIdx === this.epIndex) {
            const epPawn = this.board[r * 8 + cf];
            if (epPawn && epPawn.color === enemy && epPawn.type === 'p') {
              moves.push({
                fromIdx: idx,
                toIdx,
                piece: 'p',
                color: forColor,
                captured: 'p',
                isEnPassant: true,
              });
            }
          }
        }
      } else if (p.type === 'n') {
        const steps = [
          [-2, -1],
          [-2, 1],
          [-1, -2],
          [-1, 2],
          [1, -2],
          [1, 2],
          [2, -1],
          [2, 1],
        ];
        for (const [dr, df] of steps) {
          const nr = r + dr;
          const nf = f + df;
          if (!inside(nr, nf)) continue;
          const toIdx = nr * 8 + nf;
          const target = this.board[toIdx];
          if (!target) {
            moves.push({ fromIdx: idx, toIdx, piece: 'n', color: forColor });
          } else if (target.color === enemy) {
            moves.push({ fromIdx: idx, toIdx, piece: 'n', color: forColor, captured: target.type });
          }
        }
      } else if (p.type === 'b' || p.type === 'r' || p.type === 'q') {
        const dirs =
          p.type === 'b'
            ? [
                [-1, -1],
                [-1, 1],
                [1, -1],
                [1, 1],
              ]
            : p.type === 'r'
            ? [
                [-1, 0],
                [1, 0],
                [0, -1],
                [0, 1],
              ]
            : [
                [-1, -1],
                [-1, 1],
                [1, -1],
                [1, 1],
                [-1, 0],
                [1, 0],
                [0, -1],
                [0, 1],
              ];
        for (const [dr, df] of dirs) {
          let cr = r + dr;
          let cf = f + df;
          while (inside(cr, cf)) {
            const toIdx = cr * 8 + cf;
            const target = this.board[toIdx];
            if (!target) {
              moves.push({ fromIdx: idx, toIdx, piece: p.type, color: forColor });
            } else {
              if (target.color === enemy) {
                moves.push({
                  fromIdx: idx,
                  toIdx,
                  piece: p.type,
                  color: forColor,
                  captured: target.type,
                });
              }
              break;
            }
            cr += dr;
            cf += df;
          }
        }
      } else if (p.type === 'k') {
        for (let dr = -1; dr <= 1; dr++) {
          for (let df = -1; df <= 1; df++) {
            if (dr === 0 && df === 0) continue;
            const kr = r + dr;
            const kf = f + df;
            if (!inside(kr, kf)) continue;
            const toIdx = kr * 8 + kf;
            const target = this.board[toIdx];
            if (!target) {
              moves.push({ fromIdx: idx, toIdx, piece: 'k', color: forColor });
            } else if (target.color === enemy) {
              moves.push({
                fromIdx: idx,
                toIdx,
                piece: 'k',
                color: forColor,
                captured: target.type,
              });
            }
          }
        }

        // Castling
        if (forColor === 'w' && r === 7 && f === 4) {
          if (
            this.castling.K &&
            !this.board[61] &&
            !this.board[62] &&
            this.board[63]?.type === 'r' &&
            this.board[63]?.color === 'w' &&
            !this.isSquareAttacked(60, 'b') &&
            !this.isSquareAttacked(61, 'b') &&
            !this.isSquareAttacked(62, 'b')
          ) {
            moves.push({ fromIdx: 60, toIdx: 62, piece: 'k', color: 'w', isCastleKing: true });
          }
          if (
            this.castling.Q &&
            !this.board[59] &&
            !this.board[58] &&
            !this.board[57] &&
            this.board[56]?.type === 'r' &&
            this.board[56]?.color === 'w' &&
            !this.isSquareAttacked(60, 'b') &&
            !this.isSquareAttacked(59, 'b') &&
            !this.isSquareAttacked(58, 'b')
          ) {
            moves.push({ fromIdx: 60, toIdx: 58, piece: 'k', color: 'w', isCastleQueen: true });
          }
        } else if (forColor === 'b' && r === 0 && f === 4) {
          if (
            this.castling.k &&
            !this.board[5] &&
            !this.board[6] &&
            this.board[7]?.type === 'r' &&
            this.board[7]?.color === 'b' &&
            !this.isSquareAttacked(4, 'w') &&
            !this.isSquareAttacked(5, 'w') &&
            !this.isSquareAttacked(6, 'w')
          ) {
            moves.push({ fromIdx: 4, toIdx: 6, piece: 'k', color: 'b', isCastleKing: true });
          }
          if (
            this.castling.q &&
            !this.board[3] &&
            !this.board[2] &&
            !this.board[1] &&
            this.board[0]?.type === 'r' &&
            this.board[0]?.color === 'b' &&
            !this.isSquareAttacked(4, 'w') &&
            !this.isSquareAttacked(3, 'w') &&
            !this.isSquareAttacked(2, 'w')
          ) {
            moves.push({ fromIdx: 4, toIdx: 2, piece: 'k', color: 'b', isCastleQueen: true });
          }
        }
      }
    }

    return moves;
  }

  private applyInternalMove(mv: InternalMove): {
    prevBoard: Array<ChessPiece | null>;
    prevCastling: { K: boolean; Q: boolean; k: boolean; q: boolean };
    prevEp: number | null;
    prevHalf: number;
    prevFull: number;
    prevTurn: PieceColor;
  } {
    const snapshot = {
      prevBoard: [...this.board],
      prevCastling: { ...this.castling },
      prevEp: this.epIndex,
      prevHalf: this.halfmoveClock,
      prevFull: this.fullmoveNumber,
      prevTurn: this.turn,
    };

    const movingPiece = this.board[mv.fromIdx]!;
    this.board[mv.fromIdx] = null;
    this.board[mv.toIdx] = mv.promotion
      ? { type: mv.promotion, color: mv.color }
      : movingPiece;

    if (mv.isEnPassant) {
      const fromR = Math.floor(mv.fromIdx / 8);
      const toF = mv.toIdx % 8;
      this.board[fromR * 8 + toF] = null;
    }

    if (mv.isCastleKing) {
      if (mv.color === 'w') {
        this.board[61] = this.board[63];
        this.board[63] = null;
      } else {
        this.board[5] = this.board[7];
        this.board[7] = null;
      }
    } else if (mv.isCastleQueen) {
      if (mv.color === 'w') {
        this.board[59] = this.board[56];
        this.board[56] = null;
      } else {
        this.board[3] = this.board[0];
        this.board[0] = null;
      }
    }

    // Castling rights updates
    if (mv.piece === 'k') {
      if (mv.color === 'w') {
        this.castling.K = false;
        this.castling.Q = false;
      } else {
        this.castling.k = false;
        this.castling.q = false;
      }
    }
    if (mv.fromIdx === 63 || mv.toIdx === 63) this.castling.K = false;
    if (mv.fromIdx === 56 || mv.toIdx === 56) this.castling.Q = false;
    if (mv.fromIdx === 7 || mv.toIdx === 7) this.castling.k = false;
    if (mv.fromIdx === 0 || mv.toIdx === 0) this.castling.q = false;

    // En passant square
    if (mv.isDoublePawn) {
      this.epIndex = (mv.fromIdx + mv.toIdx) / 2;
    } else {
      this.epIndex = null;
    }

    // Halfmove & fullmove clocks
    if (mv.piece === 'p' || mv.captured) {
      this.halfmoveClock = 0;
    } else {
      this.halfmoveClock++;
    }

    if (mv.color === 'b') {
      this.fullmoveNumber++;
    }

    this.turn = mv.color === 'w' ? 'b' : 'w';
    return snapshot;
  }

  private restoreSnapshot(snap: {
    prevBoard: Array<ChessPiece | null>;
    prevCastling: { K: boolean; Q: boolean; k: boolean; q: boolean };
    prevEp: number | null;
    prevHalf: number;
    prevFull: number;
    prevTurn: PieceColor;
  }): void {
    this.board = snap.prevBoard;
    this.castling = snap.prevCastling;
    this.epIndex = snap.prevEp;
    this.halfmoveClock = snap.prevHalf;
    this.fullmoveNumber = snap.prevFull;
    this.turn = snap.prevTurn;
  }

  private getLegalInternalMoves(): InternalMove[] {
    const candidates = this.generatePseudoLegalMoves(this.turn);
    const legal: InternalMove[] = [];
    for (const mv of candidates) {
      const snap = this.applyInternalMove(mv);
      const safe = !this.isInCheck(mv.color);
      this.restoreSnapshot(snap);
      if (safe) legal.push(mv);
    }
    return legal;
  }

  private formatSan(mv: InternalMove, allLegal: InternalMove[]): string {
    if (mv.isCastleKing) return 'O-O';
    if (mv.isCastleQueen) return 'O-O-O';

    const fromSq = indexToSquare(mv.fromIdx);
    const toSq = indexToSquare(mv.toIdx);
    let san = '';

    if (mv.piece === 'p') {
      if (mv.captured) {
        san += `${fromSq[0]}x`;
      }
      san += toSq;
      if (mv.promotion) {
        san += `=${mv.promotion.toUpperCase()}`;
      }
    } else {
      san += mv.piece.toUpperCase();
      const peers = allLegal.filter(
        (other) =>
          other.fromIdx !== mv.fromIdx &&
          other.toIdx === mv.toIdx &&
          other.piece === mv.piece
      );
      if (peers.length > 0) {
        const sameFile = peers.some((p) => indexToSquare(p.fromIdx)[0] === fromSq[0]);
        const sameRank = peers.some((p) => indexToSquare(p.fromIdx)[1] === fromSq[1]);
        if (!sameFile) {
          san += fromSq[0];
        } else if (!sameRank) {
          san += fromSq[1];
        } else {
          san += fromSq;
        }
      }
      if (mv.captured) {
        san += 'x';
      }
      san += toSq;
    }

    // Check / Checkmate suffix
    const snap = this.applyInternalMove(mv);
    const enemyInCheck = this.isInCheck(this.turn);
    if (enemyInCheck) {
      const enemyReplies = this.getLegalInternalMoves();
      san += enemyReplies.length === 0 ? '#' : '+';
    }
    this.restoreSnapshot(snap);
    return san;
  }

  getLegalRawMoves(): Array<{
    from: string;
    to: string;
    piece: PieceType;
    captured?: PieceType;
    promotion?: PromotionPiece;
  }> {
    return this.getLegalInternalMoves().map((mv) => ({
      from: indexToSquare(mv.fromIdx),
      to: indexToSquare(mv.toIdx),
      piece: mv.piece,
      captured: mv.captured,
      promotion: mv.promotion,
    }));
  }

  getLegalMoves(square?: string): ChessMoveOption[] {
    const allLegal = this.getLegalInternalMoves();
    const filterIdx = square ? squareToIndex(square) : -1;
    const filtered = square ? allLegal.filter((m) => m.fromIdx === filterIdx) : allLegal;

    return filtered.map((mv) => {
      const from = indexToSquare(mv.fromIdx);
      const to = indexToSquare(mv.toIdx);
      return {
        from,
        to,
        piece: mv.piece,
        color: mv.color,
        captured: mv.captured,
        promotion: mv.promotion,
        isCastleKing: mv.isCastleKing,
        isCastleQueen: mv.isCastleQueen,
        isEnPassant: mv.isEnPassant,
        san: this.formatSan(mv, allLegal),
        uci: `${from}${to}${mv.promotion || ''}`,
      };
    });
  }

  makeMove(input: {
    from: string;
    to: string;
    promotion?: PromotionPiece;
  }): ChessMoveRecord | null {
    const fromIdx = squareToIndex(input.from);
    const toIdx = squareToIndex(input.to);
    if (fromIdx < 0 || toIdx < 0) return null;

    const allLegal = this.getLegalInternalMoves();
    const mv = allLegal.find(
      (m) =>
        m.fromIdx === fromIdx &&
        m.toIdx === toIdx &&
        (m.promotion ? m.promotion === (input.promotion || 'q') : !input.promotion)
    );
    if (!mv) return null;

    const san = this.formatSan(mv, allLegal);
    this.applyInternalMove(mv);

    const fenAfter = this.getFen();
    const key = this.getRepetitionKey();
    this.positionCounts.set(key, (this.positionCounts.get(key) || 0) + 1);

    const from = indexToSquare(mv.fromIdx);
    const to = indexToSquare(mv.toIdx);
    const record: ChessMoveRecord = {
      ply: this.history.length + 1,
      from,
      to,
      uci: `${from}${to}${mv.promotion || ''}`,
      san,
      piece: mv.piece,
      color: mv.color,
      captured: mv.captured,
      promotion: mv.promotion,
      fenAfter,
    };
    this.history.push(record);
    return record;
  }

  isCheckmate(): boolean {
    return this.isInCheck(this.turn) && this.getLegalInternalMoves().length === 0;
  }

  isStalemate(): boolean {
    return !this.isInCheck(this.turn) && this.getLegalInternalMoves().length === 0;
  }

  isThreefoldRepetition(): boolean {
    const key = this.getRepetitionKey();
    return (this.positionCounts.get(key) || 0) >= 3;
  }

  isFivefoldRepetition(): boolean {
    const key = this.getRepetitionKey();
    return (this.positionCounts.get(key) || 0) >= 5;
  }

  isFiftyMoveRule(): boolean {
    return this.halfmoveClock >= 100;
  }

  isSeventyFiveMoveRule(): boolean {
    return this.halfmoveClock >= 150;
  }

  isInsufficientMaterial(): boolean {
    const wMinors: Array<{ type: PieceType; colorSq: number }> = [];
    const bMinors: Array<{ type: PieceType; colorSq: number }> = [];

    for (let i = 0; i < 64; i++) {
      const p = this.board[i];
      if (!p || p.type === 'k') continue;
      if (p.type === 'p' || p.type === 'r' || p.type === 'q') return false;
      const r = Math.floor(i / 8);
      const f = i % 8;
      const colorSq = (r + f) % 2;
      if (p.color === 'w') wMinors.push({ type: p.type, colorSq });
      else bMinors.push({ type: p.type, colorSq });
    }

    if (wMinors.length === 0 && bMinors.length === 0) return true;
    if (wMinors.length === 1 && bMinors.length === 0) return true;
    if (bMinors.length === 1 && wMinors.length === 0) return true;
    if (
      wMinors.length === 1 &&
      bMinors.length === 1 &&
      wMinors[0].type === 'b' &&
      bMinors[0].type === 'b' &&
      wMinors[0].colorSq === bMinors[0].colorSq
    ) {
      return true;
    }
    return false;
  }

  getGameOverResult(): {
    isOver: boolean;
    winnerColor: PieceColor | null;
    termination: ChessTermination | null;
  } {
    if (this.isCheckmate()) {
      return {
        isOver: true,
        winnerColor: this.turn === 'w' ? 'b' : 'w',
        termination: 'CHECKMATE',
      };
    }
    if (this.isStalemate()) {
      return { isOver: true, winnerColor: null, termination: 'STALEMATE' };
    }
    if (this.isFivefoldRepetition()) {
      return { isOver: true, winnerColor: null, termination: 'FIVEFOLD' };
    }
    if (this.isThreefoldRepetition()) {
      return { isOver: true, winnerColor: null, termination: 'THREEFOLD' };
    }
    if (this.isSeventyFiveMoveRule()) {
      return { isOver: true, winnerColor: null, termination: 'SEVENTY_FIVE_MOVE' };
    }
    if (this.isFiftyMoveRule()) {
      return { isOver: true, winnerColor: null, termination: 'FIFTY_MOVE' };
    }
    if (this.isInsufficientMaterial()) {
      return { isOver: true, winnerColor: null, termination: 'INSUFFICIENT_MATERIAL' };
    }
    return { isOver: false, winnerColor: null, termination: null };
  }

  getPgn(headers?: {
    event?: string;
    white?: string;
    black?: string;
    result?: '1-0' | '0-1' | '1/2-1/2' | '*';
    date?: string;
  }): string {
    const h = {
      event: headers?.event || 'NOVA GAMING Chess Match',
      white: headers?.white || 'White',
      black: headers?.black || 'Black',
      result: headers?.result || '*',
      date: headers?.date || new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    };
    const headerLines = [
      `[Event "${h.event}"]`,
      `[Site "NOVA GAMING"]`,
      `[Date "${h.date}"]`,
      `[White "${h.white}"]`,
      `[Black "${h.black}"]`,
      `[Result "${h.result}"]`,
    ];
    const tokens: string[] = [];
    for (let i = 0; i < this.history.length; i += 2) {
      const moveNum = Math.floor(i / 2) + 1;
      const w = this.history[i]?.san || '';
      const b = this.history[i + 1]?.san;
      tokens.push(b ? `${moveNum}. ${w} ${b}` : `${moveNum}. ${w}`);
    }
    tokens.push(h.result);
    return `${headerLines.join('\n')}\n\n${tokens.join(' ')}`;
  }

  getKingSquare(color: PieceColor): string | null {
    const idx = this.findKing(color);
    return idx >= 0 ? indexToSquare(idx) : null;
  }

  getCapturedSummary(): CapturedSummary {
    const wAlive: Record<Exclude<PieceType, 'k'>, number> = { q: 0, r: 0, b: 0, n: 0, p: 0 };
    const bAlive: Record<Exclude<PieceType, 'k'>, number> = { q: 0, r: 0, b: 0, n: 0, p: 0 };

    for (const p of this.board) {
      if (!p || p.type === 'k') continue;
      if (p.color === 'w') wAlive[p.type]++;
      else bAlive[p.type]++;
    }

    const whiteCaptured: PieceType[] = [];
    const blackCaptured: PieceType[] = [];
    let whitePoints = 0;
    let blackPoints = 0;

    for (const pt of ['q', 'r', 'b', 'n', 'p'] as Array<Exclude<PieceType, 'k'>>) {
      whitePoints += wAlive[pt] * PIECE_VALUES[pt];
      blackPoints += bAlive[pt] * PIECE_VALUES[pt];

      const missingBlack = Math.max(0, START_COUNTS[pt] - bAlive[pt]);
      const missingWhite = Math.max(0, START_COUNTS[pt] - wAlive[pt]);
      for (let i = 0; i < missingBlack; i++) whiteCaptured.push(pt);
      for (let i = 0; i < missingWhite; i++) blackCaptured.push(pt);
    }

    return {
      whiteCaptured,
      blackCaptured,
      whiteAdvantage: whitePoints - blackPoints,
    };
  }
}
