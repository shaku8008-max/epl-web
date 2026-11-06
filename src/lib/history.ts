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

export function settledEntries(entries: JournalEntry[]): SettledEntry[] {
  return entries.filter(isSettled);
}

export function betProfit(entries: JournalEntry[]): number {
  return settledEntries(entries).reduce((total, entry) => total + profitFor(entry), 0);
}

export function returnOnInvestment(entries: JournalEntry[]): number | null {
  const bets = settledEntries(entries).filter((entry) => entry.status !== "void");
  const staked = bets.reduce((total, entry) => total + entry.stake, 0);
  return staked > 0 ? (betProfit(entries) / staked) * 100 : null;
}

export function winRate(entries: JournalEntry[]): number | null {
  const bets = settledEntries(entries).filter((entry) => entry.status !== "void");
  return bets.length > 0
    ? (bets.filter((entry) => entry.status === "won").length / bets.length) * 100
    : null;
}

// The implied break-even probability is the mean of each valid decimal odds'
// implied probability. Invalid odds contribute no data rather than infinity.
export function breakEvenRate(entries: JournalEntry[]): number | null {
  const bets = settledEntries(entries).filter(
    (entry) => entry.status !== "void" && Number.isFinite(entry.odds) && entry.odds > 0
  );
  if (bets.length === 0) return null;
  return (bets.reduce((total, entry) => total + 1 / entry.odds, 0) / bets.length) * 100;
}

export function valueColour(value: number | null): "better" | "worse" | "draw" {
  if (value === null || value === 0) return "draw";
  return value > 0 ? "better" : "worse";
}

export function nearestPoint(series: HistoryPoint[], index: number): number {
  if (series.length === 0) return -1;
  return Math.max(0, Math.min(series.length - 1, Math.round(index)));
}
