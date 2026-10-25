// Pure scoring helpers for the Jev scoreboard. Free of Supabase imports so the
// page stays a simple server component and the maths is easy to check by hand.
//
// Every settled match is scored three times: the plain model (k = 0), Jev's
// half shift (k = 0.5) and Jev's full shift (k = 1). The shift rule below is
// the same one the Python job uses; the full-shift output should match the
// stored adj_home / adj_draw / adj_away values to three decimal places.

import type { JevPrediction } from "@/lib/types";

export type Result = "H" | "D" | "A";
export type VersionKey = "plain" | "half" | "full";

export type Probs = { home: number; draw: number; away: number };

// Probabilities are clamped away from 0 and 1 before taking a log, so one
// very confident wrong call can never produce an infinite log loss.
const MIN_PROB = 1e-9;

// Differences smaller than this count as "identical" when comparing versions,
// so tiny floating-point noise does not look like a real change.
const SAME = 1e-9;

// The exact shift rule: move the home probability by shift_points/100 * k
// (a null shift counts as 0), clamp to [0.01, 0.98], then split the rest
// between draw and away in their original proportions.
export function applyShift(
  pHome: number,
  pDraw: number,
  pAway: number,
  shiftPoints: number | null,
  k: number
): Probs {
  const shift = ((shiftPoints ?? 0) / 100) * k;
  const newHome = Math.min(0.98, Math.max(0.01, pHome + shift));
  const remaining = 1 - newHome;
  const denom = pDraw + pAway;
  const newDraw =
    denom > 0 ? (remaining * pDraw) / denom : remaining / 2;
  const newAway = remaining - newDraw;
  return { home: newHome, draw: newDraw, away: newAway };
}

// The probability a version gave to the outcome that actually happened.
export function probForResult(probs: Probs, result: Result): number {
  if (result === "H") return probs.home;
  if (result === "D") return probs.draw;
  return probs.away;
}

// Log loss for one match: -ln(p), with p clamped to a tiny minimum.
export function logLoss(prob: number): number {
  return -Math.log(Math.min(1, Math.max(prob, MIN_PROB)));
}

// Correct when the actual outcome is (tied for) the highest probability.
export function isCorrect(probs: Probs, result: Result): boolean {
  const p = probForResult(probs, result);
  return p >= probs.home && p >= probs.draw && p >= probs.away;
}

export type VersionScore = {
  logLoss: number | null; // null when nothing could be scored
  accuracy: number | null; // 0..1, null when nothing could be scored
  better: number; // head-to-head against the plain model (half/full only)
  worse: number;
  identical: number;
};

export type ScoreSummary = {
  count: number; // all settled matches
  scored: number; // settled matches with a full set of probabilities
  promptVersions: string[];
  plain: VersionScore;
  half: VersionScore;
  full: VersionScore;
};

export type MatchView = {
  key: string;
  home: string;
  away: string;
  fixtureDate: string;
  homeGoals: number | null;
  awayGoals: number | null;
  result: Result;
  shiftPoints: number | null;
  // Probability each version gave to the actual result, or null when the row
  // is missing a probability and cannot be scored.
  plain: number | null;
  half: number | null;
  full: number | null;
  plainCorrect: boolean | null;
  halfCorrect: boolean | null;
  fullCorrect: boolean | null;
};

export type Scoreboard = {
  summary: ScoreSummary;
  matches: MatchView[];
};

function hasProbabilities(row: JevPrediction): boolean {
  return (
    Number.isFinite(row.p_home) &&
    Number.isFinite(row.p_draw) &&
    Number.isFinite(row.p_away)
  );
}

function toMatchView(row: JevPrediction & { result: Result }): MatchView {
  const base = {
    key: `${row.home}|${row.away}|${row.fixture_date}`,
    home: row.home,
    away: row.away,
    fixtureDate: row.fixture_date,
    homeGoals: row.home_goals,
    awayGoals: row.away_goals,
    result: row.result,
    shiftPoints: row.shift_points,
  };

  if (!hasProbabilities(row)) {
    return {
      ...base,
      plain: null,
      half: null,
      full: null,
      plainCorrect: null,
      halfCorrect: null,
      fullCorrect: null,
    };
  }

  const plainProbs = applyShift(
    row.p_home,
    row.p_draw,
    row.p_away,
    row.shift_points,
    0
  );
  const halfProbs = applyShift(
    row.p_home,
    row.p_draw,
    row.p_away,
    row.shift_points,
    0.5
  );
  const fullProbs = applyShift(
    row.p_home,
    row.p_draw,
    row.p_away,
    row.shift_points,
    1
  );

  return {
    ...base,
    plain: probForResult(plainProbs, row.result),
    half: probForResult(halfProbs, row.result),
    full: probForResult(fullProbs, row.result),
    plainCorrect: isCorrect(plainProbs, row.result),
    halfCorrect: isCorrect(halfProbs, row.result),
    fullCorrect: isCorrect(fullProbs, row.result),
  };
}

function tally(diff: number): "better" | "worse" | "identical" {
  if (diff > SAME) return "better";
  if (diff < -SAME) return "worse";
  return "identical";
}

// Turns settled rows into the full scoreboard: the three-version summary and
// the per-match list. All maths lives here so the page is just layout.
export function buildScoreboard(rows: JevPrediction[]): Scoreboard {
  const settled = rows.filter(
    (r): r is JevPrediction & { result: Result } => r.result !== null
  );
  const matches = settled.map(toMatchView);

  let scored = 0;
  let plainSum = 0;
  let halfSum = 0;
  let fullSum = 0;
  let plainCorrect = 0;
  let halfCorrect = 0;
  let fullCorrect = 0;
  let halfBetter = 0;
  let halfWorse = 0;
  let halfIdentical = 0;
  let fullBetter = 0;
  let fullWorse = 0;
  let fullIdentical = 0;

  for (const m of matches) {
    if (
      m.plain === null ||
      m.half === null ||
      m.full === null ||
      m.plainCorrect === null ||
      m.halfCorrect === null ||
      m.fullCorrect === null
    ) {
      continue;
    }

    const plainLoss = logLoss(m.plain);
    const halfLoss = logLoss(m.half);
    const fullLoss = logLoss(m.full);

    plainSum += plainLoss;
    halfSum += halfLoss;
    fullSum += fullLoss;
    if (m.plainCorrect) plainCorrect += 1;
    if (m.halfCorrect) halfCorrect += 1;
    if (m.fullCorrect) fullCorrect += 1;
    scored += 1;

    const halfResult = tally(plainLoss - halfLoss);
    if (halfResult === "better") halfBetter += 1;
    else if (halfResult === "worse") halfWorse += 1;
    else halfIdentical += 1;

    const fullResult = tally(plainLoss - fullLoss);
    if (fullResult === "better") fullBetter += 1;
    else if (fullResult === "worse") fullWorse += 1;
    else fullIdentical += 1;
  }

  const promptVersions = Array.from(
    new Set(
      settled
        .map((r) => r.prompt_version)
        .filter((v): v is string => v !== null && v !== "")
    )
  ).sort();

  const summary: ScoreSummary = {
    count: settled.length,
    scored,
    promptVersions,
    plain: {
      logLoss: scored > 0 ? plainSum / scored : null,
      accuracy: scored > 0 ? plainCorrect / scored : null,
      better: 0,
      worse: 0,
      identical: 0,
    },
    half: {
      logLoss: scored > 0 ? halfSum / scored : null,
      accuracy: scored > 0 ? halfCorrect / scored : null,
      better: halfBetter,
      worse: halfWorse,
      identical: halfIdentical,
    },
    full: {
      logLoss: scored > 0 ? fullSum / scored : null,
      accuracy: scored > 0 ? fullCorrect / scored : null,
      better: fullBetter,
      worse: fullWorse,
      identical: fullIdentical,
    },
  };

  return { summary, matches };
}

// Plain-language "how much data" sentence. Deliberately never claims one
// version is better; the numbers are shown separately.
export function dataNote(count: number): string {
  if (count < 30) {
    return "That is far too early to conclude anything. Treat these numbers as a sanity check only.";
  }
  if (count < 100) {
    return "These are early signs only, not a reliable result.";
  }
  return "There is a reasonable amount of data now, though one season is still a small sample.";
}
