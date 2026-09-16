import { OUTFIT_LOOKS } from '../data/looks';
import { OUTFIT_CATALOG } from '../data/outfits';
import {
  ROLE_FALLBACK_LAYERS,
  ROLE_PACKS,
  getRolePack,
  resolveRoleId,
  type RolePack,
} from '../data/rolePacks';
import { UNDERWEAR_CATALOG } from '../data/underwear';
import { calendarUnderwearMultiplier, type CalendarSummary } from './calendarEngine';
import type {
  ContextState,
  Intensity,
  OutfitLayer,
  OutfitLayerPick,
  OutfitPiece,
  PerformanceSnapshot,
  Profile,
  RoleId,
  ThemePack,
  UnderwearItem,
  UnderwearPick,
  OutfitLook,
} from '../types';
import { OUTFIT_LAYER_LABELS_DA } from '../types';
import { influenceTextDa } from './performanceEngine';
import { blendContextGaming, WEIGHT_FORMULA_DA } from './weightBlend';

function hourBucket(d = new Date()): 'morning' | 'day' | 'evening' | 'night' {
  const h = d.getHours();
  if (h < 6) return 'night';
  if (h < 11) return 'morning';
  if (h < 17) return 'day';
  if (h < 22) return 'evening';
  return 'night';
}

function isWeekend(d = new Date()): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function themeScore(themes: ThemePack[], enabled: ThemePack[]): number {
  const hit = themes.filter((t) => enabled.includes(t)).length;
  return hit === 0 ? 0.25 : 1 + hit * 0.3;
}

function intensityFit(itemInt: Intensity[], intensity: Intensity, dayMode: Profile['dayMode']): number {
  const mode: Intensity = dayMode === 'hard' ? 'hard' : intensity;
  if (mode === 'soft') return itemInt.includes('soft') ? 1.2 : 0.4;
  return itemInt.includes('hard') ? 1.3 : 0.8;
}

function irlFit(tags: string[], irl: ContextState['irlStatus'], layer: OutfitLayer): number {
  const discrete = tags.includes('diskret') || tags.includes('work');
  const flashy = tags.includes('hard') || tags.includes('sexy') || tags.includes('fetish');
  const homeish = tags.includes('hjemme') || tags.includes('gaming') || tags.includes('komfort');
  switch (irl) {
    case 'work':
    case 'public':
      if (layer === 'outerwear') return 1.5;
      return discrete ? 2.1 : flashy ? 0.2 : 0.75;
    case 'out':
      return discrete ? 1.4 : flashy ? 0.55 : 1;
    case 'alone':
    case 'home':
      return homeish || flashy ? 1.35 : 1;
    default:
      return 1;
  }
}

function timeFit(tags: string[], now: Date, layer: OutfitLayer): number {
  const bucket = hourBucket(now);
  const weekend = isWeekend(now);
  let s = 1;
  if (bucket === 'morning' || bucket === 'day') {
    if (tags.includes('hverdag') || tags.includes('work') || tags.includes('diskret')) s *= 1.25;
    if (tags.includes('aften') && layer !== 'accessory') s *= 0.7;
  }
  if (bucket === 'evening' || bucket === 'night') {
    if (tags.includes('aften') || tags.includes('sexy') || tags.includes('date')) s *= 1.3;
  }
  if (weekend) {
    if (tags.includes('weekend') || tags.includes('cute') || tags.includes('date')) s *= 1.2;
  } else if (tags.includes('work')) s *= 1.15;
  return s;
}

function gamingFit(tags: string[], playingGame: string): number {
  if (!playingGame.trim()) return 1;
  if (tags.includes('gaming') || tags.includes('komfort') || tags.includes('hjemme')) return 1.55;
  if (tags.includes('hæle')) return 0.45;
  return 0.92;
}

function performanceFit(tags: string[], intensity: Intensity[], perf?: PerformanceSnapshot | null): number {
  if (!perf || perf.sessionCount === 0) return 1;
  const hardish =
    intensity.includes('hard') &&
    (tags.includes('hard') || tags.includes('fetish') || tags.includes('bdsm') || tags.includes('kontrol'));
  const revealing =
    tags.includes('synlig') ||
    tags.includes('sexy') ||
    tags.includes('tease') ||
    tags.includes('string') ||
    tags.includes('g-string');
  const covered =
    tags.includes('diskret') ||
    tags.includes('usynlig') ||
    tags.includes('komfort') ||
    tags.includes('work');
  const softish =
    tags.includes('komfort') ||
    tags.includes('soft') ||
    tags.includes('cute') ||
    tags.includes('luksus') ||
    tags.includes('belønning') ||
    (intensity.includes('soft') && !intensity.includes('hard'));
  switch (perf.band) {
    case 'poor':
      // Dårlig → mere afslørende / straffet silhuet
      if (revealing || hardish) return 2;
      if (covered || softish) return 0.5;
      return 0.9;
    case 'good':
      // God → blødere / mere dækket belønning
      if (covered || softish || tags.includes('gaming')) return 1.5;
      if (revealing || hardish) return 0.7;
      return 1.05;
    case 'godlike':
      if (covered || softish || tags.includes('luksus')) return 1.85;
      if (revealing || hardish) return 0.4;
      return 1.1;
    default:
      return 1;
  }
}

function calendarRoleBoost(tags: string[], cal?: CalendarSummary | null): number {
  if (!cal) return 1;
  let m = 1;
  for (const role of cal.roleHints ?? []) {
    if (role === 'brazilian-cut' && (tags.includes('milf') || tags.includes('brazilian') || tags.includes('date')))
      m *= 1.8;
    if (role === 'bdsm-hard' && (tags.includes('bdsm') || tags.includes('domme') || tags.includes('fetish') || tags.includes('leather')))
      m *= 1.9;
    if (role === 'bdsm-soft' && (tags.includes('bdsm') || tags.includes('collar') || tags.includes('choker') || tags.includes('soft')))
      m *= 1.7;
    if (role === 'g-string-milf' && (tags.includes('g-string') || tags.includes('tease') || tags.includes('synlig')))
      m *= 1.75;
    if (role === 'office-milf' && (tags.includes('work') || tags.includes('diskret') || tags.includes('milf'))) m *= 1.7;
    if (role === 'soft-everyday-femme' && (tags.includes('gaming') || tags.includes('komfort') || tags.includes('soft') || tags.includes('cute')))
      m *= 1.65;
    if ((role === 'hentai-anime' || role === 'hentai-inspireret') && (tags.includes('anime') || tags.includes('hentai') || tags.includes('cute')))
      m *= 1.7;
    if ((role === 'fantasy-femme' || role === 'fantasy-look') && (tags.includes('fantasy') || tags.includes('aften') || tags.includes('drama')))
      m *= 1.6;
    if (role === 'familie-sikker' && (tags.includes('diskret') || tags.includes('usynlig') || tags.includes('hverdag')))
      m *= 1.9;
    if (role === 'traening-gym' && (tags.includes('træning') || tags.includes('gym') || tags.includes('sport') || tags.includes('praktisk')))
      m *= 1.8;
    if (role === 'fest-aften' && (tags.includes('fest') || tags.includes('aften') || tags.includes('sexy') || tags.includes('luksus')))
      m *= 1.75;
    if (role === 'sex-scene' && (tags.includes('sex') || tags.includes('tease') || tags.includes('sexy'))) m *= 1.8;
    if (role === 'gaming-praktisk' && (tags.includes('gaming') || tags.includes('praktisk') || tags.includes('komfort') || tags.includes('session')))
      m *= 1.8;
    if (role === 'anime-soft' && (tags.includes('anime') || tags.includes('cute') || tags.includes('soft'))) m *= 1.65;
    if (role === 'hjemme-lounge' && (tags.includes('hjemme') || tags.includes('lounge') || tags.includes('komfort')))
      m *= 1.6;
    if ((role === 'bytur-gaatur' || role === 'handel-shopping') && (tags.includes('hverdag') || tags.includes('out') || tags.includes('femme')))
      m *= 1.55;
    if (role === 'bil-trafik' && (tags.includes('praktisk') || tags.includes('diskret') || tags.includes('bil')))
      m *= 1.6;
  }
  if (cal.noteBoost) m *= 1 + cal.noteBoost;
  return m;
}

/** Match pack.kalender against calendar signals + time-of-day / event tags. */
function calendarPackMatch(role: RolePack, cal?: CalendarSummary | null, now = new Date()): number {
  if (!role.kalender?.length) return 1;
  const h = now.getHours();
  const tod = h < 6 ? 'night' : h < 11 ? 'morning' : h < 17 ? 'day' : h < 22 ? 'evening' : 'night';
  const weekend = now.getDay() === 0 || now.getDay() === 6;
  const bag = new Set<string>([
    tod,
    weekend ? 'weekend' : 'hverdag',
    ...(cal?.signals ?? []),
    ...(cal?.roleHints ?? []),
  ]);
  if (cal?.hasDate) bag.add('date');
  if (cal?.hasClothing) bag.add('clothing');
  if (cal?.hasGaming) bag.add('gaming');
  if (cal?.hasHard || cal?.hasStraf) {
    bag.add('hard');
    bag.add('straf');
  }
  if (cal?.hasSoft || cal?.hasReward) {
    bag.add('soft');
    bag.add('reward');
  }
  if (cal?.hasRest) bag.add('rest');
  let hits = 0;
  for (const k of role.kalender) {
    if (bag.has(k) || [...bag].some((b) => b.includes(k) || k.includes(b))) hits += 1;
  }
  if (!hits) return cal && cal.entries.length ? 0.75 : 1;
  return 1 + hits * 0.35;
}

function gamingPackModifier(role: RolePack, perf?: PerformanceSnapshot | null): {
  mul: number;
  noteDa: string;
} {
  if (!perf || perf.sessionCount === 0) return { mul: 1, noteDa: '' };
  if (perf.band === 'poor') {
    return {
      mul: 1.05,
      noteDa: ` Gaming-dårlig → ${role.gaming_daarlig}`,
    };
  }
  if (perf.band === 'good' || perf.band === 'godlike') {
    return {
      mul: 1.08,
      noteDa: ` Gaming-god → ${role.gaming_god}`,
    };
  }
  return { mul: 1, noteDa: '' };
}

function scorePiece(
  piece: OutfitPiece,
  profile: Profile,
  context: ContextState,
  now: Date,
  perf?: PerformanceSnapshot | null,
  cal?: CalendarSummary | null,
): number {
  const hardish = piece.intensity.includes('hard') && (piece.tags.includes('hard') || piece.tags.includes('fetish'));
  const softish = piece.intensity.includes('soft') && !hardish;

  const contextMul =
    themeScore(piece.themes, profile.enabledThemes) *
    intensityFit(piece.intensity, profile.intensity, profile.dayMode) *
    irlFit(piece.tags, context.irlStatus, piece.layer) *
    timeFit(piece.tags, now, piece.layer) *
    calendarUnderwearMultiplier(piece.tags, hardish, softish, cal) *
    calendarRoleBoost(piece.tags, cal);

  const gamingMul =
    gamingFit(piece.tags, context.playingGame) *
    performanceFit(piece.tags, piece.intensity, perf);

  return Math.max(piece.weight * blendContextGaming(contextMul, gamingMul), 0.01);
}

function weightedPick<T>(rows: { item: T; score: number }[]): T {
  const total = rows.reduce((a, b) => a + b.score, 0);
  let r = Math.random() * total;
  for (const row of rows) {
    r -= row.score;
    if (r <= 0) return row.item;
  }
  return rows[rows.length - 1]!.item;
}

function pickLayer(
  layer: OutfitPiece['layer'],
  profile: Profile,
  context: ContextState,
  now: Date,
  perf?: PerformanceSnapshot | null,
  cal?: CalendarSummary | null,
  excludeId?: string,
  tagBoost?: string[],
): OutfitPiece | null {
  const pool = OUTFIT_CATALOG.filter((p) => p.layer === layer && p.id !== excludeId);
  if (!pool.length) return null;
  const scored = pool.map((item) => {
    let score = scorePiece(item, profile, context, now, perf, cal);
    if (tagBoost?.length) {
      const hit = item.tags.filter((t) => tagBoost.includes(t)).length;
      if (hit) score *= 1 + hit * 0.45;
    }
    return { item, score };
  });
  return weightedPick(scored);
}

function toLayerPick(piece: OutfitPiece): OutfitLayerPick {
  return {
    layer: piece.layer,
    pieceId: piece.id,
    nameDa: piece.nameDa,
    descriptionDa: piece.descriptionDa,
    colors: piece.colors,
  };
}

function underwearLayer(item: UnderwearItem): OutfitLayerPick {
  return {
    layer: 'underwear',
    pieceId: item.id,
    nameDa: item.nameDa,
    descriptionDa: item.descriptionDa,
    colors: item.colors,
  };
}

function chance(p: number): boolean {
  return Math.random() < p;
}

function resolvePieceId(id: string): OutfitLayerPick | null {
  const fromCat = OUTFIT_CATALOG.find((p) => p.id === id);
  if (fromCat) return toLayerPick(fromCat);
  const fb = ROLE_FALLBACK_LAYERS[id];
  return fb ? { ...fb } : null;
}

/** Score and pick a coherent ROLE pack (drives full outfit, not underwear-only). */
export function pickRolePack(
  profile: Profile,
  context: ContextState,
  opts?: {
    now?: Date;
    performance?: PerformanceSnapshot | null;
    calendar?: CalendarSummary | null;
    excludeRoleId?: RoleId;
  },
): RolePack {
  const now = opts?.now ?? new Date();
  const perf = opts?.performance ?? null;
  const cal = opts?.calendar ?? null;
  const pool = ROLE_PACKS.filter((r) => r.id !== opts?.excludeRoleId);

  const scored = pool.map((role) => {
    let contextMul =
      themeScore(role.themes, profile.enabledThemes) *
      intensityFit(role.intensity, profile.intensity, profile.dayMode) *
      irlFit(role.tags, context.irlStatus, 'top') *
      timeFit(role.tags, now, 'top') *
      calendarRoleBoost(role.tags, cal) *
      calendarPackMatch(role, cal, now);

    if (role.irlBias?.length) {
      if (role.irlBias.includes(context.irlStatus)) contextMul *= 1.85;
      else if (context.irlStatus === 'work' || context.irlStatus === 'public') {
        contextMul *=
          role.id === 'office-milf' || role.id === 'familie-sikker' || role.id === 'bil-trafik'
            ? 2.2
            : 0.12;
      } else contextMul *= 0.55;
    }

    // Calendar written plans strongly prefer hinted roles
    if (cal?.roleHints?.includes(role.id)) contextMul *= 2.4;

    const gamingMul =
      gamingFit(role.tags, context.playingGame) *
      performanceFit(role.tags, role.intensity, perf) *
      gamingPackModifier(role, perf).mul;

    // Coherence: hard Domme ≠ g-string milf ≠ soft everyday
    if (cal?.roleHints?.includes('bdsm-hard') && role.id === 'g-string-milf') contextMul *= 0.15;
    if (cal?.roleHints?.includes('brazilian-cut') && role.id === 'bdsm-hard') contextMul *= 0.35;
    if (cal?.roleHints?.includes('g-string-milf') && role.id === 'bdsm-hard') contextMul *= 0.25;
    if (cal?.roleHints?.includes('office-milf') && (role.id === 'g-string-milf' || role.id === 'bdsm-hard' || role.id === 'hentai-inspireret'))
      contextMul *= 0.2;
    if (cal?.roleHints?.includes('familie-sikker') && (role.id === 'g-string-milf' || role.id === 'bdsm-hard' || role.id === 'sex-scene' || role.id === 'hentai-inspireret' || role.id === 'fest-aften'))
      contextMul *= 0.08;
    if (cal?.roleHints?.includes('soft-everyday-femme') && role.id === 'bdsm-hard') contextMul *= 0.3;
    if (cal?.roleHints?.includes('gaming-praktisk') && (role.id === 'fest-aften' || role.id === 'bdsm-hard' || role.id === 'g-string-milf'))
      contextMul *= 0.25;

    const score = Math.max(role.weight * blendContextGaming(contextMul, gamingMul), 0.01);
    return { item: role, score };
  });

  return weightedPick(scored);
}

export function pickUnderwearForRole(role: RolePack): UnderwearItem {
  for (const id of role.underwearIds) {
    const hit = UNDERWEAR_CATALOG.find((u) => u.id === id);
    if (hit) return hit;
  }
  const tagged = UNDERWEAR_CATALOG.filter((u) =>
    role.underwearTags.some((t) => u.tags.includes(t) || u.styles.includes(t)),
  );
  if (tagged.length) return tagged[Math.floor(Math.random() * tagged.length)]!;
  return UNDERWEAR_CATALOG[0]!;
}

/**
 * Full layered outfit for a ROLE pack (underwear + outer layers matching role).
 */
export function pickOutfitLayersForRole(
  role: RolePack,
  underwear: UnderwearItem,
  profile: Profile,
  context: ContextState,
  opts?: {
    now?: Date;
    performance?: PerformanceSnapshot | null;
    calendar?: CalendarSummary | null;
  },
): OutfitLayerPick[] {
  const now = opts?.now ?? new Date();
  const perf = opts?.performance ?? null;
  const cal = opts?.calendar ?? null;
  const layers: OutfitLayerPick[] = [underwearLayer(underwear)];
  const usedLayers = new Set<OutfitLayer>(['underwear']);

  // Prefer role's prescribed pieces first
  for (const pid of role.preferredPieceIds) {
    const pick = resolvePieceId(pid);
    if (!pick) continue;
    if (usedLayers.has(pick.layer) && pick.layer !== 'accessory') continue;
    // Skip bottom if dress already covers
    if (pick.layer === 'bottom' && layers.some((l) => l.layer === 'top' && OUTFIT_CATALOG.find((p) => p.id === l.pieceId)?.coversBottom)) {
      continue;
    }
    layers.push(pick);
    usedLayers.add(pick.layer);
  }

  // Fill mandatory gaps from catalog with role tag boost (+ gaming punish/reward)
  const gamingTags: string[] = [...role.outerTags];
  if (perf?.band === 'poor') {
    // Dårlig → mere afslørende / straffet look
    gamingTags.push('sexy', 'synlig', 'tease', 'hard', 'straf');
  } else if (perf?.band === 'good' || perf?.band === 'godlike') {
    // God → blødere / mere dækket / sofistikeret belønning
    gamingTags.push('diskret', 'komfort', 'hverdag', 'luksus', 'belønning');
  }
  const need: OutfitPiece['layer'][] = ['top', 'shoes'];
  if (!layers.some((l) => l.layer === 'top' && OUTFIT_CATALOG.find((p) => p.id === l.pieceId)?.coversBottom)) {
    if (!usedLayers.has('bottom')) need.push('bottom');
  }
  for (const layer of need) {
    if (usedLayers.has(layer)) continue;
    const piece = pickLayer(layer, profile, context, now, perf, cal, undefined, gamingTags);
    if (piece) {
      layers.push(toLayerPick(piece));
      usedLayers.add(layer);
      if (piece.coversBottom) usedLayers.add('bottom');
    }
  }

  if (!usedLayers.has('legs') && chance(role.id === 'bdsm-hard' || role.id === 'fantasy-femme' || role.id === 'fantasy-look' || role.id === 'fest-aften' || role.id === 'hentai-inspireret' || role.id === 'brazilian-cut' ? 0.85 : 0.45)) {
    const legs = pickLayer('legs', profile, context, now, perf, cal, undefined, gamingTags);
    if (legs) layers.push(toLayerPick(legs));
  }
  // Poor gaming → less outer cover (mere afslørende); good → prefer outerwear cover
  const outerP =
    perf?.band === 'good' || perf?.band === 'godlike'
      ? 0.9
      : perf?.band === 'poor'
        ? 0.18
        : context.irlStatus === 'work' || context.irlStatus === 'out' || role.id === 'bdsm-hard' || role.id === 'office-milf' || role.id === 'familie-sikker' || role.id === 'fest-aften' || role.id === 'fantasy-look'
          ? 0.75
          : 0.3;
  if (!usedLayers.has('outerwear') && chance(outerP)) {
    const outer = pickLayer('outerwear', profile, context, now, perf, cal, undefined, gamingTags);
    if (outer) layers.push(toLayerPick(outer));
  }
  if (!usedLayers.has('accessory') && chance(0.8)) {
    const acc = pickLayer('accessory', profile, context, now, perf, cal, undefined, gamingTags);
    if (acc) layers.push(toLayerPick(acc));
  }

  return layers;
}

/**
 * Full layered outfit around an underwear pick (legacy path / fill).
 */
export function pickOutfitLayers(
  underwear: UnderwearItem,
  profile: Profile,
  context: ContextState,
  opts?: {
    now?: Date;
    performance?: PerformanceSnapshot | null;
    calendar?: CalendarSummary | null;
    excludeTopId?: string;
  },
): OutfitLayerPick[] {
  const now = opts?.now ?? new Date();
  const perf = opts?.performance ?? null;
  const cal = opts?.calendar ?? null;
  const irl = context.irlStatus;
  const layers: OutfitLayerPick[] = [underwearLayer(underwear)];

  const top = pickLayer('top', profile, context, now, perf, cal, opts?.excludeTopId);
  if (top) layers.push(toLayerPick(top));

  const skipBottom = !!top?.coversBottom;
  if (!skipBottom) {
    const bottom = pickLayer('bottom', profile, context, now, perf, cal);
    if (bottom) layers.push(toLayerPick(bottom));
  }

  const legsChance =
    irl === 'home' || irl === 'alone' ? 0.45 : hourBucket(now) === 'evening' ? 0.7 : 0.55;
  if (chance(legsChance)) {
    const legs = pickLayer('legs', profile, context, now, perf, cal);
    if (legs) layers.push(toLayerPick(legs));
  }

  const shoes = pickLayer('shoes', profile, context, now, perf, cal);
  if (shoes) layers.push(toLayerPick(shoes));

  const outerChance = irl === 'work' || irl === 'public' || irl === 'out' ? 0.82 : 0.28;
  if (chance(outerChance)) {
    const outer = pickLayer('outerwear', profile, context, now, perf, cal);
    if (outer) layers.push(toLayerPick(outer));
  }

  if (chance(0.78)) {
    const acc = pickLayer('accessory', profile, context, now, perf, cal);
    if (acc) layers.push(toLayerPick(acc));
  }

  return layers;
}

export function buildOutfitOrderText(
  layers: OutfitLayerPick[],
  profile: Profile,
  perf?: PerformanceSnapshot | null,
  role?: RolePack | null,
): string {
  const uw = layers.find((l) => l.layer === 'underwear');
  const rest = layers.filter((l) => l.layer !== 'underwear');
  const list = rest.map((l) => `${OUTFIT_LAYER_LABELS_DA[l.layer]}: ${l.nameDa}`).join('; ');
  const gameNote = role ? gamingPackModifier(role, perf).noteDa : '';
  let extra = '';
  if (perf && perf.sessionCount > 0 && !gameNote) {
    if (perf.band === 'poor') {
      extra = ' Gaming svag — mere afslørende / straffet look inden for rollen. ';
    } else if (perf.band === 'good' || perf.band === 'godlike') {
      extra = ' Gaming stærk — blødere / mere dækket belønning inden for rollen. ';
    }
  }
  const roleBlock = role
    ? `${role.commandVoiceDa} Vibe: ${role.vibe} Undertøj: ${role.undertøj} Ydre: ${role.ydre_lag} Sko/acc: ${role.sko_accessories} (${role.contrastDa}) `
    : 'FULD BEORDING — undertøj + ydre lag. ';
  return (
    `Frida — FULDT OUTFIT / ROLE: ${role?.nameDa ?? 'Uniform'}. ${roleBlock}` +
    `FULDT LOOK: Tag "${uw?.nameDa ?? 'beordret undertøj'}" på + hele outfittet (${list || 'ydre lag vælges'}). ` +
    `Dine ${profile.breastSize}-bryster skal sidde støttet.${gameNote}${extra} ` +
    `${WEIGHT_FORMULA_DA} Ingen improvisation — det er dagens uniform.`
  );
}

function scoreLook(
  look: OutfitLook,
  profile: Profile,
  context: ContextState,
  now: Date,
  perf?: PerformanceSnapshot | null,
  cal?: CalendarSummary | null,
): number {
  const hardish = look.intensity.includes('hard') && look.tags.includes('hard');
  const softish = look.intensity.includes('soft') && !hardish;
  const contextMul =
    themeScore(look.themes, profile.enabledThemes) *
    intensityFit(look.intensity, profile.intensity, profile.dayMode) *
    irlFit(look.tags, context.irlStatus, 'top') *
    timeFit(look.tags, now, 'top') *
    calendarUnderwearMultiplier(look.tags, hardish, softish, cal) *
    calendarRoleBoost(look.tags, cal);
  const gamingMul =
    gamingFit(look.tags, context.playingGame) *
    performanceFit(look.tags, look.intensity, perf);
  let score = look.weight * blendContextGaming(contextMul, gamingMul);
  if (look.irlBias?.length) {
    if (look.irlBias.includes(context.irlStatus)) score *= 1.8;
    else if (context.irlStatus === 'work' || context.irlStatus === 'public') score *= 0.08;
    else score *= 0.55;
  }
  return Math.max(score, 0.01);
}

function lookChance(irl: ContextState['irlStatus']): number {
  if (irl === 'home' || irl === 'alone') return 0.35; // prefer role packs more often
  if (irl === 'out') return 0.25;
  return 0.12;
}

export function pickPhotographedLook(
  profile: Profile,
  context: ContextState,
  opts?: {
    now?: Date;
    performance?: PerformanceSnapshot | null;
    calendar?: CalendarSummary | null;
    excludeLookId?: string;
  },
): OutfitLook | null {
  const now = opts?.now ?? new Date();
  let pool = OUTFIT_LOOKS.filter((l) => l.id !== opts?.excludeLookId);
  if (context.irlStatus === 'work' || context.irlStatus === 'public') {
    const discrete = pool.filter(
      (l) => l.tags.includes('hverdag') || l.tags.includes('komfort') || l.tags.includes('diskret'),
    );
    if (discrete.length) pool = discrete;
  }
  if (!pool.length) return null;
  if (Math.random() > lookChance(context.irlStatus)) return null;
  const scored = pool.map((item) => ({
    item,
    score: scoreLook(item, profile, context, now, opts?.performance, opts?.calendar),
  }));
  return weightedPick(scored);
}

export function buildLookOrderText(
  look: OutfitLook,
  profile: Profile,
  perf?: PerformanceSnapshot | null,
): string {
  const list = look.layers.map((l) => `${OUTFIT_LAYER_LABELS_DA[l.layer]}: ${l.nameDa}`).join('; ');
  let extra = '';
  if (perf && perf.sessionCount > 0) {
    if (perf.band === 'poor') {
      extra = ' Svag gaming-præstation — looket er en del af kontrollen. ';
    } else if (perf.band === 'good' || perf.band === 'godlike') {
      extra = ' Stærk session: du har stadig en uniform, men den kan være blødere. ';
    }
  }
  return (
    `Frida — FULDT OUTFIT: Looket "${look.nameDa}". ${look.orderBlurbDa} ` +
    `Lag: ${list}. Dine ${profile.breastSize}-bryster skal sidde støttet. ${extra}` +
    `${WEIGHT_FORMULA_DA} Ingen improvisation — det er dagens uniform.`
  );
}

export function attachOutfitToPick(
  pick: UnderwearPick,
  profile: Profile,
  context: ContextState,
  opts?: {
    now?: Date;
    performance?: PerformanceSnapshot | null;
    calendar?: CalendarSummary | null;
    force?: boolean;
    excludeLookId?: string;
    excludeRoleId?: RoleId;
  },
): UnderwearPick {
  if (!opts?.force && pick.layers && pick.layers.length > 1 && pick.roleId) return pick;
  const perf = opts?.performance ?? null;
  const influence =
    perf && perf.sessionCount > 0 ? influenceTextDa(perf, 'outfittet') : pick.performanceInfluenceDa;

  // Role-first full outfit (life control via FULL OUTFIT)
  const excludeResolved =
    resolveRoleId(opts?.excludeRoleId ?? pick.roleId) ?? opts?.excludeRoleId ?? pick.roleId;
  const role = pickRolePack(profile, context, {
    now: opts?.now,
    performance: perf,
    calendar: opts?.calendar,
    excludeRoleId: excludeResolved,
  });
  const uw =
    UNDERWEAR_CATALOG.find((i) => i.id === pick.itemId) ?? pickUnderwearForRole(role);
  // Prefer role underwear when forcing new day / role change
  const uwForRole = opts?.force ? pickUnderwearForRole(role) : uw;
  const layers = pickOutfitLayersForRole(role, uwForRole, profile, context, opts);

  // Occasional photographed look override only if it doesn't fight hard roles
  const look =
    role.id === 'bdsm-hard' || role.id === 'brazilian-cut' || role.id === 'g-string-milf' || role.id === 'hentai-inspireret' || role.id === 'sex-scene' || role.id === 'familie-sikker'
      ? null
      : pickPhotographedLook(profile, context, {
          now: opts?.now,
          performance: perf,
          calendar: opts?.calendar,
          excludeLookId: opts?.excludeLookId ?? pick.lookId,
        });

  if (look) {
    return {
      ...pick,
      itemId: look.layers.find((l) => l.layer === 'underwear')?.pieceId ?? uwForRole.id,
      lookId: look.id,
      lookNameDa: look.nameDa,
      imageFile: look.imageFile,
      layers: look.layers,
      orderTextDa: buildLookOrderText(look, profile, perf),
      performanceInfluenceDa: influence,
      roleId: role.id,
      roleNameDa: role.nameDa,
    };
  }

  return {
    ...pick,
    itemId: uwForRole.id,
    lookId: undefined,
    lookNameDa: undefined,
    imageFile: undefined,
    layers,
    orderTextDa: buildOutfitOrderText(layers, profile, perf, role),
    performanceInfluenceDa: influence,
    roleId: role.id,
    roleNameDa: role.nameDa,
  };
}

export function getOutfitPieceById(id: string): OutfitPiece | undefined {
  return OUTFIT_CATALOG.find((p) => p.id === id);
}

export function formatLayersDa(layers: OutfitLayerPick[] | undefined): string {
  if (!layers?.length) return '';
  return layers.map((l) => `${OUTFIT_LAYER_LABELS_DA[l.layer]}: ${l.nameDa}`).join(' · ');
}

export { getRolePack, WEIGHT_FORMULA_DA };
