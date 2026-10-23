/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Tile } from '../types/mahjong';
import { MahjongTile } from './MahjongTile';

interface CompassCenterProps {
  roundWind: 'east' | 'south';
  roundNumber: number;
  activeSeat: number;
  remainingWall: number;
  lastDiscard: { tile: Tile; fromSeat: number } | null;
  seatNames: string[];
  turnTimeLeft?: number;
  maxTurnTime?: number;
}

export const CompassCenter: React.FC<CompassCenterProps> = ({
  roundWind,
  roundNumber,
  activeSeat,
  remainingWall,
  lastDiscard,
  seatNames,
  turnTimeLeft,
  maxTurnTime = 15,
}) => {
  // Seat indices: 0 = Bottom (You), 1 = Right, 2 = Top, 3 = Left
  const windLabels = ['東 (East)', '南 (South)', '西 (West)', '北 (North)'];

  return (
    <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-gradient-to-b from-[#162720] to-[#0d1a15] border-2 border-[#2b4c3e] shadow-[0_12px_32px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.1)] flex flex-col items-center justify-between p-3 select-none">
      {/* Top indicator: Seat 2 (Top) */}
      <div
        className={`text-[11px] font-medium tracking-wide transition-colors ${
          activeSeat === 2 ? 'text-amber-300 font-bold' : 'text-emerald-300/40'
        }`}
      >
        ▲ {seatNames[2] || 'Top'}
      </div>

      {/* Middle row: Left (Seat 3) — Center Dial — Right (Seat 1) */}
      <div className="w-full flex items-center justify-between">
        {/* Left */}
        <div
          className={`text-[11px] font-medium tracking-wide transition-colors ${
            activeSeat === 3 ? 'text-amber-300 font-bold' : 'text-emerald-300/40'
          }`}
        >
          ◀ {seatNames[3] || 'Left'}
        </div>

        {/* Center Round Information & Tile Drop */}
        <div className="flex flex-col items-center justify-center">
          {lastDiscard ? (
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-amber-200/80 mb-1 font-mono tracking-tight">
                {seatNames[lastDiscard.fromSeat]} Discarded:
              </span>
              <div className="scale-90 sm:scale-100 ring-2 ring-amber-400/80 rounded shadow-[0_0_14px_rgba(245,158,11,0.3)]">
                <MahjongTile tile={lastDiscard.tile} size="sm" showWesternHelper />
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="font-['Cinzel',serif] text-xl sm:text-2xl font-black text-amber-300 tracking-wider">
                {roundWind === 'east' ? '東' : '南'}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-emerald-300/60 font-semibold mt-0.5">
                {roundWind === 'east' ? 'East' : 'South'} Round {roundNumber}
              </div>
              <div className="mt-2 text-xs font-mono text-emerald-200/90 font-medium">
                Wall: <span className="text-amber-300 font-bold">{remainingWall}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div
          className={`text-[11px] font-medium tracking-wide transition-colors ${
            activeSeat === 1 ? 'text-amber-300 font-bold' : 'text-emerald-300/40'
          }`}
        >
          {seatNames[1] || 'Right'} ▶
        </div>
      </div>

      {/* Bottom indicator: Seat 0 (You) */}
      <div className="w-full flex flex-col items-center">
        <div
          className={`text-[11px] font-medium tracking-wide transition-colors flex items-center justify-center gap-1.5 ${
            activeSeat === 0 ? 'text-amber-300 font-bold' : 'text-emerald-300/40'
          }`}
        >
          <span>▼ {seatNames[0] || 'You'} {activeSeat === 0 && '(Your Turn)'}</span>
          {activeSeat === 0 && turnTimeLeft !== undefined && (
            <span
              className={`font-mono px-1.5 py-0.2 rounded text-[10px] font-bold ${
                turnTimeLeft <= 5
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 animate-pulse'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              ⏱️ {turnTimeLeft}s
            </span>
          )}
        </div>

        {/* 15s Progress bar */}
        {activeSeat === 0 && turnTimeLeft !== undefined && (
          <div className="w-32 h-1 bg-black/60 rounded-full mt-1 overflow-hidden border border-white/5">
            <div
              className={`h-full transition-all duration-300 ease-linear rounded-full ${
                turnTimeLeft <= 5 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 to-emerald-400'
              }`}
              style={{ width: `${Math.max(0, (turnTimeLeft / maxTurnTime) * 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
