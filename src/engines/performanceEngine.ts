import {
  computeGameScore,
  ratingFromScore,
} from './gameScoreEngine';
import type {
  GameResult,
  GameSessionLog,
  PerformanceBand,
  PerformanceRating,
  PerformanceSnapshot,
} from '../types';
import { RATING_LABELS_DA, RESULT_LABELS_DA } from '../types';

const RATING_BASE: Record<PerformanceRating, number> = {
  1: 12,
  2: 38,
  3: 58,
  4: 78,
  5: 96,
};

const RESULT_DELTA: Record<GameResult, number> = {
  win: 14,
  draw: 2,
  other: 0,
  quit: -12,
  loss: -16,
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Single-session raw score 0–100.
 * Prefer game-specific computedScore (from KPIs); else classic rating+result.
 */
export function sessionRawScore(s: GameSessionLog): number {
  if (typeof s.computedScore === 'number' && Number.isFinite(s.computedScore)) {
    return clamp(s.computedScore, 0, 100);
  }
  // Recompute if metrics present but score missing (older saves / edits)
  if (s.gameId && s.metrics) {
    const recomputed = computeGameScore(s.gameId, s.metrics, s.result);
    if (recomputed != null) return clamp(recomputed, 0, 100);
  }
  return clamp(RATING_BASE[s.rating] + RESULT_DELTA[s.result], 0, 100);
}

export function bandFromScore(score: number): PerformanceBand {
  if (score < 35) return 'poor';
  if (score < 55) return 'ok';
  if (score < 78) return 'good';
  return 'godlike';
}

/**
 * Recent weighted average (last up to 8 sessions, newest heaviest)
 * + streak modifier (±6 per consecutive win/loss, capped ±18).
 */
export function computePerformance(sessions: GameSessionLog[]): PerformanceSnapshot {
  const sorted = [...sessions].sort((a, b) => b.at.localeCompare(a.at));
  const last = sorted[0] ?? null;
  if (!sorted.length) {
    return {
      score: 50,
      streak: 0,
      band: 'ok',
      summaryDa: 'Ingen sessions logget endnu — neutral præstation.',
      lastSession: null,
      sessionCount: 0,
    };
  }

  const recent = sorted.slice(0, 8);
  let wSum = 0;
  let sSum = 0;
  recent.forEach((s, i) => {
    const w = recent.length - i; // newest = highest
    wSum += w;
    sSum += sessionRawScore(s) * w;
  });
  let score = sSum / wSum;

  // Streak: consecutive same decisive result from newest
  let streak = 0;
  for (const s of sorted) {
    if (s.result === 'win') {
      if (streak < 0) break;
      streak += 1;
    } else if (s.result === 'loss' || s.result === 'quit') {
      if (streak > 0) break;
      streak -= 1;
    } else {
      break;
    }
  }
  score = clamp(score + clamp(streak, -3, 3) * 6, 0, 100);
  const band = bandFromScore(score);

  const streakDa =
    streak > 0
      ? `sejrsstime ×${streak}`
      : streak < 0
        ? `nederlagsstime ×${Math.abs(streak)}`
        : 'ingen streak';

  const lastDa = last
    ? `${last.gameName}: ${RESULT_LABELS_DA[last.result]} · ${
        last.computedScore != null
          ? `${last.computedScore}/100`
          : RATING_LABELS_DA[last.rating]
      }`
    : '';

  const bandDa =
    band === 'poor'
      ? 'svag præstation'
      : band === 'ok'
        ? 'middel præstation'
        : band === 'good'
          ? 'stærk præstation'
          : 'godlike præstation';

  return {
    score: Math.round(score),
    streak,
    band,
    summaryDa: `${bandDa} (${Math.round(score)}/100) · ${streakDa}${lastDa ? ` · sidst: ${lastDa}` : ''}`,
    lastSession: last,
    sessionCount: sessions.length,
  };
}

export function influenceTextDa(perf: PerformanceSnapshot, subject: string): string {
  if (!perf.lastSession) {
    return `${subject} er neutralt vægtet (ingen session endnu).`;
  }
  const last = perf.lastSession;
  const when = new Date(last.at).toLocaleString('da-DK', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const detail =
    last.computedScore != null
      ? `${last.computedScore}/100 KPI-score`
      : `${RESULT_LABELS_DA[last.result].toLowerCase()} / ${RATING_LABELS_DA[last.rating].toLowerCase()}`;
  if (perf.band === 'poor') {
    return `Fordi din sidste session (${last.gameName}, ${when}) var ${detail}: ${subject} hælder til straf / hårdere kontrol.`;
  }
  if (perf.band === 'godlike' || perf.band === 'good') {
    return `Fordi din sidste session (${last.gameName}, ${when}) gik ${detail}: ${subject} hælder til belønning / blødere tease.`;
  }
  return `Fordi din sidste session (${last.gameName}, ${when}) var middel (${detail}): ${subject} er afbalanceret.`;
}

/** Points for completing/failing a normal challenge (small). */
export function challengePointsDelta(
  outcome: 'complete' | 'skip' | 'fail',
  bonus = 5,
  penalty = 3,
): number {
  if (outcome === 'complete') return bonus;
  if (outcome === 'fail') return -penalty;
  return 0;
}

export { ratingFromScore, computeGameScore };
