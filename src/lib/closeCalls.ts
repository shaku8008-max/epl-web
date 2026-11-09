// Rules for this page:
// - pick(p) is H, D, or A with the highest probability.
// - gap(p) is the highest probability minus the second-highest probability.
//   It is measured in probability units, so 0.06 means 6 percentage points.
// - CLOSE_CALL_GAP is 0.06. A prediction is a close call when its gap is at
//   most that value.
// - A fixture is a disagreement when at least two available model picks differ.
//   Models without a prediction are left out of that comparison and shown as
//   not available by the page.
// - These comparisons are descriptive, not a ranking of models.

import type { TrackRecord } from "@/lib/types";
import { fixtureKey } from "@/lib/trackRecord";

export const CLOSE_CALL_GAP = 0.06;

export type Outcome = "H" | "D" | "A";

export type ProbabilityRow = {
  home: string;
  away: string;
  fixture_date: string | null;
  p_home: number | null;
  p_draw: number | null;
  p_away: number | null;
};

export type ModelPrediction = ProbabilityRow & { modelKey: string };

export type ModelComparison = {
  modelKey: string;
  pick: Outcome;
  gap: number;
  probabilities: { home: number; draw: number; away: number };
  correct: boolean | null;
};

export type FixtureComparison = {
  key: string;
  home: string;
  away: string;
  fixture_date: string;
  models: ModelComparison[];
  actual: Outcome | null;
  disagreement: boolean;
  closeCall: boolean;
  smallestGap: number | null;
};

function validProbability(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function pick(probabilities: Pick<ProbabilityRow, "p_home" | "p_draw" | "p_away">): Outcome | null {
  const { p_home, p_draw, p_away } = probabilities;
  if (!validProbability(p_home) || !validProbability(p_draw) || !validProbability(p_away)) return null;
  const values: [Outcome, number][] = [["H", p_home], ["D", p_draw], ["A", p_away]];
  return values.sort((a, b) => b[1] - a[1])[0][0];
}

export function gap(probabilities: Pick<ProbabilityRow, "p_home" | "p_draw" | "p_away">): number | null {
  const { p_home, p_draw, p_away } = probabilities;
  if (!validProbability(p_home) || !validProbability(p_draw) || !validProbability(p_away)) return null;
  const values = [p_home, p_draw, p_away].sort((a, b) => b - a);
  return values[0] - values[1];
}

function comparisonForRows(rows: ModelPrediction[], actual: Outcome | null = null): ModelComparison[] {
  return rows.flatMap((row) => {
    const selectedPick = pick(row);
    const selectedGap = gap(row);
    if (selectedPick === null || selectedGap === null) return [];
    return [{
      modelKey: row.modelKey,
      pick: selectedPick,
      gap: selectedGap,
      probabilities: { home: row.p_home as number, draw: row.p_draw as number, away: row.p_away as number },
      correct: actual === null ? null : selectedPick === actual,
    }];
  });
}

function compareGroups(groups: Map<string, ModelPrediction[]>, dates: Set<string>): FixtureComparison[] {
  return [...groups.entries()].flatMap(([key, rows]) => {
    const first = rows[0];
    if (!first || !first.fixture_date || !dates.has(first.fixture_date)) return [];
    const models = comparisonForRows(rows);
    const picks = new Set(models.map((model) => model.pick));
    const closeGaps = models.filter((model) => model.gap <= CLOSE_CALL_GAP).map((model) => model.gap);
    return [{
      key,
      home: first.home,
      away: first.away,
      fixture_date: first.fixture_date,
      models,
      actual: null,
      disagreement: models.length >= 2 && picks.size > 1,
      closeCall: closeGaps.length > 0,
      smallestGap: models.length > 0 ? Math.min(...models.map((model) => model.gap)) : null,
    }];
  });
}

export function compareUpcomingFixtures(modelPredictions: ModelPrediction[]): FixtureComparison[] {
  const dated = modelPredictions.filter((row) => row.fixture_date !== null);
  if (dated.length === 0) return [];
  const groups = new Map<string, ModelPrediction[]>();
  for (const row of dated) {
    const key = `${row.home}|${row.away}|${row.fixture_date}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const earliest = [...groups.values()].map((rows) => rows[0].fixture_date as string).sort()[0];
  const earliestTime = new Date(`${earliest}T00:00:00Z`).getTime();
  const latestTime = earliestTime + 4 * 24 * 60 * 60 * 1000;
  const dates = new Set([...groups.values()].map((rows) => rows[0].fixture_date as string).filter((date) => {
    const time = new Date(`${date}T00:00:00Z`).getTime();
    return time <= latestTime;
  }));
  return compareGroups(groups, dates).sort((a, b) => a.fixture_date.localeCompare(b.fixture_date) || a.home.localeCompare(b.home));
}

export function compareScoredMatches(rows: TrackRecord[]): FixtureComparison[] {
  const groups = new Map<string, ModelPrediction[]>();
  const actuals = new Map<string, Outcome | null>();
  for (const row of rows) {
    if (!row.home || !row.away || !row.fixture_date || pick(row) === null || gap(row) === null) continue;
    const key = fixtureKey(row);
    const modelRow: ModelPrediction = { modelKey: row.model_key, home: row.home, away: row.away, fixture_date: row.fixture_date, p_home: row.p_home, p_draw: row.p_draw, p_away: row.p_away };
    groups.set(key, [...(groups.get(key) ?? []), modelRow]);
    actuals.set(key, row.result);
  }
  return [...groups.entries()].flatMap(([key, modelRows]) => {
    const first = modelRows[0];
    const models = comparisonForRows(modelRows, actuals.get(key) ?? null);
    const picks = new Set(models.map((model) => model.pick));
    if (models.length < 2 || picks.size < 2) return [];
    const closeGaps = models.filter((model) => model.gap <= CLOSE_CALL_GAP).map((model) => model.gap);
    return [{ key, home: first.home, away: first.away, fixture_date: first.fixture_date as string, models, actual: actuals.get(key) ?? null, disagreement: true, closeCall: closeGaps.length > 0, smallestGap: Math.min(...models.map((model) => model.gap)) }];
  }).sort((a, b) => b.fixture_date.localeCompare(a.fixture_date));
}

export function scoredCloseCalls(rows: TrackRecord[]): FixtureComparison[] {
  const groups = new Map<string, ModelPrediction[]>();
  const actuals = new Map<string, Outcome | null>();
  for (const row of rows) {
    if (!row.home || !row.away || !row.fixture_date || pick(row) === null || gap(row) === null) continue;
    const key = fixtureKey(row);
    groups.set(key, [...(groups.get(key) ?? []), { modelKey: row.model_key, home: row.home, away: row.away, fixture_date: row.fixture_date, p_home: row.p_home, p_draw: row.p_draw, p_away: row.p_away }]);
    actuals.set(key, row.result);
  }
  return [...groups.entries()].flatMap(([key, modelRows]) => {
    const first = modelRows[0];
    const models = comparisonForRows(modelRows, actuals.get(key) ?? null).filter((model) => model.gap <= CLOSE_CALL_GAP);
    if (models.length === 0) return [];
    return [{ key, home: first.home, away: first.away, fixture_date: first.fixture_date as string, models, actual: actuals.get(key) ?? null, disagreement: new Set(models.map((model) => model.pick)).size > 1, closeCall: true, smallestGap: Math.min(...models.map((model) => model.gap)) }];
  }).sort((a, b) => b.fixture_date.localeCompare(a.fixture_date));
}

export function disagreementTallies(comparisons: FixtureComparison[]) {
  const tally = new Map<string, { right: number; total: number }>();
  for (const comparison of comparisons) for (const model of comparison.models) {
    const current = tally.get(model.modelKey) ?? { right: 0, total: 0 };
    tally.set(model.modelKey, { right: current.right + (model.correct === true ? 1 : 0), total: current.total + 1 });
  }
  return tally;
}

export function countScoredMultiModelMatches(rows: TrackRecord[]): number {
  const groups = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.home || !row.away || !row.fixture_date || pick(row) === null || gap(row) === null) continue;
    const key = fixtureKey(row);
    const models = groups.get(key) ?? new Set<string>();
    models.add(row.model_key);
    groups.set(key, models);
  }
  return [...groups.values()].filter((models) => models.size >= 2).length;
}
