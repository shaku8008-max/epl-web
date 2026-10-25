// Cumulative profit/loss line chart, drawn as plain SVG (no chart library).
// Server component: pure display, no interactivity.

import type { HistoryPoint } from "@/lib/history";

type HistoryChartProps = {
  series: HistoryPoint[];
};

const WIDTH = 600;
const HEIGHT = 200;
const PAD = 16;

export default function HistoryChart({ series }: HistoryChartProps) {
  if (series.length === 0) {
    return (
      <p className="text-sm text-muted">
        No settled bets yet, so there is no history to chart.
      </p>
    );
  }

  const totals = series.map((p) => p.total);
  const min = Math.min(0, ...totals);
  const max = Math.max(0, ...totals);
  const range = max - min || 1;

  const x = (i: number) =>
    series.length === 1
      ? WIDTH / 2
      : PAD + (i / (series.length - 1)) * (WIDTH - PAD * 2);
  const y = (total: number) =>
    HEIGHT - PAD - ((total - min) / range) * (HEIGHT - PAD * 2);

  const points = series.map((p, i) => `${x(i)},${y(p.total)}`).join(" ");
  const zeroY = y(0);
  const finalTotal = totals[totals.length - 1];
  const lineColor = finalTotal >= 0 ? "var(--color-primary)" : "var(--color-out)";

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-48 w-full"
      role="img"
      aria-label="Cumulative profit and loss over settled bets"
    >
      {/* Zero line, only when the range crosses it. */}
      {min < 0 && max > 0 && (
        <line
          x1={PAD}
          x2={WIDTH - PAD}
          y1={zeroY}
          y2={zeroY}
          stroke="var(--color-border)"
          strokeWidth={1}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={lineColor}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {series.map((p, i) => (
        <circle
          key={p.entry.id}
          cx={x(i)}
          cy={y(p.total)}
          r={3}
          fill={lineColor}
        />
      ))}
    </svg>
  );
}
