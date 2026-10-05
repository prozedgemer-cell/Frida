import { readFileSync, readdirSync } from 'node:fs';
import { DEFAULT_STARS } from '../src/stars';
import { generateDay, regenerateChallenges } from '../src/engine';
import { FULL_LOOKS, NORMAL_LOOKS, lookById } from '../src/wardrobe';
import type { Star } from '../src/types';

const BAD_VAG = /vagin|pussy|clit|labia|cunni/i;
const EDG = /edg/i;
const fail = (m: string) => { throw new Error(m); };

for (const f of readdirSync('src').filter((x) => /\.tsx?$/.test(x))) {
  const t = readFileSync(`src/${f}`, 'utf8');
  if (EDG.test(t)) fail(`edg in src/${f}`);
  if (BAD_VAG.test(t)) fail(`vaginal in src/${f}`);
}
if (NORMAL_LOOKS.length !== 200) fail(`normals ${NORMAL_LOOKS.length}`);
if (FULL_LOOKS.length !== 100) fail(`fulls ${FULL_LOOKS.length}`);

const stars = DEFAULT_STARS.map((s) => ({ ...s }));
let edg = 0, vag = 0, mixed = 0, rigid = 0;
for (let n = 0; n < 80; n++) {
  const star = stars[n % stars.length];
  const tags = [['kaelder', 'handel', 'dinner'], ['hus', 'cook', 'shower'], ['spil', 'tv', 'tur'], ['arbejde', 'trafik']][n % 4];
  const plan = generateDay(`2026-11-${String((n % 28) + 1).padStart(2, '0')}`, star, 'C', {}, tags);
  if (plan.outfit.baseTier !== 'normal') fail('base must be normal');
  if (plan.challenges.length !== 3 && tags.length >= 3) fail('need 3 challenges');
  const seed = lookById[plan.outfit.baseId];
  if (!seed) fail('missing base id');
  // mixing: not all slots identical to a single catalog row
  const sameAsSeed =
    plan.outfit.panties === seed.panties && plan.outfit.bra === seed.bra
    && plan.outfit.top === seed.top && plan.outfit.bottom === seed.bottom
    && plan.outfit.legwear === seed.legwear && plan.outfit.shoes === seed.shoes;
  if (sameAsSeed) rigid++; else mixed++;
  if (plan.outfit.evening) {
    const eve = lookById[plan.outfit.evening.id];
    if (eve) {
      const eveRigid = plan.outfit.evening.top === eve.top && plan.outfit.evening.bottom === eve.bottom
        && plan.outfit.evening.panties === eve.panties && plan.outfit.evening.bra === eve.bra;
      if (!eveRigid) mixed++;
    }
  }
  const js = JSON.stringify(plan);
  if (EDG.test(js)) edg++;
  if (BAD_VAG.test(js)) vag++;
}
if (mixed < rigid) fail(`templates too rigid: mixed ${mixed} rigid ${rigid}`);
console.log(`wardrobe pools: ${NORMAL_LOOKS.length} normal + ${FULL_LOOKS.length} full templates (mixed when used)`);
console.log(`80 days: edg ${edg} vag ${vag} | mixed-piece days≈${mixed} rigid≈${rigid}`);

function force(star: Star, styleId: string, tags: string[], date: string) {
  const solo = { ...star, knownFor: [styleId as Star['knownFor'][number]] };
  return regenerateChallenges(generateDay(date, solo, 'C', {}, tags), solo, tags);
}
const milf = stars.find((s) => s.knownFor.includes('milf'))!;
const maid = stars.find((s) => s.knownFor.includes('maid'))!;
const gamer = stars.find((s) => s.knownFor.includes('gamer-girl'))!;
const examples = [
  ['A Basement+Grocery+Dinner / MILF', force(milf, 'milf', ['kaelder', 'handel', 'dinner'], '2026-10-05')],
  ['B Home+Cook+Shower / Maid', force(maid, 'maid', ['hus', 'cook', 'shower'], '2026-10-06')],
  ['C Gaming+TV+Walk / Gamer girl', force(gamer, 'gamer-girl', ['spil', 'tv', 'tur'], '2026-10-07')],
] as const;
for (const [label, p] of examples) {
  console.log('\n' + label);
  console.log(JSON.stringify({
    star: p.starName, style: p.styleLabel, tags: p.tags,
    progression: {
      baseAllDay: `${p.outfit.baseName}: ${p.outfit.panties}, ${p.outfit.bra}, ${p.outfit.top}, ${p.outfit.bottom}, ${p.outfit.legwear}, ${p.outfit.shoes}, ${p.outfit.cup}-cup`,
      activitySwaps: p.outfit.swaps.map((s) => `${s.label} → ${s.change}`),
      eveningSex: p.outfit.evening
        ? `${p.outfit.evening.name}: ${p.outfit.evening.top} / ${p.outfit.evening.bottom} (${p.outfit.evening.panties}, ${p.outfit.evening.bra})`
        : null,
    },
  }, null, 2));
}
