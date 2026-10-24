export type ScreenTab = 'lobby' | 'garage' | 'stunts' | 'rankings';

export type GameModeId = 'neon-sprint' | 'mega-ramp' | 'outrun-attack';

export interface GameModeConfig {
  id: GameModeId;
  title: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  description: string;
  tags: { icon: string; text: string; color: string }[];
  image: string;
  targetScore: number;
  timeLimitSec: number;
  stuntBonusMultiplier: number;
  trafficDensity: 'low' | 'medium' | 'high';
  rampFrequency: 'medium' | 'very-high' | 'low';
}

export interface CarStats {
  topSpeed: number; // km/h
  nitroBurn: number; // sec
  stuntAgility: string; // e.g. "GRADE A+"
  agilityScore: number; // 1-10
  acceleration: number; // 1-10
}

export interface HyperCar {
  id: string;
  name: string;
  chassisCode: string;
  tier: string;
  isUnlocked: boolean;
  costDiamonds: number;
  heroImage: string;
  description: string;
  primaryColor: string;
  underglowColor: string;
  overclockLevel: number;
  stats: CarStats;
}

export interface PlayerProfile {
  level: number;
  diamonds: number;
  flameTokens: number;
  currentCarId: string;
  activeUnderglow: string;
  activeNitroJet: string;
  dailyBounty: {
    title: string;
    target: number;
    current: number;
    reward: number;
    resetsIn: string;
    isCompleted: boolean;
    trackedOnHud: boolean;
  };
  totalStuntsCompleted: number;
  highScore: number;
}

export interface StuntTrick {
  id: string;
  name: string;
  pts: number;
  icon: string;
  keyCombo: string;
  difficulty: 'Easy' | 'Medium' | 'Extreme';
  completedTimes: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  car: string;
  score: number;
  mode: string;
  isPlayer?: boolean;
  badge?: string;
}
