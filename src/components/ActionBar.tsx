/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Tile } from '../types/mahjong';
import { MahjongTile } from './MahjongTile';

interface ActionBarProps {
  canHu: boolean;
  canPung: boolean;
  canKong: boolean;
  canChow: boolean;
  chowCandidates: Tile[][];
  targetTile?: Tile;
  onHu: () => void;
  onPung: () => void;
  onKong: () => void;
  onChow: (pair: Tile[]) => void;
  onPass: () => void;
  durationMs?: number;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  canHu,
  canPung,
  canKong,
  canChow,
  chowCandidates,
  targetTile,
  onHu,
  onPung,
  onKong,
  onChow,
  onPass,
  durationMs = 6000,
}) => {
  const [timeLeft, setTimeLeft] = useState(durationMs);
  const [chowSelectionOpen, setChowSelectionOpen] = useState(false);

  useEffect(() => {
    setTimeLeft(durationMs);
    const interval = 100;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= interval) {
          clearInterval(timer);
          onPass();
          return 0;
        }
        return prev - interval;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [durationMs, onPass]);

  const progressPercent = (timeLeft / durationMs) * 100;

  return (
    <div className="fixed bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 select-none animate-in fade-in zoom-in-95 duration-200">
      {/* Chow candidates selector dropdown if open */}
      {chowSelectionOpen && chowCandidates.length > 0 && targetTile && (
        <div className="bg-slate-900/95 border border-amber-500/50 rounded-xl p-3 shadow-2xl flex flex-col items-center gap-2 backdrop-blur-md">
          <div className="text-xs font-semibold text-amber-200">Select Chow Run:</div>
          <div className="flex items-center gap-3">
            {chowCandidates.map((pair, idx) => {
              const fullRun = [...pair, targetTile].sort((a, b) => a.value - b.value);
              return (
                <button
                  key={`chow_opt_${idx}`}
                  onClick={() => {
                    setChowSelectionOpen(false);
                    onChow(pair);
                  }}
                  className="flex items-center gap-1 p-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 transition-transform hover:scale-105 cursor-pointer"
                >
                  {fullRun.map(t => (
                    <MahjongTile key={`run_${idx}_${t.id}`} tile={t} size="sm" showWesternHelper={false} />
                  ))}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Action Bar */}
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#091510]/95 border-2 border-amber-500/60 shadow-[0_12px_36px_rgba(0,0,0,0.8)] backdrop-blur-md">
        {/* Ron / Hu button */}
        {canHu && (
          <button
            onClick={onHu}
            className="px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide text-amber-950 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.6)] cursor-pointer transition-all transform active:scale-95 animate-pulse"
          >
            🀄 HU / WIN!
          </button>
        )}

        {/* Kong button */}
        {canKong && (
          <button
            onClick={onKong}
            className="px-4 py-2.5 rounded-xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 shadow-md cursor-pointer transition-all active:scale-95 border border-purple-400/40"
          >
            KONG (槓)
          </button>
        )}

        {/* Pung button */}
        {canPung && (
          <button
            onClick={onPung}
            className="px-4 py-2.5 rounded-xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-md cursor-pointer transition-all active:scale-95 border border-emerald-400/40"
          >
            PUNG (碰)
          </button>
        )}

        {/* Chow button */}
        {canChow && (
          <button
            onClick={() => {
              if (chowCandidates.length === 1) {
                onChow(chowCandidates[0]);
              } else {
                setChowSelectionOpen(prev => !prev);
              }
            }}
            className="px-4 py-2.5 rounded-xl font-bold text-sm tracking-wide text-white bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 shadow-md cursor-pointer transition-all active:scale-95 border border-cyan-400/40"
          >
            CHOW (吃)
          </button>
        )}

        {/* Pass button */}
        <button
          onClick={onPass}
          className="px-4 py-2.5 rounded-xl font-medium text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors border border-slate-600/50 cursor-pointer"
        >
          Pass ({Math.ceil(timeLeft / 1000)}s)
        </button>
      </div>

      {/* Progress timer bar */}
      <div className="w-full max-w-[280px] h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-100 ease-linear rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
