import React, { useState } from 'react';
import { HyperCar, PlayerProfile } from '../types/game';
import { HYPER_CARS } from '../data/gameData';
import { soundEngine } from '../audio/synthAudio';

interface GarageViewProps {
  profile: PlayerProfile;
  cars: HyperCar[];
  currentCar: HyperCar;
  onSelectCar: (carId: string) => void;
  onUnlockCar: (carId: string, cost: number) => void;
  onUpgradeStat: (carId: string, stat: 'speed' | 'nitro' | 'agility') => void;
  onUpdateUnderglow: (color: string) => void;
  onUpdateLivery: (carId: string, color: string) => void;
}

export const GarageView: React.FC<GarageViewProps> = ({
  profile,
  cars,
  currentCar,
  onSelectCar,
  onUnlockCar,
  onUpgradeStat,
  onUpdateUnderglow,
  onUpdateLivery,
}) => {
  const [selectedCarId, setSelectedCarId] = useState<string>(currentCar.id);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeCar = cars.find((c) => c.id === selectedCarId) || currentCar;
  const isSelectedCarCurrent = profile.currentCarId === activeCar.id;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const underglowOptions = [
    { name: 'CYAN PULSE', color: '#00eefc', glow: 'shadow-[0_0_12px_#00eefc]' },
    { name: 'MAGENTA GLOW', color: '#ff4a8d', glow: 'shadow-[0_0_12px_#ff4a8d]' },
    { name: 'SUNSET GOLD', color: '#dec800', glow: 'shadow-[0_0_12px_#dec800]' },
    { name: 'PURPLE HAZE', color: '#a855f7', glow: 'shadow-[0_0_12px_#a855f7]' },
  ];

  const liveryColors = [
    { label: 'Lilac', hex: '#c084fc' },
    { label: 'Neon Cyan', hex: '#00eefc' },
    { label: 'Outrun Pink', hex: '#ff4a8d' },
    { label: 'Solar Gold', hex: '#fde400' },
    { label: 'Midnight Black', hex: '#1e1b4b' },
  ];

  const handleTestRev = () => {
    soundEngine.playEngineRev();
    showToast('Engine spooling at 8,500 RPM!');
  };

  const handleUpgrade = (stat: 'speed' | 'nitro' | 'agility', cost: number) => {
    if (profile.diamonds < cost) {
      showToast('Not enough Diamonds! Complete stunts to earn more.');
      return;
    }
    soundEngine.playStuntSuccess();
    onUpgradeStat(activeCar.id, stat);
    showToast(`Upgraded ${stat.toUpperCase()}! -${cost} Diamonds`);
  };

  return (
    <div className="flex flex-col w-full pb-28 space-y-4 px-3.5 max-w-xl mx-auto pt-2">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#26193a] border border-[#00eefc] text-[#00eefc] font-mono-data text-xs font-bold shadow-[0_0_20px_rgba(0,238,252,0.6)] animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Header Deck */}
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono-data text-[9px] uppercase tracking-widest text-[#00eefc] font-bold">
            Custom Workshop
          </span>
          <h2 className="font-headline text-2xl text-white uppercase tracking-wider font-extrabold">
            Neon Garage
          </h2>
        </div>
        <button
          onClick={handleTestRev}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#302445] hover:bg-[#3c2e50] border border-[#ff4a8d]/40 text-[#ffb1c4] font-mono-data text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-[0_0_10px_rgba(255,74,141,0.2)]"
        >
          <span className="material-symbols-outlined text-sm text-[#ff4a8d] material-symbols-filled">
            volume_up
          </span>
          Test Rev
        </button>
      </div>

      {/* Car Selector Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
        {cars.map((car) => {
          const isSelected = car.id === selectedCarId;
          const isCurrent = car.id === profile.currentCarId;
          return (
            <button
              key={car.id}
              onClick={() => {
                soundEngine.playCoinPickup();
                setSelectedCarId(car.id);
              }}
              className={`flex-shrink-0 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#302445] border-[#00eefc] shadow-[0_0_15px_rgba(0,238,252,0.4)]'
                  : 'bg-[#211536] border-[#3c2e50] hover:border-[#00eefc]/40'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-headline text-xs font-bold text-white uppercase">
                  {car.name}
                </span>
                {isCurrent && (
                  <span className="w-2 h-2 rounded-full bg-[#00eefc] animate-pulse"></span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono-data text-[9px] text-[#dec800]">{car.tier}</span>
                {!car.isUnlocked && (
                  <span className="material-symbols-outlined text-xs text-[#ffb4ab]">lock</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Vehicle Showcase Stage */}
      <section className="relative w-full rounded-2xl bg-[#140727] overflow-hidden border border-[#3c2e50] shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
        <div className="relative w-full h-64 overflow-hidden flex items-end justify-center">
          <img
            alt={activeCar.name}
            className="absolute inset-0 w-full h-full object-cover object-bottom filter contrast-125"
            src={activeCar.heroImage}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/aistudio/Image_1_a7cd5dac.png';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#140727] via-[#140727]/30 to-transparent pointer-events-none"></div>

          {/* Underglow Visualizer */}
          <div
            className="absolute bottom-2 inset-x-8 h-3 rounded-full blur-md opacity-90 transition-all duration-300 pointer-events-none"
            style={{ backgroundColor: activeCar.underglowColor || '#00eefc' }}
          ></div>

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span className="px-2.5 py-1 rounded bg-[#3c2e50]/90 border border-[#ff4a8d]/40 font-mono-data text-[10px] text-[#ffb1c4] font-bold">
              {activeCar.tier}
            </span>
            <span className="px-2.5 py-1 rounded bg-[#302445]/90 border border-[#00eefc]/40 font-mono-data text-[10px] text-[#00eefc] font-bold">
              {activeCar.chassisCode}
            </span>
          </div>

          <div className="relative z-10 w-full px-4 pb-3">
            <h3 className="font-headline text-2xl text-white uppercase font-extrabold drop-shadow-[0_0_12px_rgba(0,238,252,0.8)]">
              {activeCar.name}
            </h3>
            <p className="text-xs text-[#e5bcc5] font-body line-clamp-1">
              {activeCar.description}
            </p>
          </div>
        </div>

        {/* Action Button: Equip or Unlock */}
        <div className="p-3 bg-[#211536] border-t border-[#3c2e50] flex gap-2">
          {activeCar.isUnlocked ? (
            <button
              onClick={() => {
                soundEngine.playCoinPickup();
                onSelectCar(activeCar.id);
                showToast(`Equipped ${activeCar.name} as primary stunt rig!`);
              }}
              disabled={isSelectedCarCurrent}
              className={`flex-1 py-2.5 rounded-xl font-headline text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isSelectedCarCurrent
                  ? 'bg-[#302445] text-[#00eefc] border border-[#00eefc]/40'
                  : 'bg-gradient-to-r from-[#ff4a8d] to-[#00eefc] text-white shadow-[0_0_15px_rgba(255,74,141,0.5)] active:scale-95'
              }`}
            >
              {isSelectedCarCurrent ? '✓ Current Active Rig' : 'Equip for Night Run'}
            </button>
          ) : (
            <button
              onClick={() => {
                if (profile.diamonds >= activeCar.costDiamonds) {
                  soundEngine.playStuntSuccess();
                  onUnlockCar(activeCar.id, activeCar.costDiamonds);
                  showToast(`Unlocked ${activeCar.name}!`);
                } else {
                  showToast(`Need ${activeCar.costDiamonds.toLocaleString()} Diamonds to unlock!`);
                }
              }}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#dec800] to-[#ff4a8d] text-black font-headline text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(253,228,0,0.5)] active:scale-95 cursor-pointer"
            >
              Unlock Rig ({activeCar.costDiamonds.toLocaleString()} 💎)
            </button>
          )}
        </div>
      </section>

      {/* Custom Livery & Underglow Workshop */}
      <section className="rounded-xl p-3.5 bg-[#26193a] border border-[#3c2e50] space-y-3">
        <h4 className="font-headline text-sm font-bold text-[#00eefc] uppercase tracking-wide flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base">palette</span>
          Neon Livery &amp; Underglow
        </h4>

        {/* Livery Paint */}
        <div>
          <span className="font-mono-data text-[10px] text-[#e5bcc5] uppercase block mb-1.5">
            Body Paint Finish
          </span>
          <div className="flex gap-2">
            {liveryColors.map((col) => (
              <button
                key={col.label}
                onClick={() => {
                  soundEngine.playCoinPickup();
                  onUpdateLivery(activeCar.id, col.hex);
                  showToast(`Applied ${col.label} livery!`);
                }}
                className="flex-1 py-1 px-1.5 rounded-lg border border-[#3c2e50] flex flex-col items-center gap-1 hover:border-[#00eefc] transition-all cursor-pointer"
              >
                <span
                  className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: col.hex }}
                ></span>
                <span className="font-mono-data text-[8px] text-[#e5bcc5] truncate">{col.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Underglow Tubes */}
        <div>
          <span className="font-mono-data text-[10px] text-[#e5bcc5] uppercase block mb-1.5">
            Neon Underglow Tube Pulse
          </span>
          <div className="grid grid-cols-2 gap-2">
            {underglowOptions.map((opt) => {
              const isActive = profile.activeUnderglow === opt.name;
              return (
                <button
                  key={opt.name}
                  onClick={() => {
                    soundEngine.playCoinPickup();
                    onUpdateUnderglow(opt.name);
                    showToast(`Underglow switched to ${opt.name}!`);
                  }}
                  className={`p-2 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#302445] border-[#00eefc] shadow-[0_0_12px_rgba(0,238,252,0.3)]'
                      : 'bg-[#140727] border-[#3c2e50] hover:border-[#00eefc]/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: opt.color, boxShadow: `0 0 8px ${opt.color}` }}
                    ></span>
                    <span className="font-mono-data text-[10px] text-white font-bold">{opt.name}</span>
                  </div>
                  {isActive && (
                    <span className="material-symbols-outlined text-[#00eefc] text-sm material-symbols-filled">
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Performance Tuning & Overclock Bench */}
      <section className="rounded-xl p-3.5 bg-[#26193a] border border-[#3c2e50] space-y-3">
        <h4 className="font-headline text-sm font-bold text-[#ff4a8d] uppercase tracking-wide flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base">bolt</span>
          Performance Tuning (Overclocking)
        </h4>

        {/* Speed Upgrade */}
        <div className="p-2.5 rounded-lg bg-[#140727] border border-[#3c2e50] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1">
              <span className="font-headline text-xs font-bold text-white uppercase">Top Speed ECU</span>
              <span className="font-mono-data text-[10px] text-[#00eefc] font-bold">
                {activeCar.stats.topSpeed} KM/H
              </span>
            </div>
            <span className="font-mono-data text-[9px] text-[#e5bcc5]">
              Overclock fuel injection curves
            </span>
          </div>
          <button
            onClick={() => handleUpgrade('speed', 1500)}
            className="px-3 py-1.5 rounded-lg bg-[#302445] hover:bg-[#ff4a8d] hover:text-white text-[#ffb1c4] border border-[#ff4a8d]/40 font-mono-data text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
          >
            +8 KM/H (1,500 💎)
          </button>
        </div>

        {/* Nitro Burn Upgrade */}
        <div className="p-2.5 rounded-lg bg-[#140727] border border-[#3c2e50] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1">
              <span className="font-headline text-xs font-bold text-white uppercase">Nitro Burn Jet</span>
              <span className="font-mono-data text-[10px] text-[#ff4a8d] font-bold">
                {activeCar.stats.nitroBurn} SEC
              </span>
            </div>
            <span className="font-mono-data text-[9px] text-[#e5bcc5]">
              High-pressure nitrous oxide canisters
            </span>
          </div>
          <button
            onClick={() => handleUpgrade('nitro', 1200)}
            className="px-3 py-1.5 rounded-lg bg-[#302445] hover:bg-[#ff4a8d] hover:text-white text-[#ffb1c4] border border-[#ff4a8d]/40 font-mono-data text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
          >
            +0.5s (1,200 💎)
          </button>
        </div>

        {/* Agility Upgrade */}
        <div className="p-2.5 rounded-lg bg-[#140727] border border-[#3c2e50] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1">
              <span className="font-headline text-xs font-bold text-white uppercase">Stunt Suspension</span>
              <span className="font-mono-data text-[10px] text-[#dec800] font-bold">
                {activeCar.stats.stuntAgility}
              </span>
            </div>
            <span className="font-mono-data text-[9px] text-[#e5bcc5]">
              Hydraulic roll-stabilizers for 360 flips
            </span>
          </div>
          <button
            onClick={() => handleUpgrade('agility', 2000)}
            className="px-3 py-1.5 rounded-lg bg-[#302445] hover:bg-[#dec800] hover:text-black text-[#dec800] border border-[#dec800]/40 font-mono-data text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
          >
            Tune Agility (2,000 💎)
          </button>
        </div>
      </section>
    </div>
  );
};
