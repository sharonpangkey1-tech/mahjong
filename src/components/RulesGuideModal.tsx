/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MahjongTile } from './MahjongTile';
import { Tile } from '../types/mahjong';

interface RulesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesGuideModal: React.FC<RulesGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<'basics' | 'suits' | 'melds' | 'winning'>('basics');

  if (!isOpen) return null;

  // Sample tiles for diagrams
  const sampleWan1: Tile = { id: 's1', suit: 'characters', value: 1, label: '1 Character', kanji: '一萬', western: '1W', isHonor: false, isTerminal: true };
  const sampleWan2: Tile = { id: 's2', suit: 'characters', value: 2, label: '2 Character', kanji: '二萬', western: '2W', isHonor: false, isTerminal: false };
  const sampleWan3: Tile = { id: 's3', suit: 'characters', value: 3, label: '3 Character', kanji: '三萬', western: '3W', isHonor: false, isTerminal: false };

  const sampleBam5: Tile = { id: 's4', suit: 'bamboo', value: 5, label: '5 Bamboo', kanji: '五條', western: '5B', isHonor: false, isTerminal: false };
  const sampleDot8: Tile = { id: 's5', suit: 'dots', value: 8, label: '8 Dot', kanji: '八筒', western: '8D', isHonor: false, isTerminal: false };
  const sampleDragonRed: Tile = { id: 's6', suit: 'dragons', value: 1, label: 'Red Dragon', kanji: '中', western: 'Z', isHonor: true, isTerminal: false };
  const sampleWindEast: Tile = { id: 's7', suit: 'winds', value: 1, label: 'East Wind', kanji: '東', western: 'E', isHonor: true, isTerminal: false };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-gradient-to-b from-[#13221b] to-[#0a1410] border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-['Cinzel',serif] text-xl font-bold text-amber-200">
              Mahjong Rules & Strategy Guide
            </h2>
            <div className="text-xs text-emerald-300/60 mt-0.5">
              Learn the classical 4-player game of skill, calculation, and strategy
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Section Tabs */}
        <div className="px-5 pt-3 flex items-center gap-2 border-b border-white/5 overflow-x-auto">
          {[
            { id: 'basics', label: '1. The Goal' },
            { id: 'suits', label: '2. The 136 Tiles' },
            { id: 'melds', label: '3. Melds (Chow / Pung / Kong)' },
            { id: 'winning', label: '4. Winning Hands & Yaku' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeSection === tab.id
                  ? 'bg-emerald-950/80 text-amber-300 border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 text-sm text-slate-300 space-y-5 leading-relaxed">
          {activeSection === 'basics' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 font-medium">
                The Core Equation: <strong className="text-white">4 Melds of 3 Tiles + 1 Pair of Identical Tiles = 14 Tiles</strong>
              </div>

              <p>
                Each player starts with 13 tiles in their hand. On your turn, you draw a 14th tile from the wall. You inspect your hand, decide if you have formed a complete winning hand, and if not, choose one tile to discard onto the table.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                  <h4 className="font-bold text-amber-300 mb-1">自摸 · Tsumo (Self-Draw)</h4>
                  <p className="text-xs text-slate-400">
                    When you draw the 14th tile yourself from the wall that completes your hand, you declare <strong>Tsumo</strong>! All other players pay points.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                  <h4 className="font-bold text-amber-300 mb-1">荣和 · Ron (Discard Win)</h4>
                  <p className="text-xs text-slate-400">
                    When an opponent discards the exact tile you need to complete your hand, you immediately declare <strong>Ron (Hu)</strong>! The player who discarded that tile pays for your entire win.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-xs">
                💡 <strong>Tenpai (Ready Hand):</strong> When your hand is only 1 tile away from winning (13 tiles forming 4 incomplete groups or ready waits), you are in Tenpai! The game will highlight your waiting tiles in the helper bar.
              </div>
            </div>
          )}

          {activeSection === 'suits' && (
            <div className="space-y-4">
              <p>There are 136 standard tiles in the game, consisting of 3 numbered suits (1-9) and 2 honor suits:</p>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <MahjongTile tile={sampleWan1} size="sm" />
                    <MahjongTile tile={sampleWan2} size="sm" />
                    <MahjongTile tile={sampleWan3} size="sm" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs">Characters / Wan (萬) 1-9</h5>
                    <p className="text-xs text-slate-400">Marked with red Chinese numbers. (Labeled 1W-9W on top-left for convenience)</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <MahjongTile tile={sampleBam5} size="sm" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs">Bamboo / Sou (條) 1-9</h5>
                    <p className="text-xs text-slate-400">Green carved bamboo sticks. Note: 1 Bamboo is depicted as a peacock/sparrow.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <MahjongTile tile={sampleDot8} size="sm" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs">Dots / Pin (筒) 1-9</h5>
                    <p className="text-xs text-slate-400">Geometric circles representing traditional copper coins.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <MahjongTile tile={sampleWindEast} size="sm" />
                    <MahjongTile tile={sampleDragonRed} size="sm" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs">Honors: Winds & Dragons</h5>
                    <p className="text-xs text-slate-400">
                      Winds: East (東), South (南), West (西), North (北). Dragons: Red (中), Green (發), White (白). Honors can only form triplets (Pung) or pairs, never runs (Chow)!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'melds' && (
            <div className="space-y-4">
              <p>You can claim tiles discarded by other players to form exposed melds:</p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-amber-300 text-xs">CHOW · 吃 (Chi) — Sequence of 3</h5>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded">
                      From Left Player Only
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    A sequence of 3 consecutive numbers in the same numbered suit (e.g., 3-4-5 Bamboo or 7-8-9 Dots). You can only call Chow on a tile discarded by the player sitting to your immediate left.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-amber-300 text-xs">PUNG · 碰 (Pon) — Triplet of 3</h5>
                    <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded">
                      From Any Player
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Three identical tiles (e.g., three Red Dragons or three 6-Characters). If you hold a pair in your hand, you can call Pung when any player discards the third matching tile!
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-amber-300 text-xs">KONG · 槓 (Kan) — Quad of 4</h5>
                    <span className="text-[10px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded">
                      From Any Player or Concealed
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Four identical tiles. Declaring Kong counts as one meld of 3 and draws a replacement tile from the dead wall.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'winning' && (
            <div className="space-y-4">
              <p>Common winning combinations (Yaku) and Fan multipliers:</p>

              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs">All Simples (Tanyao) · 断幺九</div>
                    <div className="text-[11px] text-slate-400">Hand contains only tiles 2-8 (no 1s, 9s, or honors)</div>
                  </div>
                  <span className="text-amber-400 font-mono font-bold text-xs">+1 Fan</span>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs">Concealed Hand (Menzenchin) · 门前清</div>
                    <div className="text-[11px] text-slate-400">Won without claiming any exposed melds from opponents</div>
                  </div>
                  <span className="text-amber-400 font-mono font-bold text-xs">+1 Fan</span>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs">Dragon / Seat Wind Triplet · 役牌</div>
                    <div className="text-[11px] text-slate-400">Triplet of Red, Green, White Dragon, or Round Wind</div>
                  </div>
                  <span className="text-amber-400 font-mono font-bold text-xs">+1 Fan</span>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs">Seven Pairs (Chiitoitsu) · 七对子</div>
                    <div className="text-[11px] text-slate-400">Seven distinct pairs with zero melds</div>
                  </div>
                  <span className="text-amber-400 font-mono font-bold text-xs">+2 Fan</span>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs">All Triplets (Toi-Toi) · 碰碰和</div>
                    <div className="text-[11px] text-slate-400">Hand composed of 4 triplets and 1 pair</div>
                  </div>
                  <span className="text-amber-400 font-mono font-bold text-xs">+2 Fan</span>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs">Half Flush (Honitsu) · 混一色</div>
                    <div className="text-[11px] text-slate-400">Hand made of one numbered suit plus honors</div>
                  </div>
                  <span className="text-amber-400 font-mono font-bold text-xs">+3 Fan</span>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs">Pure Full Flush (Chinitsu) · 清一色</div>
                    <div className="text-[11px] text-slate-400">Hand made entirely of a single numbered suit with no honors</div>
                  </div>
                  <span className="text-amber-400 font-mono font-bold text-xs">+6 Fan</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:brightness-110 cursor-pointer"
          >
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
