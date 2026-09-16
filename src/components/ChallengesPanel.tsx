import type { ActiveChallenge, ChallengeLogEntry, ChallengeOutcome } from '../types';
import { ChallengeCard } from './ChallengeCard';

type Props = {
  active: ActiveChallenge[];
  log: ChallengeLogEntry[];
  paused: boolean;
  onRefresh: () => void;
  onResolve: (id: string, outcome: ChallengeOutcome) => void;
};

export function ChallengesPanel({ active, log, paused, onRefresh, onResolve }: Props) {
  return (
    <div className="mode-stack">
      <section className="panel panel--mode panel--challenges">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Mode · Udfordringer</p>
            <h2>Træk · fuldfør · skip · fail</h2>
          </div>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={paused}
            onClick={onRefresh}
          >
            Nye challenges
          </button>
        </div>
        <p className="muted tiny">
          Aktive ordrer til Frida. Nødstop pauser alle handlinger. Historik gemmes lokalt.
        </p>
        <div className="challenge-list">
          {active.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              paused={paused}
              onResolve={onResolve}
            />
          ))}
          {!active.length && (
            <p className="muted">
              Ingen aktive challenges — prøv at slå themes til under Profil, eller træk nye.
            </p>
          )}
        </div>
      </section>

      {log.length > 0 && (
        <section className="panel">
          <p className="eyebrow">Historik</p>
          <h2>Seneste resultater</h2>
          <ul className="log">
            {log.slice(0, 12).map((e) => (
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
  );
}
