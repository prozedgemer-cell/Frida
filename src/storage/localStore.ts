import type { AppState, Profile } from '../types';
import { ALL_THEMES, DEFAULT_HARD_LIMITS } from '../types';

const KEY = 'frida-kontrolpanel-v1';
const UI_TAB_KEY = 'frida-ui-tab-v1';

const VALID_TABS = ['gaming', 'ingame', 'hverdag', 'udfordringer', 'profil'] as const;
export type StoredUiTab = (typeof VALID_TABS)[number];

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

    // Migrate: if old clients only had playingGame/notes, sessions start empty
    let gameSessions = Array.isArray(parsed.gameSessions) ? parsed.gameSessions : [];
    gameSessions = gameSessions
      .filter((s) => s && typeof s === 'object' && typeof (s as { id?: string }).id === 'string')
      .map((s) => {
        const row = s as unknown as Record<string, unknown>;
        return {
          id: String(row.id),
          gameName: String(row.gameName ?? context.playingGame ?? 'Ukendt'),
          at: String(row.at ?? new Date().toISOString()),
          result: (['win', 'loss', 'quit', 'draw', 'other'].includes(String(row.result))
            ? row.result
            : 'other') as AppState['gameSessions'][number]['result'],
          performanceNote: String(row.performanceNote ?? ''),
          rating: ([1, 2, 3, 4, 5].includes(Number(row.rating))
            ? Number(row.rating)
            : 3) as AppState['gameSessions'][number]['rating'],
          durationMin:
            typeof row.durationMin === 'number' && Number.isFinite(row.durationMin)
              ? row.durationMin
              : undefined,
          mood: String(row.mood ?? ''),
        };
      });

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
    if (raw === 'hjem') return 'hverdag';
    if (raw === 'udfordring') return 'udfordringer';
  } catch {
    /* ignore */
  }
  return 'hverdag';
}

export function saveUiTab(tab: StoredUiTab): void {
  try {
    localStorage.setItem(UI_TAB_KEY, tab);
  } catch {
    /* ignore */
  }
}
