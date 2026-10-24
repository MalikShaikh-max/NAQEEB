import React from 'react';
import { ScreenTab } from '../types/game';
import { soundEngine } from '../audio/synthAudio';

interface BottomNavProps {
  currentTab: ScreenTab;
  onTabChange: (tab: ScreenTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs: { id: ScreenTab; label: string; icon: string }[] = [
    { id: 'lobby', label: 'LOBBY', icon: 'sports_score' },
    { id: 'garage', label: 'GARAGE', icon: 'build' },
    { id: 'stunts', label: 'STUNTS', icon: 'emoji_events' },
    { id: 'rankings', label: 'RANKINGS', icon: 'military_tech' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-[#140727]/90 backdrop-blur-xl border-t border-[#3c2e50]/70 shadow-[0_-4px_24px_rgba(0,0,0,0.7)]">
      <div className="max-w-2xl mx-auto flex justify-around items-center h-16 px-3">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundEngine.playCoinPickup();
                onTabChange(tab.id);
              }}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] px-3 py-1 rounded-lg transition-all duration-200 group cursor-pointer ${
                isActive
                  ? 'text-[#00eefc] bg-[#26193a]/80 shadow-[inset_0_0_12px_rgba(0,238,252,0.4)] border border-[#00eefc]/30 scale-105'
                  : 'text-[#e5bcc5] hover:text-[#d3fbff] hover:bg-[#26193a]/30'
              }`}
            >
              <span
                className={`material-symbols-outlined text-xl transition-transform duration-200 ${
                  isActive ? 'scale-110 material-symbols-filled text-[#00eefc]' : 'group-hover:scale-110'
                }`}
              >
                {tab.icon}
              </span>
              <span className="font-mono-data text-[10px] uppercase tracking-wider mt-0.5 font-bold">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
