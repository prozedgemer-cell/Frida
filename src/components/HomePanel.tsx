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
  MorningTrioState,
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
  sexActive: SexStrafInstance | null;
  sexDue: SexStrafDue;
  calendarToday: CalendarSummary;
  morningTrio: MorningTrioState | null;
};

function buildNextLines(opts: {
  paused: boolean;
  activeChallenge: ActiveChallenge | null;
  inGameChallenge: ActiveChallenge | null;
  playingGame: string;
  sexActive: SexStrafInstance | null;
  sexDue: SexStrafDue;
  calendarToday: CalendarSummary;
  morningLeft: number;
}): string[] {
  const lines: string[] = [];
  if (opts.paused) {
    lines.push('Nødstop ON — alt pauset.');
    return lines;
  }
  if (opts.morningLeft) {
    lines.push(`Morgen-trio: ${opts.morningLeft} DO/WEAR tilbage`);
  }
  const sexPending =
    opts.sexActive &&
    (opts.sexActive.status === 'pending' || opts.sexActive.status === 'active');
  if (sexPending && opts.sexActive) {
    lines.push(
      `Sex-straf ${opts.sexActive.status === 'active' ? 'aktiv' : 'afventer'}: ${opts.sexActive.titleDa}`,
    );
  } else if (opts.sexDue.due) {
    lines.push('Sex-straf er due — åbn Sex.');
  }
  if (opts.calendarToday.entries.length) {
    lines.push(`Kalender: ${opts.calendarToday.headlineDa}`);
  }
  if (opts.activeChallenge && !opts.activeChallenge.morningTier) {
    lines.push(`Udfordring: ${opts.activeChallenge.titleDa}`);
  }
  if (opts.inGameChallenge) {
    const game = opts.playingGame.trim();
    lines.push(
      game
        ? `I spil (${game}): ${opts.inGameChallenge.titleDa}`
        : `I spil: ${opts.inGameChallenge.titleDa}`,
    );
  } else if (opts.playingGame.trim()) {
    lines.push(`Spiller ${opts.playingGame.trim()} — log under Gaming.`);
  }
  if (!lines.length) {
    lines.push('Intet akut — tjek Gaming eller Kalender når du er klar.');
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
  onGoChallenges,
  onGoSex,
  onGoCalendar,
  onGoGaming,
  sexActive,
  sexDue,
  calendarToday,
  morningTrio,
}: Props) {
  const item = underwear ? getUnderwearById(underwear.itemId) : undefined;
  const morningLeft =
    morningTrio?.challenges.filter((c) => c.status === 'active').length ?? 0;
  const nextLines = buildNextLines({
    paused: emergencyStop,
    activeChallenge,
    inGameChallenge,
    playingGame,
    sexActive,
    sexDue,
    calendarToday,
    morningLeft,
  });
  const softHard =
    intensity === dayMode
      ? intensity === 'hard'
        ? 'Hard'
        : 'Soft'
      : `${intensity}/${dayMode}-dag`;
  const sexPending =
    !!sexActive && (sexActive.status === 'pending' || sexActive.status === 'active');

  return (
    <div className="mode-stack home-stack">
      <section className="panel panel--command panel--home-order">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Tøj · role</p>
            <h2>{underwear?.roleNameDa ? underwear.roleNameDa : 'På dig nu'}</h2>
          </div>
          {(sexPending || sexDue.due) && (
            <button type="button" className="sex-pill-badge" onClick={onGoSex}>
              <i className="nav-badge" aria-hidden />
              Sex
            </button>
          )}
        </div>

        {emergencyStop && (
          <p className="banner banner--warn">Pauset — nødstop er ON.</p>
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
              </p>
            )}
            <p className="tiny muted">{WEIGHT_FORMULA_DA}</p>
          </>
        )}

        <ImageGallery
          slot="outfit"
          titleDa="Egne outfit-fotos"
          hintDa="Upload looks fra telefonen — gemmes kun lokalt (IndexedDB)."
        />
      </section>

      <section className="panel panel--home-status">
        <p className="eyebrow">Status</p>
        <div className="status-chips" role="list">
          <span className="status-chip" role="listitem">
            <span className="status-chip__k">Point</span>
            <strong>{pointsBalance}</strong>
          </span>
          <span className={`status-chip status-chip--band-${performance.band}`} role="listitem">
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
          ) : null}
          {emergencyStop && (
            <span className="status-chip status-chip--estop" role="listitem">
              <span className="status-chip__k">Sikkerhed</span>
              <strong>NØDSTOP</strong>
            </span>
          )}
          {(sexPending || sexDue.due) && (
            <button
              type="button"
              className="status-chip status-chip--sex"
              role="listitem"
              onClick={onGoSex}
            >
              <span className="status-chip__k">Sex-straf</span>
              <strong>{sexActive?.status === 'active' ? 'Aktiv' : sexPending ? 'Afventer' : 'Due'}</strong>
            </button>
          )}
          {morningLeft > 0 && (
            <button
              type="button"
              className="status-chip"
              role="listitem"
              onClick={onGoChallenges}
            >
              <span className="status-chip__k">Morgen</span>
              <strong>{morningLeft}/3</strong>
            </button>
          )}
        </div>
      </section>

      <section className="panel panel--home-next">
        <p className="eyebrow">Nu</p>
        <h2 className="home-next-title">Hvad sker der</h2>
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
          {morningLeft > 0 && (
            <button type="button" className="linkish" onClick={onGoChallenges}>
              Morgen-trio →
            </button>
          )}
          {calendarToday.entries.length > 0 && (
            <button type="button" className="linkish" onClick={onGoCalendar}>
              Åbn kalender →
            </button>
          )}
          {playingGame.trim() && (
            <button type="button" className="linkish" onClick={onGoGaming}>
              Gaming →
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
