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

const TIER_DA = {
  easy: 'Let',
  hard: 'Hård',
  boundary: 'Grænse',
} as const;

type Props = {
  active: ActiveChallenge[];
  log: ChallengeLogEntry[];
  performance: PerformanceSnapshot;
  calendarToday?: CalendarSummary | null;
  paused: boolean;
  onRefresh: () => void;
  onResolve: (id: string, outcome: ChallengeOutcome) => void;
  morningTrio?: MorningTrioState | null;
  onResolveMorning?: (id: string, outcome: ChallengeOutcome) => void;
};

export function ChallengesPanel({
  active,
  log,
  performance,
  calendarToday,
  paused,
  onRefresh,
  onResolve,
  morningTrio,
  onResolveMorning,
}: Props) {
  const extra = active.filter((c) => !c.morningTier);
  const morningIds = new Set(morningTrio?.challenges.map((c) => c.id) ?? []);
  const extraUnique = extra.filter((c) => !morningIds.has(c.id));

  return (
    <div className="mode-stack">
      {morningTrio && morningTrio.challenges.length > 0 && (
        <section className="panel panel--morning-trio">
          <div className="panel__head">
            <div>
              <p className="eyebrow">Hver morgen · præcis 3</p>
              <h2>Morgen-trio (DO / WEAR)</h2>
            </div>
          </div>
          <p className="muted tiny">
            Let · hård · grænsebrydende. Kun gøre/bære — aldrig sige eller skrive. Gælder hele
            dagen. Dansk Frida-stemme.
          </p>
          <div className="morning-trio-list">
            {morningTrio.challenges.map((c) => (
              <div key={c.id} className="morning-trio-item">
                {c.morningTier && (
                  <span className={`tag tag--tier-${c.morningTier}`}>
                    {TIER_DA[c.morningTier]}
                  </span>
                )}
                <ChallengeCard
                  challenge={c}
                  paused={paused || c.status === 'paused'}
                  onResolve={onResolveMorning ?? onResolve}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="panel panel--mode panel--challenges">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Aktive ordrer</p>
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
          Ekstra ordrer ud over morgen-trio. {WEIGHT_FORMULA_DA} Gaming nu {performance.score}/100 ·{' '}
          {performance.band}.
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
          {extraUnique.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              paused={paused}
              onResolve={onResolve}
            />
          ))}
          {!extraUnique.length && (
            <p className="muted">Ingen ekstra challenges — træk nye, eller tjek themes under Profil.</p>
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
