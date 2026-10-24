import React, { useState, useEffect } from 'react';
import { ScreenTab, GameModeId, HyperCar, PlayerProfile } from './types/game';
import { HYPER_CARS, INITIAL_PLAYER_PROFILE } from './data/gameData';
import { TopHeader } from './components/TopHeader';
import { BottomNav } from './components/BottomNav';
import { LobbyView } from './components/LobbyView';
import { GarageView } from './components/GarageView';
import { StuntsView } from './components/StuntsView';
import { RankingsView } from './components/RankingsView';
import { NitroWaveGame } from './game/NitroWaveGame';
import { soundEngine } from './audio/synthAudio';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ScreenTab>('lobby');
  const [activeGameMode, setActiveGameMode] = useState<GameModeId | null>(null);

  // Load from localStorage or fallback
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem('nitrowave_profile');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_PLAYER_PROFILE;
  });

  const [cars, setCars] = useState<HyperCar[]>(() => {
    try {
      const saved = localStorage.getItem('nitrowave_cars');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= HYPER_CARS.length) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return HYPER_CARS;
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nitrowave_profile', JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem('nitrowave_cars', JSON.stringify(cars));
    } catch {
      // ignore
    }
  }, [cars]);

  const activeCar = cars.find((c) => c.id === profile.currentCarId) || cars[0];

  const handleLaunchGame = (modeId: GameModeId) => {
    setActiveGameMode(modeId);
  };

  const handleExitGame = () => {
    setActiveGameMode(null);
  };

  const handleFinishRun = (stats: {
    score: number;
    diamondsEarned: number;
    stuntsCompleted: number;
    topSpeed: number;
    modeId: GameModeId;
  }) => {
    setProfile((prev) => {
      const newDiamonds = prev.diamonds + stats.diamondsEarned;
      const newFlames = prev.flameTokens + 15;
      const newHighScore = Math.max(prev.highScore, stats.score);
      const newStunts = prev.totalStuntsCompleted + stats.stuntsCompleted;

      // Update bounty progress
      let bountyCurrent = prev.dailyBounty.current;
      if (stats.stuntsCompleted > 0 && !prev.dailyBounty.isCompleted) {
        bountyCurrent = Math.min(prev.dailyBounty.target, bountyCurrent + stats.stuntsCompleted);
      }

      return {
        ...prev,
        diamonds: newDiamonds,
        flameTokens: newFlames,
        highScore: newHighScore,
        totalStuntsCompleted: newStunts,
        dailyBounty: {
          ...prev.dailyBounty,
          current: bountyCurrent,
        },
      };
    });

    setActiveGameMode(null);
  };

  const handleAddDiamonds = (amount: number) => {
    setProfile((prev) => ({
      ...prev,
      diamonds: prev.diamonds + amount,
    }));
  };

  const handleSelectCar = (carId: string) => {
    setProfile((prev) => ({ ...prev, currentCarId: carId }));
  };

  const handleUnlockCar = (carId: string, cost: number) => {
    setCars((prev) =>
      prev.map((c) => (c.id === carId ? { ...c, isUnlocked: true } : c))
    );
    setProfile((prev) => ({
      ...prev,
      diamonds: prev.diamonds - cost,
      currentCarId: carId,
    }));
  };

  const handleUpgradeStat = (carId: string, stat: 'speed' | 'nitro' | 'agility') => {
    setCars((prev) =>
      prev.map((c) => {
        if (c.id !== carId) return c;
        const newStats = { ...c.stats };
        if (stat === 'speed') newStats.topSpeed += 8;
        if (stat === 'nitro') newStats.nitroBurn = parseFloat((newStats.nitroBurn + 0.5).toFixed(1));
        if (stat === 'agility') newStats.stuntAgility = 'GRADE S+';

        return {
          ...c,
          overclockLevel: c.overclockLevel + 1,
          stats: newStats,
        };
      })
    );

    const costMap = { speed: 1500, nitro: 1200, agility: 2000 };
    setProfile((prev) => ({
      ...prev,
      diamonds: Math.max(0, prev.diamonds - costMap[stat]),
      level: prev.level + 1,
    }));
  };

  const handleUpdateUnderglow = (name: string) => {
    setProfile((prev) => ({ ...prev, activeUnderglow: name }));
    const colorMap: Record<string, string> = {
      'CYAN PULSE': '#00eefc',
      'MAGENTA GLOW': '#ff4a8d',
      'SUNSET GOLD': '#dec800',
      'PURPLE HAZE': '#a855f7',
    };
    const newColor = colorMap[name] || '#00eefc';
    setCars((prev) =>
      prev.map((c) => (c.id === profile.currentCarId ? { ...c, underglowColor: newColor } : c))
    );
  };

  const handleToggleUnderglow = () => {
    soundEngine.playCoinPickup();
    const modes = ['CYAN PULSE', 'MAGENTA GLOW', 'SUNSET GOLD', 'PURPLE HAZE'];
    const idx = modes.indexOf(profile.activeUnderglow);
    const nextMode = modes[(idx + 1) % modes.length];
    handleUpdateUnderglow(nextMode);
  };

  const handleToggleNitroJet = () => {
    soundEngine.playNitroBoost();
    const stages = ['STAGE 1 BLOW', 'STAGE 2 BLOW', 'STAGE 3 TWIN HYPER', 'STAGE 4 OVERDRIVE'];
    const idx = stages.indexOf(profile.activeNitroJet);
    const nextStage = stages[(idx + 1) % stages.length];
    setProfile((prev) => ({ ...prev, activeNitroJet: nextStage }));
  };

  const handleUpdateLivery = (carId: string, colorHex: string) => {
    setCars((prev) =>
      prev.map((c) => (c.id === carId ? { ...c, primaryColor: colorHex } : c))
    );
  };

  const handleUpdateBountyTrack = () => {
    soundEngine.playCoinPickup();
    setProfile((prev) => ({
      ...prev,
      dailyBounty: {
        ...prev.dailyBounty,
        trackedOnHud: !prev.dailyBounty.trackedOnHud,
      },
    }));
  };

  const handleClaimBounty = () => {
    setProfile((prev) => ({
      ...prev,
      diamonds: prev.diamonds + prev.dailyBounty.reward,
      dailyBounty: {
        ...prev.dailyBounty,
        isCompleted: true,
      },
    }));
  };

  // If in active 3D gameplay
  if (activeGameMode) {
    return (
      <NitroWaveGame
        modeId={activeGameMode}
        car={activeCar}
        profile={profile}
        onExitGame={handleExitGame}
        onFinishRun={handleFinishRun}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#190c2d] text-[#ecdcff] flex flex-col relative selection:bg-[#ff4a8d] selection:text-white overflow-x-hidden">
      {/* Top Header */}
      <TopHeader
        profile={profile}
        currentTab={currentTab}
        onAddDiamonds={handleAddDiamonds}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative w-full pt-16 perspective-grid">
        {currentTab === 'lobby' && (
          <LobbyView
            profile={profile}
            cars={cars}
            currentCar={activeCar}
            onSelectCar={handleSelectCar}
            onLaunchGame={handleLaunchGame}
            onNavigateTab={setCurrentTab}
            onToggleUnderglow={handleToggleUnderglow}
            onToggleNitroJet={handleToggleNitroJet}
            onUpdateBountyTrack={handleUpdateBountyTrack}
          />
        )}

        {currentTab === 'garage' && (
          <GarageView
            profile={profile}
            cars={cars}
            currentCar={activeCar}
            onSelectCar={handleSelectCar}
            onUnlockCar={handleUnlockCar}
            onUpgradeStat={handleUpgradeStat}
            onUpdateUnderglow={handleUpdateUnderglow}
            onUpdateLivery={handleUpdateLivery}
          />
        )}

        {currentTab === 'stunts' && (
          <StuntsView
            profile={profile}
            onLaunchStuntMode={() => handleLaunchGame('mega-ramp')}
            onClaimBounty={handleClaimBounty}
          />
        )}

        {currentTab === 'rankings' && (
          <RankingsView
            profile={profile}
            onChallengeHighscore={() => handleLaunchGame('neon-sprint')}
          />
        )}
      </main>

      {/* Bottom Nav Bar */}
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}
