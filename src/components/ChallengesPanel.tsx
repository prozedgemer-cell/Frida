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

const TIER_EN = {
  easy: 'Easy',
  hard: 'Hard',
  boundary: 'Boundary',
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
    <div className="mode-stack challenges-embedded">
      {morningTrio && morningTrio.challenges.length > 0 && (
        <section className="panel panel--morning-trio">
          <div className="panel__head">
            <div>
              <p className="eyebrow">Every morning · exactly 3</p>
              <h2>Morning trio (DO / WEAR)</h2>
            </div>
          </div>
          <p className="muted tiny">
            Easy · hard · boundary-breaking. DO / WEAR only — never “say…” or “write…”. Applies all
            day.
          </p>
          <div className="morning-trio-list">
            {morningTrio.challenges.map((c) => (
              <div key={c.id} className="morning-trio-item">
                {c.morningTier && (
                  <span className={`tag tag--tier-${c.morningTier}`}>
                    {TIER_EN[c.morningTier]}
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
            <p className="eyebrow">Active orders</p>
            <h2>Draw · complete · skip · fail</h2>
          </div>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={paused}
            onClick={onRefresh}
          >
            New challenges
          </button>
        </div>
        <p className="muted tiny">
          Extra orders beyond the morning trio. {WEIGHT_FORMULA_DA} Gaming now {performance.score}
          /100 · {performance.band}.
        </p>
        <CalendarInfluenceNote calendar={calendarToday} compact />
        {performance.sessionCount > 0 && (
          <p className="influence-note">
            {performance.band === 'poor'
              ? 'Because your last session was weak: more punishment / humiliation challenges.'
              : performance.band === 'good' || performance.band === 'godlike'
                ? 'Because your last session went well: more reward / tease challenges.'
                : 'Mid performance: mixed pool.'}
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
            <p className="muted">No extra challenges — draw new ones, or check themes under Profile.</p>
          )}
        </div>
      </section>

      {log.length > 0 && (
        <section className="panel">
          <p className="eyebrow">History</p>
          <h2>Recent challenges</h2>
          <ul className="log">
            {log.slice(0, 12).map((e) => (
              <li key={e.id}>
                <span
                  className={`pill pill--${e.outcome === 'complete' ? 'complete' : e.outcome === 'fail' ? 'fail' : 'skip'}`}
                >
                  {e.outcome}
                </span>
                <span>{e.titleDa}</span>
                {e.pointsDelta != null && e.pointsDelta !== 0 && (
                  <span className={e.pointsDelta > 0 ? 'pts-pos' : 'pts-neg'}>
                    {e.pointsDelta > 0 ? '+' : ''}
                    {e.pointsDelta}
                  </span>
                )}
                <time dateTime={e.at}>
                  {new Date(e.at).toLocaleString('en-GB', {
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
