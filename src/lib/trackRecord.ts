import type { TrackRecord } from "@/lib/types";

export const trackedModels = [
  { key: "lean", label: "Lean" },
  { key: "nn", label: "Neural network" },
  { key: "goals", label: "Linear goals" },
] as const;

export const modelColours: Record<string, { line: string; text: string; tint: string }> = {
  lean: { line: "var(--color-model-lean)", text: "text-model-lean", tint: "bg-model-lean-soft" },
  nn: { line: "var(--color-model-nn)", text: "text-model-nn", tint: "bg-model-nn-soft" },
  goals: { line: "var(--color-model-goals)", text: "text-model-goals", tint: "bg-model-goals-soft" },
};

export function modelColour(modelKey: string) {
  return modelColours[modelKey] ?? { line: "var(--color-muted)", text: "text-muted", tint: "bg-tint" };
}

export function modelLabel(key: string): string {
  return trackedModels.find((model) => model.key === key)?.label ?? key;
}

// Win rate is correct / scored for that model, using the same track-record rows
// as the live record lines (scored = rows, correct = rows with correct === true).
// Models with scored matches sort by win rate descending, then scored matches
// descending, then fixed Lean, Neural network, Linear goals order. Zero-scored
// models sort after scored models in that same fixed order.
export function sortModelsByWinRate<T extends { key: string }>(
  models: readonly T[],
  rows: TrackRecord[],
): T[] {
  return models
    .map((model, index) => {
      const modelRows = rows.filter((row) => row.model_key === model.key);
      const correct = modelRows.filter((row) => row.correct === true).length;
      return { model, index, scored: modelRows.length, correct };
    })
    .sort((a, b) => {
      const aHasScore = a.scored > 0;
      const bHasScore = b.scored > 0;
      if (aHasScore !== bHasScore) return aHasScore ? -1 : 1;
      if (aHasScore) {
        const winRateDifference = b.correct / b.scored - a.correct / a.scored;
        if (winRateDifference !== 0) return winRateDifference;
        if (a.scored !== b.scored) return b.scored - a.scored;
      }
      return a.index - b.index;
    })
    .map(({ model }) => model);
}

export type TrackRecordPoint = {
  row: TrackRecord;
  average: number;
  position: number;
};

export type TrackRecordSeries = {
  modelKey: string;
  points: TrackRecordPoint[];
};

export type CorrectPicksPoint = {
  row: TrackRecord;
  correct: number;
  position: number;
};

export type CorrectPicksSeries = {
  modelKey: string;
  points: CorrectPicksPoint[];
};

function validLogLoss(row: TrackRecord): row is TrackRecord & { log_loss: number } {
  return typeof row.log_loss === "number" && Number.isFinite(row.log_loss);
}

export function fixtureKey(row: Pick<TrackRecord, "fixture_date" | "home" | "away">): string {
  return `${row.fixture_date ?? ""}|${row.home ?? ""}|${row.away ?? ""}`;
}

export function orderedFixtures(rows: TrackRecord[]): TrackRecord[] {
  return rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.fixture_date !== null)
    .sort((a, b) => (a.row.fixture_date ?? "").localeCompare(b.row.fixture_date ?? "") || a.index - b.index)
    .filter(({ row }, index, sorted) => index === sorted.findIndex((item) => fixtureKey(item.row) === fixtureKey(row)))
    .map(({ row }) => row);
}

function fixturePositions(rows: TrackRecord[]): Map<string, number> {
  return new Map(orderedFixtures(rows).map((row, index) => [fixtureKey(row), index]));
}

export function runningLogLoss(rows: TrackRecord[], modelKey: string): TrackRecordPoint[] {
  const positions = fixturePositions(rows);
  const scored = rows
    .filter((row) => row.model_key === modelKey && validLogLoss(row))
    .sort((a, b) => positions.get(fixtureKey(a))! - positions.get(fixtureKey(b))!);
  let total = 0;
  return scored.map((row, index) => {
    const loss = typeof row.log_loss === "number" && Number.isFinite(row.log_loss) ? row.log_loss : 0;
    total += loss;
    return { row, average: total / (index + 1), position: positions.get(fixtureKey(row)) ?? index };
  });
}

export function trackRecordSeries(rows: TrackRecord[]): TrackRecordSeries[] {
  return trackedModels
    .map(({ key: modelKey }) => ({ modelKey, points: runningLogLoss(rows, modelKey) }))
    .filter((series) => series.points.length >= 2);
}

export function correctPicksSeries(rows: TrackRecord[]): CorrectPicksSeries[] {
  const positions = fixturePositions(rows);
  return trackedModels.map(({ key: modelKey }) => {
    const scored = rows
      .filter((row) => row.model_key === modelKey)
      .filter((row) => row.fixture_date !== null)
      .sort((a, b) => positions.get(fixtureKey(a))! - positions.get(fixtureKey(b))!);
    let correct = 0;
    return {
      modelKey,
      points: scored.map((row) => {
        if (row.correct === true) correct += 1;
        return { row, correct, position: positions.get(fixtureKey(row)) ?? 0 };
      }),
    };
  });
}

export function nearestTrackRecordPoint(points: TrackRecordPoint[], position: number): number {
  if (points.length === 0) return -1;
  return Math.max(0, Math.min(points.length - 1, Math.round(position)));
}
