"use client";

import { useEffect, useMemo } from "react";
import Card from "@/components/Card";
import CorrectPicksChart from "@/components/CorrectPicksChart";
import ModelWinRateChips from "@/components/ModelWinRateChips";
import PlaybackControls from "@/components/PlaybackControls";
import { createPlaybackTimeline } from "@/components/PlaybackTimeline";
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
  const timeline = useMemo(() => createPlaybackTimeline(dates), [dates]);
  const correctSeries = useMemo(() => correctPicksSeries(rows), [rows]);
  const lossSeries = useMemo(() => trackRecordSeries(rows), [rows]);
  const hasPlayback = rows.filter((row) => row.fixture_date !== null).length >= 3;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    timeline.setReducedMotion(media.matches);
    const update = () => timeline.setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [timeline]);

  return (
    <>
      <Card className="epl-rise mt-8" variant="white">
        <h2 className="font-heading text-2xl font-semibold">Correct picks over time</h2>
        <div className="mt-4"><ModelWinRateChips rows={rows} timeline={timeline} /></div>
        {hasPlayback && (
          <PlaybackControls timeline={timeline} />
        )}
        <div className="mt-4"><CorrectPicksChart rows={rows} series={correctSeries} timeline={timeline} /></div>
        <p className="mt-3 text-sm text-muted">Each model line counts only its own scored matches; higher means more correct picks, and the dashed line is the one-in-three guessing benchmark.</p>
      </Card>

      <Card className="mt-8" variant="white">
        <h2 className="font-heading text-2xl font-semibold">Log loss over time</h2>
        <div className="mt-4"><ModelWinRateChips rows={rows} timeline={timeline} /></div>
        <div className="mt-4"><TrackRecordChart series={lossSeries} timeline={timeline} /></div>
      </Card>
    </>
  );
}
