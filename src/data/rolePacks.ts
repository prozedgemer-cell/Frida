import type { Intensity, IrlStatus, OutfitLayerPick, ThemePack } from '../types';

/**
 * Coherent FULL-OUTFIT role packs (undertøj + ydre lag).
 * Research seed (lingerie cuts + Domme conventions):
 * - Brazilian-cut: ~50% cheek coverage — scooped rear strip, high leg; flattering "peach"
 *   milf everyday-sexy. More secure/wearable than thong; NOT latex-domme.
 * - Thong: thin rear strap; G-string: string-width rear — most minimal / tease /
 *   "tager meget"-energi. Short-wear statement, not commanding Domme.
 * - BDSM Domme: leather / latex / PVC, structured corset or harness, boots (thigh/knee),
 *   gloves, collar — materials signal power. ≠ peachy Brazilian-milf or g-string tease.
 */

export type RoleId =
  | 'milf-brazilian'
  | 'gstring-tease'
  | 'bdsm-domme'
  | 'office-diskret'
  | 'gaming-comfort'
  | 'date-night'
  | 'soft-girl'
  | 'straf-hard';

export interface RolePack {
  id: RoleId;
  nameDa: string;
  commandVoiceDa: string;
  /** Short why this role ≠ the others */
  contrastDa: string;
  tags: string[];
  intensity: Intensity[];
  themes: ThemePack[];
  weight: number;
  irlBias?: IrlStatus[];
  /** Preferred underwear catalog ids (first match wins when available) */
  underwearIds: string[];
  /** Fallback underwear tags if ids missing */
  underwearTags: string[];
  /** Fixed outer layer suggestions (piece ids from OUTFIT_CATALOG) */
  preferredPieceIds: string[];
  /** Tags to boost when sampling pieces */
  outerTags: string[];
}

export const ROLE_PACKS: RolePack[] = [
  {
    id: 'milf-brazilian',
    nameDa: 'MILF · Brazilian',
    commandVoiceDa:
      'Frida — ROLE: MILF. Brazilian-cut (~halv kind synlig — mere end boyshort, fyldigere end g-string), matching BH, figurnær bluse/wrap, pencil eller midi-nederdel, sheer strømper valgfrit, nude hæle. Voksen, samlet, peachy — IKKE latex/korset-domme.',
    contrastDa: 'Brazilian ≈ 50% bagdækning. Wearable milf ≠ string-tease ≠ Domme.',
    tags: ['milf', 'brazilian', 'sexy', 'date', 'hverdag', 'femme'],
    intensity: ['soft', 'hard'],
    themes: ['clothing', 'sex', 'irl'],
    weight: 14,
    irlBias: ['home', 'alone', 'out'],
    underwearIds: ['uw-brazilian-01', 'uw-brazilian-02', 'uw-04', 'uw-02'],
    underwearTags: ['brazilian', 'cheeky', 'milf', 'satin'],
    preferredPieceIds: ['top-02', 'bot-pencil', 'shoes-heels-nude', 'legs-sheer', 'acc-hoops'],
    outerTags: ['date', 'diskret', 'hverdag', 'sexy', 'milf'],
  },
  {
    id: 'gstring-tease',
    nameDa: 'G-string tease',
    commandVoiceDa:
      'Frida — ROLE: G-string tease. Ultrasmal g-string (string-bredde bag — mere ekstrem end thong), BH der løfter, crop eller åben skjorte, mini, sorte hæle, choker. Du er den milf der tager meget — synlig kontur. IKKE læder/korset-Domme.',
    contrastDa: 'Minimal string-bag + tease ≠ læder/latex-magt.',
    tags: ['g-string', 'string', 'tease', 'sexy', 'hard', 'synlig', 'milf'],
    intensity: ['hard'],
    themes: ['clothing', 'sex', 'porn'],
    weight: 11,
    irlBias: ['home', 'alone'],
    underwearIds: ['uw-01', 'uw-gstring-01', 'uw-13'],
    underwearTags: ['string', 'g-string', 'thong', 'sexy'],
    preferredPieceIds: ['top-01', 'top-04', 'bot-mini', 'shoes-heels-black', 'acc-choker'],
    outerTags: ['sexy', 'aften', 'hard', 'synlig', 'tease'],
  },
  {
    id: 'bdsm-domme',
    nameDa: 'BDSM Domme',
    commandVoiceDa:
      'Frida — ROLE: Domme. Materialer: sort læder/latex/PVC. Korset eller stram bodysuit, fishnet/hofteholder, knæstøvler, harness eller choker, evt. handsker. Undertøj: harness-trusse — IKKE Brazilian-milf og IKKE g-string-tease. Du leder; looket signalerer magt.',
    contrastDa: 'Læder/latex/korset/støvler/harness = magt. ≠ peachy Brazilian.',
    tags: ['bdsm', 'domme', 'fetish', 'hard', 'kontrol', 'leather', 'latex'],
    intensity: ['hard'],
    themes: ['bdsm', 'clothing', 'sex'],
    weight: 12,
    irlBias: ['home', 'alone'],
    underwearIds: ['uw-domme-01', 'uw-05', 'uw-06', 'uw-01'],
    underwearTags: ['bdsm', 'fetish', 'hard', 'kontrol', 'chastity'],
    preferredPieceIds: [
      'top-domme-corset',
      'bot-leather-mini',
      'legs-fishnet',
      'shoes-boots',
      'acc-harness',
      'outer-leather',
    ],
    outerTags: ['fetish', 'hard', 'bdsm', 'leather', 'kontrol', 'aften'],
  },
  {
    id: 'office-diskret',
    nameDa: 'Kontor · diskret',
    commandVoiceDa:
      'Frida — ROLE: Diskret kontor. Usynligt / fuldt undertøj under bluse og bukser eller midi-nederdel. Ingen flash. Hemmeligheden er kun din.',
    contrastDa: 'Work-safe lag — ingen synlig lingeri.',
    tags: ['work', 'diskret', 'hverdag', 'usynlig'],
    intensity: ['soft'],
    themes: ['clothing', 'irl'],
    weight: 13,
    irlBias: ['work', 'public', 'out'],
    underwearIds: ['uw-03', 'uw-08', 'uw-10'],
    underwearTags: ['diskret', 'usynlig', 'work', 'hverdag'],
    preferredPieceIds: ['top-07', 'top-02', 'bot-trousers', 'shoes-flats', 'outer-blazer'],
    outerTags: ['work', 'diskret', 'hverdag'],
  },
  {
    id: 'gaming-comfort',
    nameDa: 'Gaming comfort',
    commandVoiceDa:
      'Frida — ROLE: Gaming. Blødt lingeri eller komfort-trusse under hoodie/joggers. Bryster støttet. Du spiller — men du er stadig i uniform.',
    contrastDa: 'Komfort til session — ikke date eller domme.',
    tags: ['gaming', 'komfort', 'hjemme', 'soft'],
    intensity: ['soft'],
    themes: ['clothing', 'irl', 'anime'],
    weight: 12,
    irlBias: ['home', 'alone'],
    underwearIds: ['uw-09', 'uw-03', 'uw-04'],
    underwearTags: ['gaming', 'komfort', 'hjemme', 'soft'],
    preferredPieceIds: ['top-03', 'bot-joggers', 'shoes-slippers', 'acc-scrunchie'],
    outerTags: ['gaming', 'komfort', 'hjemme', 'soft'],
  },
  {
    id: 'date-night',
    nameDa: 'Date night',
    commandVoiceDa:
      'Frida — ROLE: Date. Matching lingeri under kjole eller nederdel+bluse, strømper, hæle, lidt smykke. Elegant sexet — mellem milf og aften.',
    contrastDa: 'Aften-klar, ikke kontor og ikke fuld latex-domme.',
    tags: ['date', 'aften', 'luksus', 'sexy'],
    intensity: ['soft', 'hard'],
    themes: ['clothing', 'sex', 'irl'],
    weight: 12,
    irlBias: ['out', 'home', 'alone'],
    underwearIds: ['uw-07', 'uw-02', 'uw-brazilian-01'],
    underwearTags: ['sæt', 'luksus', 'date', 'sexy'],
    preferredPieceIds: ['top-08', 'legs-sheer', 'shoes-heels-black', 'acc-hoops', 'outer-coat'],
    outerTags: ['date', 'aften', 'luksus', 'sexy', 'kjole'],
  },
  {
    id: 'soft-girl',
    nameDa: 'Soft girl',
    commandVoiceDa:
      'Frida — ROLE: Soft girl. Cute pasteller, cheeky eller bomuld, strik/crop, nederdel eller soft bukser. Belønning-energi.',
    contrastDa: 'Blød og cute — ikke straf.',
    tags: ['soft', 'cute', 'belønning', 'weekend', 'komfort'],
    intensity: ['soft'],
    themes: ['clothing', 'anime', 'irl'],
    weight: 11,
    irlBias: ['home', 'alone', 'out'],
    underwearIds: ['uw-04', 'uw-03', 'uw-brazilian-02'],
    underwearTags: ['cute', 'soft', 'weekend', 'belønning'],
    preferredPieceIds: ['top-05', 'top-03', 'bot-skirt-soft', 'shoes-sneakers', 'acc-scrunchie'],
    outerTags: ['soft', 'cute', 'komfort', 'weekend', 'belønning'],
  },
  {
    id: 'straf-hard',
    nameDa: 'Straf · hard',
    commandVoiceDa:
      'Frida — ROLE: Straf. Synlig kontrol: stramt, sort, måske cage under trusse, mesh eller mini, hæle. Du har fortjent et hårdere look — stadig fuldt outfit, ikke kun undertøj.',
    contrastDa: 'Straf-uniform — hårdere end milf, ikke nødvendigvis fuld domme.',
    tags: ['straf', 'hard', 'ydmyg', 'kontrol', 'sexy'],
    intensity: ['hard'],
    themes: ['bdsm', 'clothing', 'sex'],
    weight: 10,
    irlBias: ['home', 'alone'],
    underwearIds: ['uw-05', 'uw-01', 'uw-domme-01'],
    underwearTags: ['hard', 'straf', 'kontrol', 'chastity', 'ydmyg'],
    preferredPieceIds: ['top-06', 'top-04', 'bot-mini', 'legs-fishnet', 'shoes-heels-black', 'acc-choker'],
    outerTags: ['hard', 'fetish', 'sexy', 'straf', 'synlig'],
  },
];

export function getRolePack(id: RoleId): RolePack | undefined {
  return ROLE_PACKS.find((r) => r.id === id);
}

export const ROLE_PACK_COUNT = ROLE_PACKS.length;

/** Layer labels used when materializing preferred pieces missing from catalog */
export const ROLE_FALLBACK_LAYERS: Record<
  string,
  Omit<OutfitLayerPick, 'pieceId'> & { pieceId: string }
> = {
  'bot-pencil': {
    layer: 'bottom',
    pieceId: 'bot-pencil',
    nameDa: 'Pencil-nederdel',
    descriptionDa: 'Figurnær nederdel til knæ — MILF-silhuet.',
    colors: ['sort', 'navy'],
  },
  'bot-mini': {
    layer: 'bottom',
    pieceId: 'bot-mini',
    nameDa: 'Mini-nederdel',
    descriptionDa: 'Kort nederdel. Tease-længde.',
    colors: ['sort'],
  },
  'bot-trousers': {
    layer: 'bottom',
    pieceId: 'bot-trousers',
    nameDa: 'Damebukser',
    descriptionDa: 'Pæne bukser til kontor.',
    colors: ['sort', 'grå'],
  },
  'bot-joggers': {
    layer: 'bottom',
    pieceId: 'bot-joggers',
    nameDa: 'Soft joggers',
    descriptionDa: 'Gaming-bukser. Stadig Frida under.',
    colors: ['grå', 'sort'],
  },
  'bot-skirt-soft': {
    layer: 'bottom',
    pieceId: 'bot-skirt-soft',
    nameDa: 'Blød plisseret nederdel',
    descriptionDa: 'Cute soft-girl nederdel.',
    colors: ['creme', 'pastel'],
  },
  'bot-leather-mini': {
    layer: 'bottom',
    pieceId: 'bot-leather-mini',
    nameDa: 'Læder-look mini',
    descriptionDa: 'Sort læder/PVC-agtig mini til domme.',
    colors: ['sort'],
  },
  'legs-sheer': {
    layer: 'legs',
    pieceId: 'legs-sheer',
    nameDa: 'Sheer strømpebukser',
    descriptionDa: 'Tynde nude/sorte strømper.',
    colors: ['nude', 'sort'],
  },
  'legs-fishnet': {
    layer: 'legs',
    pieceId: 'legs-fishnet',
    nameDa: 'Net-strømper',
    descriptionDa: 'Fishnet til hard/domme.',
    colors: ['sort'],
  },
  'shoes-heels-nude': {
    layer: 'shoes',
    pieceId: 'shoes-heels-nude',
    nameDa: 'Nude hæle',
    descriptionDa: 'Klassiske hæle til milf/date.',
    colors: ['nude'],
  },
  'shoes-heels-black': {
    layer: 'shoes',
    pieceId: 'shoes-heels-black',
    nameDa: 'Sorte hæle',
    descriptionDa: 'Sorte pumps.',
    colors: ['sort'],
  },
  'shoes-boots': {
    layer: 'shoes',
    pieceId: 'shoes-boots',
    nameDa: 'Knæstøvler',
    descriptionDa: 'Domme-støvler — magt i skridtet.',
    colors: ['sort'],
  },
  'shoes-flats': {
    layer: 'shoes',
    pieceId: 'shoes-flats',
    nameDa: 'Pæne flats',
    descriptionDa: 'Kontor-venlige sko.',
    colors: ['sort'],
  },
  'shoes-slippers': {
    layer: 'shoes',
    pieceId: 'shoes-slippers',
    nameDa: 'Hjemmesko / socks',
    descriptionDa: 'Gaming-comfort fodtøj.',
    colors: ['grå'],
  },
  'shoes-sneakers': {
    layer: 'shoes',
    pieceId: 'shoes-sneakers',
    nameDa: 'Sneakers',
    descriptionDa: 'Soft casual.',
    colors: ['hvid'],
  },
  'top-domme-corset': {
    layer: 'top',
    pieceId: 'top-domme-corset',
    nameDa: 'Sort korset / bustier',
    descriptionDa: 'Domme-korset. Bryster løftet. Magt.',
    colors: ['sort'],
  },
  'acc-hoops': {
    layer: 'accessory',
    pieceId: 'acc-hoops',
    nameDa: 'Hoop-øreringe',
    descriptionDa: 'Feminin finish.',
    colors: ['guld'],
  },
  'acc-choker': {
    layer: 'accessory',
    pieceId: 'acc-choker',
    nameDa: 'Choker',
    descriptionDa: 'Tynd choker om halsen.',
    colors: ['sort'],
  },
  'acc-harness': {
    layer: 'accessory',
    pieceId: 'acc-harness',
    nameDa: 'Harness / remme',
    descriptionDa: 'Symbolsk harness over eller under top.',
    colors: ['sort'],
  },
  'acc-scrunchie': {
    layer: 'accessory',
    pieceId: 'acc-scrunchie',
    nameDa: 'Scrunchie',
    descriptionDa: 'Cute hår-detalje.',
    colors: ['pink'],
  },
  'outer-blazer': {
    layer: 'outerwear',
    pieceId: 'outer-blazer',
    nameDa: 'Blazer',
    descriptionDa: 'Kontor-jakke.',
    colors: ['sort'],
  },
  'outer-leather': {
    layer: 'outerwear',
    pieceId: 'outer-leather',
    nameDa: 'Læderjakke',
    descriptionDa: 'Domme/edge ydre lag.',
    colors: ['sort'],
  },
  'outer-coat': {
    layer: 'outerwear',
    pieceId: 'outer-coat',
    nameDa: 'Frakke',
    descriptionDa: 'Date-aften frakke.',
    colors: ['sort', 'beige'],
  },
};
