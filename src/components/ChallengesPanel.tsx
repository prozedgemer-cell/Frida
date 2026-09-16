import type {
  ActiveChallenge,
  ChallengeLogEntry,
  ChallengeOutcome,
  MorningTrioState,
  PerformanceSnapshot,
} from '../types';
import { WEIGHT_FORMULA_DA } from '../engines/weightBlend';
import type { CalendarSummary } from '../engines/calendarEngine';
import { CalendarInfluenceNote } from './CalendarInfluenceNote';
import { ChallengeCard } from './ChallengeCard';

type Props = {
  active: ActiveChallenge[];
  log: ChallengeLogEntry[];
  performance: PerformanceSnapshot;
  calendarToday?: CalendarSummary | null;
  paused: boolean;
  onRefresh: () => void;
  onResolve: (id: string, outcome: ChallengeOutcome) => void;
  onGoInGame?: () => void;
  morningTrio?: MorningTrioState | null;
};

export function ChallengesPanel({
  active,
  log,
  performance,
  calendarToday,
  paused,
  onRefresh,
  onResolve,
  onGoInGame,
  morningTrio,
}: Props) {
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
          Aktive ordrer til Frida. {WEIGHT_FORMULA_DA} Gaming nu {performance.score}/100 ·{' '}
          {performance.band}. Morgen-trio er DO/WEAR only.
          {morningTrio?.challenges.length
            ? ` I dag: ${morningTrio.challenges.length} morgen-udfordringer.`
            : ''}{' '}
          Nødstop pauser alle handlinger.
        </p>
        <CalendarInfluenceNote calendar={calendarToday} compact />
        {performance.sessionCount > 0 && (
          <p className="influence-note">
            {performance.band === 'poor'
              ? 'Fordi din sidste session var svag: flere straf-/ydmygelses-udfordringer.'
              : performance.band === 'good' || performance.band === 'godlike'
                ? 'Fordi din sidste session gik godt: flere belønnings-/tease-udfordringer.'
                : 'Middel præstation: blandet pool.'}
          </p>
        )}
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
        {onGoInGame && (
          <p className="tiny muted" style={{ marginTop: '0.75rem' }}>
            Vil du have noget <strong>mens du spiller</strong>?{' '}
            <button type="button" className="linkish" onClick={onGoInGame}>
              Åbn In-game
            </button>
          </p>
        )}
      </section>

      {log.length > 0 && (
        <section className="panel">
          <p className="eyebrow">Historik</p>
          <h2>Seneste resultater</h2>
          <ul className="log">
            {log.slice(0, 12).map((e) => (
              <li key={e.id}>
                <span className={`pill pill--${e.outcome}`}>{e.outcome}</span>
                {e.kind === 'straf' && <span className="tag tag--straf">straf</span>}
                {e.kind === 'ingame' && <span className="tag">ingame</span>}
                <span>{e.titleDa}</span>
                {e.pointsDelta != null && e.pointsDelta !== 0 && (
                  <span className={e.pointsDelta > 0 ? 'pts-pos' : 'pts-neg'}>
                    {e.pointsDelta > 0 ? '+' : ''}
                    {e.pointsDelta}
                  </span>
                )}
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
