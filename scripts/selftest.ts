import { readFileSync, readdirSync } from 'node:fs';
import { DEFAULT_STARS } from '../src/stars';
import { addDays, effectivePlan, generateDay, pickStarId, regenerateChallenges } from '../src/engine';
import { BUILTIN_TAGS, TAG_GROUPS } from '../src/tags';
import type { DayRecord, Star } from '../src/types';

const BAD_VAG = /vagin|pussy|clit|labia|cunni/i;
const EDG = /edg/i;
const fail = (m: string) => { throw new Error(m); };

for (const f of readdirSync('src').filter((x) => /\.tsx?$/.test(x))) {
  const t = readFileSync(`src/${f}`, 'utf8');
  if (EDG.test(t)) fail(`'edg' in src/${f}`);
  if (BAD_VAG.test(t)) fail(`vaginal term in src/${f}`);
}

const stars = DEFAULT_STARS.map((s) => ({ ...s }));
if (!BUILTIN_TAGS.some((t) => t.id === 'kaelder')) fail('missing basement tag');
if (TAG_GROUPS.length !== 4) fail('need 4 tag groups');
if (BUILTIN_TAGS.length < 18) fail(`too few tags: ${BUILTIN_TAGS.length}`);

const DAYS = 120;
const days: Record<string, DayRecord> = {};
const start = '2026-10-05';
const tagSets = [
  ['kaelder', 'handel', 'dinner'],
  ['fisk', 'hus'],
  ['spil', 'tv'],
  ['arbejde', 'trafik'],
  ['cook', 'laundry', 'vacuum'],
  ['workout', 'shower'],
  ['friends', 'errands'],
  ['skole', 'tur'],
];
let edg = 0, vag = 0, maxCh = 0, checked = 0;
const recent: string[] = [];
for (let n = 0; n < DAYS; n++) {
  const d = addDays(start, n);
  const id = pickStarId(d, stars, days);
  if (recent.slice(-7).includes(id)) fail(`star repeat ${d}`);
  const star = stars.find((s) => s.id === id)!;
  const tags = tagSets[n % tagSets.length];
  let plan = generateDay(d, star, 'C', days, tags);
  if (plan.challenges.length !== 3) fail(`challenges ${plan.challenges.length} for ${tags}`);
  if (generateDay(d, star, 'C', days, []).challenges.length !== 0) fail('empty tags should have 0 challenges');
  const regen = regenerateChallenges(plan, star, tags);
  if (regen.sex.scene !== plan.sex.scene) fail('regen changed sex');
  plan = regen;
  if (tags.some((t) => ['fisk', 'handel', 'arbejde', 'skole', 'tur', 'bil', 'trafik', 'errands', 'friends', 'workout', 'kaelder'].includes(t)) && !plan.outfit.layers) {
    fail(`missing layers for ${tags}`);
  }
  const rec: DayRecord = { plan, games: [], status: {}, sexDone: false };
  for (const st of ['none', 'done'] as const) {
    const r = structuredClone(rec);
    if (st === 'done') plan.challenges.forEach((c) => { r.status[c.id] = 'done'; });
    const { plan: p } = effectivePlan(r, new Date(`${d}T12:00`));
    const js = JSON.stringify(p);
    if (EDG.test(js)) edg++;
    if (BAD_VAG.test(js)) vag++;
    maxCh = Math.max(maxCh, p.challenges.length);
    checked++;
  }
  days[d] = rec;
  recent.push(id);
}

function forceStyle(star: Star, styleId: string, date: string, tags: string[]) {
  const solo = { ...star, knownFor: [styleId as Star['knownFor'][number]] };
  return regenerateChallenges(generateDay(date, solo, 'C', {}, tags), solo, tags);
}
const milf = stars.find((s) => s.knownFor.includes('milf'))!;
const sample = forceStyle(milf, 'milf', '2026-10-05', ['kaelder', 'handel', 'dinner']);
if (sample.challenges.length !== 3) fail('sample challenges');
if (!sample.outfit.layers) fail('sample needs layers (kaelder/handel)');
if (!/basement|grocery|dinner|cook|milf|lingerie|overall|apron|kitchen|shop/i.test(sample.challenges.map((c) => c.text).join(' '))) {
  // soft check — at least some tag-related words
  console.warn('sample challenges may be generic:', sample.challenges.map((c) => c.text));
}

console.log(`tags ${BUILTIN_TAGS.length} in groups ${TAG_GROUPS.map((g) => g.label).join('/')}`);
console.log(`${DAYS} days, ${checked} variants: edg ${edg} | vaginal ${vag} | maxCh ${maxCh}`);
console.log('SAMPLE Basement+Grocery+Dinner (MILF):', JSON.stringify({
  star: sample.starName, style: sample.styleLabel, tags: sample.tags,
  summary: sample.outfit.summary, layers: sample.outfit.layers,
  sex: { form: sample.sex.formLabel, min: sample.sex.minutes, intensity: sample.sex.intensity },
  challenges: sample.challenges.map((c) => c.text),
}, null, 2));
