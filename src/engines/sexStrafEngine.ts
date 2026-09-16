import { SEX_STRAF_TEMPLATES } from '../data/sexStraf';
import type { CalendarSummary } from './calendarEngine';
import type {
  ChallengeLogEntry,
  Intensity,
  PerformanceSnapshot,
  Profile,
  SexStrafHardness,
  SexStrafInstance,
  SexStrafTemplate,
  ThemePack,
} from '../types';

const VAGINAL_BLOCK = /\b(vagina|vaginal|kusse|skede|clitoris|klitoris|pussy)\b/i;

/**
 * Due rules (documented):
 *
 * NEVER due when:
 *  - nødstop / paused
 *  - an instance is already pending or active
 *  - calendar today is rest (hvile blocks NEW sex-straf)
 *  - cooldown not elapsed since last resolved sex-straf
 *
 * Cooldown:
 *  - complete → 12 h (debt redeemed)
 *  - skip     → 6 h
 *  - fail     → 2 h (may generate again sooner)
 *  - unknown  → 8 h
 *
 * DUE if any trigger fires (and blockers above are clear):
 *  1. performance.band === 'poor'
 *  2. pointsBalance < 0
 *  3. loss/quit streak <= -2
 *  4. ≥2 loss/quit in last 5 sessions
 *  5. a recent challenge fail (any of last 3 log entries)
 *  6. calendar today has signal straf or hard
 *
 * Hardness leans hård when poor/debt/streak, else profile intensity.
 * Paused = no claim, no resolve progress.
 */
export const SEX_STRAF_COOLDOWN_MS = {
  done: 12 * 60 * 60 * 1000,
  skipped: 6 * 60 * 60 * 1000,
  failed: 2 * 60 * 60 * 1000,
  default: 8 * 60 * 60 * 1000,
} as const;

export interface SexStrafDue {
  due: boolean;
  reasonsDa: string[];
  blockedDa: string[];
  cooldownUntil: string | null;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randInt(lo: number, hi: number): number {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

function anatomyOk(t: SexStrafTemplate): boolean {
  const blob = `${t.titleDa} ${t.sceneDa} ${t.partnerPool.join(' ')} ${t.placePool.join(' ')} ${t.whyPool.join(' ')}`;
  if (VAGINAL_BLOCK.test(blob) && !t.allowsSemenCollection) return false;
  if (/\bvaginal\b/i.test(blob) && !/opsamling|sæd|semen|ingen vaginal/i.test(blob)) return false;
  return true;
}

function themeOk(t: SexStrafTemplate, enabled: ThemePack[]): boolean {
  return t.themes.some((th) => enabled.includes(th));
}

function intensityOk(t: SexStrafTemplate, intensity: Intensity, dayMode: Profile['dayMode']): boolean {
  if (dayMode === 'soft') return t.intensity.includes('soft') || t.hardnessPool.includes('blød');
  return t.intensity.includes(intensity) || t.intensity.includes('hard') || t.intensity.includes('soft');
}

export function filterSexStrafTemplates(profile: Profile): SexStrafTemplate[] {
  return SEX_STRAF_TEMPLATES.filter((t) => {
    if (!anatomyOk(t)) return false;
    if (!themeOk(t, profile.enabledThemes)) return false;
    if (!intensityOk(t, profile.intensity, profile.dayMode)) return false;
    return true;
  });
}

function lastResolved(log: SexStrafInstance[]): SexStrafInstance | undefined {
  return log.find((x) => x.resolvedAt && (x.status === 'done' || x.status === 'skipped' || x.status === 'failed'));
}

function cooldownMsFor(status: SexStrafInstance['status'] | undefined): number {
  if (status === 'done') return SEX_STRAF_COOLDOWN_MS.done;
  if (status === 'skipped') return SEX_STRAF_COOLDOWN_MS.skipped;
  if (status === 'failed') return SEX_STRAF_COOLDOWN_MS.failed;
  return SEX_STRAF_COOLDOWN_MS.default;
}

export function evaluateSexStrafDue(opts: {
  paused: boolean;
  active: SexStrafInstance | null;
  log: SexStrafInstance[];
  lastSexStrafAt: string | null;
  performance: PerformanceSnapshot;
  pointsBalance: number;
  challengeLog: ChallengeLogEntry[];
  calendar: CalendarSummary | null;
  now?: Date;
}): SexStrafDue {
  const now = opts.now ?? new Date();
  const reasonsDa: string[] = [];
  const blockedDa: string[] = [];

  if (opts.paused) blockedDa.push('Nødstop er ON — ingen ny sex-straf og ingen fremdrift.');
  if (opts.active && (opts.active.status === 'pending' || opts.active.status === 'active')) {
    blockedDa.push('Der ligger allerede en afventende/aktiv sex-straf.');
  }
  if (opts.calendar?.hasRest) {
    blockedDa.push('Kalenderen markerer i dag som hvile — ingen ny sex-straf.');
  }

  const last = lastResolved(opts.log);
  const lastAtRaw = last?.resolvedAt ?? opts.lastSexStrafAt;
  let cooldownUntil: string | null = null;
  if (lastAtRaw) {
    const lastMs = Date.parse(lastAtRaw);
    if (Number.isFinite(lastMs)) {
      const cd = cooldownMsFor(last?.status);
      const until = lastMs + cd;
      if (until > now.getTime()) {
        cooldownUntil = new Date(until).toISOString();
        const hours = Math.max(1, Math.ceil((until - now.getTime()) / 36e5));
        blockedDa.push(`Cooldown: ~${hours} t tilbage efter sidste sex-straf (${last?.status ?? 'ukendt'}).`);
      }
    }
  }

  const perf = opts.performance;
  if (perf.sessionCount > 0 && perf.band === 'poor') {
    reasonsDa.push(`Præstationsbånd er dårligt (${perf.score}/100).`);
  }
  if (opts.pointsBalance < 0) {
    reasonsDa.push(`Pointgæld: ${opts.pointsBalance}.`);
  }
  if (perf.streak <= -2) {
    reasonsDa.push(`Nederlagsstime ×${Math.abs(perf.streak)}.`);
  }
  if (opts.calendar?.hasStraf) reasonsDa.push('Kalender-signal i dag: straf.');
  if (opts.calendar?.hasHard) reasonsDa.push('Kalender-signal i dag: hård dag.');

  const recentFails = opts.challengeLog.slice(0, 3).filter((e) => e.outcome === 'fail').length;
  if (recentFails > 0) {
    reasonsDa.push(`Nylig failed udfordring (${recentFails} i de sidste 3).`);
  }

  const due = reasonsDa.length > 0 && blockedDa.length === 0;
  return { due, reasonsDa, blockedDa, cooldownUntil };
}

/** Extra due check when full session list is available (loss density). */
export function lossDensityTrigger(
  results: Array<{ result: string }>,
): boolean {
  const last5 = results.slice(0, 5);
  const bad = last5.filter((s) => s.result === 'loss' || s.result === 'quit').length;
  return bad >= 2 && last5.length >= 2;
}

export function evaluateSexStrafDueWithSessions(
  opts: Parameters<typeof evaluateSexStrafDue>[0] & {
    sessions: Array<{ result: string }>;
  },
): SexStrafDue {
  const base = evaluateSexStrafDue(opts);
  if (lossDensityTrigger(opts.sessions)) {
    const msg = 'Mindst 2 nederlag/quit i de sidste 5 sessions.';
    if (!base.reasonsDa.includes(msg)) base.reasonsDa.push(msg);
  }
  const due = base.reasonsDa.length > 0 && base.blockedDa.length === 0;
  return { ...base, due };
}

function leanHardness(
  pool: SexStrafHardness[],
  profile: Profile,
  perf: PerformanceSnapshot,
  pointsBalance: number,
): SexStrafHardness {
  const preferHard = perf.band === 'poor' || pointsBalance < 0 || perf.streak <= -2;
  const preferSoft = profile.dayMode === 'soft' || profile.intensity === 'soft';
  if (preferHard && pool.includes('hård')) return 'hård';
  if (preferHard && pool.includes('medium')) return 'medium';
  if (preferSoft && pool.includes('blød')) return 'blød';
  if (profile.intensity === 'hard' && pool.includes('hård')) return 'hård';
  return pool.includes('medium') ? 'medium' : pool[0]!;
}

function fillScene(
  t: SexStrafTemplate,
  slots: {
    partner: string;
    place: string;
    why: string;
    duration: number;
    hardness: SexStrafHardness;
    breastSize: string;
    game: string;
  },
): string {
  return t.sceneDa
    .replaceAll('{partner}', slots.partner)
    .replaceAll('{place}', slots.place)
    .replaceAll('{why}', slots.why)
    .replaceAll('{duration}', String(slots.duration))
    .replaceAll('{hardness}', slots.hardness)
    .replaceAll('{breastSize}', slots.breastSize)
    .replaceAll('{game}', slots.game);
}

export function generateSexStraf(opts: {
  profile: Profile;
  performance: PerformanceSnapshot;
  pointsBalance: number;
  playingGame: string;
  excludeTemplateIds?: string[];
  dueReasonsDa: string[];
}): SexStrafInstance | null {
  const exclude = new Set(opts.excludeTemplateIds ?? []);
  let pool = filterSexStrafTemplates(opts.profile).filter((t) => !exclude.has(t.id));
  if (!pool.length) pool = filterSexStrafTemplates(opts.profile);
  if (!pool.length) pool = [...SEX_STRAF_TEMPLATES];
  if (!pool.length) return null;

  // Weight harder templates when poor
  const poor = opts.performance.band === 'poor' || opts.pointsBalance < 0;
  const weighted = pool.map((t) => {
    let w = 1;
    if (poor && t.hardnessPool.includes('hård')) w *= 1.8;
    if (!poor && t.hardnessPool.includes('blød')) w *= 1.3;
    if (t.imageFile) w *= 1.25;
    return { t, w };
  });
  const total = weighted.reduce((a, b) => a + b.w, 0);
  let r = Math.random() * total;
  let picked = weighted[0]!.t;
  for (const row of weighted) {
    r -= row.w;
    if (r <= 0) {
      picked = row.t;
      break;
    }
  }

  const partner = pick(picked.partnerPool);
  const place = pick(picked.placePool);
  let why = pick(picked.whyPool);
  if (opts.dueReasonsDa[0]) {
    why = `${why} (${opts.dueReasonsDa[0]})`;
  }
  const duration = randInt(picked.durationMinRange[0], picked.durationMinRange[1]);
  const hardness = leanHardness(
    picked.hardnessPool,
    opts.profile,
    opts.performance,
    opts.pointsBalance,
  );
  const game = opts.playingGame.trim() || 'dit spil';
  const sceneDa = fillScene(picked, {
    partner,
    place,
    why,
    duration,
    hardness,
    breastSize: opts.profile.breastSize,
    game,
  });

  return {
    id: `ss-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    templateId: picked.id,
    titleDa: picked.titleDa,
    sceneDa,
    partnerDa: partner,
    placeDa: place,
    whyDa: why,
    durationMin: duration,
    hardness,
    status: 'pending',
    createdAt: new Date().toISOString(),
    redeemBoost: picked.bonusPoints ?? 18,
    imageFile: picked.imageFile,
  };
}

export function sexStrafPointsDelta(
  outcome: 'complete' | 'skip' | 'fail',
  instance: SexStrafInstance,
): number {
  const bonus = instance.redeemBoost ?? 18;
  const penalty = 10;
  if (outcome === 'complete') return bonus;
  if (outcome === 'fail') return -penalty;
  return -4; // skip: avoided redeem
}

export function isPendingSexStraf(active: SexStrafInstance | null): boolean {
  return !!active && (active.status === 'pending' || active.status === 'active');
}
