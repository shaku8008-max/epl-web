import type { TrackRecord } from "@/lib/types";

export type TrackRecordPoint = {
  row: TrackRecord;
  average: number;
};

export type TrackRecordSeries = {
  modelKey: string;
  points: TrackRecordPoint[];
};

function validLogLoss(row: TrackRecord): row is TrackRecord & { log_loss: number } {
  return typeof row.log_loss === "number" && Number.isFinite(row.log_loss);
}

export function runningLogLoss(rows: TrackRecord[], modelKey: string): TrackRecordPoint[] {
  const scored = rows
    .filter((row) => row.model_key === modelKey && validLogLoss(row))
    .sort((a, b) => (a.fixture_date ?? "").localeCompare(b.fixture_date ?? ""));
  let total = 0;
  return scored.map((row, index) => {
    const loss = typeof row.log_loss === "number" && Number.isFinite(row.log_loss) ? row.log_loss : 0;
    total += loss;
    return { row, average: total / (index + 1) };
  });
}

export function trackRecordSeries(rows: TrackRecord[]): TrackRecordSeries[] {
  return ["lean", "nn"]
    .map((modelKey) => ({ modelKey, points: runningLogLoss(rows, modelKey) }))
    .filter((series) => series.points.length >= 2);
}

export function nearestTrackRecordPoint(points: TrackRecordPoint[], position: number): number {
  if (points.length === 0) return -1;
  return Math.max(0, Math.min(points.length - 1, Math.round(position)));
}
