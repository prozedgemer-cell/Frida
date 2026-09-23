/**
 * Documented influence blend for outfit + challenge weighting.
 *
 * calendar / role / day / IRL / time  ≈ 70%
 * gaming performance (sessions)       ≈ 30%
 */
export const CONTEXT_WEIGHT = 0.7;
export const GAMING_WEIGHT = 0.3;

/** Blend two positive multipliers (typical ~0.2–3). */
export function blendContextGaming(contextMul: number, gamingMul: number): number {
  const c = Number.isFinite(contextMul) ? Math.max(contextMul, 0.01) : 1;
  const g = Number.isFinite(gamingMul) ? Math.max(gamingMul, 0.01) : 1;
  return CONTEXT_WEIGHT * c + GAMING_WEIGHT * g;
}

export const WEIGHT_FORMULA_DA =
  'Weight: calendar/role/day/IRL/time ≈ 70% · gaming performance ≈ 30% (blendContextGaming).';
