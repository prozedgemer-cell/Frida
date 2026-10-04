import { readFileSync, readdirSync } from 'node:fs';
import { FORMS } from '../src/content';
import { STYLE_BY_ID, STYLE_DEFS } from '../src/looks';
import { DEFAULT_STARS } from '../src/stars';
import { addDays, effectivePlan, generateDay, pickStarId } from '../src/engine';
import type { DayRecord } from '../src/types';

const BAD_VAG = /vagin|pussy|clit|labia|cunni/i;
const EDG = /edg/i;
const fail = (m: string) => { throw new Error(m); };

// --- source scan ---
for (const f of readdirSync('src').filter((x) => /\.tsx?$/.test(x))) {
  const t = readFileSync(`src/${f}`, 'utf8');
  if (EDG.test(t)) fail(`'edg' in src/${f}`);
  if (BAD_VAG.test(t)) fail(`vaginal term in src/${f}`);
}

// --- roster checks ---
const stars = DEFAULT_STARS.map((s) => ({ ...s }));
if (stars.length !== 250) fail(`roster size ${stars.length}`);
if (new Set(stars.map((s) => s.id)).size !== stars.length) fail('duplicate ids');
if (new Set(stars.map((s) => s.name.toLowerCase())).size !== stars.length) fail('duplicate names');
const firstNames = stars.map((s) => s.name.split(' ').filter((p) => !['Queen', 'Mistress', 'Nurse', 'Professor', 'Lady', 'Captain', 'Officer'].includes(p))[0]);
if (new Set(firstNames).size !== firstNames.length) fail('duplicate first names');
for (const s of stars) {
  if (s.knownFor.length < 2 || s.knownFor.length > 4) fail(`${s.name} knownFor ${s.knownFor.length}`);
  if (s.knownFor.some((k) => !STYLE_BY_ID[k])) fail(`${s.name} unknown style`);
  if (!/^(B|C|D|DD|E|F|G|H)$/.test(s.cup)) fail(`${s.name} cup ${s.cup}`);
}
// famous adult-performer / celebrity names that must never appear (full names and stage first names)
const FAMOUS_FULL = ['riley reid', 'mia khalifa', 'lana rhoades', 'sasha grey', 'jenna jameson', 'asa akira', 'abella danger',
  'angela white', 'lisa ann', 'tori black', 'dani daniels', 'brandi love', 'cherie deville', 'julia ann', 'alexis texas',
  'bree olson', 'belle delphine', 'eva elfie', 'lena paul', 'kagney linn karter', 'jesse jane', 'gianna dior', 'emily willis',
  'violet myers', 'valentina nappi', 'elsa jean', 'adriana chechik', 'nicole aniston', 'madison ivy', 'romi rain', 'kali roses',
  'vina sky', 'mia malkova', 'skye blue', 'ivy wolfe', 'eva lovia', 'jynx maze', 'joanna angel', 'bonnie rotten', 'luna star',
  'stormy daniels', 'tera patrick', 'sunny leone', 'jenna haze', 'kendra lust', 'nikki benz', 'ava addams', 'phoenix marie',
  'lexi belle', 'kimmy granger', 'aidra fox', 'remy lacroix', 'anissa kate', 'little caprice', 'sophie dee', 'kayden kross',
  'lela star', 'august ames', 'dillion harper', 'blake blossom', 'savannah bond', 'autumn falls', 'coco austin'];
const FAMOUS_FIRST = ['riley', 'mia', 'lana', 'sasha', 'jenna', 'asa', 'abella', 'angela', 'lisa', 'tori', 'dani', 'brandi', 'cherie',
  'alexis', 'bree', 'belle', 'eva', 'lena', 'kagney', 'gianna', 'emily', 'violet', 'valentina', 'elsa', 'adriana', 'nicole', 'madison',
  'romi', 'kali', 'vina', 'skye', 'ivy', 'jynx', 'joanna', 'bonnie', 'luna', 'stormy', 'tera', 'sunny', 'kendra', 'nikki', 'ava',
  'phoenix', 'lexi', 'kimmy', 'aidra', 'remy', 'anissa', 'sophie', 'kayden', 'lela', 'august', 'dillion', 'blake', 'savannah', 'autumn'];
for (const s of stars) {
  const n = s.name.toLowerCase();
  if (FAMOUS_FULL.some((f) => n.includes(f))) fail(`famous name: ${s.name}`);
}
for (const f of firstNames) if (FAMOUS_FIRST.includes(f.toLowerCase())) fail(`famous stage first name: ${f}`);

// --- 400-day simulation ---
const DAYS = 400;
const days: Record<string, DayRecord> = {};
const start = '2026-10-04';
const lastSeen: Record<string, { date: string; style: string }> = {};
let edg = 0, vag = 0, maxCh = 0, checked = 0, rotations = 0;
const styleCount: Record<string, number> = {};
const recent: string[] = [];
for (let n = 0; n < DAYS; n++) {
  const d = addDays(start, n);
  const id = pickStarId(d, stars, days);
  if (recent.slice(-7).includes(id)) fail(`star repeat within 7 days on ${d}`);
  if (pickStarId(d, stars, days) !== id) fail('star not deterministic');
  const star = stars.find((s) => s.id === id)!;
  const plan = generateDay(d, star, 'C', days);
  if (JSON.stringify(generateDay(d, star, 'C', days)) !== JSON.stringify(plan)) fail('day not deterministic');
  if (!star.knownFor.includes(plan.styleId)) fail('style not in knownFor');
  const prev = lastSeen[id];
  if (prev) { rotations++; if (prev.style === plan.styleId) fail(`${star.name} same style twice (${prev.date} / ${d})`); }
  lastSeen[id] = { date: d, style: plan.styleId };
  styleCount[plan.styleId] = (styleCount[plan.styleId] ?? 0) + 1;
  const rec: DayRecord = { plan, games: [], status: {}, sexDone: false };
  for (const sc of [null, 5, 35, 95]) for (const st of ['none', 'done', 'failed', 'mixed'] as const) {
    const r: DayRecord = structuredClone(rec);
    if (sc !== null) r.games = [{ id: 'x', game: 'CS2', kills: 0, deaths: 0, assists: 0, win: false, score: sc, at: 0 }];
    const ch = effectivePlan(r, new Date(`${d}T10:00`)).plan.challenges;
    ch.forEach((c, k) => { if (st === 'done' || (st === 'mixed' && k === 0)) r.status[c.id] = 'done'; if (st === 'failed' || (st === 'mixed' && k > 0)) r.status[c.id] = 'failed'; });
    for (const when of ['T10:00', 'T22:00']) {
      const { plan: p, fx } = effectivePlan(r, new Date(`${d}${when}`));
      const js = JSON.stringify({ p, fx });
      if (EDG.test(js)) edg++;
      if (BAD_VAG.test(js)) vag++;
      maxCh = Math.max(maxCh, p.challenges.length);
      if (p.challenges.length > 3) fail('more than 3 challenges');
      const sentences = (p.sex.scene.match(/[.!?](\s|$)/g) ?? []).length;
      if (sentences < 3 || sentences > 6) fail(`scene has ${sentences} sentences on ${d}`);
      if (p.sex.form === 'chastity' && p.challenges.some((c) => /finish|release/i.test(c.text))) fail(`release task on chastity day ${d}`);
      checked++;
    }
  }
  days[d] = rec;
  recent.push(id);
}
// force a rotation test: same star on many saved days in a row must alternate styles
const rot: Record<string, DayRecord> = {};
const s0 = stars.find((s) => s.knownFor.length === 2)!;
let lastS = '';
for (let n = 0; n < 30; n++) {
  const d = addDays(start, n * 10);
  const p = generateDay(d, s0, 'C', rot);
  if (p.styleId === lastS) fail('forced rotation failed');
  lastS = p.styleId; rot[d] = { plan: p, games: [], status: {}, sexDone: false };
}

console.log(`roster: ${stars.length} stars, ${STYLE_DEFS.length} styles, ${FORMS.length} sex forms, names unique, famous-name check passed`);
console.log(`${DAYS} days, ${checked} effective-plan variants: 'edg' ${edg} | vaginal ${vag} | max challenges ${maxCh}`);
console.log(`style rotation: ${rotations} repeat appearances, all with a new style; forced 30x rotation ok; styles used ${Object.keys(styleCount).length}/${STYLE_DEFS.length}`);
const t = days[start].plan;
console.log(JSON.stringify({ star: t.starName, style: t.styleLabel, summary: t.outfit.summary, extras: t.outfit.extras, sex: { form: t.sex.formLabel, min: t.sex.minutes, intensity: t.sex.intensity, loc: t.sex.location, scene: t.sex.scene }, challenges: t.challenges.map((c) => `${c.text} -> ${c.link}`) }, null, 2));
