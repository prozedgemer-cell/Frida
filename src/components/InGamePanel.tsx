import type {
  ActiveChallenge,
  ChallengeLogEntry,
  ChallengeOutcome,
  ContextState,
  PerformanceSnapshot,
} from '../types';
import type { GamePresetId } from '../data/gameProfiles';

type Props = {
  challenge: ActiveChallenge | null;
  log: ChallengeLogEntry[];
  performance: PerformanceSnapshot;
  pointsBalance: number;
  playingGame: string;
  activeGameId?: GamePresetId;
  paused: boolean;
  onDraw: () => void;
  onResolve: (outcome: ChallengeOutcome) => void;
  onChangeContext?: (patch: Partial<ContextState>) => void;
  /** When true, skip duplicate game picker — lives inside Gaming tab. */
  embedded?: boolean;
};

export function InGamePanel({
  challenge,
  log,
  performance,
  pointsBalance,
  playingGame,
  paused,
  onDraw,
  onResolve,
  embedded,
}: Props) {
  const ingameLog = log.filter((e) => e.kind === 'ingame').slice(0, 8);

  return (
    <div className={embedded ? 'mode-stack mode-stack--embedded' : 'mode-stack'}>
      <section className="panel panel--mode panel--ingame">
        <div className="panel__head">
          <div>
            <p className="eyebrow">{embedded ? 'Section · In-game' : 'Mode · In-game'}</p>
            <h2>Challenge while you play</h2>
          </div>
          {!embedded && (
            <div className="points-chip">
              <strong>{pointsBalance}</strong>
              <span>pts</span>
            </div>
          )}
        </div>
        <p className="muted tiny">
          Orders <strong>in-game / between rounds</strong>. Complete = bonus points. After a match:
          log KDA + win/loss above.
        </p>
        <div className="perf-banner perf-banner--compact">
          <span className="tiny">
            Performance {performance.score}/100 · {performance.band}
            {playingGame.trim() ? ` · playing ${playingGame.trim()}` : ' · no game set'}
          </span>
        </div>
      </section>

      <section className="panel panel--command">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Active in-game</p>
            <h2>{challenge ? challenge.titleDa : 'None active'}</h2>
          </div>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={paused}
            onClick={onDraw}
          >
            New in-game
          </button>
        </div>
        {paused && <p className="banner banner--warn">Paused by emergency stop</p>}
        {!challenge && <p className="muted">Draw an in-game challenge to start.</p>}
        {challenge && (
          <>
            <div className="challenge__tags">
              <span className="tag">ingame</span>
              <span className={`tag tag--${challenge.intensity}`}>{challenge.intensity}</span>
              {challenge.bonusPoints != null && (
                <span className="tag tag--bonus">+{challenge.bonusPoints} pt</span>
              )}
              {challenge.penaltyPoints != null && (
                <span className="tag tag--penalty">−{challenge.penaltyPoints} pt</span>
              )}
            </div>
            <p className="command-line">{challenge.bodyDa}</p>
            {challenge.performanceInfluenceDa && (
              <p className="influence-note">{challenge.performanceInfluenceDa}</p>
            )}
            <div className="challenge__actions">
              <button
                type="button"
                className="btn btn--ok"
                disabled={paused}
                onClick={() => onResolve('complete')}
              >
                Complete (+pts)
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={paused}
                onClick={() => onResolve('skip')}
              >
                Spring over
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={paused}
                onClick={() => onResolve('fail')}
              >
                Fejlet (−point)
              </button>
            </div>
          </>
        )}
      </section>

      {ingameLog.length > 0 && (
        <section className="panel">
          <p className="eyebrow">In-game historik</p>
          <ul className="log">
            {ingameLog.map((e) => (
              <li key={e.id}>
                <span className={`pill pill--${e.outcome}`}>{e.outcome}</span>
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
