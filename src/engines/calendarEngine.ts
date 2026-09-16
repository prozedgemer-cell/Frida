import type { CalendarEntry, CalendarSignal, RoleId } from '../types';
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
  /** Roles inferred from written plans (title+note) */
  roleHints: RoleId[];
  /** Extra boost 0–1 from keyword density in notes */
  noteBoost: number;
  planBlurbDa: string;
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

/** Parse day's written plans → role hints + keyword boost */
export function parsePlanText(entries: CalendarEntry[]): {
  roleHints: RoleId[];
  noteBoost: number;
  planBlurbDa: string;
} {
  const blob = entries
    .map((e) => `${e.titleDa} ${e.noteDa} ${e.signal}`)
    .join(' \n ')
    .toLowerCase();
  const hints: RoleId[] = [];
  const push = (id: RoleId) => {
    if (!hints.includes(id)) hints.push(id);
  };

  if (/bdsm\s*hard|dominatrix|latex|læder|leather|harness|korset|domme\b|pvc/.test(blob)) {
    push('bdsm-hard');
  }
  if (/collar|choker|soft\s*bdsm|bdsm\s*lite|blød\s*bdsm/.test(blob)) {
    push('bdsm-soft');
  }
  if (/brazilian|peach|pencil|brazilian.?cut/.test(blob)) {
    push('brazilian-cut');
  }
  if (/g-?\s*string|gstring|string.?tease|skamløs|tager meget|g-string.?milf/.test(blob)) {
    push('g-string-milf');
  }
  if (/hentai|anime|cosplay|waifu|thigh.?high/.test(blob)) {
    push('hentai-anime');
  }
  if (/fantasy|elver|heks|magisk|korset.?look|ridderinde/.test(blob)) {
    push('fantasy-femme');
  }
  if (/office.?milf|kontor.?milf|kontor.?sexy|milf/.test(blob) && /work|arbejde|kontor|møde|office/.test(blob)) {
    push('office-milf');
  } else if (/work|arbejde|kontor|møde|office/.test(blob)) {
    push('office-milf');
  } else if (/\bmilf\b|voksen.?sexy|date.?milf/.test(blob)) {
    push('brazilian-cut');
  }
  if (/date|aftale|middag|biograf|romantik/.test(blob)) {
    push('brazilian-cut');
  }
  if (/rank|gaming|cs2|lol|fortnite|wardogs|diablo|session.?spil|ranked/.test(blob)) {
    push('soft-everyday-femme');
  }
  if (/hvile|rest|soft.?dag|belønning|cute|hverdags.?femme|blød/.test(blob)) {
    push('soft-everyday-femme');
  }
  if (/straf|ydmyg|punish|nederlag|fail/.test(blob)) {
    push('bdsm-hard');
  }

  // signal → role
  for (const e of entries) {
    if (e.signal === 'date') push('brazilian-cut');
    if (e.signal === 'gaming') push('soft-everyday-femme');
    if (e.signal === 'rest' || e.signal === 'soft' || e.signal === 'reward') push('soft-everyday-femme');
    if (e.signal === 'hard' || e.signal === 'straf') push('bdsm-hard');
    if (e.signal === 'clothing') push('brazilian-cut');
  }

  let boost = 0;
  const keys = [
    'outfit',
    'tøj',
    'undertøj',
    'nederdel',
    'hæle',
    'bh',
    'challenge',
    'udfordring',
    'domme',
    'milf',
    'date',
    'straf',
  ];
  for (const k of keys) {
    if (blob.includes(k)) boost += 0.05;
  }
  boost = Math.min(boost, 0.45);

  const planBlurbDa = hints.length
    ? `Plan→rolle: ${hints.join(', ')}`
    : entries.length
      ? 'Planer noteret — generel bias'
      : '';

  return { roleHints: hints, noteBoost: boost, planBlurbDa };
}

export function summarizeCalendar(
  entries: CalendarEntry[],
  dateKey: string,
): CalendarSummary {
  const day = entries
    .filter((e) => e.dateKey === dateKey)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const f = flagsFrom(day);
  const plan = parsePlanText(day);
  const labels = f.signals.map((s) => CALENDAR_SIGNAL_LABELS_DA[s]);
  const titles = day
    .map((e) => e.titleDa.trim())
    .filter(Boolean)
    .slice(0, 2);
  let headlineDa = 'Ingen kalender-noter i dag.';
  if (day.length) {
    const sig = labels.length ? `Signal: ${labels.join(', ')}` : 'Ingen signal-tag';
    const role = plan.planBlurbDa ? ` · ${plan.planBlurbDa}` : '';
    headlineDa = titles.length
      ? `${titles.join(' · ')} — ${sig}${role}`
      : `${day.length} note${day.length > 1 ? 'r' : ''} — ${sig}${role}`;
  }
  return { dateKey, entries: day, ...f, headlineDa, ...plan };
}

/**
 * Underwear / tøj timing bias from today's calendar signals + written plans.
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
      itemTags.includes('date') ||
      itemTags.includes('brazilian') ||
      itemTags.includes('milf')
        ? 1.55
        : 1.15;
  }
  if (cal.hasGaming) {
    m *= itemTags.includes('gaming') || itemTags.includes('komfort') ? 1.35 : 1;
  }

  // Written plan → role tag alignment (Frida Mode packs)
  for (const role of cal.roleHints ?? []) {
    if (role === 'brazilian-cut' && (itemTags.includes('brazilian') || itemTags.includes('milf')))
      m *= 1.7;
    if (role === 'g-string-milf' && (itemTags.includes('g-string') || itemTags.includes('string')))
      m *= 1.7;
    if (role === 'bdsm-hard' && (itemTags.includes('bdsm') || itemTags.includes('domme') || itemTags.includes('fetish')))
      m *= 1.75;
    if (role === 'bdsm-soft' && (itemTags.includes('bdsm') || itemTags.includes('collar') || itemTags.includes('choker')))
      m *= 1.55;
    if (role === 'office-milf' && (itemTags.includes('diskret') || itemTags.includes('work') || itemTags.includes('milf')))
      m *= 1.6;
    if (role === 'soft-everyday-femme' && (itemSoft || itemTags.includes('komfort') || itemTags.includes('cute')))
      m *= 1.55;
    if (role === 'hentai-anime' && (itemTags.includes('anime') || itemTags.includes('cute') || itemTags.includes('hentai')))
      m *= 1.7;
    if (role === 'fantasy-femme' && (itemTags.includes('fantasy') || itemTags.includes('luksus') || itemTags.includes('sexy')))
      m *= 1.55;
  }
  if (cal.noteBoost) m *= 1 + cal.noteBoost;
  return Math.max(m, 0.15);
}

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
  if (cal.hasClothing) w *= 1.15;
  if (cal.roleHints?.includes('bdsm-hard')) {
    w *= isStraf ? 1.4 : 1;
  }
  if (
    cal.roleHints?.includes('soft-everyday-femme') ||
    cal.roleHints?.includes('brazilian-cut') ||
    cal.roleHints?.includes('bdsm-soft')
  ) {
    w *= isReward ? 1.35 : isStraf ? 0.7 : 1.05;
  }
  if (cal.noteBoost) w *= 1 + cal.noteBoost * 0.8;
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
