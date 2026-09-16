import { publicUrl } from '../utils/publicUrl';
/**
 * Bundled user media. URL via publicUrl() / BASE_PATH.
 */
export type SeedImageSlot = 'outfit' | 'sex-straf' | 'profile' | 'calendar';

export interface SeedImage {
  id: string;
  slot: SeedImageSlot;
  /** Path under public/ */
  file: string;
  captionDa: string;
}

export const SEED_IMAGES: SeedImage[] = [
  {
    id: 'look-strawberry-mesh',
    slot: 'outfit',
    file: 'media/outfits/strawberry-mesh.jpg',
    captionDa: 'Jordbær-mesh lingeri',
  },
  {
    id: 'look-black-lace-garter',
    slot: 'outfit',
    file: 'media/outfits/black-lace-garter.jpg',
    captionDa: 'Sort blonde + hofteholder',
  },
  {
    id: 'look-bikinis-duo',
    slot: 'outfit',
    file: 'media/outfits/bikinis-duo.jpg',
    captionDa: 'Bikini-duo',
  },
  {
    id: 'look-red-fishnet',
    slot: 'outfit',
    file: 'media/outfits/red-fishnet.jpg',
    captionDa: 'Rødt net-bodycon',
  },
  {
    id: 'look-grey-knit',
    slot: 'outfit',
    file: 'media/outfits/grey-knit-set.jpg',
    captionDa: 'Gråt strik-sæt',
  },
  {
    id: 'scene-bar-cowgirl',
    slot: 'sex-straf',
    file: 'media/scenes/bar-cowgirl-poster.jpg',
    captionDa: 'Bar-cowgirl (fiktiv RP)',
  },
];


export function seedImageSrc(img: SeedImage): string {
  return publicUrl(img.file);
}

export function seedImagesFor(slot: SeedImageSlot): SeedImage[] {
  return SEED_IMAGES.filter((s) => s.slot === slot);
}
