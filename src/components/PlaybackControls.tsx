"use client";

import { formatDateOnly } from "@/lib/format";

type PlaybackControlsProps = {
  position: number;
  total: number;
  date: string | null;
  playing: boolean;
  onPlayPause: () => void;
  onPositionChange: (position: number) => void;
  onRestart: () => void;
};

export default function PlaybackControls({
  position,
  total,
  date,
  playing,
  onPlayPause,
  onPositionChange,
  onRestart,
}: PlaybackControlsProps) {
  return (
    <div className="mt-4 rounded-card border border-border bg-tint/60 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-semibold text-muted">Replay both charts</span>
        <button
          type="button"
          onClick={onPlayPause}
          className="inline-flex min-h-11 items-center rounded-card bg-accent px-4 py-2 text-sm font-bold text-white transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label={playing ? "Pause playback" : "Play playback"}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex min-h-11 items-center rounded-card border border-border bg-white px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
          onChange={(event) => onPositionChange(Number(event.target.value))}
          className="h-3 w-full accent-accent"
          aria-valuetext={date ? formatDateOnly(date) : "Latest"}
        />
      </label>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>Beginning</span>
        <span>{position + 1} of {total} dates</span>
      </div>
    </div>
  );
}
