import type { ChallengeKind, FormId, KnownFor } from './types';

export type TagGroup = 'out' | 'home' | 'work' | 'leisure';

export interface TagDef {
  id: string;
  label: string; // English UI (Danish sense in hint)
  hint: string;
  group: TagGroup;
  out: boolean;
}

export const TAG_GROUPS: { id: TagGroup; label: string }[] = [
  { id: 'out', label: 'Out' },
  { id: 'home', label: 'Home' },
  { id: 'work', label: 'Work' },
  { id: 'leisure', label: 'Leisure' },
];

/** Built-in day tags. Old ids kept so saved days still match. */
export const BUILTIN_TAGS: TagDef[] = [
  // Out
  { id: 'fisk', label: 'Fishing', hint: 'Fisk', group: 'out', out: true },
  { id: 'handel', label: 'Grocery', hint: 'Handel', group: 'out', out: true },
  { id: 'tur', label: 'Walk', hint: 'Tur', group: 'out', out: true },
  { id: 'bil', label: 'Car', hint: 'Bil', group: 'out', out: true },
  { id: 'trafik', label: 'Traffic', hint: 'Trafik', group: 'out', out: true },
  { id: 'errands', label: 'Drive errands', hint: 'Ærinder', group: 'out', out: true },
  { id: 'friends', label: 'Friends meet', hint: 'Venner', group: 'out', out: true },
  // Home
  { id: 'hus', label: 'Home chores', hint: 'Hus', group: 'home', out: false },
  { id: 'cook', label: 'Cook', hint: 'Lave mad', group: 'home', out: false },
  { id: 'laundry', label: 'Laundry', hint: 'Vasketøj', group: 'home', out: false },
  { id: 'vacuum', label: 'Vacuum / clean', hint: 'Støvsuge', group: 'home', out: false },
  { id: 'dinner', label: 'Dinner', hint: 'Aftensmad', group: 'home', out: false },
  { id: 'shower', label: 'Shower / bath', hint: 'Bad', group: 'home', out: false },
  { id: 'tv', label: 'Watch TV', hint: 'TV', group: 'home', out: false },
  // Work
  { id: 'arbejde', label: 'Office work', hint: 'Arbejde', group: 'work', out: true },
  { id: 'kaelder', label: 'Basement work', hint: 'Arbejde i kælderen', group: 'work', out: false },
  { id: 'skole', label: 'School', hint: 'Skole', group: 'work', out: true },
  // Leisure
  { id: 'spil', label: 'Gaming', hint: 'Spil', group: 'leisure', out: false },
  { id: 'workout', label: 'Workout / gym', hint: 'Træning', group: 'leisure', out: true },
];

export const tagLabel = (id: string, custom: string[] = []) =>
  BUILTIN_TAGS.find((t) => t.id === id)?.label
  ?? custom.find((c) => c.toLowerCase() === id.toLowerCase())
  ?? id;

export const isOutTag = (id: string) => BUILTIN_TAGS.find((t) => t.id === id)?.out ?? false;
export const isHomeTag = (id: string) => BUILTIN_TAGS.find((t) => t.id === id)?.group === 'home'
  || id === 'spil' || id === 'kaelder';

/** Practical outer / cover layers driven by tags (first matching wins by priority). */
export const LAYER_PRIORITY = [
  'fisk', 'workout', 'kaelder', 'arbejde', 'skole', 'handel', 'errands', 'friends', 'tur', 'trafik', 'bil',
];

export const OUTER_LAYERS: Record<string, { top: string; bottom: string; shoes?: string }> = {
  fisk: { top: 'weatherproof jacket over her style top', bottom: 'sturdy trousers over her look', shoes: 'waterproof boots' },
  workout: { top: 'gym hoodie over her style', bottom: 'track pants over her look', shoes: 'trainers' },
  arbejde: { top: 'plain work shirt / hoodie over her style', bottom: 'jeans or trousers over her look', shoes: 'sensible shoes' },
  skole: { top: 'hoodie or sweater over her style', bottom: 'jeans over her look', shoes: 'sneakers' },
  handel: { top: 'casual jacket over her style', bottom: 'jeans over her look', shoes: 'comfortable sneakers' },
  errands: { top: 'casual jacket over her style', bottom: 'jeans over her look', shoes: 'driving shoes' },
  friends: { top: 'nice casual top layer over her style', bottom: 'jeans or skirt cover over her look', shoes: 'nice sneakers' },
  tur: { top: 'casual jacket over her style', bottom: 'jeans over her look', shoes: 'walking shoes' },
  trafik: { top: 'coat over her style', bottom: 'trousers over her look' },
  bil: { top: 'casual jacket over her style', bottom: 'jeans over her look' },
  kaelder: { top: 'old work hoodie / overalls over her style', bottom: 'work trousers over her look', shoes: 'work boots or sneakers' },
};

export interface TagChallenge {
  kind: ChallengeKind;
  text: string;
  link: string;
  hard?: boolean;
  tags: string[];
  styles?: KnownFor[];
  forms?: FormId[];
  outOnly?: boolean;
  homeOnly?: boolean;
}

const t = (
  kind: ChallengeKind, text: string, link: string,
  tags: string[], opts: { hard?: boolean; styles?: KnownFor[]; forms?: FormId[]; outOnly?: boolean; homeOnly?: boolean } = {},
): TagChallenge => ({ kind, text, link, tags, ...opts });

const HOME = ['hus', 'cook', 'laundry', 'vacuum', 'dinner', 'shower', 'tv'];
const OUT = ['fisk', 'handel', 'tur', 'bil', 'trafik', 'errands', 'friends', 'workout'];
const WORK = ['arbejde', 'kaelder', 'skole'];

/** Concrete clothing-based activities. Placeholders: {style} {look} {panties} {bra} {top} {bottom} {legwear} {cup} {form} {sig} */
export const TAG_CHALLENGES: TagChallenge[] = [
  // Fishing
  t('task', 'Fish for 20 minutes with her {style} {panties} under your trousers. {cup}-cup forms and {bra} stay on.',
    'Stay dressed for the {form} later.', ['fisk']),
  t('wear', 'Wear a small plug the whole fishing trip under her {style} panties and outer layers.',
    'Keeps you ready for the {form}.', ['fisk'], { hard: true }),
  t('tease', 'When alone by the water, drop your trousers for 5 minutes in her {look} underclothes and forms.',
    'A risky warm-up for the {form}.', ['fisk'], { hard: true }),

  // Grocery / Handel
  t('task', 'Do the grocery run wearing her {style} {panties} and {bra} under jeans. Forms on.',
    'She unwraps them for the {form}.', ['handel', 'errands']),
  t('wear', 'Keep a small plug in for the whole shop under her {panties}.',
    'A plugged warm-up for the {form}.', ['handel'], { hard: true }),
  t('tease', 'In a fitting-room / bathroom on the trip, drop pants for 3 minutes in her underclothes only.',
    'Risky practice for the {form}.', ['handel', 'errands'], { hard: true }),
  t('wear', 'Wear her {sig} hidden under your jacket while shopping.',
    'Her mark on you until the {form}.', ['handel', 'friends']),

  // Walk / Tur
  t('task', 'Walk 15 minutes with her {style} {panties} under jeans. Forms and {bra} on.',
    'Stay dressed for the {form}.', ['tur']),
  t('tease', 'On the walk, find a private spot and drop jeans for 5 minutes in her {look} underclothes.',
    'A risky warm-up for the {form}.', ['tur'], { hard: true }),
  t('wear', 'Walk with a plug in under her {panties} and outer layers for 15 minutes.',
    'Opens you up for the {form}.', ['tur'], { hard: true }),

  // Car / Traffic / Errands
  t('task', 'Sit in the car for 10 minutes before driving, in her {style} top + underclothes.',
    'Gets you in the mood for the {form}.', ['bil', 'errands']),
  t('wear', 'Drive with her {style} {panties} and forms under normal pants.',
    'Your forms stay on for the {form}.', ['bil', 'trafik', 'errands']),
  t('wear', 'Plug in for the whole drive / commute under trousers.',
    'A plugged warm-up for the {form}.', ['bil', 'trafik', 'errands'], { hard: true }),
  t('tease', 'Park somewhere private. Drop pants for 5 minutes in her underclothes, then dress and drive on.',
    'Risky warm-up for the {form}.', ['bil', 'errands'], { hard: true }),
  t('task', 'Stand at a stop / in traffic knowing you wear her {panties} under everything for 5 minutes.',
    'Builds tension for the {form}.', ['trafik']),

  // Friends
  t('wear', 'Meet friends with her {style} lingerie under normal clothes. Forms on the whole time.',
    'She unwraps them for the {form}.', ['friends']),
  t('wear', 'Wear her {sig} under your outfit while with friends (hidden).',
    'Her secret until the {form}.', ['friends']),
  t('task', 'Excuse yourself once and check your {look} underclothes in a mirror for 1 minute.',
    'Stay in character for the {form}.', ['friends']),

  // Home chores / vacuum / laundry
  t('task', 'Clean the kitchen for 15 minutes in her full {style} look: {top}, {bottom}, {legwear}, forms.',
    'She inspects it before the {form}.', ['hus', 'vacuum']),
  t('task', 'Vacuum or mop for 20 minutes wearing only her {panties}, {bra} and forms.',
    'Stay soft and exposed for the {form}.', ['vacuum', 'hus']),
  t('task', 'Do a full load of laundry in her {style} outfit. Fold it still dressed as her.',
    'Ready for the {form}.', ['laundry']),
  t('wear', 'Stay in her full {style} outfit at home for 2 hours straight.',
    'Every piece comes off for her later.', ['hus', 'laundry', 'vacuum'], { hard: true }),
  t('tease', 'While doing chores, pause twice to pose in the mirror in her {look} clothes for 1 minute.',
    'Practice for the {form}.', ['hus', 'vacuum', 'laundry']),

  // Cook / Dinner
  t('task', 'Cook a meal for 20+ minutes in her {style} look (apron optional over {top}). Forms on.',
    'She tastes what you made before the {form}.', ['cook', 'dinner']),
  t('wear', 'Prep and cook dinner wearing only her {panties}, {bra}, forms and an apron.',
    'Stay exposed for the {form}.', ['cook', 'dinner'], { hard: true }),
  t('task', 'Set the table and plate dinner still in her {bottom} and {legwear}.',
    'Stay dressed for the {form}.', ['dinner']),
  t('tease', 'While something simmers, touch your {cup}-cup forms for 3 minutes in her kitchen look.',
    'Makes them sensitive for the {form}.', ['cook', 'dinner']),

  // Shower / bath
  t('task', 'Shower or bath, then put her full {style} outfit back on still damp for 15 minutes.',
    'Soft skin for the {form}.', ['shower']),
  t('tease', 'In the shower, tease your nipples and forms for 5 minutes, then dry off into her {panties}.',
    'Warm-up for the {form}.', ['shower']),
  t('wear', 'After the shower, lock or plug before dressing in her look for the evening.',
    'Keeps you ready for the {form}.', ['shower'], { hard: true }),

  // TV
  t('wear', 'Watch at least one episode in only her {style} lingerie and forms — no trousers.',
    'Stay in them for the {form}.', ['tv']),
  t('tease', 'During TV, pause once and pose in her {top} and {bottom} in front of the black screen for 2 minutes.',
    'Practice for the {form}.', ['tv']),
  t('wear', 'Keep a plug in for a whole episode on the couch in her look.',
    'Opens you up for the {form}.', ['tv'], { hard: true }),

  // Office work
  t('wear', 'Wear her {style} {panties} and {bra} with {cup}-cup forms under work clothes all day.',
    'She unwraps them for the {form}.', ['arbejde']),
  t('wear', 'Keep a small plug in under work trousers for at least 2 hours.',
    'A plugged warm-up for the {form}.', ['arbejde'], { hard: true }),
  t('task', 'On a break alone, drop trousers for 5 minutes in her {look} underclothes.',
    'Risky warm-up for the {form}.', ['arbejde'], { hard: true }),

  // Basement work (Arbejde i kælderen)
  t('wear', 'Do basement work in overalls / old clothes over her {style} {panties}, {bra} and forms.',
    'She unwraps the cover for the {form}.', ['kaelder']),
  t('task', 'Work in the basement for 20 minutes with her {look} lingerie under work trousers.',
    'Stay dressed for the {form}.', ['kaelder']),
  t('wear', 'Wear a small plug the whole basement session under her {panties}.',
    'Keeps you ready for the {form}.', ['kaelder'], { hard: true }),
  t('tease', 'When alone downstairs, drop work trousers for 5 minutes in her underclothes and forms.',
    'A risky warm-up for the {form}.', ['kaelder'], { hard: true }),
  t('task', 'Carry one box / tool job downstairs still wearing her {sig} under the work layer.',
    'Her mark until the {form}.', ['kaelder']),

  // School
  t('wear', 'Wear her {style} {panties} under jeans for the whole school day. Forms on.',
    'Your forms stay on for the {form}.', ['skole']),
  t('wear', 'Keep her {style} bra and forms under a hoodie all day at school.',
    'She unwraps them during the {form}.', ['skole']),
  t('task', 'In a bathroom stall, drop pants for 3 minutes in her underclothes only.',
    'Risky practice for the {form}.', ['skole'], { hard: true }),

  // Gaming
  t('gaming', 'Play one full match in her {style} lingerie: {panties}, {bra}, forms, no trousers.',
    'Stay in them for the {form}.', ['spil']),
  t('gaming', 'Game for 30 minutes wearing only her {look} underclothes and {cup}-cup forms.',
    'Warm-up for the {form}.', ['spil']),
  t('gaming', 'Every death in your next match = +1 minute of the {form}. Play in her {panties}.',
    'Adds directly to tonight.', ['spil'], { hard: true }),
  t('wear', 'Wear a small plug for your whole gaming session under her {panties}.',
    'Opens you up for the {form}.', ['spil'], { hard: true, forms: ['pegging', 'dildo-ride', 'plug', 'milking'] }),

  // Workout
  t('wear', 'Work out with her {style} {panties} under gym shorts / leggings. Forms in a sports bra layer.',
    'Sweaty warm-up for the {form}.', ['workout']),
  t('task', 'Do 15 minutes of exercise, then strip to her lingerie in the locker / bathroom for 3 minutes alone.',
    'Risky practice for the {form}.', ['workout'], { hard: true }),
  t('wear', 'Keep a small plug in for the whole gym session under her {panties}.',
    'Keeps you ready for the {form}.', ['workout'], { hard: true }),

  // Style-specific
  t('task', 'Clean the kitchen for 15 minutes in her full maid outfit.',
    'She inspects it before the {form}.', ['hus', 'vacuum', 'cook', 'dinner'], { styles: ['maid'] }),
  t('task', 'Dust and tidy for 20 minutes in maid dress, apron and {cup}-cup forms.',
    'Ready for the {form}.', ['hus', 'vacuum', 'laundry'], { styles: ['maid'] }),
  t('task', 'Cook dinner in her maid look with apron over the dress.',
    'Service before the {form}.', ['cook', 'dinner'], { styles: ['maid'] }),
  t('wear', 'Wear her milf lingerie under jeans for grocery / errands. Forms on.',
    'Mommy unwraps you for the {form}.', ['handel', 'errands', 'tur', 'fisk'], { styles: ['milf', 'sugar-mommy'] }),
  t('task', 'Cook or plate dinner looking polished in her milf layers.',
    'Stay dressed for the {form}.', ['cook', 'dinner'], { styles: ['milf'] }),
  t('wear', 'Basement work with milf lingerie under overalls — forms on.',
    'She unwraps you after the {form} wait.', ['kaelder'], { styles: ['milf'] }),
  t('wear', 'Wear her punk look under a normal jacket when out shopping or walking.',
    'Punk underclothes for the {form}.', ['handel', 'tur', 'arbejde', 'skole'], { styles: ['punk'] }),
  t('task', 'Do basement chores in her latex / shiny pieces under work cover.',
    'Stay shiny for the {form}.', ['kaelder', 'hus'], { styles: ['latex-domme', 'strapon-queen'] }),
  t('wear', 'Keep her office-boss lingerie under work clothes all day.',
    'She unwraps them for the {form}.', ['arbejde'], { styles: ['office-boss', 'librarian'] }),
  t('gaming', 'Play one match in her gamer-girl hoodie with only panties underneath.',
    'Stay in them for the {form}.', ['spil'], { styles: ['gamer-girl', 'anime', 'catgirl'] }),
  t('wear', 'Gym session in sporty layers over her gym-girl lingerie.',
    'Sweat for the {form}.', ['workout'], { styles: ['gym', 'tantric'] }),
  t('task', 'Shower, then put on her nurse / clinical look for 15 minutes at home.',
    'She examines you in the {form}.', ['shower', 'hus'], { styles: ['nurse'] }),

  // Mild fillers (any selected tag)
  t('wear', 'Wear her {style} {panties} and {cup}-cup forms for at least 3 hours today.',
    'Your forms stay on for the {form}.', ['*']),
  t('tease', 'Spend 5 minutes in front of the mirror in her {top} and {bottom}, touching your forms.',
    'Makes them sensitive for the {form}.', ['*', ...HOME]),
  t('task', 'Lay out tonight\'s toys and a towel in her {style} look before the scene.',
    'Ready for the {form}.', ['*', ...HOME, 'spil']),
];

export const TAG_PUNISHMENTS: TagChallenge[] = [
  t('punishment', 'Punishment: bad games. Plug in for 30 minutes in her {style} underclothes before the scene.',
    'Then the {form} starts harder.', ['*']),
  t('punishment', 'Punishment: redo one chore in only her {panties} and forms for 10 minutes.',
    'Right before the {form}.', [...HOME, '*']),
  t('punishment', 'Punishment: kneel 10 minutes in her full {style} look, hands behind your back.',
    'Right before the {form} starts.', ['*']),
  t('punishment', 'Punishment: stay locked until tomorrow morning after the scene.',
    'Locked through the {form} and beyond.', ['*']),
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

void OUT; void WORK;

/** Tag ids a challenge template covers (excluding the catch-all '*'). */
export function challengeTags(t: TagChallenge): string[] {
  return t.tags.filter((x) => x !== '*');
}
