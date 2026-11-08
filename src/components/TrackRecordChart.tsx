"use client";

import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { formatDateOnly } from "@/lib/format";
import {
  modelColour,
  modelLabel,
  nearestTrackRecordPoint,
  type TrackRecordPoint,
  type TrackRecordSeries,
} from "@/lib/trackRecord";
import PlaybackSvgLayer from "@/components/PlaybackSvgLayer";
import type { PlaybackTimeline } from "@/components/PlaybackTimeline";

type TrackRecordChartProps = { series: TrackRecordSeries[]; timeline: PlaybackTimeline };
type ActivePoint = { modelKey: string; index: number };

const WIDTH = 600;
const HEIGHT = 280;
const LEFT = 52;
const RIGHT = 18;
const TOP = 20;
const BOTTOM = 36;
const RANDOM_LOG_LOSS = 1.0986;
const lineDashes: Record<string, string | undefined> = {
  lean: undefined,
  nn: undefined,
  goals: undefined,
};

function resultName(result: TrackRecordPoint["row"]["result"]): string {
  return result === "H" ? "Home" : result === "D" ? "Draw" : result === "A" ? "Away" : "Result unavailable";
}

function pointDate(point: TrackRecordPoint): string {
  return point.row.fixture_date ? formatDateOnly(point.row.fixture_date) : "Date unavailable";
}

function nearestDatePoint(points: TrackRecordPoint[], timestamp: number): number {
  let nearest = 0;
  let distance = Infinity;
  points.forEach((point, index) => {
    const difference = Math.abs(new Date(point.row.fixture_date ?? 0).getTime() - timestamp);
    if (difference < distance) {
      nearest = index;
      distance = difference;
    }
  });
  return nearest;
}

export default function TrackRecordChart({ series, timeline }: TrackRecordChartProps) {
  const [active, setActive] = useState<ActivePoint | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const clipId = `log-loss-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (!chartRef.current?.contains(event.target as Node)) setActive(null);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  if (series.length === 0) {
    return <p className="text-base text-muted">Not enough scored matches yet to draw a chart.</p>;
  }

  const allValues = series.flatMap((item) => item.points.map((point) => point.average));
  const dates = series.flatMap((item) => item.points.map((point) => point.row.fixture_date)).filter((date): date is string => date !== null).sort();
  const minTime = new Date(dates[0] ?? 0).getTime();
  const maxTime = new Date(dates[dates.length - 1] ?? 0).getTime();
  const min = Math.min(0, ...allValues);
  const max = Math.max(RANDOM_LOG_LOSS, ...allValues);
  const range = max - min || 1;
  const plotWidth = WIDTH - LEFT - RIGHT;
  const plotHeight = HEIGHT - TOP - BOTTOM;
  const x = (date: string) => LEFT + ((new Date(date).getTime() - minTime) / (maxTime - minTime || 1)) * plotWidth;
  const xAtTime = (timestamp: number) => LEFT + ((timestamp - minTime) / (maxTime - minTime || 1)) * plotWidth;
  const y = (value: number) => TOP + ((max - value) / range) * plotHeight;
  const gridValues = [max, RANDOM_LOG_LOSS, min].filter((value, index, values) => values.indexOf(value) === index);

  function activateAt(position: number) {
    let closest: ActivePoint | null = null;
    let closestDistance = Infinity;
    const timestamp = minTime + ((position - LEFT) / plotWidth) * (maxTime - minTime || 1);
    for (const item of series) {
      const index = nearestDatePoint(item.points, timestamp);
      const distance = Math.abs(x(item.points[index].row.fixture_date ?? "") - position);
      if (distance < closestDistance) {
        closest = { modelKey: item.modelKey, index };
        closestDistance = distance;
      }
    }
    setActive(closest);
  }

  function setFromPointer(event: ReactPointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    activateAt(((event.clientX - rect.left) / rect.width) * WIDTH);
  }

  function moveKey(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const item = active ? series.find((candidate) => candidate.modelKey === active.modelKey) : series[0];
    if (!item) return;
    const index = active?.index ?? 0;
    setActive({ modelKey: item.modelKey, index: nearestTrackRecordPoint(item.points, index + (event.key === "ArrowRight" ? 1 : -1)) });
  }

  const activeSeries = active ? series.find((item) => item.modelKey === active.modelKey) : null;
  const activePoint = activeSeries && active ? activeSeries.points[active.index] : null;
  const guideX = activeSeries && active ? x(activeSeries.points[active.index].row.fixture_date ?? "") : null;
  const activeCorrect = activeSeries && active
    ? activeSeries.points.slice(0, active.index + 1).filter((point) => point.row.correct === true).length
    : 0;

  return (
    <div
      ref={chartRef}
      className="relative min-w-0 focus-visible:outline-2 focus-visible:outline-accent"
      tabIndex={0}
      role="img"
      aria-label="Running average log loss over scored matches"
      onFocus={() => setActive((current) => current ?? { modelKey: series[0].modelKey, index: 0 })}
      onKeyDown={moveKey}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        onPointerMove={setFromPointer}
        onPointerDown={setFromPointer}
        onPointerLeave={() => setActive(null)}
      >
        {gridValues.map((value) => (
          <g key={value}>
            <line
              x1={LEFT}
              x2={WIDTH - RIGHT}
              y1={y(value)}
              y2={y(value)}
              stroke="var(--color-border)"
              strokeWidth={value === RANDOM_LOG_LOSS ? 1.5 : 1}
              strokeDasharray={value === RANDOM_LOG_LOSS ? "5 4" : undefined}
            />
            <text x={LEFT - 8} y={y(value) + 4} textAnchor="end" className="fill-muted text-[11px]">
              {value.toFixed(2)}
            </text>
          </g>
        ))}
         <text x={WIDTH - RIGHT} y={y(RANDOM_LOG_LOSS) - 7} textAnchor="end" className="fill-muted text-[11px]">
           Random guessing
         </text>
        <PlaybackSvgLayer
          timeline={timeline}
          clipId={clipId}
          left={LEFT}
          top={TOP}
          plotWidth={plotWidth}
          plotHeight={plotHeight}
          minTime={minTime}
          maxTime={maxTime}
          xAtTime={xAtTime}
          y={y}
          lines={series.map((item) => ({
            modelKey: item.modelKey,
            colour: modelColour(item.modelKey).line,
            points: item.points.map((point) => ({ timestamp: new Date(point.row.fixture_date ?? 0).getTime(), value: point.average })),
          }))}
        />
        <g clipPath={`url(#${clipId})`}>
          {series.map((item) => {
            const points = item.points.map((point) => `${x(point.row.fixture_date ?? "")},${y(point.average)}`).join(" ");
            return (
              <g key={item.modelKey} className="epl-chart-series" opacity={active && active.modelKey !== item.modelKey ? 0.28 : 1}>
                <polyline className="epl-chart-line epl-chart-line--fade" points={points} fill="none" stroke={modelColour(item.modelKey).line} strokeWidth={2.5} strokeDasharray={lineDashes[item.modelKey]} strokeLinejoin="round" strokeLinecap="round" />
                {item.points.map((point, index) => (
                  <circle
                    key={`${item.modelKey}-${point.row.fixture_date ?? index}`}
                    cx={x(point.row.fixture_date ?? "")}
                    cy={y(point.average)}
                    r={active?.modelKey === item.modelKey && active.index === index ? 5 : 3}
                    fill={modelColour(item.modelKey).line}
                  />
                ))}
              </g>
            );
          })}
        </g>
        {guideX !== null && <line x1={guideX} x2={guideX} y1={TOP} y2={HEIGHT - BOTTOM} stroke="var(--color-muted)" strokeWidth={1} />}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-hidden="true">
        {series.map((item) => (
          <span key={item.modelKey} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-5"
              style={{
                   backgroundColor: lineDashes[item.modelKey]
                   ? "transparent"
                   : modelColour(item.modelKey).line,
                borderTop: lineDashes[item.modelKey]
                   ? `2px dashed ${modelColour(item.modelKey).line}`
                  : undefined,
              }}
            />
            {modelLabel(item.modelKey)}
          </span>
        ))}
      </div>
      {activePoint && activeSeries && active && (
        <div
          className={`pointer-events-none absolute top-2 z-10 w-48 rounded-card border border-border bg-white p-3 shadow-sm ${active.index < activeSeries.points.length * 0.2 ? "left-0" : active.index > activeSeries.points.length * 0.8 ? "right-0" : "-translate-x-1/2"}`}
          style={active.index < activeSeries.points.length * 0.2 || active.index > activeSeries.points.length * 0.8 ? undefined : { left: `${(guideX! / WIDTH) * 100}%` }}
        >
            <p className="font-heading text-xl font-bold leading-none tabular-nums" style={{ color: modelColour(active.modelKey).line }}>
             {activePoint.average.toFixed(3)}
            </p>
           <p className="mt-2 text-xs font-semibold">{modelLabel(active.modelKey)} · {activePoint.row.fixture_date ? pointDate(activePoint) : "Date unavailable"}</p>
           <p className="mt-2 truncate text-xs font-semibold">{activePoint.row.home ?? "Home unavailable"} v {activePoint.row.away ?? "Away unavailable"}</p>
           <p className="text-xs text-muted">{resultName(activePoint.row.result)}</p>
           <p className="text-xs text-muted">{activeCorrect} of {active.index + 1} correct ({Math.round((activeCorrect / (active.index + 1)) * 100)}%)</p>
          <p className="text-xs text-muted">{activePoint.row.correct === true ? "✓ Correct" : activePoint.row.correct === false ? "✕ Incorrect" : "Correctness unavailable"}</p>
          <p className="text-xs text-muted">Match log loss: {activePoint.row.log_loss === null ? "unavailable" : activePoint.row.log_loss.toFixed(3)}</p>
        </div>
      )}
      <p className="mt-3 text-sm text-muted">Lower is better. Early values swing a lot because there are few matches.</p>
    </div>
  );
}
