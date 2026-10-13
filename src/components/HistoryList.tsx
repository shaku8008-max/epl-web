// The settled-bet history list: one row per bet, newest first, with a bar
// sized to the bet's profit/loss. Green for profit, red for loss, neutral for
// void. Server component: pure display.

import { formatMelbourne } from "@/lib/format";
import type { HistoryPoint } from "@/lib/history";

type HistoryListProps = {
  series: HistoryPoint[];
};

const aud = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

const GREEN = "#166534";
const RED = "#b91c1c";

function pickLabel(p: HistoryPoint): string {
  const { home, away, pick } = p.entry;
  if (pick === "H") return `${home} win`;
  if (pick === "D") return "Draw";
  return `${away} win`;
}

export default function HistoryList({ series }: HistoryListProps) {
  if (series.length === 0) return null;

  const maxAbs = Math.max(...series.map((p) => Math.abs(p.profit)), 0);

  return (
    <ul className="divide-y divide-border">
      {series.map((p) => {
        const { entry, profit } = p;
        const color = profit > 0 ? GREEN : profit < 0 ? RED : "#5b6b62";
        const widthPct = maxAbs === 0 ? 0 : (Math.abs(profit) / maxAbs) * 100;
        const amount =
          profit === 0 ? aud.format(0) : `${profit > 0 ? "+" : "−"}${aud.format(Math.abs(profit))}`;

        return (
          <li key={entry.id} className="py-3">
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">
                  {entry.home} v {entry.away}
                </div>
                <div className="mt-0.5 text-sm text-muted">
                  {entry.settled_at
                    ? formatMelbourne(entry.settled_at)
                    : "unavailable"}{" "}
                  · {pickLabel(p)} · {aud.format(entry.stake)} @{" "}
                  {entry.odds.toFixed(2)}
                </div>
              </div>
              <div
                className="shrink-0 font-semibold tabular-nums"
                style={{ color }}
              >
                {entry.status === "void" ? "Void" : amount}
              </div>
            </div>
            {entry.status !== "void" && (
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-tint">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${widthPct}%`, backgroundColor: color }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
