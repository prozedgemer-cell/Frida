/**
 * Game presets for structured performance logging.
 *
 * Wardogs assumption: interpreted as WARDOGS (BULKHEAD / Team17, Early Access
 * Sep 2026) — tactical all-out warfare FPS (100 players / 3 teams / Control Zone).
 * Not Watch Dogs, not Warzone. Documented in README + UI.
 *
 * Tracker / API notes (client-side PWA, no secrets):
 * - CS2: Leetify, FACEIT, CSMeta — APIs need keys/credits; manual + paste.
 * - WARDOGS: wardogs.zone / wardogs.tools community boards — no free public player API.
 * - LoL: Riot API (dev key) / OP.GG (paid credits) — manual + paste.
 * - Diablo IV: helltides.com Pit boards (crowdsourced) — no free personal API; manual.
 * - Fortnite: Tracker Network needs TRN-Api-Key — manual + paste.
 */

export type GamePresetId = 'cs2' | 'wardogs' | 'lol' | 'diablo4' | 'fortnite' | 'custom';

export type MetricFieldType = 'number' | 'select' | 'text';

export interface MetricFieldDef {
  key: string;
  labelDa: string;
  type: MetricFieldType;
  /** Placeholder or unit hint */
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; labelDa: string }[];
  /** Optional — used when deriving a display note */
  optional?: boolean;
}

export interface GamePreset {
  id: GamePresetId;
  nameDa: string;
  nameEn: string;
  shortDa: string;
  trackerHintDa: string;
  fetchNoteDa: string;
  helpDa: string;
  fields: MetricFieldDef[];
  ranks?: { value: string; labelDa: string }[];
}

const CS2_RANKS = [
  { value: '', labelDa: '— (valgfri)' },
  { value: 'premier-gray', labelDa: 'Premier · Grå (<5k)' },
  { value: 'premier-lightblue', labelDa: 'Premier · Lyseblå (5–10k)' },
  { value: 'premier-blue', labelDa: 'Premier · Blå (10–15k)' },
  { value: 'premier-purple', labelDa: 'Premier · Lilla (15–20k)' },
  { value: 'premier-pink', labelDa: 'Premier · Pink (20–25k)' },
  { value: 'premier-red', labelDa: 'Premier · Rød (25–30k)' },
  { value: 'premier-gold', labelDa: 'Premier · Guld (30k+)' },
  { value: 'faceit-1-4', labelDa: 'FACEIT 1–4' },
  { value: 'faceit-5-7', labelDa: 'FACEIT 5–7' },
  { value: 'faceit-8-10', labelDa: 'FACEIT 8–10' },
  { value: 'global', labelDa: 'Global / GE' },
];

const LOL_RANKS = [
  { value: '', labelDa: '— (valgfri)' },
  { value: 'iron', labelDa: 'Iron' },
  { value: 'bronze', labelDa: 'Bronze' },
  { value: 'silver', labelDa: 'Silver' },
  { value: 'gold', labelDa: 'Gold' },
  { value: 'platinum', labelDa: 'Platinum' },
  { value: 'emerald', labelDa: 'Emerald' },
  { value: 'diamond', labelDa: 'Diamond' },
  { value: 'master', labelDa: 'Master' },
  { value: 'grandmaster', labelDa: 'Grandmaster' },
  { value: 'challenger', labelDa: 'Challenger' },
];

const D4_WORLD_TIERS = [
  { value: '', labelDa: '— (valgfri)' },
  { value: '1', labelDa: 'World Tier 1' },
  { value: '2', labelDa: 'World Tier 2' },
  { value: '3', labelDa: 'World Tier 3' },
  { value: '4', labelDa: 'World Tier 4 (Torment)' },
];

const FN_MODES = [
  { value: 'solo', labelDa: 'Solo' },
  { value: 'duo', labelDa: 'Duo' },
  { value: 'trio', labelDa: 'Trio' },
  { value: 'squad', labelDa: 'Squad' },
  { value: 'ranked', labelDa: 'Ranked' },
  { value: 'reload', labelDa: 'Reload / andet' },
];

const FN_RANKS = [
  { value: '', labelDa: '— (valgfri)' },
  { value: 'bronze', labelDa: 'Bronze' },
  { value: 'silver', labelDa: 'Silver' },
  { value: 'gold', labelDa: 'Gold' },
  { value: 'platinum', labelDa: 'Platinum' },
  { value: 'diamond', labelDa: 'Diamond' },
  { value: 'elite', labelDa: 'Elite' },
  { value: 'champion', labelDa: 'Champion' },
  { value: 'unreal', labelDa: 'Unreal' },
];

export const GAME_PRESETS: GamePreset[] = [
  {
    id: 'cs2',
    nameDa: 'CS2 (Counter-Strike 2)',
    nameEn: 'Counter-Strike 2',
    shortDa: 'CS2',
    trackerHintDa: 'Leetify, FACEIT, CSMeta, Tracker.gg/cs2',
    fetchNoteDa:
      'Ingen gratis no-key API i PWA. Indtast fra scoreboard / Leetify, eller paste tracker-tekst.',
    helpDa:
      'Score 0–100: K/D 30% · ADR 28% · HS% 12% · resultat 30%. K/D 2,0 ≈ 100; ADR 40→0 / 120→100; HS 60% ≈ 100.',
    ranks: CS2_RANKS,
    fields: [
      { key: 'kills', labelDa: 'Kills', type: 'number', min: 0, max: 80, hint: 'fx 18' },
      { key: 'deaths', labelDa: 'Deaths', type: 'number', min: 0, max: 80, hint: 'fx 12' },
      { key: 'adr', labelDa: 'ADR', type: 'number', min: 0, max: 200, hint: 'damage/runde' },
      {
        key: 'hsPercent',
        labelDa: 'HS %',
        type: 'number',
        min: 0,
        max: 100,
        hint: 'headshot %',
      },
      {
        key: 'assists',
        labelDa: 'Assists',
        type: 'number',
        min: 0,
        max: 40,
        optional: true,
        hint: 'valgfri',
      },
      {
        key: 'rank',
        labelDa: 'Rank / Premier',
        type: 'select',
        options: CS2_RANKS,
        optional: true,
      },
    ],
  },
  {
    id: 'wardogs',
    nameDa: 'WARDOGS',
    nameEn: 'WARDOGS',
    shortDa: 'WARDOGS',
    trackerHintDa: 'wardogs.zone leaderboard, wardogs.tools (community)',
    fetchNoteDa:
      'Antaget: WARDOGS (2026 FPS), ikke Watch Dogs / Warzone. Ingen officiel gratis player-API — manuel indtastning.',
    helpDa:
      'Score 0–100: K/D 25% · cash 25% · resultat 30% · zone-bidrag 20%. Cash: 0→0, 50k→40, 200k→70, 500k+→100.',
    fields: [
      { key: 'kills', labelDa: 'Kills', type: 'number', min: 0, max: 500, hint: 'scoreboard' },
      { key: 'deaths', labelDa: 'Deaths', type: 'number', min: 0, max: 500, hint: 'scoreboard' },
      {
        key: 'cash',
        labelDa: 'Cash tjent',
        type: 'number',
        min: 0,
        max: 5_000_000,
        hint: 'match payout (ikke spend)',
      },
      {
        key: 'zoneScore',
        labelDa: 'Zone-bidrag (0–100)',
        type: 'number',
        min: 0,
        max: 100,
        hint: 'selvvurderet tid i Control/Hot Zone',
      },
      {
        key: 'revives',
        labelDa: 'Revives / assists',
        type: 'number',
        min: 0,
        max: 100,
        optional: true,
      },
    ],
  },
  {
    id: 'lol',
    nameDa: 'League of Legends',
    nameEn: 'League of Legends',
    shortDa: 'LoL',
    trackerHintDa: 'OP.GG, u.gg, Tracker.gg/lol',
    fetchNoteDa:
      'Riot / OP.GG kræver API-nøgle eller credits. Indtast post-match eller paste OP.GG-lignende tekst.',
    helpDa:
      'Score 0–100: KDA 30% · CS/min 20% · vision 10% · damage-andel 10% · resultat 30%. KDA 5,0 ≈ 100; CS/min 4→0 / 10→100.',
    ranks: LOL_RANKS,
    fields: [
      { key: 'kills', labelDa: 'Kills', type: 'number', min: 0, max: 40 },
      { key: 'deaths', labelDa: 'Deaths', type: 'number', min: 0, max: 40 },
      { key: 'assists', labelDa: 'Assists', type: 'number', min: 0, max: 50 },
      {
        key: 'csPerMin',
        labelDa: 'CS / min',
        type: 'number',
        min: 0,
        max: 15,
        step: 0.1,
        hint: 'fx 7.2',
      },
      {
        key: 'visionScore',
        labelDa: 'Vision score',
        type: 'number',
        min: 0,
        max: 200,
        hint: 'post-game',
      },
      {
        key: 'damageShare',
        labelDa: 'Dmg share %',
        type: 'number',
        min: 0,
        max: 100,
        optional: true,
        hint: 'valgfri',
      },
      {
        key: 'rank',
        labelDa: 'Rank',
        type: 'select',
        options: LOL_RANKS,
        optional: true,
      },
    ],
  },
  {
    id: 'diablo4',
    nameDa: 'Diablo IV',
    nameEn: 'Diablo IV',
    shortDa: 'D4',
    trackerHintDa: 'helltides.com Pit, Maxroll / d4builds (guides)',
    fetchNoteDa:
      'Antaget Diablo IV (sæson / Pit). Ingen gratis personlig stats-API — manuel Pit/journey-data.',
    helpDa:
      'Score 0–100: Pit-tier 40% · cleartid 20% · deaths 15% · sæsonrejse 15% · resultat 10%. Pit 150 ≈ 100; færre deaths = højere.',
    fields: [
      {
        key: 'pitTier',
        labelDa: 'Pit tier',
        type: 'number',
        min: 1,
        max: 200,
        hint: 'højeste clearet / denne run',
      },
      {
        key: 'clearMin',
        labelDa: 'Cleartid (min)',
        type: 'number',
        min: 0,
        max: 60,
        step: 0.1,
        hint: 'fx 3.5',
      },
      {
        key: 'deaths',
        labelDa: 'Deaths i run',
        type: 'number',
        min: 0,
        max: 50,
      },
      {
        key: 'worldTier',
        labelDa: 'World Tier',
        type: 'select',
        options: D4_WORLD_TIERS,
        optional: true,
      },
      {
        key: 'seasonJourney',
        labelDa: 'Sæsonrejse %',
        type: 'number',
        min: 0,
        max: 100,
        optional: true,
        hint: 'valgfri progress',
      },
      {
        key: 'buildNote',
        labelDa: 'Build / klasse',
        type: 'text',
        optional: true,
        hint: 'fx Poison Swarm Spiritborn',
      },
    ],
  },
  {
    id: 'fortnite',
    nameDa: 'Fortnite',
    nameEn: 'Fortnite',
    shortDa: 'Fortnite',
    trackerHintDa: 'Fortnite Tracker / Tracker.gg',
    fetchNoteDa:
      'Tracker Network kræver TRN-Api-Key (ikke bundtet her). Indtast placement/kills eller paste summary.',
    helpDa:
      'Score 0–100: placement 40% · kills 25% · K/D 15% · resultat 20%. #1 = 100 placement; Top 3 ≈ 85; Top 10 ≈ 65.',
    ranks: FN_RANKS,
    fields: [
      {
        key: 'placement',
        labelDa: 'Placement',
        type: 'number',
        min: 1,
        max: 100,
        hint: '1 = sejr',
      },
      { key: 'kills', labelDa: 'Kills', type: 'number', min: 0, max: 40 },
      { key: 'deaths', labelDa: 'Deaths', type: 'number', min: 0, max: 20, optional: true },
      {
        key: 'mode',
        labelDa: 'Mode',
        type: 'select',
        options: FN_MODES,
      },
      {
        key: 'rank',
        labelDa: 'Ranked tier',
        type: 'select',
        options: FN_RANKS,
        optional: true,
      },
    ],
  },
  {
    id: 'custom',
    nameDa: 'Andet spil',
    nameEn: 'Custom',
    shortDa: 'Andet',
    trackerHintDa: '—',
    fetchNoteDa: 'Fri indtastning — brug selvvurdering + note.',
    helpDa:
      'Score fra selvvurdering + resultat (klassisk Frida-formel), uden spil-specifikke KPI-vægte.',
    fields: [],
  },
];

export function getPreset(id: string | undefined | null): GamePreset {
  return GAME_PRESETS.find((p) => p.id === id) ?? GAME_PRESETS[GAME_PRESETS.length - 1]!;
}

export function matchPresetFromGameName(name: string): GamePresetId {
  const n = name.trim().toLowerCase();
  if (!n) return 'custom';
  if (/\bcs\s*2\b|counter[\s-]?strike|csgo|cs:go/.test(n)) return 'cs2';
  if (/wardogs|war\s*dogs|wardog/.test(n)) return 'wardogs';
  if (/\blol\b|league\s*of\s*legends|wild\s*rift/.test(n)) return 'lol';
  if (/diablo\s*i?v?\b|diablo\s*4|d4\b/.test(n)) return 'diablo4';
  if (/fortnite|fn\b|battle\s*royale/.test(n)) return 'fortnite';
  return 'custom';
}

export function presetDisplayName(id: GamePresetId): string {
  return getPreset(id).shortDa;
}
