import { getUnderwearById } from '../engines/underwearEngine';
import type { ContextState, UnderwearPick } from '../types';

type Props = {
  context: ContextState;
  underwear: UnderwearPick | null;
  paused: boolean;
  onChange: (patch: Partial<ContextState>) => void;
  onReroll: () => void;
};

export function GamingPanel({
  context,
  underwear,
  paused,
  onChange,
  onReroll,
}: Props) {
  const item = underwear ? getUnderwearById(underwear.itemId) : undefined;
  const gaming = Boolean(context.playingGame.trim());
  const gamingFlavored =
    item &&
    (item.tags.includes('gaming') ||
      item.tags.includes('komfort') ||
      item.tags.includes('hjemme'));

  return (
    <div className="mode-stack">
      <section className="panel panel--mode panel--gaming">
        <p className="eyebrow">Mode · Gaming</p>
        <h2>Hvad spiller Frida?</h2>
        <p className="muted tiny">
          Sæt spil-kontekst her. Undertøj og challenges favoriserer komfort, hjemme-vibe og
          gaming-signaler, når et spil er aktivt.
        </p>
        <label className="field">
          <span>Jeg spiller lige nu</span>
          <input
            type="text"
            placeholder="fx Elden Ring, Valorant, Stardew…"
            value={context.playingGame}
            disabled={paused}
            onChange={(e) => onChange({ playingGame: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Gaming-noter</span>
          <textarea
            rows={2}
            placeholder="Session, party, ranked, chill…"
            value={context.notes}
            disabled={paused}
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </label>
        <div className={`mode-status ${gaming ? 'mode-status--on' : ''}`}>
          <strong>{gaming ? 'Spil aktivt' : 'Intet spil sat'}</strong>
          <span>
            {gaming
              ? `Frida er i "${context.playingGame.trim()}" — gaming-signaler er tændt.`
              : 'Udfyld spilnavn for at aktivere gaming-favorisering.'}
          </span>
        </div>
      </section>

      <section className="panel panel--command">
        <p className="eyebrow">Gaming · undertøjssignal</p>
        <h2>Session-beording</h2>
        {paused && <p className="banner banner--warn">Pauset af nødstop</p>}
        {!underwear && <p className="muted">Ingen beording endnu…</p>}
        {underwear && item && (
          <>
            <p className="command-line">{underwear.orderTextDa}</p>
            <dl className="meta-grid">
              <div>
                <dt>Stykke</dt>
                <dd>{item.nameDa}</dd>
              </div>
              <div>
                <dt>Gaming-fit</dt>
                <dd>{gamingFlavored ? 'Komfort / gaming-venlig' : 'Generel (sæt spil + reroll)'}</dd>
              </div>
              <div>
                <dt>Begrundelse</dt>
                <dd>{underwear.reasonDa}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onReroll}
              disabled={paused}
            >
              Reroll til session
            </button>
            <p className="muted tiny">
              Reroll bruger dit aktive spil til at vægte komfort- og gaming-tags højere.
            </p>
          </>
        )}
      </section>

      <section className="panel panel--muted">
        <p className="eyebrow">Tip</p>
        <p className="tiny muted">
          Challenges der nævner {'{game}'} udfyldes automatisk med spilnavnet. Skift til{' '}
          <strong>Udfordringer</strong> for at trække / afslutte.
        </p>
      </section>
    </div>
  );
}
