import {
  BONUSES, CLOSERS, CUPS, FORM_LINES, FORMS, LOC_LINES, LOCATIONS,
  MAKEUP, OPENERS, PENALTIES, PLUG_FORMS, WIGS, formLabel,
  type Item,
} from './content';
import { LAYER_PRIORITY, OUTER_LAYERS, TAG_CHALLENGES, TAG_PUNISHMENTS, TAG_REWARDS, challengeTags, isHomeTag, isOutTag, tagLabel, type TagChallenge } from './tags';
import { FULL_LOOKS, NORMAL_LOOKS, STYLE_VIBES, type WardrobeLook } from './wardrobe';

import { STYLE_BY_ID, type StyleDef } from './looks';
import type {
  AppData, Challenge, DayPlan, DayRecord, FormId, Game, GameLog, Intensity, KnownFor, OutfitPlan, SexPlan, Star, Style,
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
function scoreLook(look: WardrobeLook, vibes: string[]): number {
  const hits = look.vibe.filter((v) => vibes.includes(v)).length;
  if (hits === 0) return 0.12;
  return hits * 12 + (vibes.includes(look.vibe[0]) ? 8 : 0);
}
function pickLook(r: R, pool: WardrobeLook[], vibes: string[]): WardrobeLook {
  const hit = pool.filter((l) => l.vibe.some((v) => vibes.includes(v)));
  return weighted(r, hit.length ? hit : pool, (l) => scoreLook(l, vibes));
}

/** Evening full look once any tags are set (for sex); day stays on the normal base + swaps. */
function wantsEveningFull(tags: string[], _styleId: KnownFor): boolean {
  return tags.length > 0;
}

function buildSwaps(tags: string[]): { tag: string; label: string; change: string }[] {
  const ordered = LAYER_PRIORITY.filter((t) => tags.includes(t) && OUTER_LAYERS[t]);
  // also include home activity "soft swaps" that are not full outer covers
  const homeSoft: Record<string, string> = {
    cook: 'Add an apron over the same base; sleeves rolled.',
    dinner: 'Keep the base; add a nice belt / earrings for dinner.',
    laundry: 'Same base; hair up, maybe drop the outer top while folding alone.',
    vacuum: 'Same base; kick shoes off if home alone.',
    hus: 'Same base at home; outer jacket off.',
    shower: 'Base set aside; after shower, back into the same base (or evening look).',
    tv: 'Same base on the couch; trousers optional if alone.',
    spil: 'Same base at the desk; trousers optional if alone.',
  };
  const swaps: { tag: string; label: string; change: string }[] = [];
  const seen = new Set<string>();
  for (const id of ordered) {
    const L = OUTER_LAYERS[id];
    swaps.push({
      tag: id,
      label: tagLabel(id),
      change: `Over the same base: ${L.top}; ${L.bottom}${L.shoes ? `; ${L.shoes}` : ''}.`,
    });
    seen.add(id);
  }
  for (const id of tags) {
    if (seen.has(id) || !homeSoft[id]) continue;
    swaps.push({ tag: id, label: tagLabel(id), change: homeSoft[id] });
  }
  return swaps;
}

/** Mix 2–3 template looks into one outfit so catalogs are pools, not rigid costumes. */
function mixLooks(r: R, primary: WardrobeLook, pool: WardrobeLook[], vibes: string[]): WardrobeLook & { mixNote: string } {
  const b = pickLook(r, pool, vibes);
  const c = r() < 0.65 ? pickLook(r, pool, vibes) : b;
  const donors = [primary, b, c];
  const pickSlot = <K extends keyof WardrobeLook>(key: K, preferPrimary = false): WardrobeLook[K] => {
    if (preferPrimary && r() < 0.55) return primary[key];
    return donors[Math.floor(r() * donors.length)][key];
  };
  const extras = [
    ...new Set([
      ...(pickSlot('extras') as string[]),
      ...(r() < 0.5 ? (b.extras as string[]) : []),
      ...(r() < 0.35 ? (c.extras as string[]) : []),
    ]),
  ].slice(0, 4);
  const mixedName = primary.name === b.name
    ? primary.name
    : `${primary.name} × ${b.name.split(' ')[0]}`;
  return {
    id: primary.id,
    tier: primary.tier,
    name: mixedName,
    vibe: primary.vibe,
    panties: pickSlot('panties', true) as string,
    bra: pickSlot('bra', true) as string,
    top: pickSlot('top', true) as string,
    bottom: pickSlot('bottom', true) as string,
    legwear: pickSlot('legwear') as string,
    shoes: pickSlot('shoes') as string,
    extras,
    mixNote: `mixed from ${primary.id}/${b.id}/${c.id}`,
  };
}

function lookToPieces(look: WardrobeLook, cup: string, style: StyleDef, form: FormId, intensity: Intensity, r: R) {
  const extras = [...look.extras];
  if (!extras.includes(style.signature)) extras.unshift(style.signature);
  if (form === 'chastity' && !extras.some((e) => /cage|chastity/i.test(e))) extras.push('chastity cage');
  if (PLUG_FORMS.includes(form) && !extras.some((e) => /plug/i.test(e))) {
    extras.push(intensity === 'hard' ? 'large jeweled butt plug' : 'small butt plug');
  }
  // Always remix makeup/wig from style pools (not locked to template)
  const makeup = styled(r, MAKEUP, style.look);
  const wig = r() < 0.4 ? styled(r, WIGS, style.look) : 'own hair / light styling';
  return {
    panties: look.panties, bra: look.bra, cup, top: look.top, bottom: look.bottom,
    legwear: look.legwear, shoes: look.shoes, makeup, wig, extras,
  };
}

function buildOutfit(r: R, star: Star, style: StyleDef, cup: string, intensity: Intensity, form: FormId, tags: string[] = []): OutfitPlan {
  const vibes = STYLE_VIBES[style.id] ?? ['casual', 'sexy'];
  // Base from the 200 normal templates, always piece-mixed with 1–2 other normals
  const seed = pickLook(r, NORMAL_LOOKS, vibes);
  const baseLook = mixLooks(r, seed, NORMAL_LOOKS, vibes);
  const pieces = lookToPieces(baseLook, cup, style, form, intensity, r);
  const swaps = buildSwaps(tags);
  // Occasionally borrow an outer-swap shoe/top wording from a second normal template
  for (const sw of swaps) {
    if (r() < 0.4) {
      const donor = pickLook(r, NORMAL_LOOKS, vibes);
      sw.change += ` Accent from ${donor.name.split('#')[0].trim()}: keep her ${donor.shoes}.`;
    }
  }
  let evening: OutfitPlan['evening'];
  if (wantsEveningFull(tags, style.id)) {
    const fullSeed = pickLook(r, FULL_LOOKS, vibes);
    // Mix full templates together; sometimes pull lingerie pieces from a normal look underneath
    const fullMix = mixLooks(r, fullSeed, FULL_LOOKS, vibes);
    if (r() < 0.45) {
      const linger = pickLook(r, NORMAL_LOOKS, vibes);
      fullMix.panties = linger.panties;
      fullMix.bra = r() < 0.5 ? linger.bra : fullMix.bra;
    }
    const ep = lookToPieces(fullMix, cup, style, form, intensity, r);
    evening = {
      id: fullMix.id, name: fullMix.name,
      summary: `Evening / sex: ${fullMix.name} — ${ep.top}, ${ep.bottom}, ${cup}-cup forms.`,
      panties: ep.panties, bra: ep.bra, top: ep.top, bottom: ep.bottom,
      legwear: ep.legwear, shoes: ep.shoes, extras: ep.extras,
    };
  }
  const layers = swaps.length
    ? swaps.map((s) => `${s.label}: ${s.change}`).join(' · ')
    : undefined;
  const summary = evening
    ? `${starShort(star)} base all day: ${baseLook.name} (${pieces.top} + ${pieces.bottom}, ${cup}-cup). Evening → ${evening.name}.`
    : `${starShort(star)} base all day: ${baseLook.name} — ${pieces.top}, ${pieces.bottom}, ${pieces.legwear}, ${cup}-cup forms.`;
  return {
    baseId: baseLook.id, baseName: baseLook.name, baseTier: 'normal',
    ...pieces, swaps, evening, layers, summary,
  };
}

/** Re-apply activity swaps / evening eligibility when tags change — keeps the same base look. */
export function applyLayers(outfit: OutfitPlan, star: Star, style: StyleDef, tags: string[]): OutfitPlan {
  const swaps = buildSwaps(tags);
  const layers = swaps.length ? swaps.map((s) => `${s.label}: ${s.change}`).join(' · ') : undefined;
  let evening = outfit.evening;
  const want = wantsEveningFull(tags, style.id);
  if (want && !evening) {
    const vibes = STYLE_VIBES[style.id] ?? ['casual', 'sexy'];
    const r = rng(`eve|${star.id}|${outfit.baseId}|${[...tags].sort().join(',')}`);
    const fullSeed = pickLook(r, FULL_LOOKS, vibes);
    const full = mixLooks(r, fullSeed, FULL_LOOKS, vibes);
    if (r() < 0.45) {
      const linger = pickLook(r, NORMAL_LOOKS, vibes);
      full.panties = linger.panties;
      full.bra = r() < 0.5 ? linger.bra : full.bra;
    }
    evening = {
      id: full.id, name: full.name,
      summary: `Evening / sex: ${full.name} — ${full.top}, ${full.bottom}, ${outfit.cup}-cup forms.`,
      panties: full.panties, bra: full.bra, top: full.top, bottom: full.bottom,
      legwear: full.legwear, shoes: full.shoes, extras: [...full.extras, style.signature],
    };
  }
  if (!want) evening = undefined;
  const summary = evening
    ? `${starShort(star)} base all day: ${outfit.baseName} (${outfit.top} + ${outfit.bottom}, ${outfit.cup}-cup). Evening → ${evening.name}.`
    : `${starShort(star)} base all day: ${outfit.baseName} — ${outfit.top}, ${outfit.bottom}, ${outfit.legwear}, ${outfit.cup}-cup forms.`;
  return { ...outfit, swaps, evening, layers, summary };
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
  const count = (ls: string[]) => (ls.join(' ').match(/[.!?](\s|$)/g) ?? []).length;
  if (count(lines) > 6) lines.pop();
  if (count(lines) > 6) lines.splice(1, 1);
  if (count(lines) > 6) lines.splice(2, 1);
  return { form, formLabel: def.label, minutes, location, intensity, scene: lines.join(' ') };
}

function fill(t: string, v: Record<string, string>): string {
  return t.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');
}
function outfitVars(style: StyleDef, outfit: OutfitPlan, form: FormId, star: Star): Record<string, string> {
  return {
    cup: outfit.cup, star: starShort(star), style: style.label.toLowerCase(), look: style.label.toLowerCase(),
    panties: outfit.panties, bra: outfit.bra, top: outfit.top, bottom: outfit.bottom, legwear: outfit.legwear,
    shoes: outfit.shoes, sig: style.signature, loc: '', form: formLabel(form).toLowerCase(),
  };
}

// ---------- challenges helpers ----------
const fitsForm = (t: TagChallenge, form: FormId) => !t.forms || t.forms.includes(form);
function tagMatch(t: TagChallenge, tags: string[]): boolean {
  if (t.tags.includes('*')) return tags.length > 0;
  return t.tags.some((x) => tags.includes(x));
}
function toChallenge(t: TagChallenge, id: string, v: Record<string, string>): Challenge {
  return { id: `${id}-${hash(t.text + t.link) % 10000}`, kind: t.kind, text: fill(t.text, v), link: fill(t.link, v) };
}

function hardW(t: TagChallenge, intensity: Intensity, style: StyleDef, tags: string[]): number {
  let w = t.hard ? (intensity === 'hard' ? 2.5 : 0.35) : 1;
  if (t.styles?.includes(style.id)) w *= 4;
  if (t.forms) w *= 1.5;
  if (t.outOnly && !tags.some(isOutTag)) w = 0;
  if (t.homeOnly && !tags.some(isHomeTag)) w = 0;
  return w;
}

/** Stable order for covering tags: work/out priority first, then the rest as selected. */
export function orderedTags(tags: string[]): string[] {
  const pri = LAYER_PRIORITY.filter((t) => tags.includes(t));
  const rest = tags.filter((t) => !pri.includes(t));
  return [...pri, ...rest];
}

/**
 * Build exactly up to 3 challenges.
 * When 3+ tags are selected, each challenge covers a DIFFERENT tag (one per tag).
 * Extra tags (4+) influence outfit layers + sex lean instead.
 */
export function buildChallenges(
  r: R, intensity: Intensity, date: string, form: FormId, style: StyleDef, tags: string[], v: Record<string, string>,
): Challenge[] {
  if (!tags.length) return [];
  const cover = orderedTags(tags).slice(0, MAX_CHALLENGES);
  const out: Challenge[] = [];
  const usedText = new Set<string>();

  const pickForTag = (tagId: string, idx: number): Challenge | null => {
    const specific = TAG_CHALLENGES.filter((c) =>
      challengeTags(c).includes(tagId) && fitsForm(c, form) && hardW(c, intensity, style, tags) > 0
      && (!c.styles || c.styles.includes(style.id)) && !usedText.has(c.text));
    // style-matched first
    const ranked = [
      ...specific.filter((c) => c.styles?.includes(style.id)),
      ...specific.filter((c) => !c.styles?.includes(style.id)),
    ];
    // fallback: any template that matches this tag OR (if none) a mild * filler not yet used
    let list = ranked;
    if (!list.length) {
      list = TAG_CHALLENGES.filter((c) =>
        c.tags.includes('*') && fitsForm(c, form) && hardW(c, intensity, style, tags) > 0 && !usedText.has(c.text));
    }
    if (!list.length) return null;
    const t = weighted(r, list, (c) => hardW(c, intensity, style, tags));
    usedText.add(t.text);
    const ch = toChallenge(t, `${date}-c${idx}`, v);
    ch.fromTag = tagId;
    return ch;
  };

  for (let idx = 0; idx < cover.length; idx++) {
    const ch = pickForTag(cover[idx], idx);
    if (ch) out.push(ch);
  }
  // If fewer than 3 tags, fill remaining slots from unused selected-tag pool (still prefer uncovered diversity)
  while (out.length < MAX_CHALLENGES) {
    const pool = TAG_CHALLENGES.filter((c) =>
      tagMatch(c, tags) && fitsForm(c, form) && hardW(c, intensity, style, tags) > 0
      && (!c.styles || c.styles.includes(style.id)) && !usedText.has(c.text));
    if (!pool.length) break;
    const t = weighted(r, pool, (c) => hardW(c, intensity, style, tags));
    usedText.add(t.text);
    const ch = toChallenge(t, `${date}-c${out.length}`, v);
    const hit = challengeTags(t).find((x) => tags.includes(x));
    ch.fromTag = hit ?? tags[out.length % tags.length];
    out.push(ch);
  }
  return out.slice(0, MAX_CHALLENGES);
}

const TAG_LOCS: Record<string, string[]> = {
  spil: ['at your gaming desk'],
  shower: ['the shower', 'the bathroom, by the mirror'],
  cook: ['the kitchen counter'],
  dinner: ['the kitchen counter'],
  kaelder: ['the living room floor', 'the hallway mirror'],
  tv: ['the couch with a blanket'],
  laundry: ['the bedroom, lights dimmed', 'in front of the full-length mirror'],
  vacuum: ['in front of the full-length mirror', 'the living room floor'],
  hus: ['the bedroom, lights dimmed', 'on the bed, tied to the frame'],
  workout: ['the bathroom, by the mirror', 'the shower'],
  handel: ['the bathroom, by the mirror'],
  errands: ['the bathroom, by the mirror'],
  tur: ['the hallway mirror'],
  bil: ['the bathroom, by the mirror'],
  trafik: ['the bathroom, by the mirror'],
  friends: ['the bedroom, lights dimmed'],
  arbejde: ['at your gaming desk', 'the bathroom, by the mirror'],
  skole: ['the bathroom, by the mirror'],
  fisk: ['the bathroom, by the mirror'],
};

function locsFor(tags: string[]): string[] {
  const out: string[] = [];
  for (const id of tags) for (const loc of TAG_LOCS[id] ?? []) if (!out.includes(loc)) out.push(loc);
  return out;
}

/**
 * Lean sex from ALL tags. `focus` (e.g. leftover 4th+ tags not used by a challenge)
 * gets first say on location so every selected tag still shapes the plan.
 */
export function leanSexFromTags(r: R, sex: SexPlan, tags: string[], focus: string[] = []): SexPlan {
  if (!tags.length) return sex;
  let { intensity, minutes, location, scene } = sex;
  const outN = tags.filter(isOutTag).length;
  const homeN = tags.filter(isHomeTag).length;
  const focusLocs = locsFor(focus);
  const allLocs = locsFor(tags);
  const locs = focusLocs.length ? focusLocs : allLocs;
  if (locs.length) location = pick(r, locs);

  const workish = outN + (tags.includes('kaelder') ? 1 : 0);
  if (workish >= 2) intensity = 'hard';
  else if (homeN >= 2 && outN === 0 && r() < 0.5) intensity = 'soft';
  // leftover leisure tags (gaming/tv/shower) nudge minutes without overriding work hardness
  if (focus.some((t) => t === 'spil' || t === 'tv')) minutes = Math.max(5, minutes - 5);
  if (focus.includes('shower')) minutes = Math.max(5, minutes);
  minutes = Math.max(5, Math.min(90, minutes + Math.min(20, workish * 5) - (homeN > workish ? 5 : 0)));

  scene = scene
    .replace(/Location: [^.]+\./g, `Location: ${location}, ${minutes} minutes, no excuses.`)
    .replace(/Set the scene: [^.]+\./g, `Set the scene: ${location}, ${minutes} minutes, no rushing.`)
    .replace(/Setting: [^.]+\./g, `Setting: ${location}. You have ${minutes} minutes of being mine.`)
    .replace(/Meet me in [^.]+\./g, `Meet me in ${location}. You have ${minutes} minutes of being mine.`)
    .replace(/Timer: \d+ minutes/g, `Timer: ${minutes} minutes`);

  return { ...sex, intensity, minutes, location, scene };
}

/** Tags not assigned a challenge slot (4th+), used to lean sex/outfit. */
export function leftoverTags(tags: string[]): string[] {
  const covered = new Set(orderedTags(tags).slice(0, MAX_CHALLENGES));
  return tags.filter((t) => !covered.has(t));
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

/** Rebuild challenges + layers + sex lean from tags. Keeps sex form and base outfit pieces. */
export function regenerateChallenges(plan: DayPlan, star: Star, tags: string[]): DayPlan {
  const style = STYLE_BY_ID[plan.styleId];
  const r = rng(`chal|${plan.date}|${star.id}|${plan.styleId}|${[...tags].sort().join(',')}`);
  const outfit = applyLayers(plan.outfit, star, style, tags);
  const sex = leanSexFromTags(r, plan.sex, tags, leftoverTags(tags));
  const v = outfitVars(style, outfit, sex.form, star);
  v.loc = sex.location;
  const challenges = buildChallenges(r, sex.intensity, plan.date, sex.form, style, tags, v);
  const spare = buildSpare(r, sex.form, style, tags, plan.date, v);
  return { ...plan, tags, outfit, sex, challenges, spare };
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
  const sex0 = buildSex(r, star, style, outfit, intensity, form);
  const sex = leanSexFromTags(rng(`sexlean|${date}|${star.id}|${[...tags].sort().join(',')}`), sex0, tags, leftoverTags(tags));
  const v = outfitVars(style, outfit, form, star);
  v.loc = sex.location;
  const challenges = buildChallenges(r, sex.intensity, date, form, style, tags, v);
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

