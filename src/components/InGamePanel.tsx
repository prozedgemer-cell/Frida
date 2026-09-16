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
            <p className="eyebrow">{embedded ? 'Sektion · In-game' : 'Mode · In-game'}</p>
            <h2>Udfordring mens du spiller</h2>
          </div>
          {!embedded && (
            <div className="points-chip">
              <strong>{pointsBalance}</strong>
              <span>point</span>
            </div>
          )}
        </div>
        <p className="muted tiny">
          Ordrer <strong>i spillet / mellem runder</strong>. Fuldfør = bonuspoint. Efter match: log
          KDA + sejr/nederlag ovenfor.
        </p>
        <div className="perf-banner perf-banner--compact">
          <span className="tiny">
            Præstation {performance.score}/100 · {performance.band}
            {playingGame.trim() ? ` · spiller ${playingGame.trim()}` : ' · intet spil sat'}
          </span>
        </div>
      </section>

      <section className="panel panel--command">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Aktiv in-game</p>
            <h2>{challenge ? challenge.titleDa : 'Ingen aktiv'}</h2>
          </div>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={paused}
            onClick={onDraw}
          >
            Ny in-game
          </button>
        </div>
        {paused && <p className="banner banner--warn">Pauset af nødstop</p>}
        {!challenge && <p className="muted">Træk en in-game-udfordring for at starte.</p>}
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
                Fuldført (+point)
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
