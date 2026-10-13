// Journal page. The server settles any open bets whose results have arrived,
// then loads the entries, the upcoming fixtures (for the add form) and the
// model probabilities (to show what the model said for each pick).

import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/Card";
import AddBetForm from "@/components/AddBetForm";
import JournalEntry from "@/components/JournalEntry";
import JournalSummary from "@/components/JournalSummary";
import { getPredictions } from "@/lib/data";
import { upcomingFixtures } from "@/lib/fixtures";
import { toWholePercentages } from "@/lib/format";
import { autoSettle, getJournalEntries } from "@/lib/journal";
import type { Fixture, JournalEntry as JournalEntryType, Prediction } from "@/lib/types";

// Request-time render: settle + query fresh on every load.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal",
  description: "Track your predictions and see whether the model is paying off.",
};

// The model's whole-number percentage for a given pick, or null when the pair
// has no prediction row (should not normally happen).
function modelProbFor(
  prediction: Prediction | undefined,
  pick: "H" | "D" | "A"
): number | null {
  if (!prediction) return null;
  const pct = toWholePercentages(
    prediction.p_home,
    prediction.p_draw,
    prediction.p_away
  );
  return pick === "H" ? pct.home : pick === "D" ? pct.draw : pct.away;
}

// Plain loader with no JSX, so query problems can be caught and reported
// instead of crashing the page (the linter forbids JSX inside try/catch).
async function loadJournalPage(): Promise<
  | {
      entries: JournalEntryType[];
      fixtures: Fixture[];
      modelProbs: Map<number, number | null>;
    }
  | { error: string }
> {
  try {
    // Settle first, then read, so the list reflects the latest results.
    await autoSettle();
    const [entries, predictions] = await Promise.all([
      getJournalEntries(),
      getPredictions(),
    ]);

    const lookup = new Map<string, Prediction>();
    for (const row of predictions) lookup.set(`${row.home}|${row.away}`, row);

    const modelProbs = new Map<number, number | null>();
    for (const entry of entries) {
      modelProbs.set(
        entry.id,
        modelProbFor(lookup.get(`${entry.home}|${entry.away}`), entry.pick)
      );
    }

    return {
      entries,
      fixtures: upcomingFixtures(predictions),
      modelProbs,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export default async function JournalPage() {
  const result = await loadJournalPage();

  if ("error" in result) {
    return (
      <section>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-primary">Journal</h1>
        <p className="mt-3 max-w-2xl text-lg">
          Record your predictions with a stake and odds, then see whether the
          model is actually paying off.
        </p>
        <Card className="mt-8">
          <p className="font-semibold">The journal is unavailable right now</p>
          <p className="mt-1 text-sm text-muted">{result.error}</p>
        </Card>
      </section>
    );
  }

  const { entries, fixtures, modelProbs } = result;

  return (
    <section>
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary">Journal</h1>
      <p className="mt-3 max-w-2xl text-lg">
        Record your predictions with a stake and odds, then see whether the
        model is actually paying off.
      </p>

      <p className="mt-4">
        <Link
          href="/journal/history"
          className="font-medium text-primary underline underline-offset-2"
        >
          View history
        </Link>
      </p>

      <div className="mt-8">
        <JournalSummary entries={entries} />
      </div>

      <div className="mt-6">
        <AddBetForm fixtures={fixtures} />
      </div>

      <div className="mt-6 space-y-4">
        {entries.length === 0 ? (
          <Card>
            <p className="text-muted">
              No bets yet. Add one above to start tracking the model.
            </p>
          </Card>
        ) : (
          entries.map((entry) => (
            <JournalEntry
              key={entry.id}
              entry={entry}
              modelProb={modelProbs.get(entry.id) ?? null}
            />
          ))
        )}
      </div>
    </section>
  );
}
