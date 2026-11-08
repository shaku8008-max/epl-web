import { modelColour, modelLabel, trackedModels } from "@/lib/trackRecord";
import type { TrackRecord } from "@/lib/types";

export default function ModelWinRateChips({ rows }: { rows: TrackRecord[] }) {
  return (
    <div className="epl-sequence">
      <div className="epl-chip-sequence flex max-w-full flex-wrap gap-2 sm:gap-3">
        {trackedModels.map((model) => {
          const modelRows = rows.filter((row) => row.model_key === model.key);
          const correct = modelRows.filter((row) => row.correct === true).length;
          const colours = modelColour(model.key);

          return (
            <span
              key={model.key}
              className={`inline-flex min-h-14 max-w-full flex-wrap items-baseline gap-x-1 rounded-card border border-border px-3 py-2.5 text-sm ${colours.tint} ${colours.text} sm:px-4`}
            >
              <span className="font-semibold">{modelLabel(model.key)}:</span>
              {modelRows.length === 0
                ? <span>Collecting</span>
                : <span><strong className="font-tabular text-xl font-bold leading-none">{correct} of {modelRows.length}</strong> correct <span className="font-tabular text-lg font-semibold">({Math.round((correct / modelRows.length) * 100)}%)</span></span>}
            </span>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-muted">Small samples swing a lot, so treat these percentages as a snapshot.</p>
    </div>
  );
}
