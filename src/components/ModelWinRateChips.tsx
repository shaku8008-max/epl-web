"use client";

import { fixtureKey, modelColour, modelLabel, orderedFixtures, trackedModels } from "@/lib/trackRecord";
import type { TrackRecord } from "@/lib/types";
import { useSyncExternalStore } from "react";
import type { PlaybackTimeline } from "@/components/PlaybackTimeline";

function countAt(rows: TrackRecord[], fixtureIndexes: Map<string, number>, dateIndex: number, correctOnly: boolean): number {
  return rows.filter((row) => {
    const index = fixtureIndexes.get(fixtureKey(row));
    return index !== undefined && index <= dateIndex && (!correctOnly || row.correct === true);
  }).length;
}

export default function ModelWinRateChips({ rows, timeline, selectedModel, onToggleModel }: { rows: TrackRecord[]; timeline?: PlaybackTimeline; selectedModel: string | null; onToggleModel: (modelKey: string) => void }) {
  const subscribe = timeline?.subscribe ?? (() => () => undefined);
  const snapshot = timeline?.getSnapshot ?? (() => 0);
  useSyncExternalStore(subscribe, snapshot, snapshot);
  const fixtures = orderedFixtures(rows);
  const fixtureIndexes = new Map(fixtures.map((row, index) => [fixtureKey(row), index]));
  const position = timeline?.getPosition() ?? Math.max(fixtures.length - 1, 0);
  const currentIndex = Math.floor(position);
  const fraction = position - currentIndex;
  const nextIndex = Math.min(currentIndex + 1, fixtures.length - 1);
  const isInterpolating = timeline ? timeline.isPlaying() || fraction > 0 : false;
  const displayCount = (value: number) => isInterpolating ? value.toFixed(1) : String(Math.round(value));

  return (
    <div className="epl-sequence">
      <div className="epl-chip-sequence flex max-w-full flex-wrap gap-2 sm:gap-3">
        {trackedModels.map((model) => {
          const modelRows = rows.filter((row) => row.model_key === model.key);
          const scored = countAt(modelRows, fixtureIndexes, currentIndex, false) +
            (countAt(modelRows, fixtureIndexes, nextIndex, false) - countAt(modelRows, fixtureIndexes, currentIndex, false)) * fraction;
          const correct = countAt(modelRows, fixtureIndexes, currentIndex, true) +
            (countAt(modelRows, fixtureIndexes, nextIndex, true) - countAt(modelRows, fixtureIndexes, currentIndex, true)) * fraction;
          const colours = modelColour(model.key);

          return (
            <button
              type="button"
              aria-pressed={selectedModel === model.key}
              onClick={() => onToggleModel(model.key)}
              onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); onToggleModel(""); } }}
              key={model.key}
              className={`inline-flex min-h-14 max-w-full cursor-pointer flex-wrap items-baseline gap-x-1 rounded-button border px-3 py-2.5 text-left text-sm ${colours.tint} ${colours.text} transition-[opacity,border-color,box-shadow] hover:border-primary hover:shadow-sm motion-reduce:transition-none sm:px-4 ${selectedModel && selectedModel !== model.key ? "opacity-60" : "opacity-100"} ${selectedModel === model.key ? "border-2" : "border-edge"} focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-ink`}
            >
              <span className="font-semibold">{modelLabel(model.key)}:</span>
              {modelRows.length === 0 || scored < 0.5
                ? <span>Collecting</span>
                 : <span className="tabular"><strong className="block whitespace-nowrap text-xl font-bold leading-none">{displayCount(correct)} of {displayCount(scored)} correct</strong><span className="mt-1 block whitespace-nowrap text-sm font-semibold text-muted">({isInterpolating ? ((correct / scored) * 100).toFixed(1) : Math.round((correct / scored) * 100)}%)</span></span>}
            </button>
          );
        })}
      </div>
       <p className="mt-2 text-sm text-muted">Select a model to highlight it. Small samples swing a lot, so treat these percentages as a snapshot.</p>
    </div>
  );
}
