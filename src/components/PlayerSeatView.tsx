/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Player, Tile, Meld } from '../types/mahjong';
import { MahjongTile } from './MahjongTile';
import { getTierBadgeBg } from '../lib/mahjongRules';

interface PlayerSeatViewProps {
  player: Player;
  isActive: boolean;
  position: 'left' | 'top' | 'right';
  lastDiscardId?: string;
}

export const PlayerSeatView: React.FC<PlayerSeatViewProps> = ({
  player,
  isActive,
  position,
  lastDiscardId,
}) => {
  const tierBg = getTierBadgeBg(player.tier as any);

  // Group discards in rows of 6
  const discardRows: Tile[][] = [];
  for (let i = 0; i < player.discards.length; i += 6) {
    discardRows.push(player.discards.slice(i, i + 6));
  }

  // Position-specific layouts
  if (position === 'top') {
    return (
      <div className="flex flex-col items-center gap-1 select-none">
        {/* Player Header */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full transition-all ${
            isActive
              ? 'bg-amber-500/20 ring-1 ring-amber-400 text-amber-200'
              : 'bg-black/40 text-emerald-100/80 border border-white/5'
          }`}
        >
          <span className="text-base">{player.avatar}</span>
          <span className="text-xs font-semibold max-w-[100px] truncate">{player.name}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded border ${tierBg}`}>
            {player.tier}
          </span>
          <span className="text-xs font-mono text-amber-300 font-bold ml-1">
            {player.rating} RP
          </span>
        </div>

        {/* Top Hand: Concealed Tile Backs + Melds */}
        <div className="flex items-center gap-3">
          {/* Concealed hand */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: player.hand.length }).map((_, i) => (
              <MahjongTile key={`top_tile_${i}`} faceDown size="sm" />
            ))}
          </div>

          {/* Exposed melds */}
          {player.melds.length > 0 && (
            <div className="flex items-center gap-2 pl-2 border-l border-emerald-500/30">
              {player.melds.map((meld, mIdx) => (
                <div key={`top_meld_${mIdx}`} className="flex items-center gap-0.5 bg-black/30 p-0.5 rounded">
                  {meld.tiles.map((t, tIdx) => (
                    <MahjongTile key={`top_m_${mIdx}_${tIdx}`} tile={t} size="mini" showWesternHelper={false} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Discards River */}
        {player.discards.length > 0 && (
          <div className="mt-1 flex flex-col items-center gap-0.5 opacity-90">
            {discardRows.map((row, rIdx) => (
              <div key={`top_row_${rIdx}`} className="flex items-center gap-0.5">
                {row.map(t => (
                  <MahjongTile
                    key={`top_disc_${t.id}`}
                    tile={t}
                    size="mini"
                    selected={t.id === lastDiscardId}
                    showWesternHelper={false}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Left or Right player
  const isRight = position === 'right';

  return (
    <div
      className={`flex flex-col items-center gap-2 select-none ${
        isRight ? 'items-end' : 'items-start'
      }`}
    >
      {/* Player Header */}
      <div
        className={`flex items-center gap-2 px-2.5 py-1 rounded-full transition-all ${
          isActive
            ? 'bg-amber-500/20 ring-1 ring-amber-400 text-amber-200'
            : 'bg-black/40 text-emerald-100/80 border border-white/5'
        }`}
      >
        <span className="text-base">{player.avatar}</span>
        <span className="text-xs font-semibold max-w-[90px] truncate">{player.name}</span>
        <span className={`text-[10px] px-1 py-0.2 rounded border ${tierBg}`}>
          {player.tier}
        </span>
      </div>

      {/* Hand (vertical stack of tile backs) */}
      <div className="flex flex-col gap-0.5">
        <div className="grid grid-cols-2 gap-0.5">
          {Array.from({ length: Math.min(14, player.hand.length) }).map((_, i) => (
            <MahjongTile key={`${position}_tile_${i}`} faceDown size="sm" />
          ))}
        </div>

        {/* Melds */}
        {player.melds.length > 0 && (
          <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-emerald-500/30">
            {player.melds.map((meld, mIdx) => (
              <div key={`${position}_meld_${mIdx}`} className="flex items-center gap-0.5 bg-black/30 p-0.5 rounded">
                {meld.tiles.map((t, tIdx) => (
                  <MahjongTile key={`${position}_m_${mIdx}_${tIdx}`} tile={t} size="mini" showWesternHelper={false} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discards */}
      {player.discards.length > 0 && (
        <div className="flex flex-col gap-0.5 max-w-[120px] opacity-90">
          {discardRows.map((row, rIdx) => (
            <div key={`${position}_row_${rIdx}`} className="flex items-center gap-0.5">
              {row.map(t => (
                <MahjongTile
                  key={`${position}_disc_${t.id}`}
                  tile={t}
                  size="mini"
                  selected={t.id === lastDiscardId}
                  showWesternHelper={false}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
