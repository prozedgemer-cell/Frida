import type { CalendarEntry, CalendarSignal } from '../types';
import { CALENDAR_SIGNAL_LABELS_DA } from '../types';

/** Local YYYY-MM-DD (Copenhagen box clock / device local). */
export function localDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDaysKey(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m ?? 1) - 1, (d ?? 1) + delta);
  return localDateKey(dt);
}

export function monthGrid(year: number, monthIndex: number): (string | null)[] {
  const first = new Date(year, monthIndex, 1);
  const startPad = (first.getDay() + 6) % 7; // Monday-first
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= days; d++) {
    cells.push(localDateKey(new Date(year, monthIndex, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export interface CalendarSummary {
  dateKey: string;
  entries: CalendarEntry[];
  hasStraf: boolean;
  hasReward: boolean;
  hasSoft: boolean;
  hasHard: boolean;
  hasClothing: boolean;
  hasGaming: boolean;
  hasRest: boolean;
  hasDate: boolean;
  signals: CalendarSignal[];
  headlineDa: string;
}

function flagsFrom(entries: CalendarEntry[]) {
  const set = new Set(entries.map((e) => e.signal).filter((s) => s !== 'none'));
  return {
    hasStraf: set.has('straf'),
    hasReward: set.has('reward'),
    hasSoft: set.has('soft'),
    hasHard: set.has('hard'),
    hasClothing: set.has('clothing'),
    hasGaming: set.has('gaming'),
    hasRest: set.has('rest'),
    hasDate: set.has('date'),
    signals: [...set],
  };
}

export function summarizeCalendar(
  entries: CalendarEntry[],
  dateKey: string,
): CalendarSummary {
  const day = entries
    .filter((e) => e.dateKey === dateKey)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const f = flagsFrom(day);
  const labels = f.signals.map((s) => CALENDAR_SIGNAL_LABELS_DA[s]);
  const titles = day
    .map((e) => e.titleDa.trim())
    .filter(Boolean)
    .slice(0, 2);
  let headlineDa = 'Ingen kalender-noter i dag.';
  if (day.length) {
    const sig = labels.length ? `Signal: ${labels.join(', ')}` : 'Ingen signal-tag';
    headlineDa = titles.length
      ? `${titles.join(' · ')} — ${sig}`
      : `${day.length} note${day.length > 1 ? 'r' : ''} — ${sig}`;
  }
  return { dateKey, entries: day, ...f, headlineDa };
}

/**
 * Underwear / tøj timing bias from today's calendar signals.
 * rest → comfort; hard/straf → stricter; clothing/date → nicer sets.
 */
export function calendarUnderwearMultiplier(
  itemTags: string[],
  itemHard: boolean,
  itemSoft: boolean,
  cal?: CalendarSummary | null,
): number {
  if (!cal || !cal.entries.length) return 1;
  let m = 1;
  if (cal.hasRest) {
    m *= itemTags.includes('komfort') || itemTags.includes('hverdag') || itemSoft ? 1.55 : 0.7;
    if (itemHard) m *= 0.55;
  }
  if (cal.hasHard || cal.hasStraf) {
    m *= itemHard || itemTags.includes('hard') || itemTags.includes('ydmyg') ? 1.6 : 0.85;
  }
  if (cal.hasSoft || cal.hasReward) {
    m *= itemSoft || itemTags.includes('luksus') || itemTags.includes('belønning') ? 1.45 : 0.9;
  }
  if (cal.hasClothing || cal.hasDate) {
    m *=
      itemTags.includes('lingerine') ||
      itemTags.includes('luksus') ||
      itemTags.includes('sæt') ||
      itemTags.includes('date')
        ? 1.5
        : 1.15;
  }
  if (cal.hasGaming) {
    m *= itemTags.includes('gaming') || itemTags.includes('komfort') ? 1.35 : 1;
  }
  return Math.max(m, 0.15);
}

/**
 * Challenge weight from calendar. rest lowers volume-feel via smaller weights;
 * straf/hard boosts punishment templates.
 */
export function calendarChallengeMultiplier(
  isStraf: boolean,
  isReward: boolean,
  cal?: CalendarSummary | null,
): number {
  if (!cal || !cal.entries.length) return 1;
  let w = 1;
  if (cal.hasRest) w *= isStraf ? 0.45 : 0.75;
  if (cal.hasStraf || cal.hasHard) w *= isStraf ? 2.4 : isReward ? 0.5 : 1;
  if (cal.hasReward || cal.hasSoft) w *= isReward ? 2.1 : isStraf ? 0.55 : 1.05;
  if (cal.hasGaming) w *= 1.1;
  return Math.max(w, 0.08);
}

export function formatDateKeyDa(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString('da-DK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
