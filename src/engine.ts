import {
  BOTTOMS, BRAS, CHALLENGES, CLOSERS, CUPS, EXTRAS, FORM_LINES, FORMS, LEGWEAR, LOC_LINES, LOCATIONS,
  MAKEUP, OPENERS, PANTIES, PUNISHMENTS, REWARDS, SHOES, TOPS, WIGS, formLabel,
  type CTemplate, type Item,
} from './data/content';
import type {
  Challenge, DayPlan, DayRecord, FormId, Game, GameLog, Intensity, OutfitPlan, SexPlan, Star,
} from './types';

export const MAX_CHALLENGES = 3;
const AVOID_RECENT = 7;

// ---------- RNG ----------
function hash(str: string): number {
  let h = 2166136261;
  for (let k = 0; k < str.length; k++) { h ^= str.charCodeAt(k); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type R = () => number;
const pick = <T,>(r: R, arr: T[]): T => arr[Math.floor(r() * arr.length)];
const between = (r: R, [lo, hi]: [number, number]) => Math.round((lo + r() * (hi - lo)) / 5) * 5;
function weighted<T>(r: R, items: T[], w: (t: T) => number): T {
  const total = items.reduce((s, t) => s + w(t), 0);
  let x = r() * total;
  for (const t of items) { x -= w(t); if (x <= 0) return t; }
  return items[items.length - 1];
}

// ---------- dates ----------
export function todayKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n, 12);
  return todayKey(dt);
}

// ---------- star of the day ----------
/** Deterministic per date: rolls forward from 21 days back, excluding the last 7 owners (and always yesterday). */
export function pickStarId(date: string, stars: Star[], days: Record<string, DayRecord>): string {
  const pool = stars.filter((s) => s.enabled);
  if (pool.length === 0) return stars[0]?.id ?? '';
  const recent: string[] = [];
  let chosen = '';
  for (let off = -21; off <= 0; off++) {
    const d = addDays(date, off);
    const stored = off < 0 ? days[d]?.plan.starId : undefined;
    if (stored) chosen = stored;
    else {
      const avoid = Math.min(AVOID_RECENT, pool.length - 1);
      const blocked = new Set(recent.slice(-avoid));
      const options = pool.filter((s) => !blocked.has(s.id));
      chosen = pick(rng(`star|${d}`), options.length ? options : pool).id;
    }
    recent.push(chosen);
  }
  return chosen;
}

// ---------- outfit ----------
function styled(r: R, items: Item[], star: Star): string {
  const m = items.filter((it) => it.s.includes(star.style));
  return pick(r, m.length ? m : items).t;
}
export function cupFor(star: Star, defaultCup: string, r: R): string {
  const base = Math.max(0, CUPS.indexOf(defaultCup));
  const jitter = Math.floor(r() * 3) - 1; // -1..+1
  const idx = Math.min(CUPS.length - 1, Math.max(0, base + star.cupBias + (r() < 0.5 ? 0 : jitter)));
  return CUPS[idx];
}
function buildOutfit(r: R, star: Star, cup: string, intensity: Intensity): OutfitPlan {
  const panties = styled(r, PANTIES, star);
  const bra = styled(r, BRAS, star);
  const top = styled(r, TOPS, star);
  const bottom = styled(r, BOTTOMS, star);
  const legwear = styled(r, LEGWEAR, star);
  const shoes = styled(r, SHOES, star);
  const makeup = styled(r, MAKEUP, star);
  const wig = styled(r, WIGS, star);
  const pool = EXTRAS.filter((e) => e.s.includes(star.style) || e.s.includes('any'));
  const count = intensity === 'hard' ? 3 : 2;
  const extras: string[] = [];
  let guard = 0;
  while (extras.length < count && guard++ < 50) {
    const e = weighted(r, pool, (e) => (e.hard ? (intensity === 'hard' ? 3 : 0.3) : 1) * (e.s.includes(star.style) ? 2 : 1));
    if (extras.includes(e.t)) continue;
    if (e.t.includes('plug') && extras.some((t) => t.includes('plug'))) continue;
    extras.push(e.t);
  }
  const summary = `${starShort(star)} picks: ${top}, ${bottom}, ${legwear}, ${cup}-cup forms.`;
  return { panties, bra, cup, top, bottom, legwear, shoes, makeup, wig, extras, summary };
}

// ---------- sex ----------
function fill(t: string, v: Record<string, string>): string {
  return t.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');
}
function buildSex(r: R, star: Star, outfit: OutfitPlan, intensity: Intensity): SexPlan {
  const form = weighted(r, FORMS, (f) => (star.favForms.includes(f.id) ? 4 : 1)).id as FormId;
  const def = FORMS.find((f) => f.id === form)!;
  const minutes = between(r, intensity === 'hard' ? def.hard : def.soft);
  const location = pick(r, LOCATIONS);
  const v = { cup: outfit.cup, item: outfit.panties, loc: location, min: String(minutes) };
  const lines = [
    pick(r, OPENERS[star.tone]),
    ...FORM_LINES[form].map((l) => fill(l, v)),
    fill(pick(r, LOC_LINES), v),
    pick(r, CLOSERS[star.tone]),
  ];
  return { form, formLabel: def.label, minutes, location, intensity, scene: lines.join(' ') };
}

// ---------- challenges ----------
function buildChallenges(r: R, star: Star, outfit: OutfitPlan, intensity: Intensity, date: string): Challenge[] {
  const v = { cup: outfit.cup, star: starShort(star), panties: outfit.panties, legwear: outfit.legwear, shoes: outfit.shoes };
  const hardW = (t: CTemplate) => (t.hard ? (intensity === 'hard' ? 2 : 0.25) : 1);
  const slots: CTemplate['kind'][][] = [['wear'], ['tease'], r() < 0.5 ? ['gaming'] : ['task']];
  const out: Challenge[] = slots.map((kinds, idx) => {
    const t = weighted(r, CHALLENGES.filter((c) => kinds.includes(c.kind)), hardW);
    return { id: `${date}-${idx}-${hash(t.text) % 10000}`, kind: t.kind, text: fill(t.text, v) };
  });
  return out.slice(0, MAX_CHALLENGES);
}

export function starShort(star: { name: string }): string {
  const parts = star.name.split(' ');
  const titles = ['Queen', 'Mistress', 'Nurse', 'Professor', 'Lady', 'Captain', 'Officer'];
  return titles.includes(parts[0]) ? `${parts[0]} ${parts[1]}` : parts[0];
}

export function generateDay(date: string, star: Star, defaultCup: string): DayPlan {
  const r = rng(`day|${date}|${star.id}`);
  const intensity: Intensity = r() < (star.leaning === 'hard' ? 0.75 : star.leaning === 'soft' ? 0.2 : 0.5) ? 'hard' : 'soft';
  const cup = cupFor(star, defaultCup, r);
  const outfit = buildOutfit(r, star, cup, intensity);
  const sex = buildSex(r, star, outfit, intensity);
  const challenges = buildChallenges(r, star, outfit, intensity, date);
  const name = starShort(star);
  const spare = {
    punishment: { id: `${date}-p`, kind: 'punishment' as const, text: fill(pick(r, PUNISHMENTS), { star: name }) },
    reward: { id: `${date}-r`, kind: 'reward' as const, text: fill(pick(r, REWARDS), { star: name }) },
  };
  return { date, starId: star.id, starName: star.name, outfit, sex, challenges, spare };
}

// ---------- gaming ----------
export const GAMES: Game[] = ['CS2', 'WARDOGS', 'LoL', 'Diablo IV', 'Fortnite'];
const TARGET: Record<Game, number> = { CS2: 1.1, WARDOGS: 1.1, LoL: 3, 'Diablo IV': 15, Fortnite: 1.5 };

export function scoreGame(g: Omit<GameLog, 'score' | 'id' | 'at'>): number {
  const ratio = (g.kills + g.assists * 0.5) / Math.max(1, g.deaths);
  let s = Math.min(55, (ratio / TARGET[g.game]) * 35);
  s += Math.min(10, g.kills * (g.game === 'Diablo IV' ? 0.1 : 0.5));
  s += g.win ? 30 : 0;
  if (g.game === 'WARDOGS' && typeof g.cash === 'number') s += Math.max(-15, Math.min(15, g.cash / 200));
  return Math.round(Math.max(0, Math.min(100, s)));
}

export type Mood = 'none' | 'strict' | 'stricter' | 'neutral' | 'reward';
export function dayScore(games: GameLog[]): number | null {
  if (!games.length) return null;
  return Math.round(games.reduce((s, g) => s + g.score, 0) / games.length);
}
export function moodFor(score: number | null): Mood {
  if (score === null) return 'none';
  if (score < 25) return 'stricter';
  if (score < 45) return 'strict';
  if (score >= 75) return 'reward';
  return 'neutral';
}

/** Applies gaming performance to the base plan. Always returns at most 3 challenges. */
export function effectivePlan(rec: DayRecord): { plan: DayPlan; mood: Mood; score: number | null } {
  const score = dayScore(rec.games);
  const mood = moodFor(score);
  const base = rec.plan;
  let challenges = [...base.challenges];
  let sex = { ...base.sex };
  if (mood === 'strict' || mood === 'stricter') {
    challenges[2] = base.spare.punishment;
    sex = { ...sex, intensity: 'hard', minutes: sex.minutes + (mood === 'stricter' ? 15 : 10) };
  } else if (mood === 'reward') {
    challenges[2] = base.spare.reward;
    sex = { ...sex, intensity: score !== null && score >= 85 ? 'soft' : sex.intensity, minutes: Math.max(5, sex.minutes - 5) };
  }
  challenges = challenges.slice(0, MAX_CHALLENGES);
  return { plan: { ...base, challenges, sex: { ...sex, formLabel: formLabel(sex.form) } }, mood, score };
}
