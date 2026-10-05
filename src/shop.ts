export type ShopKind = 'token' | 'cosmetic' | 'perk' | 'treat';

export interface ShopItem {
  id: string;
  name: string;
  kind: ShopKind;
  cost: number;
  blurb: string;
  /** Consumable: removed from inventory when used. */
  consumable: boolean;
  /** Soft effect tags applied when purchased or used. */
  effect?: 'soft-day' | 'skip-challenge' | 'cup-up' | 'vibe-boost' | 'minutes-down' | 'wallpaper' | 'flavor';
}

/** Large RPG-style catalog — buy with points earned from challenges/games/sex. */
export const SHOP_ITEMS: ShopItem[] = [
  // Tokens
  { id: 'tok-soft', name: 'Soft-day token', kind: 'token', cost: 40, blurb: 'Force today soft (once).', consumable: true, effect: 'soft-day' },
  { id: 'tok-skip', name: 'Challenge skip', kind: 'token', cost: 35, blurb: 'Auto-complete one challenge as done.', consumable: true, effect: 'skip-challenge' },
  { id: 'tok-cup', name: 'Cup bump charm', kind: 'token', cost: 45, blurb: '+1 cup forms for the next rebuild.', consumable: true, effect: 'cup-up' },
  { id: 'tok-short', name: 'Short scene pass', kind: 'token', cost: 30, blurb: '−10 min on tonight\'s sex timer.', consumable: true, effect: 'minutes-down' },
  { id: 'tok-mercy', name: 'Mercy ribbon', kind: 'token', cost: 55, blurb: 'Cancel one failed challenge today.', consumable: true, effect: 'skip-challenge' },
  // Perks
  { id: 'perk-streak', name: 'Streak candy', kind: 'perk', cost: 25, blurb: '+5 bonus points next time you clear all 3.', consumable: true, effect: 'flavor' },
  { id: 'perk-focus', name: 'Focus tea', kind: 'perk', cost: 20, blurb: 'Quiet-lean: softer challenge text bias.', consumable: true, effect: 'soft-day' },
  { id: 'perk-brave', name: 'Brave badge', kind: 'perk', cost: 28, blurb: 'Boss-lean cosmetic: harder pose challenge flavor.', consumable: true, effect: 'vibe-boost' },
  { id: 'perk-mirror', name: 'Mirror drill card', kind: 'perk', cost: 22, blurb: 'Extra mirror-tease note in sex scene extras.', consumable: true, effect: 'flavor' },
  { id: 'perk-plug', name: 'Plug day voucher', kind: 'perk', cost: 38, blurb: 'Bias next day toward plug-friendly extras.', consumable: true, effect: 'vibe-boost' },
  // Cosmetics
  { id: 'cos-wig-pink', name: 'Pink bob voucher', kind: 'cosmetic', cost: 18, blurb: 'Unlock pink bob as a wig option note.', consumable: false, effect: 'wallpaper' },
  { id: 'cos-wig-black', name: 'Black silk wig', kind: 'cosmetic', cost: 18, blurb: 'Black silk wig vanity unlock.', consumable: false, effect: 'wallpaper' },
  { id: 'cos-nails', name: 'Rose gel nails', kind: 'cosmetic', cost: 12, blurb: 'Permanent vanity: rose gel nails.', consumable: false, effect: 'wallpaper' },
  { id: 'cos-perfume', name: 'Night perfume', kind: 'cosmetic', cost: 15, blurb: 'Vanity scent line for summaries.', consumable: false, effect: 'wallpaper' },
  { id: 'cos-collar', name: 'Day collar charm', kind: 'cosmetic', cost: 32, blurb: 'Pretty day collar in extras pool.', consumable: false, effect: 'vibe-boost' },
  { id: 'cos-stockings', name: 'Seamed stocking set', kind: 'cosmetic', cost: 24, blurb: 'Seamed stockings vanity unlock.', consumable: false, effect: 'wallpaper' },
  { id: 'cos-apron', name: 'Frilly apron', kind: 'cosmetic', cost: 16, blurb: 'Maid-week friendly apron unlock.', consumable: false, effect: 'wallpaper' },
  { id: 'cos-gloves', name: 'Opera gloves', kind: 'cosmetic', cost: 26, blurb: 'Latex-week gloves unlock.', consumable: false, effect: 'wallpaper' },
  { id: 'cos-heels', name: 'Red pump set', kind: 'cosmetic', cost: 28, blurb: 'Statement red pumps vanity.', consumable: false, effect: 'wallpaper' },
  { id: 'cos-choker', name: 'Heart choker', kind: 'cosmetic', cost: 14, blurb: 'Sweet-tease heart choker unlock.', consumable: false, effect: 'wallpaper' },
  { id: 'cos-tiara', name: 'Tiny tiara', kind: 'cosmetic', cost: 34, blurb: 'Fantasy-week sparkle unlock.', consumable: false, effect: 'wallpaper' },
  { id: 'cos-tail', name: 'Cat-tail clip', kind: 'cosmetic', cost: 20, blurb: 'Catgirl accent unlock.', consumable: false, effect: 'wallpaper' },
  // Treats
  { id: 'trt-praise', name: 'Praise letter', kind: 'treat', cost: 10, blurb: 'A sweet written praise line in History.', consumable: true, effect: 'flavor' },
  { id: 'trt-photo', name: 'Photo pose card', kind: 'treat', cost: 14, blurb: 'Add a playful photo-tease treat note.', consumable: true, effect: 'flavor' },
  { id: 'trt-bath', name: 'Bubble bath pass', kind: 'treat', cost: 12, blurb: 'Quiet shower ritual treat.', consumable: true, effect: 'soft-day' },
  { id: 'trt-dessert', name: 'Dessert date', kind: 'treat', cost: 16, blurb: 'Reward snack after challenges.', consumable: true, effect: 'flavor' },
  { id: 'trt-movie', name: 'Couch movie night', kind: 'treat', cost: 18, blurb: 'Soft TV evening treat.', consumable: true, effect: 'soft-day' },
  { id: 'trt-playlist', name: 'Her playlist', kind: 'treat', cost: 8, blurb: 'Listen to her mood playlist treat.', consumable: true, effect: 'flavor' },
  { id: 'trt-journal', name: 'Diary sticker pack', kind: 'treat', cost: 6, blurb: 'Cute stickers for your log.', consumable: false, effect: 'wallpaper' },
  { id: 'trt-star', name: 'Star pin', kind: 'treat', cost: 22, blurb: 'Collectible star pin (keepsake).', consumable: false, effect: 'wallpaper' },
  { id: 'trt-key', name: 'Pretty keychain', kind: 'treat', cost: 11, blurb: 'Vanity keychain unlock.', consumable: false, effect: 'wallpaper' },
  { id: 'trt-ribbon', name: 'Satin gift ribbon', kind: 'treat', cost: 9, blurb: 'Tie a satin bow on today\'s look.', consumable: true, effect: 'vibe-boost' },
];

export const SHOP_BY_ID = Object.fromEntries(SHOP_ITEMS.map((i) => [i.id, i])) as Record<string, ShopItem>;

export const POINTS: Record<string, number> = {
  challengeDone: 8,
  challengeFail: -5,
  allThreeBonus: 15,
  sexDone: 6,
  gameReward: 10,
  gamePunish: -8,
  gameNeutral: 2,
};

export function shopByKind(kind: ShopKind): ShopItem[] {
  return SHOP_ITEMS.filter((i) => i.kind === kind);
}
