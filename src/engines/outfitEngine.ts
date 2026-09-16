import { OUTFIT_LOOKS } from '../data/looks';
import { OUTFIT_CATALOG } from '../data/outfits';
import { UNDERWEAR_CATALOG } from '../data/underwear';
import type { CalendarSummary } from './calendarEngine';
import { calendarUnderwearMultiplier } from './calendarEngine';
import type {
  ContextState,
  Intensity,
  OutfitLayer,
  OutfitLayerPick,
  OutfitPiece,
  PerformanceSnapshot,
  Profile,
  ThemePack,
  UnderwearItem,
  UnderwearPick,
  OutfitLook,
} from '../types';
import { OUTFIT_LAYER_LABELS_DA } from '../types';
import { influenceTextDa } from './performanceEngine';

function hourBucket(d = new Date()): 'morning' | 'day' | 'evening' | 'night' {
  const h = d.getHours();
  if (h < 6) return 'night';
  if (h < 11) return 'morning';
  if (h < 17) return 'day';
  if (h < 22) return 'evening';
  return 'night';
}

function isWeekend(d = new Date()): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function themeScore(themes: ThemePack[], enabled: ThemePack[]): number {
  const hit = themes.filter((t) => enabled.includes(t)).length;
  return hit === 0 ? 0.25 : 1 + hit * 0.3;
}

function intensityFit(itemInt: Intensity[], intensity: Intensity, dayMode: Profile['dayMode']): number {
  const mode: Intensity = dayMode === 'hard' ? 'hard' : intensity;
  if (mode === 'soft') return itemInt.includes('soft') ? 1.2 : 0.4;
  return itemInt.includes('hard') ? 1.3 : 0.8;
}

function irlFit(tags: string[], irl: ContextState['irlStatus'], layer: OutfitLayer): number {
  const discrete = tags.includes('diskret') || tags.includes('work');
  const flashy = tags.includes('hard') || tags.includes('sexy') || tags.includes('fetish');
  const homeish = tags.includes('hjemme') || tags.includes('gaming') || tags.includes('komfort');
  switch (irl) {
    case 'work':
    case 'public':
      if (layer === 'outerwear') return 1.5;
      return discrete ? 2.1 : flashy ? 0.2 : 0.75;
    case 'out':
      return discrete ? 1.4 : flashy ? 0.55 : 1;
    case 'alone':
    case 'home':
      return homeish || flashy ? 1.35 : 1;
    default:
      return 1;
  }
}

function timeFit(tags: string[], now: Date, layer: OutfitLayer): number {
  const bucket = hourBucket(now);
  const weekend = isWeekend(now);
  let s = 1;
  if (bucket === 'morning' || bucket === 'day') {
    if (tags.includes('hverdag') || tags.includes('work') || tags.includes('diskret')) s *= 1.25;
    if (tags.includes('aften') && layer !== 'accessory') s *= 0.7;
  }
  if (bucket === 'evening' || bucket === 'night') {
    if (tags.includes('aften') || tags.includes('sexy') || tags.includes('date')) s *= 1.3;
  }
  if (weekend) {
    if (tags.includes('weekend') || tags.includes('cute') || tags.includes('date')) s *= 1.2;
  } else if (tags.includes('work')) s *= 1.15;
  return s;
}

function gamingFit(tags: string[], playingGame: string): number {
  if (!playingGame.trim()) return 1;
  if (tags.includes('gaming') || tags.includes('komfort') || tags.includes('hjemme')) return 1.55;
  if (tags.includes('hæle')) return 0.45;
  return 0.92;
}

function performanceFit(tags: string[], intensity: Intensity[], perf?: PerformanceSnapshot | null): number {
  if (!perf || perf.sessionCount === 0) return 1;
  const hardish =
    intensity.includes('hard') &&
    (tags.includes('hard') || tags.includes('fetish') || tags.includes('bdsm') || tags.includes('kontrol'));
  const softish =
    tags.includes('komfort') ||
    tags.includes('soft') ||
    tags.includes('cute') ||
    tags.includes('luksus') ||
    tags.includes('belønning') ||
    (intensity.includes('soft') && !intensity.includes('hard'));
  switch (perf.band) {
    case 'poor':
      if (hardish) return 2;
      if (softish) return 0.5;
      return 0.9;
    case 'good':
      if (softish || tags.includes('gaming')) return 1.5;
      if (hardish) return 0.7;
      return 1.05;
    case 'godlike':
      if (softish || tags.includes('luksus')) return 1.85;
      if (hardish) return 0.4;
      return 1.1;
    default:
      return 1;
  }
}

function scorePiece(
  piece: OutfitPiece,
  profile: Profile,
  context: ContextState,
  now: Date,
  perf?: PerformanceSnapshot | null,
  cal?: CalendarSummary | null,
): number {
  const hardish = piece.intensity.includes('hard') && (piece.tags.includes('hard') || piece.tags.includes('fetish'));
  const softish = piece.intensity.includes('soft') && !hardish;
  let score = piece.weight;
  score *= themeScore(piece.themes, profile.enabledThemes);
  score *= intensityFit(piece.intensity, profile.intensity, profile.dayMode);
  score *= irlFit(piece.tags, context.irlStatus, piece.layer);
  score *= timeFit(piece.tags, now, piece.layer);
  score *= gamingFit(piece.tags, context.playingGame);
  score *= performanceFit(piece.tags, piece.intensity, perf);
  score *= calendarUnderwearMultiplier(piece.tags, hardish, softish, cal);
  return Math.max(score, 0.01);
}

function weightedPick<T>(rows: { item: T; score: number }[]): T {
  const total = rows.reduce((a, b) => a + b.score, 0);
  let r = Math.random() * total;
  for (const row of rows) {
    r -= row.score;
    if (r <= 0) return row.item;
  }
  return rows[rows.length - 1]!.item;
}

function pickLayer(
  layer: OutfitPiece['layer'],
  profile: Profile,
  context: ContextState,
  now: Date,
  perf?: PerformanceSnapshot | null,
  cal?: CalendarSummary | null,
  excludeId?: string,
): OutfitPiece | null {
  const pool = OUTFIT_CATALOG.filter((p) => p.layer === layer && p.id !== excludeId);
  if (!pool.length) return null;
  const scored = pool.map((item) => ({
    item,
    score: scorePiece(item, profile, context, now, perf, cal),
  }));
  return weightedPick(scored);
}

function toLayerPick(piece: OutfitPiece): OutfitLayerPick {
  return {
    layer: piece.layer,
    pieceId: piece.id,
    nameDa: piece.nameDa,
    descriptionDa: piece.descriptionDa,
    colors: piece.colors,
  };
}

function underwearLayer(item: UnderwearItem): OutfitLayerPick {
  return {
    layer: 'underwear',
    pieceId: item.id,
    nameDa: item.nameDa,
    descriptionDa: item.descriptionDa,
    colors: item.colors,
  };
}

function chance(p: number): boolean {
  return Math.random() < p;
}

/**
 * Full layered outfit around an underwear pick.
 * Top + (bottom unless kjole) + shoes; legs/outer/accessory probabilistic.
 */
export function pickOutfitLayers(
  underwear: UnderwearItem,
  profile: Profile,
  context: ContextState,
  opts?: {
    now?: Date;
    performance?: PerformanceSnapshot | null;
    calendar?: CalendarSummary | null;
    excludeTopId?: string;
  },
): OutfitLayerPick[] {
  const now = opts?.now ?? new Date();
  const perf = opts?.performance ?? null;
  const cal = opts?.calendar ?? null;
  const irl = context.irlStatus;
  const layers: OutfitLayerPick[] = [underwearLayer(underwear)];

  const top = pickLayer('top', profile, context, now, perf, cal, opts?.excludeTopId);
  if (top) layers.push(toLayerPick(top));

  const skipBottom = !!top?.coversBottom;
  if (!skipBottom) {
    const bottom = pickLayer('bottom', profile, context, now, perf, cal);
    if (bottom) layers.push(toLayerPick(bottom));
  }

  const legsChance =
    irl === 'home' || irl === 'alone' ? 0.45 : hourBucket(now) === 'evening' ? 0.7 : 0.55;
  if (chance(legsChance)) {
    const legs = pickLayer('legs', profile, context, now, perf, cal);
    if (legs) layers.push(toLayerPick(legs));
  }

  const shoes = pickLayer('shoes', profile, context, now, perf, cal);
  if (shoes) layers.push(toLayerPick(shoes));

  const outerChance = irl === 'work' || irl === 'public' || irl === 'out' ? 0.82 : 0.28;
  if (chance(outerChance)) {
    const outer = pickLayer('outerwear', profile, context, now, perf, cal);
    if (outer) layers.push(toLayerPick(outer));
  }

  if (chance(0.78)) {
    const acc = pickLayer('accessory', profile, context, now, perf, cal);
    if (acc) layers.push(toLayerPick(acc));
  }

  return layers;
}

export function buildOutfitOrderText(
  layers: OutfitLayerPick[],
  profile: Profile,
  perf?: PerformanceSnapshot | null,
): string {
  const uw = layers.find((l) => l.layer === 'underwear');
  const rest = layers.filter((l) => l.layer !== 'underwear');
  const list = rest.map((l) => `${OUTFIT_LAYER_LABELS_DA[l.layer]}: ${l.nameDa}`).join('; ');
  let extra = '';
  if (perf && perf.sessionCount > 0) {
    if (perf.band === 'poor') {
      extra =
        ' Din seneste gaming-præstation var svag — så looket hælder til strengere / mere synlig kontrol. ';
    } else if (perf.band === 'good' || perf.band === 'godlike') {
      extra = ' Din seneste gaming-præstation fortjener et blødere / mere komfortabelt look. ';
    }
  }
  return (
    `Frida — FULD BEORDING: Tag "${uw?.nameDa ?? 'beordret undertøj'}" på, ` +
    `plus hele outfittet (${list || 'ydre lag vælges'}). ` +
    `Dine ${profile.breastSize}-bryster skal sidde støttet. ${extra}` +
    `Ingen improvisation — det er dagens uniform.`
  );
}

function scoreLook(
  look: OutfitLook,
  profile: Profile,
  context: ContextState,
  now: Date,
  perf?: PerformanceSnapshot | null,
  cal?: CalendarSummary | null,
): number {
  let score = look.weight;
  score *= themeScore(look.themes, profile.enabledThemes);
  score *= intensityFit(look.intensity, profile.intensity, profile.dayMode);
  score *= irlFit(look.tags, context.irlStatus, 'top');
  score *= timeFit(look.tags, now, 'top');
  score *= gamingFit(look.tags, context.playingGame);
  score *= performanceFit(look.tags, look.intensity, perf);
  const hardish = look.intensity.includes('hard') && look.tags.includes('hard');
  const softish = look.intensity.includes('soft') && !hardish;
  score *= calendarUnderwearMultiplier(look.tags, hardish, softish, cal);
  if (look.irlBias?.length) {
    if (look.irlBias.includes(context.irlStatus)) score *= 1.8;
    else if (context.irlStatus === 'work' || context.irlStatus === 'public') score *= 0.08;
    else score *= 0.55;
  }
  return Math.max(score, 0.01);
}

function lookChance(irl: ContextState['irlStatus']): number {
  if (irl === 'home' || irl === 'alone') return 0.88;
  if (irl === 'out') return 0.45;
  return 0.22;
}

export function pickPhotographedLook(
  profile: Profile,
  context: ContextState,
  opts?: {
    now?: Date;
    performance?: PerformanceSnapshot | null;
    calendar?: CalendarSummary | null;
    excludeLookId?: string;
  },
): OutfitLook | null {
  const now = opts?.now ?? new Date();
  let pool = OUTFIT_LOOKS.filter((l) => l.id !== opts?.excludeLookId);
  if (context.irlStatus === 'work' || context.irlStatus === 'public') {
    const discrete = pool.filter(
      (l) => l.tags.includes('hverdag') || l.tags.includes('komfort') || l.tags.includes('diskret'),
    );
    if (discrete.length) pool = discrete;
  }
  if (!pool.length) return null;
  if (Math.random() > lookChance(context.irlStatus)) return null;
  const scored = pool.map((item) => ({
    item,
    score: scoreLook(item, profile, context, now, opts?.performance, opts?.calendar),
  }));
  return weightedPick(scored);
}

export function buildLookOrderText(
  look: OutfitLook,
  profile: Profile,
  perf?: PerformanceSnapshot | null,
): string {
  const list = look.layers.map((l) => `${OUTFIT_LAYER_LABELS_DA[l.layer]}: ${l.nameDa}`).join('; ');
  let extra = '';
  if (perf && perf.sessionCount > 0) {
    if (perf.band === 'poor') {
      extra = ' Svag gaming-præstation — looket er en del af kontrollen. ';
    } else if (perf.band === 'good' || perf.band === 'godlike') {
      extra = ' Stærk session: du har stadig en uniform, men den kan være blødere. ';
    }
  }
  return (
    `Frida — FULD BEORDING: Looket "${look.nameDa}". ${look.orderBlurbDa} ` +
    `Lag: ${list}. Dine ${profile.breastSize}-bryster skal sidde støttet. ${extra}` +
    `Ingen improvisation — det er dagens uniform.`
  );
}

export function attachOutfitToPick(
  pick: UnderwearPick,
  profile: Profile,
  context: ContextState,
  opts?: {
    now?: Date;
    performance?: PerformanceSnapshot | null;
    calendar?: CalendarSummary | null;
    force?: boolean;
    excludeLookId?: string;
  },
): UnderwearPick {
  if (!opts?.force && pick.layers && pick.layers.length > 1) return pick;
  const perf = opts?.performance ?? null;
  const influence =
    perf && perf.sessionCount > 0 ? influenceTextDa(perf, 'outfittet') : pick.performanceInfluenceDa;

  const look = pickPhotographedLook(profile, context, {
    now: opts?.now,
    performance: perf,
    calendar: opts?.calendar,
    excludeLookId: opts?.excludeLookId ?? pick.lookId,
  });
  if (look) {
    return {
      ...pick,
      lookId: look.id,
      lookNameDa: look.nameDa,
      imageFile: look.imageFile,
      layers: look.layers,
      orderTextDa: buildLookOrderText(look, profile, perf),
      performanceInfluenceDa: influence,
    };
  }

  const uw = UNDERWEAR_CATALOG.find((i) => i.id === pick.itemId);
  if (!uw) return pick;
  const layers = pickOutfitLayers(uw, profile, context, opts);
  return {
    ...pick,
    lookId: undefined,
    lookNameDa: undefined,
    imageFile: undefined,
    layers,
    orderTextDa: buildOutfitOrderText(layers, profile, perf),
    performanceInfluenceDa: influence,
  };
}

export function getOutfitPieceById(id: string): OutfitPiece | undefined {
  return OUTFIT_CATALOG.find((p) => p.id === id);
}

export function formatLayersDa(layers: OutfitLayerPick[] | undefined): string {
  if (!layers?.length) return '';
  return layers.map((l) => `${OUTFIT_LAYER_LABELS_DA[l.layer]}: ${l.nameDa}`).join(' · ');
}
