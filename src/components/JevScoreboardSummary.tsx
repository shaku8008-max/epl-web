// The top of the Jev scoreboard: how much data there is, the three-version
// comparison (log loss and accuracy), and the head-to-head counts against the
// plain model. Server component: pure display.

import Card from "@/components/Card";
import { dataNote, type ScoreSummary, type VersionScore } from "@/lib/jevScore";

type JevScoreboardSummaryProps = {
  summary: ScoreSummary;
};

const VERSIONS: { key: "plain" | "half" | "full"; label: string }[] = [
  { key: "plain", label: "Model (no shift)" },
  { key: "half", label: "Jev half shift" },
  { key: "full", label: "Jev full shift" },
];

function formatLoss(score: VersionScore): string {
  return score.logLoss === null ? "–" : score.logLoss.toFixed(3);
}

function formatAccuracy(score: VersionScore): string {
  return score.accuracy === null
    ? "–"
    : `${Math.round(score.accuracy * 100)}%`;
}

function headToHead(score: VersionScore): string {
  return `Better than the model in ${score.better}, worse in ${score.worse}, identical in ${score.identical}.`;
}

export default function JevScoreboardSummary({
  summary,
}: JevScoreboardSummaryProps) {
  return (
    <Card variant="white" className="mt-6">
      <h2 className="font-heading text-xl font-semibold">How much data</h2>
      <p className="mt-2">
        <span className="font-semibold tabular-nums">{summary.count}</span>{" "}
        finished {summary.count === 1 ? "match" : "matches"}
      </p>
      <p className="mt-1 text-sm text-muted">{dataNote(summary.count)}</p>
      {summary.scored < summary.count && (
        <p className="mt-1 text-sm text-muted">
          {summary.count - summary.scored} finished{" "}
          {summary.count - summary.scored === 1 ? "match" : "matches"} could
          not be scored because a probability was missing.
        </p>
      )}
      {summary.promptVersions.length > 1 && (
        <p className="mt-2 rounded-card border border-border bg-tint p-3 text-sm">
          This comparison mixes results from more than one prompt version (
          {summary.promptVersions.join(", ")}), so it is not a clean
          like-for-like test.
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {VERSIONS.map((v) => {
          const score = summary[v.key];
          return (
            <div
              key={v.key}
              className="rounded-card border border-border bg-surface p-3"
            >
              <p className="text-sm font-semibold">{v.label}</p>
              <dl className="mt-2 space-y-1 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-muted">Log loss (lower is better)</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatLoss(score)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-muted">Accuracy</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatAccuracy(score)}
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>

      <h3 className="mt-6 font-heading text-base font-semibold">
        Head to head with the model
      </h3>
      <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
        <p>
          <span className="font-semibold">Jev half shift:</span>{" "}
          {headToHead(summary.half)}
        </p>
        <p>
          <span className="font-semibold">Jev full shift:</span>{" "}
          {headToHead(summary.full)}
        </p>
      </div>
    </Card>
  );
}
