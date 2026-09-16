/**
 * Engine self-test (no browser). Run: npx tsx scripts/selftest.ts
 */
import { SEX_STRAF_TEMPLATES } from '../src/data/sexStraf';
import { CHALLENGE_TEMPLATES } from '../src/data/challenges';
import {
  describeCalendarInfluence,
  localDateKey,
  normalizeTimeHm,
  summarizeCalendar,
} from '../src/engines/calendarEngine';
import {
  evaluateSexStrafDue,
  evaluateSexStrafDueWithSessions,
  filterSexStrafTemplates,
  sexStrafPointsDelta,
} from '../src/engines/sexStrafEngine';
import { filterTemplates } from '../src/engines/challengeEngine';
import { blendContextGaming } from '../src/engines/weightBlend';
import { defaultProfile } from '../src/storage/localStore';
import type { CalendarEntry, PerformanceSnapshot, SexStrafInstance } from '../src/types';
import { ALL_THEMES } from '../src/types';

let failed = 0;
function assert(cond: unknown, msg: string): void {
  if (!cond) {
    failed += 1;
    console.error('FAIL', msg);
  } else {
    console.log('ok  ', msg);
  }
}

const VAG = /\b(vagina|vaginal|kusse|skede|clitoris|klitoris|pussy)\b/i;

assert(normalizeTimeHm('9:05') === '09:05', 'normalizeTimeHm pads hour');
assert(normalizeTimeHm('25:00') === undefined, 'normalizeTimeHm rejects 25:00');
assert(normalizeTimeHm('') === undefined, 'normalizeTimeHm empty');

const today = localDateKey();
const entries: CalendarEntry[] = [
  {
    id: 'c1',
    dateKey: today,
    timeHm: '19:30',
    titleDa: 'Date i byen',
    noteDa: 'milf look, brazilian, date',
    signal: 'date',
    createdAt: '2026-09-16T10:00:00.000Z',
    updatedAt: '2026-09-16T10:00:00.000Z',
  },
  {
    id: 'c2',
    dateKey: today,
    titleDa: 'Straf-session',
    noteDa: 'latex, dominatrix',
    signal: 'straf',
    createdAt: '2026-09-16T10:00:00.000Z',
    updatedAt: '2026-09-16T11:00:00.000Z',
  },
];
const cal = summarizeCalendar(entries, today);
assert(cal.hasDate && cal.hasStraf, 'summarize flags date+straf');
assert(cal.eveningBias, '19:30 note → eveningBias');
assert(cal.timedLabels.some((x) => x.startsWith('19:30')), 'timedLabels includes 19:30');
assert(cal.roleHints.includes('brazilian-cut') || cal.roleHints.includes('bdsm-hard'), 'role hints from plan');
const inf = describeCalendarInfluence(cal);
assert(/date|straf|kalender/i.test(inf.summaryDa), 'influence summary mentions calendar');
assert(/sex-straf/i.test(inf.strafDa), 'influence mentions sex-straf');

const restCal = summarizeCalendar(
  [
    {
      id: 'r1',
      dateKey: today,
      titleDa: 'Hvile',
      noteDa: 'off',
      signal: 'rest',
      createdAt: '2026-09-16T10:00:00.000Z',
      updatedAt: '2026-09-16T10:00:00.000Z',
    },
  ],
  today,
);
assert(restCal.hasRest, 'rest flag');

const poor: PerformanceSnapshot = {
  score: 20,
  streak: -3,
  band: 'poor',
  summaryDa: 'dårlig',
  lastSession: null,
  sessionCount: 4,
};
const due = evaluateSexStrafDueWithSessions({
  paused: false,
  active: null,
  log: [],
  lastSexStrafAt: null,
  performance: poor,
  pointsBalance: -12,
  challengeLog: [{ id: 'x', templateId: 't', titleDa: 'x', outcome: 'fail', at: 'now' }],
  calendar: cal,
  sessions: [{ result: 'loss' }, { result: 'loss' }, { result: 'win' }],
});
assert(due.due, 'poor+debt+straf calendar → sex-straf due');
assert(due.reasonsDa.length >= 2, 'multiple due reasons');

const blocked = evaluateSexStrafDue({
  paused: true,
  active: null,
  log: [],
  lastSexStrafAt: null,
  performance: poor,
  pointsBalance: -12,
  challengeLog: [],
  calendar: restCal,
});
assert(!blocked.due && blocked.blockedDa.length > 0, 'nødstop/hvile blocks due');

const inst = {
  id: 'ss',
  templateId: 't',
  titleDa: 'x',
  sceneDa: 'x',
  partnerDa: 'p',
  placeDa: 'pl',
  whyDa: 'w',
  durationMin: 10,
  hardness: 'medium',
  status: 'pending',
  createdAt: 'now',
  redeemBoost: 18,
} satisfies SexStrafInstance;
assert(sexStrafPointsDelta('complete', inst) === 18, 'complete +18');
assert(sexStrafPointsDelta('fail', inst) === -10, 'fail -10');
assert(sexStrafPointsDelta('skip', inst) === -4, 'skip -4');

const vaginalHits = SEX_STRAF_TEMPLATES.filter((t) => {
  const blob = `${t.titleDa} ${t.sceneDa}`;
  if (!VAG.test(blob)) return false;
  return !/ikke|ingen/i.test(blob);
});
assert(vaginalHits.length === 0, `no vaginal-use sex-straf templates (${vaginalHits.map((t) => t.id).join(',')})`);

const profile = { ...defaultProfile(), ageVerified: true, enabledThemes: [...ALL_THEMES] };
const ssPool = filterSexStrafTemplates(profile);
assert(ssPool.length > 0, 'sex-straf pool not empty');
const chPool = filterTemplates(profile, { irlStatus: 'home', playingGame: 'CS2', notes: '' });
assert(chPool.length > 0, 'challenge pool not empty');
const vaginalCh = CHALLENGE_TEMPLATES.filter(
  (t) => VAG.test(`${t.titleDa} ${t.bodyDa}`) && !t.allowsSemenCollection && !/ikke vagina|ingen vaginal/i.test(`${t.titleDa} ${t.bodyDa}`),
);
assert(vaginalCh.length === 0, 'no vaginal-use challenge templates without exception');

assert(Math.abs(blendContextGaming(2, 1) - (0.7 * 2 + 0.3 * 1)) < 1e-9, '70/30 blend');

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall engine self-tests passed');
