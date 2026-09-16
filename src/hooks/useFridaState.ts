import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  drawChallenges,
  drawInGameChallenge,
  drawMorningTrio,
} from '../engines/challengeEngine';
import {
  localDateKey,
  summarizeCalendar,
} from '../engines/calendarEngine';
import {
  challengePointsDelta,
  computePerformance,
} from '../engines/performanceEngine';
import {
  evaluateSexStrafDueWithSessions,
  generateSexStraf,
  sexStrafPointsDelta,
} from '../engines/sexStrafEngine';
import { pickUnderwear, todayKey } from '../engines/underwearEngine';
import { attachOutfitToPick } from '../engines/outfitEngine';
import { loadState, saveState } from '../storage/localStore';
import type {
  AppState,
  CalendarEntry,
  CalendarSignal,
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

  const calendarToday = useMemo(
    () => summarizeCalendar(state.calendarEntries, localDateKey()),
    [state.calendarEntries],
  );

  const sexStrafDue = useMemo(
    () =>
      evaluateSexStrafDueWithSessions({
        paused: state.emergencyStop,
        active: state.activeSexStraf,
        log: state.sexStrafLog,
        lastSexStrafAt: state.lastSexStrafAt,
        performance,
        pointsBalance: state.pointsBalance,
        challengeLog: state.challengeLog,
        calendar: calendarToday,
        sessions: state.gameSessions,
      }),
    [
      state.emergencyStop,
      state.activeSexStraf,
      state.sexStrafLog,
      state.lastSexStrafAt,
      state.pointsBalance,
      state.challengeLog,
      state.gameSessions,
      performance,
      calendarToday,
    ],
  );

  // Ensure today's full outfit exists when age-verified and not emergency-stopped
  useEffect(() => {
    if (!state.profile.ageVerified) return;
    if (state.emergencyStop) return;
    if (state.underwearToday?.dateKey === todayKey()) {
      if (!state.underwearToday.layers || state.underwearToday.layers.length < 2) {
        setState((s) => {
          if (!s.underwearToday) return s;
          if (s.underwearToday.layers && s.underwearToday.layers.length > 1) return s;
          return {
            ...s,
            underwearToday: attachOutfitToPick(s.underwearToday, s.profile, s.context, {
              performance: computePerformance(s.gameSessions),
              calendar: summarizeCalendar(s.calendarEntries, localDateKey()),
              force: true,
            }),
          };
        });
      }
      return;
    }
    setState((s) => ({
      ...s,
      underwearToday: pickUnderwear(s.profile, s.context, {
        performance: computePerformance(s.gameSessions),
        calendar: summarizeCalendar(s.calendarEntries, localDateKey()),
      }),
    }));
  }, [state.profile.ageVerified, state.emergencyStop, state.underwearToday?.dateKey, state.underwearToday?.layers?.length]);

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
          excludeLookId: s.underwearToday?.lookId,
          performance: perf,
          calendar: summarizeCalendar(s.calendarEntries, localDateKey()),
        }),
      };
    });
  }, []);

  const refreshChallenges = useCallback((count = 3) => {
    setState((s) => {
      if (s.emergencyStop) return s;
      const exclude = s.activeChallenges.map((c) => c.templateId);
      const perf = computePerformance(s.gameSessions);
      const cal = summarizeCalendar(s.calendarEntries, localDateKey());
      const next = drawChallenges(
        s.profile,
        s.context,
        s.underwearToday,
        count,
        exclude,
        perf,
        cal,
      );
      return { ...s, activeChallenges: next };
    });
  }, []);

  const ensureChallenges = useCallback(() => {
    setState((s) => {
      if (s.emergencyStop) return s;
      const key = localDateKey();
      if (
        s.morningTrio?.dateKey === key &&
        s.morningTrio.challenges.length === 3 &&
        s.activeChallenges.length === 0
      ) {
        return { ...s, activeChallenges: s.morningTrio.challenges.filter((c) => c.status === 'active') };
      }
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
          summarizeCalendar(s.calendarEntries, key),
        ),
      };
    });
  }, []);


  const ensureMorningTrio = useCallback(() => {
    setState((s) => {
      if (s.emergencyStop) return s;
      if (!s.profile.ageVerified) return s;
      const key = localDateKey();
      if (s.morningTrio?.dateKey === key && s.morningTrio.challenges.length === 3) {
        return s;
      }
      const perf = computePerformance(s.gameSessions);
      const cal = summarizeCalendar(s.calendarEntries, key);
      const challenges = drawMorningTrio(
        s.profile,
        s.context,
        s.underwearToday,
        perf,
        cal,
      );
      // Keep exactly 3; if pool thin, pad from drawChallenges do/wear via drawMorningTrio already
      const trio = challenges.slice(0, 3);
      if (trio.length < 3) return s; // wait until templates filter allows
      return {
        ...s,
        morningTrio: {
          dateKey: key,
          issuedAt: new Date().toISOString(),
          challenges: trio,
        },
        // Mirror onto activeChallenges for the day when empty or stale day
        activeChallenges:
          s.activeChallenges.length === 0 ||
          !s.activeChallenges.some((c) => c.morningTier)
            ? trio
            : s.activeChallenges,
      };
    });
  }, []);

  const resolveMorningChallenge = useCallback(
    (id: string, outcome: ChallengeOutcome, note?: string) => {
      setState((s) => {
        if (!s.morningTrio) return s;
        const ch = s.morningTrio.challenges.find((c) => c.id === id);
        if (!ch) return s;
        const delta = challengePointsDelta(
          outcome,
          ch.bonusPoints ?? 5,
          ch.penaltyPoints ?? 3,
        );
        const logEntry = {
          id: `mlog-${Date.now()}`,
          templateId: ch.templateId,
          titleDa: ch.titleDa,
          outcome,
          at: new Date().toISOString(),
          note,
          pointsDelta: delta,
          kind: ch.kind,
        };
        const challenges = s.morningTrio.challenges.map((c) =>
          c.id === id ? { ...c, status: 'paused' as const } : c,
        );
        // Mark resolved by removing from active list presentation — keep in trio with paused
        return {
          ...s,
          morningTrio: { ...s.morningTrio, challenges },
          activeChallenges: s.activeChallenges.filter((c) => c.id !== id),
          challengeLog: [logEntry, ...s.challengeLog].slice(0, 100),
          pointsBalance: s.pointsBalance + delta,
        };
      });
    },
    [],
  );

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
            summarizeCalendar(s.calendarEntries, localDateKey()),
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
                calendar: summarizeCalendar(s.calendarEntries, localDateKey()),
              })
            : s.underwearToday;
        return {
          ...s,
          gameSessions,
          context: {
            ...s.context,
            playingGame: session.gameName || s.context.playingGame,
            activeGameId:
              session.gameId && session.gameId !== 'custom'
                ? session.gameId
                : s.context.activeGameId,
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
        summarizeCalendar(s.calendarEntries, localDateKey()),
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
        summarizeCalendar(s.calendarEntries, localDateKey()),
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
            summarizeCalendar(s.calendarEntries, localDateKey()),
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


  const claimSexStraf = useCallback(() => {
    setState((s) => {
      if (s.emergencyStop) return s;
      if (s.activeSexStraf && (s.activeSexStraf.status === 'pending' || s.activeSexStraf.status === 'active')) {
        return s;
      }
      const perf = computePerformance(s.gameSessions);
      const cal = summarizeCalendar(s.calendarEntries, localDateKey());
      const due = evaluateSexStrafDueWithSessions({
        paused: s.emergencyStop,
        active: s.activeSexStraf,
        log: s.sexStrafLog,
        lastSexStrafAt: s.lastSexStrafAt,
        performance: perf,
        pointsBalance: s.pointsBalance,
        challengeLog: s.challengeLog,
        calendar: cal,
        sessions: s.gameSessions,
      });
      if (!due.due) return s;
      const inst = generateSexStraf({
        profile: s.profile,
        performance: perf,
        pointsBalance: s.pointsBalance,
        playingGame: s.context.playingGame,
        excludeTemplateIds: s.sexStrafLog.slice(0, 6).map((x) => x.templateId),
        dueReasonsDa: due.reasonsDa,
      });
      if (!inst) return s;
      return { ...s, activeSexStraf: inst };
    });
  }, []);

  const startSexStraf = useCallback(() => {
    setState((s) => {
      if (s.emergencyStop) return s;
      if (!s.activeSexStraf || s.activeSexStraf.status !== 'pending') return s;
      return { ...s, activeSexStraf: { ...s.activeSexStraf, status: 'active' } };
    });
  }, []);

  const resolveSexStraf = useCallback(
    (outcome: ChallengeOutcome) => {
      setState((s) => {
        if (s.emergencyStop) return s;
        const inst = s.activeSexStraf;
        if (!inst) return s;
        const status =
          outcome === 'complete' ? 'done' : outcome === 'skip' ? 'skipped' : 'failed';
        const delta = sexStrafPointsDelta(outcome, inst);
        const resolved: typeof inst = {
          ...inst,
          status,
          resolvedAt: new Date().toISOString(),
          pointsDelta: delta,
        };
        return {
          ...s,
          activeSexStraf: null,
          lastSexStrafAt: resolved.resolvedAt ?? new Date().toISOString(),
          sexStrafLog: [resolved, ...s.sexStrafLog].slice(0, 80),
          pointsBalance: s.pointsBalance + delta,
        };
      });
    },
    [],
  );

  const upsertCalendarEntry = useCallback(
    (entry: {
      id?: string;
      dateKey: string;
      titleDa: string;
      noteDa: string;
      signal: CalendarSignal;
      imageId?: string;
      timeHm?: string;
    }) => {
      setState((s) => {
        const now = new Date().toISOString();
        const timeHm = entry.timeHm || undefined;
        if (entry.id) {
          const calendarEntries = s.calendarEntries.map((e) =>
            e.id === entry.id
              ? {
                  ...e,
                  dateKey: entry.dateKey,
                  timeHm,
                  titleDa: entry.titleDa,
                  noteDa: entry.noteDa,
                  signal: entry.signal,
                  imageId: entry.imageId,
                  updatedAt: now,
                }
              : e,
          );
          return { ...s, calendarEntries };
        }
        const row: CalendarEntry = {
          id: `cal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          dateKey: entry.dateKey,
          timeHm,
          titleDa: entry.titleDa,
          noteDa: entry.noteDa,
          signal: entry.signal,
          imageId: entry.imageId,
          createdAt: now,
          updatedAt: now,
        };
        return { ...s, calendarEntries: [row, ...s.calendarEntries].slice(0, 400) };
      });
    },
    [],
  );

  const deleteCalendarEntry = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      calendarEntries: s.calendarEntries.filter((e) => e.id !== id),
    }));
  }, []);

  return {
    state,
    performance,
    calendarToday,
    sexStrafDue,
    updateProfile,
    updateContext,
    setEmergencyStop,
    verifyAge,
    rerollUnderwear,
    refreshChallenges,
    ensureChallenges,
    ensureMorningTrio,
    resolveMorningChallenge,
    resolveChallenge,
    addGameSession,
    updateGameSession,
    deleteGameSession,
    drawNewInGameChallenge,
    ensureInGameChallenge,
    resolveInGameChallenge,
    claimSexStraf,
    startSexStraf,
    resolveSexStraf,
    upsertCalendarEntry,
    deleteCalendarEntry,
  };
}
