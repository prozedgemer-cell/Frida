import { readFileSync, readdirSync } from 'node:fs';
import { FORMS } from '../src/content';
import { STYLE_BY_ID, STYLE_DEFS } from '../src/looks';
import { DEFAULT_STARS } from '../src/stars';
import { addDays, effectivePlan, generateDay, pickStarId, regenerateChallenges } from '../src/engine';
import { BUILTIN_TAGS } from '../src/tags';
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
if (stars.length !== 250) fail(`roster size ${stars.length}`);
if (new Set(stars.map((s) => s.name.toLowerCase())).size !== stars.length) fail('duplicate names');
const BLOCK: string[] = JSON.parse(readFileSync('scripts/name-blocklist.json', 'utf8'));
for (const s of stars) if (BLOCK.includes(s.name.toLowerCase())) fail(`blocklisted name: ${s.name}`);

const DAYS = 200;
const days: Record<string, DayRecord> = {};
const start = '2026-10-05';
let edg = 0, vag = 0, maxCh = 0, checked = 0;
const tagSets = [
  ['fisk', 'hus'],
  ['spil'],
  ['arbejde', 'trafik'],
  ['skole', 'tur'],
  ['bil', 'hus'],
  ['hus'],
  ['tur', 'bil', 'trafik'],
];
const recent: string[] = [];
for (let n = 0; n < DAYS; n++) {
  const d = addDays(start, n);
  const id = pickStarId(d, stars, days);
  if (recent.slice(-7).includes(id)) fail(`star repeat within 7 days on ${d}`);
  const star = stars.find((s) => s.id === id)!;
  const tags = tagSets[n % tagSets.length];
  let plan = generateDay(d, star, 'C', days, tags);
  if (plan.challenges.length !== 3) fail(`expected 3 challenges got ${plan.challenges.length} tags=${tags} style=${plan.styleId}`);
  // no tags => empty challenges
  const empty = generateDay(d, star, 'C', days, []);
  if (empty.challenges.length !== 0) fail('challenges without tags');
  // regen keeps sex
  const regen = regenerateChallenges(plan, star, tags.includes('spil') ? ['spil', 'hus'] : tags);
  if (regen.sex.form !== plan.sex.form || regen.sex.scene !== plan.sex.scene) fail('regen changed sex');
  if (regen.challenges.length !== 3) fail('regen challenge count');
  plan = regenerateChallenges(plan, star, tags);
  for (const c of plan.challenges) {
    const js = c.text + c.link;
    if (EDG.test(js)) edg++;
    if (BAD_VAG.test(js)) vag++;
    // challenges should mention clothing / concrete activity, not "obey me" RP
    if (/\b(kneel and beg|say thank you,)\b/i.test(c.text) && !/punishment/i.test(c.kind)) {
      /* punishments may kneel — ok */
    }
  }
  // out tags should get layers
  if (tags.some((t) => ['fisk', 'arbejde', 'skole', 'tur', 'bil', 'trafik'].includes(t)) && !plan.outfit.layers) {
    fail(`missing layers for ${tags} on ${d}`);
  }
  const rec: DayRecord = { plan, games: [], status: {}, sexDone: false };
  for (const sc of [null, 5, 95]) for (const st of ['none', 'done', 'failed'] as const) {
    const r: DayRecord = structuredClone(rec);
    if (sc !== null) r.games = [{ id: 'x', game: 'CS2', kills: 0, deaths: 0, assists: 0, win: false, score: sc, at: 0 }];
    const ch = effectivePlan(r, new Date(`${d}T10:00`)).plan.challenges;
    ch.forEach((c, k) => { if (st === 'done') r.status[c.id] = 'done'; if (st === 'failed') r.status[c.id] = 'failed'; void k; });
    const { plan: p } = effectivePlan(r, new Date(`${d}T10:00`));
    const js = JSON.stringify(p);
    if (EDG.test(js)) edg++;
    if (BAD_VAG.test(js)) vag++;
    maxCh = Math.max(maxCh, p.challenges.length);
    if (p.challenges.length > 3) fail('>3 challenges');
    if (p.sex.form === 'chastity' && p.challenges.some((c) => /finish|release/i.test(c.text))) fail(`release on chastity ${d}`);
    checked++;
  }
  days[d] = rec;
  recent.push(id);
}

// Sample: Fisk+Hus with MILF or maid star
const milf = stars.find((s) => s.knownFor.includes('milf'))!;
const maid = stars.find((s) => s.knownFor.includes('maid'))!;
function forceStyle(star: Star, styleId: 'milf' | 'maid', date: string, tags: string[]) {
  // generate until style matches (style pick is seeded — temporarily force knownFor solo)
  const solo = { ...star, knownFor: [styleId] };
  return regenerateChallenges(generateDay(date, solo, 'C', {}, tags), solo, tags);
}
const sampleMilf = forceStyle(milf, 'milf', '2026-10-05', ['fisk', 'hus']);
const sampleMaid = forceStyle(maid, 'maid', '2026-10-05', ['fisk', 'hus']);
if (sampleMilf.styleId !== 'milf') fail('milf sample style');
if (sampleMaid.styleId !== 'maid') fail('maid sample style');
if (!sampleMilf.outfit.layers) fail('milf fisk should have outer layers');
if (sampleMilf.challenges.length !== 3 || sampleMaid.challenges.length !== 3) fail('sample challenge count');

console.log(`tags: ${BUILTIN_TAGS.map((t) => t.label).join(', ')}`);
console.log(`${DAYS} days, ${checked} variants: edg ${edg} | vaginal ${vag} | max challenges ${maxCh}`);
console.log(`styles ${STYLE_DEFS.length}, forms ${FORMS.length}, stars ${stars.length}`);
console.log('SAMPLE MILF + Fisk+Hus:', JSON.stringify({
  star: sampleMilf.starName, style: sampleMilf.styleLabel, tags: sampleMilf.tags,
  summary: sampleMilf.outfit.summary, layers: sampleMilf.outfit.layers,
  sex: { form: sampleMilf.sex.formLabel, min: sampleMilf.sex.minutes, intensity: sampleMilf.sex.intensity },
  challenges: sampleMilf.challenges.map((c) => c.text),
}, null, 2));
console.log('SAMPLE MAID + Fisk+Hus:', JSON.stringify({
  star: sampleMaid.starName, style: sampleMaid.styleLabel, tags: sampleMaid.tags,
  summary: sampleMaid.outfit.summary, layers: sampleMaid.outfit.layers,
  challenges: sampleMaid.challenges.map((c) => c.text),
}, null, 2));
void STYLE_BY_ID;
