"use client";

import { useOptimistic, useState } from "react";
import AddBetForm, { type AddBetInput } from "@/components/AddBetForm";
import JournalEntry from "@/components/JournalEntry";
import { addEntry, deleteEntry, settleEntry } from "@/lib/journal";
import type { Fixture, JournalEntry as JournalEntryType } from "@/lib/types";

type OptimisticEntry = JournalEntryType & { pending?: boolean };
type Action =
  | { type: "add"; entry: OptimisticEntry }
  | { type: "settle"; id: number; status: JournalEntryType["status"] }
  | { type: "delete"; id: number };

function reduceEntries(entries: OptimisticEntry[], action: Action): OptimisticEntry[] {
  if (action.type === "add") return [action.entry, ...entries];
  if (action.type === "delete") return entries.filter((entry) => entry.id !== action.id);
  return entries.map((entry) =>
    entry.id === action.id ? { ...entry, status: action.status } : entry
  );
}

type JournalBookProps = {
  entries: JournalEntryType[];
  fixtures: Fixture[];
  modelProbs: Record<number, number | null>;
};

export default function JournalBook({ entries, fixtures, modelProbs }: JournalBookProps) {
  const [entryErrors, setEntryErrors] = useState<Record<number, string>>({});
  const [optimisticEntries, addOptimistic] = useOptimistic(
    entries as OptimisticEntry[],
    reduceEntries
  );

  async function addOptimisticEntry(input: AddBetInput) {
    const now = new Date().toISOString();
    addOptimistic({
      type: "add",
      entry: {
        id: -Date.now(), home: input.home, away: input.away,
        fixture_date: input.fixtureDate, pick: input.pick, stake: input.stake,
        odds: input.odds, placed_at: now, notes: input.notes, status: "open",
        result: null, settled_at: null, created_at: now, pending: true,
      },
    });
    await addEntry(input);
  }

  async function settleOptimisticEntry(
    entry: OptimisticEntry,
    status: JournalEntryType["status"]
  ) {
    if (entry.pending) return;
    setEntryErrors((current) => {
      const next = { ...current };
      delete next[entry.id];
      return next;
    });
    addOptimistic({ type: "settle", id: entry.id, status });
    await settleEntry(entry.id, status as "won" | "lost" | "void" | "open");
  }

  async function deleteOptimisticEntry(entry: OptimisticEntry) {
    if (entry.pending) return;
    setEntryErrors((current) => {
      const next = { ...current };
      delete next[entry.id];
      return next;
    });
    addOptimistic({ type: "delete", id: entry.id });
    try {
      await deleteEntry(entry.id);
    } catch (error) {
      setEntryErrors((current) => ({
        ...current,
        [entry.id]: error instanceof Error ? error.message : String(error),
      }));
      throw error;
    }
  }

  return (
    <>
      <div className="mt-6"><AddBetForm fixtures={fixtures} onAdd={addOptimisticEntry} /></div>
      <div className="mt-6">
        {optimisticEntries.length === 0 ? (
          <div className="border-y border-border py-6"><p className="text-muted">
            No bets yet. Add one above to start tracking the model.
          </p></div>
        ) : optimisticEntries.map((entry) => (
          <JournalEntry key={entry.id} entry={entry} modelProb={modelProbs[entry.id] ?? null}
            error={entryErrors[entry.id]}
            onSettle={(status) => settleOptimisticEntry(entry, status)}
            onDelete={() => deleteOptimisticEntry(entry)} />
        ))}
      </div>
    </>
  );
}
