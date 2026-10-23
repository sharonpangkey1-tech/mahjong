/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TileSuit = 'characters' | 'bamboo' | 'dots' | 'winds' | 'dragons';

export interface Tile {
  id: string; // e.g. characters-1-0
  suit: TileSuit;
  value: number; // 1-9 for numbered suits; 1-4 for winds; 1-3 for dragons
  label: string; // e.g. '1 Character', 'East Wind'
  kanji: string; // e.g. '一萬', '東', '中'
  western: string; // e.g. '1W', 'E', 'Z'
  isHonor: boolean;
  isTerminal: boolean; // 1 or 9 in numbered suits
}

export type MeldType = 'chow' | 'pung' | 'kong';

export interface Meld {
  type: MeldType;
  tiles: Tile[];
  claimedTile: Tile;
  fromSeat: number; // seat index tile was claimed from
}

export interface Player {
  seat: number; // 0: Bottom (Human by default), 1: Right, 2: Top, 3: Left
  name: string;
  isBot: boolean;
  avatar: string;
  rating: number; // RP
  tier: string;
  hand: Tile[];
  melds: Meld[];
  discards: Tile[];
  socketId?: string;
  isReady?: boolean;
}

export type GamePhase =
  | 'idle'
  | 'dealing'
  | 'player_turn'
  | 'reaction_window'
  | 'round_end'
  | 'game_over';

export interface ReactionAction {
  type: 'chow' | 'pung' | 'kong' | 'hu';
  seat: number;
  candidateTiles?: Tile[]; // for chow combinations
}

export interface GameLogEntry {
  id: string;
  seat: number;
  playerName: string;
  playerAvatar: string;
  action: 'discard' | 'auto_discard' | 'chow' | 'pung' | 'kong' | 'hu' | 'draw';
  tile?: Tile;
  description: string;
  timestamp: string;
}

export interface WinningResult {
  winnerSeat: number;
  loserSeat: number | null; // null if tsumo (self-draw)
  winType: 'ron' | 'tsumo';
  points: number;
  fan: number;
  yaku: string[];
  handTiles: Tile[];
  melds: Meld[];
  winningTile: Tile;
}

export interface WaitingTileInfo {
  tile: Tile;
  remainingInWallOrUnknown: number;
  yakuNames: string[];
}

export type GameMode = 'ranked_bots' | 'casual_bots' | 'multiplayer';

export interface MatchRecord {
  id: string;
  date: string;
  mode: GameMode;
  placement: 1 | 2 | 3 | 4;
  rpDelta: number;
  score: number;
  winType?: 'ron' | 'tsumo' | 'exhausted' | 'opponent_win';
  winningHand?: Tile[];
  winningYaku?: string[];
  opponents: string[];
}

export interface PlayerStats {
  id: string;
  name: string;
  avatar: string;
  rp: number;
  tier: RankedTier;
  gamesPlayed: number;
  wins: number;
  winRate: number;
  firstCount: number;
  secondCount: number;
  thirdCount: number;
  fourthCount: number;
  ronWins: number;
  tsumoWins: number;
  highestHandScore: number;
  currentStreak: number;
  matchHistory: MatchRecord[];
}

export type RankedTier =
  | 'Novice'
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Master'
  | 'Grandmaster';

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  rp: number;
  tier: RankedTier;
  wins: number;
  winRate: number;
  gamesPlayed: number;
  isCurrentPlayer?: boolean;
}

export interface ChatMessage {
  id: string;
  senderSeat: number;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface RoomInfo {
  code: string;
  name: string;
  hostSeat: number;
  playersCount: number;
  maxPlayers: number;
  isStarted: boolean;
  gameMode: GameMode;
}
