import { CHALLENGE_TEMPLATES } from '../data/challenges';
import { getUnderwearById } from './underwearEngine';
import { influenceTextDa } from './performanceEngine';
import {
  calendarChallengeMultiplier,
  type CalendarSummary,
} from './calendarEngine';
import type {
  ActiveChallenge,
  ChallengeKind,
  ChallengeTemplate,
  ContextState,
  Intensity,
  PerformanceSnapshot,
  Profile,
  ThemePack,
  UnderwearPick,
} from '../types';

const VAGINAL_BLOCK =
  /\b(vagina|vaginal|kusse|skede|clitoris|klitoris|pussy)\b/i;

function fillVars(
  text: string,
  profile: Profile,
  context: ContextState,
  underwear: UnderwearPick | null,
): string {
  const uw = underwear
    ? (getUnderwearById(underwear.itemId)?.nameDa ?? 'dit beordrede undertøj')
    : 'dit beordrede undertøj';
  return text
    .replaceAll('{breastSize}', profile.breastSize)
    .replaceAll('{underwear}', uw)
    .replaceAll('{game}', context.playingGame.trim() || 'dit spil')
    .replaceAll('{irl}', context.irlStatus)
    .replaceAll('{intensity}', profile.intensity);
}

function respectsHardLimits(t: ChallengeTemplate, limits: string[]): boolean {
  if (!t.hardLimitKeys?.length) return true;
  return !t.hardLimitKeys.some((k) => limits.includes(k));
}

function anatomyOk(t: ChallengeTemplate): boolean {
  const blob = `${t.titleDa} ${t.bodyDa}`;
  if (VAGINAL_BLOCK.test(blob) && !t.allowsSemenCollection) return false;
  if (/\bvaginal\b/i.test(blob) && !/opsamling|sæd|semen|bryst/i.test(blob)) return false;
  return true;
}

function themeOk(t: ChallengeTemplate, enabled: ThemePack[]): boolean {
  return t.themes.some((th) => enabled.includes(th));
}

function intensityOk(
  t: ChallengeTemplate,
  intensity: Intensity,
  dayMode: Profile['dayMode'],
): boolean {
  const mode: Intensity = dayMode === 'hard' ? (intensity === 'hard' ? 'hard' : 'soft') : intensity;
  if (dayMode === 'soft') return t.intensity.includes('soft');
  return t.intensity.includes(mode) || t.intensity.includes(intensity);
}

export function filterTemplates(
  profile: Profile,
  _context: ContextState,
  opts?: { kind?: ChallengeKind | ChallengeKind[] },
): ChallengeTemplate[] {
  const kinds = opts?.kind
    ? Array.isArray(opts.kind)
      ? opts.kind
      : [opts.kind]
    : null;
  return CHALLENGE_TEMPLATES.filter((t) => {
    if (!anatomyOk(t)) return false;
    if (!respectsHardLimits(t, profile.hardLimits)) return false;
    if (!themeOk(t, profile.enabledThemes)) return false;
    if (!intensityOk(t, profile.intensity, profile.dayMode)) return false;
    const kind = t.kind ?? 'normal';
    if (kinds) {
      return kinds.includes(kind);
    }
    // Default draw: exclude pure in-game (those have their own drawer)
    return kind !== 'ingame';
  });
}

function pickIntensity(t: ChallengeTemplate, profile: Profile): Intensity {
  if (profile.dayMode === 'soft') return 'soft';
  if (t.intensity.includes(profile.intensity)) return profile.intensity;
  return t.intensity[0];
}

function performanceWeight(
  t: ChallengeTemplate,
  perf?: PerformanceSnapshot | null,
  cal?: CalendarSummary | null,
): number {
  if (!perf || perf.sessionCount === 0) return 1;
  const kind = t.kind ?? 'normal';
  const tags = t.tags.map((x) => x.toLowerCase());
  const isStraf =
    kind === 'straf' ||
    tags.includes('straf') ||
    tags.includes('punishment') ||
    tags.includes('humiliation');
  const isReward =
    kind === 'reward' ||
    tags.includes('belønning') ||
    tags.includes('reward') ||
    tags.includes('tease');
  const bias = t.performanceBias;

  let w = 1;
  if (perf.band === 'poor') {
    if (isStraf || bias === 'poor') w *= 3.2;
    if (isReward || bias === 'good' || bias === 'godlike') w *= 0.35;
    if (kind === 'tease') w *= 0.7;
  } else if (perf.band === 'good' || perf.band === 'godlike') {
    if (isReward || bias === 'good' || bias === 'godlike') w *= 2.6;
    if (isStraf || bias === 'poor') w *= 0.3;
    if (kind === 'tease') w *= 1.5;
  } else {
    if (isStraf) w *= 0.9;
    if (isReward) w *= 1.1;
  }
  w *= calendarChallengeMultiplier(isStraf, isReward, cal);
  return Math.max(w, 0.05);
}

function weightedSample(
  pool: { t: ChallengeTemplate; w: number }[],
  count: number,
): ChallengeTemplate[] {
  const out: ChallengeTemplate[] = [];
  const bag = [...pool];
  for (let i = 0; i < count && bag.length; i++) {
    const total = bag.reduce((a, b) => a + b.w, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let j = 0; j < bag.length; j++) {
      r -= bag[j].w;
      if (r <= 0) {
        idx = j;
        break;
      }
    }
    out.push(bag[idx].t);
    bag.splice(idx, 1);
  }
  return out;
}

function toActive(
  t: ChallengeTemplate,
  profile: Profile,
  context: ContextState,
  underwear: UnderwearPick | null,
  perf?: PerformanceSnapshot | null,
): ActiveChallenge {
  const intensity = pickIntensity(t, profile);
  const influence =
    perf && perf.sessionCount > 0
      ? influenceTextDa(perf, t.kind === 'straf' ? 'straffen' : 'udfordringen')
      : undefined;
  return {
    id: `active-${t.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    templateId: t.id,
    titleDa: fillVars(t.titleDa, profile, context, underwear),
    bodyDa: fillVars(t.bodyDa, profile, context, underwear),
    themes: t.themes,
    intensity,
    createdAt: new Date().toISOString(),
    status: 'active',
    kind: t.kind ?? 'normal',
    performanceInfluenceDa: influence,
    bonusPoints: t.bonusPoints,
    penaltyPoints: t.penaltyPoints,
  };
}

export function drawChallenges(
  profile: Profile,
  context: ContextState,
  underwear: UnderwearPick | null,
  count = 3,
  excludeTemplateIds: string[] = [],
  perf?: PerformanceSnapshot | null,
  cal?: CalendarSummary | null,
): ActiveChallenge[] {
  const pool = filterTemplates(profile, context).filter(
    (t) => !excludeTemplateIds.includes(t.id),
  );
  if (!pool.length) return [];

  const weighted = pool.map((t) => ({ t, w: performanceWeight(t, perf, cal) }));
  const picked = weightedSample(weighted, Math.min(count, weighted.length));
  return picked.map((t) => toActive(t, profile, context, underwear, perf));
}

/** Draw one while-playing challenge (kind: ingame) */
export function drawInGameChallenge(
  profile: Profile,
  context: ContextState,
  underwear: UnderwearPick | null,
  excludeTemplateIds: string[] = [],
  perf?: PerformanceSnapshot | null,
  cal?: CalendarSummary | null,
): ActiveChallenge | null {
  const pool = filterTemplates(profile, context, { kind: 'ingame' }).filter(
    (t) => !excludeTemplateIds.includes(t.id),
  );
  if (!pool.length) return null;
  const weighted = pool.map((t) => ({ t, w: performanceWeight(t, perf, cal) * (t.bonusPoints ?? 10) }));
  const [picked] = weightedSample(weighted, 1);
  if (!picked) return null;
  const active = toActive(picked, profile, context, underwear, perf);
  if (perf && perf.sessionCount > 0) {
    active.performanceInfluenceDa = influenceTextDa(perf, 'in-game-udfordringen');
  }
  return active;
}

/**
 * Dokumenteret skalering:
 * N templates × T themes × 2 intensity × V var-udfyldninger × kontekst × performance
 */
export function estimateVariationSpace(): {
  templates: number;
  noteDa: string;
} {
  const templates = CHALLENGE_TEMPLATES.length;
  const themes = 8;
  const intensity = 2;
  const approxVars = 4;
  const perfBands = 4;
  const approx = templates * themes * intensity * approxVars * perfBands;
  return {
    templates,
    noteDa: `${templates} skabeloner × themes × intensitet × variabler × præstationsbånd ≈ ~${approx.toLocaleString('da-DK')} konkrete variationer (orden-størrelse; faktisk unikke tekster afhænger af aktive packs + session-log).`,
  };
}
