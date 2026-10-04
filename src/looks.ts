import type { FormId, KnownFor, Leaning, Style, Tone } from './types';

export interface StyleDef {
  id: KnownFor;
  label: string;
  look: Style; // drives the outfit pools
  forms: FormId[]; // favored sex forms
  leaning: Leaning;
  tone?: Tone; // overrides her voice when set
  cupShift: number; // Frida's forms relative to the star's own cup
  signature: string; // accessory added to Frida's outfit
  line: string; // style flavor line in the scene
  wardrobes: string[]; // signature wardrobe ideas (for generated stars)
}

const d = (
  id: KnownFor, label: string, look: Style, forms: FormId[], leaning: Leaning, cupShift: number,
  signature: string, line: string, wardrobes: string[], tone?: Tone,
): StyleDef => ({ id, label, look, forms, leaning, cupShift, signature, line, wardrobes, tone });

export const STYLE_DEFS: StyleDef[] = [
  d('latex-domme', 'Latex domme', 'latex', ['pegging', 'bondage', 'chastity'], 'hard', 0, 'latex opera gloves',
    'My latex squeaks as I circle you, and every rule today is mine.', ['black latex catsuit', 'red latex corset dress', 'latex leggings and opera gloves'], 'cold'),
  d('strapon-queen', 'Strap-on queen', 'latex', ['pegging', 'strapon-oral', 'strapon-tease'], 'hard', 0, 'O-ring choker',
    'My harness is already on, and you know exactly what it is for.', ['leather harness over a bodysuit', 'thigh boots and a strap-on harness', 'black lingerie and harness']),
  d('sweet-tease', 'Sweet tease', 'sweet', ['mirror', 'nipples', 'striptease'], 'soft', 0, 'pink heart choker',
    'I want you giggly, blushing and wrapped around my little finger.', ['pastel skirt and knee socks', 'pink lace sundress', 'fluffy cardigan and mini skirt'], 'sweet'),
  d('milf', 'MILF', 'classy', ['strapon-oral', 'nipples', 'milking'], 'mixed', 1, 'pearl necklace',
    'Mommy knows exactly what her pretty girl needs today.', ['silk wrap dress and pearls', 'tight pencil dress', 'satin robe over lingerie'], 'sultry'),
  d('goth', 'Goth', 'goth', ['chastity', 'bondage', 'photo-tease'], 'hard', 0, 'spiked choker',
    'Black lace, candlelight and a little cruelty, the way I like it.', ['mesh top and PVC skirt', 'black lace dress and platforms', 'corset and torn tights']),
  d('anime', 'Anime girl', 'anime', ['mirror', 'dildo-ride', 'photo-tease'], 'soft', 1, 'hair bows',
    'Kyaa, you look so kawaii today, I could just eat you up.', ['sailor uniform', 'frilly magical-girl dress', 'oversized hoodie and thigh-highs'], 'playful'),
  d('hentai', 'Hentai-inspired', 'anime', ['milking', 'dildo-ride', 'pegging'], 'hard', 2, 'ahoge hair clip',
    'Today is going to be completely shameless and over the top, just like in my favorite doujin.', ['tiny shrine-maiden robe', 'skin-tight bodysuit', 'micro bikini under a coat']),
  d('fantasy-queen', 'Fantasy queen', 'fantasy', ['strapon-oral', 'bondage', 'pegging'], 'hard', 0, 'jeweled tiara',
    'Kneel before your queen, Frida, and be grateful for my attention.', ['gold-trimmed velvet gown', 'jeweled corset and cape', 'silk gown and crown'], 'stern'),
  d('office-boss', 'Office boss', 'office', ['plug', 'strapon-oral', 'photo-tease'], 'mixed', 0, 'glasses',
    'Consider this your performance review, and I am very demanding.', ['pencil skirt suit and heels', 'silk blouse and tight trousers', 'power blazer dress'], 'stern'),
  d('nurse', 'Nurse', 'nurse', ['milking', 'plug', 'nipples'], 'mixed', 0, 'nurse cap',
    'Time for your check-up, sweetie, and I am very thorough.', ['white latex nurse dress', 'tight scrubs', 'nurse uniform and stockings'], 'sweet'),
  d('gym', 'Gym girl', 'sporty', ['dildo-ride', 'pegging', 'striptease'], 'mixed', 0, 'sweatband',
    'Warm-up is over, now we count your reps my way.', ['sports bra and leggings', 'crop top and booty shorts', 'tight one-piece gym suit'], 'playful'),
  d('succubus', 'Succubus', 'goth', ['milking', 'chastity', 'nipples'], 'hard', 1, 'little horns headband',
    'I feed on your frustration, and today I am starving.', ['black corset and tail', 'sheer red gown', 'leather bodysuit with wings'], 'sultry'),
  d('elf', 'Elf', 'fantasy', ['nipples', 'mirror', 'striptease'], 'soft', 0, 'pointed ear cuffs',
    'In my forest we take our time, and every touch is a ritual.', ['flowing green silk', 'leaf-embroidered tunic', 'sheer white gown'], 'sweet'),
  d('bimbo', 'Bimbo', 'bimbo', ['mirror', 'strapon-oral', 'photo-tease'], 'mixed', 2, 'pink glitter nails',
    'Like, totally, today you are going to be the girliest girl ever.', ['pink micro dress', 'tiny tube top and mini skirt', 'pink latex dress'], 'playful'),
  d('schoolgirl-cosplay', 'Schoolgirl cosplay (adult)', 'anime', ['photo-tease', 'mirror', 'plug'], 'mixed', 0, 'tie and knee socks',
    'Grown-up roleplay time: you are late for class and I am the strict prefect.', ['tartan skirt and tied blouse', 'blazer cosplay set', 'sailor cosplay']),
  d('cowgirl', 'Cowgirl', 'western', ['dildo-ride', 'bondage', 'pegging'], 'mixed', 0, 'cowboy hat',
    'Saddle up, darlin\u2019, I am gonna rope you and ride you hard.', ['denim shorts and plaid shirt', 'fringed suede and boots', 'leather chaps and bikini top'], 'playful'),
  d('vampire', 'Vampire', 'goth', ['bondage', 'milking', 'chastity'], 'hard', 0, 'velvet choker and fake fangs',
    'Night has fallen, and I am hungry for every drop of you.', ['red velvet corset gown', 'black lace cape dress', 'Victorian mourning dress'], 'sultry'),
  d('witch', 'Witch', 'goth', ['chastity', 'dildo-ride', 'photo-tease'], 'mixed', 0, 'witch hat',
    'I have brewed a little spell, and you are under it all day.', ['black lace dress and hat', 'velvet robe', 'corset and long skirt'], 'playful'),
  d('pinup', 'Retro pin-up', 'retro', ['photo-tease', 'mirror', 'strapon-oral'], 'soft', 1, 'red hair scarf',
    'Pose for me like a 1950s calendar girl, chin up, hips out.', ['polka-dot swing dress', 'high-waist bikini', 'pencil dress and seamed stockings'], 'sweet'),
  d('cyberpunk', 'Cyberpunk', 'cyber', ['plug', 'milking', 'bondage'], 'hard', 0, 'LED choker',
    'I am running you like a program today, and errors get punished.', ['holographic vinyl jacket', 'neon bodysuit', 'techwear harness set'], 'cold'),
  d('maid', 'Maid boss', 'retro', ['plug', 'strapon-oral', 'striptease'], 'mixed', 0, 'frilly maid headband',
    'Today YOU are the maid, and I inspect every corner.', ['black satin maid dress', 'latex maid uniform', 'apron over lingerie'], 'playful'),
  d('police', 'Police roleplay', 'latex', ['bondage', 'chastity', 'pegging'], 'hard', 0, 'toy handcuffs',
    'Hands where I can see them, Frida, this is a full search.', ['PVC uniform', 'tight blue uniform and cap', 'leather jacket and badge'], 'stern'),
  d('sugar-mommy', 'Sugar mommy', 'classy', ['nipples', 'strapon-oral', 'striptease'], 'soft', 1, 'diamond earrings',
    'I bought you something pretty, now show me how grateful you are.', ['designer satin and diamonds', 'fur coat over silk', 'cocktail dress'], 'sultry'),
  d('ballet', 'Ballet mistress', 'classy', ['chastity', 'bondage', 'plug'], 'hard', -1, 'tight ballet bun',
    'Posture, Frida. Point your toes and count with me, un, deux, trois.', ['black leotard and wrap skirt', 'tutu and tights', 'ballet wrap cardigan'], 'cold'),
  d('gamer-girl', 'Gamer girl', 'anime', ['plug', 'photo-tease', 'dildo-ride'], 'mixed', 0, 'cat-ear headset',
    'GG or not, I judge your K/D and you pay for every death.', ['oversized hoodie and thigh socks', 'crop tee and shorts', 'streamer cosplay set'], 'playful'),
  d('siren', 'Siren', 'fantasy', ['nipples', 'milking', 'striptease'], 'soft', 1, 'pearl body chain',
    'Listen to my song, Frida, and drift wherever I lead you.', ['shell bra and sheer sarong', 'sequined mermaid gown', 'wet-look swimsuit'], 'sultry'),
  d('viking', 'Viking warrior', 'fantasy', ['pegging', 'bondage', 'strapon-oral'], 'hard', 0, 'fur stole',
    'I conquer what I want, and today I want you.', ['fur cloak and leather', 'chainmail bikini', 'braided leather armor'], 'stern'),
  d('librarian', 'Shy librarian', 'office', ['mirror', 'plug', 'photo-tease'], 'soft', 0, 'round glasses',
    'Shh, be very quiet, I have a naughty little story to act out with you.', ['cardigan and pleated skirt', 'high-neck blouse and pencil skirt', 'knit dress'], 'sweet'),
  d('punk', 'Punk', 'goth', ['pegging', 'dildo-ride', 'chastity'], 'hard', 0, 'safety-pin collar',
    'Loud music, ripped fishnets and zero mercy, let\u2019s go.', ['ripped fishnets and leather jacket', 'band tee and plaid skirt', 'studded corset'], 'playful'),
  d('catgirl', 'Catgirl', 'anime', ['plug', 'dildo-ride', 'nipples'], 'mixed', 1, 'cat ears and bell collar',
    'Nya, pet me properly or I will scratch, and you will wear a tail too.', ['collar and striped thigh-highs', 'cat-ear hoodie dress', 'black bodysuit with tail'], 'playful'),
  d('tantric', 'Tantric guru', 'sporty', ['milking', 'nipples', 'striptease'], 'soft', 0, 'mala beads',
    'Breathe with me, Frida, slow and deep, every sensation counts.', ['sage-green yoga set', 'silk wrap and oils', 'flowing linen dress'], 'sweet'),
];

export const STYLE_BY_ID = Object.fromEntries(STYLE_DEFS.map((s) => [s.id, s])) as Record<KnownFor, StyleDef>;
export const styleLabel = (id: KnownFor) => STYLE_BY_ID[id]?.label ?? id;
