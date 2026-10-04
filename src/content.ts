import type { ChallengeKind, FormId, Style, Tone } from './types';

export const CUPS = ['A', 'B', 'C', 'D', 'DD', 'E', 'F', 'G', 'H'];

export interface Item { t: string; s: (Style | 'any')[]; }
const i = (t: string, ...s: (Style | 'any')[]): Item => ({ t, s });

export const PANTIES: Item[] = [
  i('black panties with pink skull print', 'punk'),
  i('tartan cheeky panties', 'punk'),
  i('denim-blue lace cheeky panties', 'western'),
  i('red gingham panties', 'western', 'retro'),
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
  i('black bralette with safety pins', 'punk'),
  i('studded vinyl bra', 'punk'),
  i('gingham push-up bra', 'western'),
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
  i('ripped band tee', 'punk'),
  i('cropped band tee with safety pins', 'punk'),
  i('sleeveless studded tank', 'punk'),
  i('knotted plaid shirt', 'western'),
  i('fringed suede crop top', 'western'),
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
  i('red plaid mini skirt', 'punk'),
  i('ripped denim mini skirt', 'punk'),
  i('tartan bondage skirt with straps', 'punk'),
  i('denim cut-off shorts', 'western'),
  i('fringed suede mini skirt', 'western'),
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
  i('ripped fishnets', 'punk'),
  i('torn black tights', 'punk'),
  i('sheer tan stockings', 'western', 'office'),
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
  i('combat boots', 'punk'),
  i('platform creepers', 'punk'),
  i('cowboy boots', 'western'),
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
  i('smudged black liner and dark lips', 'punk'),
  i('sun-kissed bronzer and gloss', 'western', 'sporty'),
  i('soft pink gloss and blush', 'sweet', 'anime'),
  i('red lips and winged liner', 'classy', 'retro', 'office'),
  i('black lipstick, smoky eyes', 'goth', 'latex'),
  i('glossy nude lips, lashes', 'bimbo', 'classy'),
  i('neon liner and glitter', 'cyber', 'bimbo'),
  i('natural dewy look', 'sporty', 'nurse', 'fantasy'),
  i('shimmer eyes and berry lips', 'fantasy', 'goth'),
];

export const WIGS: Item[] = [
  i('bleached choppy wig', 'punk'),
  i('half-shaved hot pink wig', 'punk'),
  i('long honey braids wig', 'western', 'fantasy'),
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
  x('studded belt', false, 'punk'),
  x('spiked wristband', false, 'punk'),
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
  { id: 'chastity', label: 'Chastity tease', soft: [15, 30], hard: [30, 60] },
  { id: 'nipples', label: 'Breast & nipple tease', soft: [10, 15], hard: [15, 25] },
  { id: 'milking', label: 'Prostate milking (collect it)', soft: [15, 20], hard: [20, 40] },
  { id: 'bondage', label: 'Bondage tease', soft: [15, 20], hard: [25, 45] },
  { id: 'mirror', label: 'Mirror tease in your forms', soft: [10, 15], hard: [15, 25] },
  { id: 'plug', label: 'Plug tease', soft: [20, 30], hard: [40, 90] },
  { id: 'striptease', label: 'Lingerie strip-tease for her', soft: [10, 15], hard: [15, 25] },
  { id: 'strapon-tease', label: 'Strap-on tease', soft: [10, 20], hard: [20, 30] },
  { id: 'photo-tease', label: 'Photo & pose tease', soft: [10, 15], hard: [15, 25] },
];
export const formLabel = (id: FormId) => FORMS.find((f) => f.id === id)?.label ?? id;
export const PLUG_FORMS: FormId[] = ['pegging', 'dildo-ride', 'plug', 'milking'];
export const LOOK_FORMS: FormId[] = ['mirror', 'photo-tease', 'striptease', 'nipples'];
export const STRAP_FORMS: FormId[] = ['strapon-oral', 'strapon-tease', 'pegging'];

export const LOCATIONS = [
  'the bedroom, lights dimmed', 'in front of the full-length mirror', 'the bathroom, by the mirror',
  'the shower', 'the living room floor', 'at your gaming desk', 'on the bed, tied to the frame',
  'the kitchen counter', 'the hallway mirror', 'the couch with a blanket', 'the bed with candles lit',
];

// Scene building blocks. Placeholders: {cup} {item} {loc} {min}
export const OPENERS: Record<Tone, string[]> = {
  sweet: ['Good morning, Frida darling, today you are all mine.', 'Hi pretty girl, I picked something special for you today.', 'Come here, sweetheart, let me look at you.'],
  stern: ['Stand up straight, Frida, today you answer to me.', 'You belong to me today, Frida, and you will follow my rules.', 'Listen carefully, girl, I will not repeat myself.'],
  playful: ['Hehe, guess who owns you today, Frida?', 'Oh Frida, you are going to be so much fun today.', 'Ready to play, cutie? I sure am!'],
  cold: ['You are mine today, Frida, so do not waste my time.', 'I have decided how your day goes, Frida, so obey.', 'Quiet, Frida, today you are my property.'],
  sultry: ['Mmm, Frida, I have been thinking about you all night.', 'Come closer, Frida, let me whisper what I want.', 'My sweet Frida, today I am going to take my time with you.'],
};

export const FORM_LINES: Record<FormId, string[]> = {
  'strapon-oral': ['You will kneel in your {item} and worship my strap-on with your glossy lips.', 'Slow and deep, eyes up at me, until I say you are a good girl.'],
  pegging: ['I will bend you over, lube you up, and take you with my strap-on.', 'Your {cup}-cup forms will bounce with every stroke while you thank me.'],
  'dildo-ride': ['You will ride your dildo for me, slowly at first, then faster.', 'Hands on your {cup}-cup breasts while you bounce, and you do not stop until I say.'],
  chastity: ['Your cage stays locked while I tease your breasts and whisper in your ear.', 'You can squirm and beg, but the key stays with me.'],
  nipples: ['I will play with your {cup}-cup forms and pinch your nipples until you whimper.', 'Slow circles first, then clamps, and you will moan my name.'],
  milking: ['I will milk you from behind, slowly and steadily, until you leak for me.', 'Every drop gets collected in a little glass, and you know what happens next.'],
  bondage: ['Wrists tied, ankles tied, and you only get to wait for my touch.', 'I tease you everywhere in your {item} and you cannot do a thing.'],
  mirror: ['You will pose in the mirror in your {item} and touch your {cup}-cup breasts for me.', 'Look at yourself, Frida, look how pretty and needy you are.'],
  plug: ['Your plug goes in and stays in, and I tap it and twist it whenever I walk by.', 'Every time you clench, you think of me and blush.'],
  striptease: ['Put on a song and strip for me, slowly, one piece of lingerie at a time.', 'Leave the {item} for last, and show off those {cup}-cup forms while you dance.'],
  'strapon-tease': ['I will rub my strap-on over your {item} and along your thighs, slow and teasing.', 'You may kiss it and beg for it, but I decide when and how much.'],
  'photo-tease': ['You will pose for me like a pin-up: arched back, pouty lips, {cup}-cup forms pushed together.', 'Every photo you take, I want you a little more undressed and a little more shameless.'],
};

export const LOC_LINES = ['Set the scene: {loc}, {min} minutes, no rushing.', 'Setting: {loc}. You have {min} minutes of being mine.', 'Location: {loc}, {min} minutes, no excuses.'];

export const CLOSERS: Record<Tone, string[]> = {
  sweet: ['And afterwards you get cuddles, my good girl.', 'I am so proud of you already.'],
  stern: ['Disappoint me and tomorrow will be harder.', 'Report back when you are done.'],
  playful: ['Try not to make too much noise, hehe.', 'Bet you are blushing right now.'],
  cold: ['That is all, begin when told.', 'Your feelings are not my concern.'],
  sultry: ['I will be watching you the whole time.', 'Mmm, I can hardly wait.'],
};

/** forms: only valid for these sex forms (undefined = any). link: how it ties to today's sex. */
export interface CTemplate { kind: ChallengeKind; text: string; link: string; hard?: boolean; forms?: FormId[]; }
const c = (kind: ChallengeKind, text: string, link: string, opts: { hard?: boolean; forms?: FormId[]; not?: FormId[] } = {}): CTemplate => ({
  kind, text, link, hard: opts.hard,
  forms: opts.forms ?? (opts.not ? ALL_FORMS.filter((f) => !opts.not!.includes(f)) : undefined),
});
const ALL_FORMS: FormId[] = ['strapon-oral', 'pegging', 'dildo-ride', 'chastity', 'nipples', 'milking', 'bondage', 'mirror', 'plug', 'striptease', 'strapon-tease', 'photo-tease'];

// Placeholders: {cup} {star} {panties} {legwear} {shoes} {loc} {form}
export const CHALLENGES: CTemplate[] = [
  // wear
  c('wear', 'Wear your {cup}-cup forms for at least 4 hours.', 'Your forms stay on for the {form}.'),
  c('wear', 'Keep the {panties} on all day.', 'She wants them warm for the {form}.'),
  c('wear', 'Wear the {legwear} for 3 hours at home.', 'They stay on during the {form}.'),
  c('wear', 'Walk in your {shoes} for 15 minutes total.', 'You wear them for the {form}.'),
  c('wear', 'Wear lipstick until the scene. Reapply when it fades.', 'Fresh lips for her strap-on.', { forms: STRAP_FORMS }),
  c('wear', 'Wear your plug for 1 hour this afternoon.', 'Opens you up for the {form}.', { hard: true, forms: PLUG_FORMS }),
  c('wear', 'Wear a small plug for 30 minutes while doing chores.', 'A warm-up for the {form}.', { forms: PLUG_FORMS }),
  c('wear', 'Lock your cage this morning and keep it on until the scene.', 'You go into the chastity tease already locked.', { forms: ['chastity'] }),
  c('wear', 'Wear wrist cuffs for 1 hour at home.', 'Get used to them before she ties you.', { forms: ['bondage'] }),
  c('wear', 'Wear every outfit layer for 2 hours.', 'Every piece comes off for her later.', { forms: ['striptease'] }),
  c('wear', 'Wear the full outfit for 2 hours straight.', 'You stay dressed up for the {form}.', { hard: true, forms: LOOK_FORMS }),
  c('wear', 'Wear the bra and forms under a hoodie all afternoon.', 'She unwraps them during the {form}.', { forms: ['nipples', 'striptease', 'chastity', 'milking'] }),
  // tease
  c('tease', 'Practice slow kisses on your dildo for 5 minutes, lipstick on.', 'Warm-up for her strap-on.', { forms: STRAP_FORMS }),
  c('tease', 'Rub her strap-on (or your dildo) over your panties for 3 minutes.', 'A preview of the {form}.', { forms: ['strapon-tease', 'pegging', 'dildo-ride'] }),
  c('tease', 'Tease yourself with a lubed finger or small toy for 5 minutes.', 'Gets you ready for the {form}.', { forms: PLUG_FORMS }),
  c('tease', 'Clench your plug 20 times while doing chores.', 'Trains you for the {form}.', { hard: true, forms: ['plug', 'pegging', 'dildo-ride'] }),
  c('tease', '10 minutes of nipple tease in the mirror, forms on.', 'Makes them sensitive for the {form}.', { forms: ['nipples', 'mirror', 'photo-tease', 'striptease', 'chastity'] }),
  c('tease', 'Wear nipple clamps for 10 minutes.', 'Sensitive nipples for the {form}.', { hard: true, forms: ['nipples', 'bondage', 'chastity', 'milking'] }),
  c('tease', 'Stroke your breasts through the bra for 5 minutes while locked.', 'Warms you up for the chastity tease.', { forms: ['chastity'] }),
  c('tease', 'Kneel 5 minutes, hands behind your back, imagining her rope.', 'Gets your head ready for the bondage.', { forms: ['bondage'] }),
  c('tease', 'Practice a slow lingerie strip in the mirror, one song.', 'Rehearsal for the {form}.', { forms: ['striptease', 'mirror', 'photo-tease'] }),
  c('tease', 'Pose for 5 cute photos (just for you), arching your back.', 'Practice for the {form}.', { forms: ['photo-tease', 'mirror', 'striptease'] }),
  c('tease', 'Rub lotion into your legs slowly, then caress your forms for 5 min.', 'Soft skin for the {form}.'),
  c('tease', 'Blow her a kiss in the mirror every time you pass it today.', 'Puts you in the mood for the {form}.', { forms: LOOK_FORMS }),
  c('tease', 'Spend 5 minutes on all fours, hips up, in your panties.', 'Your position for the {form}.', { forms: ['pegging', 'milking', 'strapon-tease'] }),
  // task
  c('task', 'Write 3 lines in your diary about how {star} makes you feel.', 'She reads them before the {form}.'),
  c('task', 'Take 3 mirror photos of today\u2019s outfit (just for you).', 'Pick your best pose for the {form}.'),
  c('task', 'Paint your toenails a pretty color.', 'She checks them during the {form}.'),
  c('task', 'Shave your legs smooth.', 'Smooth for the {form}.'),
  c('task', 'Set up {loc}: towel, lube and toys laid out.', 'Ready for the {form}.'),
  c('task', 'Prep and clean up properly before the scene.', 'Needed for the {form}.', { forms: PLUG_FORMS }),
  c('task', 'Pick a sexy song for your strip-tease.', 'You strip to it later.', { forms: ['striptease'] }),
  c('task', 'Lay out rope or cuffs where she can see them.', 'For the bondage tease.', { forms: ['bondage'] }),
  c('task', 'Put the cage key in an envelope and write her name on it.', 'She keeps it during the chastity tease.', { forms: ['chastity'] }),
  c('task', 'Set out a little glass and a towel.', 'For collecting during the milking.', { forms: ['milking'] }),
  c('task', 'Practice a ladylike walk in heels for 10 minutes.', 'You walk to her like that before the {form}.'),
  c('task', 'Say "Thank you, {star}" out loud 10 times, kneeling.', 'Your greeting before the {form}.', { hard: true }),
  c('task', 'Clean the bathroom wearing only the {panties} and heels.', 'She inspects it before the {form}.', { hard: true }),
  // gaming
  c('gaming', 'Play one match in panties and stockings.', 'Stay in them for the {form}.'),
  c('gaming', 'Every death in your next match = +1 minute of the {form}.', 'Adds directly to tonight.', { hard: true }),
  c('gaming', 'Get a positive K/D in one match, or wear the plug for the next.', 'A plugged warm-up for the {form}.', { hard: true, forms: PLUG_FORMS }),
  c('gaming', 'Wear your forms during your whole gaming session.', 'Keep them on for the {form}.'),
  c('gaming', 'Win one game before the scene, or she adds 10 minutes.', 'Decides how long the {form} lasts.'),
  c('gaming', 'Game with your cage on, no matter what.', 'You stay locked into the chastity tease.', { forms: ['chastity'] }),
];

export const PUNISHMENTS: CTemplate[] = [
  c('punishment', 'Punishment: bad games. Plug in for 30 minutes before the scene.', 'Then the {form} starts harder.'),
  c('punishment', 'Punishment: stay locked in chastity until tomorrow morning.', 'Locked through the {form} and beyond.', { not: ['milking'] }),
  c('punishment', 'Punishment: write "I play badly, so I obey" 20 times.', 'She reads it out during the {form}.'),
  c('punishment', 'Punishment: kneel 10 minutes in your forms, hands behind your back.', 'Right before the {form} starts.'),
];

export const REWARDS: CTemplate[] = [
  c('reward', 'Reward: great games! You may finish at the end of the {form}.', 'A happy ending tonight.', { not: ['chastity'] }),
  c('reward', 'Reward: swap into comfy panties after the scene.', 'Comfort after the {form}.'),
  c('reward', 'Reward: you pick the music for the {form}.', 'Your choice tonight.'),
  c('reward', 'Reward: she ends the {form} with cuddles and praise.', 'A soft finish tonight.'),
];

export const BONUSES = [
  'Bonus: she ends with cuddles and praise.', 'Bonus: you choose the position.', 'Bonus: she goes slow and gentle.',
  'Bonus: you pick the music and the lighting.', 'Bonus: she kisses your forms all over at the end.',
];
export const PENALTIES = [
  'Penalty: hands stay behind your back the whole time.', 'Penalty: you thank her on your knees every 5 minutes.',
  'Penalty: a bigger plug stays in for the whole scene.', 'Penalty: nipple clamps on for the whole scene.',
  'Penalty: you count every minute out loud.',
];
