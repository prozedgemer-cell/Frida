import type { ChallengeKind, FormId, Style, Tone } from '../types';

export const STYLES: Style[] = ['sweet', 'classy', 'latex', 'goth', 'anime', 'fantasy', 'office', 'nurse', 'sporty', 'bimbo', 'retro', 'cyber'];
export const CUPS = ['A', 'B', 'C', 'D', 'DD', 'E', 'F', 'G'];

export interface Item { t: string; s: (Style | 'any')[]; }
const i = (t: string, ...s: (Style | 'any')[]): Item => ({ t, s });

export const PANTIES: Item[] = [
  i('pink lace panties', 'sweet', 'bimbo', 'anime'),
  i('white cotton panties with a bow', 'sweet', 'anime', 'nurse'),
  i('black silk thong', 'classy', 'office', 'goth'),
  i('red satin panties', 'classy', 'retro', 'fantasy'),
  i('black latex panties', 'latex', 'cyber', 'goth'),
  i('high-waist retro briefs', 'retro'),
  i('sporty seamless thong', 'sporty'),
  i('striped anime panties', 'anime'),
  i('sheer mesh thong', 'goth', 'cyber', 'bimbo'),
  i('lace tanga with garter', 'classy', 'fantasy', 'nurse'),
  i('glossy vinyl string', 'latex', 'bimbo', 'cyber'),
  i('white lace panties', 'fantasy', 'nurse', 'office'),
];

export const BRAS: Item[] = [
  i('pink padded push-up bra', 'sweet', 'bimbo'),
  i('black lace balconette', 'classy', 'goth', 'office'),
  i('red satin balconette', 'retro', 'classy', 'fantasy'),
  i('latex underwire bra', 'latex', 'cyber'),
  i('white lace bralette', 'sweet', 'nurse', 'fantasy'),
  i('sports bra', 'sporty'),
  i('bullet bra', 'retro'),
  i('strappy harness bra', 'goth', 'latex', 'cyber'),
  i('frilly anime bra with bow', 'anime'),
  i('sheer mesh plunge bra', 'bimbo', 'goth', 'office'),
  i('corset-style longline bra', 'fantasy', 'classy'),
];

export const TOPS: Item[] = [
  i('cropped pink cardigan', 'sweet', 'anime'),
  i('fitted silk blouse', 'office', 'classy'),
  i('black mesh long-sleeve', 'goth', 'cyber'),
  i('latex corset top', 'latex', 'fantasy'),
  i('white nurse tunic', 'nurse'),
  i('cropped tank top', 'sporty', 'bimbo'),
  i('sailor blouse', 'anime'),
  i('off-shoulder peasant top', 'retro', 'fantasy', 'sweet'),
  i('tight pink baby tee', 'bimbo', 'sweet'),
  i('holographic crop top', 'cyber', 'bimbo'),
  i('velvet bustier', 'fantasy', 'goth', 'classy'),
  i('polka-dot halter top', 'retro'),
  i('sheer black blouse', 'office', 'goth'),
];

export const BOTTOMS: Item[] = [
  i('pleated pastel skirt', 'sweet', 'anime'),
  i('black pencil skirt', 'office', 'classy'),
  i('PVC mini skirt', 'goth', 'latex', 'cyber'),
  i('latex leggings', 'latex', 'cyber'),
  i('white mini skirt', 'nurse', 'sweet'),
  i('tight yoga leggings', 'sporty'),
  i('high-waist swing skirt', 'retro'),
  i('pink micro skirt', 'bimbo'),
  i('slit velvet maxi skirt', 'fantasy', 'classy', 'goth'),
  i('tartan schoolgirl skirt', 'anime', 'goth'),
  i('booty shorts', 'sporty', 'bimbo'),
  i('satin maid skirt with apron', 'retro', 'sweet'),
];

export const LEGWEAR: Item[] = [
  i('white thigh-high socks', 'sweet', 'anime', 'nurse'),
  i('black seamed stockings', 'retro', 'classy', 'office'),
  i('fishnet tights', 'goth', 'bimbo', 'cyber'),
  i('latex stockings', 'latex', 'cyber'),
  i('sheer nude pantyhose', 'office', 'classy'),
  i('striped over-knee socks', 'anime', 'goth'),
  i('lace-top hold-ups', 'classy', 'fantasy', 'bimbo'),
  i('bare shaved legs', 'sporty', 'fantasy'),
  i('pink fishnets', 'bimbo', 'sweet'),
  i('white stockings with garters', 'nurse', 'fantasy', 'retro'),
];

export const SHOES: Item[] = [
  i('pink Mary Janes', 'sweet', 'anime'),
  i('black stilettos', 'classy', 'office', 'latex'),
  i('platform boots', 'goth', 'cyber'),
  i('thigh-high latex boots', 'latex'),
  i('white nurse heels', 'nurse'),
  i('sneakers', 'sporty'),
  i('red peep-toe pumps', 'retro', 'classy'),
  i('clear platform heels', 'bimbo', 'cyber'),
  i('strappy sandal heels', 'fantasy', 'bimbo'),
  i('barefoot, toenails painted', 'fantasy', 'sweet', 'sporty'),
];

export const MAKEUP: Item[] = [
  i('soft pink gloss and blush', 'sweet', 'anime'),
  i('red lips and winged liner', 'classy', 'retro', 'office'),
  i('black lipstick, smoky eyes', 'goth', 'latex'),
  i('glossy nude lips, lashes', 'bimbo', 'classy'),
  i('neon liner and glitter', 'cyber', 'bimbo'),
  i('natural dewy look', 'sporty', 'nurse', 'fantasy'),
  i('shimmer eyes and berry lips', 'fantasy', 'goth'),
];

export const WIGS: Item[] = [
  i('long blonde wig', 'bimbo', 'classy', 'retro'),
  i('pink twin-tail wig', 'anime', 'sweet'),
  i('sleek black bob wig', 'goth', 'latex', 'office'),
  i('chestnut waves wig', 'classy', 'nurse', 'office'),
  i('silver long wig', 'fantasy', 'cyber'),
  i('auburn ponytail wig', 'sporty', 'sweet'),
  i('red curls wig', 'retro', 'fantasy'),
  i('lilac bob wig', 'anime', 'cyber'),
];

export interface Extra { t: string; s: (Style | 'any')[]; hard?: boolean; }
const x = (t: string, hard: boolean, ...s: (Style | 'any')[]): Extra => ({ t, s, hard });
export const EXTRAS: Extra[] = [
  x('pink heart choker', false, 'sweet', 'anime', 'bimbo'),
  x('leather collar with ring', true, 'latex', 'goth', 'any'),
  x('small butt plug', false, 'any'),
  x('large jeweled butt plug', true, 'any'),
  x('chastity cage', true, 'any'),
  x('nipple clamps', true, 'latex', 'goth', 'cyber', 'any'),
  x('bell collar', false, 'anime', 'sweet'),
  x('pearl necklace', false, 'classy', 'retro', 'office'),
  x('wrist cuffs', true, 'latex', 'fantasy', 'any'),
  x('cat ears', false, 'anime'),
  x('silk gloves', false, 'classy', 'retro', 'fantasy'),
  x('latex gloves', false, 'latex', 'nurse', 'cyber'),
  x('glasses', false, 'office'),
  x('nurse cap', false, 'nurse'),
  x('perfume on neck and wrists', false, 'any'),
  x('body glitter', false, 'bimbo', 'cyber', 'fantasy'),
  x('ankle chain', false, 'any'),
];

export interface Form { id: FormId; label: string; soft: [number, number]; hard: [number, number]; }
export const FORMS: Form[] = [
  { id: 'strapon-oral', label: 'Oral on her strap-on', soft: [10, 15], hard: [15, 25] },
  { id: 'pegging', label: 'Pegging (strap-on anal)', soft: [10, 20], hard: [20, 40] },
  { id: 'dildo-ride', label: 'Riding a dildo (anal)', soft: [10, 15], hard: [15, 30] },
  { id: 'edging', label: 'Edging session', soft: [10, 20], hard: [25, 45] },
  { id: 'chastity', label: 'Chastity tease', soft: [15, 30], hard: [30, 60] },
  { id: 'nipples', label: 'Breast & nipple play', soft: [10, 15], hard: [15, 25] },
  { id: 'milking', label: 'Prostate milking (collect it)', soft: [15, 20], hard: [20, 40] },
  { id: 'bondage', label: 'Bondage tease', soft: [15, 20], hard: [25, 45] },
  { id: 'ruined', label: 'Ruined orgasm', soft: [10, 15], hard: [15, 30] },
  { id: 'mirror', label: 'Mirror tease in your forms', soft: [10, 15], hard: [15, 20] },
  { id: 'plug', label: 'Plug training', soft: [20, 30], hard: [40, 90] },
];
export const formLabel = (id: FormId) => FORMS.find((f) => f.id === id)?.label ?? id;

export const LOCATIONS = [
  'the bedroom, lights dimmed', 'in front of the full-length mirror', 'the bathroom, by the mirror',
  'the shower', 'the living room floor', 'at your gaming desk', 'on the bed, tied to the frame',
  'the kitchen counter', 'the hallway mirror', 'the couch with a blanket', 'the bed with candles lit',
];

// Scene building blocks. Placeholders: {cup} {item} {loc} {min}
export const OPENERS: Record<Tone, string[]> = {
  sweet: ['Good morning, Frida darling, today you are all mine.', 'Hi pretty girl, I picked something special for you today.', 'Come here, sweetheart, let me look at you.'],
  stern: ['Frida. Stand up straight, today you answer to me.', 'You belong to me today, Frida, and you will follow my rules.', 'Listen carefully, girl. I will not repeat myself.'],
  playful: ['Hehe, guess who owns you today, Frida?', 'Oh Frida, you are going to be so much fun today.', 'Ready to play, cutie? I sure am.'],
  cold: ['Frida. You are mine today. Do not waste my time.', 'I have decided how your day goes, Frida. Obey.', 'Quiet, Frida. Today you are my property.'],
  sultry: ['Mmm, Frida, I have been thinking about you all night.', 'Come closer, Frida, let me whisper what I want.', 'My sweet Frida, today I am going to take my time with you.'],
};

export const FORM_LINES: Record<FormId, string[]> = {
  'strapon-oral': ['You will kneel in your {item} and worship my strap-on with your glossy lips.', 'Slow and deep, eyes up at me, until I say you are a good girl.'],
  pegging: ['I will bend you over, lube you up, and take you with my strap-on.', 'Your {cup}-cup forms will bounce with every stroke while you thank me.'],
  'dildo-ride': ['You will ride your dildo for me, slowly at first, then faster.', 'Hands on your {cup}-cup breasts while you bounce, and you do not stop until I say.'],
  edging: ['I want you right at the edge, again and again, and never over it.', 'Every time you get close you stop, breathe, and say thank you.'],
  chastity: ['Your cage stays locked while I tease your breasts and whisper in your ear.', 'You can squirm and beg, but the key stays with me.'],
  nipples: ['I will play with your {cup}-cup forms and pinch your nipples until you whimper.', 'Slow circles first, then clamps, and you will moan my name.'],
  milking: ['I will milk you from behind, slowly, until you leak without any release.', 'Every drop gets collected in a little glass, and you know what happens next.'],
  bondage: ['Wrists tied, ankles tied, and you only get to wait for my touch.', 'I tease you everywhere in your {item} and you cannot do a thing.'],
  ruined: ['I will bring you all the way up and then take my hand away at the last second.', 'You will twitch, ruined and frustrated, and say thank you.'],
  mirror: ['You will pose in the mirror in your {item} and touch your {cup}-cup breasts for me.', 'Look at yourself, Frida, look how pretty and needy you are.'],
  plug: ['Your plug goes in and stays in, and you go about your tasks with it.', 'Every few minutes you clench, and every time you think of me.'],
};

export const LOC_LINES = ['We do it in {loc}, {min} minutes, no rushing.', 'Meet me in {loc}. You have {min} minutes of being mine.', 'Location: {loc}. Timer: {min} minutes. No excuses.'];

export const CLOSERS: Record<Tone, string[]> = {
  sweet: ['And afterwards you get cuddles, my good girl.', 'I am so proud of you already.'],
  stern: ['Disappoint me and tomorrow will be harder.', 'Report back when you are done.'],
  playful: ['Try not to make too much noise, hehe.', 'Bet you are blushing right now.'],
  cold: ['That is all. Begin when told.', 'Your feelings are not my concern.'],
  sultry: ['I will be watching you the whole time.', 'Mmm, I can hardly wait.'],
};

export interface CTemplate { kind: ChallengeKind; text: string; hard?: boolean; }
const c = (kind: ChallengeKind, text: string, hard = false): CTemplate => ({ kind, text, hard });
// Placeholders: {cup} {star} {panties} {legwear} {shoes}
export const CHALLENGES: CTemplate[] = [
  c('wear', 'Wear your {cup}-cup forms for at least 4 hours.'),
  c('wear', 'Keep the {panties} on all day, even to bed.'),
  c('wear', 'Wear the {legwear} for 3 hours at home.'),
  c('wear', 'Walk in your {shoes} for 15 minutes total.'),
  c('wear', 'Sleep tonight in your bra and forms.'),
  c('wear', 'Wear lipstick until bedtime. Reapply when it fades.'),
  c('wear', 'Wear your plug for 1 hour while doing chores.', true),
  c('wear', 'Stay locked in chastity until evening.', true),
  c('wear', 'Wear the full outfit for 2 hours straight.', true),
  c('tease', 'Edge 3 times today. No release.'),
  c('tease', '10 minutes of nipple play in the mirror, forms on.'),
  c('tease', 'Rub lotion into your legs slowly, then touch your breasts for 5 min.'),
  c('tease', 'Edge 6 times, a 2 minute break between each.', true),
  c('tease', 'Wear nipple clamps for 10 minutes.', true),
  c('tease', 'Edge once every hour for the evening.', true),
  c('task', 'Write 3 lines in your diary about how {star} makes you feel.'),
  c('task', 'Take 3 mirror photos of today\u2019s outfit (just for you).'),
  c('task', 'Paint your toenails a pretty color.'),
  c('task', 'Shave your legs smooth.'),
  c('task', 'Practice a ladylike walk in heels for 10 minutes.'),
  c('task', 'Say "Thank you, {star}" out loud 10 times, kneeling.', true),
  c('task', 'Clean the bathroom wearing only the {panties} and heels.', true),
  c('gaming', 'Play one match in panties and stockings.'),
  c('gaming', 'Win one game before any release today.'),
  c('gaming', 'Every death in your next match = 1 minute of edging after.', true),
  c('gaming', 'Get a positive K/D in one match, or wear the plug for the next.', true),
  c('gaming', 'Wear your forms during your whole gaming session.'),
];

export const PUNISHMENTS: string[] = [
  'Punishment: bad games. Plug in for 30 minutes, and no release today.',
  'Punishment: stay locked in chastity until tomorrow morning.',
  'Punishment: write "I play badly, so I obey" 20 times.',
  'Punishment: 6 edges, no finish, then thank {star}.',
  'Punishment: kneel for 10 minutes in your forms, hands behind your back.',
];

export const REWARDS: string[] = [
  'Reward: great games! You may finish at the end of today\u2019s scene.',
  'Reward: swap into comfy panties for the evening.',
  'Reward: 15 minutes of slow nipple play just for pleasure.',
  'Reward: pick tomorrow\u2019s lipstick yourself.',
  'Reward: skip one edge today, {star} is proud of you.',
];

