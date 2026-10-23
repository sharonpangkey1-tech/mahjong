/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerStats, RankedTier, LeaderboardEntry, MatchRecord, GameMode, Tile } from '../types/mahjong';
import { getTierFromRp } from './mahjongRules';

const LOCAL_STORAGE_KEY = 'mahjong_player_stats_v1';

const INITIAL_BOT_LEADERBOARD: Omit<LeaderboardEntry, 'rank'>[] = [
  {
    id: 'bot_lin',
    name: 'Master Lin (林大师)',
    avatar: '🐉',
    rp: 4420,
    tier: 'Grandmaster',
    wins: 342,
    winRate: 64.2,
    gamesPlayed: 532,
  },
  {
    id: 'bot_kenji',
    name: 'Kenji Sato (佐藤健)',
    avatar: '🀄',
    rp: 3880,
    tier: 'Master',
    wins: 218,
    winRate: 58.6,
    gamesPlayed: 372,
  },
  {
    id: 'bot_sophia',
    name: 'Sophia Chen (陈苏菲)',
    avatar: '🌸',
    rp: 3340,
    tier: 'Diamond',
    wins: 165,
    winRate: 53.4,
    gamesPlayed: 309,
  },
  {
    id: 'bot_wu',
    name: 'Elder Wu (吴长老)',
    avatar: '🍵',
    rp: 2890,
    tier: 'Platinum',
    wins: 122,
    winRate: 49.8,
    gamesPlayed: 245,
  },
  {
    id: 'bot_jade',
    name: 'Jade Phoenix',
    avatar: '🪶',
    rp: 2610,
    tier: 'Platinum',
    wins: 98,
    winRate: 47.1,
    gamesPlayed: 208,
  },
  {
    id: 'bot_wind',
    name: 'Wind Whisperer',
    avatar: '🌪️',
    rp: 2240,
    tier: 'Gold',
    wins: 76,
    winRate: 44.2,
    gamesPlayed: 172,
  },
  {
    id: 'bot_ryo',
    name: 'Ryo Takahashi',
    avatar: '⚡',
    rp: 1820,
    tier: 'Silver',
    wins: 54,
    winRate: 41.5,
    gamesPlayed: 130,
  },
  {
    id: 'bot_bamboo',
    name: 'Green Bamboo',
    avatar: '🎋',
    rp: 1390,
    tier: 'Bronze',
    wins: 32,
    winRate: 38.0,
    gamesPlayed: 84,
  },
  {
    id: 'bot_novice',
    name: 'Apprentice Mei',
    avatar: '🎏',
    rp: 1050,
    tier: 'Bronze',
    wins: 19,
    winRate: 35.1,
    gamesPlayed: 54,
  },
];

export function getInitialPlayerStats(): PlayerStats {
  return {
    id: 'player_me',
    name: 'Tile Sovereign',
    avatar: '🀄',
    rp: 1500, // Starts at Silver
    tier: 'Silver',
    gamesPlayed: 0,
    wins: 0,
    winRate: 0,
    firstCount: 0,
    secondCount: 0,
    thirdCount: 0,
    fourthCount: 0,
    ronWins: 0,
    tsumoWins: 0,
    highestHandScore: 0,
    currentStreak: 0,
    matchHistory: [],
  };
}

export function loadPlayerStats(): PlayerStats {
  if (typeof window === 'undefined') return getInitialPlayerStats();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Recalculate tier to ensure correctness
      parsed.tier = getTierFromRp(parsed.rp);
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load player stats', e);
  }
  const initial = getInitialPlayerStats();
  savePlayerStats(initial);
  return initial;
}

export function savePlayerStats(stats: PlayerStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save player stats', e);
  }
}

export function updatePlayerProfile(name: string, avatar: string): PlayerStats {
  const current = loadPlayerStats();
  const updated = { ...current, name, avatar };
  savePlayerStats(updated);
  return updated;
}

export function recordMatchFinish(params: {
  mode: GameMode;
  placement: 1 | 2 | 3 | 4;
  handPoints: number;
  winType?: 'ron' | 'tsumo' | 'exhausted' | 'opponent_win';
  winningHand?: Tile[];
  winningYaku?: string[];
  opponents: string[];
}): { updatedStats: PlayerStats; rpDelta: number } {
  const current = loadPlayerStats();

  // Calculate RP Delta based on placement and mode
  let baseRp = 0;
  if (params.placement === 1) baseRp = 65;
  else if (params.placement === 2) baseRp = 20;
  else if (params.placement === 3) baseRp = -15;
  else if (params.placement === 4) baseRp = -40;

  // Bonus for high score hand if 1st place
  if (params.placement === 1 && params.handPoints > 8000) {
    baseRp += Math.min(25, Math.floor(params.handPoints / 2000));
  }

  // Casual mode has less RP swing
  if (params.mode === 'casual_bots') {
    baseRp = Math.round(baseRp * 0.4);
  }

  const newRp = Math.max(100, current.rp + baseRp);
  const newGamesPlayed = current.gamesPlayed + 1;
  const isWin = params.placement === 1;
  const newWins = current.wins + (isWin ? 1 : 0);
  const newWinRate = Math.round((newWins / newGamesPlayed) * 1000) / 10;

  const newStreak = isWin ? current.currentStreak + 1 : 0;
  const newFirstCount = current.firstCount + (params.placement === 1 ? 1 : 0);
  const newSecondCount = current.secondCount + (params.placement === 2 ? 1 : 0);
  const newThirdCount = current.thirdCount + (params.placement === 3 ? 1 : 0);
  const newFourthCount = current.fourthCount + (params.placement === 4 ? 1 : 0);

  const newRonWins = current.ronWins + (params.winType === 'ron' ? 1 : 0);
  const newTsumoWins = current.tsumoWins + (params.winType === 'tsumo' ? 1 : 0);
  const newHighestHand = Math.max(current.highestHandScore, params.handPoints || 0);

  const matchRecord: MatchRecord = {
    id: `match_${Date.now()}`,
    date: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    mode: params.mode,
    placement: params.placement,
    rpDelta: baseRp,
    score: params.handPoints,
    winType: params.winType,
    winningHand: params.winningHand,
    winningYaku: params.winningYaku,
    opponents: params.opponents,
  };

  const updatedStats: PlayerStats = {
    ...current,
    rp: newRp,
    tier: getTierFromRp(newRp),
    gamesPlayed: newGamesPlayed,
    wins: newWins,
    winRate: newWinRate,
    firstCount: newFirstCount,
    secondCount: newSecondCount,
    thirdCount: newThirdCount,
    fourthCount: newFourthCount,
    ronWins: newRonWins,
    tsumoWins: newTsumoWins,
    highestHandScore: newHighestHand,
    currentStreak: newStreak,
    matchHistory: [matchRecord, ...current.matchHistory.slice(0, 29)], // keep last 30
  };

  savePlayerStats(updatedStats);
  return { updatedStats, rpDelta: baseRp };
}

export function getFullLeaderboard(currentStats: PlayerStats): LeaderboardEntry[] {
  // Combine player with top bots
  const playerEntry: Omit<LeaderboardEntry, 'rank'> = {
    id: currentStats.id,
    name: currentStats.name,
    avatar: currentStats.avatar,
    rp: currentStats.rp,
    tier: currentStats.tier,
    wins: currentStats.wins,
    winRate: currentStats.winRate,
    gamesPlayed: currentStats.gamesPlayed,
    isCurrentPlayer: true,
  };

  const all = [...INITIAL_BOT_LEADERBOARD, playerEntry];
  // Sort by RP descending
  all.sort((a, b) => b.rp - a.rp);

  return all.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}
