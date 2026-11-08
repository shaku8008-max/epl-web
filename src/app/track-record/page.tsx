import type { Metadata } from "next";
import Card from "@/components/Card";
import ModelTabs from "@/components/ModelTabs";
import TrackRecordPlayback from "@/components/TrackRecordPlayback";
import TrackRecordTable from "@/components/TrackRecordTable";
import LinkButton from "@/components/LinkButton";
import { getTrackRecord } from "@/lib/data";
import { modelColour, trackedModels } from "@/lib/trackRecord";
import type { TrackRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track record",
  description: "The live Premier League prediction record for all three models.",
};

async function loadTrackRecord(): Promise<TrackRecord[] | { error: string }> {
  try {
    return await getTrackRecord();
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

function logLoss(value: number | null): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "unavailable";
}

function SummaryCard({ rows, label, modelKey }: { rows: TrackRecord[]; label: string; modelKey: string }) {
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
      <Card variant="white" className={modelColour(modelKey).tint}>
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
        How the Lean, Neural network and Linear goals predictions have performed in live matches.
      </p>

      {"error" in result ? (
        <Card className="mt-8">
          <p className="font-semibold">The live track record is unavailable right now</p>
          <p className="mt-1 text-sm text-muted">{result.error}</p>
        </Card>
      ) : (
        <>
            <div className="epl-sequence mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trackedModels.map((model) => (
              <SummaryCard
                key={model.key}
                rows={result.filter((row) => row.model_key === model.key)}
                label={model.label}
                modelKey={model.key}
              />
            ))}
            </div>

             <LinkButton href="/lean" variant="cta" className="mt-5">Try a matchup</LinkButton>

           <p className="mt-4 text-sm text-muted">
             Random guessing has a log loss of about 1.0986. Lower is better. Log loss rewards confident correct predictions and punishes confident wrong ones.
           </p>

            <TrackRecordPlayback rows={result} />

            <TrackRecordTable rows={result} />

         </>
      )}

       <Card className="epl-rise mt-8">
        <h2 className="font-heading text-2xl font-semibold">A note about this record</h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed text-muted">
          <li>The live record is thin, with only a few dozen matches, so accuracy can swing a lot. This is not evidence that either model is better.</li>
          <li>Lean&apos;s xG data feed has been stale since about late October, so recent Lean predictions use older xG.</li>
          <li>A prediction counts only if it was stored before the end of match day. This is an approximation; some earlier rounds are excluded because their stored predictions may have been overwritten after the matches.</li>
          <li>Lean and the Neural network are statistically tied on the 760-match backtest.</li>
          <li>The Neural network history started Nov 6, so it has no scored matches yet.</li>
          <li>The Linear goals history started Nov 8, so it has few or no scored matches yet.</li>
          <li>The three models started on different dates, so they have not all been scored on the same matches. Compare their averages with care.</li>
        </ul>
      </Card>
    </section>
  );
}
