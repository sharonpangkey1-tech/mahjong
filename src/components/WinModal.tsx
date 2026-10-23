/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WinningResult, Player, Tile } from '../types/mahjong';
import { MahjongTile } from './MahjongTile';
import { getTierBadgeBg } from '../lib/mahjongRules';

interface WinModalProps {
  winner: WinningResult;
  players: Player[];
  userSeat: number;
  rpDelta: number;
  onPlayAgain: () => void;
  onOpenStats: () => void;
  onOpenLeaderboard: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({
  winner,
  players,
  userSeat,
  rpDelta,
  onPlayAgain,
  onOpenStats,
  onOpenLeaderboard,
}) => {
  const winningPlayer = players[winner.winnerSeat];
  const isUserWinner = winner.winnerSeat === userSeat;
  const loserPlayer = winner.loserSeat !== null ? players[winner.loserSeat] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#13221b] via-[#0d1813] to-[#070d0a] border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(245,158,11,0.25)] flex flex-col items-center text-center">
        {/* Subtle decorative Chinese banner element */}
        <div className="font-['Cinzel',serif] text-xs uppercase tracking-widest text-amber-400/80 mb-1">
          {winner.winType === 'tsumo' ? '自摸 · Self Draw Win' : '荣和 · Ron Win'}
        </div>

        {/* Large Victory Header */}
        <h2 className="font-['Cinzel',serif] text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200">
          {isUserWinner ? 'VICTORY · MAHJONG!' : `${winningPlayer?.name} WINS!`}
        </h2>

        {/* Winner info line */}
        <div className="mt-3 flex items-center gap-3 text-sm text-emerald-200/90">
          <span className="text-2xl">{winningPlayer?.avatar}</span>
          <span className="font-bold text-white text-base">{winningPlayer?.name}</span>
          <span>·</span>
          <span>
            {winner.winType === 'tsumo'
              ? 'Drew the winning tile from wall'
              : `Won off ${loserPlayer?.name || 'opponent'}'s discard`}
          </span>
        </div>

        {/* Fan & Points Banner */}
        <div className="my-5 px-6 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono tabular-nums">
              {winner.fan}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-amber-400/70 font-semibold">
              Fan / Multiplier
            </div>
          </div>
          <div className="h-8 w-px bg-amber-500/30" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-extrabold text-yellow-300 font-mono tabular-nums">
              {winner.points.toLocaleString()}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-yellow-400/70 font-semibold">
              Hand Points
            </div>
          </div>
          <div className="h-8 w-px bg-amber-500/30" />
          <div className="text-center">
            <div
              className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${
                rpDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {rpDelta >= 0 ? `+${rpDelta}` : rpDelta}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              RP Rating
            </div>
          </div>
        </div>

        {/* Winning Hand Display */}
        <div className="w-full flex flex-col items-center my-2">
          <div className="text-xs text-emerald-300/70 font-medium mb-2">Winning Hand (14 Tiles):</div>
          <div className="flex flex-wrap items-center justify-center gap-1 p-3 rounded-2xl bg-black/40 border border-white/10 max-w-full overflow-x-auto">
            {winner.handTiles.map(t => (
              <MahjongTile key={`win_t_${t.id}`} tile={t} size="sm" showWesternHelper />
            ))}

            {/* Melds if any */}
            {winner.melds.length > 0 && (
              <div className="flex items-center gap-2 pl-2 border-l border-white/20">
                {winner.melds.map((meld, mIdx) => (
                  <div key={`win_m_${mIdx}`} className="flex items-center gap-0.5 bg-black/30 p-1 rounded">
                    {meld.tiles.map((t, tIdx) => (
                      <MahjongTile key={`win_m_${mIdx}_${tIdx}`} tile={t} size="mini" showWesternHelper={false} />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Winning tile indicator */}
            <div className="ml-2 pl-2 border-l-2 border-amber-500/60 flex flex-col items-center">
              <span className="text-[9px] text-amber-300 font-bold mb-0.5">Agari</span>
              <MahjongTile tile={winner.winningTile} size="sm" isWinning showWesternHelper />
            </div>
          </div>
        </div>

        {/* Yaku combinations achieved */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 max-w-lg">
          {winner.yaku.map((yakuName, idx) => (
            <span
              key={`yaku_${idx}`}
              className="text-xs px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 font-medium"
            >
              ✦ {yakuName}
            </span>
          ))}
        </div>

        {/* Actions button strip */}
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={onPlayAgain}
            className="px-6 py-3 rounded-xl font-bold text-sm tracking-wide text-amber-950 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 hover:brightness-110 shadow-lg cursor-pointer transition-all active:scale-95"
          >
            Play Next Round
          </button>
          <button
            onClick={onOpenStats}
            className="px-5 py-3 rounded-xl font-medium text-xs text-slate-200 bg-slate-800/90 hover:bg-slate-700 transition-colors border border-slate-600/50 cursor-pointer"
          >
            View Statistics
          </button>
          <button
            onClick={onOpenLeaderboard}
            className="px-5 py-3 rounded-xl font-medium text-xs text-amber-200 bg-amber-950/40 hover:bg-amber-900/60 transition-colors border border-amber-600/40 cursor-pointer"
          >
            Ranked Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};
