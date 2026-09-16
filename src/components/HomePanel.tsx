import { getUnderwearById } from '../engines/underwearEngine';
import type {
  ActiveChallenge,
  DayMode,
  Intensity,
  PerformanceBand,
  PerformanceSnapshot,
  UnderwearPick,
} from '../types';

const BAND_DA: Record<PerformanceBand, string> = {
  poor: 'Dårlig',
  ok: 'Ok',
  good: 'God',
  godlike: 'Godlike',
};

type Props = {
  underwear: UnderwearPick | null;
  pointsBalance: number;
  performance: PerformanceSnapshot;
  intensity: Intensity;
  dayMode: DayMode;
  playingGame: string;
  activeChallenge: ActiveChallenge | null;
  inGameChallenge: ActiveChallenge | null;
  emergencyStop: boolean;
  onEmergencyStop: (on: boolean) => void;
  onGoChallenges: () => void;
  onGoInGame: () => void;
};

function buildNextLines(opts: {
  paused: boolean;
  activeChallenge: ActiveChallenge | null;
  inGameChallenge: ActiveChallenge | null;
  playingGame: string;
}): string[] {
  const lines: string[] = [];
  if (opts.paused) {
    lines.push('Nødstop er ON — alt er pauset. Slå fra når du er klar.');
    return lines.slice(0, 4);
  }
  if (opts.activeChallenge) {
    lines.push(`Udfordring: ${opts.activeChallenge.titleDa}`);
  } else {
    lines.push('Ingen aktiv udfordring — træk under Udfordringer.');
  }
  if (opts.inGameChallenge) {
    const game = opts.playingGame.trim();
    lines.push(
      game
        ? `In-game (${game}): ${opts.inGameChallenge.titleDa}`
        : `In-game: ${opts.inGameChallenge.titleDa}`,
    );
  } else if (opts.playingGame.trim()) {
    lines.push(`Spiller ${opts.playingGame.trim()} — åbn In-game når du er i match.`);
  } else {
    lines.push('Intet aktivt spil — sæt spil under Gaming hvis du starter en session.');
  }
  if (opts.activeChallenge?.kind === 'straf') {
    lines.push('Straf-ordre aktiv — klar den eller tag fail.');
  } else if (opts.activeChallenge?.kind === 'reward') {
    lines.push('Belønning klar — tag den mens den gælder.');
  }
  return lines.slice(0, 4);
}

export function HomePanel({
  underwear,
  pointsBalance,
  performance,
  intensity,
  dayMode,
  playingGame,
  activeChallenge,
  inGameChallenge,
  emergencyStop,
  onEmergencyStop,
  onGoChallenges,
  onGoInGame,
}: Props) {
  const item = underwear ? getUnderwearById(underwear.itemId) : undefined;
  const nextLines = buildNextLines({
    paused: emergencyStop,
    activeChallenge,
    inGameChallenge,
    playingGame,
  });
  const softHard =
    intensity === dayMode
      ? intensity === 'hard'
        ? 'Hard'
        : 'Soft'
      : `${intensity}/${dayMode}-dag`;

  return (
    <div className="mode-stack home-stack">
      <section className="panel panel--command panel--home-order">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Hoved · beording</p>
            <h2>På dig lige nu</h2>
          </div>
          <button
            type="button"
            className={`btn btn--estop-mini ${emergencyStop ? 'is-on' : ''}`}
            onClick={() => onEmergencyStop(!emergencyStop)}
            aria-pressed={emergencyStop}
            title="Nødstop"
          >
            {emergencyStop ? 'NØDSTOP ON' : 'NØDSTOP'}
          </button>
        </div>

        {emergencyStop && (
          <p className="banner banner--warn">Pauset — ingen nye ordrer før nødstop er af.</p>
        )}

        {!underwear && <p className="muted">Ingen beording endnu…</p>}

        {underwear && (
          <>
            <p className="command-line command-line--xl">{underwear.orderTextDa}</p>
            {item && (
              <p className="home-item-meta">
                <strong>{item.nameDa}</strong>
                <span className="muted"> · {item.category}</span>
                {item.colors.length > 0 && (
                  <span className="muted"> · {item.colors.slice(0, 3).join(', ')}</span>
                )}
              </p>
            )}
          </>
        )}
      </section>

      <section className="panel panel--home-status">
        <p className="eyebrow">Status</p>
        <div className="status-chips" role="list">
          <span className="status-chip" role="listitem">
            <span className="status-chip__k">Point</span>
            <strong>{pointsBalance}</strong>
          </span>
          <span
            className={`status-chip status-chip--band-${performance.band}`}
            role="listitem"
          >
            <span className="status-chip__k">Præst.</span>
            <strong>
              {BAND_DA[performance.band]}
              {performance.sessionCount > 0 ? ` ${performance.score}` : ''}
            </strong>
          </span>
          <span className="status-chip" role="listitem">
            <span className="status-chip__k">Mode</span>
            <strong>{softHard}</strong>
          </span>
          {playingGame.trim() ? (
            <span className="status-chip status-chip--game" role="listitem">
              <span className="status-chip__k">Spil</span>
              <strong>{playingGame.trim()}</strong>
            </span>
          ) : (
            <span className="status-chip status-chip--muted" role="listitem">
              <span className="status-chip__k">Spil</span>
              <strong>Ingen</strong>
            </span>
          )}
          {emergencyStop && (
            <span className="status-chip status-chip--estop" role="listitem">
              <span className="status-chip__k">Sikkerhed</span>
              <strong>NØDSTOP</strong>
            </span>
          )}
        </div>
      </section>

      <section className="panel panel--home-next">
        <p className="eyebrow">Nu</p>
        <h2 className="home-next-title">Hvad sker der</h2>
        <ol className="home-next-list">
          {nextLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <div className="home-next-links">
          {activeChallenge && (
            <button type="button" className="linkish" onClick={onGoChallenges}>
              Åbn udfordring →
            </button>
          )}
          {inGameChallenge && (
            <button type="button" className="linkish" onClick={onGoInGame}>
              Åbn in-game →
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
