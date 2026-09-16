import { publicUrl } from '../utils/publicUrl';

type Props = {
  imageFile?: string;
  captionDa?: string;
  altDa: string;
};

export function OutfitHero({ imageFile, captionDa, altDa }: Props) {
  if (!imageFile) return null;
  return (
    <figure className="outfit-hero">
      <img src={publicUrl(imageFile)} alt={altDa} />
      {captionDa && <figcaption>{captionDa}</figcaption>}
    </figure>
  );
}
