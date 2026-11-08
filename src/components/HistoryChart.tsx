"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { formatMelbourne } from "@/lib/format";
import { nearestPoint, type HistoryPoint, valueColour } from "@/lib/history";

type HistoryChartProps = { series: HistoryPoint[] };
const WIDTH = 600;
const HEIGHT = 260;
const LEFT = 48;
const RIGHT = 18;
const TOP = 18;
const BOTTOM = 32;

const aud = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
const colour = { better: "var(--color-better)", worse: "var(--color-worse)", draw: "var(--color-draw)" };

export default function HistoryChart({ series }: HistoryChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (!chartRef.current?.contains(event.target as Node)) setActive(null);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  if (series.length === 0) {
    return <p className="text-base text-muted">No settled bets yet, so there is no history to chart.</p>;
  }

  const totals = [0, ...series.map((point) => point.total)];
  const min = Math.min(0, ...totals);
  const max = Math.max(0, ...totals);
  const range = max - min || 1;
  const plotWidth = WIDTH - LEFT - RIGHT;
  const plotHeight = HEIGHT - TOP - BOTTOM;
  // Leave a visible zero baseline before the first bet, rather than making the
  // first settled point appear to be the beginning of the account.
  const x = (i: number) => LEFT + ((i + 1) / series.length) * plotWidth;
  const y = (total: number) => TOP + ((max - total) / range) * plotHeight;
  const points = series.map((point, i) => `${x(i)},${y(point.total)}`).join(" ");
  const zeroY = y(0);
  const areaPath = `M ${LEFT} ${zeroY} L ${series.map((point, i) => `${x(i)} ${y(point.total)}`).join(" L ")} L ${x(series.length - 1)} ${zeroY} Z`;
  const finalTotal = series[series.length - 1].total;
  const activePoint = active === null ? null : series[active];
  const gridValues = [max, max / 2, 0, min / 2, min].filter((value, index, values) => values.indexOf(value) === index);

  function setFromPointer(event: ReactPointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const position = ((event.clientX - rect.left) / rect.width) * WIDTH;
    setActive(nearestPoint(series, ((position - LEFT) / plotWidth) * series.length - 1));
  }

  function moveKey(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = active === null ? 0 : active + (event.key === "ArrowRight" ? 1 : -1);
    setActive(nearestPoint(series, next));
  }

  return (
    <div ref={chartRef} className="relative min-w-0" onKeyDown={moveKey} tabIndex={0} role="img" aria-label="Cumulative profit and loss over settled bets">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" onPointerMove={setFromPointer} onPointerDown={setFromPointer} onPointerLeave={() => setActive(null)}>
        <defs>
          <clipPath id="history-above-zero"><rect x="0" y="0" width={WIDTH} height={zeroY} /></clipPath>
          <clipPath id="history-below-zero"><rect x="0" y={zeroY} width={WIDTH} height={HEIGHT - zeroY} /></clipPath>
        </defs>
        {gridValues.map((value) => (
          <g key={value}>
            <line x1={LEFT} x2={WIDTH - RIGHT} y1={y(value)} y2={y(value)} stroke="var(--color-border)" strokeWidth={value === 0 ? 1.5 : 1} strokeDasharray={value === 0 ? "5 4" : undefined} />
            <text x={LEFT - 7} y={y(value) + 4} textAnchor="end" className="fill-muted text-[11px]">{aud.format(value).replace("A", "")}</text>
          </g>
        ))}
        <path d={areaPath} fill="var(--color-better-soft)" clipPath="url(#history-above-zero)" />
        <path d={areaPath} fill="var(--color-worse-soft)" clipPath="url(#history-below-zero)" />
        <polyline points={points} fill="none" stroke="var(--color-better)" clipPath="url(#history-above-zero)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={points} fill="none" stroke="var(--color-worse)" clipPath="url(#history-below-zero)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {active !== null && <line x1={x(active)} x2={x(active)} y1={TOP} y2={HEIGHT - BOTTOM} stroke="var(--color-muted)" strokeWidth={1} />}
        {series.map((point, i) => <circle key={point.entry.id} cx={x(i)} cy={y(point.total)} r={active === i ? 5 : 3} fill={colour[valueColour(point.total)]} />)}
        <text x={WIDTH - RIGHT} y={Math.max(TOP + 12, y(finalTotal) - 9)} textAnchor="end" className="fill-ink text-xs font-semibold">{finalTotal > 0 ? "+" : ""}{aud.format(finalTotal)}</text>
      </svg>
      {activePoint && (
        <div
           className={`pointer-events-none absolute top-2 z-10 w-44 rounded-button border border-edge bg-white p-3 shadow-sm ${active! < series.length * 0.2 ? "left-0" : active! > series.length * 0.8 ? "right-0" : "-translate-x-1/2"}`}
          style={active! < series.length * 0.2 || active! > series.length * 0.8 ? undefined : { left: `${(x(active!) / WIDTH) * 100}%` }}
        >
          <p className="font-heading text-2xl font-bold leading-none tabular-nums" style={{ color: colour[valueColour(activePoint.total)] }}>{activePoint.total > 0 ? "+" : activePoint.total < 0 ? "−" : ""}{aud.format(Math.abs(activePoint.total))}</p>
          <p className="mt-2 truncate text-xs font-semibold">{activePoint.entry.home} v {activePoint.entry.away}</p>
          <p className="text-xs text-muted">{activePoint.entry.settled_at ? formatMelbourne(activePoint.entry.settled_at) : "Date unavailable"}</p>
          <p className="text-xs text-muted">Bet: {activePoint.profit > 0 ? "+" : activePoint.profit < 0 ? "−" : ""}{aud.format(Math.abs(activePoint.profit))}</p>
        </div>
      )}
    </div>
  );
}
