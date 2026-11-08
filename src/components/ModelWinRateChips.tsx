"use client";

import { modelColour, modelLabel, trackedModels } from "@/lib/trackRecord";
import type { TrackRecord } from "@/lib/types";
import { useSyncExternalStore } from "react";
import type { PlaybackTimeline } from "@/components/PlaybackTimeline";

function countAt(rows: TrackRecord[], dates: string[], dateIndex: number, correctOnly: boolean): number {
  return rows.filter((row) => {
    const index = dates.indexOf(row.fixture_date ?? "");
    return index >= 0 && index <= dateIndex && (!correctOnly || row.correct === true);
  }).length;
}

export default function ModelWinRateChips({ rows, timeline }: { rows: TrackRecord[]; timeline: PlaybackTimeline }) {
  useSyncExternalStore(timeline.subscribe, timeline.getSnapshot, timeline.getSnapshot);
  const position = timeline.getPosition();
  const currentIndex = Math.floor(position);
  const fraction = position - currentIndex;
  const nextIndex = Math.min(currentIndex + 1, timeline.dates.length - 1);
  const isInterpolating = timeline.isPlaying() || fraction > 0;
  const displayCount = (value: number) => isInterpolating ? value.toFixed(1) : String(Math.round(value));

  return (
    <div className="epl-sequence">
      <div className="epl-chip-sequence flex max-w-full flex-wrap gap-2 sm:gap-3">
        {trackedModels.map((model) => {
          const modelRows = rows.filter((row) => row.model_key === model.key);
          const scored = countAt(modelRows, timeline.dates, currentIndex, false) +
            (countAt(modelRows, timeline.dates, nextIndex, false) - countAt(modelRows, timeline.dates, currentIndex, false)) * fraction;
          const correct = countAt(modelRows, timeline.dates, currentIndex, true) +
            (countAt(modelRows, timeline.dates, nextIndex, true) - countAt(modelRows, timeline.dates, currentIndex, true)) * fraction;
          const colours = modelColour(model.key);

          return (
            <span
              key={model.key}
              className={`inline-flex min-h-14 max-w-full flex-wrap items-baseline gap-x-1 rounded-card border border-border px-3 py-2.5 text-sm ${colours.tint} ${colours.text} sm:px-4`}
            >
              <span className="font-semibold">{modelLabel(model.key)}:</span>
              {modelRows.length === 0 || scored < 0.5
                ? <span>Collecting</span>
                : <span><strong className="font-tabular text-xl font-bold leading-none">{displayCount(correct)} of {displayCount(scored)}</strong> correct <span className="font-tabular text-lg font-semibold">({isInterpolating ? ((correct / scored) * 100).toFixed(1) : Math.round((correct / scored) * 100)}%)</span></span>}
            </span>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-muted">Small samples swing a lot, so treat these percentages as a snapshot.</p>
    </div>
  );
}
