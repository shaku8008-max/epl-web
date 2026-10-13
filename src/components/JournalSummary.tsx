// Summary of the journal: profit/loss, return on investment and win rate.
// Pure display, no interactivity, so it stays a server component.

import Card from "@/components/Card";
import type { JournalEntry } from "@/lib/types";

// AUD currency, e.g. "$12.50" or "-$8.00".
const aud = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

type JournalSummaryProps = {
  entries: JournalEntry[];
};

export default function JournalSummary({ entries }: JournalSummaryProps) {
  const settled = entries.filter((e) => e.status === "won" || e.status === "lost");
  const won = settled.filter((e) => e.status === "won");
  const lost = settled.filter((e) => e.status === "lost");

  // Void bets return the stake and are excluded from P/L and ROI.
  const profit = settled.reduce(
    (sum, e) => sum + (e.status === "won" ? e.stake * (e.odds - 1) : -e.stake),
    0
  );
  const staked = settled.reduce((sum, e) => sum + e.stake, 0);
  const roi = staked > 0 ? (profit / staked) * 100 : null;
  const winRate = settled.length > 0 ? (won.length / settled.length) * 100 : null;

  const openCount = entries.filter((e) => e.status === "open").length;
  const voidCount = entries.filter((e) => e.status === "void").length;

  return (
    <Card variant="white">
      <h2 className="font-heading text-xl font-semibold">Summary</h2>
      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted">Profit / loss</dt>
          <dd
            className={`mt-1 text-2xl font-semibold tabular-nums ${
              profit > 0 ? "text-primary" : profit < 0 ? "text-red-700" : "text-ink"
            }`}
          >
            {aud.format(profit)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">ROI</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">
            {roi === null ? "–" : `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Win rate</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">
            {winRate === null ? "–" : `${winRate.toFixed(0)}%`}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-muted">
        {settled.length} settled ({won.length} won, {lost.length} lost)
        {voidCount > 0 ? `, ${voidCount} void` : ""}
        {openCount > 0 ? `, ${openCount} open` : ""}.
      </p>
    </Card>
  );
}
