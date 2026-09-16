import { seedImageSrc, seedImagesFor, type SeedImageSlot } from '../data/seedImages';
import { useImageLibrary } from '../hooks/useImageLibrary';
import type { ImageSlot } from '../storage/imageStore';

type Props = {
  slot: ImageSlot;
  titleDa: string;
  hintDa?: string;
};

const SLOT_TO_SEED: Record<ImageSlot, SeedImageSlot> = {
  profile: 'profile',
  outfit: 'outfit',
  'sex-straf': 'sex-straf',
};

export function ImageGallery({ slot, titleDa, hintDa }: Props) {
  const { items, urls, error, busy, add, remove } = useImageLibrary(slot);
  const seeds = seedImagesFor(SLOT_TO_SEED[slot]);

  return (
    <section className="img-gallery">
      <div className="panel__head">
        <div>
          <p className="eyebrow">Billeder</p>
          <h3 className="img-gallery__title">{titleDa}</h3>
        </div>
        <label className={`btn btn--secondary ${busy ? 'is-disabled' : ''}`}>
          Tilføj billede
          <input
            type="file"
            accept="image/*"
            hidden
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void add(f);
            }}
          />
        </label>
      </div>
      {hintDa && <p className="tiny muted">{hintDa}</p>}
      {error && <p className="banner banner--warn">{error}</p>}
      <div className="img-grid">
        {seeds.map((s) => (
          <figure key={s.id} className="img-tile">
            <img src={seedImageSrc(s)} alt={s.captionDa} />
            <figcaption>{s.captionDa}</figcaption>
          </figure>
        ))}
        {items.map((m) => (
          <figure key={m.id} className="img-tile">
            {urls[m.id] ? <img src={urls[m.id]} alt={m.name} /> : <div className="img-tile__ph" />}
            <figcaption>
              {m.name}
              <button type="button" className="linkish" onClick={() => void remove(m.id)}>
                Slet
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
      {!seeds.length && !items.length && (
        <p className="tiny muted">Ingen billeder endnu. Tilføj fra telefonen — gemmes kun lokalt.</p>
      )}
    </section>
  );
}
