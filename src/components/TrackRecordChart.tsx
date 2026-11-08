"use client";

import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { formatDateOnly } from "@/lib/format";
import {
  modelColour,
  modelLabel,
  nearestTrackRecordPoint,
  orderedFixtures,
  fixtureKey,
  type TrackRecordPoint,
  type TrackRecordSeries,
} from "@/lib/trackRecord";

type TrackRecordChartProps = { series: TrackRecordSeries[] };
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

function nearestPoint(points: TrackRecordPoint[], position: number): number {
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

export default function TrackRecordChart({ series }: TrackRecordChartProps) {
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
  const fixtures = orderedFixtures(series.flatMap((item) => item.points.map((point) => point.row)));
  const maxPosition = Math.max(fixtures.length - 1, 0);
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(RANDOM_LOG_LOSS, ...allValues);
  const padding = Math.max(0.05, (dataMax - dataMin) * 0.1);
  const yMin = Math.max(0.01, Math.floor((dataMin - padding) * 10) / 10);
  const yMax = Math.ceil((dataMax + padding) * 10) / 10;
  const plotWidth = WIDTH - LEFT - RIGHT;
  const plotHeight = HEIGHT - TOP - BOTTOM;
  const x = (position: number) => LEFT + (maxPosition === 0 ? 0 : position / maxPosition) * plotWidth;
  const y = (value: number) => TOP + ((yMax - value) / (yMax - yMin)) * plotHeight;
  const gridValues = [yMin, (yMin + yMax) / 2, yMax].map((value) => Math.round(value * 100) / 100)
    .filter((value, index, values) => values.indexOf(value) === index).sort((a, b) => a - b);
  const dateTicks = fixtures.filter((fixture, index) => index === 0 || fixture.fixture_date !== fixtures[index - 1]?.fixture_date)
    .filter((_, index, ticks) => index === 0 || index === ticks.length - 1 || index % Math.max(1, Math.ceil(ticks.length / 4)) === 0);

  function activateAt(position: number) {
    let closest: ActivePoint | null = null;
    let closestDistance = Infinity;
    const fixturePosition = Math.max(0, Math.min(maxPosition, ((position - LEFT) / plotWidth) * maxPosition));
    for (const item of series) {
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
    const item = active ? series.find((candidate) => candidate.modelKey === active.modelKey) : series[0];
    if (!item) return;
    const index = active?.index ?? 0;
    setActive({ modelKey: item.modelKey, index: nearestTrackRecordPoint(item.points, index + (event.key === "ArrowRight" ? 1 : -1)) });
  }

  const activeSeries = active ? series.find((item) => item.modelKey === active.modelKey) : null;
  const activePoint = activeSeries && active ? activeSeries.points[active.index] : null;
  const guideX = activePoint ? x(activePoint.position) : null;
  const guideY = activePoint ? y(activePoint.average) : null;
  const activeCorrect = activeSeries && active ? activeSeries.points.slice(0, active.index + 1).filter((point) => point.row.correct === true).length : 0;

  return (
    <div
      ref={chartRef}
      className="relative min-w-0 focus-visible:outline-2 focus-visible:outline-ink"
      tabIndex={0}
      role="img"
      aria-label="Running average log loss over scored matches"
      onFocus={() => setActive((current) => current ?? { modelKey: series[0].modelKey, index: 0 })}
      onKeyDown={moveKey}
    >
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto max-[639px]:max-h-[10rem] w-full" onPointerMove={setFromPointer} onPointerDown={setFromPointer} onPointerLeave={() => setActive(null)}>
        <defs><clipPath id={clipId}><rect x={LEFT} y={TOP} width={plotWidth} height={plotHeight} /></clipPath></defs>
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
        <line x1={LEFT} x2={WIDTH - RIGHT} y1={y(RANDOM_LOG_LOSS)} y2={y(RANDOM_LOG_LOSS)} stroke="var(--color-border)" strokeWidth={1.5} strokeDasharray="5 4" />
        <g clipPath={`url(#${clipId})`}>
          {series.map((item) => {
             const points = item.points.map((point) => `${x(point.position)},${y(point.average)}`).join(" ");
            return (
              <g key={item.modelKey} className="epl-chart-series" opacity={active && active.modelKey !== item.modelKey ? 0.28 : 1}>
                <polyline className="epl-chart-line epl-chart-line--fade" points={points} fill="none" stroke={modelColour(item.modelKey).line} strokeWidth={2.5} strokeDasharray={lineDashes[item.modelKey]} strokeLinejoin="round" strokeLinecap="round" />
                {item.points.map((point, index) => (
                  <circle
                    key={`${item.modelKey}-${fixtureKey(point.row)}-${index}`}
                    cx={x(point.position)}
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
         <span className="inline-flex items-center gap-1.5"><span className="inline-block w-5 border-t-2 border-dashed border-muted" />Random guessing</span>
       </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-10 h-4 text-[11px] text-muted" aria-hidden="true">
         {dateTicks.map((fixture, index) => { const position = fixtures.indexOf(fixture); return <span key={`${fixtureKey(fixture)}-${index}`} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${(x(position) / WIDTH) * 100}%` }}>{formatDateOnly(fixture.fixture_date as string)}</span>; })}
      </div>
      {activePoint && activeSeries && active && (
        <div
           className="pointer-events-none absolute z-10 rounded-button border border-edge bg-white p-3 shadow-sm"
          style={{ left: `${(guideX! / WIDTH) * 100}%`, top: `${(guideY! / HEIGHT) * 100}%`, width: "min(380px, calc(100% - 1rem))", transform: `${guideX! / WIDTH > 0.65 ? "translateX(calc(-100% - 0.75rem))" : "translateX(0.75rem)"} translateY(-50%)` }}
        >
           <p className="text-sm font-semibold" style={{ color: modelColour(active.modelKey).line }}>Running average log loss: {activePoint.average.toFixed(3)}</p>
           <p className="mt-1 text-sm text-muted">This match: {activePoint.row.log_loss === null ? "unavailable" : activePoint.row.log_loss.toFixed(3)}</p>
           <p className="mt-2 text-xs font-semibold">{modelLabel(active.modelKey)} · {activePoint.row.fixture_date ? pointDate(activePoint) : "Date unavailable"}</p>
           <p className="mt-2 truncate text-xs font-semibold">{activePoint.row.home ?? "Home unavailable"} v {activePoint.row.away ?? "Away unavailable"}</p>
           <p className="text-xs text-muted">{resultName(activePoint.row.result)}</p>
           <p className="text-xs text-muted">Correct so far: {activeCorrect} of {active.index + 1} ({Math.round((activeCorrect / (active.index + 1)) * 100)}%)</p>
          <p className="text-xs text-muted">{activePoint.row.correct === true ? "✓ Correct" : activePoint.row.correct === false ? "✕ Incorrect" : "Correctness unavailable"}</p>
         </div>
      )}
      <p className="mt-3 text-sm text-muted">Lower is better. Early values swing a lot because there are few matches. The vertical scale is fitted to the data rather than starting at zero.</p>
    </div>
  );
}
