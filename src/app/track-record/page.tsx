import type { Metadata } from "next";
import Card from "@/components/Card";
import ModelTabs from "@/components/ModelTabs";
import { getTrackRecord } from "@/lib/data";
import { formatDateOnly } from "@/lib/format";
import type { TrackRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track record",
  description: "The live Premier League prediction record for both models.",
};

async function loadTrackRecord(): Promise<TrackRecord[] | { error: string }> {
  try {
    return await getTrackRecord();
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

function modelName(modelKey: string): string {
  return modelKey === "nn" ? "Neural network" : "Lean";
}

function percent(value: number | null): string {
  return typeof value === "number" && Number.isFinite(value)
    ? `${Math.round(value * 100)}%`
    : "unavailable";
}

function probabilityLine(row: TrackRecord): string {
  return `H ${percent(row.p_home)} · D ${percent(row.p_draw)} · A ${percent(row.p_away)}`;
}

function outcomeLabel(outcome: TrackRecord["result"]): string {
  return outcome === "H" ? "Home" : outcome === "D" ? "Draw" : outcome === "A" ? "Away" : "unavailable";
}

function score(row: TrackRecord): string {
  return typeof row.home_goals === "number" && typeof row.away_goals === "number"
    ? `${row.home_goals}-${row.away_goals}`
    : "score unavailable";
}

function logLoss(value: number | null): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "unavailable";
}

function SummaryCard({ rows, label }: { rows: TrackRecord[]; label: string }) {
  const correct = rows.filter((row) => row.correct === true).length;
  const averageLogLossRows = rows.filter(
    (row) => typeof row.log_loss === "number" && Number.isFinite(row.log_loss)
  );
  const averageLogLoss =
    averageLogLossRows.length > 0
      ? averageLogLossRows.reduce((total, row) => total + (row.log_loss as number), 0) /
        averageLogLossRows.length
      : null;

  return (
    <Card variant="white">
      <h2 className="font-heading text-2xl font-semibold">{label}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-muted">Collecting, 0 matches scored</p>
      ) : (
        <dl className="mt-4 grid grid-cols-3 divide-x divide-border">
          <div className="pr-3">
            <dt className="text-sm text-muted">Scored</dt>
            <dd className="mt-1 font-tabular text-xl font-semibold">{rows.length}</dd>
          </div>
          <div className="px-3">
            <dt className="text-sm text-muted">Correct</dt>
            <dd className="mt-1 font-tabular text-xl font-semibold">
              {correct} ({Math.round((correct / rows.length) * 100)}%)
            </dd>
          </div>
          <div className="pl-3">
            <dt className="text-sm text-muted">Avg log loss</dt>
            <dd className="mt-1 font-tabular text-xl font-semibold">{logLoss(averageLogLoss)}</dd>
          </div>
        </dl>
      )}
    </Card>
  );
}

export default async function TrackRecordPage() {
  const result = await loadTrackRecord();

  return (
    <section className="lg:w-[min(80rem,calc(100vw_-_2rem))] lg:ml-[calc((100%_-_min(80rem,calc(100vw_-_2rem)))/2)]">
      <ModelTabs />
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Track record</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">
        How the Lean and Neural network predictions have performed in live matches.
      </p>

      {"error" in result ? (
        <Card className="mt-8">
          <p className="font-semibold">The live track record is unavailable right now</p>
          <p className="mt-1 text-sm text-muted">{result.error}</p>
        </Card>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <SummaryCard rows={result.filter((row) => row.model_key === "lean")} label="Lean" />
            <SummaryCard rows={result.filter((row) => row.model_key === "nn")} label="Neural network" />
          </div>

          <p className="mt-4 text-sm text-muted">
            Random guessing has a log loss of about 1.0986. Lower is better. Log loss rewards confident correct predictions and punishes confident wrong ones.
          </p>

          <Card className="mt-8 p-0" variant="white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[60rem] text-left text-sm">
                <caption className="sr-only">Scored prediction matches, newest first</caption>
                <thead className="border-b border-border bg-tint text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Match</th>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Probabilities</th>
                    <th className="px-4 py-3">Predicted</th>
                    <th className="px-4 py-3">Actual</th>
                    <th className="px-4 py-3">Correct</th>
                    <th className="px-4 py-3">Log loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.map((row, index) => (
                    <tr key={`${row.model_key}-${row.fixture_date}-${row.home}-${row.away}-${index}`}>
                      <td className="whitespace-nowrap px-4 py-3">{row.fixture_date ? formatDateOnly(row.fixture_date) : "unavailable"}</td>
                      <td className="min-w-40 px-4 py-3">{row.home ?? "Home unavailable"} v {row.away ?? "Away unavailable"}</td>
                      <td className="px-4 py-3">{modelName(row.model_key)}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-tabular">{probabilityLine(row)}</td>
                      <td className="px-4 py-3">{outcomeLabel(row.predicted_result)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{outcomeLabel(row.result)} ({score(row)})</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {row.correct === true ? "✓ Yes" : row.correct === false ? "✕ No" : "— unavailable"}
                      </td>
                      <td className="px-4 py-3 font-tabular">{logLoss(row.log_loss)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.length === 0 && <p className="p-6 text-muted">No scored matches have been returned yet.</p>}
          </Card>

        </>
      )}

      <Card className="mt-8">
        <h2 className="font-heading text-2xl font-semibold">A note about this record</h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed text-muted">
          <li>The live record is thin, with only a few dozen matches, so accuracy can swing a lot. This is not evidence that either model is better.</li>
          <li>Lean&apos;s xG data feed has been stale since about late October, so recent Lean predictions use older xG.</li>
          <li>A prediction counts only if it was stored before the end of match day. This is an approximation; some earlier rounds are excluded because their stored predictions may have been overwritten after the matches.</li>
          <li>Lean and the Neural network are statistically tied on the 760-match backtest.</li>
          <li>The Neural network history started Nov 6, so it has no scored matches yet.</li>
        </ul>
      </Card>
    </section>
  );
}
