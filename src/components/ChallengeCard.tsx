import type { ActiveChallenge, ChallengeOutcome } from '../types';

type Props = {
  challenge: ActiveChallenge;
  paused: boolean;
  onResolve: (id: string, outcome: ChallengeOutcome) => void;
};

export function ChallengeCard({ challenge, paused, onResolve }: Props) {
  return (
    <article className={`challenge ${challenge.status === 'paused' || paused ? 'challenge--paused' : ''}`}>
      <div className="challenge__tags">
        {challenge.themes.map((t) => (
          <span key={t} className="tag">
            {t}
          </span>
        ))}
        <span className={`tag tag--${challenge.intensity}`}>{challenge.intensity}</span>
      </div>
      <h3>{challenge.titleDa}</h3>
      <p>{challenge.bodyDa}</p>
      <div className="challenge__actions">
        <button
          type="button"
          className="btn btn--ok"
          disabled={paused}
          onClick={() => onResolve(challenge.id, 'complete')}
        >
          Fuldført
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={paused}
          onClick={() => onResolve(challenge.id, 'skip')}
        >
          Spring over
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={paused}
          onClick={() => onResolve(challenge.id, 'fail')}
        >
          Fejlet
        </button>
      </div>
    </article>
  );
}
