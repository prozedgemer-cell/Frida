import type { GamePresetId } from '../data/gameProfiles';
import type { AppState, GameSessionLog, Profile } from '../types';
import { ALL_THEMES, DEFAULT_HARD_LIMITS } from '../types';

const KEY = 'frida-kontrolpanel-v1';
const UI_TAB_KEY = 'frida-ui-tab-v1';

const VALID_TABS = ['hoved', 'gaming', 'ingame', 'hverdag', 'udfordringer', 'profil'] as const;
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

    return {
      profile: parsed.profile as Profile,
      context,
      emergencyStop: typeof parsed.emergencyStop === 'boolean' ? parsed.emergencyStop : false,
      underwearToday: parsed.underwearToday ?? null,
      activeChallenges: Array.isArray(parsed.activeChallenges) ? parsed.activeChallenges : [],
      challengeLog: Array.isArray(parsed.challengeLog) ? parsed.challengeLog : [],
      gameSessions,
      pointsBalance:
        typeof parsed.pointsBalance === 'number' && Number.isFinite(parsed.pointsBalance)
          ? parsed.pointsBalance
          : 0,
      activeInGameChallenge: parsed.activeInGameChallenge ?? null,
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
