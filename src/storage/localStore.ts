import type { AppState, Profile } from '../types';
import { ALL_THEMES, DEFAULT_HARD_LIMITS } from '../types';

const KEY = 'frida-kontrolpanel-v1';

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
    // Ensure locked name
    parsed.profile = {
      ...defaultProfile(),
      ...parsed.profile,
      name: 'Frida',
    };
    if (!parsed.context) parsed.context = defaultState().context;
    if (!Array.isArray(parsed.activeChallenges)) parsed.activeChallenges = [];
    if (!Array.isArray(parsed.challengeLog)) parsed.challengeLog = [];
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
