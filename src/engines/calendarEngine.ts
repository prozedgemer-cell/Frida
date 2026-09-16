import { ROLE_PACKS } from '../data/rolePacks';
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

  // Match each pack's kalender[] keywords against the day's written plan
  const scored: { id: RoleId; hits: number }[] = [];
  for (const pack of ROLE_PACKS) {
    let hits = 0;
    for (const kw of pack.kalender) {
      const k = kw.toLowerCase();
      if (k.length < 2) continue;
      if (blob.includes(k)) hits += 1;
    }
    // Extra hard aliases for core Frida Mode packs
    if (pack.id === 'bdsm-hard' && /dominatrix|latex|læder|leather|harness|domme\b|pvc/.test(blob))
      hits += 2;
    if (pack.id === 'g-string-milf' && /g-?\s*string|gstring|skamløs/.test(blob)) hits += 2;
    if (pack.id === 'brazilian-cut' && /brazilian|peach/.test(blob)) hits += 2;
    if (pack.id === 'familie-sikker' && /familie|forældre|børn|slægt/.test(blob)) hits += 2;
    if (pack.id === 'traening-gym' && /gym|fitness|træning|yoga|crossfit/.test(blob)) hits += 2;
    if (pack.id === 'fest-aften' && /fest|party|klub|nytår/.test(blob)) hits += 2;
    if (pack.id === 'sex-scene' && /\bsex\b|intim|tease|scene/.test(blob)) hits += 2;
    if (pack.id === 'gaming-praktisk' && /ranked|scrim|lang gaming/.test(blob)) hits += 2;
    if (hits > 0) scored.push({ id: pack.id, hits });
  }
  scored.sort((a, b) => b.hits - a.hits);
  for (const s of scored.slice(0, 4)) push(s.id);

  // High-priority regex overrides (core aesthetic packs)
  if (/bdsm\s*hard|dominatrix|latex|læder|leather|harness|domme\b|pvc/.test(blob)) {
    push('bdsm-hard');
  }
  if (/strappy|mesh|sheer|club|klub|collar|choker|soft\s*bdsm|bdsm\s*lite|blød\s*bdsm/.test(blob)) {
    push('bdsm-soft');
  }
  if (/g-?\s*string|gstring|string.?tease|g-string.?milf/.test(blob)) {
    push('g-string-milf');
  }
  if (/hentai.?overdrive|ecchi|hentai.?inspireret/.test(blob)) {
    push('hentai-inspireret');
  } else if (/hentai|anime.?aften|cosplay|thigh.?high/.test(blob)) {
    push('hentai-anime');
  }
  if (/anime.?soft|waifu|manga|cute.?day|con.?casual/.test(blob)) {
    push('anime-soft');
  }
  if (/fantasy.?look|larp|succubus|elf\b|rpg.?aften/.test(blob)) {
    push('fantasy-look');
  } else if (/fantasy|elver|heks|magisk|ridderinde/.test(blob)) {
    push('fantasy-femme');
  }
  if (/work|arbejde|kontor|møde|office/.test(blob)) {
    push('office-milf');
  }
  if (/\bmilf\b|brazilian|peach|date.?milf/.test(blob) && !/kontor|office|work/.test(blob)) {
    push('brazilian-cut');
  }
  if (/straf|ydmyg|punish/.test(blob)) {
    push('bdsm-hard');
  }

  // signal → role
  for (const e of entries) {
    if (e.signal === 'date') push('brazilian-cut');
    if (e.signal === 'gaming') push('gaming-praktisk');
    if (e.signal === 'rest' || e.signal === 'soft' || e.signal === 'reward') {
      push('soft-everyday-femme');
      push('hjemme-lounge');
    }
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

  // Written plan → role tag alignment (Frida Mode + situation packs)
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
    if ((role === 'hentai-anime' || role === 'hentai-inspireret') && (itemTags.includes('anime') || itemTags.includes('cute') || itemTags.includes('hentai')))
      m *= 1.7;
    if ((role === 'fantasy-femme' || role === 'fantasy-look') && (itemTags.includes('fantasy') || itemTags.includes('luksus') || itemTags.includes('sexy')))
      m *= 1.55;
    if (role === 'familie-sikker' && (itemTags.includes('diskret') || itemTags.includes('usynlig')))
      m *= 1.8;
    if (role === 'traening-gym' && (itemTags.includes('sport') || itemTags.includes('gaming') || itemTags.includes('praktisk')))
      m *= 1.65;
    if (role === 'fest-aften' && (itemTags.includes('sexy') || itemTags.includes('aften') || itemTags.includes('sæt')))
      m *= 1.65;
    if (role === 'sex-scene' && (itemTags.includes('sexy') || itemTags.includes('tease') || itemTags.includes('sæt')))
      m *= 1.7;
    if (role === 'gaming-praktisk' && (itemTags.includes('gaming') || itemTags.includes('komfort') || itemTags.includes('praktisk')))
      m *= 1.7;
    if (role === 'anime-soft' && (itemTags.includes('anime') || itemTags.includes('cute') || itemTags.includes('soft')))
      m *= 1.6;
    if (role === 'hjemme-lounge' && (itemTags.includes('hjemme') || itemTags.includes('komfort') || itemTags.includes('soft')))
      m *= 1.55;
    if ((role === 'bytur-gaatur' || role === 'handel-shopping') && (itemTags.includes('hverdag') || itemTags.includes('brazilian') || itemTags.includes('diskret')))
      m *= 1.5;
    if (role === 'bil-trafik' && (itemTags.includes('diskret') || itemTags.includes('praktisk') || itemTags.includes('komfort')))
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
    cal.roleHints?.includes('bdsm-soft') ||
    cal.roleHints?.includes('hjemme-lounge') ||
    cal.roleHints?.includes('anime-soft')
  ) {
    w *= isReward ? 1.35 : isStraf ? 0.7 : 1.05;
  }
  if (cal.roleHints?.includes('familie-sikker')) {
    w *= isStraf ? 0.35 : 0.85;
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
