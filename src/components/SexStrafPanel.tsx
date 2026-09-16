import type { ChallengeOutcome, SexStrafInstance } from '../types';
import { SEX_STRAF_HARDNESS_DA, SEX_STRAF_STATUS_DA } from '../types';
import type { SexStrafDue } from '../engines/sexStrafEngine';
import { SEX_STRAF_TEMPLATE_COUNT } from '../data/sexStraf';
import { ImageGallery } from './ImageGallery';
import { OutfitHero } from './OutfitHero';
import type { CalendarSummary } from '../engines/calendarEngine';
import { CalendarInfluenceNote } from './CalendarInfluenceNote';

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
};

function Meta({ inst }: { inst: SexStrafInstance }) {
  return (
    <dl className="meta-grid sex-meta">
      <div>
        <dt>Hvem</dt>
        <dd>{inst.partnerDa}</dd>
      </div>
      <div>
        <dt>Hvor</dt>
        <dd>{inst.placeDa}</dd>
      </div>
      <div>
        <dt>Hvor længe</dt>
        <dd>{inst.durationMin} min</dd>
      </div>
      <div>
        <dt>Hårdhed</dt>
        <dd>{SEX_STRAF_HARDNESS_DA[inst.hardness]}</dd>
      </div>
      <div>
        <dt>Hvorfor</dt>
        <dd>{inst.whyDa}</dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd>{SEX_STRAF_STATUS_DA[inst.status]}</dd>
      </div>
    </dl>
  );
}

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
}: Props) {
  const pending = active && (active.status === 'pending' || active.status === 'active');

  return (
    <div className="mode-stack">
      <section className="panel panel--mode panel--sex">
        <div className="panel__head">
          <div>
            <p className="eyebrow">Mode · Sex-straf</p>
            <h2>Indløs stats med fiktiv RP</h2>
          </div>
          <span className="points-chip">
            <strong>{pointsBalance}</strong>
            <span>point</span>
          </span>
        </div>
        <CalendarInfluenceNote calendar={calendarToday} compact />
        <p className="muted tiny">
          Fiktiv fantasy-RP. Altid Frida. Ingen vaginal brug. Nødstop stopper ny fremdrift.
          {` ${SEX_STRAF_TEMPLATE_COUNT} scener.`} Fuldført giver point-indløsning (gæld/præstation).
        </p>

        {paused && (
          <p className="banner banner--warn">Pauset — ingen ny sex-straf og ingen complete/skip/fail.</p>
        )}

        {pending && active && (
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
              captionDa="Fiktiv RP-illustration"
              altDa={active.titleDa}
            />
            <p className="command-line">{active.sceneDa}</p>
            <Meta inst={active} />
            <p className="tiny muted">
              Fuldført: +{active.redeemBoost ?? 18} point (indløsning). Skip: −4. Fail: −10.
            </p>
            <div className="challenge__actions">
              {active.status === 'pending' && (
                <button type="button" className="btn" disabled={paused} onClick={onStart}>
                  Start scene
                </button>
              )}
              <button
                type="button"
                className="btn btn--ok"
                disabled={paused}
                onClick={() => onResolve('complete')}
              >
                Fuldført
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
                Fejlet
              </button>
            </div>
          </article>
        )}

        {!pending && (
          <div className={`sex-due ${due.due ? 'is-due' : ''}`}>
            {due.due ? (
              <>
                <p className="influence-note">Sex-straf er due. Panelet vil have indløsning.</p>
                <ul className="home-next-list">
                  {due.reasonsDa.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                <button type="button" className="btn" disabled={paused} onClick={onClaim}>
                  Kræv sex-straf
                </button>
              </>
            ) : (
              <>
                <p className="muted">Ingen aktiv sex-straf.</p>
                {due.reasonsDa.length > 0 && (
                  <p className="tiny">
                    Triggers: {due.reasonsDa.join(' · ')}
                  </p>
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
                    Due når: dårligt præstationsbånd, pointgæld, nederlagsstime, failed udfordringer,
                    eller kalender-signal straf/hård — og cooldown er ovre.
                  </p>
                )}
              </>
            )}
          </div>
        )}
        <ImageGallery
          slot="sex-straf"
          titleDa="RP-billeder"
          hintDa="Stemningsfotos til fiktiv sex-straf. Lokalt file-pick — ingen server-upload."
        />
      </section>

      {log.length > 0 && (
        <section className="panel">
          <p className="eyebrow">Historik</p>
          <h2>Tidligere sex-straffe</h2>
          <ul className="log sex-log">
            {log.slice(0, 16).map((e) => (
              <li key={e.id}>
                <span className={`pill pill--${e.status === 'done' ? 'complete' : e.status === 'failed' ? 'fail' : 'skip'}`}>
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
                  {new Date(e.resolvedAt ?? e.createdAt).toLocaleString('da-DK', {
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
