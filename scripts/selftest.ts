import { readFileSync, readdirSync } from 'node:fs';
import { FORMS } from '../src/data/content';
import { DEFAULT_STARS } from '../src/data/stars';
import { addDays, effectivePlan, generateDay, pickStarId, scoreGame } from '../src/engine';
import type { DayRecord } from '../src/types';

const BAD_VAG = /vagin|pussy|clit|labia|cunni/i;
const EDG = /edg/i;
// source scan
for (const dir of ['src', 'src/data']) for (const f of readdirSync(dir).filter((x) => /\.tsx?$/.test(x))) {
  const t = readFileSync(`${dir}/${f}`, 'utf8');
  if (EDG.test(t)) throw new Error(`'edg' in ${dir}/${f}`);
  if (BAD_VAG.test(t.replace(/BAD_VAG.*/g, ''))) throw new Error(`vaginal term in ${dir}/${f}`);
}
const stars = DEFAULT_STARS.map((s) => ({ ...s }));
const days: Record<string, DayRecord> = {};
let prev = '';
const start = '2026-10-04';
const counts: Record<string, number> = {};
const formCounts: Record<string, number> = {};
let edg = 0, vag = 0, maxCh = 0, checked = 0;
const releaseOnChastity = /finish|release/i;
for (let n = 0; n < 120; n++) {
  const d = addDays(start, n);
  const id = pickStarId(d, stars, days);
  if (id === prev) throw new Error(`repeat on ${d}`);
  if (pickStarId(d, stars, days) !== id) throw new Error('not deterministic');
  const plan = generateDay(d, stars.find((s) => s.id === id)!, 'C');
  const rec: DayRecord = { plan, games: [], status: {}, sexDone: false };
  const variants: DayRecord[] = [];
  for (const sc of [null, 5, 35, 60, 95]) for (const st of ['none', 'done', 'failed', 'mixed'] as const) {
    const r: DayRecord = structuredClone(rec);
    if (sc !== null) r.games = [{ id: 'x', game: 'CS2', kills: 0, deaths: 0, assists: 0, win: false, score: sc, at: 0 }];
    const ch = effectivePlan(r, new Date(`${d}T10:00`)).plan.challenges;
    ch.forEach((c, k) => { if (st === 'done' || (st === 'mixed' && k === 0)) r.status[c.id] = 'done'; if (st === 'failed' || (st === 'mixed' && k > 0)) r.status[c.id] = 'failed'; });
    variants.push(r);
  }
  for (const r of variants) for (const when of ['T10:00', 'T22:00']) {
    const { plan: p, fx } = effectivePlan(r, new Date(`${d}${when}`));
    const js = JSON.stringify({ p, fx });
    if (EDG.test(js)) edg++;
    if (BAD_VAG.test(js)) vag++;
    maxCh = Math.max(maxCh, p.challenges.length);
    if (p.challenges.length > 3) throw new Error('more than 3 challenges');
    if (p.sex.form === 'chastity' && p.challenges.some((c) => releaseOnChastity.test(c.text))) throw new Error(`release task on chastity day ${d}`);
    checked++;
  }
  days[d] = rec;
  counts[id] = (counts[id] ?? 0) + 1;
  formCounts[plan.sex.form] = (formCounts[plan.sex.form] ?? 0) + 1;
  prev = id;
}
console.log(`120 days, ${checked} effective-plan variants checked`);
console.log(`'edg' hits: ${edg} | vaginal hits: ${vag} | max challenges: ${maxCh}`);
console.log('stars:', stars.length, 'distinct used:', Object.keys(counts).length, '| forms:', FORMS.length, JSON.stringify(formCounts));
console.log('score good', scoreGame({ game: 'CS2', kills: 25, deaths: 12, assists: 5, win: true }), 'bad', scoreGame({ game: 'WARDOGS', kills: 3, deaths: 14, assists: 1, win: false, cash: -1200 }));
const today = days[start];
console.log(JSON.stringify({ star: today.plan.starName, sex: today.plan.sex, challenges: today.plan.challenges, summary: today.plan.outfit.summary, extras: today.plan.outfit.extras }, null, 2));
const demo: DayRecord = structuredClone(today);
demo.status[today.plan.challenges[0].id] = 'done'; demo.status[today.plan.challenges[1].id] = 'done';
console.log('demo 2 done:', effectivePlan(demo, new Date(`${start}T12:00`)).fx.line, effectivePlan(demo, new Date(`${start}T12:00`)).plan.sex.minutes);
console.log('demo evening (1 missed):', effectivePlan(demo, new Date(`${start}T22:00`)).fx.line, effectivePlan(demo, new Date(`${start}T22:00`)).plan.sex.minutes);
