import { readFileSync, readdirSync } from 'node:fs';
import { DEFAULT_STARS } from '../src/stars';
import { generateDay, needsLayers, regenerateChallenges } from '../src/engine';
import { FULL_LOOKS, NORMAL_LOOKS } from '../src/wardrobe';
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
if (needsLayers(['hus', 'cook', 'shower'])) fail('all-home should not layer');
if (!needsLayers(['hus', 'handel'])) fail('home+grocery should layer');
if (needsLayers(['handel', 'tur', 'fisk'])) fail('all-out should be single tailored');

const stars = DEFAULT_STARS.map((s) => ({ ...s }));
let edg = 0, vag = 0;
for (let n = 0; n < 40; n++) {
  const star = stars[n % stars.length];
  const tags = [['hus', 'cook', 'shower'], ['hus', 'handel'], ['spil', 'tv'], ['arbejde', 'trafik']][n % 4];
  const plan = generateDay(`2026-11-${String((n % 28) + 1).padStart(2, '0')}`, star, 'C', {}, tags);
  if (plan.challenges.length !== 3 && tags.length >= 2) {
    if (plan.challenges.length > 3) fail('>3 challenges');
  }
  const layered = needsLayers(tags);
  if (!layered && plan.outfit.swaps.length) fail(`single day has swaps: ${tags}`);
  if (layered && !plan.outfit.swaps.length) fail(`layered day missing swaps: ${tags}`);
  if (plan.outfit.evening) fail('evening block should not appear in v3.7 single/layered modes');
  const js = JSON.stringify(plan);
  if (EDG.test(js)) edg++;
  if (BAD_VAG.test(js)) vag++;
}
console.log(`wardrobe: ${NORMAL_LOOKS.length}+${FULL_LOOKS.length}; 40 days edg ${edg} vag ${vag}`);

function force(star: Star, styleId: string, tags: string[], date: string) {
  const solo = { ...star, knownFor: [styleId as Star['knownFor'][number]] };
  return regenerateChallenges(generateDay(date, solo, 'C', {}, tags), solo, tags);
}
const milf = stars.find((s) => s.knownFor.includes('milf'))!;
const maid = stars.find((s) => s.knownFor.includes('maid'))!;
const home = force(maid, 'maid', ['hus', 'cook', 'shower'], '2026-10-06');
const mixed = force(milf, 'milf', ['hus', 'handel'], '2026-10-05');
if (home.outfit.swaps.length || home.outfit.evening) fail('all-home must be one outfit');
if (!mixed.outfit.swaps.some((s) => s.tag === 'handel')) fail('grocery cover missing');

console.log('\n1 ALL-HOME (one outfit):', JSON.stringify({
  tags: home.tags, summary: home.outfit.summary, swaps: home.outfit.swaps.length,
  look: `${home.outfit.top} / ${home.outfit.bottom}`,
}, null, 2));
console.log('\n2 HOME+GROCERY (layers):', JSON.stringify({
  tags: mixed.tags, summary: mixed.outfit.summary,
  base: `${mixed.outfit.top} / ${mixed.outfit.bottom}`,
  covers: mixed.outfit.swaps,
}, null, 2));
