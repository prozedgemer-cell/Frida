import { useEffect, useState } from 'react';
import { TEMPLATE_COUNT } from '../data/challenges';
import { UNDERWEAR_CATALOG } from '../data/underwear';
import { estimateVariationSpace } from '../engines/challengeEngine';
import type { useFridaState } from '../hooks/useFridaState';
import { BottomNav, type AppTab } from './BottomNav';
import { ChallengeCard } from './ChallengeCard';
import { ContextControls } from './ContextControls';
import { EmergencyStop } from './EmergencyStop';
import { InstallBanner, InstallHint } from './InstallBanner';
import { ProfilePanel } from './ProfilePanel';
import { UnderwearOrder } from './UnderwearOrder';

type Hook = ReturnType<typeof useFridaState>;

export function Dashboard({ api }: { api: Hook }) {
  const { state, ensureChallenges, refreshChallenges, resolveChallenge } = api;
  const [tab, setTab] = useState<AppTab>('hjem');
  const variation = estimateVariationSpace();
  const now = new Date();
  const timeLabel = now.toLocaleString('da-DK', {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  useEffect(() => {
    ensureChallenges();
  }, [ensureChallenges]);

  useEffect(() => {
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
          </p>
        </div>
        <div className="topbar__stats">
          <div>
            <strong>{UNDERWEAR_CATALOG.length}</strong>
            <span>undertøj</span>
          </div>
          <div>
            <strong>{TEMPLATE_COUNT}</strong>
            <span>skabeloner</span>
          </div>
        </div>
      </header>

      <InstallBanner />

      <EmergencyStop active={state.emergencyStop} onToggle={api.setEmergencyStop} />

      <div className="layout">
        <div className="layout__main">
          <div className={`tab-panel ${tab === 'hjem' ? 'is-active' : ''}`} data-tab="hjem">
            <UnderwearOrder
              pick={state.underwearToday}
              paused={state.emergencyStop}
              onReroll={api.rerollUnderwear}
            />
          </div>

          <div
            className={`tab-panel ${tab === 'udfordring' ? 'is-active' : ''}`}
            data-tab="udfordring"
          >
            <section className="panel">
              <div className="panel__head">
                <div>
                  <p className="eyebrow">Challenges</p>
                  <h2>Dagens ordrer</h2>
                </div>
                <button
                  type="button"
                  className="btn btn--secondary"
                  disabled={state.emergencyStop}
                  onClick={() => refreshChallenges(3)}
                >
                  Nye challenges
                </button>
              </div>
              <div className="challenge-list">
                {state.activeChallenges.map((c) => (
                  <ChallengeCard
                    key={c.id}
                    challenge={c}
                    paused={state.emergencyStop}
                    onResolve={resolveChallenge}
                  />
                ))}
                {!state.activeChallenges.length && (
                  <p className="muted">
                    Ingen aktive challenges — prøv at slå themes til eller refresh.
                  </p>
                )}
              </div>
            </section>

            {state.challengeLog.length > 0 && (
              <section className="panel">
                <p className="eyebrow">Log</p>
                <h2>Seneste resultater</h2>
                <ul className="log">
                  {state.challengeLog.slice(0, 8).map((e) => (
                    <li key={e.id}>
                      <span className={`pill pill--${e.outcome}`}>{e.outcome}</span>
                      <span>{e.titleDa}</span>
                      <time dateTime={e.at}>
                        {new Date(e.at).toLocaleString('da-DK', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </time>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        <aside className="layout__side">
          <div className={`tab-panel ${tab === 'hjem' ? 'is-active' : ''}`} data-tab="hjem">
            <ContextControls
              context={state.context}
              onChange={api.updateContext}
              disabled={state.emergencyStop}
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
        </aside>
      </div>

      <BottomNav tab={tab} onChange={setTab} />
    </div>
  );
}
