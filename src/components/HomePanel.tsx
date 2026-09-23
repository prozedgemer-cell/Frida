import { getUnderwearById } from '../engines/underwearEngine';
import { WEIGHT_FORMULA_DA } from '../engines/weightBlend';
import { OutfitHero } from './OutfitHero';
import { OutfitLayers } from './OutfitLayers';
import { CalendarInfluenceNote } from './CalendarInfluenceNote';
import { ImageGallery } from './ImageGallery';
import { ChallengesPanel } from './ChallengesPanel';
import type { CalendarSummary } from '../engines/calendarEngine';
import type { SexStrafDue } from '../engines/sexStrafEngine';
import type {
  ActiveChallenge,
  ChallengeLogEntry,
  ChallengeOutcome,
  DayMode,
  Intensity,
  IrlStatus,
  MorningTrioState,
  PerformanceBand,
  PerformanceSnapshot,
  SexStrafInstance,
  UnderwearPick,
} from '../types';

const BAND_EN: Record<PerformanceBand, string> = {
  poor: 'Poor',
  ok: 'Ok',
  good: 'Good',
  godlike: 'Godlike',
};

const IRL: { value: IrlStatus; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'alone', label: 'Alone' },
  { value: 'out', label: 'Out' },
  { value: 'work', label: 'Work' },
  { value: 'public', label: 'Public' },
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
  onGoSex: () => void;
  onGoCalendar: () => void;
  onGoGaming: () => void;
  onGoProfile: () => void;
  onIrl: (irl: IrlStatus) => void;
  sexActive: SexStrafInstance | null;
  sexDue: SexStrafDue;
  calendarToday: CalendarSummary;
  morningTrio: MorningTrioState | null;
  activeChallenges: ActiveChallenge[];
  challengeLog: ChallengeLogEntry[];
  onRefreshChallenges: () => void;
  onResolveChallenge: (id: string, outcome: ChallengeOutcome) => void;
  onResolveMorning: (id: string, outcome: ChallengeOutcome) => void;
};

function buildNextLines(opts: {
  activeChallenge: ActiveChallenge | null;
  inGameChallenge: ActiveChallenge | null;
  playingGame: string;
  sexActive: SexStrafInstance | null;
  sexDue: SexStrafDue;
  calendarToday: CalendarSummary;
  morningLeft: number;
}): string[] {
  const lines: string[] = [];
  if (opts.morningLeft) {
    lines.push(`Morning trio: ${opts.morningLeft} DO/WEAR left`);
  }
  const sexPending =
    opts.sexActive &&
    (opts.sexActive.status === 'pending' || opts.sexActive.status === 'active');
  if (sexPending && opts.sexActive) {
    lines.push(
      `Sex punishment ${opts.sexActive.status === 'active' ? 'active' : 'pending'}: ${opts.sexActive.titleDa}`,
    );
  } else if (opts.sexDue.due) {
    lines.push('Sex punishment is due — open Sex.');
  }
  if (opts.calendarToday.entries.length) {
    lines.push(`Calendar: ${opts.calendarToday.headlineDa}`);
  }
  if (opts.activeChallenge && !opts.activeChallenge.morningTier) {
    lines.push(`Challenge: ${opts.activeChallenge.titleDa}`);
  }
  if (opts.inGameChallenge) {
    const game = opts.playingGame.trim();
    lines.push(
      game
        ? `In-game (${game}): ${opts.inGameChallenge.titleDa}`
        : `In-game: ${opts.inGameChallenge.titleDa}`,
    );
  } else if (opts.playingGame.trim()) {
    lines.push(`Playing ${opts.playingGame.trim()} — log under Gaming.`);
  }
  if (!lines.length) {
    lines.push('Nothing urgent — check Gaming or Calendar when ready.');
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
  onGoSex,
  onGoCalendar,
  onGoGaming,
  onGoProfile,
  onIrl,
  sexActive,
  sexDue,
  calendarToday,
  morningTrio,
  activeChallenges,
  challengeLog,
  onRefreshChallenges,
  onResolveChallenge,
  onResolveMorning,
}: Props) {
  const item = underwear ? getUnderwearById(underwear.itemId) : undefined;
  const morningLeft =
    morningTrio?.challenges.filter((c) => c.status === 'active').length ?? 0;
  const nextLines = buildNextLines({
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
      : `${intensity}/${dayMode}-day`;
  const now = new Date();
  const greetDate = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const clock = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const sexPending =
    !!sexActive && (sexActive.status === 'pending' || sexActive.status === 'active');

  return (
    <div className="mode-stack home-stack">
      <header className="home-greet">
        <p className="eyebrow">Today&apos;s page</p>
        <h1 className="home-greet__title">
          Hi <span className="accent">Frida</span>
        </h1>
        <p className="muted tiny">
          {clock} · {greetDate} · {softHard} · {pointsBalance} pts
          {performance.sessionCount > 0 ? ` · ${performance.score}` : ''}
        </p>
      </header>

      <div className="dash-cards">
        <button type="button" className="dash-card dash-card--today" onClick={onGoCalendar}>
          <span className="dash-card__k">Today</span>
          <strong>{underwear?.roleNameDa ?? underwear?.lookNameDa ?? 'Outfit'}</strong>
          <span>
            {clock} · {greetDate}
          </span>
        </button>
        {sexPending || sexDue.due ? (
          <button type="button" className="dash-card dash-card--hot" onClick={onGoSex}>
            <span className="dash-card__k">Sex punishment</span>
            <strong>
              {sexActive?.status === 'active'
                ? 'Active'
                : sexPending
                  ? 'Pending'
                  : 'Due'}
            </strong>
            <span>{sexActive?.titleDa ?? 'Claim under Sex'}</span>
          </button>
        ) : (
          <button type="button" className="dash-card dash-card--cal" onClick={onGoProfile}>
            <span className="dash-card__k">IRL</span>
            <strong>{IRL.find((o) => o.value === irlStatus)?.label ?? irlStatus}</strong>
            <span>Profile & limits</span>
          </button>
        )}
      </div>

      <section className="panel panel--command panel--home-order">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Today&apos;s look</p>
            <h2>{underwear?.roleNameDa ? underwear.roleNameDa : 'On you now'}</h2>
          </div>
        </div>

        {!underwear && <p className="muted">No outfit order yet…</p>}

        {underwear && (
          <>
            <OutfitHero
              imageFile={underwear.imageFile}
              captionDa={underwear.lookNameDa ?? underwear.roleNameDa}
              altDa={underwear.lookNameDa ?? underwear.roleNameDa ?? "Today's outfit"}
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
          titleDa="Your outfit photos"
          hintDa="Upload looks from your phone — stored locally only."
        />
      </section>

      <section className="panel panel--home-status">
        <p className="eyebrow">Status</p>
        <div className="status-chips" role="list">
          <span className="status-chip" role="listitem">
            <span className="status-chip__k">Points</span>
            <strong>{pointsBalance}</strong>
          </span>
          <span className={`status-chip status-chip--band-${performance.band}`} role="listitem">
            <span className="status-chip__k">Perf.</span>
            <strong>
              {BAND_EN[performance.band]}
              {performance.sessionCount > 0 ? ` ${performance.score}` : ''}
            </strong>
          </span>
          <span className="status-chip" role="listitem">
            <span className="status-chip__k">Mode</span>
            <strong>{softHard}</strong>
          </span>
          {playingGame.trim() ? (
            <span className="status-chip status-chip--game" role="listitem">
              <span className="status-chip__k">Game</span>
              <strong>{playingGame.trim()}</strong>
            </span>
          ) : null}
          {(sexPending || sexDue.due) && (
            <button
              type="button"
              className="status-chip status-chip--sex"
              role="listitem"
              onClick={onGoSex}
            >
              <span className="status-chip__k">Sex</span>
              <strong>
                {sexActive?.status === 'active'
                  ? 'Active'
                  : sexPending
                    ? 'Pending'
                    : 'Due'}
              </strong>
            </button>
          )}
          {morningLeft > 0 && (
            <span className="status-chip" role="listitem">
              <span className="status-chip__k">Morning</span>
              <strong>{morningLeft}/3</strong>
            </span>
          )}
        </div>
        <div className="irl-row" role="group" aria-label="IRL status">
          {IRL.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`chip ${irlStatus === o.value ? 'chip--on' : ''}`}
              onClick={() => onIrl(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel panel--home-next">
        <p className="eyebrow">Now</p>
        <h2 className="home-next-title">What&apos;s happening</h2>
        <CalendarInfluenceNote calendar={calendarToday} compact />
        <ol className="home-next-list sched-list">
          {nextLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <div className="home-next-links">
          {(sexPending || sexDue.due) && (
            <button type="button" className="linkish" onClick={onGoSex}>
              Open sex punishment →
            </button>
          )}
          {calendarToday.entries.length > 0 && (
            <button type="button" className="linkish" onClick={onGoCalendar}>
              Open calendar →
            </button>
          )}
          <button type="button" className="linkish" onClick={onGoGaming}>
            Gaming →
          </button>
          <button type="button" className="linkish" onClick={onGoProfile}>
            Profile →
          </button>
        </div>
      </section>

      <ChallengesPanel
        active={activeChallenges}
        log={challengeLog}
        performance={performance}
        calendarToday={calendarToday}
        paused={false}
        onRefresh={onRefreshChallenges}
        onResolve={onResolveChallenge}
        morningTrio={morningTrio}
        onResolveMorning={onResolveMorning}
      />
    </div>
  );
}
