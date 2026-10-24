import React, { useState } from 'react';
import { PlayerProfile, ScreenTab } from '../types/game';
import { soundEngine } from '../audio/synthAudio';

interface TopHeaderProps {
  profile: PlayerProfile;
  currentTab: ScreenTab;
  onAddDiamonds?: (amount: number) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ profile, currentTab, onAddDiamonds }) => {
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const getSubtitle = () => {
    switch (currentTab) {
      case 'lobby': return 'LOBBY';
      case 'garage': return 'GARAGE & TUNING';
      case 'stunts': return 'STUNT ACADEMY';
      case 'rankings': return 'GLOBAL LEADERBOARDS';
      default: return 'LOBBY';
    }
  };

  const claimBonus = () => {
    soundEngine.playCoinPickup();
    if (onAddDiamonds) onAddDiamonds(1000);
    setShowRewardModal(false);
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-[#140727]/85 backdrop-blur-xl border-b border-[#3c2e50]/60 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        <div className="max-w-2xl mx-auto h-16 px-4 flex items-center justify-between gap-2">
          {/* Brand Zone */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-[#ff4a8d] to-[#00eefc] p-0.5 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,238,252,0.4)]">
              <span className="material-symbols-outlined text-white text-xl">sports_score</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[#ffb1c4] font-headline text-lg font-extrabold leading-none tracking-wider uppercase truncate">
                  NitroWave
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#3c2e50] text-[#00eefc] font-mono-data text-[10px] font-bold shadow-[0_0_8px_rgba(0,238,252,0.4)] shrink-0">
                  LV.{profile.level}
                </span>
              </div>
              <span className="text-[#e5bcc5] font-mono-data text-[9px] uppercase tracking-widest truncate">
                {getSubtitle()}
              </span>
            </div>
          </div>

          {/* Currency & Profile Zone */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Diamonds */}
            <button
              onClick={() => {
                soundEngine.playCoinPickup();
                setShowRewardModal(true);
              }}
              title="Arcade Diamonds - Click for Rewards"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#302445]/90 hover:bg-[#3c2e50] border border-[#00eefc]/30 shadow-[0_0_10px_rgba(0,238,252,0.2)] transition-transform active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[#00eefc] text-sm leading-none material-symbols-filled">diamond</span>
              <span className="font-mono-data text-xs text-[#d3fbff] font-bold">
                {(profile.diamonds / 1000).toFixed(1)}K
              </span>
            </button>

            {/* Nitro Flame Tokens */}
            <button
              onClick={() => {
                soundEngine.playNitroBoost();
                setShowRewardModal(true);
              }}
              title="Nitro Flame Tokens"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#302445]/90 hover:bg-[#3c2e50] border border-[#ff4a8d]/30 shadow-[0_0_10px_rgba(255,74,141,0.25)] transition-transform active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[#ff4a8d] text-sm leading-none material-symbols-filled">local_fire_department</span>
              <span className="font-mono-data text-xs text-[#ffb1c4] font-bold">
                {profile.flameTokens}
              </span>
            </button>

            {/* Profile Avatar */}
            <button
              onClick={() => {
                soundEngine.playEngineRev();
                setShowProfileModal(true);
              }}
              className="relative p-0.5 rounded-full bg-gradient-to-tr from-[#00eefc] via-[#dec800] to-[#ff4a8d] shrink-0 active:scale-95 transition-transform cursor-pointer"
              title="Driver License"
            >
              <img
                alt="Profile"
                className="w-7 h-7 rounded-full object-cover block bg-[#190c2d]"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOQueTIag2vTpBCta-ChqyaPT8zN_Fka7LmaKkehaP3diRfRK1xMW7UZMjddzk2Y1UPsr28HXST9_8wVdgo6ABLR7-k2SA4yrfGRRNqNwPwcigE8DfbGkWb5xRz_1l_n8PWBWLVsD9_VQWquRYptKBV8Z0QG7REQIRu4zUUH1Zk4y9onBwr6KaAekbxzWdsxN285AzQe4SQLDCHsGl7T0Q49NAduerJOwaqQwXi4qmIouHEI4L2RrT1A"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute bottom-0 right-0 border border-[#140727]"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Rewards Drop Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#26193a] border border-[#00eefc]/50 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_35px_rgba(0,238,252,0.4)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#dec800] text-2xl material-symbols-filled">stars</span>
                <h3 className="font-headline text-lg font-bold text-white uppercase tracking-wider">Arcade Coin Drop</h3>
              </div>
              <button 
                onClick={() => setShowRewardModal(false)}
                className="text-[#e5bcc5] hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>
            
            <p className="text-[#e5bcc5] text-sm mb-4">
              Daily syndicate bonus ready for pickup! Boost your tuning wallet to overclock your supercars.
            </p>

            <div className="bg-[#140727] p-3 rounded-xl border border-[#3c2e50] mb-5 flex items-center justify-around">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-[#00eefc] font-mono-data text-lg font-bold">
                  <span className="material-symbols-outlined text-base material-symbols-filled">diamond</span>
                  +1,000
                </div>
                <span className="text-[10px] text-[#e5bcc5] uppercase">Free Diamonds</span>
              </div>
              <div className="w-px h-8 bg-[#3c2e50]"></div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-[#ff4a8d] font-mono-data text-lg font-bold">
                  <span className="material-symbols-outlined text-base material-symbols-filled">local_fire_department</span>
                  +100
                </div>
                <span className="text-[10px] text-[#e5bcc5] uppercase">Nitro Fuel</span>
              </div>
            </div>

            <button
              onClick={claimBonus}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff4a8d] to-[#00eefc] text-white font-headline text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(255,74,141,0.6)] active:scale-95 transition-all"
            >
              Claim Rewards Now
            </button>
          </div>
        </div>
      )}

      {/* Driver License Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#211536] border border-[#ff4a8d]/50 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_35px_rgba(255,74,141,0.35)]">
            <div className="flex items-center justify-between mb-4 border-b border-[#3c2e50] pb-3">
              <div>
                <span className="text-[10px] font-mono-data text-[#00eefc] uppercase tracking-widest block">CIRCUIT REGISTRY</span>
                <h3 className="font-headline text-lg font-bold text-white uppercase">DRIVER ID: #SYNTH-42</h3>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-[#e5bcc5] hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono-data text-xs mb-5">
              <div className="flex justify-between py-1 border-b border-[#3c2e50]/50">
                <span className="text-[#e5bcc5]">License Tier:</span>
                <span className="text-[#00eefc] font-bold">TIER-S STUNT PILOT</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3c2e50]/50">
                <span className="text-[#e5bcc5]">Career Stunts:</span>
                <span className="text-[#dec800] font-bold">{profile.totalStuntsCompleted} Air Tricks</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3c2e50]/50">
                <span className="text-[#e5bcc5]">Top Highscore:</span>
                <span className="text-[#ffb1c4] font-bold">{profile.highScore.toLocaleString()} PTS</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#3c2e50]/50">
                <span className="text-[#e5bcc5]">Overclock Status:</span>
                <span className="text-emerald-400 font-bold">MAX STABLE (+3)</span>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#302445] hover:bg-[#3c2e50] text-[#00eefc] font-headline text-xs font-bold uppercase tracking-wider border border-[#00eefc]/40"
            >
              Close License
            </button>
          </div>
        </div>
      )}
    </>
  );
};
