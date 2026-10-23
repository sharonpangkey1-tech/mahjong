/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  createFullDeck,
  shuffleDeck,
  sortHand,
  evaluateHandWin,
  checkPung,
  checkKong,
  checkChowCandidates,
  chooseBotDiscard,
} from './src/lib/mahjongRules.ts';
import { Tile, Meld, Player, GamePhase } from './src/types/mahjong.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3000;

app.use(express.json());

interface RoomPlayer {
  id: string;
  name: string;
  avatar: string;
  rp: number;
  tier: string;
  seat: number;
  isBot: boolean;
  isReady: boolean;
  ws?: WebSocket;
  hand: Tile[];
  melds: Meld[];
  discards: Tile[];
}

interface GameRoom {
  code: string;
  name: string;
  hostId: string;
  phase: GamePhase;
  players: (RoomPlayer | null)[];
  wall: Tile[];
  currentSeat: number;
  currentDiscard: { tile: Tile; fromSeat: number; timestamp: number } | null;
  roundWind: 'east' | 'south';
  actionTimer: NodeJS.Timeout | null;
  history: string[];
}

const rooms = new Map<string, GameRoom>();

function generateRoomCode(): string {
  const words = ['JADE', 'WIND', 'DRGN', 'LOTS', 'BAMB', 'TILL', 'PUNG', 'CHOW', 'EAST', 'MOON'];
  const code = words[Math.floor(Math.random() * words.length)] + Math.floor(10 + Math.random() * 90);
  return code;
}

function broadcastToRoom(room: GameRoom, data: any) {
  const json = JSON.stringify(data);
  for (const player of room.players) {
    if (player && player.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(json);
    }
  }
}

function sanitizeRoomForClient(room: GameRoom, forSeat?: number) {
  return {
    code: room.code,
    name: room.name,
    phase: room.phase,
    currentSeat: room.currentSeat,
    currentDiscard: room.currentDiscard,
    roundWind: room.roundWind,
    remainingWallCount: room.wall.length,
    players: room.players.map((p, index) => {
      if (!p) return null;
      // Mask other players' hands if game is playing
      const hideHand = room.phase !== 'game_over' && forSeat !== undefined && forSeat !== index;
      return {
        id: p.id,
        seat: p.seat,
        name: p.name,
        avatar: p.avatar,
        rp: p.rp,
        tier: p.tier,
        isBot: p.isBot,
        isReady: p.isReady,
        melds: p.melds,
        discards: p.discards,
        handCount: p.hand.length,
        hand: hideHand ? [] : p.hand,
      };
    }),
  };
}

function fillRoomWithBots(room: GameRoom) {
  const botNames = [
    { name: 'Master Lin', avatar: '🐉', rp: 4420, tier: 'Grandmaster' },
    { name: 'Kenji Sato', avatar: '🀄', rp: 3880, tier: 'Master' },
    { name: 'Sophia Chen', avatar: '🌸', rp: 3340, tier: 'Diamond' },
    { name: 'Elder Wu', avatar: '🍵', rp: 2890, tier: 'Platinum' },
  ];

  for (let seat = 0; seat < 4; seat++) {
    if (!room.players[seat]) {
      const bot = botNames[seat % botNames.length];
      room.players[seat] = {
        id: `bot_${seat}_${Date.now()}`,
        name: bot.name,
        avatar: bot.avatar,
        rp: bot.rp,
        tier: bot.tier,
        seat,
        isBot: true,
        isReady: true,
        hand: [],
        melds: [],
        discards: [],
      };
    }
  }
}

function startMultiplayerGame(room: GameRoom) {
  fillRoomWithBots(room);

  const fullWall = shuffleDeck(createFullDeck());
  room.wall = fullWall;
  room.phase = 'player_turn';
  room.currentSeat = 0; // East starts
  room.currentDiscard = null;

  // Deal 13 tiles to each player
  for (let seat = 0; seat < 4; seat++) {
    const p = room.players[seat];
    if (p) {
      p.hand = sortHand(room.wall.splice(0, 13));
      p.melds = [];
      p.discards = [];
    }
  }

  // East draws 14th tile
  const eastPlayer = room.players[0];
  if (eastPlayer && room.wall.length > 0) {
    const drawn = room.wall.shift()!;
    eastPlayer.hand.push(drawn);
  }

  // Broadcast state
  room.players.forEach((p, idx) => {
    if (p && p.ws) {
      p.ws.send(
        JSON.stringify({
          type: 'GAME_STARTED',
          room: sanitizeRoomForClient(room, idx),
        })
      );
    }
  });

  // If seat 0 is bot, trigger bot turn
  if (eastPlayer?.isBot) {
    scheduleBotTurn(room, 0);
  }
}

function scheduleBotTurn(room: GameRoom, seat: number) {
  setTimeout(() => {
    const p = room.players[seat];
    if (!p || !p.isBot || room.phase !== 'player_turn' || room.currentSeat !== seat) return;

    // Check if self-draw win (Tsumo)
    const drawnTile = p.hand[p.hand.length - 1];
    const handWithout = p.hand.slice(0, p.hand.length - 1);
    const winCheck = evaluateHandWin(handWithout, p.melds, drawnTile, true);
    if (winCheck.isWin) {
      handleGameOver(room, seat, null, 'tsumo', winCheck.points, winCheck.yaku, drawnTile);
      return;
    }

    // Bot discards a tile
    const discard = chooseBotDiscard(p.hand, p.melds);
    p.hand = p.hand.filter(t => t.id !== discard.id);
    p.discards.push(discard);
    room.currentDiscard = { tile: discard, fromSeat: seat, timestamp: Date.now() };

    broadcastToRoom(room, {
      type: 'TILE_DISCARDED',
      seat,
      tile: discard,
      room: sanitizeRoomForClient(room),
    });

    handleReactionPhase(room, discard, seat);
  }, 1000);
}

function handleReactionPhase(room: GameRoom, discard: Tile, fromSeat: number) {
  room.phase = 'reaction_window';

  // Check if any player or bot can win (Ron)
  for (let seat = 0; seat < 4; seat++) {
    if (seat === fromSeat) continue;
    const p = room.players[seat];
    if (!p) continue;

    const winCheck = evaluateHandWin(p.hand, p.melds, discard, false);
    if (winCheck.isWin && p.isBot) {
      // Bot claims win immediately
      setTimeout(() => {
        handleGameOver(room, seat, fromSeat, 'ron', winCheck.points, winCheck.yaku, discard);
      }, 700);
      return;
    }
  }

  // In multiplayer, give humans a 5-second window to call if eligible
  let anyoneCanCall = false;
  for (let seat = 0; seat < 4; seat++) {
    if (seat === fromSeat) continue;
    const p = room.players[seat];
    if (p && !p.isBot) {
      const canHu = evaluateHandWin(p.hand, p.melds, discard, false).isWin;
      const canP = checkPung(p.hand, discard);
      const canK = checkKong(p.hand, discard);
      const canC = seat === (fromSeat + 1) % 4 && checkChowCandidates(p.hand, discard).length > 0;
      if (canHu || canP || canK || canC) {
        anyoneCanCall = true;
      }
    }
  }

  const waitTime = anyoneCanCall ? 5000 : 1200;

  room.actionTimer = setTimeout(() => {
    // Reaction expired, advance to next turn
    advanceToNextPlayer(room, (fromSeat + 1) % 4);
  }, waitTime);
}

function advanceToNextPlayer(room: GameRoom, nextSeat: number) {
  if (room.wall.length <= 14) {
    // Exhaustive draw
    handleExhaustiveDraw(room);
    return;
  }

  room.phase = 'player_turn';
  room.currentSeat = nextSeat;
  room.currentDiscard = null;

  const nextPlayer = room.players[nextSeat];
  if (nextPlayer) {
    const drawnTile = room.wall.shift()!;
    nextPlayer.hand.push(drawnTile);

    // Broadcast
    room.players.forEach((p, idx) => {
      if (p && p.ws) {
        p.ws.send(
          JSON.stringify({
            type: 'PLAYER_DRAW',
            seat: nextSeat,
            drawnTile: idx === nextSeat ? drawnTile : null,
            room: sanitizeRoomForClient(room, idx),
          })
        );
      }
    });

    if (nextPlayer.isBot) {
      scheduleBotTurn(room, nextSeat);
    }
  }
}

function handleGameOver(
  room: GameRoom,
  winnerSeat: number,
  loserSeat: number | null,
  winType: 'ron' | 'tsumo',
  points: number,
  yaku: string[],
  winningTile: Tile
) {
  room.phase = 'game_over';
  if (room.actionTimer) clearTimeout(room.actionTimer);

  const winner = room.players[winnerSeat];
  const payload = {
    type: 'GAME_OVER',
    winnerSeat,
    loserSeat,
    winType,
    points,
    yaku,
    winningTile,
    winnerName: winner?.name || 'Unknown',
    room: sanitizeRoomForClient(room),
  };

  broadcastToRoom(room, payload);
}

function handleExhaustiveDraw(room: GameRoom) {
  room.phase = 'game_over';
  if (room.actionTimer) clearTimeout(room.actionTimer);

  broadcastToRoom(room, {
    type: 'EXHAUSTIVE_DRAW',
    room: sanitizeRoomForClient(room),
  });
}

// WebSocket Connection Management
wss.on('connection', (ws: WebSocket) => {
  let userRoomCode: string | null = null;
  let userSeat: number | null = null;

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'CREATE_ROOM': {
          const roomCode = generateRoomCode();
          const newRoom: GameRoom = {
            code: roomCode,
            name: data.roomName || `Room ${roomCode}`,
            hostId: data.playerId,
            phase: 'idle',
            players: [
              {
                id: data.playerId,
                name: data.playerName || 'Player 1',
                avatar: data.avatar || '🀄',
                rp: data.rp || 1500,
                tier: data.tier || 'Silver',
                seat: 0,
                isBot: false,
                isReady: true,
                ws,
                hand: [],
                melds: [],
                discards: [],
              },
              null,
              null,
              null,
            ],
            wall: [],
            currentSeat: 0,
            currentDiscard: null,
            roundWind: 'east',
            actionTimer: null,
            history: [],
          };

          rooms.set(roomCode, newRoom);
          userRoomCode = roomCode;
          userSeat = 0;

          ws.send(
            JSON.stringify({
              type: 'ROOM_CREATED',
              roomCode,
              seat: 0,
              room: sanitizeRoomForClient(newRoom, 0),
            })
          );
          break;
        }

        case 'JOIN_ROOM': {
          const room = rooms.get(data.roomCode?.toUpperCase());
          if (!room) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found' }));
            return;
          }

          if (room.phase !== 'idle') {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Game already in progress' }));
            return;
          }

          // Find empty seat
          let assignedSeat = -1;
          for (let s = 0; s < 4; s++) {
            if (!room.players[s]) {
              assignedSeat = s;
              break;
            }
          }

          if (assignedSeat === -1) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Room is full' }));
            return;
          }

          const newPlayer: RoomPlayer = {
            id: data.playerId,
            name: data.playerName || `Player ${assignedSeat + 1}`,
            avatar: data.avatar || '🀄',
            rp: data.rp || 1500,
            tier: data.tier || 'Silver',
            seat: assignedSeat,
            isBot: false,
            isReady: false,
            ws,
            hand: [],
            melds: [],
            discards: [],
          };

          room.players[assignedSeat] = newPlayer;
          userRoomCode = room.code;
          userSeat = assignedSeat;

          ws.send(
            JSON.stringify({
              type: 'ROOM_JOINED',
              roomCode: room.code,
              seat: assignedSeat,
              room: sanitizeRoomForClient(room, assignedSeat),
            })
          );

          broadcastToRoom(room, {
            type: 'ROOM_UPDATE',
            room: sanitizeRoomForClient(room),
          });
          break;
        }

        case 'TOGGLE_READY': {
          if (!userRoomCode) return;
          const room = rooms.get(userRoomCode);
          if (!room || userSeat === null) return;
          const p = room.players[userSeat];
          if (p) {
            p.isReady = !p.isReady;
            broadcastToRoom(room, {
              type: 'ROOM_UPDATE',
              room: sanitizeRoomForClient(room),
            });
          }
          break;
        }

        case 'START_ROOM_GAME': {
          if (!userRoomCode) return;
          const room = rooms.get(userRoomCode);
          if (!room) return;
          startMultiplayerGame(room);
          break;
        }

        case 'PLAYER_DISCARD': {
          if (!userRoomCode || userSeat === null) return;
          const room = rooms.get(userRoomCode);
          if (!room || room.phase !== 'player_turn' || room.currentSeat !== userSeat) return;

          const p = room.players[userSeat];
          if (!p) return;

          const tileId = data.tileId;
          const discard = p.hand.find(t => t.id === tileId);
          if (!discard) return;

          p.hand = p.hand.filter(t => t.id !== tileId);
          p.discards.push(discard);
          room.currentDiscard = { tile: discard, fromSeat: userSeat, timestamp: Date.now() };

          broadcastToRoom(room, {
            type: 'TILE_DISCARDED',
            seat: userSeat,
            tile: discard,
            room: sanitizeRoomForClient(room),
          });

          handleReactionPhase(room, discard, userSeat);
          break;
        }

        case 'PLAYER_CALL': {
          if (!userRoomCode || userSeat === null) return;
          const room = rooms.get(userRoomCode);
          if (!room || room.phase !== 'reaction_window' || !room.currentDiscard) return;

          const callingPlayer = room.players[userSeat];
          if (!callingPlayer) return;

          const discard = room.currentDiscard.tile;
          const fromSeat = room.currentDiscard.fromSeat;

          if (data.callType === 'hu') {
            const winCheck = evaluateHandWin(callingPlayer.hand, callingPlayer.melds, discard, false);
            if (winCheck.isWin) {
              handleGameOver(room, userSeat, fromSeat, 'ron', winCheck.points, winCheck.yaku, discard);
            }
          } else if (data.callType === 'pung') {
            if (checkPung(callingPlayer.hand, discard)) {
              if (room.actionTimer) clearTimeout(room.actionTimer);
              // Take 2 matching from hand
              let removed = 0;
              const meldTiles: Tile[] = [discard];
              callingPlayer.hand = callingPlayer.hand.filter(t => {
                if (removed < 2 && t.suit === discard.suit && t.value === discard.value) {
                  meldTiles.push(t);
                  removed++;
                  return false;
                }
                return true;
              });

              callingPlayer.melds.push({
                type: 'pung',
                tiles: meldTiles,
                claimedTile: discard,
                fromSeat,
              });

              // Player must now discard
              room.phase = 'player_turn';
              room.currentSeat = userSeat;
              room.currentDiscard = null;

              broadcastToRoom(room, {
                type: 'CALL_RESOLVED',
                callType: 'pung',
                seat: userSeat,
                room: sanitizeRoomForClient(room),
              });
            }
          }
          break;
        }

        case 'CHAT_MESSAGE': {
          if (!userRoomCode || userSeat === null) return;
          const room = rooms.get(userRoomCode);
          if (!room) return;
          const p = room.players[userSeat];
          if (!p) return;

          broadcastToRoom(room, {
            type: 'CHAT_MESSAGE',
            message: {
              id: `msg_${Date.now()}`,
              senderSeat: userSeat,
              senderName: p.name,
              text: data.text,
              timestamp: Date.now(),
            },
          });
          break;
        }
      }
    } catch (err) {
      console.error('WebSocket message parsing error', err);
    }
  });

  ws.on('close', () => {
    if (userRoomCode && userSeat !== null) {
      const room = rooms.get(userRoomCode);
      if (room) {
        const leaving = room.players[userSeat];
        if (leaving && !leaving.isBot) {
          // If in active game, convert to bot so table continues seamlessly
          if (room.phase !== 'idle' && room.phase !== 'game_over') {
            leaving.isBot = true;
            leaving.name = `${leaving.name} (AI)`;
            leaving.ws = undefined;
            broadcastToRoom(room, {
              type: 'ROOM_UPDATE',
              room: sanitizeRoomForClient(room),
            });
            if (room.currentSeat === userSeat && room.phase === 'player_turn') {
              scheduleBotTurn(room, userSeat);
            }
          } else {
            room.players[userSeat] = null;
            // If room empty, clean up
            if (room.players.every(p => !p || p.isBot)) {
              rooms.delete(userRoomCode);
            } else {
              broadcastToRoom(room, {
                type: 'ROOM_UPDATE',
                room: sanitizeRoomForClient(room),
              });
            }
          }
        }
      }
    }
  });
});

// REST API
app.get('/api/rooms', (req: Request, res: Response) => {
  const activeRooms = Array.from(rooms.values()).map(r => ({
    code: r.code,
    name: r.name,
    playersCount: r.players.filter(p => p !== null).length,
    phase: r.phase,
  }));
  res.json({ rooms: activeRooms });
});

// Full-Stack Dev & Production Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Mahjong Pavilion server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
