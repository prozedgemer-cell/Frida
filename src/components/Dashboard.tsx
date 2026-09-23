import { useEffect, useState } from 'react';
import { estimateVariationSpace } from '../engines/challengeEngine';
import type { useFridaState } from '../hooks/useFridaState';
import { loadUiTab, saveUiTab } from '../storage/localStore';
import { BottomNav, type AppTab } from './BottomNav';
import { PanicButton } from './EmergencyStop';
import { GamingPanel } from './GamingPanel';
import { CalendarPanel } from './CalendarPanel';
import { HomePanel } from './HomePanel';
import { InstallBanner, InstallHint } from './InstallBanner';
import { ProfilePanel } from './ProfilePanel';
import { SexStrafPanel } from './SexStrafPanel';

type Hook = ReturnType<typeof useFridaState>;

const TAB_TITLES: Record<AppTab, { eyebrow: string; title: string }> = {
  home: { eyebrow: 'Home', title: 'Overview' },
  gaming: { eyebrow: 'Gaming', title: 'Session & log' },
  calendar: { eyebrow: 'Calendar', title: 'Notes & tags' },
  sex: { eyebrow: 'Sex punishment', title: 'Pending → accept' },
  profile: { eyebrow: 'Profile', title: 'Frida' },
};

const MODE_RAIL: { id: AppTab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'sex', label: 'Sex' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'profile', label: 'Profile' },
];

export function Dashboard({ api }: { api: Hook }) {
  const {
    state,
    performance,
    calendarToday,
    sexStrafDue,
    ensureChallenges,
    ensureMorningTrio,
    ensureInGameChallenge,
    refreshChallenges,
    resolveChallenge,
  } = api;
  const [tab, setTab] = useState<AppTab>(() => loadUiTab());
  const variation = estimateVariationSpace();
  const now = new Date();
  const timeLabel = now.toLocaleString('en-GB', {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  const mode = TAB_TITLES[tab];
  const primaryChallenge =
    state.activeChallenges.find((c) => c.status === 'active') ??
    state.activeChallenges[0] ??
    null;
  const sexPending =
    !!state.activeSexStraf &&
    (state.activeSexStraf.status === 'pending' || state.activeSexStraf.status === 'active');
  const sexBadge = sexPending || sexStrafDue.due;

  useEffect(() => {
    ensureMorningTrio();
    ensureChallenges();
  }, [ensureMorningTrio, ensureChallenges]);

  useEffect(() => {
    if (tab === 'gaming') ensureInGameChallenge();
  }, [tab, ensureInGameChallenge]);

  useEffect(() => {
    saveUiTab(tab);
    window.scrollTo(0, 0);
  }, [tab]);

  useEffect(() => {
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (sexBadge) void nav.setAppBadge?.(1);
    else void nav.clearAppBadge?.();
  }, [sexBadge]);

  return (
    <div className={`app-shell ${tab === 'home' ? 'is-hoved' : ''}`}>
      <header className="dash-bar">
        <div>
          <p className="eyebrow">{mode.eyebrow}</p>
          <h1 className="dash-bar__title">
            {tab === 'home' ? (
              <>
                Hi <span className="accent">Frida</span>
              </>
            ) : (
              mode.title
            )}
          </h1>
          <p className="muted tiny dash-bar__meta">
            {timeLabel} · {state.profile.dayMode}-day · {state.pointsBalance} pts
            {performance.sessionCount > 0 ? ` · ${performance.score}` : ''}
          </p>
        </div>
        <div className="dash-bar__right">
          {sexBadge && (
            <button type="button" className="sex-pill-badge" onClick={() => setTab('sex')}>
              <i className="nav-badge" aria-hidden />
              Sex
            </button>
          )}
          <PanicButton active={state.emergencyStop} onToggle={api.setEmergencyStop} />
        </div>
      </header>

      <InstallBanner />

      <nav className="mode-rail" aria-label="Mode switcher (desktop)">
        {MODE_RAIL.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`mode-rail__btn ${tab === id ? 'is-active' : ''}`}
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => setTab(id)}
          >
            {label}
            {(id === 'sex' || id === 'home') && sexBadge && (
              <i className="nav-badge nav-badge--inline" />
            )}
          </button>
        ))}
      </nav>

      <div className="layout layout--modes">
        <div className={`tab-panel ${tab === 'home' ? 'is-active' : ''}`} data-tab="home">
          <HomePanel
            underwear={state.underwearToday}
            pointsBalance={state.pointsBalance}
            performance={performance}
            intensity={state.profile.intensity}
            dayMode={state.profile.dayMode}
            playingGame={state.context.playingGame}
            irlStatus={state.context.irlStatus}
            activeChallenge={primaryChallenge}
            inGameChallenge={state.activeInGameChallenge}
            emergencyStop={state.emergencyStop}
            onEmergencyStop={api.setEmergencyStop}
            onGoSex={() => setTab('sex')}
            onGoCalendar={() => setTab('calendar')}
            onGoGaming={() => setTab('gaming')}
            onGoProfile={() => setTab('profile')}
            onIrl={(irlStatus) => api.updateContext({ irlStatus })}
            sexActive={state.activeSexStraf}
            sexDue={sexStrafDue}
            calendarToday={calendarToday}
            morningTrio={state.morningTrio}
            activeChallenges={state.activeChallenges}
            challengeLog={state.challengeLog}
            onRefreshChallenges={() => refreshChallenges(3)}
            onResolveChallenge={resolveChallenge}
            onResolveMorning={api.resolveMorningChallenge}
          />
        </div>

        <div className={`tab-panel ${tab === 'gaming' ? 'is-active' : ''}`} data-tab="gaming">
          <GamingPanel
            context={state.context}
            sessions={state.gameSessions}
            performance={performance}
            pointsBalance={state.pointsBalance}
            paused={state.emergencyStop}
            onChange={api.updateContext}
            onAddSession={api.addGameSession}
            onUpdateSession={api.updateGameSession}
            onDeleteSession={api.deleteGameSession}
            inGameChallenge={state.activeInGameChallenge}
            challengeLog={state.challengeLog}
            onDrawInGame={api.drawNewInGameChallenge}
            onResolveInGame={api.resolveInGameChallenge}
          />
        </div>

        <div className={`tab-panel ${tab === 'sex' ? 'is-active' : ''}`} data-tab="sex">
          <SexStrafPanel
            active={state.activeSexStraf}
            log={state.sexStrafLog}
            due={sexStrafDue}
            calendarToday={calendarToday}
            paused={state.emergencyStop}
            pointsBalance={state.pointsBalance}
            onClaim={api.claimSexStraf}
            onStart={api.startSexStraf}
            onResolve={api.resolveSexStraf}
            onAdjust={api.adjustSexStraf}
          />
        </div>

        <div className={`tab-panel ${tab === 'calendar' ? 'is-active' : ''}`} data-tab="calendar">
          <CalendarPanel
            entries={state.calendarEntries}
            paused={state.emergencyStop}
            onUpsert={api.upsertCalendarEntry}
            onDelete={api.deleteCalendarEntry}
          />
        </div>

        <div className={`tab-panel ${tab === 'profile' ? 'is-active' : ''}`} data-tab="profile">
          <ProfilePanel
            profile={state.profile}
            context={state.context}
            onChange={api.updateProfile}
            onContext={api.updateContext}
            disabled={state.emergencyStop}
          />
          <section className="panel panel--muted">
            <p className="eyebrow">App</p>
            <InstallHint />
          </section>
          <section className="panel panel--muted">
            <p className="eyebrow">Scale</p>
            <p className="tiny">{variation.noteDa}</p>
          </section>
        </div>
      </div>

      <BottomNav tab={tab} onChange={setTab} sexBadge={sexBadge} />
    </div>
  );
}
