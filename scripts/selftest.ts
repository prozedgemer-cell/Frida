import { DEFAULT_STARS } from '../src/data/stars';
import { addDays, effectivePlan, generateDay, pickStarId, scoreGame } from '../src/engine';
import type { DayRecord } from '../src/types';

const stars = DEFAULT_STARS.map((s) => ({ ...s }));
const days: Record<string, DayRecord> = {};
let prev = '';
const start = '2026-10-04';
const counts: Record<string, number> = {};
for (let n = 0; n < 120; n++) {
  const d = addDays(start, n);
  const id = pickStarId(d, stars, days);
  if (id === prev) throw new Error(`repeat on ${d}`);
  if (pickStarId(d, stars, days) !== id) throw new Error('not deterministic');
  const plan = generateDay(d, stars.find((s) => s.id === id)!, 'C');
  if (plan.challenges.length !== 3) throw new Error('challenge count');
  if (/vagin|pussy|clit/i.test(JSON.stringify(plan))) throw new Error('forbidden content');
  const rec: DayRecord = { plan, games: [], done: {}, sexDone: false };
  for (const sc of [5, 50, 95]) {
    rec.games = [{ id: 'x', game: 'CS2', kills: 0, deaths: 0, assists: 0, win: false, score: sc, at: 0 }];
    if (effectivePlan(rec).plan.challenges.length !== 3) throw new Error('eff challenge count');
  }
  days[d] = { plan, games: [], done: {}, sexDone: false };
  counts[id] = (counts[id] ?? 0) + 1;
  prev = id;
}
const recent7 = Object.values(days).slice(-8).map((r) => r.plan.starId);
if (new Set(recent7).size !== recent7.length) throw new Error('recent repeat');
console.log('stars:', stars.length, 'distinct used in 120 days:', Object.keys(counts).length);
console.log('score good', scoreGame({ game: 'CS2', kills: 25, deaths: 12, assists: 5, win: true }));
console.log('score bad', scoreGame({ game: 'WARDOGS', kills: 3, deaths: 14, assists: 1, win: false, cash: -1200 }));
const p = generateDay(start, stars.find((s) => s.id === pickStarId(start, stars, {}))!, 'C');
console.log(JSON.stringify(p, null, 2));
