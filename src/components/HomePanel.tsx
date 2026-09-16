import { getUnderwearById } from '../engines/underwearEngine';
import { WEIGHT_FORMULA_DA } from '../engines/weightBlend';
import { OutfitHero } from './OutfitHero';
import { OutfitLayers } from './OutfitLayers';
import { CalendarInfluenceNote } from './CalendarInfluenceNote';
import { ImageGallery } from './ImageGallery';
import type { CalendarSummary } from '../engines/calendarEngine';
import type { SexStrafDue } from '../engines/sexStrafEngine';
import type {
  ActiveChallenge,
  DayMode,
  Intensity,
  PerformanceBand,
  PerformanceSnapshot,
  SexStrafInstance,
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
  onGoChallenges: () => void;
  onGoSex: () => void;
  onGoCalendar: () => void;
  onGoGaming: () => void;
  onReroll: () => void;
  sexActive: SexStrafInstance | null;
  sexDue: SexStrafDue;
  calendarToday: CalendarSummary;
  morningPending: number;
};

function buildNextLines(opts: {
  paused: boolean;
  activeChallenge: ActiveChallenge | null;
  inGameChallenge: ActiveChallenge | null;
  playingGame: string;
  sexActive: SexStrafInstance | null;
  sexDue: SexStrafDue;
  calendarToday: CalendarSummary;
  morningPending: number;
}): string[] {
  const lines: string[] = [];
  if (opts.paused) {
    lines.push('Nødstop er ON — alt er pauset. Slå fra når du er klar.');
    return lines.slice(0, 4);
  }
  const sexPending =
    opts.sexActive &&
    (opts.sexActive.status === 'pending' || opts.sexActive.status === 'active');
  if (sexPending && opts.sexActive) {
    lines.push(
      `Sex-straf ${opts.sexActive.status === 'active' ? 'aktiv' : 'afventer'}: ${opts.sexActive.titleDa}`,
    );
  } else if (opts.sexDue.due) {
    lines.push('Sex-straf er due — kræv den under Sex.');
  }
  if (opts.morningPending) {
    lines.push(`Morgen-trio: ${opts.morningPending} DO/WEAR tilbage i dag`);
  }
  if (opts.calendarToday.entries.length) {
    lines.push(`Kalender: ${opts.calendarToday.headlineDa}`);
  }
  if (opts.activeChallenge) {
    lines.push(`Udfordring: ${opts.activeChallenge.titleDa}`);
  }
  if (opts.inGameChallenge) {
    const game = opts.playingGame.trim();
    lines.push(
      game
        ? `In-game (${game}): ${opts.inGameChallenge.titleDa}`
        : `In-game: ${opts.inGameChallenge.titleDa}`,
    );
  } else if (opts.playingGame.trim()) {
    lines.push(`Spiller ${opts.playingGame.trim()} — log KDA under Gaming.`);
  }
  return lines.slice(0, 5);
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
  onGoChallenges,
  onGoSex,
  onGoCalendar,
  onGoGaming,
  onReroll,
  sexActive,
  sexDue,
  calendarToday,
  morningPending,
}: Props) {
  const item = underwear ? getUnderwearById(underwear.itemId) : undefined;
  const nextLines = buildNextLines({
    paused: emergencyStop,
    activeChallenge,
    inGameChallenge,
    playingGame,
    sexActive,
    sexDue,
    calendarToday,
    morningPending,
  });
  const softHard =
    intensity === dayMode
      ? intensity === 'hard'
        ? 'Hard'
        : 'Soft'
      : `${intensity}/${dayMode}-dag`;
  const sexPending =
    !!sexActive && (sexActive.status === 'pending' || sexActive.status === 'active');
  const now = new Date();
  const greetDate = now.toLocaleDateString('da-DK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const clock = now.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="mode-stack home-stack">
      <div className="dash-cards">
        <button type="button" className="dash-card dash-card--today" onClick={onGoCalendar}>
          <span className="dash-card__k">I dag</span>
          <strong>{underwear?.roleNameDa ?? underwear?.lookNameDa ?? 'Outfit'}</strong>
          <span>{clock} · {greetDate}</span>
        </button>
        {(sexPending || sexDue.due) && (
          <button type="button" className="dash-card dash-card--hot" onClick={onGoSex}>
            <span className="dash-card__k">Sex-straf</span>
            <strong>{sexActive?.status === 'active' ? 'Aktiv' : sexPending ? 'Afventer' : 'Due'}</strong>
            <span>{sexActive?.titleDa ?? 'Kræv under Sex'}</span>
          </button>
        )}
        {calendarToday.entries.length > 0 && !sexPending && !sexDue.due && (
          <button type="button" className="dash-card dash-card--cal" onClick={onGoCalendar}>
            <span className="dash-card__k">Kalender</span>
            <strong>{calendarToday.timedLabels[0] ?? calendarToday.entries[0]?.titleDa}</strong>
            <span>{calendarToday.headlineDa}</span>
          </button>
        )}
      </div>
      <section className="panel panel--command panel--home-order">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Fuldt outfit · role</p>
            <h2>{underwear?.roleNameDa ? underwear.roleNameDa : 'På dig lige nu'}</h2>
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--tiny"
            onClick={onReroll}
            disabled={emergencyStop}
          >
            Reroll
          </button>
        </div>

        {emergencyStop && (
          <p className="banner banner--warn">Pauset — ingen nye ordrer før nødstop er af.</p>
        )}

        {!underwear && <p className="muted">Ingen beording endnu…</p>}

        {underwear && (
          <>
            <OutfitHero
              imageFile={underwear.imageFile}
              captionDa={underwear.lookNameDa ?? underwear.roleNameDa}
              altDa={underwear.lookNameDa ?? underwear.roleNameDa ?? 'Dagens outfit'}
            />
            <p className="command-line command-line--xl">{underwear.orderTextDa}</p>
            <OutfitLayers layers={underwear.layers} />
            {item && !underwear.layers?.length && (
              <p className="home-item-meta">
                <strong>{item.nameDa}</strong>
                <span className="muted"> · {item.category}</span>
                {item.colors.length > 0 && (
                  <span className="muted"> · {item.colors.slice(0, 3).join(', ')}</span>
                )}
              </p>
            )}
            {underwear.performanceInfluenceDa && (
              <p className="influence-note">{underwear.performanceInfluenceDa}</p>
            )}
            <p className="tiny muted">{WEIGHT_FORMULA_DA}</p>
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
          {underwear?.roleNameDa && (
            <span className="status-chip" role="listitem">
              <span className="status-chip__k">Role</span>
              <strong>{underwear.roleNameDa}</strong>
            </span>
          )}
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
          {sexPending && (
            <span className="status-chip status-chip--sex" role="listitem">
              <span className="status-chip__k">Sex-straf</span>
              <strong>Aktiv</strong>
            </span>
          )}
          {morningPending > 0 && (
            <span className="status-chip" role="listitem">
              <span className="status-chip__k">Morgen</span>
              <strong>{morningPending}/3</strong>
            </span>
          )}
        </div>
      </section>

      <section className="panel panel--home-next">
        <p className="eyebrow">Nu</p>
        <h2 className="home-next-title">Hvad sker der</h2>
        {(sexPending || sexDue.due) && (
          <button type="button" className="sex-pill-badge" onClick={onGoSex}>
            <i className="nav-badge" aria-hidden />
            Sex-straf {sexActive?.status === 'active' ? 'aktiv' : sexPending ? 'afventer' : 'due'}
          </button>
        )}
        <CalendarInfluenceNote calendar={calendarToday} compact />
        <ol className="home-next-list sched-list">
          {nextLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <div className="home-next-links">
          {(sexPending || sexDue.due) && (
            <button type="button" className="linkish" onClick={onGoSex}>
              Åbn sex-straf →
            </button>
          )}
          {calendarToday.entries.length > 0 && (
            <button type="button" className="linkish" onClick={onGoCalendar}>
              Åbn kalender →
            </button>
          )}
          {(activeChallenge || morningPending > 0) && (
            <button type="button" className="linkish" onClick={onGoChallenges}>
              Åbn udfordring →
            </button>
          )}
          <button type="button" className="linkish" onClick={onGoGaming}>
            Gaming-log →
          </button>
        </div>
      </section>

      <section className="panel panel--muted">
        <ImageGallery
          slot="outfit"
          titleDa="Outfit-fotos"
          hintDa="Egne billeder til dagens look. Kun på denne enhed."
        />
      </section>
    </div>
  );
}
