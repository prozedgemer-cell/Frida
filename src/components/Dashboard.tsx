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
import { InGamePanel } from './InGamePanel';
import { InstallBanner, InstallHint } from './InstallBanner';
import { ProfilePanel } from './ProfilePanel';

type Hook = ReturnType<typeof useFridaState>;

const TAB_TITLES: Record<AppTab, { eyebrow: string; title: string }> = {
  gaming: { eyebrow: 'Gaming-mode', title: 'Session-log' },
  ingame: { eyebrow: 'In-game', title: 'Mens du spiller' },
  hverdag: { eyebrow: 'Hverdag-mode', title: 'Daglig kontrol' },
  udfordringer: { eyebrow: 'Udfordringer', title: 'Ordrer' },
  profil: { eyebrow: 'Profil', title: 'Frida' },
};

export function Dashboard({ api }: { api: Hook }) {
  const {
    state,
    performance,
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
        {(
          [
            ['gaming', 'Gaming'],
            ['ingame', 'In-game'],
            ['hverdag', 'Hverdag'],
            ['udfordringer', 'Udfordringer'],
            ['profil', 'Profil'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`mode-rail__btn ${tab === id ? 'is-active' : ''}`}
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="layout layout--modes">
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

      <BottomNav tab={tab} onChange={setTab} />
    </div>
  );
}
