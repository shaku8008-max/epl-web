import { modelColour, modelLabel, trackedModels } from "@/lib/trackRecord";
import type { TrackRecord } from "@/lib/types";

export default function ModelWinRateChips({ rows }: { rows: TrackRecord[] }) {
  return (
    <div className="epl-sequence">
      <div className="epl-chip-sequence flex flex-wrap gap-2">
        {trackedModels.map((model) => {
          const modelRows = rows.filter((row) => row.model_key === model.key);
          const correct = modelRows.filter((row) => row.correct === true).length;
          const colours = modelColour(model.key);

          return (
            <span
              key={model.key}
              className={`inline-flex items-center rounded-card border border-border px-3 py-2 text-sm ${colours.tint} ${colours.text}`}
            >
              <span className="font-semibold">{modelLabel(model.key)}:</span>{" "}
              {modelRows.length === 0
                ? "Collecting"
                : `${correct} of ${modelRows.length} correct (${Math.round((correct / modelRows.length) * 100)}%)`}
            </span>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-muted">Small samples swing a lot, so treat these percentages as a snapshot.</p>
    </div>
  );
}
