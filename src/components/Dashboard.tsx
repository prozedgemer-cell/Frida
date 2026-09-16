import { useEffect, useState } from 'react';
import { TEMPLATE_COUNT } from '../data/challenges';
import { estimateVariationSpace } from '../engines/challengeEngine';
import type { useFridaState } from '../hooks/useFridaState';
import { loadUiTab, saveUiTab } from '../storage/localStore';
import { BottomNav, type AppTab } from './BottomNav';
import { ChallengesPanel } from './ChallengesPanel';
import { PanicButton, EstopSlimBanner } from './EmergencyStop';
import { GamingPanel } from './GamingPanel';
import { CalendarPanel } from './CalendarPanel';
import { HomePanel } from './HomePanel';
import { InGamePanel } from './InGamePanel';
import { InstallBanner, InstallHint } from './InstallBanner';
import { ProfilePanel } from './ProfilePanel';
import { SexStrafPanel } from './SexStrafPanel';

type Hook = ReturnType<typeof useFridaState>;

const TAB_TITLES: Record<AppTab, { eyebrow: string; title: string }> = {
  hoved: { eyebrow: 'Hoved', title: 'Overblik' },
  gaming: { eyebrow: 'Gaming', title: 'Session & in-game' },
  udfordringer: { eyebrow: 'Udfordringer', title: 'Morgen-trio + ordrer' },
  sex: { eyebrow: 'Sex-straf', title: 'Indløs stats' },
  kalender: { eyebrow: 'Kalender', title: 'Noter & signaler' },
  profil: { eyebrow: 'Profil', title: 'Frida' },
};

const MODE_RAIL: { id: AppTab; label: string }[] = [
  { id: 'hoved', label: 'Hoved' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'kalender', label: 'Kalender' },
  { id: 'udfordringer', label: 'Udfordringer' },
  { id: 'sex', label: 'Sex' },
  { id: 'profil', label: 'Profil' },
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
  const timeLabel = now.toLocaleString('da-DK', {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  const mode = TAB_TITLES[tab];
  const primaryChallenge =
    state.activeChallenges.find((c) => c.status === 'active' && !c.morningTier) ??
    state.activeChallenges.find((c) => c.status === 'active') ??
    state.activeChallenges[0] ??
    null;
  const sexPending =
    !!state.activeSexStraf &&
    (state.activeSexStraf.status === 'pending' || state.activeSexStraf.status === 'active');

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

  return (
    <div className={`app-shell ${tab === 'hoved' ? 'is-hoved' : ''}`}>
      <PanicButton active={state.emergencyStop} onToggle={api.setEmergencyStop} />
      <header className="dash-bar">
        <div className="dash-bar__left">
          <p className="eyebrow">Kontrolpanel</p>
          <h1 className="dash-bar__title">
            Hej <span className="accent">Frida</span>
          </h1>
          <p className="muted tiny dash-bar__meta">
            {timeLabel} · {state.profile.dayMode}-dag · {state.pointsBalance} p
            {performance.sessionCount > 0 ? ` · ${performance.score}` : ''}
            {' · '}
            {mode.eyebrow}
          </p>
        </div>
        <div className="dash-bar__right">
          {(sexPending || sexStrafDue.due) && (
            <button type="button" className="sex-pill-badge" onClick={() => setTab('sex')}>
              <i className="nav-badge" aria-hidden />
              Sex-straf
            </button>
          )}
          <button
            type="button"
            className={`header-profile-btn ${tab === 'profil' ? 'is-active' : ''}`}
            aria-label="Profil"
            aria-current={tab === 'profil' ? 'page' : undefined}
            onClick={() => setTab('profil')}
          >
            <svg viewBox="0 0 24 24" aria-hidden className="nav-svg">
              <path
                fill="currentColor"
                d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 10c3.8 0 8 1.8 8 5v2H4v-2c0-3.2 4.2-5 8-5Z"
              />
            </svg>
          </button>
        </div>
      </header>
      <EstopSlimBanner active={state.emergencyStop} />

      <InstallBanner />

      <nav className="mode-rail" aria-label="Mode-skifter (desktop)">
        {MODE_RAIL.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`mode-rail__btn ${tab === id ? 'is-active' : ''}`}
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => setTab(id)}
          >
            {label}
            {(id === 'sex' || id === 'hoved') && (sexPending || sexStrafDue.due) && (
              <i className="nav-badge nav-badge--inline" />
            )}
          </button>
        ))}
      </nav>

      <div className="layout layout--modes">
        <div className={`tab-panel ${tab === 'hoved' ? 'is-active' : ''}`} data-tab="hoved">
          <HomePanel
            underwear={state.underwearToday}
            pointsBalance={state.pointsBalance}
            performance={performance}
            intensity={state.profile.intensity}
            dayMode={state.profile.dayMode}
            playingGame={state.context.playingGame}
            activeChallenge={primaryChallenge}
            inGameChallenge={state.activeInGameChallenge}
            emergencyStop={state.emergencyStop}
            onGoChallenges={() => setTab('udfordringer')}
            onGoSex={() => setTab('sex')}
            onGoCalendar={() => setTab('kalender')}
            onGoGaming={() => setTab('gaming')}
            onReroll={api.rerollUnderwear}
            sexActive={state.activeSexStraf}
            sexDue={sexStrafDue}
            calendarToday={calendarToday}
            morningPending={
              state.morningTrio?.challenges.filter((c) => c.status === 'active').length ?? 0
            }
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
          />
          <InGamePanel
            embedded
            challenge={state.activeInGameChallenge}
            log={state.challengeLog}
            performance={performance}
            pointsBalance={state.pointsBalance}
            playingGame={state.context.playingGame}
            activeGameId={state.context.activeGameId}
            paused={state.emergencyStop}
            onDraw={api.drawNewInGameChallenge}
            onResolve={api.resolveInGameChallenge}
            onChangeContext={api.updateContext}
          />
        </div>

        <div
          className={`tab-panel ${tab === 'udfordringer' ? 'is-active' : ''}`}
          data-tab="udfordringer"
        >
          <ChallengesPanel
            active={state.activeChallenges}
            log={state.challengeLog}
            performance={performance}
            calendarToday={calendarToday}
            paused={state.emergencyStop}
            onRefresh={() => refreshChallenges(3)}
            onResolve={resolveChallenge}
            morningTrio={state.morningTrio}
            onResolveMorning={api.resolveMorningChallenge}
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
          />
        </div>

        <div className={`tab-panel ${tab === 'kalender' ? 'is-active' : ''}`} data-tab="kalender">
          <CalendarPanel
            entries={state.calendarEntries}
            paused={state.emergencyStop}
            onUpsert={api.upsertCalendarEntry}
            onDelete={api.deleteCalendarEntry}
          />
        </div>

        <div className={`tab-panel ${tab === 'profil' ? 'is-active' : ''}`} data-tab="profil">
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
            <p className="eyebrow">Skala</p>
            <p className="tiny">
              {variation.noteDa} · {TEMPLATE_COUNT} challenge-skabeloner.
            </p>
          </section>
        </div>
      </div>

      <BottomNav tab={tab} onChange={setTab} sexBadge={sexPending || sexStrafDue.due} />
    </div>
  );
}
