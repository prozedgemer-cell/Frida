import type { GamePresetId } from '../data/gameProfiles';
import { resolveRoleId, getRolePack } from '../data/rolePacks';
import type {
  AppState,
  CalendarEntry,
  CalendarSignal,
  GameSessionLog,
  Profile,
  SexStrafHardness,
  SexStrafInstance,
  SexStrafStatus,
} from '../types';
import { ALL_THEMES, DEFAULT_HARD_LIMITS } from '../types';

const KEY = 'frida-kontrolpanel-v1';
const UI_TAB_KEY = 'frida-ui-tab-v1';

const VALID_TABS = ['hoved', 'gaming', 'ingame', 'hverdag', 'udfordringer', 'sex', 'kalender', 'profil'] as const;
export type StoredUiTab = (typeof VALID_TABS)[number];

const VALID_GAME_IDS: GamePresetId[] = [
  'cs2',
  'wardogs',
  'lol',
  'diablo4',
  'fortnite',
  'custom',
];

export function defaultProfile(): Profile {
  return {
    name: 'Frida',
    breastSize: 'D',
    intensity: 'soft',
    dayMode: 'soft',
    enabledThemes: [...ALL_THEMES],
    hardLimits: [...DEFAULT_HARD_LIMITS],
    ageVerified: false,
  };
}

export function defaultState(): AppState {
  return {
    profile: defaultProfile(),
    context: {
      irlStatus: 'home',
      playingGame: '',
      notes: '',
      activeGameId: undefined,
    },
    emergencyStop: false,
    underwearToday: null,
    activeChallenges: [],
    challengeLog: [],
    gameSessions: [],
    pointsBalance: 0,
    activeInGameChallenge: null,
    activeSexStraf: null,
    sexStrafLog: [],
    lastSexStrafAt: null,
    calendarEntries: [],
    morningTrio: null,
  };
}

function migrateSession(row: Record<string, unknown>, fallbackGame: string): GameSessionLog {
  const gameIdRaw = String(row.gameId ?? '');
  const gameId = (VALID_GAME_IDS as string[]).includes(gameIdRaw)
    ? (gameIdRaw as GamePresetId)
    : undefined;

  let metrics: Record<string, number | string> | undefined;
  if (row.metrics && typeof row.metrics === 'object' && !Array.isArray(row.metrics)) {
    metrics = {};
    for (const [k, v] of Object.entries(row.metrics as Record<string, unknown>)) {
      if (typeof v === 'number' || typeof v === 'string') metrics[k] = v;
    }
    if (!Object.keys(metrics).length) metrics = undefined;
  }

  const computed =
    typeof row.computedScore === 'number' && Number.isFinite(row.computedScore)
      ? row.computedScore
      : undefined;

  return {
    id: String(row.id),
    gameName: String(row.gameName ?? fallbackGame ?? 'Ukendt'),
    at: String(row.at ?? new Date().toISOString()),
    result: (['win', 'loss', 'quit', 'draw', 'other'].includes(String(row.result))
      ? row.result
      : 'other') as GameSessionLog['result'],
    performanceNote: String(row.performanceNote ?? ''),
    rating: ([1, 2, 3, 4, 5].includes(Number(row.rating))
      ? Number(row.rating)
      : 3) as GameSessionLog['rating'],
    durationMin:
      typeof row.durationMin === 'number' && Number.isFinite(row.durationMin)
        ? row.durationMin
        : undefined,
    mood: String(row.mood ?? ''),
    gameId,
    metrics,
    computedScore: computed,
  };
}


const VALID_HARDNESS: SexStrafHardness[] = ['blød', 'medium', 'hård'];
const VALID_SS_STATUS: SexStrafStatus[] = ['pending', 'active', 'done', 'skipped', 'failed'];
const VALID_SIGNALS: CalendarSignal[] = [
  'none',
  'straf',
  'reward',
  'soft',
  'hard',
  'clothing',
  'gaming',
  'rest',
  'date',
];

function migrateSexStraf(row: unknown): SexStrafInstance | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.templateId !== 'string') return null;
  const hardness = VALID_HARDNESS.includes(r.hardness as SexStrafHardness)
    ? (r.hardness as SexStrafHardness)
    : 'medium';
  const status = VALID_SS_STATUS.includes(r.status as SexStrafStatus)
    ? (r.status as SexStrafStatus)
    : 'pending';
  const durationMin =
    typeof r.durationMin === 'number' && Number.isFinite(r.durationMin) ? r.durationMin : 10;
  return {
    id: r.id,
    templateId: String(r.templateId),
    titleDa: String(r.titleDa ?? 'Sex-straf'),
    sceneDa: String(r.sceneDa ?? ''),
    partnerDa: String(r.partnerDa ?? ''),
    placeDa: String(r.placeDa ?? ''),
    whyDa: String(r.whyDa ?? ''),
    durationMin,
    hardness,
    status,
    createdAt: String(r.createdAt ?? new Date().toISOString()),
    resolvedAt: typeof r.resolvedAt === 'string' ? r.resolvedAt : undefined,
    pointsDelta: typeof r.pointsDelta === 'number' ? r.pointsDelta : undefined,
    redeemBoost: typeof r.redeemBoost === 'number' ? r.redeemBoost : undefined,
    imageFile: typeof r.imageFile === 'string' && r.imageFile ? r.imageFile : undefined,
  };
}

function migrateCalendarEntry(row: unknown): CalendarEntry | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  if (typeof r.id !== 'string') return null;
  const dateKey = String(r.dateKey ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const signal = VALID_SIGNALS.includes(r.signal as CalendarSignal)
    ? (r.signal as CalendarSignal)
    : 'none';
  return {
    id: r.id,
    dateKey,
    titleDa: String(r.titleDa ?? ''),
    noteDa: String(r.noteDa ?? ''),
    signal,
    createdAt: String(r.createdAt ?? new Date().toISOString()),
    updatedAt: String(r.updatedAt ?? r.createdAt ?? new Date().toISOString()),
    imageId: typeof r.imageId === 'string' && r.imageId ? r.imageId : undefined,
  };
}


function migrateMorningTrio(raw: unknown): AppState['morningTrio'] {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const dateKey = String(r.dateKey ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const challenges = Array.isArray(r.challenges) ? r.challenges : [];
  if (!challenges.length) return null;
  return {
    dateKey,
    issuedAt: String(r.issuedAt ?? new Date().toISOString()),
    challenges: challenges as NonNullable<AppState['morningTrio']>['challenges'],
  };
}


/** Map legacy role ids on saved daily outfit so engines keep working. */
function migrateUnderwearToday(raw: unknown): AppState['underwearToday'] {
  if (!raw || typeof raw !== 'object') return null;
  const u = { ...(raw as NonNullable<AppState['underwearToday']>) };
  if (u.roleId) {
    const legacy = String(u.roleId);
    const resolved = resolveRoleId(legacy);
    if (resolved) {
      u.roleId = resolved;
      if (legacy !== resolved) {
        const pack = getRolePack(resolved);
        if (pack) u.roleNameDa = pack.nameDa;
      }
    } else {
      delete u.roleId;
      delete u.roleNameDa;
    }
  }
  return u;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<AppState> & { profile?: Partial<Profile> };
    const base = defaultState();

    parsed.profile = {
      ...defaultProfile(),
      ...(parsed.profile ?? {}),
      name: 'Frida',
    };
    if (!Array.isArray(parsed.profile.enabledThemes) || !parsed.profile.enabledThemes.length) {
      parsed.profile.enabledThemes = [...ALL_THEMES];
    }
    if (!Array.isArray(parsed.profile.hardLimits)) {
      parsed.profile.hardLimits = [...DEFAULT_HARD_LIMITS];
    }

    const context = {
      ...base.context,
      ...(parsed.context ?? {}),
    };
    if (typeof context.playingGame !== 'string') context.playingGame = '';
    if (typeof context.notes !== 'string') context.notes = '';
    if (!context.irlStatus) context.irlStatus = 'home';
    const ag = context.activeGameId as string | undefined;
    if (ag && !(VALID_GAME_IDS as string[]).includes(ag)) {
      context.activeGameId = undefined;
    }

    let gameSessions = Array.isArray(parsed.gameSessions) ? parsed.gameSessions : [];
    gameSessions = gameSessions
      .filter((s) => s && typeof s === 'object' && typeof (s as { id?: string }).id === 'string')
      .map((s) => migrateSession(s as unknown as Record<string, unknown>, context.playingGame));

    const sexStrafLog = Array.isArray(parsed.sexStrafLog)
      ? parsed.sexStrafLog.map(migrateSexStraf).filter((x): x is SexStrafInstance => !!x)
      : [];
    const activeSexStraf = migrateSexStraf(parsed.activeSexStraf);
    const calendarEntries = Array.isArray(parsed.calendarEntries)
      ? parsed.calendarEntries.map(migrateCalendarEntry).filter((x): x is CalendarEntry => !!x)
      : [];

    return {
      profile: parsed.profile as Profile,
      context,
      emergencyStop: typeof parsed.emergencyStop === 'boolean' ? parsed.emergencyStop : false,
      underwearToday: migrateUnderwearToday(parsed.underwearToday),
      activeChallenges: Array.isArray(parsed.activeChallenges) ? parsed.activeChallenges : [],
      challengeLog: Array.isArray(parsed.challengeLog) ? parsed.challengeLog : [],
      gameSessions,
      pointsBalance:
        typeof parsed.pointsBalance === 'number' && Number.isFinite(parsed.pointsBalance)
          ? parsed.pointsBalance
          : 0,
      activeInGameChallenge: parsed.activeInGameChallenge ?? null,
      activeSexStraf:
        activeSexStraf && (activeSexStraf.status === 'pending' || activeSexStraf.status === 'active')
          ? activeSexStraf
          : null,
      sexStrafLog: sexStrafLog.slice(0, 80),
      lastSexStrafAt:
        typeof parsed.lastSexStrafAt === 'string' ? parsed.lastSexStrafAt : null,
      calendarEntries: calendarEntries.slice(0, 400),
      morningTrio: migrateMorningTrio(parsed.morningTrio),
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState): void {
  const toSave: AppState = {
    ...state,
    profile: { ...state.profile, name: 'Frida' },
  };
  localStorage.setItem(KEY, JSON.stringify(toSave));
}

export function clearState(): void {
  localStorage.removeItem(KEY);
}

/** UI tab lives outside profile payload so older clients stay compatible. */
export function loadUiTab(): StoredUiTab {
  try {
    const raw = localStorage.getItem(UI_TAB_KEY);
    if (raw && (VALID_TABS as readonly string[]).includes(raw)) {
      return raw as StoredUiTab;
    }
    if (raw === 'hjem') return 'hoved';
    if (raw === 'udfordring') return 'udfordringer';
    if (raw === 'sex-straf' || raw === 'sexstraf') return 'sex';
    if (raw === 'kalender-tab') return 'kalender';
  } catch {
    /* ignore */
  }
  return 'hoved';
}

export function saveUiTab(tab: StoredUiTab): void {
  try {
    localStorage.setItem(UI_TAB_KEY, tab);
  } catch {
    /* ignore */
  }
}
