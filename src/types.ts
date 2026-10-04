export type Style =
  | 'sweet' | 'classy' | 'latex' | 'goth' | 'anime' | 'fantasy'
  | 'office' | 'nurse' | 'sporty' | 'bimbo' | 'retro' | 'cyber';

export type Tone = 'sweet' | 'stern' | 'playful' | 'cold' | 'sultry';
export type Leaning = 'soft' | 'mixed' | 'hard';
export type Intensity = 'soft' | 'hard';

export type FormId =
  | 'strapon-oral' | 'pegging' | 'dildo-ride' | 'chastity' | 'nipples' | 'milking'
  | 'bondage' | 'mirror' | 'plug' | 'striptease' | 'strapon-tease' | 'photo-tease';

export interface Star {
  id: string;
  name: string;
  archetype: string;
  style: Style;
  tone: Tone;
  leaning: Leaning;
  cupBias: number; // -2..+3 relative to default cup
  hair: string;
  body: string;
  outfit: string; // her own signature outfit
  personality: string;
  likes: string;
  favForms: FormId[];
  enabled: boolean;
  custom?: boolean;
}

export interface OutfitPlan {
  panties: string;
  bra: string;
  cup: string;
  top: string;
  bottom: string;
  legwear: string;
  shoes: string;
  makeup: string;
  wig: string;
  extras: string[];
  summary: string;
}

export interface SexPlan {
  form: FormId;
  formLabel: string;
  minutes: number;
  location: string;
  intensity: Intensity;
  scene: string;
}

export type ChallengeKind = 'wear' | 'tease' | 'task' | 'gaming' | 'punishment' | 'reward';

export type ChallengeStatus = 'done' | 'failed';

export interface Challenge {
  id: string;
  kind: ChallengeKind;
  text: string;
  link: string; // how it ties into today's sex
}

export interface DayPlan {
  date: string;
  starId: string;
  starName: string;
  outfit: OutfitPlan;
  sex: SexPlan;
  challenges: Challenge[];
  spare: { punishment: Challenge; reward: Challenge };
  bonus: string; // detail when all 3 challenges are done
  penalty: string; // detail when 2+ challenges failed
}

export type Game = 'CS2' | 'WARDOGS' | 'LoL' | 'Diablo IV' | 'Fortnite';

export interface GameLog {
  id: string;
  game: Game;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  cash?: number;
  score: number;
  at: number;
}

export interface DayRecord {
  plan: DayPlan;
  games: GameLog[];
  status: Record<string, ChallengeStatus>;
  sexDone: boolean;
}

export interface AppData {
  version: 3;
  defaultCup: string;
  stars: Star[];
  days: Record<string, DayRecord>;
}
