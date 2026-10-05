import { readFileSync, readdirSync } from 'node:fs';
import { DEFAULT_STARS } from '../src/stars';
import { addDays, generateDay, orderedTags, pickStarId, regenerateChallenges } from '../src/engine';
import { BUILTIN_TAGS, OUTER_LAYERS } from '../src/tags';
import type { DayRecord, Star } from '../src/types';

const BAD_VAG = /vagin|pussy|clit|labia|cunni/i;
const EDG = /edg/i;
const fail = (m: string) => { throw new Error(m); };

for (const f of readdirSync('src').filter((x) => /\.tsx?$/.test(x))) {
  const t = readFileSync(`src/${f}`, 'utf8');
  if (EDG.test(t)) fail(`'edg' in src/${f}`);
  if (BAD_VAG.test(t)) fail(`vaginal in src/${f}`);
}

const stars = DEFAULT_STARS.map((s) => ({ ...s }));
const days: Record<string, DayRecord> = {};
const start = '2026-10-05';
let edg = 0, vag = 0, maxCh = 0;

for (let n = 0; n < 80; n++) {
  const d = addDays(start, n);
  const id = pickStarId(d, stars, days);
  const star = stars.find((s) => s.id === id)!;
  const tags = ['kaelder', 'handel', 'dinner', 'spil'];
  const plan = generateDay(d, star, 'C', days, tags);
  if (plan.challenges.length !== 3) fail(`need 3 got ${plan.challenges.length}`);
  maxCh = Math.max(maxCh, plan.challenges.length);
  const covered = plan.challenges.map((c) => c.fromTag).filter(Boolean) as string[];
  if (new Set(covered).size !== covered.length) fail(`duplicate tag coverage on ${d}: ${covered}`);
  // each covered tag must be one of the selected tags
  for (const t of covered) if (!tags.includes(t)) fail(`challenge from unknown tag ${t}`);
  // with 4 tags, 3 distinct challenges should cover 3 of them
  if (covered.length !== 3) fail(`expected 3 fromTags got ${covered}`);
  // leftover tag must appear in layers or sex lean evidence
  const leftover = tags.filter((t) => !covered.includes(t));
  if (leftover.length !== 1) fail(`expected 1 leftover tag, got ${leftover}`);
  const layerIds = Object.keys(OUTER_LAYERS).filter((t) => tags.includes(t));
  const layersText = plan.outfit.layers ?? '';
  for (const t of layerIds) {
    // every layer-capable selected tag must appear in merged layers
    if (!layersText.toLowerCase().includes(BUILTIN_TAGS.find((b) => b.id === t)!.label.toLowerCase().slice(0, 5))) {
      // basement / grocery labels
      if (!layersText) fail(`missing layers entirely`);
    }
  }
  // all layer tags mentioned in merged layers string
  if (layerIds.length && layerIds.filter((t) => layersText.includes(BUILTIN_TAGS.find((b) => b.id === t)!.label)).length < layerIds.length) {
    fail(`layers missing some tags: ${layersText} vs ${layerIds}`);
  }
  const js = JSON.stringify(plan);
  if (EDG.test(js)) edg++;
  if (BAD_VAG.test(js)) vag++;
  days[d] = { plan, games: [], status: {}, sexDone: false };
}

// Explicit 4-tag example
function force(star: Star, styleId: string, tags: string[]) {
  const solo = { ...star, knownFor: [styleId as Star['knownFor'][number]] };
  return regenerateChallenges(generateDay('2026-10-05', solo, 'C', {}, tags), solo, tags);
}
const milf = stars.find((s) => s.knownFor.includes('milf'))!;
const tags4 = ['kaelder', 'handel', 'dinner', 'spil'];
const sample = force(milf, 'milf', tags4);
const covered = sample.challenges.map((c) => c.fromTag!);
if (new Set(covered).size !== 3) fail(`sample coverage ${covered}`);
const leftover = tags4.filter((t) => !covered.includes(t));
console.log('ordered cover slots:', orderedTags(tags4).slice(0, 3));
console.log(`${80} four-tag days: edg ${edg} vag ${vag} maxCh ${maxCh}`);
if (leftover[0] === 'spil' && sample.sex.location !== 'at your gaming desk') fail(`spil leftover should lean gaming desk, got ${sample.sex.location}`);
console.log('EXAMPLE 4-tag day:', JSON.stringify({
  star: sample.starName,
  style: sample.styleLabel,
  tags: sample.tags,
  coveredChallenges: sample.challenges.map((c) => ({ tag: c.fromTag, text: c.text })),
  leftoverTagInfluences: {
    leftover,
    layers: sample.outfit.layers,
    sex: { form: sample.sex.formLabel, min: sample.sex.minutes, intensity: sample.sex.intensity, loc: sample.sex.location },
  },
}, null, 2));
