/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LeaderboardEntry, PlayerStats, RankedTier } from '../types/mahjong';
import { getTierBadgeBg } from '../lib/mahjongRules';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderboard: LeaderboardEntry[];
  currentStats: PlayerStats;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  leaderboard,
  currentStats,
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'tiers'>('leaderboard');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredEntries = leaderboard.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const TIERS: { name: RankedTier; minRp: number; badgeColor: string; description: string }[] = [
    { name: 'Grandmaster', minRp: 4000, badgeColor: 'text-amber-300 border-amber-500/50 bg-amber-950/80', description: 'Legendary masters of Mahjong pavilion' },
    { name: 'Master', minRp: 3500, badgeColor: 'text-rose-400 border-rose-500/50 bg-rose-950/80', description: 'Elite tactical strategists with consistent high fan' },
    { name: 'Diamond', minRp: 3000, badgeColor: 'text-cyan-300 border-cyan-500/50 bg-cyan-950/80', description: 'Experienced competitors with advanced defense' },
    { name: 'Platinum', minRp: 2500, badgeColor: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/80', description: 'Solid players with high Tenpai speed' },
    { name: 'Gold', minRp: 2000, badgeColor: 'text-yellow-400 border-yellow-500/50 bg-yellow-950/80', description: 'Skilled players reading discard rivers' },
    { name: 'Silver', minRp: 1500, badgeColor: 'text-slate-200 border-slate-400/50 bg-slate-800/80', description: 'Starting competitive tier for regular players' },
    { name: 'Bronze', minRp: 1000, badgeColor: 'text-amber-500 border-amber-700/50 bg-amber-950/60', description: 'Developing players learning tile efficiencies' },
    { name: 'Novice', minRp: 0, badgeColor: 'text-slate-400 border-slate-700 bg-slate-900/60', description: 'Newcomers to the game' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-gradient-to-b from-[#13221b] to-[#0a1410] border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-['Cinzel',serif] text-xl font-bold text-amber-200">
              Ranked Leaderboard & Tiers
            </h2>
            <div className="text-xs text-emerald-300/60 mt-0.5">
              Seasonal ELO rankings and championship ladder
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-5 pt-3 flex items-center gap-2 border-b border-white/5">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-emerald-950/80 text-amber-300 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Global Rankings
          </button>
          <button
            onClick={() => setActiveTab('tiers')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
              activeTab === 'tiers'
                ? 'bg-emerald-950/80 text-amber-300 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tier Ladder Structure
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'leaderboard' ? (
            <div>
              {/* Search bar */}
              <div className="mb-4 flex items-center justify-between gap-4">
                <input
                  type="text"
                  placeholder="Search player name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full max-w-xs px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <div className="text-xs text-emerald-300/80">
                  Your Rank: <span className="font-bold text-amber-300 font-mono">#{leaderboard.find(e => e.isCurrentPlayer)?.rank || '-'}</span> · <span className="font-mono text-white">{currentStats.rp} RP</span>
                </div>
              </div>

              {/* Table */}
              <div className="w-full overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-black/50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                      <th className="py-2.5 px-3">Player</th>
                      <th className="py-2.5 px-3">Tier</th>
                      <th className="py-2.5 px-3 text-right">RP</th>
                      <th className="py-2.5 px-3 text-right">Wins</th>
                      <th className="py-2.5 px-3 text-right">Win Rate</th>
                      <th className="py-2.5 px-3 text-right">Matches</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {filteredEntries.map(entry => {
                      const isMe = entry.isCurrentPlayer;
                      const tierBg = getTierBadgeBg(entry.tier);
                      return (
                        <tr
                          key={entry.id}
                          className={`transition-colors ${
                            isMe
                              ? 'bg-amber-500/15 font-semibold text-white'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            {entry.rank === 1 ? (
                              <span className="text-yellow-400 text-sm">🥇</span>
                            ) : entry.rank === 2 ? (
                              <span className="text-slate-300 text-sm">🥈</span>
                            ) : entry.rank === 3 ? (
                              <span className="text-amber-600 text-sm">🥉</span>
                            ) : (
                              <span>#{entry.rank}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-sans font-medium flex items-center gap-2">
                            <span className="text-base">{entry.avatar}</span>
                            <span className={isMe ? 'text-amber-200 font-bold' : 'text-slate-100'}>
                              {entry.name}
                            </span>
                            {isMe && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 border border-amber-400/40">
                                YOU
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <span className={`text-[10px] px-2 py-0.5 rounded border ${tierBg}`}>
                              {entry.tier}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-amber-300 font-bold">
                            {entry.rp.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-300 font-semibold">
                            {entry.wins}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-200">
                            {entry.winRate}%
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-400">
                            {entry.gamesPlayed}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TIERS.map(t => (
                <div
                  key={t.name}
                  className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${t.badgeColor}`}>
                        {t.name}
                      </span>
                      <span className="text-xs font-mono text-amber-300 font-semibold">
                        {t.minRp}+ RP
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-2 font-sans">
                      {t.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
