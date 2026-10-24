import React, { useState, useEffect } from 'react';
import { PlayerProfile, GameModeId, HyperCar } from '../types/game';
import { GAME_MODES } from '../data/gameData';
import { soundEngine } from '../audio/synthAudio';

interface LobbyViewProps {
  profile: PlayerProfile;
  cars: HyperCar[];
  currentCar: HyperCar;
  onSelectCar: (carId: string) => void;
  onLaunchGame: (modeId: GameModeId) => void;
  onNavigateTab: (tab: 'garage' | 'stunts' | 'rankings') => void;
  onToggleUnderglow: () => void;
  onToggleNitroJet: () => void;
  onUpdateBountyTrack: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  profile,
  cars,
  currentCar,
  onSelectCar,
  onLaunchGame,
  onNavigateTab,
  onToggleUnderglow,
  onToggleNitroJet,
  onUpdateBountyTrack,
}) => {
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [selectedModeForModal, setSelectedModeForModal] = useState<GameModeId | null>(null);

  useEffect(() => {
    setIsPlayingMusic(soundEngine.getIsMusicPlaying());
  }, []);

  const handleToggleRadio = () => {
    const isPlaying = soundEngine.toggleMusic();
    setIsPlayingMusic(isPlaying);
  };

  const handleStartNightRun = () => {
    soundEngine.playEngineRev();
    onLaunchGame('mega-ramp');
  };

  // Helper to cycle through cars
  const currentCarIdx = Math.max(0, cars.findIndex((c) => c.id === currentCar.id));

  const handlePrevCar = () => {
    const prevIdx = (currentCarIdx - 1 + cars.length) % cars.length;
    soundEngine.playEngineRev();
    onSelectCar(cars[prevIdx].id);
  };

  const handleNextCar = () => {
    const nextIdx = (currentCarIdx + 1) % cars.length;
    soundEngine.playEngineRev();
    onSelectCar(cars[nextIdx].id);
  };

  return (
    <div className="flex flex-col w-full pb-28 space-y-4 px-3.5 max-w-xl mx-auto pt-2">
      {/* Interactive Ambient Banner & Audio Mode Bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00eefc] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00eefc]"></span>
          </span>
          <span className="font-mono-data text-[10px] uppercase tracking-widest text-[#00eefc] font-bold">
            Midnight Circuit Online
          </span>
        </div>

        {/* FM 84.6 SynthFM Radio Player */}
        <div className="flex items-center gap-1.5 bg-[#302445]/90 border border-[#00eefc]/30 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(0,238,252,0.2)]">
          <span className="material-symbols-outlined text-[#00eefc] text-sm material-symbols-filled">
            {isPlayingMusic ? 'equalizer' : 'volume_up'}
          </span>
          <span className="font-mono-data text-[10px] uppercase text-[#d3fbff] font-bold tracking-wider">
            FM 84.6 SynthFM
          </span>
          <button
            onClick={handleToggleRadio}
            className={`ml-1 w-5 h-5 rounded-full flex items-center justify-center text-white transition-all cursor-pointer ${
              isPlayingMusic
                ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)] animate-pulse'
                : 'bg-[#ff4a8d] shadow-[0_0_8px_rgba(255,74,141,0.6)] hover:scale-105'
            }`}
            title={isPlayingMusic ? 'Pause Synthwave FM' : 'Play Retro Synthwave FM'}
          >
            <span className="material-symbols-outlined text-xs leading-none">
              {isPlayingMusic ? 'pause' : 'play_arrow'}
            </span>
          </button>
        </div>
      </div>

      {/* Hero Showcase: Current Selected Car with Wireframe Horizon & Arrow Switchers */}
      <section className="relative w-full rounded-2xl bg-[#140727] overflow-hidden border border-[#3c2e50] shadow-[0_8px_32px_rgba(0,0,0,0.8)] group">
        {/* Neon Sky & Retro Wireframe Horizon */}
        <div className="relative w-full h-72 sm:h-80 overflow-hidden flex items-end justify-center">
          {/* Generated Hero Car Image with Synth Aesthetic */}
          <img
            alt={currentCar.name}
            className="absolute inset-0 w-full h-full object-cover object-bottom filter contrast-125 brightness-95 transition-all duration-300"
            src={currentCar.heroImage}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/aistudio/Image_1_a7cd5dac.png';
            }}
          />

          {/* Scanline / Glitch Vignette Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#140727] via-[#140727]/40 to-transparent pointer-events-none"></div>

          {/* Left & Right Switcher Chevrons on Hero Image */}
          <button
            onClick={handlePrevCar}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#140727]/80 hover:bg-[#ff4a8d] border border-[#00eefc]/40 text-[#00eefc] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90"
            title="Previous Car"
          >
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
          <button
            onClick={handleNextCar}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#140727]/80 hover:bg-[#ff4a8d] border border-[#00eefc]/40 text-[#00eefc] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90"
            title="Next Car"
          >
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>

          {/* Top Badges inside Hero */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#3c2e50]/90 backdrop-blur-md border border-[#ff4a8d]/40 shadow-[0_0_12px_rgba(255,74,141,0.35)]">
              <span className="material-symbols-outlined text-[#ff4a8d] text-sm leading-none material-symbols-filled">
                electric_bolt
              </span>
              <span className="font-mono-data text-[11px] uppercase text-[#ffb1c4] tracking-wider font-bold">
                {currentCar.tier}
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#302445]/90 backdrop-blur-md border border-[#00eefc]/40 shadow-[0_0_10px_rgba(0,238,252,0.3)]">
              <span className="font-mono-data text-[9px] text-[#00eefc]">CHASSIS:</span>
              <span className="font-mono-data text-[9px] text-[#d3fbff] uppercase font-bold">
                {currentCar.chassisCode}
              </span>
            </div>
          </div>

          {/* Vehicle Identity Plate */}
          <div className="relative z-10 w-full px-4 pb-3 flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-[#ff4a8d] text-white font-mono-data text-[9px] font-bold uppercase shadow-[0_0_10px_rgba(255,74,141,0.6)]">
                ACTIVE RIG ({currentCarIdx + 1}/{cars.length})
              </span>
              <button
                onClick={() => soundEngine.playEngineRev()}
                className="font-mono-data text-[10px] text-[#dec800] hover:text-white font-bold tracking-widest uppercase flex items-center gap-1 cursor-pointer bg-[#140727]/70 px-2 py-0.5 rounded border border-[#dec800]/40 transition-colors"
              >
                <span className="material-symbols-outlined text-xs material-symbols-filled">volume_up</span>
                TEST REV
              </button>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl text-white uppercase tracking-wider drop-shadow-[0_0_12px_rgba(0,238,252,0.7)] font-extrabold -skew-x-3">
              {currentCar.name}
            </h2>
            <p className="text-xs text-[#e5bcc5] font-body line-clamp-1 max-w-md mt-0.5">
              {currentCar.description}
            </p>
          </div>
        </div>

        {/* Segmented Arcade Telemetry Bars */}
        <div className="p-3.5 bg-[#211536]/95 backdrop-blur-sm space-y-2.5 border-t border-[#3c2e50]/50">
          {/* Speed Stat */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 w-24 shrink-0">
              <span className="material-symbols-outlined text-[#00eefc] text-sm">speed</span>
              <span className="font-mono-data text-[9px] text-[#e5bcc5] uppercase">Top Speed</span>
            </div>
            {/* Segmented LED Bar */}
            <div className="flex-1 flex gap-1 h-2 bg-[#3c2e50]/60 p-0.5 rounded">
              <div className="flex-1 rounded-sm bg-[#00eefc] shadow-[0_0_6px_rgba(0,238,252,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#00eefc] shadow-[0_0_6px_rgba(0,238,252,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#00eefc] shadow-[0_0_6px_rgba(0,238,252,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#00eefc] shadow-[0_0_6px_rgba(0,238,252,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#00eefc] shadow-[0_0_6px_rgba(0,238,252,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#00eefc] shadow-[0_0_6px_rgba(0,238,252,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#ff4a8d] shadow-[0_0_6px_rgba(255,74,141,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#3c2e50] opacity-40"></div>
            </div>
            <span className="font-mono-data text-[11px] text-[#00eefc] w-20 text-right font-bold tabular-nums">
              {currentCar.stats.topSpeed} KM/H
            </span>
          </div>

          {/* Nitro Stat */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 w-24 shrink-0">
              <span className="material-symbols-outlined text-[#ff4a8d] text-sm material-symbols-filled">
                local_fire_department
              </span>
              <span className="font-mono-data text-[9px] text-[#e5bcc5] uppercase">Nitro Burn</span>
            </div>
            <div className="flex-1 flex gap-1 h-2 bg-[#3c2e50]/60 p-0.5 rounded">
              <div className="flex-1 rounded-sm bg-[#00eefc] shadow-[0_0_6px_rgba(0,238,252,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#00eefc] shadow-[0_0_6px_rgba(0,238,252,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#00eefc] shadow-[0_0_6px_rgba(0,238,252,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#ff4a8d] shadow-[0_0_6px_rgba(255,74,141,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#ff4a8d] shadow-[0_0_6px_rgba(255,74,141,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#3c2e50] opacity-40"></div>
              <div className="flex-1 rounded-sm bg-[#3c2e50] opacity-40"></div>
              <div className="flex-1 rounded-sm bg-[#3c2e50] opacity-40"></div>
            </div>
            <span className="font-mono-data text-[11px] text-[#ffb1c4] w-20 text-right font-bold tabular-nums">
              {currentCar.stats.nitroBurn} SEC
            </span>
          </div>

          {/* Agility Stat */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 w-24 shrink-0">
              <span className="material-symbols-outlined text-[#dec800] text-sm">airline_stops</span>
              <span className="font-mono-data text-[9px] text-[#e5bcc5] uppercase">Stunt Agility</span>
            </div>
            <div className="flex-1 flex gap-1 h-2 bg-[#3c2e50]/60 p-0.5 rounded">
              <div className="flex-1 rounded-sm bg-[#00eefc] shadow-[0_0_6px_rgba(0,238,252,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#00eefc] shadow-[0_0_6px_rgba(0,238,252,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#00eefc] shadow-[0_0_6px_rgba(0,238,252,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#00eefc] shadow-[0_0_6px_rgba(0,238,252,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#00eefc] shadow-[0_0_6px_rgba(0,238,252,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#dec800] shadow-[0_0_6px_rgba(253,228,0,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#dec800] shadow-[0_0_6px_rgba(253,228,0,0.8)]"></div>
              <div className="flex-1 rounded-sm bg-[#dec800] shadow-[0_0_6px_rgba(253,228,0,0.8)]"></div>
            </div>
            <span className="font-mono-data text-[11px] text-[#dec800] w-20 text-right font-bold">
              {currentCar.stats.stuntAgility}
            </span>
          </div>
        </div>
      </section>

      {/* QUICK CAR SELECTOR: 6 REALISTIC CARS ON GAMER'S CHOICE */}
      <section className="bg-[#1b0d2d] rounded-2xl p-3 border border-[#3c2e50] shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#00eefc] text-base">directions_car</span>
            <span className="font-mono-data text-[10px] uppercase tracking-wider text-white font-extrabold">
              Select Your Car ({cars.length} Realistic Legends)
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('garage')}
            className="text-[10px] font-mono-data text-[#ff4a8d] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
          >
            Customize Livery →
          </button>
        </div>

        {/* Scrollable Car Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {cars.map((carItem) => {
            const isSelected = carItem.id === currentCar.id;
            return (
              <button
                key={carItem.id}
                onClick={() => {
                  soundEngine.playEngineRev();
                  onSelectCar(carItem.id);
                }}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#302445] border-[#00eefc] shadow-[0_0_15px_rgba(0,238,252,0.5)] scale-[1.02]'
                    : 'bg-[#26193a]/80 border-[#3c2e50] hover:border-[#00eefc]/50 hover:bg-[#26193a]'
                }`}
              >
                {/* Active Tag */}
                {isSelected && (
                  <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded bg-[#00eefc] text-black font-mono-data text-[8px] font-extrabold uppercase">
                    ACTIVE
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/40 shrink-0"
                      style={{ backgroundColor: carItem.primaryColor }}
                    ></span>
                    <span className="font-headline text-[11px] font-extrabold text-white uppercase leading-tight truncate">
                      {carItem.name}
                    </span>
                  </div>
                  <div className="font-mono-data text-[9px] text-[#e5bcc5] truncate mb-1">
                    {carItem.chassisCode}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#3c2e50]/60 text-[9px] font-mono-data">
                  <span className="text-emerald-400 font-bold">{carItem.stats.topSpeed} KM/H</span>
                  <span className="text-[#dec800]">{carItem.tier.split(' ')[0]}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Big Arcade Action Button (Coin-Op Cabinet Feel) */}
      <div className="relative w-full group pt-1">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#ff4a8d] via-[#dec800] to-[#00eefc] rounded-2xl blur-md opacity-80 group-hover:opacity-100 transition duration-300"></div>
        <button
          onClick={handleStartNightRun}
          className="relative w-full py-4 px-5 rounded-xl bg-gradient-to-r from-[#ff4a8d] via-[#ba005b] to-[#ff4a8d] flex items-center justify-between text-white shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_6px_20px_rgba(255,74,141,0.6)] active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="p-2.5 rounded-lg bg-[#140727]/50 backdrop-blur-sm border border-[#00eefc]/40">
              <span className="material-symbols-outlined text-[#00eefc] text-3xl animate-pulse">
                rocket_launch
              </span>
            </div>
            <div>
              <span className="block font-mono-data text-[10px] uppercase tracking-widest text-[#ffd9e1] font-bold">
                Ready for Blastoff
              </span>
              <span className="font-headline text-xl sm:text-2xl uppercase tracking-wider italic text-white leading-none block -skew-x-6 font-extrabold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                START NIGHT RUN
              </span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#140727]/40 border border-[#00eefc]/40 flex items-center justify-center shadow-[0_0_12px_rgba(0,238,252,0.4)]">
            <span className="material-symbols-outlined text-[#00eefc] text-2xl">arrow_forward</span>
          </div>
        </button>
      </div>

      {/* Daily Stunt Challenge Quest Banner */}
      <section className="rounded-xl p-3.5 bg-[#302445] relative overflow-hidden border border-[#dec800]/30 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#bfac00]/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#dec800] text-lg material-symbols-filled">
              stars
            </span>
            <span className="font-mono-data text-[10px] uppercase tracking-widest text-[#fde400] font-bold">
              Daily Stunt Bounty
            </span>
          </div>
          <div className="flex items-center gap-1 bg-[#140727]/80 px-2 py-0.5 rounded border border-[#dec800]/40">
            <span className="material-symbols-outlined text-[#dec800] text-xs leading-none">
              monetization_on
            </span>
            <span className="font-mono-data text-[10px] text-[#dec800] font-bold">
              +{profile.dailyBounty.reward} CREDITS
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-body text-sm text-[#ecdcff] font-semibold">
              {profile.dailyBounty.title}
            </span>
            <span className="font-mono-data text-xs text-[#00eefc] font-bold">
              {profile.dailyBounty.current} / {profile.dailyBounty.target}
            </span>
          </div>

          {/* Track Meter */}
          <div className="w-full h-2 rounded-full bg-[#140727] overflow-hidden flex p-0.5 border border-[#3c2e50]">
            <div
              className="h-full bg-gradient-to-r from-[#00eefc] to-[#dec800] rounded-full shadow-[0_0_8px_rgba(0,238,252,0.6)] transition-all duration-500"
              style={{ width: `${(profile.dailyBounty.current / profile.dailyBounty.target) * 100}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between font-mono-data text-[10px] text-[#e5bcc5]">
            <span>Resets in: {profile.dailyBounty.resetsIn}</span>
            <button
              onClick={onUpdateBountyTrack}
              className={`underline cursor-pointer transition-colors ${
                profile.dailyBounty.trackedOnHud ? 'text-[#00eefc] font-bold' : 'text-[#e5bcc5] hover:text-white'
              }`}
            >
              {profile.dailyBounty.trackedOnHud ? '✓ Tracking on HUD' : 'Track on HUD'}
            </button>
          </div>
        </div>
      </section>

      {/* Arcade Game Modes Selector Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <span className="font-mono-data text-[9px] uppercase tracking-widest text-[#00eefc] font-bold">
            Cartridge Select
          </span>
          <h3 className="font-headline text-lg sm:text-xl text-white uppercase tracking-wide font-extrabold">
            Race &amp; Stunt Modes
          </h3>
        </div>
        <span className="font-mono-data text-[10px] text-[#e5bcc5] font-bold">
          3 MODES ACTIVE
        </span>
      </div>

      {/* Game Mode Cards Vertical Flow */}
      <div className="space-y-2.5">
        {GAME_MODES.map((mode) => (
          <article
            key={mode.id}
            onClick={() => {
              soundEngine.playCoinPickup();
              setSelectedModeForModal(mode.id);
            }}
            className="group relative rounded-xl overflow-hidden bg-[#302445] border border-[#3c2e50] hover:border-[#00eefc]/50 transition-all duration-200 active:scale-[0.99] shadow-[0_4px_16px_rgba(0,0,0,0.4)] cursor-pointer"
          >
            <div className="flex h-28">
              <div className="w-1/3 relative shrink-0 overflow-hidden">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  alt={mode.title}
                  src={mode.image}
                  onError={(e) => {
                    // Styled fallback in case of network issue
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#302445]"></div>
                <span
                  className={`absolute top-2 left-2 px-1.5 py-0.5 rounded font-mono-data text-[9px] font-bold ${mode.badgeBg} ${mode.badgeColor} border border-white/10`}
                >
                  {mode.badge}
                </span>
              </div>
              <div className="w-2/3 p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-headline text-base leading-tight text-[#00eefc] group-hover:text-white uppercase tracking-wide font-bold">
                      {mode.title}
                    </h4>
                    <span className="material-symbols-outlined text-[#00eefc] group-hover:text-[#ff4a8d] text-xl transition-colors">
                      play_circle
                    </span>
                  </div>
                  <p className="font-body text-xs text-[#e5bcc5] mt-0.5 line-clamp-2">
                    {mode.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  {mode.tags.map((t, i) => (
                    <span
                      key={i}
                      className={`flex items-center gap-1 font-mono-data text-[10px] ${t.color}`}
                    >
                      <span className="material-symbols-outlined text-xs">{t.icon}</span>
                      {t.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Quick Garage & Tuning Quick-Deck */}
      <section className="rounded-xl p-3.5 bg-[#211536] border border-[#3c2e50] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00eefc]">tune</span>
            <span className="font-headline text-base text-white uppercase font-bold tracking-wide">
              Pit Stop Quick Tune
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('garage')}
            className="px-2.5 py-1 rounded bg-[#26193a] hover:bg-[#302445] text-[#00eefc] hover:text-white border border-[#00eefc]/30 font-mono-data text-[10px] uppercase font-bold transition-colors cursor-pointer"
          >
            Full Garage
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Tuning slot 1: Neon Underglow */}
          <button
            onClick={onToggleUnderglow}
            className="p-2.5 rounded-lg bg-[#26193a] hover:bg-[#302445] border border-[#00eefc]/20 flex items-center justify-between text-left transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#00eefc]/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#00eefc] text-base">lightbulb</span>
              </div>
              <div>
                <span className="block font-mono-data text-[9px] text-[#ecdcff] uppercase font-bold">
                  Underglow
                </span>
                <span className="block font-mono-data text-[10px] text-[#00eefc] font-bold">
                  {profile.activeUnderglow}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#00eefc] text-base material-symbols-filled">
              check_circle
            </span>
          </button>

          {/* Tuning slot 2: Twin Turbo Nitro */}
          <button
            onClick={onToggleNitroJet}
            className="p-2.5 rounded-lg bg-[#26193a] hover:bg-[#302445] border border-[#ff4a8d]/20 flex items-center justify-between text-left transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#ff4a8d]/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#ff4a8d] text-base">bolt</span>
              </div>
              <div>
                <span className="block font-mono-data text-[9px] text-[#ecdcff] uppercase font-bold">
                  Nitro Jet
                </span>
                <span className="block font-mono-data text-[10px] text-[#ff4a8d] font-bold">
                  {profile.activeNitroJet}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#ff4a8d] text-base material-symbols-filled">
              check_circle
            </span>
          </button>
        </div>
      </section>

      {/* Live Stunt Leaderboard Mini-Strip */}
      <section
        onClick={() => onNavigateTab('rankings')}
        className="rounded-xl p-3 bg-[#302445]/90 border border-[#dec800]/30 flex items-center justify-between hover:border-[#dec800] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[#dec800] text-2xl material-symbols-filled">
            military_tech
          </span>
          <div>
            <span className="font-mono-data text-[9px] uppercase text-[#e5bcc5] block font-bold">
              Sunset Ramp Highscore
            </span>
            <span className="font-mono-data text-[11px] text-white font-bold tracking-wide">
              #1 SYNTH_VIXEN - 1,480,200 PTS
            </span>
          </div>
        </div>
        <span className="px-2 py-1 rounded bg-[#3c2e50] text-[#00eefc] font-mono-data text-[10px] font-bold uppercase shadow-[0_0_8px_rgba(0,238,252,0.3)]">
          Top 1%
        </span>
      </section>

      {/* Pre-Race Mode Launch Modal */}
      {selectedModeForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          {(() => {
            const mode = GAME_MODES.find((m) => m.id === selectedModeForModal);
            if (!mode) return null;
            return (
              <div className="bg-[#26193a] border border-[#00eefc] rounded-2xl p-6 max-w-sm w-full shadow-[0_0_35px_rgba(0,238,252,0.5)]">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded font-mono-data text-[10px] font-bold ${mode.badgeBg} ${mode.badgeColor}`}>
                    {mode.badge}
                  </span>
                  <button
                    onClick={() => setSelectedModeForModal(null)}
                    className="text-[#e5bcc5] hover:text-white text-lg p-1"
                  >
                    ✕
                  </button>
                </div>

                <h3 className="font-headline text-2xl font-extrabold text-white uppercase tracking-wider mb-2">
                  {mode.title}
                </h3>
                <p className="text-[#e5bcc5] text-xs mb-4">
                  {mode.description}
                </p>

                <div className="space-y-2 font-mono-data text-xs bg-[#140727] p-3 rounded-xl border border-[#3c2e50] mb-5">
                  <div className="flex justify-between">
                    <span className="text-[#e5bcc5]">Target Score:</span>
                    <span className="text-[#dec800] font-bold">{mode.targetScore.toLocaleString()} PTS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#e5bcc5]">Time Limit:</span>
                    <span className="text-[#00eefc] font-bold">{mode.timeLimitSec} Seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#e5bcc5]">Stunt Multiplier:</span>
                    <span className="text-[#ff4a8d] font-bold">{mode.stuntBonusMultiplier}x XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#e5bcc5]">Chassis Ready:</span>
                    <span className="text-emerald-400 font-bold">{currentCar.name}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedModeForModal(null)}
                    className="flex-1 py-3 rounded-xl bg-[#302445] text-[#e5bcc5] font-headline text-xs font-bold uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setSelectedModeForModal(null);
                      soundEngine.playEngineRev();
                      onLaunchGame(mode.id);
                    }}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#ff4a8d] to-[#00eefc] text-white font-headline text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,74,141,0.6)]"
                  >
                    Launch Track
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
