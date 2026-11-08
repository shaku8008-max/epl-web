"use client";

import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { formatDateOnly } from "@/lib/format";
import {
  modelColour,
  modelLabel,
  orderedFixtures,
  fixtureKey,
  type CorrectPicksPoint,
  type CorrectPicksSeries,
} from "@/lib/trackRecord";
import type { TrackRecord } from "@/lib/types";
import PlaybackSvgLayer from "@/components/PlaybackSvgLayer";
import type { PlaybackTimeline } from "@/components/PlaybackTimeline";

type CorrectPicksChartProps = {
  rows: TrackRecord[];
  series: CorrectPicksSeries[];
  timeline: PlaybackTimeline;
};
type ActivePoint = { modelKey: string; index: number };
type ReferencePoint = { position: number; correct: number };

const WIDTH = 600;
const HEIGHT = 280;
const LEFT = 52;
const RIGHT = 18;
const TOP = 20;
const BOTTOM = 36;
function pointDate(point: CorrectPicksPoint): string {
  return point.row.fixture_date ? formatDateOnly(point.row.fixture_date) : "Date unavailable";
}

function outcomeLabel(outcome: TrackRecord["predicted_result"]): string {
  return outcome === "H" ? "Predicted: Home" : outcome === "D" ? "Predicted: Draw" : outcome === "A" ? "Predicted: Away" : "Predicted outcome unavailable";
}

function referencePoints(total: number): ReferencePoint[] {
  return Array.from({ length: total }, (_, position) => ({ position, correct: (position + 1) / 3 }));
}

function nearestPoint(points: CorrectPicksPoint[], position: number): number {
  if (points.length === 0) return -1;
  let nearest = 0;
  let distance = Infinity;
  points.forEach((point, index) => {
    const difference = Math.abs(point.position - position);
    if (difference < distance) {
      nearest = index;
      distance = difference;
    }
  });
  return nearest;
}

export default function CorrectPicksChart({ rows, series, timeline }: CorrectPicksChartProps) {
  const drawableSeries = series.filter((item) => item.points.length >= 3);
  const collecting = series.filter((item) => item.points.length < 3);
  const [active, setActive] = useState<ActivePoint | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const clipId = `correct-picks-${useId().replace(/:/g, "")}`;

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

  const fixtures = orderedFixtures(rows);
  const reference = referencePoints(fixtures.length);
  const maxPosition = Math.max(fixtures.length - 1, 0);
  const max = Math.max(1, ...drawableSeries.flatMap((item) => item.points.map((point) => point.correct)), ...reference.map((point) => point.correct));
  const plotWidth = WIDTH - LEFT - RIGHT;
  const plotHeight = HEIGHT - TOP - BOTTOM;
  const x = (position: number) => LEFT + (maxPosition === 0 ? 0 : position / maxPosition) * plotWidth;
  const xAtPosition = (position: number) => x(position);
  const y = (value: number) => TOP + ((max - value) / max) * plotHeight;
  const gridValues = [max, max / 2, 0].filter((value, index, values) => values.indexOf(value) === index);
  const dateTicks = fixtures.filter((fixture, index) => index === 0 || fixture.fixture_date !== fixtures[index - 1]?.fixture_date)
    .filter((_, index, ticks) => index === 0 || index === ticks.length - 1 || index % Math.max(1, Math.ceil(ticks.length / 4)) === 0);

  function activateAt(position: number) {
    const fixturePosition = Math.max(0, Math.min(maxPosition, ((position - LEFT) / plotWidth) * maxPosition));
    let closest: ActivePoint | null = null;
    let closestDistance = Infinity;
    for (const item of drawableSeries) {
      const index = nearestPoint(item.points, fixturePosition);
      const distance = Math.abs(x(item.points[index].position) - position);
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
  const guideX = activePoint ? x(activePoint.position) : null;
  const guideY = activePoint ? y(activePoint.correct) : null;

  return (
    <div
      ref={chartRef}
      className="relative min-w-0 focus-visible:outline-2 focus-visible:outline-ink"
      tabIndex={0}
      role="img"
      aria-label="Cumulative correct picks compared with random guessing"
      onFocus={() => setActive((current) => current ?? { modelKey: drawableSeries[0].modelKey, index: 0 })}
      onKeyDown={moveKey}
    >
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto max-[639px]:max-h-[10rem] w-full" onPointerMove={setFromPointer} onPointerDown={setFromPointer} onPointerLeave={() => setActive(null)}>
        {gridValues.map((value) => (
          <g key={value}>
            <line x1={LEFT} x2={WIDTH - RIGHT} y1={y(value)} y2={y(value)} stroke="var(--color-border)" strokeWidth={1} />
            <text x={LEFT - 8} y={y(value) + 4} textAnchor="end" className="fill-muted text-[11px]">{value.toFixed(value % 1 === 0 ? 0 : 1)}</text>
          </g>
        ))}
        <PlaybackSvgLayer
          timeline={timeline}
          clipId={clipId}
          left={LEFT}
          top={TOP}
          plotWidth={plotWidth}
          plotHeight={plotHeight}
           maxPosition={maxPosition}
           xAtPosition={xAtPosition}
          y={y}
          lines={drawableSeries.map((item) => ({
             modelKey: item.modelKey,
             colour: modelColour(item.modelKey).line,
             firstPosition: item.points[0]?.position,
             points: [{ position: -1, value: 0 }, ...item.points.map((point) => ({ position: point.position, value: point.correct }))],
          }))}
        />
        <g clipPath={`url(#${clipId})`}>
          {reference.length > 0 && (
           <polyline points={reference.map((point) => `${x(point.position)},${y(point.correct)}`).join(" ")} fill="none" stroke="var(--color-muted)" strokeWidth={1.5} strokeDasharray="5 4" />
          )}
          {drawableSeries.map((item) => (
            <g key={item.modelKey} className="epl-chart-series" opacity={active && active.modelKey !== item.modelKey ? 0.28 : 1}>
               <polyline pathLength={1} className="epl-chart-line epl-chart-line--draw" points={[[LEFT, y(0)], ...item.points.map((point) => [x(point.position), y(point.correct)])].map(([pointX, pointY]) => `${pointX},${pointY}`).join(" ")} fill="none" stroke={modelColour(item.modelKey).line} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
              {item.points.map((point, index) => (
                 <circle className="epl-chart-point" key={`${item.modelKey}-${fixtureKey(point.row)}`} cx={x(point.position)} cy={y(point.correct)} r={active?.modelKey === item.modelKey && active.index === index ? 5 : 3} fill={modelColour(item.modelKey).line} />
              ))}
            </g>
          ))}
        </g>
        {guideX !== null && <line x1={guideX} x2={guideX} y1={TOP} y2={HEIGHT - BOTTOM} stroke="var(--color-muted)" strokeWidth={1} />}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-hidden="true">
        {drawableSeries.map((item) => (
          <span key={item.modelKey} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5" style={{ backgroundColor: modelColour(item.modelKey).line }} />
            {modelLabel(item.modelKey)}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5"><span className="inline-block w-5 border-t-2 border-dashed border-muted" />Random guessing</span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-10 h-4 text-[11px] text-muted" aria-hidden="true">
        {dateTicks.map((fixture) => { const position = fixtures.indexOf(fixture); return <span key={`${fixture.fixture_date}-${fixture.home}-${fixture.away}`} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${(x(position) / WIDTH) * 100}%` }}>{formatDateOnly(fixture.fixture_date as string)}</span>; })}
      </div>
      {activePoint && activeSeries && active && (
         <div className={`pointer-events-none absolute z-10 rounded-button border border-edge bg-white p-3 shadow-sm ${guideX! / WIDTH > 0.65 ? "-translate-x-[calc(100%+0.75rem)]" : "translate-x-3"}`} style={{ left: `${(guideX! / WIDTH) * 100}%`, top: `${(guideY! / HEIGHT) * 100}%`, width: "min(380px, calc(100% - 1rem))", transform: `${guideX! / WIDTH > 0.65 ? "translateX(calc(-100% - 0.75rem))" : "translateX(0.75rem)"} translateY(-50%)` }}>
           <p className="font-heading text-xl font-bold leading-none tabular-nums" style={{ color: modelColour(active.modelKey).line }}>Correct so far: {activePoint.correct} of {activePoint.position + 1} ({Math.round((activePoint.correct / (activePoint.position + 1)) * 100)}%)</p>
           <p className="mt-2 text-xs font-semibold">{modelLabel(active.modelKey)}</p>
           <p className="mt-2 truncate text-xs font-semibold">{activePoint.row.home ?? "Home unavailable"} v {activePoint.row.away ?? "Away unavailable"}</p>
           <p className="text-xs text-muted">{pointDate(activePoint)}</p>
           <p className="text-xs text-muted">{outcomeLabel(activePoint.row.predicted_result)}</p>
           <p className="text-xs text-muted">{activePoint.row.correct === true ? "✓ Correct" : activePoint.row.correct === false ? "✕ Incorrect" : "Correctness unavailable"}</p>
        </div>
      )}
      {collecting.length > 0 && (
        <p className="mt-3 text-sm text-muted">{collecting.map((item) => `${modelLabel(item.modelKey)}: collecting, not enough scored matches yet to draw this`).join(" · ")}</p>
      )}
    </div>
  );
}
