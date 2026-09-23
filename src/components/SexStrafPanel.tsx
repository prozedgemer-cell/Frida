import type { ChallengeOutcome, SexStrafHardness, SexStrafInstance } from '../types';
import { SEX_STRAF_HARDNESS_DA, SEX_STRAF_STATUS_DA } from '../types';
import type { SexStrafDue } from '../engines/sexStrafEngine';
import { SEX_STRAF_TEMPLATE_COUNT } from '../data/sexStraf';
import { ImageGallery } from './ImageGallery';
import { OutfitHero } from './OutfitHero';
import type { CalendarSummary } from '../engines/calendarEngine';
import { CalendarInfluenceNote } from './CalendarInfluenceNote';

type AdjustPatch = {
  hardness?: SexStrafHardness;
  durationMin?: number;
  partnerDa?: string;
  placeDa?: string;
};

type Props = {
  active: SexStrafInstance | null;
  log: SexStrafInstance[];
  due: SexStrafDue;
  calendarToday?: CalendarSummary | null;
  paused: boolean;
  pointsBalance: number;
  onClaim: () => void;
  onStart: () => void;
  onResolve: (outcome: ChallengeOutcome) => void;
  onAdjust: (patch: AdjustPatch) => void;
};

function Meta({ inst }: { inst: SexStrafInstance }) {
  return (
    <dl className="meta-grid sex-meta">
      <div>
        <dt>Who</dt>
        <dd>{inst.partnerDa}</dd>
      </div>
      <div>
        <dt>Where</dt>
        <dd>{inst.placeDa}</dd>
      </div>
      <div>
        <dt>How long</dt>
        <dd>{inst.durationMin} min</dd>
      </div>
      <div>
        <dt>Intensity</dt>
        <dd>{SEX_STRAF_HARDNESS_DA[inst.hardness]}</dd>
      </div>
      <div>
        <dt>Why</dt>
        <dd>{inst.whyDa}</dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd>{SEX_STRAF_STATUS_DA[inst.status]}</dd>
      </div>
    </dl>
  );
}

const HARDNESS: SexStrafHardness[] = ['blød', 'medium', 'hård'];

export function SexStrafPanel({
  active,
  log,
  due,
  calendarToday,
  paused,
  pointsBalance,
  onClaim,
  onStart,
  onResolve,
  onAdjust,
}: Props) {
  const isPending = !!active && active.status === 'pending';
  const isActive = !!active && active.status === 'active';
  const waiting = isPending || isActive;

  return (
    <div className="mode-stack">
      <section className="panel panel--mode panel--sex">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Mode · Sex punishment</p>
            <h2>Claim → adjust → accept</h2>
          </div>
          <span className="points-chip">
            <strong>{pointsBalance}</strong>
            <span>pts</span>
          </span>
        </div>
        <CalendarInfluenceNote calendar={calendarToday} compact />
        <p className="muted tiny">
          Fictional fantasy RP. Always Frida. No vaginal use. Rest days pause new scenes.
          {` ${SEX_STRAF_TEMPLATE_COUNT} scenes.`} Completing redeems points (debt / performance).
          Pending stays until you explicitly accept.
        </p>

        {paused && (
          <p className="banner banner--warn">
            Paused — no new sex punishment and no complete / skip / fail.
          </p>
        )}

        {waiting && active && (
          <article className={`sex-card sex-card--${active.status}`}>
            <div className="sex-card__top">
              <span className={`pill pill--${active.status === 'active' ? 'fail' : 'skip'}`}>
                {SEX_STRAF_STATUS_DA[active.status]}
              </span>
              <span className={`tag tag--${active.hardness === 'hård' ? 'straf' : 'reward'}`}>
                {SEX_STRAF_HARDNESS_DA[active.hardness]}
              </span>
            </div>
            <h3>{active.titleDa}</h3>
            <OutfitHero
              imageFile={active.imageFile}
              captionDa="Fictional RP illustration"
              altDa={active.titleDa}
            />
            <p className="command-line">{active.sceneDa}</p>
            <Meta inst={active} />

            {isPending && (
              <div className="sex-adjust">
                <p className="eyebrow">Adjust before you accept</p>
                <p className="tiny muted">
                  Nothing is consumed until you tap Accept. Change intensity and duration while
                  waiting.
                </p>
                <div className="row">
                  <label className="field">
                    <span>Intensity</span>
                    <select
                      value={active.hardness}
                      disabled={paused}
                      onChange={(e) =>
                        onAdjust({ hardness: e.target.value as SexStrafHardness })
                      }
                    >
                      {HARDNESS.map((h) => (
                        <option key={h} value={h}>
                          {SEX_STRAF_HARDNESS_DA[h]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Duration (min)</span>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      step={5}
                      value={active.durationMin}
                      disabled={paused}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isFinite(n)) onAdjust({ durationMin: n });
                      }}
                    />
                  </label>
                </div>
                <label className="field">
                  <span>Partner detail</span>
                  <input
                    type="text"
                    value={active.partnerDa}
                    disabled={paused}
                    onChange={(e) => onAdjust({ partnerDa: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Place detail</span>
                  <input
                    type="text"
                    value={active.placeDa}
                    disabled={paused}
                    onChange={(e) => onAdjust({ placeDa: e.target.value })}
                  />
                </label>
                <div className="challenge__actions">
                  <button
                    type="button"
                    className="btn btn--danger"
                    disabled={paused}
                    onClick={onStart}
                  >
                    Accept / take punishment
                  </button>
                </div>
              </div>
            )}

            {isActive && (
              <>
                <p className="tiny muted">
                  Accepted. Complete: +{active.redeemBoost ?? 18} pts. Skip: −4. Fail: −10.
                </p>
                <div className="challenge__actions">
                  <button
                    type="button"
                    className="btn btn--ok"
                    disabled={paused}
                    onClick={() => onResolve('complete')}
                  >
                    Complete
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    disabled={paused}
                    onClick={() => onResolve('skip')}
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    disabled={paused}
                    onClick={() => onResolve('fail')}
                  >
                    Fail
                  </button>
                </div>
              </>
            )}
          </article>
        )}

        {!waiting && (
          <div className={`sex-due ${due.due ? 'is-due' : ''}`}>
            {due.due ? (
              <>
                <p className="influence-note">Sex punishment is due. Claim to enter pending.</p>
                <ul className="home-next-list">
                  {due.reasonsDa.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                <button type="button" className="btn" disabled={paused} onClick={onClaim}>
                  Claim sex punishment
                </button>
              </>
            ) : (
              <>
                <p className="muted">No active sex punishment.</p>
                {due.reasonsDa.length > 0 && (
                  <p className="tiny">Triggers: {due.reasonsDa.join(' · ')}</p>
                )}
                {due.blockedDa.length > 0 && (
                  <ul className="tiny muted">
                    {due.blockedDa.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
                {!due.reasonsDa.length && (
                  <p className="tiny muted">
                    Due when: poor performance band, points debt, loss streak, failed challenges, or
                    calendar punishment/hard signal — and cooldown is over.
                  </p>
                )}
              </>
            )}
          </div>
        )}
        <ImageGallery
          slot="sex-straf"
          titleDa="RP images"
          hintDa="Mood photos for fictional sex punishment. Local file pick — no server upload."
        />
      </section>

      {log.length > 0 && (
        <section className="panel">
          <p className="eyebrow">History</p>
          <h2>Past sex punishments</h2>
          <ul className="log sex-log">
            {log.slice(0, 16).map((e) => (
              <li key={e.id}>
                <span
                  className={`pill pill--${e.status === 'done' ? 'complete' : e.status === 'failed' ? 'fail' : 'skip'}`}
                >
                  {SEX_STRAF_STATUS_DA[e.status]}
                </span>
                <span>
                  {e.titleDa}
                  <span className="muted"> · {e.partnerDa}</span>
                </span>
                {e.pointsDelta != null && e.pointsDelta !== 0 && (
                  <span className={e.pointsDelta > 0 ? 'pts-pos' : 'pts-neg'}>
                    {e.pointsDelta > 0 ? '+' : ''}
                    {e.pointsDelta}
                  </span>
                )}
                <time dateTime={e.resolvedAt ?? e.createdAt}>
                  {new Date(e.resolvedAt ?? e.createdAt).toLocaleString('en-GB', {
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
