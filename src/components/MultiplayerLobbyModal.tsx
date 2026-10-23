/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PlayerStats } from '../types/mahjong';

interface MultiplayerLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  onCreateRoom: (roomName: string) => void;
  onJoinRoom: (code: string) => void;
  connectedRoom: any | null;
  userSeat: number | null;
  onStartRoomGame: () => void;
  onToggleReady: () => void;
  onLeaveRoom: () => void;
  chatMessages: any[];
  onSendChat: (text: string) => void;
}

export const MultiplayerLobbyModal: React.FC<MultiplayerLobbyModalProps> = ({
  isOpen,
  onClose,
  stats,
  onCreateRoom,
  onJoinRoom,
  connectedRoom,
  userSeat,
  onStartRoomGame,
  onToggleReady,
  onLeaveRoom,
  chatMessages,
  onSendChat,
}) => {
  const [roomNameInput, setRoomNameInput] = useState(`${stats.name}'s Table`);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && !connectedRoom) {
      fetch('/api/rooms')
        .then(res => res.json())
        .then(data => {
          if (data && data.rooms) {
            setActiveRooms(data.rooms);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, connectedRoom]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (connectedRoom?.code) {
      navigator.clipboard.writeText(connectedRoom.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendChat(chatInput.trim());
    setChatInput('');
  };

  const quickStickers = ['🀄', '🐉', '👏', '🍵', '💥', '🍀', '🔥', '🎉'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-gradient-to-b from-[#13221b] to-[#0a1410] border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-['Cinzel',serif] text-xl font-bold text-amber-200">
              Real-Time Multiplayer Pavilion
            </h2>
            <div className="text-xs text-emerald-300/60 mt-0.5">
              Create a custom room or join a table with friends across browser tabs
            </div>
          </div>
          <button
            onClick={() => {
              if (connectedRoom) onLeaveRoom();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {!connectedRoom ? (
            /* Room Selection / Creation */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Create Room */}
                <div className="p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base mb-1">Create Custom Room</h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Host a 4-player room. Any empty seats can be filled with smart bots when you start.
                    </p>
                    <div className="space-y-2">
                      <label className="text-xs text-emerald-300/80 font-medium">Room Name:</label>
                      <input
                        type="text"
                        value={roomNameInput}
                        onChange={e => setRoomNameInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        placeholder="Room Name"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => onCreateRoom(roomNameInput)}
                    className="mt-5 w-full py-2.5 rounded-xl text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-300 to-yellow-400 hover:brightness-110 cursor-pointer shadow-md transition-all active:scale-98"
                  >
                    Create & Host Table
                  </button>
                </div>

                {/* Join Room by Code */}
                <div className="p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base mb-1">Join Room with Code</h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Enter the 4-6 character table code shared by your friend to sit at their table.
                    </p>
                    <div className="space-y-2">
                      <label className="text-xs text-emerald-300/80 font-medium">Room Code:</label>
                      <input
                        type="text"
                        value={roomCodeInput}
                        onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-sm font-mono tracking-widest text-center text-amber-300 uppercase placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        placeholder="e.g. JADE42"
                        maxLength={8}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => onJoinRoom(roomCodeInput)}
                    disabled={!roomCodeInput.trim()}
                    className="mt-5 w-full py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 cursor-pointer shadow-md transition-all active:scale-98"
                  >
                    Join Table
                  </button>
                </div>
              </div>

              {/* Active Public Rooms list */}
              <div>
                <h4 className="text-xs font-semibold text-emerald-200 mb-3">
                  Available Tables in Pavilion ({activeRooms.length})
                </h4>
                {activeRooms.length === 0 ? (
                  <div className="p-5 rounded-xl bg-black/20 border border-white/5 text-center text-xs text-slate-500">
                    No active multiplayer rooms right now. Create a room above and invite friends!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeRooms.map(rm => (
                      <div
                        key={rm.code}
                        className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{rm.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Code: <span className="text-amber-300">{rm.code}</span> · {rm.playersCount}/4 Players
                          </div>
                        </div>
                        <button
                          onClick={() => onJoinRoom(rm.code)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-800 hover:bg-emerald-700 text-white cursor-pointer"
                        >
                          Join
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Inside Connected Room Lobby */
            <div className="space-y-6">
              {/* Room Code & Share Banner */}
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-300/80 font-medium">Table Code:</div>
                  <div className="text-2xl font-mono font-black text-amber-300 tracking-wider">
                    {connectedRoom.code}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-black/50 hover:bg-black/70 text-slate-200 border border-white/10 cursor-pointer transition-colors"
                  >
                    {copied ? '✓ Copied Code!' : 'Copy Code'}
                  </button>
                  <button
                    onClick={onLeaveRoom}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 cursor-pointer transition-colors"
                  >
                    Leave Room
                  </button>
                </div>
              </div>

              {/* 4 Seat Slots */}
              <div>
                <div className="text-xs font-semibold text-emerald-200 mb-3">
                  Players at Table (4 Seats)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {connectedRoom.players.map((player: any, seatIdx: number) => {
                    const isHost = seatIdx === 0;
                    const isMe = userSeat === seatIdx;
                    return (
                      <div
                        key={`lobby_seat_${seatIdx}`}
                        className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                          player
                            ? 'bg-black/40 border-white/10'
                            : 'bg-black/20 border-dashed border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {player ? player.avatar : '🪑'}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{player ? player.name : `Seat ${seatIdx + 1} (Empty)`}</span>
                              {isMe && (
                                <span className="text-[9px] px-1 rounded bg-amber-400 text-slate-950 font-bold">
                                  YOU
                                </span>
                              )}
                              {isHost && (
                                <span className="text-[9px] px-1 rounded bg-emerald-500/30 text-emerald-300">
                                  HOST
                                </span>
                              )}
                            </div>
                            {player && (
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {player.tier} · {player.rp} RP
                              </div>
                            )}
                          </div>
                        </div>

                        {player && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              player.isReady
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {player.isReady ? 'READY' : 'WAITING'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Host & Player Action Controls */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  {userSeat === 0
                    ? 'You are the table host. When you start, any empty seats will be filled by AI bots.'
                    : 'Wait for the host to deal and start the game.'}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onToggleReady}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer transition-colors"
                  >
                    Toggle Ready
                  </button>

                  {userSeat === 0 && (
                    <button
                      onClick={onStartRoomGame}
                      className="px-6 py-2 rounded-xl text-xs font-bold text-amber-950 bg-gradient-to-r from-amber-300 to-yellow-400 hover:brightness-110 shadow-lg cursor-pointer transition-all active:scale-95"
                    >
                      Deal & Start Game!
                    </button>
                  )}
                </div>
              </div>

              {/* Chat & Reaction Feed */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <div className="text-xs font-semibold text-emerald-200 mb-2">Table Chat & Reactions</div>
                
                {/* Quick Stickers */}
                <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
                  {quickStickers.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => onSendChat(emoji)}
                      className="text-lg p-1.5 rounded-lg bg-black/40 hover:bg-emerald-950 border border-white/5 cursor-pointer transition-transform hover:scale-110"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Messages stream */}
                <div className="h-28 overflow-y-auto space-y-1.5 mb-3 p-2 bg-black/30 rounded-lg text-xs">
                  {chatMessages.length === 0 ? (
                    <div className="text-slate-500 text-center py-6">No chat messages yet. Say hello or send an emoji!</div>
                  ) : (
                    chatMessages.map(msg => (
                      <div key={msg.id} className="text-slate-300">
                        <span className="font-bold text-amber-300 mr-1.5">{msg.senderName}:</span>
                        <span>{msg.text}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Chat form */}
                <form onSubmit={handleSendChatMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Send a message to table..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
