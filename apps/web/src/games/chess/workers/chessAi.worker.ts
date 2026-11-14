import { ChessDifficulty, PromotionPiece, chooseChessAiMove } from '@nova/game-chess';

interface AiRequestMessage {
  requestId: string;
  fen: string;
  difficulty: ChessDifficulty;
}

interface AiResponseMessage {
  requestId: string;
  move: { from: string; to: string; promotion?: PromotionPiece } | null;
}

self.onmessage = (event: MessageEvent<AiRequestMessage>) => {
  const { requestId, fen, difficulty } = event.data;
  const move = chooseChessAiMove(fen, difficulty);
  const reply: AiResponseMessage = { requestId, move };
  self.postMessage(reply);
};
