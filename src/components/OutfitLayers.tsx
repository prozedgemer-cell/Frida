import { OUTFIT_LAYER_LABELS_DA, type OutfitLayerPick } from '../types';

export function OutfitLayers({ layers }: { layers?: OutfitLayerPick[] }) {
  if (!layers?.length) return null;
  return (
    <ul className="outfit-layers">
      {layers.map((l) => (
        <li key={`${l.layer}-${l.pieceId}`}>
          <span className="outfit-layers__k">{OUTFIT_LAYER_LABELS_DA[l.layer]}</span>
          <strong>{l.nameDa}</strong>
          {l.colors.length > 0 && l.colors[0] !== '—' && (
            <span className="muted"> · {l.colors.slice(0, 2).join(', ')}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
