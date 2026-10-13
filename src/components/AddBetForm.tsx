"use client";

// Form to record a new bet on an upcoming fixture. Calls the addEntry server
// action; the model's predicted percentages are shown next to each outcome so
// you can see what the model said when you placed the bet.

import { useState, useTransition } from "react";
import Button from "@/components/Button";
import Card from "@/components/Card";
import { addEntry } from "@/lib/journal";
import { formatFixtureDate, toWholePercentages } from "@/lib/format";
import type { Fixture } from "@/lib/types";

type AddBetFormProps = {
  fixtures: Fixture[];
};

const inputClasses =
  "mt-1 min-h-11 w-full rounded-card border border-border bg-surface px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export default function AddBetForm({ fixtures }: AddBetFormProps) {
  const [fixtureKey, setFixtureKey] = useState(
    fixtures[0] ? `${fixtures[0].home}|${fixtures[0].away}` : ""
  );
  const [pick, setPick] = useState<"H" | "D" | "A">("H");
  const [stake, setStake] = useState("");
  const [odds, setOdds] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const selected =
    fixtures.find((f) => `${f.home}|${f.away}` === fixtureKey) ?? null;
  const pct = selected
    ? toWholePercentages(selected.p_home, selected.p_draw, selected.p_away)
    : null;

  if (fixtures.length === 0) {
    return (
      <Card variant="white">
        <h2 className="font-heading text-xl font-semibold">Add a bet</h2>
        <p className="mt-2 text-muted">
          No upcoming fixtures to bet on right now. Check back after the next
          refresh.
        </p>
      </Card>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const stakeNum = Number(stake);
    const oddsNum = Number(odds);
    if (!selected) {
      setError("Pick a fixture first.");
      return;
    }
    if (!Number.isFinite(stakeNum) || stakeNum <= 0) {
      setError("Enter a stake greater than 0.");
      return;
    }
    if (!Number.isFinite(oddsNum) || oddsNum <= 1) {
      setError("Enter decimal odds greater than 1 (e.g. 2.10).");
      return;
    }

    startTransition(async () => {
      try {
        await addEntry({
          home: selected.home,
          away: selected.away,
          fixtureDate: selected.fixture_date,
          pick,
          stake: stakeNum,
          odds: oddsNum,
          notes: notes || null,
        });
        setStake("");
        setOdds("");
        setNotes("");
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <Card variant="white">
      <h2 className="font-heading text-xl font-semibold">Add a bet</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="bet-fixture" className="block text-sm font-medium">
            Fixture
          </label>
          <select
            id="bet-fixture"
            value={fixtureKey}
            onChange={(e) => setFixtureKey(e.target.value)}
            className={inputClasses}
          >
            {fixtures.map((f) => (
              <option key={`${f.home}|${f.away}`} value={`${f.home}|${f.away}`}>
                {formatFixtureDate(f.fixture_date)} — {f.home} v {f.away}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="block text-sm font-medium">Your pick</legend>
          <div className="mt-1 grid gap-2 sm:grid-cols-3">
            {(
              [
                { key: "H", label: "Home win", value: pct?.home },
                { key: "D", label: "Draw", value: pct?.draw },
                { key: "A", label: "Away win", value: pct?.away },
              ] as const
            ).map((o) => (
              <label
                key={o.key}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-card border px-3 py-2 text-sm ${
                  pick === o.key
                    ? "border-primary bg-tint font-semibold"
                    : "border-border bg-surface"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pick"
                    value={o.key}
                    checked={pick === o.key}
                    onChange={() => setPick(o.key)}
                    className="accent-primary"
                  />
                  {o.label}
                </span>
                {o.value !== undefined && (
                  <span className="text-muted tabular-nums">{o.value}%</span>
                )}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bet-stake" className="block text-sm font-medium">
              Stake (AUD)
            </label>
            <input
              id="bet-stake"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              placeholder="10.00"
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="bet-odds" className="block text-sm font-medium">
              Odds (decimal)
            </label>
            <input
              id="bet-odds"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="1.01"
              value={odds}
              onChange={(e) => setOdds(e.target.value)}
              placeholder="2.10"
              className={inputClasses}
            />
          </div>
        </div>

        <div>
          <label htmlFor="bet-notes" className="block text-sm font-medium">
            Notes (optional)
          </label>
          <input
            id="bet-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. backing the model's top pick"
            className={inputClasses}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="text-sm font-semibold text-primary">
            Bet added.
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add bet"}
        </Button>
      </form>
    </Card>
  );
}
