import { FORMS } from './data/content';
import { DEFAULT_STARS } from './data/stars';
import type { AppData, FormId, Star } from './types';

export const STORAGE_KEY = 'frida-v2';
const VALID = new Set<string>(FORMS.map((f) => f.id));

export function freshData(): AppData {
  return { version: 3, defaultCup: 'C', stars: DEFAULT_STARS.map((s) => ({ ...s })), days: {} };
}

/** Drops removed sex forms. Coming from v2, built-in stars get the new forms/likes/personality (names & on/off kept). */
function migrateStar(s: Star, fromV2: boolean): Star {
  const def = DEFAULT_STARS.find((d) => d.id === s.id);
  let fav = (s.favForms as string[]).filter((f) => VALID.has(f)) as FormId[];
  if (fav.length === 0) fav = ['striptease'];
  if (fromV2 && def && !s.custom) return { ...s, favForms: def.favForms, likes: def.likes, personality: def.personality };
  return { ...s, favForms: fav };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshData();
    const d = JSON.parse(raw) as { version: number } & Omit<AppData, 'version'>;
    if (!d || !Array.isArray(d.stars) || (d.version !== 2 && d.version !== 3)) return freshData();
    const out: AppData = { ...d, version: 3, stars: d.stars.map((s) => migrateStar(s, d.version === 2)) };
    // v2 -> v3: drop old days (old content removed); today regenerates
    if (d.version === 2) out.days = {};
    const have = new Set(out.stars.map((s) => s.id));
    for (const s of DEFAULT_STARS) if (!have.has(s.id)) out.stars.push({ ...s });
    out.days ??= {};
    out.defaultCup ??= 'C';
    return out;
  } catch {
    return freshData();
  }
}

export function saveData(d: AppData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch { /* storage full or blocked */ }
}
