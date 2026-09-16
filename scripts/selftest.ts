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
import { drawMorningTrio, filterTemplates } from '../src/engines/challengeEngine';
import { blendContextGaming } from '../src/engines/weightBlend';
import { inferMegaSituation, MEGA_LOOK_COUNT, pickMegaLook } from '../src/engines/megaOutfitEngine';
import { ROLE_PACKS } from '../src/data/rolePacks';
import { buildOutfitOrderText } from '../src/engines/outfitEngine';
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

const tagged: CalendarEntry[] = [
  {
    id: 'c3',
    dateKey: today,
    titleDa: 'Bytur',
    noteDa: '',
    signal: 'none',
    tags: ['milf', 'g-string', 'outing'],
    createdAt: '2026-09-16T10:00:00.000Z',
    updatedAt: '2026-09-16T10:00:00.000Z',
  },
];
const taggedCal = summarizeCalendar(tagged, today);
assert(taggedCal.freeTags.includes('milf') && taggedCal.freeTags.includes('g-string'), 'freeTags from calendar tags');
assert(taggedCal.roleHints.includes('g-string-milf') || taggedCal.roleHints.includes('brazilian-cut'), 'milf/g-string tags → milf role');
assert(taggedCal.roleHints.includes('bytur-gaatur'), 'outing tag → bytur role');

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

const core8 = [
  'g-string-milf',
  'brazilian-cut',
  'bdsm-hard',
  'soft-everyday-femme',
  'hentai-anime',
  'fantasy-femme',
  'office-milf',
  'bdsm-soft',
] as const;
const revealRe = /synlig|afslørende|åbn|kortere|strammere|sheer af|blazer af|crop|mere hud|ekspon|straf|kun lingeri|fallen|tease/i;
const coverRe = /lukket|cover|hoodie op|bliv i comfort|dækket|skjult|mesh på|power suit|længere|sofistikeret|hemmelig|blødere/i;
for (const id of core8) {
  const pack = ROLE_PACKS.find((r) => r.id === id);
  assert(!!pack, `core pack ${id} exists`);
  if (!pack) continue;
  assert(revealRe.test(pack.gaming_daarlig), `${id} gaming_daarlig is revealing/punish`);
  assert(coverRe.test(pack.gaming_god), `${id} gaming_god is cover/reward`);
}
const testLayers = [
  { layer: 'underwear' as const, pieceId: 'uw-01', nameDa: 'Test UW', descriptionDa: 't', colors: ['sort'] },
  { layer: 'top' as const, pieceId: 'top-01', nameDa: 'Test top', descriptionDa: 't', colors: ['sort'] },
];
const poorOrder = buildOutfitOrderText(testLayers, profile, poor, ROLE_PACKS[0]);
assert(/afslørende|straffet|Gaming-dårlig/i.test(poorOrder), 'poor order uses punish/reveal voice');
assert(!/dæk mere til|belønning\/reveal/i.test(poorOrder), 'poor order not inverted cover/reveal');
const goodPerf: PerformanceSnapshot = { ...poor, band: 'good', score: 80, summaryDa: 'god' };
const goodOrder = buildOutfitOrderText(testLayers, profile, goodPerf, ROLE_PACKS[0]);
assert(/dækket|belønning|Gaming-god|blødere/i.test(goodOrder), 'good order uses cover/reward voice');


const SAY_WRITE_RE = /\b(skriv|læs højt|sig højt|sig:|sig "|tal |hvisk|råb|fortæl|besked|voice chat|mantraer|dagbog|pagt)\b/i;
const softProfile = { ...profile, dayMode: 'soft' as const, intensity: 'soft' as const };
const ctx = { irlStatus: 'home' as const, playingGame: '', notes: '' };
const trio = drawMorningTrio(softProfile, ctx, null, null, null);
assert(trio.length === 3, `morning trio always 3 (got ${trio.length})`);
assert(trio[0]?.morningTier === 'easy', 'slot 1 easy');
assert(trio[1]?.morningTier === 'hard', 'slot 2 hard');
assert(trio[2]?.morningTier === 'boundary', 'slot 3 boundary');
for (const c of trio) {
  const cls = c.actionClass ?? 'do';
  assert(cls === 'do' || cls === 'wear', `morning ${c.templateId} is do/wear not ${cls}`);
  assert(!SAY_WRITE_RE.test(`${c.titleDa} ${c.bodyDa}`), `morning ${c.templateId} has no say/write`);
}
assert(MEGA_LOOK_COUNT >= 20, `mega core catalog loaded (${MEGA_LOOK_COUNT})`);
const okPerf: PerformanceSnapshot = {
  score: 60,
  streak: 0,
  band: 'ok',
  summaryDa: 'ok',
  lastSession: null,
  sessionCount: 2,
};
const noon = new Date();
noon.setHours(12, 0, 0, 0);
const dateOnlyCal = summarizeCalendar(
  [
    {
      id: 'date-only',
      dateKey: today,
      timeHm: '19:30',
      titleDa: 'Date',
      noteDa: 'café',
      signal: 'date',
      createdAt: '2026-09-16T10:00:00.000Z',
      updatedAt: '2026-09-16T10:00:00.000Z',
    },
  ],
  today,
);
const dateOnlyDue = evaluateSexStrafDue({
  paused: false,
  active: null,
  log: [],
  lastSexStrafAt: null,
  performance: okPerf,
  pointsBalance: 8,
  challengeLog: [],
  calendar: dateOnlyCal,
  now: noon,
});
assert(!dateOnlyDue.due, 'timed date-only event does not make sex-straf due');

const hm = `${String(noon.getHours()).padStart(2, '0')}:${String(noon.getMinutes()).padStart(2, '0')}`;
const strafNowCal = summarizeCalendar(
  [
    {
      id: 'straf-now',
      dateKey: today,
      timeHm: hm,
      titleDa: 'Straf-session',
      noteDa: 'domme',
      signal: 'straf',
      createdAt: '2026-09-16T10:00:00.000Z',
      updatedAt: '2026-09-16T10:00:00.000Z',
    },
  ],
  today,
);
const strafNowDue = evaluateSexStrafDue({
  paused: false,
  active: null,
  log: [],
  lastSexStrafAt: null,
  performance: okPerf,
  pointsBalance: 8,
  challengeLog: [],
  calendar: strafNowCal,
  now: noon,
});
assert(strafNowDue.due, 'timed straf in window makes sex-straf due');

const strafLaterCal = summarizeCalendar(
  [
    {
      id: 'straf-later',
      dateKey: today,
      timeHm: '03:00',
      titleDa: 'Nat-straf',
      noteDa: 'domme',
      signal: 'straf',
      createdAt: '2026-09-16T10:00:00.000Z',
      updatedAt: '2026-09-16T10:00:00.000Z',
    },
  ],
  today,
);
const strafLaterDue = evaluateSexStrafDue({
  paused: false,
  active: null,
  log: [],
  lastSexStrafAt: null,
  performance: okPerf,
  pointsBalance: 8,
  challengeLog: [],
  calendar: strafLaterCal,
  now: noon,
});
assert(!strafLaterDue.due, 'timed straf outside window is not due by itself');

const sit = inferMegaSituation({ context: ctx, now: noon });
assert(sit === 'hjemme' || sit === 'weekend', `home noon maps to hjemme/weekend (got ${sit})`);
assert(!!pickMegaLook({ profile, context: ctx, performance: poor, now: noon }), 'pickMegaLook returns a look');


if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall engine self-tests passed');
