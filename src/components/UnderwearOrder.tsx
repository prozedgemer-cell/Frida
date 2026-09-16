import { getUnderwearById } from '../engines/underwearEngine';
import type { UnderwearPick } from '../types';

type Props = {
  pick: UnderwearPick | null;
  paused: boolean;
  onReroll: () => void;
};

export function UnderwearOrder({ pick, paused, onReroll }: Props) {
  const item = pick ? getUnderwearById(pick.itemId) : undefined;

  return (
    <section className="panel panel--command">
      <p className="eyebrow">Hverdag · auto undertøj</p>
      <h2>Dagens hovedordre</h2>
      {paused && <p className="banner banner--warn">Pauset af nødstop</p>}
      {!pick && <p className="muted">Ingen beording endnu…</p>}
      {pick && item && (
        <>
          <p className="command-line">{pick.orderTextDa}</p>
          <dl className="meta-grid">
            <div>
              <dt>Stykke</dt>
              <dd>{item.nameDa}</dd>
            </div>
            <div>
              <dt>Kategori</dt>
              <dd>{item.category}</dd>
            </div>
            <div>
              <dt>Farver</dt>
              <dd>{item.colors.join(', ')}</dd>
            </div>
            <div>
              <dt>Begrundelse</dt>
              <dd>{pick.reasonDa}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onReroll}
            disabled={paused}
          >
            Reroll undertøj
          </button>
        </>
      )}
    </section>
  );
}
