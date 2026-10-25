"use client";

// One journal entry: the bet, its status, and the controls to settle it
// manually (or reopen/delete it). Calls the settleEntry/deleteEntry server
// actions; the model's predicted percentage for the pick is shown for context.

import { useState, useTransition } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { deleteEntry, settleEntry } from "@/lib/journal";
import { formatFixtureDate } from "@/lib/format";
import type { JournalEntry as JournalEntryType } from "@/lib/types";

type JournalEntryProps = {
  entry: JournalEntryType;
  modelProb: number | null;
};

const aud = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

const STATUS_STYLES: Record<JournalEntryType["status"], string> = {
  open: "bg-draw text-white",
  won: "bg-primary text-white",
  lost: "bg-out text-white",
  void: "bg-muted text-white",
};

const STATUS_LABELS: Record<JournalEntryType["status"], string> = {
  open: "Open",
  won: "Won",
  lost: "Lost",
  void: "Void",
};

export default function JournalEntry({ entry, modelProb }: JournalEntryProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const pickLabel =
    entry.pick === "H"
      ? `${entry.home} win`
      : entry.pick === "D"
        ? "Draw"
        : `${entry.away} win`;

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <div className="border-y border-border py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">
            {entry.home} v {entry.away}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {formatFixtureDate(entry.fixture_date)}
          </p>
        </div>
        <span
          className={`rounded-card px-3 py-1 text-xs font-semibold ${STATUS_STYLES[entry.status]}`}
        >
          {STATUS_LABELS[entry.status]}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted">Pick</dt>
          <dd className="font-medium">{pickLabel}</dd>
        </div>
        <div>
          <dt className="text-muted">Stake</dt>
          <dd className="font-medium tabular-nums">{aud.format(entry.stake)}</dd>
        </div>
        <div>
          <dt className="text-muted">Odds</dt>
          <dd className="font-medium tabular-nums">{entry.odds.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-muted">Model said</dt>
          <dd className="font-medium tabular-nums">
            {modelProb === null ? "-" : `${modelProb}%`}
          </dd>
        </div>
      </dl>

      {entry.notes && <p className="mt-3 text-sm text-muted">{entry.notes}</p>}

      {error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {entry.status === "open" ? (
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => settleEntry(entry.id, "won"))}
            >
              Won
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => settleEntry(entry.id, "lost"))}
            >
              Lost
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => settleEntry(entry.id, "void"))}
            >
              Void
            </Button>
          </>
        ) : (
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => run(() => settleEntry(entry.id, "open"))}
          >
            Reopen
          </Button>
        )}
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => run(() => deleteEntry(entry.id))}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
