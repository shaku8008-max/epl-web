"use client";

import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { formatDateOnly } from "@/lib/format";
import { hitChartLine, type ChartHitSeries } from "@/lib/chartHit";
import {
  fixtureKey,
  modelColour,
  modelLabel,
  orderedFixtures,
  type CorrectPicksPoint,
  type CorrectPicksSeries,
} from "@/lib/trackRecord";
import type { TrackRecord } from "@/lib/types";
import PlaybackSvgLayer from "@/components/PlaybackSvgLayer";
import type { PlaybackTimeline } from "@/components/PlaybackTimeline";

type Props = {
  rows: TrackRecord[];
  series: CorrectPicksSeries[];
  timeline: PlaybackTimeline;
  selectedModel: string | null;
  onToggleModel: (key: string) => void;
};

type Active = { modelKey: string; index: number; alsoModels: string[] };

const W = 600;
const H = 280;
const L = 52;
const R = 18;
const T = 30;
const B = 44;
const I = 10;
const C = 8;

const dateOf = (p: CorrectPicksPoint) =>
  p.row.fixture_date ? formatDateOnly(p.row.fixture_date) : "Date unavailable";

const outcome = (v: TrackRecord["predicted_result"]) =>
  v === "H"
    ? "Predicted: Home"
    : v === "D"
      ? "Predicted: Draw"
      : v === "A"
        ? "Predicted: Away"
        : "Predicted outcome unavailable";

export default function CorrectPicksChart({ rows, series, timeline, selectedModel, onToggleModel }: Props) {
  const drawable = series.filter((s) => s.points.length >= 3);
  const collecting = series.filter((s) => s.points.length < 3);
  const [active, setActive] = useState<Active | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const clipId = `correct-picks-${useId().replace(/:/g, "")}`;
  const fixtures = orderedFixtures(rows);
  const maxPosition = Math.max(fixtures.length - 1, 0);
  const plotWidth = W - L - R;
  const plotHeight = H - T - B;
  const x = (p: number) => L + (maxPosition === 0 ? I : I + (p / maxPosition) * (plotWidth - I * 2));
  const reference = fixtures.map((_, p) => ({ position: p, correct: (p + 1) / 3 }));
  const max = Math.max(
    1,
    ...drawable.flatMap((s) => s.points.map((p) => p.correct)),
    ...reference.map((p) => p.correct),
  );
  const y = (v: number) => T + ((max - v) / max) * plotHeight;
  const ticks = fixtures
    .filter((f, i) => i === 0 || f.fixture_date !== fixtures[i - 1]?.fixture_date)
    .filter((_, i, a) => i === 0 || i === a.length - 1 || i % Math.max(1, Math.ceil(a.length / 4)) === 0);
  const hitSeries: ChartHitSeries[] = drawable.map((s) => ({
    modelKey: s.modelKey,
    points: s.points.map((p, index) => ({ x: x(p.position), y: y(p.correct), index })),
  }));

  useEffect(() => {
    const dismiss = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setActive(null);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  if (!drawable.length) return <p className="text-base text-muted">Collecting, not enough scored matches yet to draw this</p>;

  const pointer = (e: ReactPointerEvent<SVGSVGElement>, toggle: boolean) => {
    const r = e.currentTarget.getBoundingClientRect();
    const hit = hitChartLine(
      ((e.clientX - r.left) / r.width) * W,
      ((e.clientY - r.top) / r.height) * H,
      hitSeries,
      selectedModel,
    );
    if (!hit || (toggle && hit.distance > 14)) return;
    setActive({ modelKey: hit.modelKey, index: hit.pointIndex, alsoModels: hit.alsoModels });
    if (toggle) onToggleModel(hit.modelKey);
  };

  const keyboard = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setActive(null);
      onToggleModel("");
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (active) onToggleModel(active.modelKey);
      return;
    }
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const s = active ? drawable.find((v) => v.modelKey === active.modelKey) : drawable[0];
    if (!s) return;
    const i = Math.max(0, Math.min(s.points.length - 1, (active?.index ?? 0) + (e.key === "ArrowRight" ? 1 : -1)));
    const p = s.points[i];
    const hit = hitChartLine(x(p.position), y(p.correct), hitSeries, selectedModel);
    setActive({ modelKey: s.modelKey, index: i, alsoModels: hit?.alsoModels ?? [] });
  };

  const s = active ? drawable.find((v) => v.modelKey === active.modelKey) : null;
  const p = s && active ? s.points[active.index] : null;
  const gx = p ? x(p.position) : null;
  const gy = p ? y(p.correct) : null;
  const ordered = [...drawable].sort(
    (a, b) =>
      Number(selectedModel === a.modelKey || (!selectedModel && active?.modelKey === a.modelKey)) -
      Number(selectedModel === b.modelKey || (!selectedModel && active?.modelKey === b.modelKey)),
  );
  const opacity = Object.fromEntries(
    drawable.map((v) => [v.modelKey, selectedModel ? (selectedModel === v.modelKey ? 1 : 0.35) : active?.modelKey === v.modelKey ? 1 : 0.35]),
  );

  return (
    <div
      ref={ref}
      className="relative min-w-0 focus-visible:outline-2 focus-visible:outline-ink"
      tabIndex={0}
      role="img"
      aria-label="Cumulative correct picks compared with random guessing"
      onFocus={() => setActive((v) => v ?? { modelKey: drawable[0].modelKey, index: 0, alsoModels: [] })}
      onKeyDown={keyboard}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full max-[639px]:max-h-[10rem] overflow-visible"
        onPointerMove={(e) => pointer(e, false)}
        onPointerDown={(e) => pointer(e, true)}
        onPointerLeave={() => setActive(null)}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={L - C} y={T - C} width={plotWidth + C * 2} height={plotHeight + C * 2} />
          </clipPath>
        </defs>
        {[max, max / 2, 0]
          .filter((v, i, a) => a.indexOf(v) === i)
          .map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--color-border)" />
              <text x={L - 8} y={y(v) + 4} textAnchor="end" className="fill-muted text-[11px]">
                {v.toFixed(v % 1 === 0 ? 0 : 1)}
              </text>
            </g>
          ))}
        {ticks.map((f, i) => {
          const pos = fixtures.indexOf(f);
          return (
            <text
              key={`${fixtureKey(f)}-${i}`}
              x={x(pos)}
              y={H - 13}
              textAnchor={i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"}
              className="fill-muted text-[11px]"
            >
              {formatDateOnly(f.fixture_date as string)}
            </text>
          );
        })}
        <PlaybackSvgLayer
          timeline={timeline}
          clipId={clipId}
          left={L}
          top={T}
          plotWidth={plotWidth}
          plotHeight={plotHeight}
          maxPosition={maxPosition}
          xAtPosition={x}
          y={y}
          opacityByModel={opacity}
          lines={drawable.map((v) => ({
            modelKey: v.modelKey,
            colour: modelColour(v.modelKey).line,
            firstPosition: v.points[0]?.position,
            points: [{ position: -1, value: 0 }, ...v.points.map((p) => ({ position: p.position, value: p.correct }))],
          }))}
        />
        <g clipPath={`url(#${clipId})`}>
          <polyline
            points={reference.map((v) => `${x(v.position)},${y(v.correct)}`).join(" ")}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          {ordered.map((v) => {
            const strong = selectedModel === v.modelKey || (!selectedModel && active?.modelKey === v.modelKey);
            return (
              <g key={v.modelKey} className="epl-chart-series" opacity={strong ? 1 : 0.35}>
                <polyline
                  className="epl-chart-line epl-chart-line--draw"
                  points={v.points.map((p) => `${x(p.position)},${y(p.correct)}`).join(" ")}
                  fill="none"
                  stroke={modelColour(v.modelKey).line}
                  strokeWidth={strong ? 3.5 : 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {v.points.map((p, i) => (
                  <circle
                    className="epl-chart-point"
                    key={`${v.modelKey}-${fixtureKey(p.row)}-${i}`}
                    cx={x(p.position)}
                    cy={y(p.correct)}
                    r={active?.modelKey === v.modelKey && active.index === i ? 5 : strong ? 3.5 : 2.5}
                    fill={modelColour(v.modelKey).line}
                  />
                ))}
              </g>
            );
          })}
        </g>
        {gx !== null && <line x1={gx} x2={gx} y1={T} y2={H - B} stroke="var(--color-muted)" />}
      </svg>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
        {drawable.map((v) => (
          <button
            type="button"
            key={v.modelKey}
            aria-pressed={selectedModel === v.modelKey}
            onClick={() => onToggleModel(v.modelKey)}
            className={`inline-flex items-center gap-1.5 rounded-button px-1 py-1 focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 ${selectedModel && selectedModel !== v.modelKey ? "opacity-60" : ""}`}
          >
            <span className="inline-block h-0.5 w-5" style={{ backgroundColor: modelColour(v.modelKey).line }} />
            {modelLabel(v.modelKey)}
          </button>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-5 border-t-2 border-dashed border-muted" />
          Random guessing
        </span>
      </div>
      {p && s && active && (
        <div
          className="pointer-events-none absolute z-10 rounded-button border border-edge bg-white p-3 shadow-sm"
          style={{
            left: `${(gx! / W) * 100}%`,
            top: `${(gy! / H) * 100}%`,
            width: "min(380px, calc(100% - 1rem))",
            transform: `${gx! / W > 0.65 ? "translateX(calc(-100% - 0.75rem))" : "translateX(0.75rem)"} translateY(-50%)`,
          }}
        >
          <p className="font-heading text-xl font-bold leading-none tabular" style={{ color: modelColour(active.modelKey).line }}>
            Correct so far: {p.correct} of {p.position + 1} ({Math.round((p.correct / (p.position + 1)) * 100)}%)
          </p>
          <p className="mt-2 text-xs font-semibold">{modelLabel(active.modelKey)}</p>
          <p className="mt-2 truncate text-xs font-semibold">{p.row.home ?? "Home unavailable"} v {p.row.away ?? "Away unavailable"}</p>
          <p className="text-xs text-muted">{dateOf(p)}</p>
          <p className="text-xs text-muted">{outcome(p.row.predicted_result)}</p>
          <p className="text-xs text-muted">{p.row.correct === true ? "✓ Correct" : p.row.correct === false ? "✕ Incorrect" : "Correctness unavailable"}</p>
          {active.alsoModels.length > 0 && <p className="mt-1 text-xs text-muted">Also: {active.alsoModels.map(modelLabel).join(", ")} (same point)</p>}
        </div>
      )}
      {collecting.length > 0 && <p className="mt-3 text-sm text-muted">{collecting.map((v) => `${modelLabel(v.modelKey)}: collecting, not enough scored matches yet to draw this`).join(" · ")}</p>}
    </div>
  );
}
