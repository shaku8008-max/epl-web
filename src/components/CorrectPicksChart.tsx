"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { formatDateOnly } from "@/lib/format";
import {
  modelLabel,
  type CorrectPicksPoint,
  type CorrectPicksSeries,
} from "@/lib/trackRecord";
import type { TrackRecord } from "@/lib/types";

type CorrectPicksChartProps = {
  rows: TrackRecord[];
  series: CorrectPicksSeries[];
};
type ActivePoint = { modelKey: string; index: number };
type ReferencePoint = { date: string; correct: number };

const WIDTH = 600;
const HEIGHT = 280;
const LEFT = 52;
const RIGHT = 18;
const TOP = 20;
const BOTTOM = 36;
const lineColours: Record<string, string> = {
  lean: "var(--color-accent)",
  nn: "var(--color-better)",
  goals: "var(--color-worse)",
};

function pointDate(point: CorrectPicksPoint): string {
  return point.row.fixture_date ? formatDateOnly(point.row.fixture_date) : "Date unavailable";
}

function referencePoints(rows: CorrectPicksChartProps["rows"]): ReferencePoint[] {
  const scored = rows
    .filter((row) => row.model_key === "lean" || row.model_key === "nn" || row.model_key === "goals")
    .filter((row) => row.fixture_date !== null)
    .sort((a, b) => (a.fixture_date ?? "").localeCompare(b.fixture_date ?? ""));
  let count = 0;
  return scored.reduce<ReferencePoint[]>((points, row) => {
    count += 1;
    const date = row.fixture_date as string;
    const last = points[points.length - 1];
    if (last?.date === date) last.correct = count / 3;
    else points.push({ date, correct: count / 3 });
    return points;
  }, []);
}

function nearestPoint(points: CorrectPicksPoint[], datePosition: number): number {
  if (points.length === 0) return -1;
  let nearest = 0;
  let distance = Infinity;
  points.forEach((point, index) => {
    const value = new Date(point.row.fixture_date ?? 0).getTime();
    const difference = Math.abs(value - datePosition);
    if (difference < distance) {
      nearest = index;
      distance = difference;
    }
  });
  return nearest;
}

export default function CorrectPicksChart({ rows, series }: CorrectPicksChartProps) {
  const drawableSeries = series.filter((item) => item.points.length >= 3);
  const collecting = series.filter((item) => item.points.length < 3);
  const [active, setActive] = useState<ActivePoint | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (!chartRef.current?.contains(event.target as Node)) setActive(null);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  if (drawableSeries.length === 0) {
    return <p className="text-base text-muted">Collecting, not enough scored matches yet to draw this</p>;
  }

  const reference = referencePoints(rows);
  const dates = [...drawableSeries.flatMap((item) => item.points.map((point) => point.row.fixture_date)), ...reference.map((point) => point.date)]
    .filter((date): date is string => date !== null)
    .sort();
  const minDate = new Date(dates[0] ?? 0).getTime();
  const maxDate = new Date(dates[dates.length - 1] ?? 0).getTime();
  const dateRange = maxDate - minDate || 1;
  const max = Math.max(1, ...drawableSeries.flatMap((item) => item.points.map((point) => point.correct)), ...reference.map((point) => point.correct));
  const plotWidth = WIDTH - LEFT - RIGHT;
  const plotHeight = HEIGHT - TOP - BOTTOM;
  const x = (date: string) => LEFT + ((new Date(date).getTime() - minDate) / dateRange) * plotWidth;
  const y = (value: number) => TOP + ((max - value) / max) * plotHeight;
  const gridValues = [max, max / 2, 0].filter((value, index, values) => values.indexOf(value) === index);

  function activateAt(position: number) {
    const datePosition = minDate + ((position - LEFT) / plotWidth) * dateRange;
    let closest: ActivePoint | null = null;
    let closestDistance = Infinity;
    for (const item of drawableSeries) {
      const index = nearestPoint(item.points, datePosition);
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
    const item = active ? drawableSeries.find((candidate) => candidate.modelKey === active.modelKey) : drawableSeries[0];
    if (!item) return;
    const index = Math.max(0, Math.min(item.points.length - 1, (active?.index ?? 0) + (event.key === "ArrowRight" ? 1 : -1)));
    setActive({ modelKey: item.modelKey, index });
  }

  const activeSeries = active ? drawableSeries.find((item) => item.modelKey === active.modelKey) : null;
  const activePoint = activeSeries && active ? activeSeries.points[active.index] : null;
  const guideX = activePoint ? x(activePoint.row.fixture_date ?? "") : null;

  return (
    <div
      ref={chartRef}
      className="relative min-w-0 focus-visible:outline-2 focus-visible:outline-accent"
      tabIndex={0}
      role="img"
      aria-label="Cumulative correct picks compared with random guessing"
      onKeyDown={moveKey}
    >
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" onPointerMove={setFromPointer} onPointerDown={setFromPointer} onPointerLeave={() => setActive(null)}>
        {gridValues.map((value) => (
          <g key={value}>
            <line x1={LEFT} x2={WIDTH - RIGHT} y1={y(value)} y2={y(value)} stroke="var(--color-border)" strokeWidth={1} />
            <text x={LEFT - 8} y={y(value) + 4} textAnchor="end" className="fill-muted text-[11px]">{value.toFixed(value % 1 === 0 ? 0 : 1)}</text>
          </g>
        ))}
        {reference.length > 0 && (
          <>
            <polyline points={reference.map((point) => `${x(point.date)},${y(point.correct)}`).join(" ")} fill="none" stroke="var(--color-muted)" strokeWidth={1.5} strokeDasharray="5 4" />
            <text x={WIDTH - RIGHT} y={y(reference[reference.length - 1].correct) - 7} textAnchor="end" className="fill-muted text-[11px]">Random guessing</text>
          </>
        )}
        {drawableSeries.map((item) => (
          <g key={item.modelKey}>
            <polyline points={item.points.map((point) => `${x(point.row.fixture_date ?? "")},${y(point.correct)}`).join(" ")} fill="none" stroke={lineColours[item.modelKey] ?? "var(--color-muted)"} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {item.points.map((point, index) => (
              <circle key={`${item.modelKey}-${point.row.fixture_date ?? index}`} cx={x(point.row.fixture_date ?? "")} cy={y(point.correct)} r={active?.modelKey === item.modelKey && active.index === index ? 5 : 3} fill={lineColours[item.modelKey] ?? "var(--color-muted)"} />
            ))}
          </g>
        ))}
        {guideX !== null && <line x1={guideX} x2={guideX} y1={TOP} y2={HEIGHT - BOTTOM} stroke="var(--color-muted)" strokeWidth={1} />}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-hidden="true">
        {drawableSeries.map((item) => (
          <span key={item.modelKey} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5" style={{ backgroundColor: lineColours[item.modelKey] ?? "var(--color-muted)" }} />
            {modelLabel(item.modelKey)}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5"><span className="inline-block w-5 border-t-2 border-dashed border-muted" />Random guessing</span>
      </div>
      {activePoint && activeSeries && active && (
        <div className={`pointer-events-none absolute top-2 z-10 w-48 rounded-card border border-border bg-white p-3 shadow-sm ${active.index < activeSeries.points.length * 0.2 ? "left-0" : active.index > activeSeries.points.length * 0.8 ? "right-0" : "-translate-x-1/2"}`} style={active.index < activeSeries.points.length * 0.2 || active.index > activeSeries.points.length * 0.8 ? undefined : { left: `${(guideX! / WIDTH) * 100}%` }}>
          <p className="font-heading text-2xl font-bold leading-none tabular-nums" style={{ color: lineColours[active.modelKey] ?? "var(--color-muted)" }}>{activePoint.correct} correct</p>
          <p className="mt-2 truncate text-xs font-semibold">{activePoint.row.home ?? "Home unavailable"} v {activePoint.row.away ?? "Away unavailable"}</p>
          <p className="text-xs text-muted">{pointDate(activePoint)} · {modelLabel(active.modelKey)}</p>
        </div>
      )}
      {collecting.length > 0 && (
        <p className="mt-3 text-sm text-muted">{collecting.map((item) => `${modelLabel(item.modelKey)}: collecting, not enough scored matches yet to draw this`).join(" · ")}</p>
      )}
    </div>
  );
}
