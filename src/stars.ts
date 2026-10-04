import { STYLE_BY_ID, STYLE_DEFS } from './looks';
import type { KnownFor, Star, Tone } from './types';

// Every persona here is entirely fictional, with invented names.

const h = (
  id: string, name: string, hair: string, body: string, cup: string, wardrobe: string,
  personality: string, tone: Tone, knownFor: KnownFor[],
): Star => ({ id, name, hair, body, cup, wardrobe, personality, tone, knownFor, enabled: true });

const HANDMADE: Star[] = [
  h('margaux', 'Margaux Vellichor', 'Honey-blonde waves', 'Curvy, soft hips', 'D', 'Silk wrap dress and pearls', 'Warm, confident, loves to praise and to take charge.', 'sultry', ['milf', 'sugar-mommy', 'strapon-queen']),
  h('seraphine', 'Seraphine Kael', 'Jet-black sleek ponytail', 'Tall, athletic', 'C', 'Black latex catsuit, thigh boots', 'Icy, precise, never raises her voice.', 'cold', ['latex-domme', 'strapon-queen', 'police']),
  h('pippa', 'Pippa Lumen', 'Strawberry curls with bows', 'Petite, freckled', 'B', 'Pastel skirt and knee socks', 'Giggly, affectionate, teases until you beg.', 'sweet', ['sweet-tease', 'anime', 'pinup']),
  h('nyx', 'Nyx Ravenmoor', 'Black bob with blunt bangs', 'Pale, slim, tattooed', 'B', 'Mesh top, PVC skirt, platforms', 'Dry humor, dark tastes, quietly cruel.', 'cold', ['goth', 'punk', 'witch']),
  h('kiko', 'Kiko Hanabira', 'Pink twin tails', 'Small, bouncy', 'C', 'Sailor-style uniform', 'Hyper, cute, says "senpai" a lot.', 'playful', ['anime', 'schoolgirl-cosplay', 'catgirl']),
  h('tenko', 'Tenko Mizuchi', 'Long silver hair, fox ears', 'Exaggerated curves', 'H', 'Tiny shrine-maiden robe', 'Mischievous trickster, loves over-the-top scenarios.', 'sultry', ['hentai', 'anime', 'succubus']),
  h('ysolde', 'Queen Ysolde Thornveil', 'Crimson braids under a crown', 'Regal, tall', 'D', 'Gold-trimmed velvet gown', 'Commanding, expects bowing and gratitude.', 'stern', ['fantasy-queen', 'strapon-queen', 'viking']),
  h('corinna', 'Corinna Vossbeck', 'Tight chestnut bun, glasses', 'Slim, sharp', 'C', 'Pencil skirt suit, heels', 'Efficient, demanding, rewards performance.', 'stern', ['office-boss', 'latex-domme', 'librarian']),
  h('odile', 'Nurse Odile Marchbank', 'Auburn hair, nurse cap', 'Soft, curvy', 'DD', 'White latex nurse dress', 'Caring but clinical; checks you thoroughly.', 'sweet', ['nurse', 'milf', 'latex-domme']),
  h('tamsin', 'Tamsin Brawnley', 'Blonde high ponytail', 'Muscular, toned', 'C', 'Sports bra and leggings', 'Competitive coach energy, counts your reps.', 'playful', ['gym', 'strapon-queen', 'cowgirl']),
  h('lilitha', 'Lilitha Embervane', 'Wine-red hair, small horns', 'Hourglass', 'E', 'Black corset and tail', 'Hungry, seductive, feeds on your frustration.', 'sultry', ['succubus', 'vampire', 'latex-domme']),
  h('sylwen', 'Sylwen Aetheris', 'Platinum hair, pointed ears', 'Slender, graceful', 'B', 'Flowing green silk', 'Gentle, patient, loves rituals.', 'sweet', ['elf', 'tantric', 'siren']),
  h('honey', 'Honey Larkspur', 'Platinum blonde extensions', 'Big curves', 'G', 'Pink micro dress', 'Bubbly, shameless, wants you extra girly.', 'playful', ['bimbo', 'pinup', 'sugar-mommy']),
  h('ravella', 'Mistress Ravella Grimsby', 'Raven-black waves', 'Strong, tall', 'D', 'Leather corset, gloves', 'Strict, ritualized, punishes small mistakes.', 'stern', ['latex-domme', 'strapon-queen', 'vampire']),
  h('bunny', 'Bunny Plushwick', 'White bob, bunny ears', 'Petite, round', 'D', 'Satin bunny suit', 'Playful, a little bratty, loves costumes.', 'playful', ['anime', 'catgirl', 'bimbo']),
  h('imelda', 'Professor Imelda Quill', 'Grey-streaked bun', 'Elegant, mature', 'C', 'Tweed skirt, silk blouse', 'Lectures, grades, detention.', 'stern', ['office-boss', 'librarian', 'milf']),
  h('vex', 'Vex Chromatica', 'Neon blue undercut', 'Lean, chrome tattoos', 'C', 'Holographic vinyl jacket', 'Techy, detached, runs you like a program.', 'cold', ['cyberpunk', 'latex-domme', 'gamer-girl']),
  h('beatrix', 'Lady Beatrix Ashcombe', 'Pinned dark curls', 'Corseted, slim', 'B', 'Lace high-neck gown', 'Proper, cutting, expects perfect manners.', 'cold', ['ballet', 'vampire', 'maid']),
  h('dolly', 'Dolly Fizzwhistle', 'Red victory rolls', 'Curvy', 'DD', 'Polka-dot swing dress', 'Cheery, flirty, loves dressing you up.', 'sweet', ['pinup', 'maid', 'sweet-tease']),
  h('saoirse', 'Saoirse Bramblewood', 'Wild copper hair', 'Curvy, freckled', 'D', 'Black lace dress and hat', 'Mischievous, casts "spells" on you.', 'playful', ['witch', 'goth', 'elf']),
  h('ziva', 'Ziva Nightglass', 'Long black hair, red streak', 'Pale, slender', 'C', 'Red velvet corset gown', 'Ancient, possessive, slow and hungry.', 'sultry', ['vampire', 'goth', 'succubus']),
  h('rhea', 'Captain Rhea Solvane', 'Short silver crop', 'Fit, tall', 'C', 'White fitted uniform', 'Military precision, gives orders.', 'stern', ['cyberpunk', 'police', 'gym']),
  h('coco', 'Coco Velourette', 'Dark bob, white headband', 'Petite, curvy', 'D', 'Black satin maid dress', 'Bossy, sassy, makes YOU the maid.', 'playful', ['maid', 'pinup', 'strapon-queen']),
  h('juno', 'Juno Brassheart', 'Pink mohawk', 'Wiry, pierced', 'B', 'Ripped fishnets, leather jacket', 'Loud, rough, laughs at you.', 'playful', ['punk', 'strapon-queen', 'goth']),
  h('mirelle', 'Mirelle Opaline', 'Sea-green long waves', 'Smooth, curvy', 'DD', 'Shell bra and sheer sarong', 'Hypnotic, sings you into obedience.', 'sultry', ['siren', 'elf', 'tantric']),
  h('kitty', 'Kitty Purrsworth', 'Lilac hair, cat ears', 'Petite, flexible', 'C', 'Collar and striped thigh-highs', 'Lazy, bratty, demands attention.', 'playful', ['catgirl', 'gamer-girl', 'anime']),
  h('selin', 'Selin Marrowgate', 'Dark braid', 'Lithe, flexible', 'B', 'Sage-green yoga set', 'Calm, breath-focused, loves long slow teasing.', 'sweet', ['tantric', 'gym', 'elf']),
  h('marit', 'Officer Marit Kestrel', 'Blonde braid under cap', 'Athletic', 'C', 'PVC uniform, handcuffs', 'By-the-book, enjoys "searches".', 'stern', ['police', 'latex-domme', 'cowgirl']),
  h('aurelia', 'Aurelia Goldvane', 'Glossy caramel blowout', 'Lush, tanned', 'E', 'Designer satin and diamonds', 'Generous, spoiling, buys you lingerie.', 'sultry', ['sugar-mommy', 'milf', 'bimbo']),
  h('rin', 'Rin Akagami', 'Red hair, cat headset', 'Slim', 'B', 'Oversized hoodie, thigh socks', 'Trash-talks, judges your K/D harshly.', 'playful', ['gamer-girl', 'anime', 'punk']),
  h('valka', 'Valka Frostmane', 'Ice-blonde warrior braids', 'Tall, powerful', 'D', 'Fur cloak and leather', 'Fierce, takes what she wants.', 'stern', ['viking', 'strapon-queen', 'fantasy-queen']),
  h('pearl', 'Pearl Dewberry', 'Mousy bun, round glasses', 'Soft, petite', 'C', 'Cardigan and pleated skirt', 'Shy but secretly very kinky.', 'sweet', ['librarian', 'sweet-tease', 'schoolgirl-cosplay']),
  h('dasha', 'Dasha Kornblume', 'Severe blonde bun', 'Lean, flexible', 'B', 'Black leotard and wrap skirt', 'Perfectionist, counts in French.', 'cold', ['ballet', 'latex-domme', 'office-boss']),
  h('glimmer', 'Glimmer Vane', 'Glossy pink wig', 'Doll-like curves', 'F', 'Pink latex dress', 'Wants you as her perfect plastic doll.', 'cold', ['bimbo', 'latex-domme', 'cyberpunk']),
];

// ---------- generated roster ----------
const FIRST = (
  'Aelith Albreda Alcyone Amarante Anwen Arabeth Ardith Aubrielle Avelina Azura Belisande Benedetta Berenike Brisane ' +
  'Briseis Caelia Calantha Camberly Carys Cassiel Celestine Ceridwen Clemence Coralie Corisande Cosima Cressida Damaris ' +
  'Delphia Domenica Drusilla Elowen Elspeth Emberly Eirlys Esmerine Estrid Eulalie Evadne Fenella Fianna Fiorella Florimel ' +
  'Gwenllian Gisela Gloriana Guinevra Halcyon Hesper Honorine Idonea Ilsabet Isaura Iolanthe Jessamy Jocasta Kerensa ' +
  'Kestra Lavinia Leocadia Liora Lisandra Lucasta Lysandra Maelis Marisela Melisande Merewyn Mireille Morwenna Nerys Nimue ' +
  'Noelani Oriel Orsola Ottoline Perpetua Primrose Quenby Romilly Rosalind Rowena Sabeline Sapphira Severine Sidonie ' +
  'Solenne Sorcha Sunniva Talwyn Thessaly Tindra Ulrika Valmai Verity Wilhelmina Winifred Xanthe Yseult Zinnia Zuleika ' +
  'Amabel Anouk Aurore Belphoebe Blodwen Briony Calla Carmela Celandine Cerise Columbine Dagny Edda Eira Fable Galatea ' +
  'Germaine Greer Hedda Henrietta Hollis Isadora Jacinta Kalinda Kirsi Larkin Leontyne Linnea Lorelei Lucienne Lumi ' +
  'Magnolia Malvina Marguerite Melusine Minerva Mirabel Odessa Ondine Ophelia Orla Paloma Pandora Petronella Quilla ' +
  'Renata Rosamund Saffron Salome Saskia Senna Sigrid Solveig Tabitha Tallulah Temperance Theodora Tova Ursa Vashti ' +
  'Wren Yara Ysabel Zephyrine Zosia Ambrosia Anthea Asteria Bryony Cleona Dorothea Eglantine Giselle Hyacinth Isobel ' +
  'Junia Kalista Leticia Lilou Maelle Marjolaine Nolwenn Oona Prisca Rosalba Thisbe Undine Violaine Wynne Xenia Yvaine ' +
  'Liesel Malin Nanette Ottilie Philomena Romaine Sylvaine Ilse Gudrun Ragna Brynja Thyra Signe Freja Svana Runa Embla ' +
  'Ylva Ebba Idun Kaija Aino Tuuli Mirja Riikka Mayuri Hotaru Suzume Chiyoko Kanade Mitsuki Yuzuha Rinne Kohana Sayoko ' +
  'Tsubaki Ayame Kaede Shion Momiji Esperanza Graciela Luzmila Rocio Soledad Ximena Bozena Dragana Ludmila Miroslava ' +
  'Radka Svetla Zlata Jarmila Ksenia Zdenka Oksana Vesna Ilaria Ornella Fiametta Annunziata Bellatrix Clotilde Ermengarde'
).split(' ');

const SUR_A = ['Ash', 'Bram', 'Cinder', 'Dusk', 'Ember', 'Fen', 'Gloom', 'Hazel', 'Ivory', 'Lark', 'Moon', 'Night', 'Opal', 'Pine',
  'Quill', 'Raven', 'Silver', 'Thorn', 'Velvet', 'Wild', 'Winter', 'Rose', 'Storm', 'Frost', 'Ever', 'Mist', 'Briar', 'Copper',
  'Hollow', 'Lace', 'Plum', 'Sable', 'Willow', 'Amber', 'Crimson', 'Satin', 'Wisp', 'Vesper', 'Myrtle', 'Glimmer'];
const SUR_B = ['vale', 'mere', 'crest', 'bourne', 'hart', 'ridge', 'light', 'song', 'whisper', 'bloom', 'fall', 'grove',
  'thorne', 'wick', 'shade', 'haven', 'veil', 'ling', 'sworth', 'mantle', 'kiss', 'spire', 'ford', 'lowe'];

const HAIR_COLOR = ['Jet-black', 'Raven', 'Platinum', 'Honey-blonde', 'Strawberry-blonde', 'Copper', 'Auburn', 'Chestnut',
  'Chocolate', 'Silver', 'Lilac', 'Pastel pink', 'Neon blue', 'Emerald', 'Wine-red', 'Ash-blonde', 'Caramel', 'Snow-white', 'Teal', 'Rose-gold'];
const HAIR_STYLE = ['long waves', 'sleek ponytail', 'blunt bob', 'pixie cut', 'twin tails', 'messy bun', 'braided crown', 'curly mane',
  'high ponytail', 'side-swept bangs', 'undercut', 'victory rolls', 'long straight hair', 'shoulder-length curls', 'space buns'];
const BODY = ['Petite', 'Slim', 'Athletic', 'Curvy', 'Hourglass', 'Tall and leggy', 'Soft and voluptuous', 'Toned', 'Thick-thighed',
  'Willowy', 'Muscular', 'Pear-shaped', 'Petite and busty', 'Statuesque'];
const TRAITS: Record<Tone, string[]> = {
  sweet: ['Warm and affectionate', 'Gentle and patient', 'Bubbly and caring', 'Shy but secretly kinky'],
  stern: ['Strict and precise', 'Commanding and proud', 'Demanding but fair', 'Disciplined and exacting'],
  playful: ['Bratty and mischievous', 'Loud and teasing', 'Giggly and wicked', 'Cheeky and competitive'],
  cold: ['Icy and detached', 'Quietly cruel', 'Aloof and elegant', 'Calm and merciless'],
  sultry: ['Slow and seductive', 'Hungry and possessive', 'Smoky-voiced and teasing', 'Lazy and sensual'],
};
const QUIRKS = ['loves making you blush', 'counts everything out loud', 'rewards obedience with praise', 'hates excuses',
  'collects pretty lingerie for you', 'talks you through every step', 'laughs when you squirm', 'insists on eye contact',
  'loves your forms on display', 'makes you say thank you', 'keeps you guessing', 'writes rules on your mirror',
  'loves photos of you', 'never repeats herself', 'adores slow undressing', 'judges your gaming harshly',
  'plans everything to the minute', 'spoils you afterwards', 'whispers instead of shouting', 'makes you curtsy'];
const GROUPS: KnownFor[][] = [
  ['latex-domme', 'strapon-queen', 'goth', 'vampire', 'succubus', 'police', 'punk', 'witch', 'cyberpunk'],
  ['sweet-tease', 'anime', 'catgirl', 'schoolgirl-cosplay', 'gamer-girl', 'pinup', 'librarian', 'bimbo', 'hentai'],
  ['milf', 'office-boss', 'sugar-mommy', 'nurse', 'ballet', 'maid', 'librarian', 'strapon-queen'],
  ['fantasy-queen', 'elf', 'siren', 'succubus', 'vampire', 'witch', 'viking', 'hentai'],
  ['gym', 'cowgirl', 'tantric', 'viking', 'bimbo', 'strapon-queen', 'punk'],
];
const CUP_POOL = ['B', 'B', 'C', 'C', 'C', 'D', 'D', 'D', 'DD', 'DD', 'E', 'E', 'F', 'G', 'H'];
const TONES: Tone[] = ['sweet', 'stern', 'playful', 'cold', 'sultry'];

function seeded(n: number) {
  let a = (n * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const ROSTER_SIZE = 250;

function generate(count: number, taken: Set<string>): Star[] {
  const out: Star[] = [];
  const firsts = FIRST.filter((f, i) => FIRST.indexOf(f) === i && !taken.has(f));
  const usedSur = new Set<string>();
  for (let i = 0; out.length < count && i < firsts.length; i++) {
    const r = seeded(i + 1);
    const pk = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
    let sur = '';
    for (let tries = 0; tries < 50 && (!sur || usedSur.has(sur)); tries++) sur = pk(SUR_A) + pk(SUR_B);
    usedSur.add(sur);
    const group = pk(GROUPS);
    const primary = pk(group);
    const n = 2 + Math.floor(r() * 3); // 2-4 styles
    const known: KnownFor[] = [primary];
    while (known.length < n) {
      const c = r() < 0.7 ? pk(group) : pk(STYLE_DEFS).id;
      if (!known.includes(c)) known.push(c);
    }
    const def = STYLE_BY_ID[primary];
    const tone = def.tone && r() < 0.6 ? def.tone : pk(TONES);
    let cup = pk(CUP_POOL);
    if (primary === 'bimbo' || primary === 'hentai') cup = pk(['F', 'G', 'H']);
    if (primary === 'ballet') cup = 'B';
    out.push({
      id: `g${String(i + 1).padStart(3, '0')}`,
      name: `${firsts[i]} ${sur}`,
      hair: `${pk(HAIR_COLOR)} ${pk(HAIR_STYLE)}`,
      body: pk(BODY),
      cup,
      wardrobe: pk(def.wardrobes),
      personality: `${pk(TRAITS[tone])}; ${pk(QUIRKS)}.`,
      tone,
      knownFor: known,
      enabled: true,
    });
  }
  return out;
}

const takenFirst = new Set(HANDMADE.map((s) => s.name.split(' ').find((p) => !['Queen', 'Mistress', 'Nurse', 'Professor', 'Lady', 'Captain', 'Officer'].includes(p))!));
export const DEFAULT_STARS: Star[] = [...HANDMADE, ...generate(ROSTER_SIZE - HANDMADE.length, takenFirst)];
