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
}

export interface ChallengeLogEntry {
  id: string;
  templateId: string;
  titleDa: string;
  outcome: ChallengeOutcome;
  at: string;
  note?: string;
}

export interface AppState {
  profile: Profile;
  context: ContextState;
  emergencyStop: boolean;
  underwearToday: UnderwearPick | null;
  activeChallenges: ActiveChallenge[];
  challengeLog: ChallengeLogEntry[];
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
