import React, { useState } from 'react';
import { PlayerProfile, LeaderboardEntry } from '../types/game';
import { LEADERBOARD } from '../data/gameData';
import { soundEngine } from '../audio/synthAudio';

interface RankingsViewProps {
  profile: PlayerProfile;
  onChallengeHighscore: () => void;
}

export const RankingsView: React.FC<RankingsViewProps> = ({
  profile,
  onChallengeHighscore,
}) => {
  const [filterMode, setFilterMode] = useState<string>('all');

  const filteredEntries = LEADERBOARD.filter((entry) => {
    if (filterMode === 'all') return true;
    return entry.mode.toLowerCase().includes(filterMode.toLowerCase());
  });

  return (
    <div className="flex flex-col w-full pb-28 space-y-4 px-3.5 max-w-xl mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono-data text-[9px] uppercase tracking-widest text-[#00eefc] font-bold">
            Arcade Hall of Fame
          </span>
          <h2 className="font-headline text-2xl text-white uppercase tracking-wider font-extrabold">
            Global Rankings
          </h2>
        </div>
        <span className="px-2.5 py-1 rounded bg-[#302445] text-[#00eefc] font-mono-data text-xs font-bold border border-[#00eefc]/40">
          SEASON 14
        </span>
      </div>

      {/* Featured Weekly Tournament Banner */}
      <div className="rounded-2xl p-4 bg-gradient-to-r from-[#211536] via-[#302445] to-[#140727] border border-[#dec800]/50 shadow-[0_4px_24px_rgba(253,228,0,0.25)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#dec800] text-xl material-symbols-filled">
              military_tech
            </span>
            <span className="font-mono-data text-[10px] text-[#fde400] font-bold uppercase tracking-widest">
              Weekly Midnight Cup
            </span>
          </div>
          <span className="font-mono-data text-[9px] text-[#e5bcc5]">Ends in: 2d 14h</span>
        </div>

        <div className="flex items-end justify-between mt-2">
          <div>
            <span className="text-[10px] font-mono-data text-[#e5bcc5] uppercase block">
              1st Place Prize Pool
            </span>
            <span className="font-headline text-xl text-[#00eefc] font-extrabold">
              50,000 💎 + CHROME LIVERY
            </span>
          </div>
          <button
            onClick={() => {
              soundEngine.playEngineRev();
              onChallengeHighscore();
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#ff4a8d] to-[#00eefc] text-white font-headline text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,74,141,0.6)] active:scale-95 transition-all cursor-pointer"
          >
            Play Qualifier
          </button>
        </div>
      </div>

      {/* Mode Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'All Modes' },
          { id: 'sunset', label: 'Sunset Ramp' },
          { id: 'mega', label: 'Mega Ramp' },
          { id: 'outrun', label: 'Outrun Attack' },
        ].map((tab) => {
          const isActive = filterMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playCoinPickup();
                setFilterMode(tab.id);
              }}
              className={`px-3 py-1.5 rounded-lg font-mono-data text-xs uppercase font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#00eefc] text-black shadow-[0_0_10px_rgba(0,238,252,0.5)]'
                  : 'bg-[#211536] text-[#e5bcc5] hover:text-white border border-[#3c2e50]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl overflow-hidden bg-[#211536] border border-[#3c2e50] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="p-3 bg-[#140727] border-b border-[#3c2e50] flex items-center justify-between text-[#e5bcc5] font-mono-data text-[10px] uppercase font-bold tracking-wider">
          <div className="flex items-center gap-4">
            <span>Rank</span>
            <span>Driver / Chassis</span>
          </div>
          <span>Score / Mode</span>
        </div>

        <div className="divide-y divide-[#3c2e50]/60">
          {filteredEntries.map((entry: LeaderboardEntry) => {
            const isTop3 = entry.rank <= 3;
            const isCurrentPlayer = !!entry.isPlayer;

            return (
              <div
                key={entry.rank}
                className={`p-3 flex items-center justify-between transition-colors ${
                  isCurrentPlayer
                    ? 'bg-[#26193a] border-l-4 border-[#00eefc] shadow-[inset_0_0_12px_rgba(0,238,252,0.2)]'
                    : 'hover:bg-[#26193a]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono-data text-xs font-extrabold ${
                      entry.rank === 1
                        ? 'bg-[#dec800] text-black shadow-[0_0_8px_#dec800]'
                        : entry.rank === 2
                        ? 'bg-slate-200 text-black shadow-[0_0_8px_#ffffff]'
                        : entry.rank === 3
                        ? 'bg-amber-700 text-white shadow-[0_0_8px_#d97706]'
                        : 'bg-[#302445] text-[#e5bcc5]'
                    }`}
                  >
                    #{entry.rank}
                  </span>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-headline text-xs font-bold uppercase ${
                          isCurrentPlayer ? 'text-[#00eefc]' : isTop3 ? 'text-white' : 'text-[#ecdcff]'
                        }`}
                      >
                        {entry.name}
                      </span>
                      {entry.badge && (
                        <span className="font-mono-data text-[8px] px-1 py-0.2 rounded bg-[#3c2e50] text-[#00eefc] font-bold">
                          {entry.badge}
                        </span>
                      )}
                    </div>
                    <span className="font-mono-data text-[9px] text-[#e5bcc5] block">
                      {entry.car}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-mono-data text-xs font-bold block ${
                      isTop3 ? 'text-[#00eefc]' : 'text-white'
                    }`}
                  >
                    {entry.score.toLocaleString()} PTS
                  </span>
                  <span className="font-mono-data text-[9px] text-[#dec800]">
                    {entry.mode}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
