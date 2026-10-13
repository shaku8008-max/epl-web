// Journal history page: a cumulative profit/loss chart plus a per-bet list
// with bars. Read-only; the settle/delete controls live on /journal.

import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/Card";
import HistoryChart from "@/components/HistoryChart";
import HistoryList from "@/components/HistoryList";
import { cumulativeSeries, newestFirst } from "@/lib/history";
import { autoSettle, getJournalEntries } from "@/lib/journal";

// Request-time render: settle + query fresh on every load.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "History",
  description: "How your journal has performed over time.",
};

const aud = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

export default async function HistoryPage() {
  let series;
  try {
    await autoSettle();
    const entries = await getJournalEntries();
    series = cumulativeSeries(entries);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <section>
        <h1 className="font-heading text-3xl font-bold text-primary">History</h1>
        <Card className="mt-8">
          <p className="font-semibold">History is unavailable right now</p>
          <p className="mt-1 text-sm text-muted">{message}</p>
        </Card>
      </section>
    );
  }

  const total = series.length > 0 ? series[series.length - 1].total : 0;
  const list = newestFirst(series);

  return (
    <section>
      <h1 className="font-heading text-3xl font-bold text-primary">History</h1>
      <p className="mt-3 max-w-2xl text-lg">
        How your journal has performed over time, bet by bet.
      </p>

      <Card className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-xl font-semibold">
            Cumulative profit / loss
          </h2>
          <span
            className={`text-2xl font-semibold tabular-nums ${
              total > 0 ? "text-primary" : total < 0 ? "text-red-700" : "text-ink"
            }`}
          >
            {total > 0 ? "+" : total < 0 ? "−" : ""}
            {aud.format(Math.abs(total))}
          </span>
        </div>
        <div className="mt-4">
          <HistoryChart series={series} />
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="font-heading text-xl font-semibold">Settled bets</h2>
        {list.length === 0 ? (
          <p className="mt-2 text-muted">
            No settled bets yet. Settle a bet on the journal page to see it here.
          </p>
        ) : (
          <div className="mt-2">
            <HistoryList series={list} />
          </div>
        )}
      </Card>

      <p className="mt-6">
        <Link
          href="/journal"
          className="font-medium text-primary underline underline-offset-2"
        >
          Back to journal
        </Link>
      </p>
    </section>
  );
}
