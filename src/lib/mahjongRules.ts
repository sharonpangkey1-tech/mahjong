/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tile, TileSuit, Meld, WinningResult, WaitingTileInfo, RankedTier } from '../types/mahjong';

// Chinese number kanji for characters suit
const NUM_KANJI = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const WINDS_KANJI = ['', '東', '南', '西', '北'];
const WINDS_NAMES = ['', 'East', 'South', 'West', 'North'];
const WINDS_WESTERN = ['', 'E', 'S', 'W', 'N'];
const DRAGONS_KANJI = ['', '中', '發', '白'];
const DRAGONS_NAMES = ['', 'Red Dragon', 'Green Dragon', 'White Dragon'];
const DRAGONS_WESTERN = ['', 'Z', 'F', 'B'];

export function createFullDeck(): Tile[] {
  const deck: Tile[] = [];

  // 1. Characters (萬 / Wan / Craks) 1-9 x 4
  for (let val = 1; val <= 9; val++) {
    for (let c = 0; c < 4; c++) {
      deck.push({
        id: `characters-${val}-${c}`,
        suit: 'characters',
        value: val,
        label: `${val} Character`,
        kanji: `${NUM_KANJI[val]}萬`,
        western: `${val}W`,
        isHonor: false,
        isTerminal: val === 1 || val === 9,
      });
    }
  }

  // 2. Bamboo (條 / Sou / Bams) 1-9 x 4
  for (let val = 1; val <= 9; val++) {
    for (let c = 0; c < 4; c++) {
      deck.push({
        id: `bamboo-${val}-${c}`,
        suit: 'bamboo',
        value: val,
        label: `${val} Bamboo`,
        kanji: val === 1 ? '鳥' : `${NUM_KANJI[val]}條`,
        western: `${val}B`,
        isHonor: false,
        isTerminal: val === 1 || val === 9,
      });
    }
  }

  // 3. Dots (筒 / Pin) 1-9 x 4
  for (let val = 1; val <= 9; val++) {
    for (let c = 0; c < 4; c++) {
      deck.push({
        id: `dots-${val}-${c}`,
        suit: 'dots',
        value: val,
        label: `${val} Dot`,
        kanji: `${NUM_KANJI[val]}筒`,
        western: `${val}D`,
        isHonor: false,
        isTerminal: val === 1 || val === 9,
      });
    }
  }

  // 4. Winds 1-4 x 4 (East, South, West, North)
  for (let val = 1; val <= 4; val++) {
    for (let c = 0; c < 4; c++) {
      deck.push({
        id: `winds-${val}-${c}`,
        suit: 'winds',
        value: val,
        label: `${WINDS_NAMES[val]} Wind`,
        kanji: WINDS_KANJI[val],
        western: WINDS_WESTERN[val],
        isHonor: true,
        isTerminal: false,
      });
    }
  }

  // 5. Dragons 1-3 x 4 (Red, Green, White)
  for (let val = 1; val <= 3; val++) {
    for (let c = 0; c < 4; c++) {
      deck.push({
        id: `dragons-${val}-${c}`,
        suit: 'dragons',
        value: val,
        label: DRAGONS_NAMES[val],
        kanji: DRAGONS_KANJI[val],
        western: DRAGONS_WESTERN[val],
        isHonor: true,
        isTerminal: false,
      });
    }
  }

  return deck;
}

// Fisher-Yates shuffle
export function shuffleDeck(deck: Tile[]): Tile[] {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Tile comparator for sorting hands
export function compareTiles(a: Tile, b: Tile): number {
  const suitOrder: Record<TileSuit, number> = {
    characters: 1,
    bamboo: 2,
    dots: 3,
    winds: 4,
    dragons: 5,
  };

  if (suitOrder[a.suit] !== suitOrder[b.suit]) {
    return suitOrder[a.suit] - suitOrder[b.suit];
  }
  return a.value - b.value;
}

export function sortHand(hand: Tile[]): Tile[] {
  return [...hand].sort(compareTiles);
}

export function areTilesSameType(a: Tile, b: Tile): boolean {
  return a.suit === b.suit && a.value === b.value;
}

// Check if player has 2 or more of the same tile (can Pung)
export function checkPung(hand: Tile[], tile: Tile): boolean {
  const count = hand.filter(t => areTilesSameType(t, tile)).length;
  return count >= 2;
}

// Check if player has 3 or more of same tile (can Kong on discard)
export function checkKong(hand: Tile[], tile: Tile): boolean {
  const count = hand.filter(t => areTilesSameType(t, tile)).length;
  return count >= 3;
}

// Check if hand has a concealed quad (4 identical tiles)
export function checkConcealedKong(hand: Tile[]): Tile | null {
  const freq: Record<string, { count: number; tile: Tile }> = {};
  for (const t of hand) {
    const key = `${t.suit}-${t.value}`;
    if (!freq[key]) freq[key] = { count: 0, tile: t };
    freq[key].count++;
    if (freq[key].count === 4) {
      return freq[key].tile;
    }
  }
  return null;
}

// Check if player can Chow (consecutive 3 in same numbered suit)
// Returns list of 2-tile tuples in hand that can form a chow with the target tile
export function checkChowCandidates(hand: Tile[], tile: Tile): Tile[][] {
  if (tile.suit === 'winds' || tile.suit === 'dragons') {
    return [];
  }

  const v = tile.value;
  const s = tile.suit;
  const candidates: Tile[][] = [];

  const findTile = (val: number): Tile | undefined => {
    return hand.find(t => t.suit === s && t.value === val);
  };

  // Option 1: [v-2, v-1, v]
  if (v >= 3) {
    const t1 = findTile(v - 2);
    const t2 = findTile(v - 1);
    if (t1 && t2) candidates.push([t1, t2]);
  }

  // Option 2: [v-1, v, v+1]
  if (v >= 2 && v <= 8) {
    const t1 = findTile(v - 1);
    const t2 = findTile(v + 1);
    if (t1 && t2) candidates.push([t1, t2]);
  }

  // Option 3: [v, v+1, v+2]
  if (v <= 7) {
    const t1 = findTile(v + 1);
    const t2 = findTile(v + 2);
    if (t1 && t2) candidates.push([t1, t2]);
  }

  return candidates;
}

// Key for grouping tiles by type
function getTileTypeKey(t: Tile): string {
  return `${t.suit}:${t.value}`;
}

// Core partition solver: checks if hand counts can be partitioned into sets of 3 (triplets or runs)
function canPartitionMelds(counts: Record<string, number>): boolean {
  // Find first tile with positive count
  let firstKey: string | null = null;
  for (const k of Object.keys(counts)) {
    if (counts[k] > 0) {
      firstKey = k;
      break;
    }
  }

  // Base case: all tiles partitioned
  if (!firstKey) return true;

  const [suit, valStr] = firstKey.split(':');
  const val = parseInt(valStr, 10);

  // Try triplet
  if (counts[firstKey] >= 3) {
    counts[firstKey] -= 3;
    if (canPartitionMelds(counts)) {
      counts[firstKey] += 3;
      return true;
    }
    counts[firstKey] += 3;
  }

  // Try sequence (chow) if numbered suit
  if (suit !== 'winds' && suit !== 'dragons' && val <= 7) {
    const k2 = `${suit}:${val + 1}`;
    const k3 = `${suit}:${val + 2}`;
    if ((counts[k2] || 0) > 0 && (counts[k3] || 0) > 0) {
      counts[firstKey]--;
      counts[k2]--;
      counts[k3]--;
      if (canPartitionMelds(counts)) {
        counts[firstKey]++;
        counts[k2]++;
        counts[k3]++;
        return true;
      }
      counts[firstKey]++;
      counts[k2]++;
      counts[k3]++;
    }
  }

  return false;
}

// Checks if 14 tiles (hand + added tile) is a valid Mahjong win
export function evaluateHandWin(
  hand: Tile[],
  melds: Meld[],
  winningTile: Tile,
  isTsumo: boolean,
  roundWind: 'east' | 'south' = 'east',
  seatWind: 'east' | 'south' | 'west' | 'north' = 'east'
): { isWin: boolean; yaku: string[]; fan: number; points: number } {
  const allTiles = [...hand, winningTile];
  // Hand must be 14 tiles minus 3 for each exposed meld
  const targetCount = 14 - melds.length * 3;
  if (allTiles.length !== targetCount) {
    return { isWin: false, yaku: [], fan: 0, points: 0 };
  }

  const freq: Record<string, number> = {};
  for (const t of allTiles) {
    const key = getTileTypeKey(t);
    freq[key] = (freq[key] || 0) + 1;
  }

  let isStandardWin = false;
  let isSevenPairs = false;

  // Check Seven Pairs (only if 0 melds and 14 tiles)
  if (melds.length === 0 && allTiles.length === 14) {
    const keys = Object.keys(freq);
    if (keys.length === 7 && keys.every(k => freq[k] === 2)) {
      isSevenPairs = true;
    }
  }

  // Check Standard 4 melds + 1 pair
  if (!isSevenPairs) {
    const keys = Object.keys(freq);
    for (const eyeKey of keys) {
      if (freq[eyeKey] >= 2) {
        // Try eyeKey as pair
        freq[eyeKey] -= 2;
        if (canPartitionMelds(freq)) {
          isStandardWin = true;
          freq[eyeKey] += 2;
          break;
        }
        freq[eyeKey] += 2;
      }
    }
  }

  if (!isStandardWin && !isSevenPairs) {
    return { isWin: false, yaku: [], fan: 0, points: 0 };
  }

  // Calculate Yaku & Fan
  const yaku: string[] = [];
  let fan = 1; // Base winning hand (Chicken Hand / Tanyao / Pinghu)

  if (isTsumo) {
    yaku.push('Self-Draw (Tsumo)');
    fan += 1;
  }

  if (melds.length === 0) {
    yaku.push('Concealed Hand (Menzenchin)');
    fan += 1;
  }

  if (isSevenPairs) {
    yaku.push('Seven Pairs (Chiitoitsu)');
    fan += 2;
  }

  // Check All Simples (Tanyao - no terminals 1,9 and no honors)
  const hasTerminalsOrHonors =
    allTiles.some(t => t.isTerminal || t.isHonor) ||
    melds.some(m => m.tiles.some(t => t.isTerminal || t.isHonor));
  if (!hasTerminalsOrHonors) {
    yaku.push('All Simples (Tanyao)');
    fan += 1;
  }

  // Check Half Flush (Honitsu: 1 suit + honors) / Full Flush (Chinitsu: 1 suit only)
  const suitsPresent = new Set<TileSuit>();
  let hasHonors = false;
  for (const t of allTiles) {
    if (t.isHonor) hasHonors = true;
    else suitsPresent.add(t.suit);
  }
  for (const m of melds) {
    for (const t of m.tiles) {
      if (t.isHonor) hasHonors = true;
      else suitsPresent.add(t.suit);
    }
  }

  if (suitsPresent.size === 1) {
    if (hasHonors) {
      yaku.push('Half Flush (Honitsu)');
      fan += 3;
    } else {
      yaku.push('Pure Full Flush (Chinitsu)');
      fan += 6;
    }
  }

  // Check Dragon Triplet
  const dragonsPresent = ['dragons:1', 'dragons:2', 'dragons:3'];
  for (const dKey of dragonsPresent) {
    const dVal = parseInt(dKey.split(':')[1], 10);
    const inMelds = melds.some(m => m.type !== 'chow' && m.tiles[0]?.suit === 'dragons' && m.tiles[0]?.value === dVal);
    const inHandCount = freq[dKey] || 0;
    if (inMelds || inHandCount >= 3) {
      yaku.push(`${DRAGONS_NAMES[dVal]} Triplet`);
      fan += 1;
    }
  }

  // Check All Triplets (Toitoi)
  const meldsAllTriplets = melds.every(m => m.type === 'pung' || m.type === 'kong');
  if (meldsAllTriplets && isStandardWin) {
    // If all remaining sets in hand are triplets
    const nonPairCounts = Object.entries(freq).filter(([, c]) => c === 3);
    if (nonPairCounts.length + melds.length === 4) {
      yaku.push('All Triplets (Toi-Toi)');
      fan += 2;
    }
  }

  if (yaku.length === 0) {
    yaku.push('Standard Mahjong (Peace Hand)');
  }

  // Standard Mahjong points formula: base 1000 * 2^(fan - 1), capped nicely
  const points = Math.min(32000, 1000 * Math.pow(2, Math.max(1, fan - 1)));

  return {
    isWin: true,
    yaku,
    fan,
    points,
  };
}

// Helper to find all waiting tiles (Tenpai) for a 13-tile hand (or 13 - melds*3)
export function calculateWaitingTiles(
  hand: Tile[],
  melds: Meld[],
  fullKnownPool: Tile[]
): WaitingTileInfo[] {
  const targetCount = 13 - melds.length * 3;
  if (hand.length !== targetCount) return [];

  // Generate 1 of each of 34 unique tile types to test
  const testTiles: Tile[] = [];
  // Numbered suits 1-9
  const suits: TileSuit[] = ['characters', 'bamboo', 'dots'];
  for (const s of suits) {
    for (let v = 1; v <= 9; v++) {
      testTiles.push({
        id: `test-${s}-${v}`,
        suit: s,
        value: v,
        label: `${v} ${s}`,
        kanji: s === 'bamboo' && v === 1 ? '鳥' : `${NUM_KANJI[v]}`,
        western: `${v}${s[0].toUpperCase()}`,
        isHonor: false,
        isTerminal: v === 1 || v === 9,
      });
    }
  }
  // Winds 1-4
  for (let v = 1; v <= 4; v++) {
    testTiles.push({
      id: `test-winds-${v}`,
      suit: 'winds',
      value: v,
      label: `${WINDS_NAMES[v]} Wind`,
      kanji: WINDS_KANJI[v],
      western: WINDS_WESTERN[v],
      isHonor: true,
      isTerminal: false,
    });
  }
  // Dragons 1-3
  for (let v = 1; v <= 3; v++) {
    testTiles.push({
      id: `test-dragons-${v}`,
      suit: 'dragons',
      value: v,
      label: DRAGONS_NAMES[v],
      kanji: DRAGONS_KANJI[v],
      western: DRAGONS_WESTERN[v],
      isHonor: true,
      isTerminal: false,
    });
  }

  const results: WaitingTileInfo[] = [];

  for (const testTile of testTiles) {
    const winResult = evaluateHandWin(hand, melds, testTile, false);
    if (winResult.isWin) {
      // Count how many copies of this tile type are already visible in hand, melds, or discards
      const seenCount = fullKnownPool.filter(t => areTilesSameType(t, testTile)).length;
      const remaining = Math.max(0, 4 - seenCount);

      results.push({
        tile: testTile,
        remainingInWallOrUnknown: remaining,
        yakuNames: winResult.yaku,
      });
    }
  }

  return results;
}

// Bot AI: evaluates which tile to discard from 14 tiles
export function chooseBotDiscard(hand: Tile[], melds: Meld[]): Tile {
  if (hand.length === 0) throw new Error('Empty hand');

  // Score each tile: higher score = better to keep; lowest score = best to discard
  const scores = hand.map(tile => {
    let score = 0;

    // Check how many exact duplicates exist in hand
    const matchCount = hand.filter(t => t.id !== tile.id && areTilesSameType(t, tile)).length;
    if (matchCount === 2) score += 60; // triplet in hand!
    else if (matchCount === 1) score += 35; // pair in hand!

    // If numbered suit, check adjacent neighbors for chow potential
    if (!tile.isHonor) {
      const v = tile.value;
      const s = tile.suit;
      const hasMinus1 = hand.some(t => t.suit === s && t.value === v - 1);
      const hasPlus1 = hand.some(t => t.suit === s && t.value === v + 1);
      const hasMinus2 = hand.some(t => t.suit === s && t.value === v - 2);
      const hasPlus2 = hand.some(t => t.suit === s && t.value === v + 2);

      // Open-ended wait (e.g. 4-5)
      if (hasMinus1 && hasPlus1) score += 40;
      else if (hasMinus1 || hasPlus1) score += 25;

      // Inside wait (e.g. 3 and 5)
      if (hasMinus2 || hasPlus2) score += 12;

      // Central tiles (3-7) are more versatile than edge terminals (1,9)
      if (v >= 3 && v <= 7) score += 10;
      else if (v === 2 || v === 8) score += 5;
    } else {
      // Honors with 0 matches are the best candidates to discard early
      if (matchCount === 0) {
        score -= 20;
      }
    }

    return { tile, score };
  });

  // Pick the tile with the lowest score (most isolated / least useful)
  scores.sort((a, b) => a.score - b.score);
  return scores[0].tile;
}

// Tier determination based on RP (Rating Points)
export function getTierFromRp(rp: number): RankedTier {
  if (rp >= 4000) return 'Grandmaster';
  if (rp >= 3500) return 'Master';
  if (rp >= 3000) return 'Diamond';
  if (rp >= 2500) return 'Platinum';
  if (rp >= 2000) return 'Gold';
  if (rp >= 1500) return 'Silver';
  if (rp >= 1000) return 'Bronze';
  return 'Novice';
}

export function getTierColor(tier: RankedTier): string {
  switch (tier) {
    case 'Grandmaster':
      return 'text-amber-300';
    case 'Master':
      return 'text-rose-400';
    case 'Diamond':
      return 'text-cyan-300';
    case 'Platinum':
      return 'text-emerald-400';
    case 'Gold':
      return 'text-yellow-400';
    case 'Silver':
      return 'text-slate-300';
    case 'Bronze':
      return 'text-amber-600';
    default:
      return 'text-slate-400';
  }
}

export function getTierBadgeBg(tier: RankedTier): string {
  switch (tier) {
    case 'Grandmaster':
      return 'bg-amber-950/80 border-amber-500/50 text-amber-300';
    case 'Master':
      return 'bg-rose-950/80 border-rose-500/50 text-rose-300';
    case 'Diamond':
      return 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300';
    case 'Platinum':
      return 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300';
    case 'Gold':
      return 'bg-yellow-950/80 border-yellow-500/50 text-yellow-300';
    case 'Silver':
      return 'bg-slate-800/80 border-slate-400/50 text-slate-200';
    case 'Bronze':
      return 'bg-amber-950/60 border-amber-700/50 text-amber-500';
    default:
      return 'bg-slate-900/60 border-slate-700 text-slate-400';
  }
}
