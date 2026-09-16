import { OUTFIT_LOOKS_MEGA_CORE } from '../data/outfitLooksMegaCore';
// Full catalog lives in outfitLooksMega.ts (750 looks) — core subset is bundled for PWA size.
import type { MegaOutfit, MegaSituation } from '../data/megaTypes';
import type { ContextState, PerformanceSnapshot, Profile, RoleId } from '../types';
import type { CalendarSummary } from './calendarEngine';

const ROLE_SIT: Partial<Record<RoleId, MegaSituation>> = {
  'fest-aften': 'fest',
  'traening-gym': 'traening',
  'sex-scene': 'sex',
  'bdsm-hard': 'bdsm',
  'bdsm-soft': 'bdsm',
  'bytur-gaatur': 'bytur',
  'familie-sikker': 'familie',
  'bil-trafik': 'bil',
  'handel-shopping': 'handel',
  'hjemme-lounge': 'hjemme',
  'gaming-praktisk': 'gaming',
  'office-milf': 'kontor',
  'brazilian-cut': 'date',
  'g-string-milf': 'date',
  'soft-everyday-femme': 'hjemme',
  'hentai-anime': 'sex',
  'hentai-inspireret': 'sex',
  'fantasy-femme': 'weekend',
  'fantasy-look': 'weekend',
  'anime-soft': 'hjemme',
};

export function inferMegaSituation(opts: {
  context: ContextState;
  calendar?: CalendarSummary | null;
  now?: Date;
}): MegaSituation {
  const now = opts.now ?? new Date();
  const cal = opts.calendar;
  const hints = cal?.roleHints ?? [];
  for (const id of hints) {
    const sit = ROLE_SIT[id];
    if (sit) return sit;
  }
  if (cal?.hasDate) return 'date';
  if (cal?.hasStraf || cal?.hasHard) return 'bdsm';
  if (cal?.hasGaming || opts.context.playingGame.trim()) return 'gaming';
  if (cal?.hasRest || cal?.hasSoft) return 'hjemme';
  if (cal?.hasClothing) return 'date';
  switch (opts.context.irlStatus) {
    case 'work':
      return 'kontor';
    case 'public':
      return 'bytur';
    case 'out':
      return 'gaatur';
    case 'alone':
    case 'home':
    default:
      break;
  }
  const h = now.getHours();
  if (h < 11) return 'morgen';
  const day = now.getDay();
  if (day === 0 || day === 6) return 'weekend';
  return 'hjemme';
}

export function pickMegaLook(opts: {
  profile: Profile;
  context: ContextState;
  performance?: PerformanceSnapshot | null;
  calendar?: CalendarSummary | null;
  now?: Date;
  roleId?: RoleId;
}): MegaOutfit | null {
  const sit = inferMegaSituation(opts);
  const perf = opts.performance;
  let preferHard = opts.profile.dayMode === 'hard' || opts.profile.intensity === 'hard';
  if (perf && perf.sessionCount > 0) {
    if (perf.band === 'poor') preferHard = true;
    if (perf.band === 'good' || perf.band === 'godlike') preferHard = false;
  }
  const enabled = new Set(opts.profile.enabledThemes);
  let pool = OUTFIT_LOOKS_MEGA_CORE.filter((o) => o.situation === sit);
  if (!pool.length) pool = [...OUTFIT_LOOKS_MEGA_CORE];
  const scored = pool.map((item) => {
    let s = item.weight || 1;
    if (preferHard && item.intensity === 'hard') s *= 1.6;
    if (!preferHard && item.intensity === 'soft') s *= 1.45;
    if (opts.roleId && item.roleHint === opts.roleId) s *= 1.7;
    const themeHits = item.themes.filter((t) => enabled.has(t)).length;
    s *= themeHits ? 1 + themeHits * 0.2 : 0.45;
    if (item.irlBias?.includes(opts.context.irlStatus)) s *= 1.35;
    return { item, score: s };
  });
  const total = scored.reduce((a, b) => a + b.score, 0);
  if (total <= 0) return pool[0] ?? null;
  let r = Math.random() * total;
  for (const row of scored) {
    r -= row.score;
    if (r <= 0) return row.item;
  }
  return scored[0]?.item ?? null;
}

export function megaAddonText(look: MegaOutfit, perf?: PerformanceSnapshot | null): string {
  const game =
    perf && perf.sessionCount > 0
      ? perf.band === 'poor'
        ? look.gamingDaarlig
        : look.gamingGod
      : '';
  return ` Mega-look «${look.nameDa}»: ${look.orderBlurbDa}${game ? ` ${game}` : ''}`;
}

export const MEGA_LOOK_COUNT = OUTFIT_LOOKS_MEGA_CORE.length;
