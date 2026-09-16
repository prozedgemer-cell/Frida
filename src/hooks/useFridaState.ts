import { useCallback, useEffect, useMemo, useState } from 'react';
import { drawChallenges, drawInGameChallenge } from '../engines/challengeEngine';
import {
  challengePointsDelta,
  computePerformance,
} from '../engines/performanceEngine';
import { pickUnderwear, todayKey } from '../engines/underwearEngine';
import { loadState, saveState } from '../storage/localStore';
import type {
  AppState,
  ChallengeOutcome,
  ContextState,
  GameSessionLog,
  Profile,
} from '../types';

export function useFridaState() {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const performance = useMemo(
    () => computePerformance(state.gameSessions),
    [state.gameSessions],
  );

  // Ensure today's underwear exists when age-verified and not emergency-stopped
  useEffect(() => {
    if (!state.profile.ageVerified) return;
    if (state.emergencyStop) return;
    if (state.underwearToday?.dateKey === todayKey()) return;
    setState((s) => ({
      ...s,
      underwearToday: pickUnderwear(s.profile, s.context, {
        performance: computePerformance(s.gameSessions),
      }),
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
      activeInGameChallenge:
        on && s.activeInGameChallenge
          ? { ...s.activeInGameChallenge, status: 'paused' as const }
          : s.activeInGameChallenge
            ? {
                ...s.activeInGameChallenge,
                status:
                  s.activeInGameChallenge.status === 'paused'
                    ? ('active' as const)
                    : s.activeInGameChallenge.status,
              }
            : null,
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
      const perf = computePerformance(s.gameSessions);
      return {
        ...s,
        underwearToday: pickUnderwear(s.profile, s.context, {
          excludeId: s.underwearToday?.itemId,
          performance: perf,
        }),
      };
    });
  }, []);

  const refreshChallenges = useCallback((count = 3) => {
    setState((s) => {
      if (s.emergencyStop) return s;
      const exclude = s.activeChallenges.map((c) => c.templateId);
      const perf = computePerformance(s.gameSessions);
      const next = drawChallenges(
        s.profile,
        s.context,
        s.underwearToday,
        count,
        exclude,
        perf,
      );
      return { ...s, activeChallenges: next };
    });
  }, []);

  const ensureChallenges = useCallback(() => {
    setState((s) => {
      if (s.emergencyStop) return s;
      if (s.activeChallenges.length > 0) return s;
      const perf = computePerformance(s.gameSessions);
      return {
        ...s,
        activeChallenges: drawChallenges(
          s.profile,
          s.context,
          s.underwearToday,
          3,
          [],
          perf,
        ),
      };
    });
  }, []);

  const resolveChallenge = useCallback(
    (id: string, outcome: ChallengeOutcome, note?: string) => {
      setState((s) => {
        const ch = s.activeChallenges.find((c) => c.id === id);
        if (!ch) return s;
        const delta = challengePointsDelta(
          outcome,
          ch.bonusPoints ?? 5,
          ch.penaltyPoints ?? 3,
        );
        const logEntry = {
          id: `log-${Date.now()}`,
          templateId: ch.templateId,
          titleDa: ch.titleDa,
          outcome,
          at: new Date().toISOString(),
          note,
          pointsDelta: delta,
          kind: ch.kind,
        };
        const remaining = s.activeChallenges.filter((c) => c.id !== id);
        let active = remaining;
        if (remaining.length < 2 && !s.emergencyStop) {
          const perf = computePerformance(s.gameSessions);
          const extra = drawChallenges(
            s.profile,
            s.context,
            s.underwearToday,
            1,
            [...remaining.map((c) => c.templateId), ch.templateId],
            perf,
          );
          active = [...remaining, ...extra];
        }
        return {
          ...s,
          activeChallenges: active,
          challengeLog: [logEntry, ...s.challengeLog].slice(0, 100),
          pointsBalance: s.pointsBalance + delta,
        };
      });
    },
    [],
  );

  const addGameSession = useCallback(
    (entry: Omit<GameSessionLog, 'id' | 'at'> & { at?: string }) => {
      setState((s) => {
        const session: GameSessionLog = {
          id: `gs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          at: entry.at ?? new Date().toISOString(),
          gameName: entry.gameName.trim() || s.context.playingGame.trim() || 'Ukendt spil',
          result: entry.result,
          performanceNote: entry.performanceNote ?? '',
          rating: entry.rating,
          durationMin: entry.durationMin,
          mood: entry.mood ?? '',
          gameId: entry.gameId,
          metrics: entry.metrics,
          computedScore: entry.computedScore,
        };
        const gameSessions = [session, ...s.gameSessions].slice(0, 80);
        const perf = computePerformance(gameSessions);
        // Refresh today's underwear influence when logging (same day keep dateKey)
        const underwearToday =
          !s.emergencyStop && s.profile.ageVerified
            ? pickUnderwear(s.profile, {
                ...s.context,
                playingGame: session.gameName || s.context.playingGame,
              }, {
                excludeId: undefined,
                performance: perf,
              })
            : s.underwearToday;
        return {
          ...s,
          gameSessions,
          context: {
            ...s.context,
            playingGame: session.gameName || s.context.playingGame,
          },
          underwearToday:
            underwearToday && s.underwearToday?.dateKey === todayKey()
              ? { ...underwearToday, dateKey: todayKey() }
              : underwearToday,
        };
      });
    },
    [],
  );

  const updateGameSession = useCallback(
    (id: string, patch: Partial<Omit<GameSessionLog, 'id'>>) => {
      setState((s) => {
        const gameSessions = s.gameSessions.map((g) =>
          g.id === id ? { ...g, ...patch, id: g.id } : g,
        );
        return { ...s, gameSessions };
      });
    },
    [],
  );

  const deleteGameSession = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      gameSessions: s.gameSessions.filter((g) => g.id !== id),
    }));
  }, []);

  const drawNewInGameChallenge = useCallback(() => {
    setState((s) => {
      if (s.emergencyStop) return s;
      const perf = computePerformance(s.gameSessions);
      const exclude = s.activeInGameChallenge
        ? [s.activeInGameChallenge.templateId]
        : [];
      const next = drawInGameChallenge(
        s.profile,
        s.context,
        s.underwearToday,
        exclude,
        perf,
      );
      return { ...s, activeInGameChallenge: next };
    });
  }, []);

  const ensureInGameChallenge = useCallback(() => {
    setState((s) => {
      if (s.emergencyStop) return s;
      if (s.activeInGameChallenge) return s;
      const perf = computePerformance(s.gameSessions);
      const next = drawInGameChallenge(
        s.profile,
        s.context,
        s.underwearToday,
        [],
        perf,
      );
      return { ...s, activeInGameChallenge: next };
    });
  }, []);

  const resolveInGameChallenge = useCallback(
    (outcome: ChallengeOutcome, note?: string) => {
      setState((s) => {
        const ch = s.activeInGameChallenge;
        if (!ch) return s;
        const bonus = ch.bonusPoints ?? 12;
        const penalty = ch.penaltyPoints ?? 6;
        const delta = challengePointsDelta(outcome, bonus, penalty);
        const logEntry = {
          id: `iglog-${Date.now()}`,
          templateId: ch.templateId,
          titleDa: ch.titleDa,
          outcome,
          at: new Date().toISOString(),
          note,
          pointsDelta: delta,
          kind: 'ingame' as const,
        };
        let nextChallenge = null as typeof ch | null;
        if (!s.emergencyStop) {
          nextChallenge = drawInGameChallenge(
            s.profile,
            s.context,
            s.underwearToday,
            [ch.templateId],
            computePerformance(s.gameSessions),
          );
        }
        return {
          ...s,
          activeInGameChallenge: nextChallenge,
          challengeLog: [logEntry, ...s.challengeLog].slice(0, 100),
          pointsBalance: s.pointsBalance + delta,
        };
      });
    },
    [],
  );

  return {
    state,
    performance,
    updateProfile,
    updateContext,
    setEmergencyStop,
    verifyAge,
    rerollUnderwear,
    refreshChallenges,
    ensureChallenges,
    resolveChallenge,
    addGameSession,
    updateGameSession,
    deleteGameSession,
    drawNewInGameChallenge,
    ensureInGameChallenge,
    resolveInGameChallenge,
  };
}
