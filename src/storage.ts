import { DEFAULT_STARS } from './stars';
import type { AppData } from './types';

export const STORAGE_KEY = 'frida-v3';
/** Bump when built-in star names change; saved built-in stars then take the new names (on/off kept). */
export const ROSTER_VERSION = 2;

export function freshData(): AppData {
  return { version: 2, rosterVersion: ROSTER_VERSION, defaultCup: 'C', stars: DEFAULT_STARS.map((s) => ({ ...s })), days: {}, customTags: [] };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshData();
    const d = JSON.parse(raw) as AppData;
    if (d?.version !== 2 || !Array.isArray(d.stars) || typeof d.days !== 'object') return freshData();
    if (d.rosterVersion !== ROSTER_VERSION) {
      const names = new Map(DEFAULT_STARS.map((s) => [s.id, s.name]));
      d.stars = d.stars.map((s) => (!s.custom && names.has(s.id) ? { ...s, name: names.get(s.id)! } : s));
      d.rosterVersion = ROSTER_VERSION;
    }
    d.customTags ??= [];
    return d;
  } catch {
    return freshData();
  }
}

export function saveData(d: AppData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch { /* storage full or blocked */ }
}
