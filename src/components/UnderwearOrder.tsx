import { getUnderwearById } from '../engines/underwearEngine';
import type { UnderwearPick } from '../types';
import { ImageGallery } from './ImageGallery';
import { OutfitHero } from './OutfitHero';
import { OutfitLayers } from './OutfitLayers';

type Props = {
  pick: UnderwearPick | null;
  paused: boolean;
  onReroll: () => void;
};

export function UnderwearOrder({ pick, paused, onReroll }: Props) {
  const item = pick ? getUnderwearById(pick.itemId) : undefined;

  return (
    <section className="panel panel--command">
      <p className="eyebrow">Hverdag · fuld outfit</p>
      <h2>Dagens uniform</h2>
      {paused && <p className="banner banner--warn">Pauset af nødstop</p>}
      {!pick && <p className="muted">Ingen beording endnu…</p>}
      {pick && (
        <>
          <OutfitHero
            imageFile={pick.imageFile}
            captionDa={pick.lookNameDa}
            altDa={pick.lookNameDa ?? 'Dagens outfit'}
          />
          <p className="command-line">{pick.orderTextDa}</p>
          <OutfitLayers layers={pick.layers} />
          {item && !pick.layers?.length && (
            <dl className="meta-grid">
              <div>
                <dt>Undertøj</dt>
                <dd>{item.nameDa}</dd>
              </div>
            </dl>
          )}
          <p className="tiny muted">{pick.reasonDa}</p>
          {pick.performanceInfluenceDa && (
            <p className="influence-note">{pick.performanceInfluenceDa}</p>
          )}
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onReroll}
            disabled={paused}
          >
            Reroll outfit
          </button>
        </>
      )}
      <ImageGallery
        slot="outfit"
        titleDa="Outfit-referencer"
        hintDa="Egne fotos af fulde looks (undertøj + ydre lag). Lokalt file-pick — ingen server."
      />
    </section>
  );
}
