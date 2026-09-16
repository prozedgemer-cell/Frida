export type ThemePack =
  | 'bdsm'
  | 'clothing'
  | 'sex'
  | 'irl'
  | 'porn'
  | 'anime'
  | 'hentai'
  | 'fantasy';

export type Intensity = 'soft' | 'hard';

export type DayMode = 'soft' | 'hard';

export type IrlStatus = 'home' | 'out' | 'work' | 'public' | 'alone';

export type ChallengeOutcome = 'complete' | 'skip' | 'fail';

export type BreastSize =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'DD'
  | 'E'
  | 'F'
  | 'G';

export type GameResult = 'win' | 'loss' | 'quit' | 'draw' | 'other';

/** 1=dårlig · 2=ok · 3=god · 4=stærk · 5=godlike */
export type PerformanceRating = 1 | 2 | 3 | 4 | 5;

export type PerformanceBand = 'poor' | 'ok' | 'good' | 'godlike';

export type ChallengeKind = 'normal' | 'straf' | 'reward' | 'tease' | 'ingame';

export interface Profile {
  name: 'Frida';
  breastSize: BreastSize;
  intensity: Intensity;
  dayMode: DayMode;
  enabledThemes: ThemePack[];
  hardLimits: string[];
  ageVerified: boolean;
}

export interface ContextState {
  irlStatus: IrlStatus;
  playingGame: string;
  notes: string;
}

export interface UnderwearItem {
  id: string;
  nameDa: string;
  category: 'panty' | 'thong' | 'briefs' | 'cage' | 'stockings' | 'bra' | 'set' | 'special';
  colors: string[];
  styles: string[];
  tags: string[];
  intensity: Intensity[];
  themes: ThemePack[];
  weight: number;
  descriptionDa: string;
}

export interface UnderwearPick {
  dateKey: string;
  itemId: string;
  orderTextDa: string;
  reasonDa: string;
  pickedAt: string;
  performanceInfluenceDa?: string;
}

export interface ChallengeTemplate {
  id: string;
  titleDa: string;
  bodyDa: string;
  tags: string[];
  themes: ThemePack[];
  intensity: Intensity[];
  /** If true, may mention semen collection / male anatomy honestly */
  allowsSemenCollection?: boolean;
  /** Variables that can be filled: breastSize, underwear, game, irl, intensity */
  vars?: string[];
  minDurationMin?: number;
  hardLimitKeys?: string[];
  /** Straf / belønning / tease / in-game */
  kind?: ChallengeKind;
  /** Prefer when performance band matches */
  performanceBias?: PerformanceBand | 'any';
  bonusPoints?: number;
  penaltyPoints?: number;
}

export interface ActiveChallenge {
  id: string;
  templateId: string;
  titleDa: string;
  bodyDa: string;
  themes: ThemePack[];
  intensity: Intensity;
  createdAt: string;
  status: 'active' | 'paused';
  kind?: ChallengeKind;
  performanceInfluenceDa?: string;
  bonusPoints?: number;
  penaltyPoints?: number;
}

export interface ChallengeLogEntry {
  id: string;
  templateId: string;
  titleDa: string;
  outcome: ChallengeOutcome;
  at: string;
  note?: string;
  pointsDelta?: number;
  kind?: ChallengeKind;
}

export interface GameSessionLog {
  id: string;
  gameName: string;
  at: string;
  result: GameResult;
  /** Score, K/D, rank eller fri note */
  performanceNote: string;
  rating: PerformanceRating;
  durationMin?: number;
  mood: string;
}

export interface PerformanceSnapshot {
  score: number;
  streak: number;
  band: PerformanceBand;
  summaryDa: string;
  lastSession?: GameSessionLog | null;
  sessionCount: number;
}

export interface AppState {
  profile: Profile;
  context: ContextState;
  emergencyStop: boolean;
  underwearToday: UnderwearPick | null;
  activeChallenges: ActiveChallenge[];
  challengeLog: ChallengeLogEntry[];
  /** Gaming session log (localStorage) */
  gameSessions: GameSessionLog[];
  /** Bonus/straf point balance */
  pointsBalance: number;
  /** Active while-playing challenge */
  activeInGameChallenge: ActiveChallenge | null;
}

export const DEFAULT_HARD_LIMITS = [
  'blod',
  'scarificering',
  'offentlig-nøgenhed-uden-samtykke',
  'fotos-til-deling',
  'stofmisbrug',
  'kvælning-uden-sikkerhed',
];

export const ALL_THEMES: ThemePack[] = [
  'bdsm',
  'clothing',
  'sex',
  'irl',
  'porn',
  'anime',
  'hentai',
  'fantasy',
];

export const RATING_LABELS_DA: Record<PerformanceRating, string> = {
  1: 'Dårlig',
  2: 'Ok',
  3: 'God',
  4: 'Stærk',
  5: 'Godlike',
};

export const RESULT_LABELS_DA: Record<GameResult, string> = {
  win: 'Sejr',
  loss: 'Nederlag',
  quit: 'Quit',
  draw: 'Uafgjort',
  other: 'Andet',
};
