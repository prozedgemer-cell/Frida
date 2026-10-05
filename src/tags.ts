import type { ChallengeKind, FormId, KnownFor } from './types';

export interface TagDef {
  id: string;
  label: string; // Danish UI label
  hint: string; // short English
  out: boolean; // out-of-house
}

export const BUILTIN_TAGS: TagDef[] = [
  { id: 'fisk', label: 'Fisk', hint: 'fishing', out: true },
  { id: 'spil', label: 'Spil', hint: 'gaming', out: false },
  { id: 'arbejde', label: 'Arbejde', hint: 'work', out: true },
  { id: 'skole', label: 'Skole', hint: 'school', out: true },
  { id: 'tur', label: 'Tur', hint: 'walk / trip', out: true },
  { id: 'bil', label: 'Bil', hint: 'car', out: true },
  { id: 'trafik', label: 'Trafik', hint: 'traffic / commute', out: true },
  { id: 'hus', label: 'Hus', hint: 'chores / home', out: false },
];

export const tagLabel = (id: string, custom: string[] = []) =>
  BUILTIN_TAGS.find((t) => t.id === id)?.label
  ?? custom.find((c) => c.toLowerCase() === id.toLowerCase())
  ?? id;

export const isOutTag = (id: string) => BUILTIN_TAGS.find((t) => t.id === id)?.out ?? false;

/** Practical outer layers for out-of-house / work / school days. */
export const OUTER_LAYERS: Record<string, { top: string; bottom: string; shoes?: string }> = {
  fisk: { top: 'weatherproof jacket over her style top', bottom: 'sturdy trousers over her look', shoes: 'waterproof boots' },
  arbejde: { top: 'plain work shirt / hoodie over her style', bottom: 'jeans or trousers over her look', shoes: 'sensible shoes' },
  skole: { top: 'hoodie or sweater over her style', bottom: 'jeans over her look', shoes: 'sneakers' },
  tur: { top: 'casual jacket over her style', bottom: 'jeans over her look', shoes: 'walking shoes' },
  bil: { top: 'casual jacket over her style', bottom: 'jeans over her look' },
  trafik: { top: 'coat over her style', bottom: 'trousers over her look' },
};

export interface TagChallenge {
  kind: ChallengeKind;
  text: string;
  link: string;
  hard?: boolean;
  tags: string[]; // any of these tags unlocks it
  styles?: KnownFor[]; // optional style filter
  forms?: FormId[];
  outOnly?: boolean;
  homeOnly?: boolean;
}

const t = (
  kind: ChallengeKind, text: string, link: string,
  tags: string[], opts: { hard?: boolean; styles?: KnownFor[]; forms?: FormId[]; outOnly?: boolean; homeOnly?: boolean } = {},
): TagChallenge => ({ kind, text, link, tags, ...opts });

/** Concrete, clothing-based activities. Placeholders: {style} {look} {panties} {bra} {top} {bottom} {legwear} {cup} {form} {sig} */
export const TAG_CHALLENGES: TagChallenge[] = [
  // --- Fisk ---
  t('task', 'Fish for 20 minutes with her {style} {panties} under your trousers. {cup}-cup forms and {bra} stay on.',
    'Stay dressed for the {form} later.', ['fisk']),
  t('wear', 'Wear a small plug the whole fishing trip under her {style} panties and outer layers.',
    'Keeps you ready for the {form}.', ['fisk'], { hard: true }),
  t('tease', 'When alone by the water, drop your trousers for 5 minutes in her {look} underclothes and forms.',
    'A risky warm-up for the {form}.', ['fisk'], { hard: true }),
  t('wear', 'Keep her {style} bra and {cup}-cup forms on under your fishing clothes all day.',
    'Your forms stay on for the {form}.', ['fisk']),

  // --- Spil ---
  t('gaming', 'Play one full match in her {style} lingerie: {panties}, {bra}, forms, no trousers.',
    'Stay in them for the {form}.', ['spil']),
  t('gaming', 'Game for 30 minutes wearing only her {look} underclothes and {cup}-cup forms.',
    'Warm-up for the {form}.', ['spil']),
  t('gaming', 'Every death in your next match = +1 minute of the {form}. Play in her {panties}.',
    'Adds directly to tonight.', ['spil'], { hard: true }),
  t('wear', 'Wear her {style} plug (or a small one) for your whole gaming session.',
    'Opens you up for the {form}.', ['spil'], { hard: true, forms: ['pegging', 'dildo-ride', 'plug', 'milking'] }),
  t('tease', 'Between matches, pose 2 minutes in her {top} and {bottom} in front of the webcam (camera off / just for you).',
    'Practice for the {form}.', ['spil']),

  // --- Arbejde ---
  t('wear', 'Wear her {style} {panties} and {bra} with {cup}-cup forms under normal work clothes all day.',
    'She unwraps them for the {form}.', ['arbejde']),
  t('wear', 'Keep a small plug in under work trousers for at least 2 hours.',
    'A plugged warm-up for the {form}.', ['arbejde'], { hard: true }),
  t('task', 'On your lunch break alone, drop trousers for 5 minutes in her {look} underclothes.',
    'Risky warm-up for the {form}.', ['arbejde'], { hard: true }),
  t('wear', 'Wear her {sig} under your work shirt all day (hidden).',
    'Her mark on you until the {form}.', ['arbejde']),

  // --- Skole ---
  t('wear', 'Wear her {style} {panties} under jeans/skirt for the whole school day. Forms on.',
    'Your forms stay on for the {form}.', ['skole']),
  t('wear', 'Keep her {style} bra and forms under a hoodie/sweater all day at school.',
    'She unwraps them during the {form}.', ['skole']),
  t('task', 'In a bathroom stall, drop pants for 3 minutes in her underclothes only. Then dress and go back.',
    'Risky practice for the {form}.', ['skole'], { hard: true }),
  t('wear', 'Wear a small plug under normal school clothes for at least one class.',
    'Gets you ready for the {form}.', ['skole'], { hard: true }),

  // --- Tur ---
  t('task', 'Walk 15 minutes with her {style} {panties} under jeans. Forms and {bra} on.',
    'Stay dressed for the {form}.', ['tur']),
  t('tease', 'On the walk, find a private spot and drop jeans for 5 minutes in her {look} underclothes.',
    'A risky warm-up for the {form}.', ['tur'], { hard: true }),
  t('wear', 'Wear her full {style} look under a jacket and jeans for a 20-minute walk.',
    'You stay dressed up for the {form}.', ['tur']),
  t('wear', 'Walk with a plug in under her {panties} and outer layers for 15 minutes.',
    'Opens you up for the {form}.', ['tur'], { hard: true }),

  // --- Bil ---
  t('task', 'Sit in the car for 10 minutes before driving, in her {style} outfit (at least top + underclothes).',
    'Gets you in the mood for the {form}.', ['bil']),
  t('wear', 'Drive with her {style} {panties} and forms under normal pants. No adjusting in public.',
    'Your forms stay on for the {form}.', ['bil']),
  t('tease', 'Park somewhere private. Drop pants for 5 minutes in her underclothes, then dress and drive on.',
    'Risky warm-up for the {form}.', ['bil'], { hard: true }),
  t('wear', 'Wear a small plug for the whole car trip under her {panties}.',
    'Keeps you ready for the {form}.', ['bil'], { hard: true }),

  // --- Trafik ---
  t('wear', 'Commute with her {style} lingerie under normal clothes. Forms on the whole way.',
    'She unwraps them for the {form}.', ['trafik']),
  t('wear', 'Plug in for the whole commute under trousers.',
    'A plugged warm-up for the {form}.', ['trafik'], { hard: true }),
  t('wear', 'Stay locked in chastity for the commute and until the scene.',
    'You go into the chastity tease already locked.', ['trafik'], { forms: ['chastity'] }),
  t('task', 'Stand on a platform / at a stop for 5 minutes knowing you wear her {panties} under everything.',
    'Builds tension for the {form}.', ['trafik']),

  // --- Hus ---
  t('task', 'Clean the kitchen for 15 minutes in her full {style} look: {top}, {bottom}, {legwear}, forms.',
    'She inspects it before the {form}.', ['hus']),
  t('task', 'Do laundry or vacuum for 20 minutes wearing only her {panties}, {bra} and forms.',
    'Stay soft and exposed for the {form}.', ['hus']),
  t('task', 'Clean the bathroom in her {style} outfit and heels/shoes for 15 minutes.',
    'Ready for the {form}.', ['hus'], { hard: true }),
  t('tease', 'While doing chores, pause twice to pose in the mirror in her {look} clothes for 1 minute.',
    'Practice for the {form}.', ['hus']),
  t('wear', 'Stay in her full {style} outfit at home for 2 hours straight.',
    'Every piece comes off for her later.', ['hus'], { hard: true }),

  // --- Style-specific boosts (still need a matching tag) ---
  t('task', 'Clean the kitchen for 15 minutes in her full maid outfit.',
    'She inspects it before the {form}.', ['hus'], { styles: ['maid'] }),
  t('task', 'Dust and tidy for 20 minutes in maid dress, apron and {cup}-cup forms.',
    'Ready for the {form}.', ['hus'], { styles: ['maid'] }),
  t('wear', 'Wear her milf lingerie under jeans for the whole trip. Forms on.',
    'Mommy unwraps you for the {form}.', ['tur', 'fisk', 'bil'], { styles: ['milf', 'sugar-mommy'] }),
  t('task', 'Walk 15 minutes looking polished in her milf layers under a coat.',
    'Stay dressed for the {form}.', ['tur'], { styles: ['milf'] }),
  t('wear', 'Wear her punk look (band tee / plaid / fishnets) under a normal jacket when out.',
    'Punk underclothes for the {form}.', ['tur', 'arbejde', 'skole', 'trafik'], { styles: ['punk'] }),
  t('task', 'Do 15 minutes of chores in her latex / shiny pieces at home.',
    'Stay shiny for the {form}.', ['hus'], { styles: ['latex-domme', 'strapon-queen'] }),
  t('wear', 'Keep her office-boss lingerie under work clothes all day.',
    'She unwraps them for the {form}.', ['arbejde'], { styles: ['office-boss', 'librarian'] }),
  t('gaming', 'Play one match in her gamer-girl hoodie look with only panties underneath.',
    'Stay in them for the {form}.', ['spil'], { styles: ['gamer-girl', 'anime', 'catgirl'] }),
  t('task', 'Fish 20 minutes with cowgirl panties / boots vibe under practical outer layers.',
    'Stay dressed for the {form}.', ['fisk'], { styles: ['cowgirl'] }),
  t('wear', 'Wear nurse-style underclothes / stockings under normal clothes for a home day.',
    'She examines you in the {form}.', ['hus'], { styles: ['nurse'] }),
  t('task', 'Walk in her ballet posture for 10 minutes at home in leotard layers.',
    'Posture for the {form}.', ['hus'], { styles: ['ballet'] }),

  // --- Mild defaults usable with any tag (fillers) ---
  t('wear', 'Wear her {style} {panties} and {cup}-cup forms for at least 3 hours today.',
    'Your forms stay on for the {form}.', ['fisk', 'spil', 'arbejde', 'skole', 'tur', 'bil', 'trafik', 'hus', '*']),
  t('tease', 'Spend 5 minutes in front of the mirror in her {top} and {bottom}, touching your forms.',
    'Makes them sensitive for the {form}.', ['hus', 'spil', '*']),
  t('task', 'Lay out tonight\'s toys and a towel in her {style} look before the scene.',
    'Ready for the {form}.', ['hus', 'spil', '*']),
];

export const TAG_PUNISHMENTS: TagChallenge[] = [
  t('punishment', 'Punishment: bad games. Plug in for 30 minutes in her {style} underclothes before the scene.',
    'Then the {form} starts harder.', ['*']),
  t('punishment', 'Punishment: redo one chore in only her {panties} and forms for 10 minutes.',
    'Right before the {form}.', ['hus', '*']),
  t('punishment', 'Punishment: kneel 10 minutes in her full {style} look, hands behind your back.',
    'Right before the {form} starts.', ['*']),
  t('punishment', 'Punishment: stay locked until tomorrow morning after the scene.',
    'Locked through the {form} and beyond.', ['*'], { forms: undefined }),
];

export const TAG_REWARDS: TagChallenge[] = [
  t('reward', 'Reward: great games! You may finish at the end of the {form}.',
    'A happy ending tonight.', ['*']),
  t('reward', 'Reward: swap into comfy panties after the scene.',
    'Comfort after the {form}.', ['*']),
  t('reward', 'Reward: she ends the {form} with cuddles and praise.',
    'A soft finish tonight.', ['*']),
  t('reward', 'Reward: you pick the music for the {form}.',
    'Your choice tonight.', ['*']),
];
