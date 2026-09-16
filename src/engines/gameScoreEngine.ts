import type { GamePresetId } from '../data/gameProfiles';
import type { GameResult, PerformanceRating } from '../types';

export type MetricMap = Record<string, number | string | undefined>;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function num(m: MetricMap, key: string): number | undefined {
  const v = m[key];
  if (v === undefined || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
}

function resultScore(result: GameResult): number {
  switch (result) {
    case 'win':
      return 100;
    case 'draw':
      return 55;
    case 'other':
      return 45;
    case 'loss':
      return 25;
    case 'quit':
      return 5;
    default:
      return 45;
  }
}

/** Linear map: value at lo → 0, at hi → 100 (clamped). */
function lin(value: number, lo: number, hi: number): number {
  if (hi === lo) return 50;
  return clamp(((value - lo) / (hi - lo)) * 100, 0, 100);
}

/**
 * KD with soft curve: 0 → 0, 1.0 → 50, 1.5 → 70, 2.0 → 90, 2.5+ → 100
 */
function kdScore(kills: number, deaths: number): number {
  const kd = kills / Math.max(deaths, 1);
  if (kd <= 1) return lin(kd, 0, 1) * 0.5;
  if (kd <= 1.5) return 50 + lin(kd, 1, 1.5) * 0.2;
  if (kd <= 2) return 70 + lin(kd, 1.5, 2) * 0.2;
  return 90 + lin(kd, 2, 2.5) * 0.1;
}

/**
 * Cash earned (WARDOGS): log-ish steps
 * 0 → 0, 50k → 40, 200k → 70, 500k+ → 100
 */
function cashScore(cash: number): number {
  if (cash <= 0) return 0;
  if (cash < 50_000) return lin(cash, 0, 50_000) * 0.4;
  if (cash < 200_000) return 40 + lin(cash, 50_000, 200_000) * 0.3;
  if (cash < 500_000) return 70 + lin(cash, 200_000, 500_000) * 0.3;
  return 100;
}

/**
 * Placement (Fortnite BR): 1 → 100, 2–3 → 85, 4–10 → 65, 11–25 → 40, else → 15
 */
function placementScore(place: number): number {
  if (place <= 1) return 100;
  if (place <= 3) return 85;
  if (place <= 10) return 65;
  if (place <= 25) return 40;
  return 15;
}

/**
 * Clear time for Diablo Pit: faster is better.
 * Under 3 min → 100, 3–8 → linear down to 40, 8–20 → down to 10, slower → 5
 */
function clearTimeScore(minutes: number): number {
  if (minutes <= 0) return 50;
  if (minutes <= 3) return 100;
  if (minutes <= 8) return 100 - lin(minutes, 3, 8) * 0.6;
  if (minutes <= 20) return 40 - lin(minutes, 8, 20) * 0.3;
  return 5;
}

function deathsInRunScore(deaths: number): number {
  // 0 → 100, 1 → 80, 2 → 60, 3 → 40, 5+ → 0
  return clamp(100 - deaths * 20, 0, 100);
}

function weighted(parts: { score: number; w: number }[]): number {
  let s = 0;
  let w = 0;
  for (const p of parts) {
    if (!Number.isFinite(p.score)) continue;
    s += p.score * p.w;
    w += p.w;
  }
  return w > 0 ? s / w : 50;
}

/**
 * Per-game normalized performance 0–100.
 *
 * Formulas (documented for UI help + README):
 * - CS2:      K/D 30% · ADR 28% · HS% 12% · result 30%
 * - WARDOGS:  K/D 25% · cash 25% · result 30% · zone 20%
 * - LoL:      KDA 30% · CS/min 20% · vision 10% · dmg% 10% · result 30%
 * - Diablo IV: Pit 40% · clear 20% · deaths 15% · journey 15% · result 10%
 * - Fortnite: placement 40% · kills 25% · K/D 15% · result 20%
 * - Custom:   returns null → caller uses classic rating+result
 */
export function computeGameScore(
  gameId: GamePresetId | undefined,
  metrics: MetricMap | undefined,
  result: GameResult,
): number | null {
  if (!gameId || gameId === 'custom' || !metrics) return null;
  const r = resultScore(result);

  if (gameId === 'cs2') {
    const kills = num(metrics, 'kills') ?? 0;
    const deaths = num(metrics, 'deaths') ?? 0;
    const adr = num(metrics, 'adr');
    const hs = num(metrics, 'hsPercent');
    const parts: { score: number; w: number }[] = [
      { score: kdScore(kills, deaths), w: 0.3 },
      { score: r, w: 0.3 },
    ];
    if (adr != null) parts.push({ score: lin(adr, 40, 120), w: 0.28 });
    if (hs != null) parts.push({ score: lin(hs, 0, 60), w: 0.12 });
    // If ADR/HS missing, reweight remaining (KD+result already present)
    return Math.round(weighted(parts));
  }

  if (gameId === 'wardogs') {
    const kills = num(metrics, 'kills') ?? 0;
    const deaths = num(metrics, 'deaths') ?? 0;
    const cash = num(metrics, 'cash') ?? 0;
    const zone = num(metrics, 'zoneScore') ?? 50;
    return Math.round(
      weighted([
        { score: kdScore(kills, deaths), w: 0.25 },
        { score: cashScore(cash), w: 0.25 },
        { score: r, w: 0.3 },
        { score: clamp(zone, 0, 100), w: 0.2 },
      ]),
    );
  }

  if (gameId === 'lol') {
    const kills = num(metrics, 'kills') ?? 0;
    const deaths = num(metrics, 'deaths') ?? 0;
    const assists = num(metrics, 'assists') ?? 0;
    const kda = (kills + assists) / Math.max(deaths, 1);
    const cspm = num(metrics, 'csPerMin');
    const vision = num(metrics, 'visionScore');
    const dmg = num(metrics, 'damageShare');
    const parts: { score: number; w: number }[] = [
      { score: clamp((kda / 5) * 100, 0, 100), w: 0.3 },
      { score: r, w: 0.3 },
    ];
    if (cspm != null) parts.push({ score: lin(cspm, 4, 10), w: 0.2 });
    if (vision != null) parts.push({ score: lin(vision, 10, 80), w: 0.1 });
    if (dmg != null) parts.push({ score: lin(dmg, 10, 40), w: 0.1 });
    return Math.round(weighted(parts));
  }

  if (gameId === 'diablo4') {
    const pit = num(metrics, 'pitTier') ?? 1;
    const clearMin = num(metrics, 'clearMin');
    const deaths = num(metrics, 'deaths') ?? 0;
    const journey = num(metrics, 'seasonJourney');
    const parts: { score: number; w: number }[] = [
      { score: lin(pit, 1, 150), w: 0.4 },
      { score: deathsInRunScore(deaths), w: 0.15 },
      { score: r, w: 0.1 },
    ];
    if (clearMin != null) parts.push({ score: clearTimeScore(clearMin), w: 0.2 });
    if (journey != null) parts.push({ score: clamp(journey, 0, 100), w: 0.15 });
    return Math.round(weighted(parts));
  }

  if (gameId === 'fortnite') {
    const place = num(metrics, 'placement') ?? 50;
    const kills = num(metrics, 'kills') ?? 0;
    const deaths = num(metrics, 'deaths');
    const parts: { score: number; w: number }[] = [
      { score: placementScore(place), w: 0.4 },
      { score: lin(kills, 0, 10), w: 0.25 },
      { score: r, w: 0.2 },
    ];
    if (deaths != null) {
      parts.push({ score: kdScore(kills, deaths), w: 0.15 });
    } else {
      // No deaths: boost kill weight slightly already covered; add mild kill-only kd proxy
      parts.push({ score: lin(kills, 0, 8), w: 0.15 });
    }
    return Math.round(weighted(parts));
  }

  return null;
}

/** Map 0–100 score → classic 1–5 rating for UI / legacy. */
export function ratingFromScore(score: number): PerformanceRating {
  if (score < 30) return 1;
  if (score < 50) return 2;
  if (score < 65) return 3;
  if (score < 85) return 4;
  return 5;
}

/** Build a short Danish performance note from metrics. */
export function metricsSummaryDa(
  gameId: GamePresetId | undefined,
  metrics: MetricMap | undefined,
): string {
  if (!metrics || !gameId || gameId === 'custom') return '';
  const bits: string[] = [];
  const k = num(metrics, 'kills');
  const d = num(metrics, 'deaths');
  const a = num(metrics, 'assists');

  if (gameId === 'cs2' || gameId === 'wardogs') {
    if (k != null && d != null) {
      const kd = (k / Math.max(d, 1)).toFixed(2);
      bits.push(`${k}/${d} (K/D ${kd})`);
    }
    const adr = num(metrics, 'adr');
    if (adr != null) bits.push(`ADR ${adr}`);
    const hs = num(metrics, 'hsPercent');
    if (hs != null) bits.push(`HS ${hs}%`);
    const cash = num(metrics, 'cash');
    if (cash != null) bits.push(`$${Math.round(cash).toLocaleString('da-DK')}`);
    const zone = num(metrics, 'zoneScore');
    if (zone != null) bits.push(`zone ${zone}`);
  } else if (gameId === 'lol') {
    if (k != null && d != null && a != null) {
      bits.push(`${k}/${d}/${a}`);
      bits.push(`KDA ${((k + a) / Math.max(d, 1)).toFixed(2)}`);
    }
    const cspm = num(metrics, 'csPerMin');
    if (cspm != null) bits.push(`CS/min ${cspm}`);
    const vision = num(metrics, 'visionScore');
    if (vision != null) bits.push(`vision ${vision}`);
  } else if (gameId === 'diablo4') {
    const pit = num(metrics, 'pitTier');
    if (pit != null) bits.push(`Pit ${pit}`);
    const clear = num(metrics, 'clearMin');
    if (clear != null) bits.push(`${clear} min`);
    if (d != null) bits.push(`${d} deaths`);
    const build = metrics.buildNote;
    if (typeof build === 'string' && build.trim()) bits.push(build.trim());
  } else if (gameId === 'fortnite') {
    const place = num(metrics, 'placement');
    if (place != null) bits.push(`#${place}`);
    if (k != null) bits.push(`${k} kills`);
    const mode = metrics.mode;
    if (typeof mode === 'string' && mode) bits.push(mode);
  }

  const rank = metrics.rank;
  if (typeof rank === 'string' && rank) bits.push(rank);

  return bits.join(' · ');
}

/** Infer win from Fortnite placement #1 if result left as other. */
export function maybeInferResult(
  gameId: GamePresetId | undefined,
  metrics: MetricMap | undefined,
  result: GameResult,
): GameResult {
  if (result !== 'other' && result !== 'draw') return result;
  if (gameId === 'fortnite') {
    const place = num(metrics ?? {}, 'placement');
    if (place === 1) return 'win';
    if (place != null && place > 1) return 'loss';
  }
  return result;
}
