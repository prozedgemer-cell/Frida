import type { DayFlavor, DayMode, KnownFor, TimeLean, WeatherLean } from './types';

export type { DayFlavor, DayMode, TimeLean, WeatherLean };

export interface ThemeWeek {
  id: string;
  label: string;
  blurb: string;
  vibes: string[];
  styleBias: KnownFor[];
}

function hash(str: string): number {
  let h = 2166136261;
  for (let k = 0; k < str.length; k++) { h ^= str.charCodeAt(k); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rotating theme weeks (ISO week). */
export const THEME_WEEKS: ThemeWeek[] = [
  { id: 'silk', label: 'Silk & soft', blurb: 'Soft fabrics, gentle tease, pretty lingerie under everything.', vibes: ['lingerie-under', 'sexy', 'casual'], styleBias: ['sweet-tease', 'pinup', 'sugar-mommy'] },
  { id: 'latex', label: 'Latex week', blurb: 'Shiny second skin energy — gloves, gloss, strict rules.', vibes: ['latex', 'sexy'], styleBias: ['latex-domme', 'strapon-queen', 'police'] },
  { id: 'office', label: 'Power week', blurb: 'Blouses, heels, performance reviews with bite.', vibes: ['office', 'sexy', 'milf'], styleBias: ['office-boss', 'librarian', 'milf'] },
  { id: 'maid', label: 'Service week', blurb: 'Aprons, chores done right, inspection after.', vibes: ['casual', 'sexy'], styleBias: ['maid', 'nurse'] },
  { id: 'goth', label: 'Night shade', blurb: 'Black lace, candlelight, a little cruelty.', vibes: ['goth', 'sexy'], styleBias: ['goth', 'vampire', 'witch'] },
  { id: 'sport', label: 'Body week', blurb: 'Activewear, sweat, stretch, then she claims you.', vibes: ['sporty-soft', 'sexy'], styleBias: ['gym', 'cowgirl'] },
  { id: 'anime', label: 'Cosplay week', blurb: 'Cute excess, bows, thigh-highs, shameless posing.', vibes: ['school-adult', 'sexy'], styleBias: ['anime', 'hentai', 'catgirl', 'gamer-girl'] },
  { id: 'fantasy', label: 'Fantasy week', blurb: 'Queens, elves, sirens — dress like a story.', vibes: ['fantasy', 'sexy'], styleBias: ['fantasy-queen', 'elf', 'siren', 'viking'] },
  { id: 'bimbo', label: 'Pretty-dumb week', blurb: 'Pink, tight, glossy — brains optional, obedience not.', vibes: ['sexy', 'casual'], styleBias: ['bimbo', 'pinup'] },
  { id: 'cyber', label: 'Neon week', blurb: 'Techwear, LED, harness lines under jackets.', vibes: ['cyber', 'sexy'], styleBias: ['cyberpunk'] },
  { id: 'retro', label: 'Pin-up week', blurb: 'Seams, swing skirts, calendar-girl posture.', vibes: ['date', 'sexy'], styleBias: ['pinup', 'ballet'] },
  { id: 'mixed', label: 'Wildcard week', blurb: 'No single costume — mix her moods freely.', vibes: ['casual', 'sexy', 'date'], styleBias: ['sweet-tease', 'milf', 'punk'] },
];

export function isoWeek(date: string): number {
  const d = new Date(date + 'T12:00:00');
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + 3);
  const first = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - first.getTime()) / 86400000 - 3 + ((first.getDay() + 6) % 7)) / 7);
}

export function themeForDate(date: string): ThemeWeek {
  const w = isoWeek(date);
  return THEME_WEEKS[((w % THEME_WEEKS.length) + THEME_WEEKS.length) % THEME_WEEKS.length];
}

export function isWeekend(date: string): boolean {
  const day = new Date(date + 'T12:00:00').getDay();
  return day === 0 || day === 6;
}

/** ~38% of weekend days become boss days (deterministic). */
export function isBossDay(date: string): boolean {
  if (!isWeekend(date)) return false;
  return rng(`boss|${date}`)() < 0.38;
}

/** ~14% of non-boss days are quiet (deterministic). */
export function isQuietDay(date: string): boolean {
  if (isBossDay(date)) return false;
  return rng(`quiet|${date}`)() < 0.14;
}

/** Copenhagen-ish seasonal weather lean with daily jitter. */
export function weatherFor(date: string): { weather: WeatherLean; note: string } {
  const month = Number(date.slice(5, 7));
  const r = rng(`wx|${date}`)();
  let weather: WeatherLean;
  if (month <= 2 || month === 12) weather = r < 0.55 ? 'cold' : r < 0.85 ? 'rain' : 'mild';
  else if (month <= 4) weather = r < 0.4 ? 'rain' : r < 0.75 ? 'mild' : 'cold';
  else if (month <= 8) weather = r < 0.55 ? 'warm' : r < 0.8 ? 'mild' : 'rain';
  else if (month <= 10) weather = r < 0.35 ? 'rain' : r < 0.7 ? 'mild' : 'cold';
  else weather = r < 0.45 ? 'cold' : r < 0.8 ? 'rain' : 'mild';
  const notes: Record<WeatherLean, string[]> = {
    cold: ['Copenhagen cold — coat-friendly layers', 'Chilly air; keep legs covered', 'Frost bite in the wind'],
    mild: ['Mild day — breathable cover', 'Soft grey sky, light jacket weather', 'Neutral temp; style wins'],
    warm: ['Warm stretch — lighter fabrics', 'Sun-leaning; skip heavy coats', 'Mild heat; show a little more'],
    rain: ['Rain likely — boots and waterproof cover', 'Wet streets; practical shoes', 'Damp air; jacket over the look'],
  };
  return { weather, note: notes[weather][Math.floor(r * notes[weather].length) % notes[weather].length] };
}

export function timeLeanAt(now: Date = new Date()): { timeLean: TimeLean; note: string } {
  const h = now.getHours();
  if (h < 11) return { timeLean: 'morning', note: 'Morning lean — easy on/off, softer makeup' };
  if (h < 18) return { timeLean: 'day', note: 'Day lean — practical polish for errands & work' };
  return { timeLean: 'evening', note: 'Evening lean — dressier shoes & tease-ready extras' };
}

export function buildFlavor(date: string, now: Date = new Date()): DayFlavor {
  const boss = isBossDay(date);
  const quiet = !boss && isQuietDay(date);
  const { weather, note: weatherNote } = weatherFor(date);
  const { timeLean, note: timeNote } = timeLeanAt(now);
  const theme = themeForDate(date);
  return {
    mode: boss ? 'boss' : quiet ? 'quiet' : 'normal',
    weather, weatherNote, timeLean, timeNote,
    themeId: theme.id, themeLabel: theme.label, themeBlurb: theme.blurb,
  };
}

/** Extra vibe tags from theme + weather + time (does not force layers). */
export function flavorVibes(flavor: DayFlavor): string[] {
  const theme = THEME_WEEKS.find((t) => t.id === flavor.themeId) ?? THEME_WEEKS[0];
  const out = [...theme.vibes];
  if (flavor.weather === 'cold') out.push('casual');
  if (flavor.weather === 'warm') out.push('date', 'sexy');
  if (flavor.weather === 'rain') out.push('errands');
  if (flavor.timeLean === 'evening') out.push('date', 'sexy');
  if (flavor.mode === 'boss') out.push('sexy');
  if (flavor.mode === 'quiet') out.push('casual', 'lingerie-under');
  return out;
}

/** Bake weather/time accents into outfit extras / shoes / legwear. Keeps base look. */
export function applyWeatherTimeLean<T extends {
  extras: string[]; shoes: string; legwear: string; top: string;
}>(pieces: T, flavor: DayFlavor): T {
  const extras = [...pieces.extras];
  let { shoes, legwear, top } = pieces;
  if (flavor.weather === 'cold') {
    if (!extras.some((e) => /coat|cardigan|jacket/i.test(e))) extras.push('warm coat or long cardigan over look');
    if (/bare legs/i.test(legwear)) legwear = 'opaque black tights';
  } else if (flavor.weather === 'rain') {
    if (!extras.some((e) => /rain|water/i.test(e))) extras.push('light rain jacket when outside');
    if (!/boot/i.test(shoes)) shoes = 'waterproof ankle boots';
  } else if (flavor.weather === 'warm') {
    if (!extras.some((e) => /sheer|light/i.test(e))) extras.push('lighter fabric bias for the warm spell');
  }
  if (flavor.timeLean === 'evening' && !extras.some((e) => /evening|lipstick|heel/i.test(e))) {
    extras.push('evening-ready lipstick & posture');
    if (/sneaker|flat/i.test(shoes) && flavor.mode !== 'quiet') shoes = 'dressier heels or polished boots';
  }
  if (flavor.timeLean === 'morning' && !extras.some((e) => /morning|soft makeup/i.test(e))) {
    extras.push('soft morning makeup');
  }
  if (flavor.mode === 'boss' && !extras.some((e) => /boss/i.test(e))) {
    extras.push('boss-day accent: gloves or statement jewelry');
  }
  if (flavor.mode === 'quiet' && !extras.some((e) => /quiet|soft lounge/i.test(e))) {
    extras.push('quiet-day soft lounge bias');
    top = top.includes('soft') ? top : `soft ${top}`;
  }
  extras.push(`wx: ${flavor.weather}`, `theme: ${flavor.themeLabel}`);
  return { ...pieces, extras: [...new Set(extras)].slice(0, 8), shoes, legwear, top };
}
