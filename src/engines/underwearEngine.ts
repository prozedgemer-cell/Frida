import { UNDERWEAR_CATALOG } from '../data/underwear';
import type {
  ContextState,
  DayMode,
  Intensity,
  IrlStatus,
  PerformanceSnapshot,
  Profile,
  ThemePack,
  UnderwearItem,
  UnderwearPick,
} from '../types';
import { influenceTextDa } from './performanceEngine';
import {
  calendarUnderwearMultiplier,
  localDateKey,
  type CalendarSummary,
} from './calendarEngine';

function dateKey(d = new Date()): string {
  return localDateKey(d);
}

function isWeekend(d = new Date()): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function hourBucket(d = new Date()): 'morning' | 'day' | 'evening' | 'night' {
  const h = d.getHours();
  if (h < 6) return 'night';
  if (h < 11) return 'morning';
  if (h < 17) return 'day';
  if (h < 22) return 'evening';
  return 'night';
}

function irlMultiplier(item: UnderwearItem, irl: IrlStatus): number {
  const discrete =
    item.tags.includes('diskret') || item.tags.includes('usynlig') || item.tags.includes('work');
  const flashy =
    item.intensity.includes('hard') &&
    (item.category === 'special' || item.tags.includes('hard'));
  switch (irl) {
    case 'work':
    case 'public':
      return discrete ? 2.2 : flashy ? 0.15 : 0.7;
    case 'out':
      return discrete ? 1.5 : flashy ? 0.4 : 1;
    case 'alone':
    case 'home':
      return flashy ? 1.4 : 1;
    default:
      return 1;
  }
}

function themeScore(item: UnderwearItem, themes: ThemePack[]): number {
  const hit = item.themes.filter((t) => themes.includes(t)).length;
  return hit === 0 ? 0.2 : 1 + hit * 0.35;
}

function intensityFit(item: UnderwearItem, intensity: Intensity, dayMode: DayMode): number {
  const mode: Intensity = dayMode === 'hard' ? 'hard' : intensity;
  if (!item.intensity.includes(mode) && mode === 'soft') {
    return item.intensity.includes('soft') ? 1.2 : 0.35;
  }
  if (mode === 'hard') {
    return item.intensity.includes('hard') ? 1.35 : 0.75;
  }
  return item.intensity.includes('soft') ? 1.15 : 0.9;
}

function timeScore(
  item: UnderwearItem,
  bucket: ReturnType<typeof hourBucket>,
  weekend: boolean,
): number {
  let s = 1;
  if (bucket === 'morning' || bucket === 'day') {
    if (item.tags.includes('hverdag') || item.tags.includes('diskret') || item.tags.includes('work'))
      s *= 1.3;
    if (item.category === 'special') s *= 0.6;
  }
  if (bucket === 'evening' || bucket === 'night') {
    if (item.tags.includes('sexy') || item.tags.includes('aften') || item.category === 'set')
      s *= 1.35;
  }
  if (weekend) {
    if (item.tags.includes('weekend') || item.tags.includes('cute') || item.themes.includes('anime'))
      s *= 1.25;
  } else if (item.tags.includes('work')) {
    s *= 1.2;
  }
  return s;
}

function gamingScore(item: UnderwearItem, playingGame: string): number {
  if (!playingGame.trim()) return 1;
  if (item.tags.includes('gaming') || item.tags.includes('komfort') || item.tags.includes('hjemme'))
    return 1.6;
  if (item.category === 'stockings' || item.tags.includes('hæle')) return 0.5;
  return 0.9;
}

/** Worse performance → stricter / humiliating / BDSM; better → soft / comfort reward */
function performanceScore(item: UnderwearItem, perf?: PerformanceSnapshot | null): number {
  if (!perf || perf.sessionCount === 0) return 1;
  const hardish =
    item.intensity.includes('hard') ||
    item.category === 'cage' ||
    item.category === 'special' ||
    item.tags.includes('chastity') ||
    item.tags.includes('hard') ||
    item.tags.includes('bdsm') ||
    item.tags.includes('fetish') ||
    item.tags.includes('kontrol') ||
    item.tags.includes('adgang');
  const softish =
    item.tags.includes('komfort') ||
    item.tags.includes('soft') ||
    item.tags.includes('blød') ||
    item.tags.includes('cute') ||
    item.tags.includes('uskyldig') ||
    (item.intensity.includes('soft') && !item.intensity.includes('hard'));

  switch (perf.band) {
    case 'poor':
      if (hardish) return 2.1;
      if (softish) return 0.45;
      return 0.85;
    case 'ok':
      return 1;
    case 'good':
      if (softish || item.tags.includes('gaming') || item.tags.includes('komfort')) return 1.55;
      if (hardish) return 0.7;
      return 1.05;
    case 'godlike':
      if (softish || item.tags.includes('luksus') || item.tags.includes('belønning')) return 1.9;
      if (hardish) return 0.4;
      return 1.1;
    default:
      return 1;
  }
}

export function scoreUnderwear(
  item: UnderwearItem,
  profile: Profile,
  context: ContextState,
  now = new Date(),
  perf?: PerformanceSnapshot | null,
  cal?: CalendarSummary | null,
): number {
  const bucket = hourBucket(now);
  const weekend = isWeekend(now);
  let score = item.weight;
  score *= themeScore(item, profile.enabledThemes);
  score *= intensityFit(item, profile.intensity, profile.dayMode);
  score *= irlMultiplier(item, context.irlStatus);
  score *= timeScore(item, bucket, weekend);
  score *= gamingScore(item, context.playingGame);
  score *= performanceScore(item, perf);
  const hardish =
    item.intensity.includes('hard') &&
    (item.category === 'special' || item.tags.includes('hard'));
  const softish = item.intensity.includes('soft') && !hardish;
  score *= calendarUnderwearMultiplier(item.tags, hardish, softish, cal);
  return Math.max(score, 0.01);
}

function weightedPick(items: { item: UnderwearItem; score: number }[]): UnderwearItem {
  const total = items.reduce((a, b) => a + b.score, 0);
  let r = Math.random() * total;
  for (const row of items) {
    r -= row.score;
    if (r <= 0) return row.item;
  }
  return items[items.length - 1].item;
}

function buildOrderText(item: UnderwearItem, profile: Profile, perf?: PerformanceSnapshot | null): string {
  let extra = '';
  if (perf && perf.sessionCount > 0) {
    if (perf.band === 'poor') {
      extra =
        ' Din seneste gaming-præstation var svag — så dette er en strengere / mere ydmygende beording. ';
    } else if (perf.band === 'good' || perf.band === 'godlike') {
      extra =
        ' Din seneste gaming-præstation fortjener blødere / mere komfortabelt undertøj som belønning. ';
    }
  }
  return (
    `Frida — BEORDING: Tag "${item.nameDa}" på nu under dit tøj i dag. ` +
    `Dine ${profile.breastSize}-bryster skal sidde støttet (BH hvis sættet kræver det). ` +
    `${extra}${item.descriptionDa}`
  );
}

function buildReason(
  item: UnderwearItem,
  profile: Profile,
  context: ContextState,
  now: Date,
  perf?: PerformanceSnapshot | null,
  cal?: CalendarSummary | null,
): string {
  const parts: string[] = [];
  parts.push(isWeekend(now) ? 'weekend' : 'hverdag');
  parts.push(hourBucket(now));
  parts.push(`IRL: ${context.irlStatus}`);
  parts.push(`dag: ${profile.dayMode}/${profile.intensity}`);
  if (context.playingGame.trim()) parts.push(`spil: ${context.playingGame}`);
  if (perf && perf.sessionCount > 0) {
    parts.push(`præstation: ${perf.band} (${perf.score})`);
  }
  if (cal && cal.entries.length) {
    parts.push(`kalender: ${cal.signals.join(', ') || 'noter'}`);
  }
  const themes = item.themes.filter((t) => profile.enabledThemes.includes(t));
  if (themes.length) parts.push(`themes: ${themes.join(', ')}`);
  return `Valgt ud fra ${parts.join(' · ')}.`;
}

export function pickUnderwear(
  profile: Profile,
  context: ContextState,
  opts?: {
    excludeId?: string;
    now?: Date;
    performance?: PerformanceSnapshot | null;
    calendar?: CalendarSummary | null;
  },
): UnderwearPick {
  const now = opts?.now ?? new Date();
  const perf = opts?.performance ?? null;
  const cal = opts?.calendar ?? null;
  const scored = UNDERWEAR_CATALOG.filter((i) => i.id !== opts?.excludeId).map((item) => ({
    item,
    score: scoreUnderwear(item, profile, context, now, perf, cal),
  }));
  const item = weightedPick(scored);
  const influence = influenceTextDa(perf ?? { score: 50, streak: 0, band: 'ok', summaryDa: '', lastSession: null, sessionCount: 0 }, 'undertøjet');
  return {
    dateKey: dateKey(now),
    itemId: item.id,
    orderTextDa: buildOrderText(item, profile, perf),
    reasonDa: buildReason(item, profile, context, now, perf, cal),
    pickedAt: now.toISOString(),
    performanceInfluenceDa: perf && perf.sessionCount > 0 ? influence : undefined,
  };
}

export function getUnderwearById(id: string): UnderwearItem | undefined {
  return UNDERWEAR_CATALOG.find((i) => i.id === id);
}

export function todayKey(): string {
  return dateKey();
}
