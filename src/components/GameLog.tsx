/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameLogEntry } from '../types/mahjong';
import { MahjongTile } from './MahjongTile';

interface GameLogProps {
  entries: GameLogEntry[];
}

export const GameLog: React.FC<GameLogProps> = ({ entries }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Take the last 5 actions, latest on top
  const recentEntries = [...entries].slice(-5).reverse();

  const getActionBadge = (action: GameLogEntry['action']) => {
    switch (action) {
      case 'hu':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400 text-slate-950 border border-amber-300 animate-pulse">
            🀄 HU WIN
          </span>
        );
      case 'pung':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            碰 PUNG
          </span>
        );
      case 'chow':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            吃 CHOW
          </span>
        );
      case 'kong':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            槓 KONG
          </span>
        );
      case 'auto_discard':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            ⏱️ AUTO
          </span>
        );
      case 'discard':
      default:
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-800 text-slate-300 border border-white/5">
            DISCARD
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-sm rounded-xl bg-[#091711]/90 border border-emerald-500/30 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden select-none transition-all">
      {/* Header */}
      <div className="px-3 py-1.5 bg-black/40 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">📜</span>
          <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider">
            Game Log (Last 5)
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(prev => !prev)}
          className="text-[10px] text-emerald-300/70 hover:text-emerald-200 transition-colors px-1 py-0.5 rounded cursor-pointer"
        >
          {isCollapsed ? 'Show ▲' : 'Hide ▼'}
        </button>
      </div>

      {/* List */}
      {!isCollapsed && (
        <div className="p-1.5 divide-y divide-white/5 space-y-1">
          {recentEntries.length === 0 ? (
            <div className="py-2 text-center text-[10px] text-slate-500 italic">
              Awaiting first tile action...
            </div>
          ) : (
            recentEntries.map((entry, index) => {
              const isLatest = index === 0;
              return (
                <div
                  key={entry.id}
                  className={`pt-1 flex items-center justify-between gap-2 px-1.5 py-1 rounded transition-colors ${
                    isLatest ? 'bg-amber-500/10' : 'hover:bg-white/5'
                  }`}
                >
                  {/* Left: Player Avatar + Name + Action */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs shrink-0">{entry.playerAvatar}</span>
                    <span className="text-[11px] font-medium text-white truncate max-w-[85px] sm:max-w-[100px]">
                      {entry.playerName}
                    </span>
                    {getActionBadge(entry.action)}
                  </div>

                  {/* Right: Tile Preview + Label */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {entry.tile && (
                      <div className="scale-75 origin-right">
                        <MahjongTile tile={entry.tile} size="mini" showWesternHelper={false} />
                      </div>
                    )}
                    <span className="text-[10px] font-mono text-emerald-200 font-semibold">
                      {entry.tile ? entry.tile.western : entry.description}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
