import type { Intensity, IrlStatus, OutfitLook, ThemePack } from '../types';

/**
 * Photographed full-outfit looks (user media in public/media/outfits/).
 * The auto-outfit engine can pick one of these as today's uniform.
 */
export const OUTFIT_LOOKS: OutfitLook[] = [
  {
    id: 'look-strawberry-mesh',
    nameDa: 'Jordbær-mesh lingeri',
    imageFile: 'media/outfits/strawberry-mesh.jpg',
    captionDa: 'Pink/rødt mesh-sæt med jordbærprint. BH + trusse. Hjemme/alene.',
    tags: ['hjemme', 'sexy', 'lingerie', 'aften', 'cute', 'weekend'],
    intensity: ['soft', 'hard'],
    themes: ['clothing', 'sex', 'irl'],
    weight: 16,
    irlBias: ['home', 'alone'],
    orderBlurbDa:
      'Tag det lyserøde jordbær-mesh lingeri-sæt på (BH + matching trusse). Dine bryster skal fylde skålene. Ingen ekstra overdel medmindre du fryser — det ER outfittet hjemme.',
    layers: [
      {
        layer: 'underwear',
        pieceId: 'look-strawberry-mesh-uw',
        nameDa: 'Jordbær-mesh BH + trusse',
        descriptionDa: 'Gennemsigtigt pink mesh med jordbær. Matching sæt.',
        colors: ['pink', 'rød'],
      },
      {
        layer: 'top',
        pieceId: 'look-strawberry-mesh-top',
        nameDa: 'Mesh-BH som overdel',
        descriptionDa: 'Lingerie er overdelen i dette look.',
        colors: ['pink'],
      },
      {
        layer: 'bottom',
        pieceId: 'look-strawberry-mesh-bot',
        nameDa: 'Matching mesh-trusse',
        descriptionDa: 'Samme print. Ingen bukser ovenpå hjemme.',
        colors: ['pink'],
      },
    ],
  },
  {
    id: 'look-black-lace-garter',
    nameDa: 'Sort blonde + hofteholder',
    imageFile: 'media/outfits/black-lace-garter.jpg',
    captionDa: 'Sort blonde-BH, trusse, hofteholder og strømper. Straf/hard-hjemme.',
    tags: ['hjemme', 'sexy', 'hard', 'fetish', 'aften', 'lingerie', 'kontrol'],
    intensity: ['hard'],
    themes: ['clothing', 'sex', 'bdsm', 'porn'],
    weight: 14,
    irlBias: ['home', 'alone'],
    orderBlurbDa:
      'Fuld sort blonde-uniform: BH, trusse, hofteholder og nylonstrømper. Brysterne skal sidde løftet. Ingen joggebukser ovenpå — det er dagens look.',
    layers: [
      {
        layer: 'underwear',
        pieceId: 'look-black-lace-uw',
        nameDa: 'Sort blonde-BH + trusse',
        descriptionDa: 'Klassisk sort lingeri.',
        colors: ['sort'],
      },
      {
        layer: 'legs',
        pieceId: 'look-black-lace-legs',
        nameDa: 'Hofteholder + strømper',
        descriptionDa: 'Garter belt og nylons.',
        colors: ['sort'],
      },
      {
        layer: 'top',
        pieceId: 'look-black-lace-top',
        nameDa: 'Blonde-BH som overdel',
        descriptionDa: 'Ingen skjule-top hjemme.',
        colors: ['sort'],
      },
    ],
  },
  {
    id: 'look-bikinis-duo',
    nameDa: 'Bikini-duo',
    imageFile: 'media/outfits/bikinis-duo.jpg',
    captionDa: 'To-delt bikini-sæt (hjemme/strand-fantasi). Weekend og varme dage.',
    tags: ['weekend', 'hjemme', 'cute', 'sexy', 'aften'],
    intensity: ['soft', 'hard'],
    themes: ['clothing', 'sex', 'irl'],
    weight: 13,
    irlBias: ['home', 'alone'],
    orderBlurbDa:
      'Bikini-sæt på — top og bund. Hjemme som "strand-Frida" eller under en åben skjorte. Brysterne i bikinitoppen. Ingen jeans ovenpå medmindre du går ud.',
    layers: [
      {
        layer: 'underwear',
        pieceId: 'look-bikinis-uw',
        nameDa: 'Bikini bund',
        descriptionDa: 'Bikini som lingeri-lag.',
        colors: ['blå', 'hvid'],
      },
      {
        layer: 'top',
        pieceId: 'look-bikinis-top',
        nameDa: 'Bikinitop',
        descriptionDa: 'To-delt top. Brysterne samlet.',
        colors: ['blå', 'hvid'],
      },
      {
        layer: 'bottom',
        pieceId: 'look-bikinis-bot',
        nameDa: 'Bikinibund',
        descriptionDa: 'Matching bund.',
        colors: ['blå', 'hvid'],
      },
    ],
  },
  {
    id: 'look-red-fishnet',
    nameDa: 'Rødt net-bodycon',
    imageFile: 'media/outfits/red-fishnet.jpg',
    captionDa: 'Rød fishnet/mesh mini der viser lingeri igennem. Aften/hard.',
    tags: ['aften', 'sexy', 'hard', 'date', 'synlig', 'fetish'],
    intensity: ['hard'],
    themes: ['clothing', 'sex', 'porn'],
    weight: 12,
    irlBias: ['home', 'alone', 'out'],
    orderBlurbDa:
      'Rød net-kjole/bodycon udenpå sort lingeri. Gennemsigtig — BH og trusse SKAL ses. Hæle hvis du har. Hard-look.',
    layers: [
      {
        layer: 'underwear',
        pieceId: 'look-red-fishnet-uw',
        nameDa: 'Sort lingeri under net',
        descriptionDa: 'Skal ses gennem maskerne.',
        colors: ['sort'],
      },
      {
        layer: 'top',
        pieceId: 'look-red-fishnet-top',
        nameDa: 'Rød fishnet mini-kjole',
        descriptionDa: 'Dækker top+bund. Net, ikke tætvævet.',
        colors: ['rød'],
      },
      {
        layer: 'shoes',
        pieceId: 'look-red-fishnet-shoes',
        nameDa: 'Sorte hæle',
        descriptionDa: 'Hvis du har hæle — på med dem.',
        colors: ['sort'],
      },
    ],
  },
  {
    id: 'look-grey-knit',
    nameDa: 'Gråt strik-sæt',
    imageFile: 'media/outfits/grey-knit-set.jpg',
    captionDa: 'Gråt cropped strik + mini. Blød hverdag/hjemme, stadig Frida.',
    tags: ['hverdag', 'komfort', 'hjemme', 'soft', 'cute', 'weekend'],
    intensity: ['soft'],
    themes: ['clothing', 'irl'],
    weight: 15,
    irlBias: ['home', 'alone', 'out'],
    orderBlurbDa:
      'Gråt strik-sæt: cropped overdel og matching mini. Undertøj diskret under. Blødt — men det er stadig en beording, ikke lounge-tøj du selv finder.',
    layers: [
      {
        layer: 'underwear',
        pieceId: 'look-grey-knit-uw',
        nameDa: 'Diskret matching undertøj',
        descriptionDa: 'Hudfarvet eller gråt. Usynligt under strik.',
        colors: ['grå', 'nude'],
      },
      {
        layer: 'top',
        pieceId: 'look-grey-knit-top',
        nameDa: 'Cropped grå strik',
        descriptionDa: 'Kort overdel. Talje synlig.',
        colors: ['grå'],
      },
      {
        layer: 'bottom',
        pieceId: 'look-grey-knit-bot',
        nameDa: 'Grå strik-mini',
        descriptionDa: 'Matching nederdel.',
        colors: ['grå'],
      },
    ],
  },
];

export const OUTFIT_LOOK_COUNT = OUTFIT_LOOKS.length;

export function getLookById(id: string): OutfitLook | undefined {
  return OUTFIT_LOOKS.find((l) => l.id === id);
}

export function looksFor(
  intensity: Intensity,
  themes: ThemePack[],
  irl?: IrlStatus,
): OutfitLook[] {
  return OUTFIT_LOOKS.filter((l) => {
    if (!l.intensity.includes(intensity) && intensity === 'soft' && !l.intensity.includes('soft')) {
      return false;
    }
    if (!l.themes.some((t) => themes.includes(t))) return false;
    if (irl && l.irlBias?.length && !l.irlBias.includes(irl) && (irl === 'work' || irl === 'public')) {
      return false;
    }
    return true;
  });
}
