/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Tile } from '../types/mahjong';

interface MahjongTileProps {
  tile?: Tile;
  size?: 'sm' | 'md' | 'lg' | 'mini';
  faceDown?: boolean;
  selected?: boolean;
  isWinning?: boolean;
  isDrawn?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  showWesternHelper?: boolean;
}

export const MahjongTile: React.FC<MahjongTileProps> = ({
  tile,
  size = 'md',
  faceDown = false,
  selected = false,
  isWinning = false,
  isDrawn = false,
  interactive = false,
  onClick,
  onDoubleClick,
  showWesternHelper = true,
}) => {
  // Dimension classes for 3D mahjong tiles
  const sizeClasses = {
    mini: 'w-7 h-9 text-[10px] rounded-[3px]',
    sm: 'w-8 h-11 text-xs rounded-sm',
    md: 'w-10 h-14 text-sm rounded',
    lg: 'w-12 h-17 text-base rounded-md sm:w-14 sm:h-20 sm:text-lg',
  }[size];

  // Face down tile (green jade/bamboo back)
  if (faceDown || !tile) {
    return (
      <div
        className={`${sizeClasses} relative shrink-0 select-none bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 border border-emerald-600/40 shadow-[0_4px_6px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center justify-center overflow-hidden transition-transform`}
      >
        {/* Subtle decorative bamboo line pattern on tile back */}
        <div className="w-full h-full opacity-15 flex flex-col justify-around py-1 px-1 pointer-events-none">
          <div className="h-0.5 bg-emerald-300 rounded-full" />
          <div className="h-0.5 bg-emerald-300 rounded-full" />
          <div className="h-0.5 bg-emerald-300 rounded-full" />
        </div>
      </div>
    );
  }

  // Get color and render details for Chinese glyph
  const renderTileFace = () => {
    switch (tile.suit) {
      case 'characters':
        return (
          <div className="flex flex-col items-center justify-center leading-none text-center font-bold font-['Noto_Serif_SC',serif]">
            <span className="text-red-700 font-black">{tile.kanji[0]}</span>
            <span className="text-red-700 font-black mt-[-1px]">{tile.kanji[1]}</span>
          </div>
        );

      case 'bamboo':
        if (tile.value === 1) {
          // 1 Bamboo is traditionally a sparrow / peacock bird
          return (
            <div className="flex flex-col items-center justify-center leading-none">
              <span className="text-emerald-700 font-extrabold text-lg sm:text-xl">🦚</span>
              <span className="text-[9px] text-emerald-800 font-semibold tracking-tighter mt-[-2px]">1B</span>
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center justify-center leading-none font-bold font-['Noto_Serif_SC',serif]">
            <span className="text-emerald-700 font-black">{tile.kanji[0]}</span>
            <span className="text-emerald-700 font-black mt-[-1px]">{tile.kanji[1]}</span>
          </div>
        );

      case 'dots':
        return (
          <div className="flex flex-col items-center justify-center leading-none font-bold font-['Noto_Serif_SC',serif]">
            <span className="text-blue-800 font-black">{tile.kanji[0]}</span>
            <span className="text-blue-800 font-black mt-[-1px]">{tile.kanji[1]}</span>
          </div>
        );

      case 'winds':
        return (
          <div className="flex items-center justify-center font-black font-['Noto_Serif_SC',serif] text-slate-800 text-lg sm:text-2xl">
            {tile.kanji}
          </div>
        );

      case 'dragons': {
        const color =
          tile.value === 1 ? 'text-red-600' : tile.value === 2 ? 'text-emerald-700' : 'text-slate-800';
        return (
          <div
            className={`flex items-center justify-center font-black font-['Noto_Serif_SC',serif] text-lg sm:text-2xl ${color}`}
          >
            {tile.value === 3 ? (
              // White Dragon is represented by a clean framed rectangle or 白
              <div className="w-5 h-7 border-2 border-slate-700 rounded-sm flex items-center justify-center text-[10px] text-slate-500 font-sans">
                白
              </div>
            ) : (
              tile.kanji
            )}
          </div>
        );
      }
    }
  };

  return (
    <div
      onClick={interactive ? onClick : undefined}
      onDoubleClick={interactive ? onDoubleClick : undefined}
      title={`${tile.label} (${tile.western})`}
      className={`
        ${sizeClasses}
        relative shrink-0 select-none cursor-default
        bg-[#FBF8EF] text-slate-900
        border-t border-l border-white/90 border-r-2 border-b-[3px] border-r-amber-200/60 border-b-amber-300/80
        shadow-[0_4px_6px_rgba(0,0,0,0.35),0_1px_2px_rgba(0,0,0,0.2)]
        flex flex-col items-center justify-between p-1
        transition-all duration-150 ease-out
        ${interactive ? 'cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_8px_14px_rgba(0,0,0,0.45)]' : ''}
        ${selected ? '-translate-y-3.5 ring-2 ring-amber-400 shadow-[0_10px_18px_rgba(245,158,11,0.45)]' : ''}
        ${isWinning ? 'ring-2 ring-emerald-400 bg-amber-50 animate-pulse' : ''}
        ${isDrawn ? 'ml-3 sm:ml-4' : ''}
      `}
    >
      {/* Top row: western helper for instant readability */}
      {showWesternHelper && (
        <div className="w-full flex items-center justify-between text-[9px] sm:text-[10px] font-mono font-bold leading-none text-slate-400 px-0.5 pointer-events-none">
          <span>{tile.western}</span>
          <span className="text-[7px] text-slate-400">🀄</span>
        </div>
      )}

      {/* Main tile face content */}
      <div className="flex-1 flex items-center justify-center pointer-events-none">
        {renderTileFace()}
      </div>

      {/* Bottom subtle edge finish (3D ivory bone look) */}
      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-200/50 to-transparent pointer-events-none" />
    </div>
  );
};
