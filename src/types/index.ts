import type { GamePresetId } from '../data/gameProfiles';

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

/** Morning trio only allows do/wear — say/write excluded */
export type ChallengeActionClass = 'do' | 'wear' | 'say' | 'write';

export type MorningTier = 'easy' | 'hard' | 'boundary';

export type RoleId =
  | 'g-string-milf'
  | 'brazilian-cut'
  | 'bdsm-hard'
  | 'soft-everyday-femme'
  | 'hentai-anime'
  | 'fantasy-femme'
  | 'office-milf'
  | 'bdsm-soft'
  | 'fest-aften'
  | 'traening-gym'
  | 'sex-scene'
  | 'bytur-gaatur'
  | 'familie-sikker'
  | 'bil-trafik'
  | 'handel-shopping'
  | 'hjemme-lounge'
  | 'gaming-praktisk'
  | 'hentai-inspireret'
  | 'fantasy-look'
  | 'anime-soft';

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
  /** Active preset for structured logging (optional) */
  activeGameId?: GamePresetId;
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

export type OutfitLayer =
  | 'underwear'
  | 'top'
  | 'bottom'
  | 'legs'
  | 'shoes'
  | 'outerwear'
  | 'accessory';

export const OUTFIT_LAYER_LABELS_DA: Record<OutfitLayer, string> = {
  underwear: 'Underwear',
  top: 'Top',
  bottom: 'Bottom',
  legs: 'Stockings',
  shoes: 'Shoes',
  outerwear: 'Outerwear',
  accessory: 'Accessories',
};

export interface OutfitPiece {
  id: string;
  layer: Exclude<OutfitLayer, 'underwear'>;
  nameDa: string;
  colors: string[];
  tags: string[];
  intensity: Intensity[];
  themes: ThemePack[];
  weight: number;
  descriptionDa: string;
  /** Kjole / jumpsuit dækker underdel */
  coversBottom?: boolean;
}

export interface OutfitLayerPick {
  layer: OutfitLayer;
  pieceId: string;
  nameDa: string;
  descriptionDa: string;
  colors: string[];
}

/** Photographed full look the engine can pick as today's uniform. */
export interface OutfitLook {
  id: string;
  nameDa: string;
  /** Path under public/, e.g. media/outfits/foo.jpg */
  imageFile: string;
  captionDa: string;
  tags: string[];
  intensity: Intensity[];
  themes: ThemePack[];
  weight: number;
  irlBias?: IrlStatus[];
  orderBlurbDa: string;
  layers: OutfitLayerPick[];
}

export interface UnderwearPick {
  dateKey: string;
  itemId: string;
  orderTextDa: string;
  reasonDa: string;
  pickedAt: string;
  performanceInfluenceDa?: string;
  /** Full outfit layers (undertøj + tøj). Older saves may omit this. */
  layers?: OutfitLayerPick[];
  /** Photographed look id when engine picked a media outfit. */
  lookId?: string;
  lookNameDa?: string;
  /** Relative public/ path for the look photo. */
  imageFile?: string;
  /** Coherent full-outfit role pack */
  roleId?: RoleId;
  roleNameDa?: string;
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
  /** do/wear/say/write — morning trio uses do|wear only */
  actionClass?: ChallengeActionClass;
  /** Prefer for morning easy/hard/boundary slot */
  morningTier?: MorningTier;
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
  actionClass?: ChallengeActionClass;
  morningTier?: MorningTier;
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
  /** Score, K/D, rank eller fri note (auto-udfyldt fra metrics når muligt) */
  performanceNote: string;
  rating: PerformanceRating;
  durationMin?: number;
  mood: string;
  /** Preset id for structured KPIs */
  gameId?: GamePresetId;
  /** Structured metrics matching gameProfiles fields */
  metrics?: Record<string, number | string>;
  /** Normalized 0–100 from game formula; drives sessionRawScore when set */
  computedScore?: number;
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
  /** @deprecated dormant — emergency stop UI removed; kept for localStorage compat */
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
  /** Pending/active fictional sex punishment (redeem stats) */
  activeSexStraf: SexStrafInstance | null;
  /** History of past sex-straffe */
  sexStrafLog: SexStrafInstance[];
  /** ISO time of last resolved sex-straf (cooldown for due) */
  lastSexStrafAt: string | null;
  /** Calendar notes/events; used as signals for tøj/challenges/straf */
  calendarEntries: CalendarEntry[];
  /** Exactly 3 DO/WEAR morning challenges for the local day */
  morningTrio: MorningTrioState | null;
}

export interface MorningTrioState {
  dateKey: string;
  challenges: ActiveChallenge[];
  issuedAt: string;
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
  1: 'Poor',
  2: 'Ok',
  3: 'Good',
  4: 'Strong',
  5: 'Godlike',
};

export const RESULT_LABELS_DA: Record<GameResult, string> = {
  win: 'Win',
  loss: 'Loss',
  quit: 'Quit',
  draw: 'Draw',
  other: 'Other',
};

/** Sex-straf hardness scale (blød → hård) */
export type SexStrafHardness = 'blød' | 'medium' | 'hård';

export type SexStrafStatus = 'pending' | 'active' | 'done' | 'skipped' | 'failed';

export interface SexStrafTemplate {
  id: string;
  titleDa: string;
  /** Scene with slots: {partner}, {place}, {why}, {duration}, {hardness}, {breastSize}, {game} */
  sceneDa: string;
  partnerPool: string[];
  placePool: string[];
  whyPool: string[];
  durationMinRange: [number, number];
  hardnessPool: SexStrafHardness[];
  themes: ThemePack[];
  intensity: Intensity[];
  allowsSemenCollection?: boolean;
  bonusPoints?: number;
  penaltyPoints?: number;
  /** Optional RP illustration under public/ */
  imageFile?: string;
}

export interface SexStrafInstance {
  id: string;
  templateId: string;
  titleDa: string;
  sceneDa: string;
  partnerDa: string;
  placeDa: string;
  whyDa: string;
  durationMin: number;
  hardness: SexStrafHardness;
  status: SexStrafStatus;
  createdAt: string;
  resolvedAt?: string;
  pointsDelta?: number;
  /** Points credited toward clearing performance/points debt on complete */
  redeemBoost?: number;
  imageFile?: string;
}


export type CalendarSignal =
  | 'none'
  | 'straf'
  | 'reward'
  | 'soft'
  | 'hard'
  | 'clothing'
  | 'gaming'
  | 'rest'
  | 'date';

export interface CalendarEntry {
  id: string;
  /** Local YYYY-MM-DD */
  dateKey: string;
  /** Optional local HH:MM (24h) */
  timeHm?: string;
  titleDa: string;
  noteDa: string;
  signal: CalendarSignal;
  createdAt: string;
  updatedAt: string;
  /** Optional local IndexedDB image id (slot calendar) */
  imageId?: string;
  /** Optional http(s) or modest data: URL (localStorage) */
  imageUrl?: string;
  /** Free tags: milf / bdsm / g-string / date / outing … */
  tags?: string[];
}

export const CALENDAR_TAG_PRESETS = [
  'milf',
  'bdsm',
  'g-string',
  'brazilian',
  'date',
  'outing',
  'gaming',
  'rest',
] as const;

export const CALENDAR_SIGNAL_LABELS_DA: Record<CalendarSignal, string> = {
  none: 'None',
  straf: 'Punishment',
  reward: 'Reward',
  soft: 'Soft day',
  hard: 'Hard day',
  clothing: 'Clothing focus',
  gaming: 'Gaming',
  rest: 'Rest',
  date: 'Date / plans',
};

export const SEX_STRAF_HARDNESS_DA: Record<SexStrafHardness, string> = {
  blød: 'Soft',
  medium: 'Medium',
  hård: 'Hard',
};

export const SEX_STRAF_STATUS_DA: Record<SexStrafStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  done: 'Done',
  skipped: 'Skipped',
  failed: 'Failed',
};
