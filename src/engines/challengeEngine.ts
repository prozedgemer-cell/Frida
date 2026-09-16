import { CHALLENGE_TEMPLATES } from '../data/challenges';
import { getUnderwearById } from './underwearEngine';
import { influenceTextDa } from './performanceEngine';
import {
  calendarChallengeMultiplier,
  describeCalendarInfluence,
  type CalendarSummary,
} from './calendarEngine';
import { blendContextGaming, WEIGHT_FORMULA_DA } from './weightBlend';
import type {
  ActiveChallenge,
  ChallengeActionClass,
  ChallengeKind,
  ChallengeTemplate,
  ContextState,
  Intensity,
  MorningTier,
  PerformanceSnapshot,
  Profile,
  ThemePack,
  UnderwearPick,
} from '../types';

const VAGINAL_BLOCK =
  /\b(vagina|vaginal|kusse|skede|clitoris|klitoris|pussy)\b/i;

/** Strong say/write markers — excluded from morning trio */
const SAY_WRITE_RE =
  /\b(skriv|læs højt|sig højt|sig:|sig "|tal |hvisk|råb|fortæl|besked|voice chat|mantraer|dagbog|pagt)\b/i;

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

export function inferActionClass(t: ChallengeTemplate): ChallengeActionClass {
  if (t.actionClass) return t.actionClass;
  const tags = t.tags.map((x) => x.toLowerCase());
  if (tags.includes('skrivning') || tags.includes('stemme') || /^skriv\b/i.test(t.titleDa)) {
    return tags.includes('skrivning') || /^skriv\b/i.test(t.titleDa) ? 'write' : 'say';
  }
  const blob = `${t.titleDa} ${t.bodyDa}`;
  if (SAY_WRITE_RE.test(blob) && !/\b(tag |bær|gå med|skift |sæt |knæl|stå )/i.test(blob)) {
    return /skriv/i.test(blob) ? 'write' : 'say';
  }
  if (
    tags.includes('wear') ||
    tags.includes('undertøj') ||
    tags.includes('outfit') ||
    /\b(tag |bær|skift til|sæt .*på)/i.test(blob)
  ) {
    return 'wear';
  }
  return 'do';
}

export function isDoOrWear(t: ChallengeTemplate): boolean {
  const c = inferActionClass(t);
  return c === 'do' || c === 'wear';
}

export function filterTemplates(
  profile: Profile,
  _context: ContextState,
  opts?: { kind?: ChallengeKind | ChallengeKind[]; doWearOnly?: boolean },
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
    if (opts?.doWearOnly && !isDoOrWear(t)) return false;
    const kind = t.kind ?? 'normal';
    if (kinds) {
      return kinds.includes(kind);
    }
    return kind !== 'ingame';
  });
}

function pickIntensity(t: ChallengeTemplate, profile: Profile): Intensity {
  if (profile.dayMode === 'soft') return 'soft';
  if (t.intensity.includes(profile.intensity)) return profile.intensity;
  return t.intensity[0];
}

function contextChallengeMul(cal?: CalendarSummary | null): number {
  if (!cal || !cal.entries.length) return 1;
  let m = 1;
  if (cal.hasRest) m *= 0.75;
  if (cal.hasHard || cal.hasStraf) m *= 1.35;
  if (cal.hasSoft || cal.hasReward) m *= 1.15;
  if (cal.hasClothing) m *= 1.2;
  if (cal.roleHints?.length) m *= 1.25;
  if (cal.noteBoost) m *= 1 + Math.min(cal.noteBoost, 0.4);
  return m;
}

function performanceWeight(
  t: ChallengeTemplate,
  perf?: PerformanceSnapshot | null,
  cal?: CalendarSummary | null,
): number {
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

  let gaming = 1;
  if (perf && perf.sessionCount > 0 && perf.band === 'poor') {
    if (isStraf || bias === 'poor') gaming *= 3.2;
    if (isReward || bias === 'good' || bias === 'godlike') gaming *= 0.35;
    if (kind === 'tease') gaming *= 0.7;
  } else if (perf && perf.sessionCount > 0 && (perf.band === 'good' || perf.band === 'godlike')) {
    if (isReward || bias === 'good' || bias === 'godlike') gaming *= 2.6;
    if (isStraf || bias === 'poor') gaming *= 0.3;
    if (kind === 'tease') gaming *= 1.5;
  } else if (perf && perf.sessionCount > 0) {
    if (isStraf) gaming *= 0.9;
    if (isReward) gaming *= 1.1;
  }

  const context =
    calendarChallengeMultiplier(isStraf, isReward, cal) * contextChallengeMul(cal);

  // 70% calendar/role/day context, 30% gaming
  return Math.max(blendContextGaming(context, gaming), 0.05);
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
  morningTier?: MorningTier,
  cal?: CalendarSummary | null,
): ActiveChallenge {
  const intensity = pickIntensity(t, profile);
  const gamingInf =
    perf && perf.sessionCount > 0
      ? influenceTextDa(perf, t.kind === 'straf' ? 'straffen' : 'udfordringen')
      : undefined;
  const calInf = cal && cal.entries.length ? describeCalendarInfluence(cal).challengeDa : undefined;
  const influence = [gamingInf, calInf].filter(Boolean).join(' ') || undefined;
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
    actionClass: inferActionClass(t),
    morningTier: morningTier ?? t.morningTier,
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
  return picked.map((t) => toActive(t, profile, context, underwear, perf, undefined, cal));
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
  const weighted = pool.map((t) => ({
    t,
    w: performanceWeight(t, perf, cal) * (t.bonusPoints ?? 10),
  }));
  const [picked] = weightedSample(weighted, 1);
  if (!picked) return null;
  const active = toActive(picked, profile, context, underwear, perf, undefined, cal);
  if (perf && perf.sessionCount > 0) {
    const calInf = cal && cal.entries.length ? describeCalendarInfluence(cal).challengeDa : '';
    active.performanceInfluenceDa = [influenceTextDa(perf, 'in-game-udfordringen'), calInf]
      .filter(Boolean)
      .join(' ');
  }
  return active;
}

function pickForTier(
  tier: MorningTier,
  pool: ChallengeTemplate[],
  profile: Profile,
  context: ContextState,
  underwear: UnderwearPick | null,
  perf: PerformanceSnapshot | null | undefined,
  cal: CalendarSummary | null | undefined,
  used: Set<string>,
): ActiveChallenge | null {
  let candidates = pool.filter((t) => !used.has(t.id) && isDoOrWear(t));
  const tagged = candidates.filter((t) => t.morningTier === tier);
  if (tagged.length) candidates = tagged;
  else if (tier === 'easy') {
    candidates = candidates.filter((t) => t.intensity.includes('soft'));
  } else if (tier === 'hard') {
    candidates = candidates.filter(
      (t) => t.intensity.includes('hard') && t.morningTier !== 'boundary',
    );
  } else {
    candidates = candidates.filter(
      (t) =>
        t.morningTier === 'boundary' ||
        t.tags.some((x) =>
          ['boundary', 'ydmyg', 'chastity', 'plug', 'straf', 'public'].includes(x.toLowerCase()),
        ) ||
        t.kind === 'straf',
    );
  }
  if (!candidates.length) {
    candidates = pool.filter((t) => !used.has(t.id) && isDoOrWear(t));
  }
  if (!candidates.length) return null;
  const weighted = candidates.map((t) => ({ t, w: performanceWeight(t, perf, cal) }));
  const [picked] = weightedSample(weighted, 1);
  if (!picked) return null;
  used.add(picked.id);
  return toActive(picked, profile, context, underwear, perf, tier, cal);
}

/**
 * Every morning: exactly 3 challenges — easy, hard, boundary-breaking.
 * DO / WEAR actions only (say/write/speak purged from this set).
 */
export function drawMorningTrio(
  profile: Profile,
  context: ContextState,
  underwear: UnderwearPick | null,
  perf?: PerformanceSnapshot | null,
  cal?: CalendarSummary | null,
): ActiveChallenge[] {
  const pool = filterTemplates(profile, context, { doWearOnly: true });
  const used = new Set<string>();
  const easy = pickForTier('easy', pool, profile, context, underwear, perf, cal, used);
  const hard = pickForTier('hard', pool, profile, context, underwear, perf, cal, used);
  const boundary = pickForTier('boundary', pool, profile, context, underwear, perf, cal, used);
  return [easy, hard, boundary].filter((x): x is ActiveChallenge => !!x);
}

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
    noteDa: `${templates} skabeloner × themes × intensitet × variabler × præstationsbånd ≈ ~${approx.toLocaleString('da-DK')} konkrete variationer. ${WEIGHT_FORMULA_DA} Morgen-trio: præcis 3 DO/WEAR (easy/hard/boundary).`,
  };
}

export { WEIGHT_FORMULA_DA };
