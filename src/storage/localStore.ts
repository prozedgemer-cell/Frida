import type { AppState, Profile } from '../types';
import { ALL_THEMES, DEFAULT_HARD_LIMITS } from '../types';

const KEY = 'frida-kontrolpanel-v1';
const UI_TAB_KEY = 'frida-ui-tab-v1';

const VALID_TABS = ['gaming', 'hverdag', 'udfordringer', 'profil'] as const;
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
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppState;
    // Ensure locked name — merge carefully so existing profile fields survive
    parsed.profile = {
      ...defaultProfile(),
      ...parsed.profile,
      name: 'Frida',
    };
    if (!Array.isArray(parsed.profile.enabledThemes) || !parsed.profile.enabledThemes.length) {
      parsed.profile.enabledThemes = [...ALL_THEMES];
    }
    if (!Array.isArray(parsed.profile.hardLimits)) {
      parsed.profile.hardLimits = [...DEFAULT_HARD_LIMITS];
    }
    if (!parsed.context) parsed.context = defaultState().context;
    if (typeof parsed.context.playingGame !== 'string') parsed.context.playingGame = '';
    if (typeof parsed.context.notes !== 'string') parsed.context.notes = '';
    if (!parsed.context.irlStatus) parsed.context.irlStatus = 'home';
    if (!Array.isArray(parsed.activeChallenges)) parsed.activeChallenges = [];
    if (!Array.isArray(parsed.challengeLog)) parsed.challengeLog = [];
    if (typeof parsed.emergencyStop !== 'boolean') parsed.emergencyStop = false;
    return parsed;
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
    // Migrate legacy 3-tab ids
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
