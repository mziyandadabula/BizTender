/**
 * Our own name-similarity engine (section 10 of the brief).
 * Normalises punctuation/case/suffixes, then scores with Levenshtein distance
 * plus a token-overlap bonus so word-order changes still register as similar.
 */

const COMMON_SUFFIXES = [
  "pty ltd", "pty. ltd.", "(pty) ltd", "(pty)ltd", "proprietary limited",
  "cc", "close corporation", "inc", "incorporated", "ltd", "limited",
  "npc", "non profit company",
];

export function normaliseName(raw: string): string {
  let s = raw.toLowerCase().trim();
  s = s.replace(/[.,'"()]/g, " ");
  s = s.replace(/\s+/g, " ").trim(); // collapse before suffix matching, so stripped punctuation doesn't break \b...\b matches
  for (const suffix of COMMON_SUFFIXES) {
    s = s.replace(new RegExp(`\\b${suffix.replace(/[().]/g, "\\$&")}\\b`, "g"), "");
  }
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

function tokenOverlap(a: string, b: string): number {
  const aTokens = new Set(a.split(" ").filter(Boolean));
  const bTokens = new Set(b.split(" ").filter(Boolean));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  let shared = 0;
  for (const t of aTokens) if (bTokens.has(t)) shared++;
  return shared / Math.max(aTokens.size, bTokens.size);
}

export type SimilarityBand = "exact" | "high" | "medium" | "low" | "none";

export function scoreSimilarity(query: string, candidate: string): { band: SimilarityBand; score: number } {
  const q = normaliseName(query);
  const c = normaliseName(candidate);

  if (q === c) return { band: "exact", score: 1 };

  const maxLen = Math.max(q.length, c.length) || 1;
  const editSimilarity = 1 - levenshtein(q, c) / maxLen;
  const overlap = tokenOverlap(q, c);
  const combined = editSimilarity * 0.6 + overlap * 0.4;

  let band: SimilarityBand = "none";
  if (combined >= 0.85) band = "high";
  else if (combined >= 0.6) band = "medium";
  else if (combined >= 0.35) band = "low";

  return { band, score: Math.round(combined * 100) / 100 };
}

/** Rolls a list of per-candidate bands up into the traffic-light shown to the user. */
export function overallSignal(bands: SimilarityBand[]): "green" | "orange" | "red" {
  if (bands.includes("exact") || bands.includes("high")) return "red";
  if (bands.includes("medium")) return "orange";
  return "green";
}
