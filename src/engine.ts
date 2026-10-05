import {
  BONUSES, BOTTOMS, BRAS, CLOSERS, CUPS, EXTRAS, FORM_LINES, FORMS, LEGWEAR, LOC_LINES, LOCATIONS,
  MAKEUP, OPENERS, PANTIES, PENALTIES, PLUG_FORMS, SHOES, TOPS, WIGS, formLabel,
  type Item,
} from './content';
import { LAYER_PRIORITY, OUTER_LAYERS, TAG_CHALLENGES, TAG_PUNISHMENTS, TAG_REWARDS, isHomeTag, isOutTag, type TagChallenge } from './tags';

import { STYLE_BY_ID, type Slot, type StyleDef } from './looks';
import type {
  AppData, Challenge, ChallengeKind, DayPlan, DayRecord, FormId, Game, GameLog, Intensity, KnownFor, OutfitPlan, SexPlan, Star, Style,
} from './types';

const CLAMP_FORMS: FormId[] = ['nipples', 'bondage', 'chastity', 'milking'];

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
function styled(r: R, items: Item[], look: Style): string {
  const m = items.filter((it) => it.s.includes(look));
  return pick(r, m.length ? m : items).t;
}
/** Frida's forms: mostly the star's own cup shifted by today's style, lightly anchored to the default. */
export function cupFor(star: Star, style: StyleDef, defaultCup: string, r: R): string {
  const own = Math.max(0, CUPS.indexOf(star.cup));
  const def = Math.max(0, CUPS.indexOf(defaultCup));
  const jitter = r() < 0.3 ? (r() < 0.5 ? -1 : 1) : 0;
  const idx = Math.round((own + style.cupShift) * 0.7 + def * 0.3) + jitter;
  return CUPS[Math.min(CUPS.length - 1, Math.max(0, idx))];
}
function buildOutfit(r: R, star: Star, style: StyleDef, cup: string, intensity: Intensity, form: FormId, tags: string[] = []): OutfitPlan {
  const look = style.look;
  // style-specific pieces first (top/bottom always, others most of the time), else the shared look pool
  const slot = (k: Slot, items: Item[], always: boolean) => {
    const own = style.own?.[k];
    return own && (always || r() < 0.65) ? pick(r, own) : styled(r, items, look);
  };
  const panties = slot('panties', PANTIES, false);
  const bra = slot('bra', BRAS, false);
  const top = slot('top', TOPS, true);
  const bottom = slot('bottom', BOTTOMS, true);
  const legwear = slot('legwear', LEGWEAR, false);
  const shoes = slot('shoes', SHOES, false);
  const makeup = styled(r, MAKEUP, look);
  const wig = styled(r, WIGS, look);
  // style signature first; cage only on chastity days; plug only on plug-based days
  const pool = EXTRAS.filter((e) => (e.s.includes(look) || e.s.includes('any'))
    && !e.t.includes('chastity') && !e.t.includes('plug')
    && (!e.t.includes('clamps') || CLAMP_FORMS.includes(form))
    && !style.signature.includes(e.t.split(' ').slice(-1)[0]));
  const extras: string[] = [style.signature];
  if (form === 'chastity') extras.push('chastity cage');
  if (PLUG_FORMS.includes(form)) extras.push(intensity === 'hard' ? 'large jeweled butt plug' : 'small butt plug');
  const count = Math.max(extras.length, intensity === 'hard' ? 3 : 2);
  let guard = 0;
  while (extras.length < count && guard++ < 50) {
    const e = weighted(r, pool, (e) => (e.hard ? (intensity === 'hard' ? 3 : 0.3) : 1) * (e.s.includes(look) ? 2 : 1));
    if (!extras.includes(e.t)) extras.push(e.t);
  }
  const base = { panties, bra, cup, top, bottom, legwear, shoes, makeup, wig, extras };
  return applyLayers({ ...base, summary: '' }, star, style, tags ?? []);
}

// ---------- sex ----------
function buildSex(r: R, star: Star, style: StyleDef, outfit: OutfitPlan, intensity: Intensity, form: FormId): SexPlan {
  const tone = style.tone && r() < 0.5 ? style.tone : star.tone;
  const def = FORMS.find((f) => f.id === form)!;
  const minutes = between(r, intensity === 'hard' ? def.hard : def.soft);
  const location = pick(r, LOCATIONS);
  const v = { cup: outfit.cup, item: outfit.panties, loc: location, min: String(minutes) };
  const lines = [
    pick(r, OPENERS[tone]),
    style.line,
    ...FORM_LINES[form].map((l) => fill(l, v)),
    fill(pick(r, LOC_LINES), v),
    pick(r, CLOSERS[tone]),
  ];
  // keep the scene at 3-6 sentences: drop the closer, then the style line, if too long
  const count = (ls: string[]) => (ls.join(' ').match(/[.!?](\s|$)/g) ?? []).length;
  if (count(lines) > 6) lines.pop(); // closer
  if (count(lines) > 6) lines.splice(1, 1); // style line
  if (count(lines) > 6) lines.splice(2, 1); // second form line
  return { form, formLabel: def.label, minutes, location, intensity, scene: lines.join(' ') };
}

// ---------- challenges ----------
function fill(t: string, v: Record<string, string>): string {
  return t.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');
}
const fitsForm = (t: TagChallenge, form: FormId) => !t.forms || t.forms.includes(form);
function tagMatch(t: TagChallenge, tags: string[]): boolean {
  if (t.tags.includes('*')) return tags.length > 0;
  return t.tags.some((x) => tags.includes(x));
}
function toChallenge(t: TagChallenge, id: string, v: Record<string, string>): Challenge {
  return { id: `${id}-${hash(t.text + t.link) % 10000}`, kind: t.kind, text: fill(t.text, v), link: fill(t.link, v) };
}
function outfitVars(style: StyleDef, outfit: OutfitPlan, form: FormId, star: Star): Record<string, string> {
  return {
    cup: outfit.cup, star: starShort(star), style: style.label.toLowerCase(), look: style.label.toLowerCase(),
    panties: outfit.panties, bra: outfit.bra, top: outfit.top, bottom: outfit.bottom, legwear: outfit.legwear,
    shoes: outfit.shoes, sig: style.signature, loc: '', form: formLabel(form).toLowerCase(),
  };
}
/** Apply practical outer layers from day tags onto a style outfit. */
export function applyLayers(outfit: Omit<OutfitPlan,'summary'|'layers'> & Partial<Pick<OutfitPlan,'summary'|'layers'>>, star: Star, _style: StyleDef, tags: string[]): OutfitPlan {
  const outTags = LAYER_PRIORITY.filter((t) => tags.includes(t) && OUTER_LAYERS[t]);
  if (!outTags.length) {
    const summary = `${starShort(star)} picks: ${outfit.top}, ${outfit.bottom}, ${outfit.legwear}, ${outfit.cup}-cup forms.`;
    return { ...outfit, layers: undefined, summary };
  }
  const layer = OUTER_LAYERS[outTags[0]];
  const parts = [layer.top, layer.bottom];
  if (layer.shoes) parts.push(layer.shoes);
  const layers = parts.join('; ');
  const summary = `${starShort(star)} picks: ${outfit.top} + ${outfit.bottom} under ${layer.bottom}, ${outfit.cup}-cup forms.`;
  return { ...outfit, layers, summary };
}

export function buildChallenges(
  r: R, intensity: Intensity, date: string, form: FormId, style: StyleDef, tags: string[], v: Record<string, string>,
): Challenge[] {
  if (!tags.length) return [];
  const hardW = (t: TagChallenge) => {
    let w = t.hard ? (intensity === 'hard' ? 2.5 : 0.35) : 1;
    if (t.styles?.includes(style.id)) w *= 4;
    if (t.forms) w *= 1.5;
    if (t.outOnly && !tags.some(isOutTag)) w = 0;
    if (t.homeOnly && !tags.some(isHomeTag)) w = 0;
    return w;
  };
  const pool = TAG_CHALLENGES.filter((c) => tagMatch(c, tags) && fitsForm(c, form) && hardW(c) > 0
    && (!c.styles || c.styles.includes(style.id)));
  // Prefer style-matched first, then diversify kinds
  const styleHit = pool.filter((c) => c.styles?.includes(style.id));
  const rest = pool.filter((c) => !c.styles?.includes(style.id));
  const ranked = [...styleHit, ...rest];
  const out: Challenge[] = [];
  const usedText = new Set<string>();
  const wantKinds: ChallengeKind[][] = [
    ['wear', 'task'],
    ['tease', 'task', 'wear'],
    tags.includes('spil') || tags.includes('workout') ? ['gaming', 'task', 'wear'] : ['task', 'wear', 'tease', 'gaming'],
  ];
  for (let idx = 0; idx < MAX_CHALLENGES; idx++) {
    const kinds = wantKinds[idx];
    const candidates = ranked.filter((c) => kinds.includes(c.kind) && !usedText.has(c.text) && hardW(c) > 0);
    const fallback = ranked.filter((c) => !usedText.has(c.text) && hardW(c) > 0);
    const list = candidates.length ? candidates : fallback;
    if (!list.length) break;
    const t = weighted(r, list, hardW);
    usedText.add(t.text);
    out.push(toChallenge(t, `${date}-c${idx}`, v));
  }
  return out.slice(0, MAX_CHALLENGES);
}

function buildSpare(r: R, form: FormId, style: StyleDef, tags: string[], date: string, v: Record<string, string>) {
  const tagsOr = tags.length ? tags : ['*'];
  const pun = TAG_PUNISHMENTS.filter((t) => tagMatch(t, tagsOr) && fitsForm(t, form) && (!t.styles || t.styles.includes(style.id)));
  const rew = TAG_REWARDS.filter((t) => {
    if (form === 'chastity' && /finish/i.test(t.text)) return false;
    return tagMatch(t, tagsOr) && fitsForm(t, form);
  });
  return {
    punishment: toChallenge(pick(r, pun.length ? pun : TAG_PUNISHMENTS), `${date}-p`, v),
    reward: toChallenge(pick(r, rew.length ? rew : TAG_REWARDS.filter((t) => !(form === 'chastity' && /finish/i.test(t.text)))), `${date}-r`, v),
  };
}

/** Rebuild only challenges (and spare) from current tags — keeps sex and base outfit pieces. */
export function regenerateChallenges(plan: DayPlan, star: Star, tags: string[]): DayPlan {
  const style = STYLE_BY_ID[plan.styleId];
  const r = rng(`chal|${plan.date}|${star.id}|${plan.styleId}|${[...tags].sort().join(',')}`);
  const outfit = applyLayers(plan.outfit, star, style, tags);
  const v = outfitVars(style, outfit, plan.sex.form, star);
  v.loc = plan.sex.location;
  const challenges = buildChallenges(r, plan.sex.intensity, plan.date, plan.sex.form, style, tags, v);
  const spare = buildSpare(r, plan.sex.form, style, tags, plan.date, v);
  return { ...plan, tags, outfit, challenges, spare };
}

export function starShort(star: { name: string }): string {
  const parts = star.name.split(' ');
  const titles = ['Queen', 'Mistress', 'Nurse', 'Professor', 'Lady', 'Captain', 'Officer'];
  return titles.includes(parts[0]) ? `${parts[0]} ${parts[1]}` : parts[0];
}

/** Most recent style this star wore before `date` (from saved days). */
export function lastStyle(starId: string, date: string, days: Record<string, DayRecord>): KnownFor | undefined {
  const keys = Object.keys(days).filter((k) => k < date && days[k].plan.starId === starId).sort();
  return keys.length ? days[keys[keys.length - 1]].plan.styleId : undefined;
}
/** One of her known-for styles, never the same as her last appearance (when she has 2+). */
export function pickStyle(date: string, star: Star, days: Record<string, DayRecord>): KnownFor {
  const known = star.knownFor.filter((k) => STYLE_BY_ID[k]);
  if (known.length === 0) return 'sweet-tease';
  const last = lastStyle(star.id, date, days);
  const options = known.length > 1 ? known.filter((k) => k !== last) : known;
  return pick(rng(`style|${date}|${star.id}`), options);
}

export function generateDay(date: string, star: Star, defaultCup: string, days: Record<string, DayRecord>, tags: string[] = []): DayPlan {
  const styleId = pickStyle(date, star, days);
  const style = STYLE_BY_ID[styleId];
  const r = rng(`day|${date}|${star.id}|${styleId}`);
  const intensity: Intensity = r() < (style.leaning === 'hard' ? 0.75 : style.leaning === 'soft' ? 0.2 : 0.5) ? 'hard' : 'soft';
  const cup = cupFor(star, style, defaultCup, r);
  const form = weighted(r, FORMS, (f) => (style.forms.includes(f.id) ? 5 : 1)).id;
  const outfit = buildOutfit(r, star, style, cup, intensity, form, tags);
  const sex = buildSex(r, star, style, outfit, intensity, form);
  const v = outfitVars(style, outfit, form, star);
  v.loc = sex.location;
  const challenges = buildChallenges(r, intensity, date, form, style, tags, v);
  const spare = buildSpare(r, form, style, tags, date, v);
  return {
    date, starId: star.id, starName: star.name, styleId, styleLabel: style.label, tags: [...tags],
    outfit, sex, challenges, spare, bonus: pick(r, BONUSES), penalty: pick(r, PENALTIES),
  };
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

export const EVENING_HOUR = 21;
export const DONE_MIN = -5;
export const FAIL_MIN = 10;

export interface Effects {
  mood: Mood;
  score: number | null;
  baseMinutes: number;
  gameDelta: number;
  chalDelta: number;
  done: number;
  failed: number;
  missed: number; // unchecked after the evening cutoff (counted as failed)
  detail: string; // bonus/penalty line
  line: string; // e.g. "Challenges: 2/3 done · −10 min"
}

/** Applies gaming performance, then challenge results, to the base plan. Always at most 3 challenges. */
export function effectivePlan(rec: DayRecord, now: Date = new Date()): { plan: DayPlan; fx: Effects; missedIds: Set<string> } {
  const score = dayScore(rec.games);
  const mood = moodFor(score);
  const base = rec.plan;
  let challenges = [...base.challenges];
  let intensity: Intensity = base.sex.intensity;
  let gameDelta = 0;
  if (mood === 'strict' || mood === 'stricter') {
    challenges[2] = base.spare.punishment;
    intensity = 'hard';
    gameDelta = mood === 'stricter' ? 15 : 10;
  } else if (mood === 'reward') {
    challenges[2] = base.spare.reward;
    if (score !== null && score >= 85) intensity = 'soft';
    gameDelta = -5;
  }
  challenges = challenges.slice(0, MAX_CHALLENGES);

  const overdue = base.date < todayKey(now) || (base.date === todayKey(now) && now.getHours() >= EVENING_HOUR);
  const status = rec.status ?? {};
  let done = 0, failed = 0, missed = 0;
  const missedIds = new Set<string>();
  for (const c of challenges) {
    if (status[c.id] === 'done') done++;
    else if (status[c.id] === 'failed') failed++;
    else if (overdue) { failed++; missed++; missedIds.add(c.id); }
  }
  const chalDelta = done * DONE_MIN + failed * FAIL_MIN;
  let detail = '';
  if (done === MAX_CHALLENGES) { intensity = 'soft'; detail = base.bonus; }
  else if (failed >= 2) { intensity = 'hard'; detail = base.penalty; }
  const minutes = Math.max(5, base.sex.minutes + gameDelta + chalDelta);

  const parts = [`${done}/${MAX_CHALLENGES} done`];
  if (failed) parts.push(`${failed} failed${missed ? ` (${missed} missed)` : ''}`);
  const delta = chalDelta === 0 ? 'no change' : `${chalDelta < 0 ? '\u2212' : '+'}${Math.abs(chalDelta)} min`;
  const line = `Challenges: ${parts.join(', ')} \u00b7 ${delta}${detail ? (intensity === 'soft' ? ', soft' : ', hard') : ''}`;

  return {
    plan: { ...base, challenges, sex: { ...base.sex, intensity, minutes, formLabel: formLabel(base.sex.form) } },
    fx: { mood, score, baseMinutes: base.sex.minutes, gameDelta, chalDelta, done, failed, missed, detail, line },
    missedIds,
  };
}

/** Makes sure today has a plan. If today's star was renamed since, today's plan is rebuilt with the new name (checkmarks and games kept). */
export function ensureDay(d: AppData, date: string): AppData {
  const existing = d.days[date];
  if (existing) {
    let plan = existing.plan.tags ? existing.plan : { ...existing.plan, tags: [] as string[] };
    const star = d.stars.find((s) => s.id === plan.starId);
    if (star && star.name !== plan.starName) {
      const { [date]: _today, ...rest } = d.days;
      void _today;
      let rebuilt = generateDay(date, star, d.defaultCup, rest, plan.tags ?? []);
      if (plan.tags?.length) rebuilt = regenerateChallenges(rebuilt, star, plan.tags);
      else rebuilt = { ...rebuilt, tags: [], challenges: [] };
      return { ...d, days: { ...d.days, [date]: { ...existing, plan: rebuilt } } };
    }
    if (plan !== existing.plan) return { ...d, days: { ...d.days, [date]: { ...existing, plan } } };
    return d;
  }
  const id = pickStarId(date, d.stars, d.days);
  const star = d.stars.find((s) => s.id === id) ?? d.stars[0];
  const rec: DayRecord = {
    plan: { ...generateDay(date, star, d.defaultCup, d.days, []), tags: [], challenges: [] },
    games: [], status: {}, sexDone: false,
  };
  return { ...d, days: { ...d.days, [date]: rec } };
}

