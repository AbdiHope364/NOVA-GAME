import React from 'react';
import { Trophy, Award, Frown, RefreshCw, Home, Coins } from 'lucide-react';
import { useI18nStore } from '../../../stores/i18nStore';

interface DamaGameOverModalProps {
  isPractice: boolean;
  isWinner: boolean;
  isDraw: boolean;
  resultReason: string;
  payoutEtb: number;
  rakeEtb: number;
  totalPotEtb: number;
  onReturnToLobby: () => void;
  onRestartPractice?: () => void;
}

export const DamaGameOverModal: React.FC<DamaGameOverModalProps> = ({
  isPractice,
  isWinner,
  isDraw,
  resultReason,
  payoutEtb,
  rakeEtb,
  totalPotEtb,
  onReturnToLobby,
  onRestartPractice,
}) => {
  const { t } = useI18nStore();

  const getReasonText = () => {
    switch (resultReason) {
      case 'no-pieces':
        return 'All opponent pieces captured!';
      case 'no-moves':
        return 'Opponent has no legal moves remaining!';
      case 'RESIGN_WHITE':
      case 'RESIGN_BLACK':
      case 'resignation':
        return 'Match conceded by resignation.';
      case 'FORFEIT_WHITE':
      case 'FORFEIT_BLACK':
      case 'time-forfeit':
        return 'Match forfeited on clock expiry!';
      case 'opponent-disconnect-forfeit':
        return 'Opponent forfeited by disconnection (45s window expired).';
      case 'DRAW':
      case 'quiet-plies':
        return 'Draw by repetition / excessive quiet moves.';
      default:
        return 'Game finished.';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-stone-900 via-stone-900 to-black border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-sm sm:max-w-md w-full text-center space-y-4 sm:space-y-6 shadow-2xl">
        {/* Icon Header */}
        <div className="flex justify-center">
          {isDraw ? (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-stone-800 border-2 border-stone-600 flex items-center justify-center text-stone-300">
              <Award className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
          ) : isWinner ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 p-1 shadow-lg shadow-amber-500/30">
              <div className="w-full h-full rounded-full bg-stone-950 flex items-center justify-center text-amber-400">
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
              </div>
            </div>
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-950/80 border-2 border-red-500/40 flex items-center justify-center text-red-400">
              <Frown className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
            {isDraw ? t.games.dama.draw : isWinner ? t.games.dama.wonMatch : t.games.dama.lostMatch}
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">{getReasonText()}</p>
        </div>

        {/* Financial Settlement Breakdown (in PvP mode) */}
        {!isPractice && (
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-stone-950 border border-stone-800 space-y-2 text-xs">
            {totalPotEtb === 0 ? (
              <div className="text-emerald-400 font-bold text-xs">
                Free Friendly Match • 0.00 ETB (No wallet impact)
              </div>
            ) : (
              <>
                <div className="flex justify-between text-stone-400">
                  <span>{t.games.dama.pot}:</span>
                  <span className="font-mono font-bold text-white">{totalPotEtb.toFixed(2)} ETB</span>
                </div>
                {isWinner && (
                  <>
                    <div className="flex justify-between text-stone-500">
                      <span>{t.games.dama.rake}:</span>
                      <span className="font-mono">{rakeEtb.toFixed(2)} ETB</span>
                    </div>
                    <div className="border-t border-stone-800 pt-2 flex justify-between text-emerald-400 font-bold text-sm">
                      <span>Credited to Wallet:</span>
                      <span className="font-mono text-base">+{payoutEtb.toFixed(2)} ETB</span>
                    </div>
                  </>
                )}
                {isDraw && (
                  <div className="border-t border-stone-800 pt-2 text-amber-400 font-bold">
                    Both stakes refunded in full (0% rake on draw).
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-1 sm:pt-2">
          {isPractice && onRestartPractice && (
            <button
              type="button"
              onClick={onRestartPractice}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 min-h-[44px] touch-manipulation"
            >
              <RefreshCw className="w-4 h-4" />
              Practice Again
            </button>
          )}

          <button
            type="button"
            onClick={onReturnToLobby}
            className="flex-1 py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors min-h-[44px] touch-manipulation"
          >
            <Home className="w-4 h-4" />
            Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

