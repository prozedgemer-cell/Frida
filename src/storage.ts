import { DEFAULT_STARS } from './stars';
import type { AppData } from './types';

export const STORAGE_KEY = 'frida-v3';

export function freshData(): AppData {
  return { version: 2, defaultCup: 'C', stars: DEFAULT_STARS.map((s) => ({ ...s })), days: {} };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshData();
    const d = JSON.parse(raw) as AppData;
    if (d?.version !== 2 || !Array.isArray(d.stars) || typeof d.days !== 'object') return freshData();
    return d;
  } catch {
    return freshData();
  }
}

export function saveData(d: AppData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch { /* storage full or blocked */ }
}
