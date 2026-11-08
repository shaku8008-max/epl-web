"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import CorrectPicksChart from "@/components/CorrectPicksChart";
import ModelWinRateChips from "@/components/ModelWinRateChips";
import PlaybackControls from "@/components/PlaybackControls";
import TrackRecordChart from "@/components/TrackRecordChart";
import { correctPicksSeries, trackRecordSeries } from "@/lib/trackRecord";
import type { TrackRecord } from "@/lib/types";

function orderedDates(rows: TrackRecord[]): string[] {
  return [...new Set(rows
    .filter((row) => row.fixture_date !== null)
    .map((row) => row.fixture_date as string))].sort();
}

export default function TrackRecordPlayback({ rows }: { rows: TrackRecord[] }) {
  const dates = useMemo(() => orderedDates(rows), [rows]);
  const latest = Math.max(dates.length - 1, 0);
  const [position, setPosition] = useState(latest);
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const hasPlayback = rows.filter((row) => row.fixture_date !== null).length >= 3;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!playing || reducedMotion || !hasPlayback) return;
    const interval = window.setInterval(() => {
      setPosition((current) => {
        if (current >= latest) {
          setPlaying(false);
          return latest;
        }
        return current + 1;
      });
    }, Math.max(120, Math.round(8000 / Math.max(dates.length - 1, 1))));
    return () => window.clearInterval(interval);
  }, [dates.length, hasPlayback, latest, playing, reducedMotion]);

  const playbackDate = position >= latest ? null : dates[position] ?? null;
  const visibleRows = playbackDate ? rows.filter((row) => (row.fixture_date ?? "") <= playbackDate) : rows;
  const onPositionChange = (next: number) => {
    setPlaying(false);
    setPosition(Math.max(0, Math.min(latest, next)));
  };
  const onPlayPause = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (position >= latest) setPosition(0);
    setPlaying(true);
  };
  const onRestart = () => {
    setPlaying(false);
    setPosition(latest);
  };

  return (
    <>
      <Card className="epl-rise mt-8" variant="white">
        <h2 className="font-heading text-2xl font-semibold">Correct picks over time</h2>
        <div className="mt-4"><ModelWinRateChips rows={visibleRows} /></div>
        {hasPlayback && (
          <PlaybackControls position={position} total={dates.length} date={dates[position] ?? null} playing={playing} onPlayPause={onPlayPause} onPositionChange={onPositionChange} onRestart={onRestart} />
        )}
        <div className="mt-4"><CorrectPicksChart rows={visibleRows} series={correctPicksSeries(visibleRows)} /></div>
        <p className="mt-3 text-sm text-muted">Each model line counts only its own scored matches; higher means more correct picks, and the dashed line is the one-in-three guessing benchmark.</p>
      </Card>

      <Card className="mt-8" variant="white">
        <h2 className="font-heading text-2xl font-semibold">Log loss over time</h2>
        <div className="mt-4"><ModelWinRateChips rows={visibleRows} /></div>
        <div className="mt-4"><TrackRecordChart series={trackRecordSeries(visibleRows)} /></div>
      </Card>
    </>
  );
}
