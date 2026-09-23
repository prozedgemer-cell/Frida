import type { ActiveChallenge, ChallengeOutcome } from '../types';

type Props = {
  challenge: ActiveChallenge;
  paused: boolean;
  onResolve: (id: string, outcome: ChallengeOutcome) => void;
};

export function ChallengeCard({ challenge, paused, onResolve }: Props) {
  const isStraf = challenge.kind === 'straf';
  const isReward = challenge.kind === 'reward';

  return (
    <article
      className={`challenge ${challenge.status === 'paused' || paused ? 'challenge--paused' : ''} ${isStraf ? 'challenge--straf' : ''} ${isReward ? 'challenge--reward' : ''}`}
    >
      <div className="challenge__tags">
        {challenge.themes.map((t) => (
          <span key={t} className="tag">
            {t}
          </span>
        ))}
        <span className={`tag tag--${challenge.intensity}`}>{challenge.intensity}</span>
        {isStraf && <span className="tag tag--straf">punishment</span>}
        {isReward && <span className="tag tag--reward">reward</span>}
        {challenge.kind === 'tease' && <span className="tag">tease</span>}
      </div>
      <h3>{challenge.titleDa}</h3>
      <p>{challenge.bodyDa}</p>
      {challenge.performanceInfluenceDa && (
        <p className="influence-note">{challenge.performanceInfluenceDa}</p>
      )}
      <div className="challenge__actions">
        <button
          type="button"
          className="btn btn--ok"
          disabled={paused}
          onClick={() => onResolve(challenge.id, 'complete')}
        >
          Complete
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={paused}
          onClick={() => onResolve(challenge.id, 'skip')}
        >
          Skip
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={paused}
          onClick={() => onResolve(challenge.id, 'fail')}
        >
          Fail
        </button>
      </div>
    </article>
  );
}
