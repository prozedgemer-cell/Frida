import type { ContextState, DayMode, IrlStatus, PerformanceSnapshot, Profile } from '../types';
import type { CalendarSummary } from '../engines/calendarEngine';
import { CalendarInfluenceNote } from './CalendarInfluenceNote';
import { UnderwearOrder } from './UnderwearOrder';
import type { UnderwearPick } from '../types';

const IRL_OPTIONS: { value: IrlStatus; label: string }[] = [
  { value: 'home', label: 'Hjemme' },
  { value: 'alone', label: 'Alene' },
  { value: 'out', label: 'Ude' },
  { value: 'work', label: 'Arbejde' },
  { value: 'public', label: 'Offentligt' },
];

type Props = {
  profile: Profile;
  context: ContextState;
  underwear: UnderwearPick | null;
  performance: PerformanceSnapshot;
  calendarToday?: CalendarSummary | null;
  paused: boolean;
  onContext: (patch: Partial<ContextState>) => void;
  onProfile: (patch: Partial<Profile>) => void;
  onReroll: () => void;
};

export function EverydayPanel({
  profile,
  context,
  underwear,
  performance,
  calendarToday,
  paused,
  onContext,
  onProfile,
  onReroll,
}: Props) {
  const now = new Date();
  const timeLabel = now.toLocaleString('da-DK', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const weekend = now.getDay() === 0 || now.getDay() === 6;

  return (
    <div className="mode-stack">
      <UnderwearOrder pick={underwear} paused={paused} onReroll={onReroll} />

      <section className="panel panel--mode panel--everyday">
        <p className="eyebrow">Mode · Hverdag</p>
        <h2>Daglig status</h2>
        <p className="time-chip">
          <span className="time-chip__label">Nu</span>
          <strong>{timeLabel}</strong>
          <span className="pill">{weekend ? 'weekend' : 'hverdag'}</span>
        </p>

        <CalendarInfluenceNote calendar={calendarToday} />
        <p className="influence-note">
          Vægt: kalender/rolle/dag ≈ 70% · gaming ≈ 30%.
          {performance.sessionCount > 0
            ? ` Gaming nu ${performance.score}/100 (${performance.band}).`
            : ' Ingen session endnu — gaming-delen er neutral.'}
          {underwear?.roleNameDa ? ` Role: ${underwear.roleNameDa}.` : ''}
          {underwear?.performanceInfluenceDa ? ` ${underwear.performanceInfluenceDa}` : ''}
        </p>

        <label className="field">
          <span>IRL-status</span>
          <select
            value={context.irlStatus}
            disabled={paused}
            onChange={(e) => onContext({ irlStatus: e.target.value as IrlStatus })}
          >
            {IRL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <div className="row">
          <label className="field">
            <span>Dag-tilstand</span>
            <select
              value={profile.dayMode}
              disabled={paused}
              onChange={(e) => onProfile({ dayMode: e.target.value as DayMode })}
            >
              <option value="soft">Soft-dag</option>
              <option value="hard">Hard-dag</option>
            </select>
          </label>
          <div className="field">
            <span>Intensitet (profil)</span>
            <p className="readout">{profile.intensity}</p>
          </div>
        </div>

        <p className="muted tiny">
          Klokkeslæt, weekend, IRL, kalender-signaler og gaming-session-log styrer fuld outfit (tøj + undertøj). Soft/hard-dag hører
          til hverdagen — intensitet og themes sættes under Profil.
        </p>
      </section>
    </div>
  );
}
