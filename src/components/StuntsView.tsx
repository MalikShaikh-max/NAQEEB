import React from 'react';
import { PlayerProfile, StuntTrick } from '../types/game';
import { STUNT_TRICKS } from '../data/gameData';
import { soundEngine } from '../audio/synthAudio';
import confetti from 'canvas-confetti';

interface StuntsViewProps {
  profile: PlayerProfile;
  onLaunchStuntMode: () => void;
  onClaimBounty: () => void;
}

export const StuntsView: React.FC<StuntsViewProps> = ({
  profile,
  onLaunchStuntMode,
  onClaimBounty,
}) => {
  const bounty = profile.dailyBounty;
  const canClaim = bounty.current >= bounty.target && !bounty.isCompleted;

  const handleClaim = () => {
    soundEngine.playStuntSuccess();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00eefc', '#ff4a8d', '#dec800'],
    });
    onClaimBounty();
  };

  return (
    <div className="flex flex-col w-full pb-28 space-y-4 px-3.5 max-w-xl mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono-data text-[9px] uppercase tracking-widest text-[#00eefc] font-bold">
            Airborne Acrobatics
          </span>
          <h2 className="font-headline text-2xl text-white uppercase tracking-wider font-extrabold">
            Stunt Academy
          </h2>
        </div>
        <div className="px-2.5 py-1 rounded bg-[#302445] border border-[#dec800]/40 font-mono-data text-xs text-[#dec800] font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-sm material-symbols-filled">stars</span>
          {profile.totalStuntsCompleted} LANDED
        </div>
      </div>

      {/* Hero Banner: Stunt Arena Quick Jump */}
      <div className="relative rounded-2xl overflow-hidden p-5 bg-gradient-to-r from-[#26193a] via-[#302445] to-[#140727] border border-[#ff4a8d]/40 shadow-[0_8px_32px_rgba(255,74,141,0.25)]">
        <div className="relative z-10 flex flex-col items-start space-y-3">
          <span className="px-2 py-0.5 rounded bg-[#ff4a8d] text-white font-mono-data text-[9px] font-bold uppercase tracking-wider">
            HIGH G-FORCE ARENA
          </span>
          <h3 className="font-headline text-xl text-white uppercase font-extrabold -skew-x-3">
            Mega Sky Ramp Practice
          </h3>
          <p className="text-xs text-[#e5bcc5] font-body max-w-sm">
            Launch from vertical neon mega ramps, hit the sky rings, and practice mid-air 360 barrel rolls with instant multiplier boosts.
          </p>
          <button
            onClick={() => {
              soundEngine.playRampJump();
              onLaunchStuntMode();
            }}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-[#00eefc] to-[#ff4a8d] text-black font-headline text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(0,238,252,0.6)] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">flight_takeoff</span>
            Launch Mega Ramp Run
          </button>
        </div>
      </div>

      {/* Featured Bounty Challenge */}
      <section className="rounded-xl p-4 bg-[#26193a] border border-[#dec800]/50 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#dec800] text-xl material-symbols-filled">
              military_tech
            </span>
            <span className="font-mono-data text-[10px] uppercase text-[#fde400] font-bold tracking-widest">
              Daily Stunt Bounty
            </span>
          </div>
          <span className="font-mono-data text-[10px] text-[#dec800] font-bold bg-[#140727] px-2 py-0.5 rounded border border-[#dec800]/30">
            +{bounty.reward} DIAMONDS
          </span>
        </div>

        <h4 className="font-headline text-base text-white font-bold mb-1">
          {bounty.title}
        </h4>
        <p className="text-xs text-[#e5bcc5] font-body mb-3">
          Hit any stunt ramp at 140+ KM/H and trigger a roll before touchdown to log progress.
        </p>

        {/* Progress bar */}
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between font-mono-data text-xs">
            <span className="text-[#e5bcc5]">Progress</span>
            <span className="text-[#00eefc] font-bold">
              {bounty.current} / {bounty.target} Completed
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#140727] overflow-hidden p-0.5 border border-[#3c2e50]">
            <div
              className="h-full bg-gradient-to-r from-[#00eefc] to-[#dec800] rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (bounty.current / bounty.target) * 100)}%` }}
            ></div>
          </div>
        </div>

        {canClaim ? (
          <button
            onClick={handleClaim}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#dec800] to-[#ff4a8d] text-black font-headline text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(253,228,0,0.6)] animate-pulse active:scale-95 transition-all cursor-pointer"
          >
            Claim +{bounty.reward} Diamonds
          </button>
        ) : bounty.isCompleted ? (
          <div className="w-full py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-mono-data text-xs text-center font-bold">
            ✓ Bounty Completed Today! Resets in {bounty.resetsIn}
          </div>
        ) : (
          <button
            onClick={() => {
              soundEngine.playRampJump();
              onLaunchStuntMode();
            }}
            className="w-full py-2.5 rounded-xl bg-[#302445] hover:bg-[#3c2e50] text-[#00eefc] border border-[#00eefc]/40 font-headline text-xs font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
          >
            Jump Into Track (Need {bounty.target - bounty.current} more)
          </button>
        )}
      </section>

      {/* Stunt Tricks Catalog */}
      <div className="space-y-2">
        <h3 className="font-headline text-lg text-white uppercase font-bold tracking-wide">
          Trick Master Execution Guide
        </h3>
        {STUNT_TRICKS.map((trick: StuntTrick) => (
          <div
            key={trick.id}
            className="rounded-xl p-3 bg-[#211536] border border-[#3c2e50] hover:border-[#00eefc]/40 transition-colors flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#302445] border border-[#00eefc]/30 flex items-center justify-center text-[#00eefc] shrink-0">
                <span className="material-symbols-outlined text-xl">{trick.icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-headline text-sm font-bold text-white uppercase">
                    {trick.name}
                  </h4>
                  <span
                    className={`font-mono-data text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      trick.difficulty === 'Extreme'
                        ? 'bg-rose-950 text-rose-300'
                        : trick.difficulty === 'Medium'
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-emerald-950 text-emerald-300'
                    }`}
                  >
                    {trick.difficulty}
                  </span>
                </div>
                <span className="font-mono-data text-[10px] text-[#e5bcc5] block">
                  Combo: <span className="text-[#00eefc]">{trick.keyCombo}</span>
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="font-mono-data text-xs text-[#ffb1c4] font-bold block">
                +{trick.pts.toLocaleString()} PTS
              </span>
              <span className="font-mono-data text-[9px] text-[#dec800]">
                {trick.completedTimes} Landed
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
