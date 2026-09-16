import { CHALLENGE_TEMPLATES } from '../data/challenges';
import { getUnderwearById } from './underwearEngine';
import type {
  ActiveChallenge,
  ChallengeTemplate,
  ContextState,
  Intensity,
  Profile,
  ThemePack,
  UnderwearPick,
} from '../types';

const VAGINAL_BLOCK =
  /\b(vagina|vaginal|kusse|skede|clitoris|klitoris|pussy)\b/i;

function fillVars(
  text: string,
  profile: Profile,
  context: ContextState,
  underwear: UnderwearPick | null,
): string {
  const uw = underwear ? getUnderwearById(underwear.itemId)?.nameDa ?? 'dit beordrede undertøj' : 'dit beordrede undertøj';
  return text
    .replaceAll('{breastSize}', profile.breastSize)
    .replaceAll('{underwear}', uw)
    .replaceAll('{game}', context.playingGame.trim() || 'dit spil')
    .replaceAll('{irl}', context.irlStatus)
    .replaceAll('{intensity}', profile.intensity);
}

function respectsHardLimits(t: ChallengeTemplate, limits: string[]): boolean {
  if (!t.hardLimitKeys?.length) return true;
  return !t.hardLimitKeys.some((k) => limits.includes(k));
}

function anatomyOk(t: ChallengeTemplate): boolean {
  const blob = `${t.titleDa} ${t.bodyDa}`;
  if (VAGINAL_BLOCK.test(blob) && !t.allowsSemenCollection) return false;
  // Extra guard: block vaginal-use phrasing even in semen templates
  if (/\bvaginal\b/i.test(blob) && !/opsamling|sæd|semen|bryst/i.test(blob)) return false;
  return true;
}

function themeOk(t: ChallengeTemplate, enabled: ThemePack[]): boolean {
  return t.themes.some((th) => enabled.includes(th));
}

function intensityOk(t: ChallengeTemplate, intensity: Intensity, dayMode: Profile['dayMode']): boolean {
  const mode: Intensity = dayMode === 'hard' ? (intensity === 'hard' ? 'hard' : 'soft') : intensity;
  // On soft day, only soft-capable templates
  if (dayMode === 'soft') return t.intensity.includes('soft');
  return t.intensity.includes(mode) || t.intensity.includes(intensity);
}

export function filterTemplates(
  profile: Profile,
  _context: ContextState,
): ChallengeTemplate[] {
  return CHALLENGE_TEMPLATES.filter(
    (t) =>
      anatomyOk(t) &&
      respectsHardLimits(t, profile.hardLimits) &&
      themeOk(t, profile.enabledThemes) &&
      intensityOk(t, profile.intensity, profile.dayMode),
  );
}

function pickIntensity(t: ChallengeTemplate, profile: Profile): Intensity {
  if (profile.dayMode === 'soft') return 'soft';
  if (t.intensity.includes(profile.intensity)) return profile.intensity;
  return t.intensity[0];
}

export function drawChallenges(
  profile: Profile,
  context: ContextState,
  underwear: UnderwearPick | null,
  count = 3,
  excludeTemplateIds: string[] = [],
): ActiveChallenge[] {
  const pool = filterTemplates(profile, context).filter((t) => !excludeTemplateIds.includes(t.id));
  if (!pool.length) return [];

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(count, shuffled.length));

  return picked.map((t) => {
    const intensity = pickIntensity(t, profile);
    return {
      id: `active-${t.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      templateId: t.id,
      titleDa: fillVars(t.titleDa, profile, context, underwear),
      bodyDa: fillVars(t.bodyDa, profile, context, underwear),
      themes: t.themes,
      intensity,
      createdAt: new Date().toISOString(),
      status: 'active' as const,
    };
  });
}

/**
 * Dokumenteret skalering:
 * N templates × T themes × 2 intensity × V var-udfyldninger × kontekst
 * ≈ stort kombinatorisk rum (titusinder) uden at hardkode hver variant.
 */
export function estimateVariationSpace(): {
  templates: number;
  noteDa: string;
} {
  const templates = CHALLENGE_TEMPLATES.length;
  const themes = 8;
  const intensity = 2;
  const approxVars = 4; // breast / underwear / game / irl
  const approx = templates * themes * intensity * approxVars;
  return {
    templates,
    noteDa: `${templates} skabeloner × themes × intensitet × variabler ≈ ~${approx.toLocaleString('da-DK')} konkrete variationer (orden-størrelse; faktisk unikke tekster afhænger af aktive packs).`,
  };
}
