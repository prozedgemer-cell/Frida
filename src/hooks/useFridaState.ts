import { useCallback, useEffect, useState } from 'react';
import { drawChallenges } from '../engines/challengeEngine';
import { pickUnderwear, todayKey } from '../engines/underwearEngine';
import { loadState, saveState } from '../storage/localStore';
import type {
  AppState,
  ChallengeOutcome,
  ContextState,
  Profile,
} from '../types';

export function useFridaState() {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Ensure today's underwear exists when age-verified and not emergency-stopped
  useEffect(() => {
    if (!state.profile.ageVerified) return;
    if (state.emergencyStop) return;
    if (state.underwearToday?.dateKey === todayKey()) return;
    setState((s) => ({
      ...s,
      underwearToday: pickUnderwear(s.profile, s.context),
    }));
  }, [state.profile.ageVerified, state.emergencyStop, state.underwearToday?.dateKey]);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setState((s) => ({
      ...s,
      profile: { ...s.profile, ...patch, name: 'Frida' },
    }));
  }, []);

  const updateContext = useCallback((patch: Partial<ContextState>) => {
    setState((s) => ({
      ...s,
      context: { ...s.context, ...patch },
    }));
  }, []);

  const setEmergencyStop = useCallback((on: boolean) => {
    setState((s) => ({
      ...s,
      emergencyStop: on,
      activeChallenges: on
        ? s.activeChallenges.map((c) => ({ ...c, status: 'paused' as const }))
        : s.activeChallenges.map((c) =>
            c.status === 'paused' ? { ...c, status: 'active' as const } : c,
          ),
    }));
  }, []);

  const verifyAge = useCallback(() => {
    setState((s) => ({
      ...s,
      profile: { ...s.profile, ageVerified: true, name: 'Frida' },
    }));
  }, []);

  const rerollUnderwear = useCallback(() => {
    setState((s) => {
      if (s.emergencyStop) return s;
      return {
        ...s,
        underwearToday: pickUnderwear(s.profile, s.context, {
          excludeId: s.underwearToday?.itemId,
        }),
      };
    });
  }, []);

  const refreshChallenges = useCallback((count = 3) => {
    setState((s) => {
      if (s.emergencyStop) return s;
      const exclude = s.activeChallenges.map((c) => c.templateId);
      const next = drawChallenges(s.profile, s.context, s.underwearToday, count, exclude);
      return { ...s, activeChallenges: next };
    });
  }, []);

  const ensureChallenges = useCallback(() => {
    setState((s) => {
      if (s.emergencyStop) return s;
      if (s.activeChallenges.length > 0) return s;
      return {
        ...s,
        activeChallenges: drawChallenges(s.profile, s.context, s.underwearToday, 3),
      };
    });
  }, []);

  const resolveChallenge = useCallback((id: string, outcome: ChallengeOutcome, note?: string) => {
    setState((s) => {
      const ch = s.activeChallenges.find((c) => c.id === id);
      if (!ch) return s;
      const logEntry = {
        id: `log-${Date.now()}`,
        templateId: ch.templateId,
        titleDa: ch.titleDa,
        outcome,
        at: new Date().toISOString(),
        note,
      };
      const remaining = s.activeChallenges.filter((c) => c.id !== id);
      // Auto-draw one replacement if empty-ish
      let active = remaining;
      if (remaining.length < 2 && !s.emergencyStop) {
        const extra = drawChallenges(
          s.profile,
          s.context,
          s.underwearToday,
          1,
          [...remaining.map((c) => c.templateId), ch.templateId],
        );
        active = [...remaining, ...extra];
      }
      return {
        ...s,
        activeChallenges: active,
        challengeLog: [logEntry, ...s.challengeLog].slice(0, 100),
      };
    });
  }, []);

  return {
    state,
    updateProfile,
    updateContext,
    setEmergencyStop,
    verifyAge,
    rerollUnderwear,
    refreshChallenges,
    ensureChallenges,
    resolveChallenge,
  };
}
