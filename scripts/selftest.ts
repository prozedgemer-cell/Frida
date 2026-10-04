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
for (const s of stars) if (!/^[A-Z][a-z]+ (Mc)?[A-Z][a-z]+$/.test(s.name)) fail(`not a plain First Last name: ${s.name}`);
for (const s of stars) {
  if (s.knownFor.length < 2 || s.knownFor.length > 4) fail(`${s.name} knownFor ${s.knownFor.length}`);
  if (s.knownFor.some((k) => !STYLE_BY_ID[k])) fail(`${s.name} unknown style`);
  if (!/^(B|C|D|DD|E|F|G|H)$/.test(s.cup)) fail(`${s.name} cup ${s.cup}`);
}
// real adult performers / celebrities that must never be used (scripts/name-blocklist.json)
const BLOCK: string[] = JSON.parse(readFileSync('scripts/name-blocklist.json', 'utf8'));
for (const s of stars) if (BLOCK.includes(s.name.toLowerCase())) fail(`blocklisted name: ${s.name}`);
// old fantasy-style names must be gone
for (const old of ['Quilla', 'Seraphine', 'Ermengarde', 'Margaux', 'Silverford', 'Vellichor']) if (stars.some((s) => s.name.includes(old))) fail(`old name left: ${old}`);
// styles that share a look must still have their own distinct tops
for (const a of STYLE_DEFS) for (const b of STYLE_DEFS) if (a.id < b.id && a.look === b.look) {
  const ta = new Set(a.own?.top ?? []), tb = b.own?.top ?? [];
  if (!a.own?.top || !b.own?.top) fail(`${a.id}/${b.id} share look '${a.look}' without own tops`);
  if (tb.some((t) => ta.has(t))) fail(`${a.id}/${b.id} share a top`);
}

// --- 400-day simulation ---
const DAYS = 400;
const days: Record<string, DayRecord> = {};
const start = '2026-10-04';
const lastSeen: Record<string, { date: string; style: string }> = {};
let edg = 0, vag = 0, maxCh = 0, checked = 0, rotations = 0;
const styleCount: Record<string, number> = {};
let punkDays = 0;
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
  if (plan.styleId === 'punk') {
    punkDays++;
    const o = plan.outfit;
    if (!STYLE_BY_ID.punk.own!.top!.includes(o.top) || !STYLE_BY_ID.punk.own!.bottom!.includes(o.bottom)) fail(`punk outfit not punk: ${o.top} / ${o.bottom}`);
    if (/velvet|lace corset|maxi/i.test(JSON.stringify(o))) fail(`goth piece on punk day: ${o.summary}`);
  }
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

// keep-today check: rename today's star, saved checkmarks and games survive
import('../src/engine').then(({ ensureDay }) => {
  const base = { version: 2 as const, defaultCup: 'C', stars: stars.map((x) => ({ ...x })), days: {} as Record<string, DayRecord> };
  const d1 = ensureDay(base, start);
  const rec = d1.days[start];
  rec.status[rec.plan.challenges[0].id] = 'done';
  rec.games.push({ id: 'g', game: 'CS2', kills: 10, deaths: 5, assists: 2, win: true, score: 70, at: 0 });
  const renamed = { ...d1, stars: d1.stars.map((x) => (x.id === rec.plan.starId ? { ...x, name: 'Test Renamed' } : x)) };
  const d2 = ensureDay(renamed, start);
  if (d2.days[start].plan.starName !== 'Test Renamed' || d2.days[start].games.length !== 1 || !Object.keys(d2.days[start].status).length) fail('rename lost today data');
  console.log('keep-today on rename: ok');
});
console.log(`punk days: ${punkDays}, all with punk pieces`);
console.log(`roster: ${stars.length} stars, ${STYLE_DEFS.length} styles, ${FORMS.length} sex forms, names unique, famous-name check passed`);
console.log(`${DAYS} days, ${checked} effective-plan variants: 'edg' ${edg} | vaginal ${vag} | max challenges ${maxCh}`);
console.log(`style rotation: ${rotations} repeat appearances, all with a new style; forced 30x rotation ok; styles used ${Object.keys(styleCount).length}/${STYLE_DEFS.length}`);
const t = days[start].plan;
console.log(JSON.stringify({ star: t.starName, style: t.styleLabel, summary: t.outfit.summary, extras: t.outfit.extras, sex: { form: t.sex.formLabel, min: t.sex.minutes, intensity: t.sex.intensity, loc: t.sex.location, scene: t.sex.scene }, challenges: t.challenges.map((c) => `${c.text} -> ${c.link}`) }, null, 2));
