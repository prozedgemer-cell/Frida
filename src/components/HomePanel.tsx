import { getUnderwearById } from '../engines/underwearEngine';
import { WEIGHT_FORMULA_DA } from '../engines/weightBlend';
import { OutfitHero } from './OutfitHero';
import { OutfitLayers } from './OutfitLayers';
import { CalendarInfluenceNote } from './CalendarInfluenceNote';
import type { CalendarSummary } from '../engines/calendarEngine';
import type { SexStrafDue } from '../engines/sexStrafEngine';
import type {
  ActiveChallenge,
  DayMode,
  Intensity,
  IrlStatus,
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

const IRL: { value: IrlStatus; label: string }[] = [
  { value: 'home', label: 'Hjemme' },
  { value: 'alone', label: 'Alene' },
  { value: 'out', label: 'Ude' },
  { value: 'work', label: 'Arbejde' },
  { value: 'public', label: 'Offentligt' },
];

type Props = {
  underwear: UnderwearPick | null;
  pointsBalance: number;
  performance: PerformanceSnapshot;
  intensity: Intensity;
  dayMode: DayMode;
  playingGame: string;
  irlStatus: IrlStatus;
  activeChallenge: ActiveChallenge | null;
  inGameChallenge: ActiveChallenge | null;
  emergencyStop: boolean;
  onGoChallenges: () => void;
  onGoSex: () => void;
  onGoCalendar: () => void;
  onGoGaming: () => void;
  onGoProfil: () => void;
  onIrl: (irl: IrlStatus) => void;
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
  return lines.slice(0, 4);
}

export function HomePanel({
  underwear,
  pointsBalance,
  performance,
  intensity,
  dayMode,
  playingGame,
  irlStatus,
  activeChallenge,
  inGameChallenge,
  emergencyStop,
  onGoChallenges,
  onGoSex,
  onGoCalendar,
  onGoGaming,
  onGoProfil,
  onIrl,
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
  const now = new Date();
  const greetDate = now.toLocaleDateString('da-DK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const clock = now.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' });
  const sexPending =
    !!sexActive && (sexActive.status === 'pending' || sexActive.status === 'active');

  return (
    <div className="mode-stack home-stack">
      <div className="dash-cards">
        <button type="button" className="dash-card dash-card--today" onClick={onGoCalendar}>
          <span className="dash-card__k">I dag</span>
          <strong>{underwear?.roleNameDa ?? underwear?.lookNameDa ?? 'Outfit'}</strong>
          <span>{clock} · {greetDate}</span>
        </button>
        {(sexPending || sexDue.due) ? (
          <button type="button" className="dash-card dash-card--hot" onClick={onGoSex}>
            <span className="dash-card__k">Sex-straf</span>
            <strong>{sexActive?.status === 'active' ? 'Aktiv' : sexPending ? 'Afventer' : 'Due'}</strong>
            <span>{sexActive?.titleDa ?? 'Kræv under Sex'}</span>
          </button>
        ) : (
          <button type="button" className="dash-card dash-card--cal" onClick={onGoProfil}>
            <span className="dash-card__k">IRL</span>
            <strong>{IRL.find((o) => o.value === irlStatus)?.label ?? irlStatus}</strong>
            <span>Profil & limits</span>
          </button>
        )}
      </div>

      <section className="panel panel--command panel--home-order">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Tøj · role</p>
            <h2>{underwear?.roleNameDa ? underwear.roleNameDa : 'På dig nu'}</h2>
          </div>
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
          {sexPending && (
            <span className="status-chip status-chip--sex" role="listitem">
              <span className="status-chip__k">Sex-straf</span>
              <strong>Aktiv</strong>
            </span>
          )}
          {morningLeft > 0 && (
            <span className="status-chip" role="listitem">
              <span className="status-chip__k">Morgen</span>
              <strong>{morningLeft}/3</strong>
            </span>
          )}
        </div>
        <div className="irl-row" role="group" aria-label="IRL-status">
          {IRL.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`chip ${irlStatus === o.value ? 'chip--on' : ''}`}
              disabled={emergencyStop}
              onClick={() => onIrl(o.value)}
            >
              {o.label}
            </button>
          ))}
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
          {calendarToday.entries.length > 0 && (
            <button type="button" className="linkish" onClick={onGoCalendar}>
              Åbn kalender →
            </button>
          )}
          <button type="button" className="linkish" onClick={onGoChallenges}>
            Udfordringer →
          </button>
          <button type="button" className="linkish" onClick={onGoGaming}>
            Gaming →
          </button>
        </div>
      </section>
    </div>
  );
}
