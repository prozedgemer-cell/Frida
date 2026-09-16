import type { MetricMap } from '../engines/gameScoreEngine';
import type { GamePresetId } from '../data/gameProfiles';
import type { GameResult } from '../types';

/**
 * Best-effort paste parser for tracker / scoreboard summary text.
 * Never requires passwords — user pastes public-looking summary text only.
 */
export function parseTrackerPaste(
  text: string,
  gameId: GamePresetId,
): { metrics: MetricMap; result?: GameResult; note?: string } {
  const t = text.replace(/\u00a0/g, ' ');
  const metrics: MetricMap = {};
  let result: GameResult | undefined;

  const winLoss = t.match(/\b(victory|defeat|win|loss|sejr|nederlag|won|lost)\b/i);
  if (winLoss) {
    const w = winLoss[1]!.toLowerCase();
    if (/victory|win|sejr|won/.test(w)) result = 'win';
    else if (/defeat|loss|nederlag|lost/.test(w)) result = 'loss';
  }

  const grab = (re: RegExp): number | undefined => {
    const m = t.match(re);
    if (!m?.[1]) return undefined;
    const n = Number(m[1].replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
  };

  // Common K/D/A patterns: 12/8/4 or 12-8-4 or Kills: 12 Deaths: 8
  const kdaSlash = t.match(/\b(\d{1,3})\s*\/\s*(\d{1,3})\s*\/\s*(\d{1,3})\b/);
  const kdSlash = t.match(/\b(\d{1,3})\s*\/\s*(\d{1,3})\b/);

  if (kdaSlash && (gameId === 'lol' || gameId === 'cs2' || gameId === 'wardogs' || gameId === 'fortnite')) {
    metrics.kills = Number(kdaSlash[1]);
    metrics.deaths = Number(kdaSlash[2]);
    metrics.assists = Number(kdaSlash[3]);
  } else if ((gameId === 'cs2' || gameId === 'wardogs' || gameId === 'fortnite') && kdSlash) {
    metrics.kills = Number(kdSlash[1]);
    metrics.deaths = Number(kdSlash[2]);
  }

  const kills = grab(/(?:kills?|drab)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i);
  const deaths = grab(/(?:deaths?|døde|dødsfald)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i);
  const assists = grab(/(?:assists?|revives?)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i);
  if (kills != null) metrics.kills = kills;
  if (deaths != null) metrics.deaths = deaths;
  if (assists != null) metrics.assists = assists;

  const adr = grab(/(?:ADR|avg\.?\s*damage)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i);
  if (adr != null) metrics.adr = adr;

  const hs = grab(/(?:HS|headshot)s?\s*%?\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*%?/i);
  if (hs != null) metrics.hsPercent = hs;

  const cspm = grab(/(?:CS\s*\/\s*min|CSPM|CS per min)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i);
  if (cspm != null) metrics.csPerMin = cspm;

  const vision = grab(/(?:vision(?:\s*score)?)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i);
  if (vision != null) metrics.visionScore = vision;

  // Netto / cash — allow signed values (profit vs tab)
  const signedCash = t.match(
    /(?:netto|profit|tab|cash|earned|net)\s*[:=]?\s*([+-]?)\s*\$?\s*([\d.,]+)/i,
  );
  if (signedCash) {
    const signWord = signedCash[0].toLowerCase();
    let n = Number(signedCash[2]!.replace(',', '.'));
    if (signedCash[1] === '-') n = -Math.abs(n);
    else if (/tab|loss|lost/.test(signWord) && signedCash[1] !== '+') n = -Math.abs(n);
    if (Number.isFinite(n)) metrics.cash = n;
  } else {
    const cash = grab(/(?:cash|earned|\$)\s*[:=]?\s*\$?\s*([\d.,]+)/i);
    if (cash != null) metrics.cash = cash;
  }

  const pit = grab(/(?:pit(?:\s*tier)?|tier)\s*[:=]?\s*(\d{1,3})/i);
  if (pit != null && gameId === 'diablo4') metrics.pitTier = pit;

  const place = grab(/(?:placement|place|#)\s*[:=]?\s*#?\s*(\d{1,3})/i);
  if (place != null && gameId === 'fortnite') metrics.placement = place;

  const filled = Object.keys(metrics).length;
  return {
    metrics,
    result,
    note: filled
      ? `Import: ${filled} felter fra paste`
      : 'Kunne ikke parse — udfyld manuelt',
  };
}
