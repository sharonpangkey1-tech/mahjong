/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlayerStats } from '../types/mahjong';
import { MahjongTile } from './MahjongTile';
import { getTierBadgeBg } from '../lib/mahjongRules';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  onUpdateProfile: (name: string, avatar: string) => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onUpdateProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(stats.name);
  const [avatar, setAvatar] = useState(stats.avatar);

  if (!isOpen) return null;

  const AVATARS = ['🀄', '🐉', '🌸', '🍵', '🪶', '⚡', '🎋', '🎏', '👑', '🦁', '🦊', '🎋'];

  const handleSave = () => {
    onUpdateProfile(name.trim() || 'Tile Sovereign', avatar);
    setIsEditing(false);
  };

  const tierBg = getTierBadgeBg(stats.tier);
  const total = Math.max(1, stats.gamesPlayed);
  const p1Rate = Math.round((stats.firstCount / total) * 100);
  const p2Rate = Math.round((stats.secondCount / total) * 100);
  const p3Rate = Math.round((stats.thirdCount / total) * 100);
  const p4Rate = Math.round((stats.fourthCount / total) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-gradient-to-b from-[#13221b] to-[#0a1410] border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-['Cinzel',serif] text-xl font-bold text-amber-200">
              Player Profile & Career Statistics
            </h2>
            <div className="text-xs text-emerald-300/60 mt-0.5">
              Ranked combat performance, winning distributions, and match records
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {/* Profile Card */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl p-2 rounded-2xl bg-emerald-950 border border-emerald-500/30">
                {stats.avatar}
              </span>
              <div>
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="px-2.5 py-1 text-sm bg-slate-900 border border-amber-400/60 rounded text-white font-medium"
                      placeholder="Player Name"
                    />
                    <div className="flex items-center gap-1">
                      {AVATARS.map(av => (
                        <button
                          key={av}
                          onClick={() => setAvatar(av)}
                          className={`w-7 h-7 text-sm rounded flex items-center justify-center cursor-pointer ${
                            avatar === av ? 'bg-amber-500/40 border border-amber-400' : 'bg-slate-800'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{stats.name}</span>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-[11px] text-amber-400/80 hover:text-amber-300 cursor-pointer underline"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${tierBg}`}>
                        {stats.tier}
                      </span>
                      <span className="text-xs font-mono text-amber-300 font-bold">
                        {stats.rp} RP
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 text-xs font-bold bg-amber-400 text-slate-950 rounded hover:brightness-110 cursor-pointer"
                >
                  Save Profile
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-center">
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {stats.gamesPlayed}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 mt-1">
                Matches Played
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-center">
              <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {stats.wins}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 mt-1">
                Total Wins (Hu)
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-center">
              <div className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
                {stats.winRate}%
              </div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 mt-1">
                Win Rate
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-center">
              <div className="text-2xl font-bold font-mono text-yellow-300 tabular-nums">
                {stats.highestHandScore.toLocaleString()}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 mt-1">
                Max Hand Score
              </div>
            </div>
          </div>

          {/* Placement Distribution */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10">
            <div className="text-xs font-semibold text-emerald-200 mb-3">
              Placement Distribution
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="flex flex-col items-center">
                <span className="text-yellow-400 font-bold mb-1">1st Place</span>
                <span className="font-mono text-white text-base font-semibold">{stats.firstCount}</span>
                <span className="text-[11px] text-slate-400 font-mono">({p1Rate}%)</span>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-yellow-400" style={{ width: `${p1Rate}%` }} />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-slate-300 font-bold mb-1">2nd Place</span>
                <span className="font-mono text-white text-base font-semibold">{stats.secondCount}</span>
                <span className="text-[11px] text-slate-400 font-mono">({p2Rate}%)</span>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-slate-300" style={{ width: `${p2Rate}%` }} />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-amber-600 font-bold mb-1">3rd Place</span>
                <span className="font-mono text-white text-base font-semibold">{stats.thirdCount}</span>
                <span className="text-[11px] text-slate-400 font-mono">({p3Rate}%)</span>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-amber-600" style={{ width: `${p3Rate}%` }} />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-slate-500 font-bold mb-1">4th Place</span>
                <span className="font-mono text-white text-base font-semibold">{stats.fourthCount}</span>
                <span className="text-[11px] text-slate-400 font-mono">({p4Rate}%)</span>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-slate-600" style={{ width: `${p4Rate}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-around text-xs text-slate-300">
              <div>
                Ron Wins: <span className="text-amber-300 font-bold font-mono">{stats.ronWins}</span>
              </div>
              <div>
                Tsumo (Self-Draw) Wins: <span className="text-emerald-400 font-bold font-mono">{stats.tsumoWins}</span>
              </div>
              <div>
                Current Streak: <span className="text-white font-bold font-mono">{stats.currentStreak} 🔥</span>
              </div>
            </div>
          </div>

          {/* Match History */}
          <div>
            <div className="text-xs font-semibold text-emerald-200 mb-2">
              Recent Matches ({stats.matchHistory.length})
            </div>
            {stats.matchHistory.length === 0 ? (
              <div className="p-6 rounded-xl bg-black/30 border border-white/5 text-center text-xs text-slate-400">
                No matches recorded yet. Play a ranked match against bots or in multiplayer to populate your history!
              </div>
            ) : (
              <div className="space-y-2">
                {stats.matchHistory.map(record => (
                  <div
                    key={record.id}
                    className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                          record.placement === 1
                            ? 'bg-amber-400 text-slate-950'
                            : record.placement === 2
                            ? 'bg-slate-300 text-slate-900'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        #{record.placement}
                      </span>
                      <div>
                        <div className="text-white font-medium flex items-center gap-2">
                          <span className="capitalize">{record.mode.replace('_', ' ')}</span>
                          <span className="text-slate-400 text-[10px]">· {record.date}</span>
                        </div>
                        {record.winningYaku && record.winningYaku.length > 0 && (
                          <div className="text-[10px] text-emerald-300/80 mt-0.5">
                            {record.winningYaku.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center font-mono">
                      <div className="text-right">
                        <div className="text-white font-bold">{record.score.toLocaleString()} pts</div>
                        <div
                          className={`text-[11px] font-semibold ${
                            record.rpDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {record.rpDelta >= 0 ? `+${record.rpDelta}` : record.rpDelta} RP
                        </div>
                      </div>

                      {/* Mini hand preview if won */}
                      {record.winningHand && record.winningHand.length > 0 && (
                        <div className="hidden md:flex items-center gap-0.5 p-1 bg-black/30 rounded border border-white/5">
                          {record.winningHand.slice(0, 7).map(t => (
                            <MahjongTile key={`rec_${record.id}_${t.id}`} tile={t} size="mini" showWesternHelper={false} />
                          ))}
                          <span className="text-[9px] text-slate-500 px-1">...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
