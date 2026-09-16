import { seedImageSrc, seedImagesFor, type SeedImageSlot } from '../data/seedImages';
import { useImageLibrary } from '../hooks/useImageLibrary';
import type { ImageSlot } from '../storage/imageStore';

type Props = {
  slot: ImageSlot;
  titleDa: string;
  hintDa?: string;
  /** When set, user uploads can attach to a note/outfit/sex entry (local file pick). */
  onSelect?: (imageId: string) => void;
  selectedId?: string;
  selectLabelDa?: string;
};

const SLOT_TO_SEED: Record<ImageSlot, SeedImageSlot> = {
  profile: 'profile',
  outfit: 'outfit',
  'sex-straf': 'sex-straf',
  calendar: 'calendar',
};

export function ImageGallery({
  slot,
  titleDa,
  hintDa,
  onSelect,
  selectedId,
  selectLabelDa = 'Sæt på note',
}: Props) {
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
      <p className="tiny muted">
        {hintDa ??
          'Lokale billeder på enheden. Send gerne fotos til Chief of Staff for at få dem lagt i seed-galleriet.'}
      </p>
      {onSelect && (
        <p className="tiny muted">
          Tryk «{selectLabelDa}» på et upload for at hænge det på den aktuelle note.
        </p>
      )}
      {error && <p className="banner banner--warn">{error}</p>}
      <div className="img-grid">
        {seeds.map((s) => (
          <figure key={s.id} className="img-tile">
            <img src={seedImageSrc(s)} alt={s.captionDa} />
            <figcaption>{s.captionDa}</figcaption>
          </figure>
        ))}
        {items.map((m) => (
          <figure
            key={m.id}
            className={`img-tile ${selectedId === m.id ? 'is-selected' : ''}`}
          >
            {urls[m.id] ? <img src={urls[m.id]} alt={m.name} /> : <div className="img-tile__ph" />}
            <figcaption>
              {m.name}
              <span className="img-tile__acts">
                {onSelect && (
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => onSelect(m.id)}
                  >
                    {selectedId === m.id ? 'Valgt ✓' : selectLabelDa}
                  </button>
                )}
                <button type="button" className="linkish" onClick={() => void remove(m.id)}>
                  Slet
                </button>
              </span>
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
