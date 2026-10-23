/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Tile,
  Meld,
  Player,
  GamePhase,
  WinningResult,
  WaitingTileInfo,
  GameMode,
  PlayerStats,
  LeaderboardEntry,
  ChatMessage,
  GameLogEntry,
} from './types/mahjong';
import {
  createFullDeck,
  shuffleDeck,
  sortHand,
  evaluateHandWin,
  checkPung,
  checkKong,
  checkConcealedKong,
  checkChowCandidates,
  calculateWaitingTiles,
  chooseBotDiscard,
  getTierBadgeBg,
} from './lib/mahjongRules';
import { soundManager } from './lib/sound';
import {
  loadPlayerStats,
  updatePlayerProfile,
  recordMatchFinish,
  getFullLeaderboard,
} from './lib/playerStorage';
import { MahjongTile } from './components/MahjongTile';
import { CompassCenter } from './components/CompassCenter';
import { PlayerSeatView } from './components/PlayerSeatView';
import { ActionBar } from './components/ActionBar';
import { WinModal } from './components/WinModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { StatsModal } from './components/StatsModal';
import { RulesGuideModal } from './components/RulesGuideModal';
import { MultiplayerLobbyModal } from './components/MultiplayerLobbyModal';
import { GameLog } from './components/GameLog';

const BOT_SEATS_CONFIG = [
  { name: 'Master Lin', avatar: '🐉', rp: 4420, tier: 'Grandmaster' },
  { name: 'Kenji Sato', avatar: '🀄', rp: 3880, tier: 'Master' },
  { name: 'Sophia Chen', avatar: '🌸', rp: 3340, tier: 'Diamond' },
];

export default function App() {
  // Player Stats & Leaderboard
  const [playerStats, setPlayerStats] = useState<PlayerStats>(loadPlayerStats);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() =>
    getFullLeaderboard(loadPlayerStats())
  );

  // Audio State
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());

  // Game Mode & Phase
  const [gameMode, setGameMode] = useState<GameMode>('ranked_bots');
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [roundWind, setRoundWind] = useState<'east' | 'south'>('east');
  const [roundNumber, setRoundNumber] = useState(1);
  const [activeSeat, setActiveSeat] = useState<number>(0);
  const [userSeat, setUserSeat] = useState<number>(0);

  // Game Pieces
  const [wall, setWall] = useState<Tile[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [lastDiscard, setLastDiscard] = useState<{ tile: Tile; fromSeat: number } | null>(null);

  // Calls / Reactions
  const [reactionOptions, setReactionOptions] = useState<{
    canHu: boolean;
    canPung: boolean;
    canKong: boolean;
    canChow: boolean;
    chowCandidates: Tile[][];
  }>({
    canHu: false,
    canPung: false,
    canKong: false,
    canChow: false,
    chowCandidates: [],
  });

  // Tenpai Waiting Tiles helper
  const [showTenpaiHelper, setShowTenpaiHelper] = useState<boolean>(true);
  const [waitingTiles, setWaitingTiles] = useState<WaitingTileInfo[]>([]);

  // 15-second Turn Timer for ranked_bots mode
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(15);
  const [autoDiscardNotice, setAutoDiscardNotice] = useState<string | null>(null);

  // Game Log (Recent discards and calls)
  const [gameLog, setGameLog] = useState<GameLogEntry[]>([]);

  const addGameLogEntry = useCallback(
    (entry: Omit<GameLogEntry, 'id' | 'timestamp'>) => {
      const newEntry: GameLogEntry = {
        ...entry,
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setGameLog(prev => [...prev.slice(-19), newEntry]);
    },
    []
  );

  // Modals
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState(false);

  // Victory / Game Over
  const [winningResult, setWinningResult] = useState<WinningResult | null>(null);
  const [lastMatchRpDelta, setLastMatchRpDelta] = useState<number>(0);

  // Multiplayer WebSocket State
  const wsRef = useRef<WebSocket | null>(null);
  const [connectedRoom, setConnectedRoom] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Ref to hold current state for timeouts & bot callbacks
  const stateRef = useRef({
    phase,
    activeSeat,
    players,
    wall,
    lastDiscard,
    gameMode,
    userSeat,
    roundWind,
  });

  useEffect(() => {
    stateRef.current = {
      phase,
      activeSeat,
      players,
      wall,
      lastDiscard,
      gameMode,
      userSeat,
      roundWind,
    };
  }, [phase, activeSeat, players, wall, lastDiscard, gameMode, userSeat, roundWind]);

  // Recalculate Tenpai waiting tiles whenever human hand or table discards change
  useEffect(() => {
    const userPlayer = players[userSeat];
    if (userPlayer && (userPlayer.hand.length === 13 || userPlayer.hand.length === 14 - userPlayer.melds.length * 3 - 1)) {
      // Gather all known tiles
      const knownPool: Tile[] = [
        ...userPlayer.hand,
        ...players.flatMap(p => [...p.melds.flatMap(m => m.tiles), ...p.discards]),
      ];
      const waits = calculateWaitingTiles(userPlayer.hand, userPlayer.melds, knownPool);
      setWaitingTiles(waits);
    } else {
      setWaitingTiles([]);
    }
  }, [players, userSeat]);

  // Sound toggle
  const toggleSound = () => {
    const newMute = soundManager.toggleMute();
    setIsMuted(newMute);
  };

  // Start a local game vs Bots (Ranked or Casual)
  const startBotGame = useCallback((mode: GameMode = 'ranked_bots') => {
    setGameMode(mode);
    setWinningResult(null);
    setLastDiscard(null);
    setSelectedTileId(null);

    const fullDeck = shuffleDeck(createFullDeck());
    const newWall = [...fullDeck];

    // Create 4 players: Seat 0 is User, Seats 1-3 are AI bots
    const newPlayers: Player[] = [
      {
        seat: 0,
        name: playerStats.name,
        isBot: false,
        avatar: playerStats.avatar,
        rating: playerStats.rp,
        tier: playerStats.tier,
        hand: sortHand(newWall.splice(0, 13)),
        melds: [],
        discards: [],
      },
      ...BOT_SEATS_CONFIG.map((bot, i) => ({
        seat: i + 1,
        name: bot.name,
        isBot: true,
        avatar: bot.avatar,
        rating: bot.rp,
        tier: bot.tier,
        hand: newWall.splice(0, 13),
        melds: [],
        discards: [],
      })),
    ];

    // East (Seat 0) draws 14th tile to initiate round
    const drawn = newWall.shift()!;
    newPlayers[0].hand.push(drawn);

    setWall(newWall);
    setPlayers(newPlayers);
    setUserSeat(0);
    setActiveSeat(0);
    setPhase('player_turn');
    setGameLog([
      {
        id: `start_${Date.now()}`,
        seat: 0,
        playerName: 'East Dealer',
        playerAvatar: '🀄',
        action: 'draw',
        description: 'Tiles dealt & round commenced',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    soundManager.playTileClick();
  }, [playerStats]);

  // Initial deal on mount
  useEffect(() => {
    startBotGame('ranked_bots');
  }, []);

  // Update profile
  const handleUpdateProfile = (name: string, avatar: string) => {
    const updated = updatePlayerProfile(name, avatar);
    setPlayerStats(updated);
    setLeaderboard(getFullLeaderboard(updated));
    setPlayers(prev =>
      prev.map(p => (p.seat === userSeat ? { ...p, name: updated.name, avatar: updated.avatar } : p))
    );
  };

  // Handle Game Over
  const triggerGameOver = useCallback(
    (
      winnerSeat: number,
      loserSeat: number | null,
      winType: 'ron' | 'tsumo',
      points: number,
      fan: number,
      yaku: string[],
      winningTile: Tile
    ) => {
      const currentPlayers = stateRef.current.players;
      const winner = currentPlayers[winnerSeat];
      if (!winner) return;

      const winningHandTiles = [...winner.hand];
      const winData: WinningResult = {
        winnerSeat,
        loserSeat,
        winType,
        points,
        fan,
        yaku,
        handTiles: winningHandTiles,
        melds: winner.melds,
        winningTile,
      };

      setWinningResult(winData);
      setPhase('game_over');

      addGameLogEntry({
        seat: winnerSeat,
        playerName: winner.name,
        playerAvatar: winner.avatar,
        action: 'hu',
        tile: winningTile,
        description: `${winType.toUpperCase()} Win! (${points.toLocaleString()} pts)`,
      });

      if (winnerSeat === userSeat) {
        soundManager.playHuVictory();
      } else {
        soundManager.playDraw();
      }

      // Record match results in player stats
      const isUserWin = winnerSeat === userSeat;
      const placement: 1 | 2 | 3 | 4 = isUserWin ? 1 : 3;

      const finishResult = recordMatchFinish({
        mode: stateRef.current.gameMode,
        placement,
        handPoints: points,
        winType: isUserWin ? winType : 'opponent_win',
        winningHand: isUserWin ? winningHandTiles : undefined,
        winningYaku: yaku,
        opponents: currentPlayers.filter(p => p.seat !== userSeat).map(p => p.name),
      });

      setPlayerStats(finishResult.updatedStats);
      setLastMatchRpDelta(finishResult.rpDelta);
      setLeaderboard(getFullLeaderboard(finishResult.updatedStats));
    },
    [userSeat]
  );

  // Advance turn to next seat
  const advanceTurn = useCallback((nextSeat: number) => {
    const { wall: currentWall, players: currentPlayers } = stateRef.current;

    // Check for exhaustive draw (wall exhausted)
    if (currentWall.length <= 14) {
      setPhase('game_over');
      soundManager.playDraw();
      return;
    }

    const nextWall = [...currentWall];
    const drawnTile = nextWall.shift()!;

    setWall(nextWall);
    setActiveSeat(nextSeat);
    setPhase('player_turn');
    setReactionOptions({
      canHu: false,
      canPung: false,
      canKong: false,
      canChow: false,
      chowCandidates: [],
    });

    // Add drawn tile to next player's hand
    setPlayers(prev =>
      prev.map(p => (p.seat === nextSeat ? { ...p, hand: [...p.hand, drawnTile] } : p))
    );

    const nextPlayer = currentPlayers[nextSeat];

    // If human turn, check self-draw win (Tsumo)
    if (!nextPlayer.isBot) {
      soundManager.playTileClick();
      const handWithoutDrawn = nextPlayer.hand;
      const tsumoCheck = evaluateHandWin(handWithoutDrawn, nextPlayer.melds, drawnTile, true);
      if (tsumoCheck.isWin) {
        setReactionOptions(prev => ({ ...prev, canHu: true }));
      }
    } else {
      // Schedule bot move
      setTimeout(() => {
        executeBotTurn(nextSeat, drawnTile);
      }, 900);
    }
  }, []);

  // Bot Turn Logic
  const executeBotTurn = useCallback(
    (botSeat: number, drawnTile: Tile) => {
      const { players: currentPlayers } = stateRef.current;
      const bot = currentPlayers[botSeat];
      if (!bot || !bot.isBot) return;

      const fullHand = [...bot.hand, drawnTile];

      // 1. Check if Bot has Tsumo Win
      const tsumoCheck = evaluateHandWin(bot.hand, bot.melds, drawnTile, true);
      if (tsumoCheck.isWin) {
        bot.hand.push(drawnTile);
        triggerGameOver(botSeat, null, 'tsumo', tsumoCheck.points, tsumoCheck.fan, tsumoCheck.yaku, drawnTile);
        return;
      }

      // 2. Select tile to discard
      const discard = chooseBotDiscard(fullHand, bot.melds);
      const remainingHand = fullHand.filter(t => t.id !== discard.id);

      soundManager.playTileDiscard();

      setPlayers(prev =>
        prev.map(p =>
          p.seat === botSeat
            ? { ...p, hand: remainingHand, discards: [...p.discards, discard] }
            : p
        )
      );

      const discardInfo = { tile: discard, fromSeat: botSeat };
      setLastDiscard(discardInfo);

      addGameLogEntry({
        seat: botSeat,
        playerName: bot.name,
        playerAvatar: bot.avatar,
        action: 'discard',
        tile: discard,
        description: `Discarded ${discard.label}`,
      });

      // Check if Human can react to this discard
      handleDiscardReactions(discard, botSeat);
    },
    [triggerGameOver, addGameLogEntry]
  );

  // Evaluate reactions after a discard
  const handleDiscardReactions = useCallback(
    (discard: Tile, fromSeat: number) => {
      const { players: currentPlayers, userSeat: currentUsr } = stateRef.current;
      const user = currentPlayers[currentUsr];
      if (!user) return;

      // Check Human options
      const canHu = evaluateHandWin(user.hand, user.melds, discard, false).isWin;
      const canPung = checkPung(user.hand, discard);
      const canKong = checkKong(user.hand, discard);
      const isNextSeat = currentUsr === (fromSeat + 1) % 4;
      const chowCandidates = isNextSeat ? checkChowCandidates(user.hand, discard) : [];
      const canChow = chowCandidates.length > 0;

      if (canHu || canPung || canKong || canChow) {
        soundManager.playCallAlert();
        setReactionOptions({
          canHu,
          canPung,
          canKong,
          canChow,
          chowCandidates,
        });
        setPhase('reaction_window');
      } else {
        // Check if other bots want to win on Ron
        for (let s = 0; s < 4; s++) {
          if (s === fromSeat || s === currentUsr) continue;
          const bot = currentPlayers[s];
          if (bot && bot.isBot) {
            const botWin = evaluateHandWin(bot.hand, bot.melds, discard, false);
            if (botWin.isWin) {
              setTimeout(() => {
                triggerGameOver(s, fromSeat, 'ron', botWin.points, botWin.fan, botWin.yaku, discard);
              }, 600);
              return;
            }
          }
        }

        // No reactions, pass turn to next seat
        setTimeout(() => {
          advanceTurn((fromSeat + 1) % 4);
        }, 500);
      }
    },
    [advanceTurn, triggerGameOver]
  );

  // Human Discard
  const handleUserDiscard = useCallback(
    (tile: Tile) => {
      if (phase !== 'player_turn' || activeSeat !== userSeat) return;

      const user = players[userSeat];
      if (!user) return;

      // In multiplayer, send to server
      if (gameMode === 'multiplayer' && wsRef.current) {
        wsRef.current.send(
          JSON.stringify({
            type: 'PLAYER_DISCARD',
            tileId: tile.id,
          })
        );
        setSelectedTileId(null);
        soundManager.playTileDiscard();
        return;
      }

      // Local Solo mode
      soundManager.playTileDiscard();
      const updatedHand = user.hand.filter(t => t.id !== tile.id);

      setPlayers(prev =>
        prev.map(p =>
          p.seat === userSeat
            ? { ...p, hand: updatedHand, discards: [...p.discards, tile] }
            : p
        )
      );

      setSelectedTileId(null);
      const discardInfo = { tile, fromSeat: userSeat };
      setLastDiscard(discardInfo);

      addGameLogEntry({
        seat: userSeat,
        playerName: user.name,
        playerAvatar: user.avatar,
        action: 'discard',
        tile,
        description: `Discarded ${tile.label}`,
      });

      // Check if any bot can Ron or call
      for (let s = 1; s <= 3; s++) {
        const bot = players[s];
        if (bot) {
          const botWin = evaluateHandWin(bot.hand, bot.melds, tile, false);
          if (botWin.isWin) {
            setTimeout(() => {
              triggerGameOver(s, userSeat, 'ron', botWin.points, botWin.fan, botWin.yaku, tile);
            }, 600);
            return;
          }
        }
      }

      // If no bot win, advance to next player (Seat 1)
      setTimeout(() => {
        advanceTurn(1);
      }, 500);
    },
    [phase, activeSeat, userSeat, players, gameMode, advanceTurn, triggerGameOver, addGameLogEntry]
  );

  // Auto-discard random tile if player turn exceeds 15 seconds in ranked_bots mode
  const handleAutoDiscardRandomTile = useCallback(() => {
    const { players: currentPlayers, userSeat: currentUsr, phase: curPhase, activeSeat: curSeat } = stateRef.current;
    if (curPhase !== 'player_turn' || curSeat !== currentUsr) return;

    const user = currentPlayers[currentUsr];
    if (!user || user.hand.length === 0) return;

    const randomIndex = Math.floor(Math.random() * user.hand.length);
    const randomTile = user.hand[randomIndex];

    setAutoDiscardNotice(`⏱️ 15s turn expired! Automatically discarded ${randomTile.label}`);
    setTimeout(() => setAutoDiscardNotice(null), 3500);

    handleUserDiscard(randomTile);
  }, [handleUserDiscard]);

  // Turn Countdown Timer for ranked_bots mode (15 seconds per turn)
  useEffect(() => {
    if (gameMode !== 'ranked_bots' || phase !== 'player_turn') {
      return;
    }

    setTurnTimeLeft(15);

    const timer = setInterval(() => {
      setTurnTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (activeSeat === userSeat) {
            handleAutoDiscardRandomTile();
          } else {
            const bot = stateRef.current.players[activeSeat];
            if (bot && bot.hand.length > 0) {
              const rIdx = Math.floor(Math.random() * bot.hand.length);
              const rTile = bot.hand[rIdx];
              bot.hand = bot.hand.filter(t => t.id !== rTile.id);
              bot.discards.push(rTile);
              setPlayers([...stateRef.current.players]);
              handleDiscardReactions(rTile, activeSeat);
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameMode, phase, activeSeat, userSeat, handleAutoDiscardRandomTile, handleDiscardReactions]);

  // Human Calls
  const handleUserHu = useCallback(() => {
    const user = players[userSeat];
    if (!user) return;

    // Check if Tsumo (self-draw on own turn)
    if (activeSeat === userSeat) {
      const drawn = user.hand[user.hand.length - 1];
      const rest = user.hand.slice(0, user.hand.length - 1);
      const winCheck = evaluateHandWin(rest, user.melds, drawn, true);
      if (winCheck.isWin) {
        triggerGameOver(userSeat, null, 'tsumo', winCheck.points, winCheck.fan, winCheck.yaku, drawn);
      }
      return;
    }

    // Ron win on discard
    if (lastDiscard) {
      const winCheck = evaluateHandWin(user.hand, user.melds, lastDiscard.tile, false);
      if (winCheck.isWin) {
        triggerGameOver(
          userSeat,
          lastDiscard.fromSeat,
          'ron',
          winCheck.points,
          winCheck.fan,
          winCheck.yaku,
          lastDiscard.tile
        );
      }
    }
  }, [players, userSeat, activeSeat, lastDiscard, triggerGameOver]);

  const handleUserPung = useCallback(() => {
    if (!lastDiscard) return;
    const discard = lastDiscard.tile;
    const user = players[userSeat];
    if (!user) return;

    soundManager.playCallAlert();

    // Remove 2 matching tiles from user's hand
    let removed = 0;
    const meldTiles: Tile[] = [discard];
    const newHand = user.hand.filter(t => {
      if (removed < 2 && t.suit === discard.suit && t.value === discard.value) {
        meldTiles.push(t);
        removed++;
        return false;
      }
      return true;
    });

    const newMeld: Meld = {
      type: 'pung',
      tiles: meldTiles,
      claimedTile: discard,
      fromSeat: lastDiscard.fromSeat,
    };

    setPlayers(prev =>
      prev.map(p =>
        p.seat === userSeat ? { ...p, hand: newHand, melds: [...p.melds, newMeld] } : p
      )
    );

    addGameLogEntry({
      seat: userSeat,
      playerName: user.name,
      playerAvatar: user.avatar,
      action: 'pung',
      tile: discard,
      description: `Called Pung on ${discard.label}`,
    });

    // It is now human's turn to discard
    setActiveSeat(userSeat);
    setPhase('player_turn');
    setReactionOptions({
      canHu: false,
      canPung: false,
      canKong: false,
      canChow: false,
      chowCandidates: [],
    });
  }, [lastDiscard, players, userSeat, addGameLogEntry]);

  const handleUserKong = useCallback(() => {
    if (!lastDiscard) return;
    const discard = lastDiscard.tile;
    const user = players[userSeat];
    if (!user) return;

    soundManager.playCallAlert();

    let removed = 0;
    const meldTiles: Tile[] = [discard];
    const newHand = user.hand.filter(t => {
      if (removed < 3 && t.suit === discard.suit && t.value === discard.value) {
        meldTiles.push(t);
        removed++;
        return false;
      }
      return true;
    });

    const newMeld: Meld = {
      type: 'kong',
      tiles: meldTiles,
      claimedTile: discard,
      fromSeat: lastDiscard.fromSeat,
    };

    // Draw replacement tile from wall
    const nextWall = [...wall];
    const replacement = nextWall.shift();
    if (replacement) newHand.push(replacement);

    setWall(nextWall);
    setPlayers(prev =>
      prev.map(p =>
        p.seat === userSeat ? { ...p, hand: newHand, melds: [...p.melds, newMeld] } : p
      )
    );

    addGameLogEntry({
      seat: userSeat,
      playerName: user.name,
      playerAvatar: user.avatar,
      action: 'kong',
      tile: discard,
      description: `Called Kong on ${discard.label}`,
    });

    setActiveSeat(userSeat);
    setPhase('player_turn');
    setReactionOptions({
      canHu: false,
      canPung: false,
      canKong: false,
      canChow: false,
      chowCandidates: [],
    });
  }, [lastDiscard, players, userSeat, wall, addGameLogEntry]);

  const handleUserChow = useCallback(
    (pair: Tile[]) => {
      if (!lastDiscard) return;
      const discard = lastDiscard.tile;
      const user = players[userSeat];
      if (!user) return;

      soundManager.playCallAlert();

      const pairIds = new Set(pair.map(t => t.id));
      const newHand = user.hand.filter(t => !pairIds.has(t.id));

      const newMeld: Meld = {
        type: 'chow',
        tiles: [...pair, discard].sort((a, b) => a.value - b.value),
        claimedTile: discard,
        fromSeat: lastDiscard.fromSeat,
      };

      setPlayers(prev =>
        prev.map(p =>
          p.seat === userSeat ? { ...p, hand: newHand, melds: [...p.melds, newMeld] } : p
        )
      );

      addGameLogEntry({
        seat: userSeat,
        playerName: user.name,
        playerAvatar: user.avatar,
        action: 'chow',
        tile: discard,
        description: `Called Chow with ${pair[0].western}-${pair[1].western}`,
      });

      setActiveSeat(userSeat);
      setPhase('player_turn');
      setReactionOptions({
        canHu: false,
        canPung: false,
        canKong: false,
        canChow: false,
        chowCandidates: [],
      });
    },
    [lastDiscard, players, userSeat, addGameLogEntry]
  );

  const handleUserPass = useCallback(() => {
    setReactionOptions({
      canHu: false,
      canPung: false,
      canKong: false,
      canChow: false,
      chowCandidates: [],
    });

    if (lastDiscard) {
      // Advance to player following discarder
      advanceTurn((lastDiscard.fromSeat + 1) % 4);
    }
  }, [lastDiscard, advanceTurn]);

  // Hand Sort button
  const handleSortHand = () => {
    setPlayers(prev =>
      prev.map(p => (p.seat === userSeat ? { ...p, hand: sortHand(p.hand) } : p))
    );
    soundManager.playTileClick();
  };

  // Setup WebSocket for Real-Time Multiplayer
  const connectMultiplayerWs = useCallback(() => {
    if (wsRef.current) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}`);

    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'ROOM_CREATED':
          case 'ROOM_JOINED':
          case 'ROOM_UPDATE':
            setConnectedRoom(data.room);
            if (data.seat !== undefined) setUserSeat(data.seat);
            break;

          case 'GAME_STARTED':
            setConnectedRoom(data.room);
            setGameMode('multiplayer');
            setPhase(data.room.phase);
            setActiveSeat(data.room.currentSeat);
            setPlayers(data.room.players);
            setIsMultiplayerOpen(false);
            break;

          case 'TILE_DISCARDED':
            setConnectedRoom(data.room);
            setLastDiscard({ tile: data.tile, fromSeat: data.seat });
            setPlayers(data.room.players);
            soundManager.playTileDiscard();
            break;

          case 'PLAYER_DRAW':
            setConnectedRoom(data.room);
            setActiveSeat(data.seat);
            setPlayers(data.room.players);
            break;

          case 'CHAT_MESSAGE':
            setChatMessages(prev => [...prev.slice(-30), data.message]);
            break;

          case 'GAME_OVER':
            setConnectedRoom(data.room);
            triggerGameOver(
              data.winnerSeat,
              data.loserSeat,
              data.winType,
              data.points,
              data.points / 1000,
              data.yaku,
              data.winningTile
            );
            break;
        }
      } catch (err) {
        console.error('WS Parse Error', err);
      }
    };

    wsRef.current = ws;
  }, [triggerGameOver]);

  const handleCreateRoom = (roomName: string) => {
    connectMultiplayerWs();
    setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'CREATE_ROOM',
            roomName,
            playerId: playerStats.id,
            playerName: playerStats.name,
            avatar: playerStats.avatar,
            rp: playerStats.rp,
            tier: playerStats.tier,
          })
        );
      }
    }, 300);
  };

  const handleJoinRoom = (code: string) => {
    connectMultiplayerWs();
    setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'JOIN_ROOM',
            roomCode: code,
            playerId: playerStats.id,
            playerName: playerStats.name,
            avatar: playerStats.avatar,
            rp: playerStats.rp,
            tier: playerStats.tier,
          })
        );
      }
    }, 300);
  };

  const handleStartRoomGame = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'START_ROOM_GAME' }));
    }
  };

  const handleToggleReady = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'TOGGLE_READY' }));
    }
  };

  const handleSendChat = (text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'CHAT_MESSAGE', text }));
    }
  };

  const handleLeaveRoom = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectedRoom(null);
    startBotGame('ranked_bots');
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && phase === 'player_turn' && activeSeat === userSeat) {
        e.preventDefault();
        handleSortHand();
      } else if (e.key === 'Escape') {
        setIsLeaderboardOpen(false);
        setIsStatsOpen(false);
        setIsRulesOpen(false);
        setIsMultiplayerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, activeSeat, userSeat]);

  // Current Human Player
  const userPlayer = players[userSeat];
  const userHand = userPlayer?.hand || [];
  const userMelds = userPlayer?.melds || [];
  const userDiscards = userPlayer?.discards || [];
  const isUserTurn = activeSeat === userSeat && phase === 'player_turn';

  // Group human discards in rows of 6
  const userDiscardRows: Tile[][] = [];
  for (let i = 0; i < userDiscards.length; i += 6) {
    userDiscardRows.push(userDiscards.slice(i, i + 6));
  }

  // Selected tile object
  const selectedTile = userHand.find(t => t.id === selectedTileId);

  // Seat positioning relative to user (User = Bottom/0)
  // Seat 1 = Right, Seat 2 = Top, Seat 3 = Left
  const rightPlayer = players[(userSeat + 1) % 4];
  const topPlayer = players[(userSeat + 2) % 4];
  const leftPlayer = players[(userSeat + 3) % 4];

  const seatNames = [
    userPlayer?.name || 'You',
    rightPlayer?.name || 'Right',
    topPlayer?.name || 'Top',
    leftPlayer?.name || 'Left',
  ];

  return (
    <div className="min-h-screen bg-[#07130d] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden">
      {/* 
        TOP BAR CONTRACT:
        Zone 1: Brand Wordmark (one line)
        Zone 2: 4-5 Navigation links (whitespace-nowrap)
        Zone 3: 1 Primary Action Area (Rank Badge & Profile)
      */}
      <header className="h-16 px-6 sm:px-8 border-b border-emerald-900/60 bg-[#091811]/90 backdrop-blur-md flex items-center justify-between gap-8 shrink-0 z-30">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <span className="text-2xl">🀄</span>
          <span className="font-['Cinzel',serif] text-lg sm:text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200">
            Mahjong Pavilion
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-medium text-emerald-200/80">
          <button
            onClick={() => startBotGame('ranked_bots')}
            className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              gameMode === 'ranked_bots' && !connectedRoom ? 'text-amber-300 font-semibold' : ''
            }`}
          >
            Ranked Bots
          </button>
          <button
            onClick={() => setIsMultiplayerOpen(true)}
            className={`hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              connectedRoom ? 'text-amber-300 font-semibold' : ''
            }`}
          >
            Multiplayer Room {connectedRoom && `(${connectedRoom.code})`}
          </button>
          <button
            onClick={() => setIsLeaderboardOpen(true)}
            className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Ranked Leaderboard
          </button>
          <button
            onClick={() => setIsStatsOpen(true)}
            className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Career Statistics
          </button>
          <button
            onClick={() => setIsRulesOpen(true)}
            className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Rulebook
          </button>
        </nav>

        {/* Zone 3: Primary Action & Profile Info */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Sound Mute Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="w-8 h-8 rounded-lg bg-black/40 hover:bg-black/60 text-slate-300 flex items-center justify-center text-xs border border-white/10 transition-colors cursor-pointer"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* Player Rank Badge */}
          <button
            onClick={() => setIsStatsOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-500/30 transition-all cursor-pointer group"
          >
            <span className="text-base group-hover:scale-110 transition-transform">
              {playerStats.avatar}
            </span>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-white max-w-[100px] truncate leading-tight">
                {playerStats.name}
              </span>
              <span className="text-[10px] font-mono text-amber-300 font-semibold leading-none">
                {playerStats.rp} RP · {playerStats.tier}
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* 
        MAIN GAME ARENA:
        Authentic luxury green felt table surface with dark rosewood border
      */}
      <main className="flex-1 relative flex flex-col items-center justify-between p-2 sm:p-4 bg-[radial-gradient(ellipse_at_center,_#0f3d2a_0%,_#092318_60%,_#05120c_100%)] select-none overflow-hidden">
        {/* Subtle background felt texture */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay bg-cover bg-center"
          style={{ backgroundImage: `url('/src/assets/images/mahjong_table_felt_1792730482845.jpg')` }}
        />

        {/* Mobile Navigation bar for small screens */}
        <div className="lg:hidden w-full flex items-center justify-center gap-2 mb-2 z-20 overflow-x-auto py-1">
          <button
            onClick={() => startBotGame('ranked_bots')}
            className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-black/40 border border-white/10 text-emerald-200"
          >
            Play Bots
          </button>
          <button
            onClick={() => setIsMultiplayerOpen(true)}
            className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-black/40 border border-white/10 text-emerald-200"
          >
            Multiplayer
          </button>
          <button
            onClick={() => setIsLeaderboardOpen(true)}
            className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-black/40 border border-white/10 text-amber-300"
          >
            Leaderboard
          </button>
          <button
            onClick={() => setIsStatsOpen(true)}
            className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-black/40 border border-white/10 text-emerald-200"
          >
            Stats
          </button>
          <button
            onClick={() => setIsRulesOpen(true)}
            className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-black/40 border border-white/10 text-emerald-200"
          >
            Rules
          </button>
        </div>

        {/* TOP OPPONENT (North / Top Seat) */}
        <div className="w-full flex justify-center z-10 shrink-0">
          {topPlayer && (
            <PlayerSeatView
              player={topPlayer}
              isActive={activeSeat === topPlayer.seat}
              position="top"
              lastDiscardId={lastDiscard?.tile.id}
            />
          )}
        </div>

        {/* MIDDLE SECTION: Left Player — Center Compass — Right Player */}
        <div className="w-full max-w-6xl flex-1 flex items-center justify-between px-2 sm:px-6 my-1 sm:my-2 z-10">
          {/* LEFT OPPONENT */}
          <div className="w-36 sm:w-44 shrink-0 flex justify-start">
            {leftPlayer && (
              <PlayerSeatView
                player={leftPlayer}
                isActive={activeSeat === leftPlayer.seat}
                position="left"
                lastDiscardId={lastDiscard?.tile.id}
              />
            )}
          </div>

          {/* TABLE CENTER: Compass Dial, Wall Counter, Discard Spotlight */}
          <div className="flex flex-col items-center justify-center">
            <CompassCenter
              roundWind={roundWind}
              roundNumber={roundNumber}
              activeSeat={activeSeat}
              remainingWall={wall.length}
              lastDiscard={lastDiscard}
              seatNames={seatNames}
              turnTimeLeft={gameMode === 'ranked_bots' ? turnTimeLeft : undefined}
              maxTurnTime={15}
            />

            {/* Turn status indicator banner with countdown timer */}
            <div className="mt-2 text-center flex flex-col items-center gap-1.5">
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border backdrop-blur-sm transition-all ${
                  isUserTurn
                    ? turnTimeLeft <= 5 && gameMode === 'ranked_bots'
                      ? 'bg-rose-500/30 text-rose-200 border-rose-500/60 font-bold animate-pulse'
                      : 'bg-amber-400 text-slate-950 border-amber-300 font-bold animate-pulse'
                    : 'bg-black/40 text-emerald-200/90 border-white/10'
                }`}
              >
                {isUserTurn ? (
                  <span className="flex items-center gap-1.5">
                    <span>Your Turn: Select a tile to discard</span>
                    {gameMode === 'ranked_bots' && (
                      <span className="font-mono font-bold bg-black/30 text-white px-1.5 py-0.2 rounded text-[10px]">
                        ⏱️ {turnTimeLeft}s
                      </span>
                    )}
                  </span>
                ) : (
                  `${players[activeSeat]?.name || 'Player'}'s Turn... ${
                    gameMode === 'ranked_bots' ? `(⏱️ ${turnTimeLeft}s)` : ''
                  }`
                )}
              </span>

              {/* Auto-discard notice toast */}
              {autoDiscardNotice && (
                <div className="text-[11px] px-3 py-1 rounded-full bg-rose-950/90 border border-rose-500/60 text-rose-200 font-semibold shadow-lg animate-bounce">
                  {autoDiscardNotice}
                </div>
              )}
            </div>

            {/* Game Log Section: Lists the last 5 discards or actions performed */}
            <div className="mt-2.5 w-full flex justify-center">
              <GameLog entries={gameLog} />
            </div>
          </div>

          {/* RIGHT OPPONENT */}
          <div className="w-36 sm:w-44 shrink-0 flex justify-end">
            {rightPlayer && (
              <PlayerSeatView
                player={rightPlayer}
                isActive={activeSeat === rightPlayer.seat}
                position="right"
                lastDiscardId={lastDiscard?.tile.id}
              />
            )}
          </div>
        </div>

        {/* BOTTOM AREA: Human Discards, Tenpai Helper & Human Interactive Hand */}
        <div className="w-full max-w-5xl flex flex-col items-center gap-2 z-20">
          {/* Human Discard Pool (River) */}
          {userDiscards.length > 0 && (
            <div className="flex flex-col items-center gap-0.5 opacity-95">
              {userDiscardRows.map((row, rIdx) => (
                <div key={`usr_row_${rIdx}`} className="flex items-center gap-0.5">
                  {row.map(t => (
                    <MahjongTile
                      key={`usr_disc_${t.id}`}
                      tile={t}
                      size="mini"
                      selected={t.id === lastDiscard?.tile.id}
                      showWesternHelper={false}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Tenpai Ready Waiting Tiles Bar (if in Tenpai) */}
          {showTenpaiHelper && waitingTiles.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-amber-500/40 backdrop-blur-md shadow-lg animate-in fade-in">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <span>👁️</span> Tenpai Waits:
              </span>
              <div className="flex items-center gap-2">
                {waitingTiles.map((wt, i) => (
                  <div key={`wait_${i}`} className="flex items-center gap-1 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    <MahjongTile tile={wt.tile} size="mini" showWesternHelper={false} />
                    <span className="text-[10px] font-mono text-emerald-200">
                      {wt.remainingInWallOrUnknown} left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hand Action Toolbar (Sort, Tenpai Toggle, Discard CTA) */}
          <div className="w-full flex items-center justify-between px-3 text-xs">
            {/* Left Hand Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSortHand}
                className="px-3 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-emerald-200 border border-white/10 font-medium transition-colors cursor-pointer"
                title="Sort hand tiles (Spacebar)"
              >
                🔀 Sort Hand
              </button>
              <button
                onClick={() => setShowTenpaiHelper(prev => !prev)}
                className={`px-3 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                  showTenpaiHelper
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-black/40 text-slate-400 border-white/10'
                }`}
              >
                👁️ Tenpai Helper {waitingTiles.length > 0 && `(${waitingTiles.length})`}
              </button>
            </div>

            {/* Right Discard CTA when tile selected */}
            {isUserTurn && selectedTile && (
              <button
                onClick={() => handleUserDiscard(selectedTile)}
                className="px-4 py-1.5 rounded-xl font-bold text-xs tracking-wide text-amber-950 bg-gradient-to-r from-amber-300 to-yellow-400 hover:brightness-110 shadow-lg cursor-pointer transition-all active:scale-95 animate-pulse"
              >
                Discard {selectedTile.label} ↵
              </button>
            )}
          </div>

          {/* Human Hand Tiles & Exposed Melds Container */}
          <div className="w-full flex items-end justify-center gap-3 sm:gap-5 pb-2 overflow-x-auto px-2">
            {/* Hand Tiles */}
            <div className="flex items-end gap-1 sm:gap-1.5">
              {userHand.map((tile, idx) => {
                const isSelected = selectedTileId === tile.id;
                // Last tile is drawn tile if hand length is 14 (or 14 - melds*3)
                const isDrawn = idx === userHand.length - 1 && userHand.length % 3 === 2;

                return (
                  <MahjongTile
                    key={tile.id}
                    tile={tile}
                    size="lg"
                    selected={isSelected}
                    isDrawn={isDrawn}
                    interactive={isUserTurn}
                    onClick={() => {
                      if (!isUserTurn) return;
                      soundManager.playTileClick();
                      if (selectedTileId === tile.id) {
                        // Double click/second click discards immediately
                        handleUserDiscard(tile);
                      } else {
                        setSelectedTileId(tile.id);
                      }
                    }}
                    onDoubleClick={() => {
                      if (!isUserTurn) return;
                      handleUserDiscard(tile);
                    }}
                    showWesternHelper
                  />
                );
              })}
            </div>

            {/* Exposed Melds (Chow, Pung, Kong) */}
            {userMelds.length > 0 && (
              <div className="flex items-center gap-2 pl-3 border-l-2 border-emerald-500/40 shrink-0">
                {userMelds.map((meld, mIdx) => (
                  <div
                    key={`user_meld_${mIdx}`}
                    className="flex items-center gap-0.5 p-1 rounded-lg bg-black/40 border border-white/10"
                  >
                    {meld.tiles.map((t, tIdx) => (
                      <MahjongTile
                        key={`um_${mIdx}_${tIdx}`}
                        tile={t}
                        size="sm"
                        showWesternHelper={false}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* REACTION ACTION BAR (Hu, Kong, Pung, Chow, Pass) */}
      {(reactionOptions.canHu ||
        reactionOptions.canPung ||
        reactionOptions.canKong ||
        reactionOptions.canChow) && (
        <ActionBar
          canHu={reactionOptions.canHu}
          canPung={reactionOptions.canPung}
          canKong={reactionOptions.canKong}
          canChow={reactionOptions.canChow}
          chowCandidates={reactionOptions.chowCandidates}
          targetTile={lastDiscard?.tile}
          onHu={handleUserHu}
          onPung={handleUserPung}
          onKong={handleUserKong}
          onChow={handleUserChow}
          onPass={handleUserPass}
        />
      )}

      {/* WIN MODAL */}
      {winningResult && (
        <WinModal
          winner={winningResult}
          players={players}
          userSeat={userSeat}
          rpDelta={lastMatchRpDelta}
          onPlayAgain={() => startBotGame(gameMode)}
          onOpenStats={() => setIsStatsOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        />
      )}

      {/* LEADERBOARD MODAL */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        leaderboard={leaderboard}
        currentStats={playerStats}
      />

      {/* STATS MODAL */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={playerStats}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* RULES GUIDE MODAL */}
      <RulesGuideModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* MULTIPLAYER LOBBY MODAL */}
      <MultiplayerLobbyModal
        isOpen={isMultiplayerOpen}
        onClose={() => setIsMultiplayerOpen(false)}
        stats={playerStats}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        connectedRoom={connectedRoom}
        userSeat={userSeat}
        onStartRoomGame={handleStartRoomGame}
        onToggleReady={handleToggleReady}
        onLeaveRoom={handleLeaveRoom}
        chatMessages={chatMessages}
        onSendChat={handleSendChat}
      />
    </div>
  );
}
