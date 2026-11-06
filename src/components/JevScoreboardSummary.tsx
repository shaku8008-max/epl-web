// The top of the Jev scoreboard: how much data there is, the three-version
// comparison (log loss and accuracy), and the head-to-head counts against the
// plain model. Server component: pure display.

import {
  dataNote,
  isBestMetric,
  metricTone,
  type MetricKey,
  type MetricTone,
  type ScoreSummary,
  type VersionScore,
  type VersionKey,
} from "@/lib/jevScore";

type JevScoreboardSummaryProps = {
  summary: ScoreSummary;
};

const VERSIONS: { key: "plain" | "half" | "full"; label: string }[] = [
  { key: "plain", label: "Model (no shift)" },
  { key: "half", label: "Jev half shift" },
  { key: "full", label: "Jev full shift" },
];

function formatLoss(score: VersionScore): string {
  return score.logLoss === null ? "-" : score.logLoss.toFixed(3);
}

function formatAccuracy(score: VersionScore): string {
  return score.accuracy === null
    ? "-"
    : `${Math.round(score.accuracy * 100)}%`;
}

function headToHead(score: VersionScore): string {
  return `Better than the model in ${score.better}, worse in ${score.worse}, identical in ${score.identical}.`;
}

function toneClasses(tone: MetricTone): string {
  if (tone === "better") return "bg-better-soft text-better";
  if (tone === "worse") return "bg-worse-soft text-worse";
  return "bg-draw-soft text-draw";
}

function metricLabel(summary: ScoreSummary, metric: MetricKey, version: VersionKey): string {
  return isBestMetric(summary, metric, version) ? "Best" : "";
}

export default function JevScoreboardSummary({
  summary,
}: JevScoreboardSummaryProps) {
  return (
    <section className="mt-6">
      <h2 className="font-heading text-2xl font-semibold">How much data</h2>
      <div className="mt-3 rounded-card border border-border bg-tint p-4">
        <p className="font-heading text-3xl font-bold leading-none font-tabular">{summary.count}</p>
        <p className="mt-2 text-base">finished {summary.count === 1 ? "match" : "matches"}</p>
      </div>
      <p className="mt-3 rounded-card border border-open/30 bg-open-soft p-3 text-base text-ink">{dataNote(summary.count)}</p>
      {summary.scored < summary.count && (
        <p className="mt-3 rounded-card border border-open/30 bg-open-soft p-3 text-base text-ink">
          {summary.count - summary.scored} finished{" "}
          {summary.count - summary.scored === 1 ? "match" : "matches"} could
          not be scored because a probability was missing.
        </p>
      )}
      {summary.promptVersions.length > 1 && (
        <p className="mt-3 rounded-card border border-open/30 bg-open-soft p-3 text-base text-ink">
          This comparison mixes results from more than one prompt version (
          {summary.promptVersions.join(", ")}), so it is not a clean
          like-for-like test.
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {VERSIONS.map((v) => {
          const score = summary[v.key];
          const logTone = metricTone(summary, "logLoss", v.key);
          return (
            <div
              key={v.key}
              className={`min-w-0 rounded-card border border-border p-4 ${logTone === "better" ? "bg-better-soft" : "bg-tint"}`}
            >
              <p className="text-base font-semibold">{v.label}</p>
              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-sm text-muted">Log loss (lower is better)</dt>
                  <dd className={`mt-1 font-heading text-3xl font-bold leading-none font-tabular ${toneClasses(logTone)}`}>
                    {formatLoss(score)}
                    {metricLabel(summary, "logLoss", v.key) && <span className="ml-2 align-middle font-body text-xs font-semibold uppercase tracking-wide">Best</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Accuracy</dt>
                  <dd className={`mt-1 font-heading text-3xl font-bold leading-none font-tabular ${toneClasses(metricTone(summary, "accuracy", v.key))}`}>
                    {formatAccuracy(score)}
                    {metricLabel(summary, "accuracy", v.key) && <span className="ml-2 align-middle font-body text-xs font-semibold uppercase tracking-wide">Best</span>}
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>

      <h3 className="mt-6 font-heading text-lg font-semibold">
        Head to head with the model
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {[{ key: "half" as const, label: "Jev half shift" }, { key: "full" as const, label: "Jev full shift" }].map((version) => {
          const score = summary[version.key];
          return (
            <div key={version.key} className="rounded-card border border-border bg-white p-3">
              <p className="font-semibold">{version.label}</p>
              <p className="sr-only">{headToHead(score)}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm font-semibold">
                <span className="inline-flex items-center gap-1 rounded-full bg-better-soft px-2 py-1 text-better"><span aria-hidden="true">▲</span> {score.better}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-worse-soft px-2 py-1 text-worse"><span aria-hidden="true">▼</span> {score.worse}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-draw-soft px-2 py-1 text-draw"><span aria-hidden="true">=</span> {score.identical}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
