// Jev scoreboard: does the news-based shift make the model better or worse,
// measured on finished matches only? Server component; reads the public
// jev_predictions table with the anon key only.

import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/Card";
import JevScoreboardList from "@/components/JevScoreboardList";
import JevScoreboardSummary from "@/components/JevScoreboardSummary";
import { getJevSettledPredictions } from "@/lib/data";
import { buildScoreboard } from "@/lib/jevScore";
import type { JevPrediction } from "@/lib/types";

// Request-time render: queries run fresh on every load, never at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jev scoreboard",
  description:
    "How Jev's news-based shift has scored on finished matches so far.",
};

// Plain loader with no JSX, so query problems can be caught and reported
// instead of crashing the page (the linter forbids JSX inside try/catch).
async function loadScoreboard(): Promise<
  { rows: JevPrediction[] } | { error: string }
> {
  try {
    const rows = await getJevSettledPredictions();
    return { rows };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export default async function JevScoreboardPage() {
  const result = await loadScoreboard();

  if ("error" in result) {
    return (
      <section>
        <p className="text-sm">
          <Link
            href="/jev"
            className="font-medium text-primary underline underline-offset-2"
          >
            Back to Jev
          </Link>
        </p>
        <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight text-primary">
          Jev scoreboard
        </h1>
        <Card className="mt-8">
          <p className="font-semibold">The scoreboard is unavailable right now</p>
          <p className="mt-1 text-sm text-muted">{result.error}</p>
        </Card>
      </section>
    );
  }

  const board = buildScoreboard(result.rows);

  return (
    <section>
      <p className="text-sm">
        <Link
          href="/jev"
          className="font-medium text-primary underline underline-offset-2"
        >
          Back to Jev
        </Link>
      </p>
      <h1 className="mt-2 font-heading text-4xl font-bold tracking-tight text-primary">
        Jev scoreboard
      </h1>
      <p className="mt-3 max-w-2xl text-lg">
        Does Jev&apos;s news-based shift make the model&apos;s predictions
        better or worse? This page only counts matches that have finished.
      </p>

      <div className="mt-4 max-w-2xl space-y-2 text-sm text-muted">
        <p>
          <span className="font-medium text-ink">Log loss</span> rewards
          a version for giving a high probability to the result that actually
          happened. Lower is better, and one bad miss hurts more than a good
          call helps.
        </p>
        <p>
          <span className="font-medium text-ink">Accuracy</span> just
          counts how often the most likely result turned out to be right.
        </p>
        <p>
          This is an experiment, not betting advice. Bookmaker odds are not
          included yet.
        </p>
      </div>

      {board.matches.length === 0 ? (
        <Card className="mt-6">
          <p className="text-muted">
            No finished matches yet. Results appear after the daily update.
          </p>
        </Card>
      ) : (
        <>
          <JevScoreboardSummary summary={board.summary} />
          <JevScoreboardList matches={board.matches} />
        </>
      )}
    </section>
  );
}
