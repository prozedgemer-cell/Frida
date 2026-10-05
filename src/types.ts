export type Style =
  | 'sweet' | 'classy' | 'latex' | 'goth' | 'anime' | 'fantasy'
  | 'office' | 'nurse' | 'sporty' | 'bimbo' | 'retro' | 'cyber' | 'western' | 'punk';

/** A 'known for' style a star can bring on a given day. */
export type KnownFor =
  | 'latex-domme' | 'strapon-queen' | 'sweet-tease' | 'milf' | 'goth' | 'anime' | 'hentai'
  | 'fantasy-queen' | 'office-boss' | 'nurse' | 'gym' | 'succubus' | 'elf' | 'bimbo'
  | 'schoolgirl-cosplay' | 'cowgirl' | 'vampire' | 'witch' | 'pinup' | 'cyberpunk' | 'maid'
  | 'police' | 'sugar-mommy' | 'ballet' | 'gamer-girl' | 'siren' | 'viking' | 'librarian'
  | 'punk' | 'catgirl' | 'tantric';

export type Tone = 'sweet' | 'stern' | 'playful' | 'cold' | 'sultry';
export type Leaning = 'soft' | 'mixed' | 'hard';
export type Intensity = 'soft' | 'hard';

export type FormId =
  | 'strapon-oral' | 'pegging' | 'dildo-ride' | 'chastity' | 'nipples' | 'milking'
  | 'bondage' | 'mirror' | 'plug' | 'striptease' | 'strapon-tease' | 'photo-tease';

export interface Star {
  id: string;
  name: string;
  hair: string;
  body: string;
  cup: string; // her own cup size, B-H
  wardrobe: string; // her signature wardrobe
  personality: string;
  tone: Tone; // her voice
  knownFor: KnownFor[]; // 2-4 styles
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
  /** Practical outer layers when day tags are out-of-house / work / school. */
  layers?: string;
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
  fromTag?: string; // which day tag this challenge covers
}

export interface DayPlan {
  date: string;
  starId: string;
  starName: string;
  styleId: KnownFor;
  styleLabel: string;
  tags: string[];
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
  version: 2;
  rosterVersion?: number;
  defaultCup: string;
  stars: Star[];
  days: Record<string, DayRecord>;
  /** User-added day tags (labels); stored as lowercase ids matching the label. */
  customTags?: string[];
}
