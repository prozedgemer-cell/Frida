import { useEffect, useState } from 'react';
import { TEMPLATE_COUNT } from '../data/challenges';
import { UNDERWEAR_CATALOG } from '../data/underwear';
import { estimateVariationSpace } from '../engines/challengeEngine';
import type { useFridaState } from '../hooks/useFridaState';
import { loadUiTab, saveUiTab } from '../storage/localStore';
import { BottomNav, type AppTab } from './BottomNav';
import { ChallengesPanel } from './ChallengesPanel';
import { EmergencyStop } from './EmergencyStop';
import { EverydayPanel } from './EverydayPanel';
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
  gaming: { eyebrow: 'Gaming-mode', title: 'Session-log' },
  ingame: { eyebrow: 'In-game', title: 'Mens du spiller' },
  hverdag: { eyebrow: 'Hverdag-mode', title: 'Daglig kontrol' },
  udfordringer: { eyebrow: 'Udfordringer', title: 'Ordrer' },
  sex: { eyebrow: 'Sex-straf', title: 'Indløs stats' },
  kalender: { eyebrow: 'Kalender', title: 'Noter & signaler' },
  profil: { eyebrow: 'Profil', title: 'Frida' },
};

const MODE_RAIL: { id: AppTab; label: string }[] = [
  { id: 'hoved', label: 'Hoved' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'ingame', label: 'In-game' },
  { id: 'hverdag', label: 'Hverdag' },
  { id: 'udfordringer', label: 'Udfordringer' },
  { id: 'sex', label: 'Sex' },
  { id: 'kalender', label: 'Kalender' },
  { id: 'profil', label: 'Profil' },
];

export function Dashboard({ api }: { api: Hook }) {
  const {
    state,
    performance,
    calendarToday,
    sexStrafDue,
    ensureChallenges,
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
    state.activeChallenges.find((c) => c.status === 'active') ??
    state.activeChallenges[0] ??
    null;
  const sexPending =
    !!state.activeSexStraf &&
    (state.activeSexStraf.status === 'pending' || state.activeSexStraf.status === 'active');

  useEffect(() => {
    ensureChallenges();
  }, [ensureChallenges]);

  useEffect(() => {
    if (tab === 'ingame') ensureInGameChallenge();
  }, [tab, ensureInGameChallenge]);

  useEffect(() => {
    saveUiTab(tab);
    window.scrollTo(0, 0);
  }, [tab]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Personligt kontrolpanel · da-DK</p>
          <h1>
            Hej <span className="accent">Frida</span>
          </h1>
          <p className="muted">
            {timeLabel} · {state.profile.dayMode}-dag · intensitet {state.profile.intensity} · cup{' '}
            {state.profile.breastSize}
            {state.context.playingGame.trim()
              ? ` · spiller ${state.context.playingGame.trim()}`
              : ''}
            {performance.sessionCount > 0 ? ` · præst. ${performance.score}` : ''}
          </p>
          <p className="mode-label">
            <span className="eyebrow" style={{ display: 'inline' }}>
              {mode.eyebrow}
            </span>{' '}
            <span className="muted">· {mode.title}</span>
          </p>
        </div>
        <div className="topbar__right">
          <button
            type="button"
            className={`btn btn--estop-mini ${state.emergencyStop ? 'is-on' : ''}`}
            onClick={() => api.setEmergencyStop(!state.emergencyStop)}
            aria-pressed={state.emergencyStop}
            title="Nødstop"
          >
            {state.emergencyStop ? 'NØDSTOP ON' : 'NØDSTOP'}
          </button>
          <div className="topbar__stats">
            <div>
              <strong>{state.pointsBalance}</strong>
              <span>point</span>
            </div>
            <div>
              <strong>{TEMPLATE_COUNT}</strong>
              <span>skabeloner</span>
            </div>
            <div className="topbar__stats--hide-sm">
              <strong>{UNDERWEAR_CATALOG.length}</strong>
              <span>undertøj</span>
            </div>
          </div>
        </div>
      </header>

      <InstallBanner />

      <EmergencyStop active={state.emergencyStop} onToggle={api.setEmergencyStop} />

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
            {id === 'sex' && sexPending && <i className="nav-badge nav-badge--inline" />}
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
            onEmergencyStop={api.setEmergencyStop}
            onGoChallenges={() => setTab('udfordringer')}
            onGoInGame={() => setTab('ingame')}
            onGoSex={() => setTab('sex')}
            onGoCalendar={() => setTab('kalender')}
            onGoGaming={() => setTab('gaming')}
            sexActive={state.activeSexStraf}
            sexDue={sexStrafDue}
            calendarToday={calendarToday}
          />
        </div>

        <div className={`tab-panel ${tab === 'gaming' ? 'is-active' : ''}`} data-tab="gaming">
          <GamingPanel
            context={state.context}
            underwear={state.underwearToday}
            sessions={state.gameSessions}
            performance={performance}
            pointsBalance={state.pointsBalance}
            paused={state.emergencyStop}
            onChange={api.updateContext}
            onReroll={api.rerollUnderwear}
            onAddSession={api.addGameSession}
            onUpdateSession={api.updateGameSession}
            onDeleteSession={api.deleteGameSession}
            onGoInGame={() => setTab('ingame')}
          />
        </div>

        <div className={`tab-panel ${tab === 'ingame' ? 'is-active' : ''}`} data-tab="ingame">
          <InGamePanel
            challenge={state.activeInGameChallenge}
            log={state.challengeLog}
            performance={performance}
            pointsBalance={state.pointsBalance}
            playingGame={state.context.playingGame}
            activeGameId={state.context.activeGameId}
            paused={state.emergencyStop}
            onDraw={api.drawNewInGameChallenge}
            onResolve={api.resolveInGameChallenge}
            onGoGaming={() => setTab('gaming')}
            onChangeContext={api.updateContext}
          />
        </div>

        <div className={`tab-panel ${tab === 'hverdag' ? 'is-active' : ''}`} data-tab="hverdag">
          <EverydayPanel
            profile={state.profile}
            context={state.context}
            underwear={state.underwearToday}
            performance={performance}
            paused={state.emergencyStop}
            onContext={api.updateContext}
            onProfile={api.updateProfile}
            onReroll={api.rerollUnderwear}
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
            paused={state.emergencyStop}
            onRefresh={() => refreshChallenges(3)}
            onResolve={resolveChallenge}
            onGoInGame={() => setTab('ingame')}
          />
        </div>

        <div className={`tab-panel ${tab === 'sex' ? 'is-active' : ''}`} data-tab="sex">
          <SexStrafPanel
            active={state.activeSexStraf}
            log={state.sexStrafLog}
            due={sexStrafDue}
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
            onChange={api.updateProfile}
            disabled={state.emergencyStop}
          />
          <section className="panel panel--muted">
            <p className="eyebrow">App</p>
            <InstallHint />
          </section>
          <section className="panel panel--muted">
            <p className="eyebrow">Skala</p>
            <p className="tiny">{variation.noteDa}</p>
          </section>
        </div>
      </div>

      <BottomNav tab={tab} onChange={setTab} sexBadge={sexPending || sexStrafDue.due} />
    </div>
  );
}
