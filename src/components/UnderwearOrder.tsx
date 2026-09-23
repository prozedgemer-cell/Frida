import { getUnderwearById } from '../engines/underwearEngine';
import type { UnderwearPick } from '../types';
import { ImageGallery } from './ImageGallery';
import { OutfitHero } from './OutfitHero';

type Props = {
  pick: UnderwearPick | null;
  paused: boolean;
  onReroll: () => void;
};

function shortName(pick: UnderwearPick, itemName?: string): string {
  const uw = pick.layers?.find((l) => l.layer === 'underwear');
  return (
    (itemName && itemName.trim()) ||
    pick.lookNameDa?.trim() ||
    uw?.nameDa?.trim() ||
    "Today's look"
  );
}

export function UnderwearOrder({ pick, paused, onReroll }: Props) {
  const item = pick ? getUnderwearById(pick.itemId) : undefined;
  const name = pick ? shortName(pick, item?.nameDa) : null;

  return (
    <section className="panel panel--command">
      <p className="eyebrow">Today&apos;s clothes</p>
      <h2>Wear</h2>
      {paused && <p className="banner banner--warn">Paused</p>}
      {!pick && <p className="muted">No outfit yet…</p>}
      {pick && name && (
        <>
          <OutfitHero imageFile={pick.imageFile} altDa={name} />
          <p className="diary-clothes__name">{name}</p>
          {pick.roleNameDa && pick.roleNameDa !== name ? (
            <p className="diary-clothes__meta muted tiny">{pick.roleNameDa}</p>
          ) : null}
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
        titleDa="Your outfit photos"
        hintDa="Upload looks from your phone — stored locally only."
      />
    </section>
  );
}
