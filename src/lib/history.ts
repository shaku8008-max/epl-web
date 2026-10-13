// Pure helpers for the journal history view. Free of Supabase imports so the
// page stays a simple server component and the math is easy to test.

import type { JournalEntry } from "@/lib/types";

// A settled entry: won, lost or void (open entries are excluded from history).
export type SettledEntry = JournalEntry & { status: "won" | "lost" | "void" };

export function isSettled(e: JournalEntry): e is SettledEntry {
  return e.status === "won" || e.status === "lost" || e.status === "void";
}

// Profit/loss for one settled bet. Void returns the stake, so it is 0.
export function profitFor(e: SettledEntry): number {
  if (e.status === "won") return e.stake * (e.odds - 1);
  if (e.status === "lost") return -e.stake;
  return 0;
}

// One point in the cumulative series: the bet, its own P/L and the running
// total after it. Ordered oldest-first so the total builds chronologically.
export type HistoryPoint = {
  entry: SettledEntry;
  profit: number;
  total: number;
};

export function cumulativeSeries(entries: JournalEntry[]): HistoryPoint[] {
  const settled = entries
    .filter(isSettled)
    .sort((a, b) => (a.settled_at ?? "").localeCompare(b.settled_at ?? ""));
  let total = 0;
  return settled.map((entry) => {
    const profit = profitFor(entry);
    total += profit;
    return { entry, profit, total };
  });
}

// The same series, newest-first, for the list.
export function newestFirst(series: HistoryPoint[]): HistoryPoint[] {
  return [...series].reverse();
}
