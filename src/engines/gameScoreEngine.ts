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
 * KDA-style: (kills + assists) / max(deaths, 1)
 * 0 → 0, 1.0 → 45, 2.0 → 70, 3.0 → 85, 5.0+ → 100
 */
function kdaScore(kills: number, deaths: number, assists: number): number {
  const kda = (kills + assists) / Math.max(deaths, 1);
  if (kda <= 1) return lin(kda, 0, 1) * 0.45;
  if (kda <= 2) return 45 + lin(kda, 1, 2) * 0.25;
  if (kda <= 3) return 70 + lin(kda, 2, 3) * 0.15;
  if (kda <= 5) return 85 + lin(kda, 3, 5) * 0.15;
  return 100;
}

/**
 * Net cash (WARDOGS): positive = profit, negative = tab (spilvaluta).
 * −500k → 0 · 0 → 45 · +50k → 70 · +200k → 90 · +500k+ → 100
 */
function netCashScore(net: number): number {
  if (net < 0) {
    if (net <= -500_000) return 0;
    return lin(net, -500_000, 0) * 0.45;
  }
  if (net === 0) return 45;
  if (net < 50_000) return 45 + lin(net, 0, 50_000) * 0.25;
  if (net < 200_000) return 70 + lin(net, 50_000, 200_000) * 0.2;
  if (net < 500_000) return 90 + lin(net, 200_000, 500_000) * 0.1;
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
 * Recalibrated (shooters dominate on KDA + win/loss; WARDOGS netto is major):
 * - CS2:      KDA 45% · result 40% · ADR ~10% · HS ~5% (optional)
 * - WARDOGS:  KDA 30% · netto cash 35% · result 30% · zone ~5% (optional)
 * - LoL:      KDA 40% · result 35% · CS/min / vision / dmg optional
 * - Diablo IV: Pit 40% · clear 20% · deaths 15% · journey 15% · result 10%
 * - Fortnite: KDA 40% · result 40% · placement ~20% (optional)
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
    const assists = num(metrics, 'assists') ?? 0;
    const adr = num(metrics, 'adr');
    const hs = num(metrics, 'hsPercent');
    const parts: { score: number; w: number }[] = [
      { score: kdaScore(kills, deaths, assists), w: 0.45 },
      { score: r, w: 0.4 },
    ];
    if (adr != null) parts.push({ score: lin(adr, 40, 120), w: 0.1 });
    if (hs != null) parts.push({ score: lin(hs, 0, 60), w: 0.05 });
    return Math.round(weighted(parts));
  }

  if (gameId === 'wardogs') {
    const kills = num(metrics, 'kills') ?? 0;
    const deaths = num(metrics, 'deaths') ?? 0;
    const assists = num(metrics, 'assists') ?? num(metrics, 'revives') ?? 0;
    const cash = num(metrics, 'cash');
    const zone = num(metrics, 'zoneScore');
    const parts: { score: number; w: number }[] = [
      { score: kdaScore(kills, deaths, assists), w: 0.3 },
      { score: r, w: 0.3 },
    ];
    if (cash != null) {
      parts.push({ score: netCashScore(cash), w: 0.35 });
    }
    if (zone != null) {
      parts.push({ score: clamp(zone, 0, 100), w: 0.05 });
    }
    return Math.round(weighted(parts));
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
      { score: clamp((kda / 5) * 100, 0, 100), w: 0.4 },
      { score: r, w: 0.35 },
    ];
    if (cspm != null) parts.push({ score: lin(cspm, 4, 10), w: 0.15 });
    if (vision != null) parts.push({ score: lin(vision, 10, 80), w: 0.05 });
    if (dmg != null) parts.push({ score: lin(dmg, 10, 40), w: 0.05 });
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
    const kills = num(metrics, 'kills') ?? 0;
    const deaths = num(metrics, 'deaths') ?? 1;
    const assists = num(metrics, 'assists') ?? 0;
    const place = num(metrics, 'placement');
    const parts: { score: number; w: number }[] = [
      { score: kdaScore(kills, deaths, assists), w: 0.4 },
      { score: r, w: 0.4 },
    ];
    if (place != null) {
      parts.push({ score: placementScore(place), w: 0.2 });
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

/** Build a short performance note from metrics. */
export function metricsSummaryDa(
  gameId: GamePresetId | undefined,
  metrics: MetricMap | undefined,
): string {
  if (!metrics || !gameId || gameId === 'custom') return '';
  const bits: string[] = [];
  const k = num(metrics, 'kills');
  const d = num(metrics, 'deaths');
  const a = num(metrics, 'assists');

  if (gameId === 'cs2' || gameId === 'wardogs' || gameId === 'fortnite') {
    if (k != null && d != null) {
      const assistPart = a != null ? `/${a}` : '';
      const kd = ((k + (a ?? 0)) / Math.max(d, 1)).toFixed(2);
      bits.push(`${k}/${d}${assistPart} (KDA ${kd})`);
    }
    const adr = num(metrics, 'adr');
    if (adr != null) bits.push(`ADR ${adr}`);
    const hs = num(metrics, 'hsPercent');
    if (hs != null) bits.push(`HS ${hs}%`);
    const cash = num(metrics, 'cash');
    if (cash != null) {
      const sign = cash > 0 ? '+' : '';
      bits.push(`netto ${sign}${Math.round(cash).toLocaleString('da-DK')}`);
    }
    const zone = num(metrics, 'zoneScore');
    if (zone != null) bits.push(`zone ${zone}`);
    if (gameId === 'fortnite') {
      const place = num(metrics, 'placement');
      if (place != null) bits.push(`#${place}`);
      const mode = metrics.mode;
      if (typeof mode === 'string' && mode) bits.push(mode);
    }
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

/** Unused export kept for possible UI hints — net cash formatter. */
export function formatNetCashDa(cash: number): string {
  const abs = Math.abs(Math.round(cash)).toLocaleString('da-DK');
  if (cash > 0) return `Profit +${abs}`;
  if (cash < 0) return `Loss −${abs}`;
  return 'Break-even 0';
}

