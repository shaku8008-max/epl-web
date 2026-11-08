"use client";

import { formatDateOnly } from "@/lib/format";
import { useSyncExternalStore } from "react";
import type { PlaybackTimeline } from "@/components/PlaybackTimeline";

type PlaybackControlsProps = {
  timeline: PlaybackTimeline;
};

export default function PlaybackControls({ timeline }: PlaybackControlsProps) {
  useSyncExternalStore(timeline.subscribe, timeline.getSnapshot, timeline.getSnapshot);
  const playing = useSyncExternalStore(timeline.subscribe, timeline.getPlayingSnapshot, timeline.getPlayingSnapshot);
  const position = timeline.getPosition();
  const date = timeline.getDate();
  const total = timeline.dates.length;

  return (
    <div className="mt-4 rounded-button border border-edge bg-tint/60 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-semibold text-muted">Replay correct picks</span>
        <button
          type="button"
          onClick={timeline.playPause}
          className="inline-flex min-h-11 items-center rounded-full border border-edge bg-accent px-4 py-2 text-sm font-bold text-white transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          aria-label={playing ? "Pause playback" : "Play playback"}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={timeline.restart}
          className="inline-flex min-h-11 items-center rounded-full border border-edge bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Restart
        </button>
        <span className="ml-auto text-sm font-semibold text-ink">
          {date ? formatDateOnly(date) : "Latest"}
        </span>
      </div>
      <label className="mt-3 block" htmlFor="track-record-playback">
        <span className="sr-only">Match date</span>
        <input
          id="track-record-playback"
          type="range"
          min={0}
          max={Math.max(total - 1, 0)}
          value={position}
          onChange={(event) => timeline.setPosition(Number(event.target.value))}
          className="h-3 w-full accent-accent"
           aria-valuetext={`Match ${Math.min(position + 1, total)} of ${total}${date ? `, ${formatDateOnly(date)}` : ""}`}
        />
      </label>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>Beginning</span>
        <span>Match {Math.min(position + 1, total)} of {total}</span>
      </div>
    </div>
  );
}
