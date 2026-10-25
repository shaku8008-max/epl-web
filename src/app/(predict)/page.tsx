// Predict page. The server loads the data once per request and picks
// the initial matchup; the interactive picker runs in the browser (MatchupTool).

import type { Metadata } from "next";
import Card from "@/components/Card";
import MatchupTool from "@/components/MatchupTool";
import { getPredictions, getTeamStats } from "@/lib/data";
import { resolveInitialPair } from "@/lib/fixtures";
import type { Prediction, TeamStats } from "@/lib/types";

// Request-time render: queries run fresh on every load, never at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Predict",
  description:
    "Pick any two Premier League teams to see the home, draw and away probabilities.",
};

// Plain loader with no JSX, so query problems can be caught and reported
// instead of crashing the page (the linter forbids JSX inside try/catch).
async function loadPredictPage(): Promise<
  | { predictions: Prediction[]; teamStats: TeamStats[]; teams: string[] }
  | { error: string }
> {
  try {
    const [predictions, teamStats] = await Promise.all([
      getPredictions(),
      getTeamStats(),
    ]);
    // Team names come from the same team_stats rows, so teams need no query
    // of their own. Sorted here because the DB order is only a fallback.
    const teams = teamStats.map((r) => r.team).sort((a, b) => a.localeCompare(b));
    if (teams.length < 2 || predictions.length === 0) {
      return {
        error:
          "The database returned no rows (expected 380 predictions and 20 teams).",
      };
    }
    return { predictions, teamStats, teams };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export default async function PredictPage(props: PageProps<"/">) {
  const result = await loadPredictPage();

  if ("error" in result) {
    return (
      <section>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Predict</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed">
          Pick any two Premier League teams to see the home, draw and away
          probabilities from the model, plus recent stats for both teams.
        </p>
        <Card className="mt-8">
          <p className="font-semibold">Predictions are unavailable right now</p>
          <p className="mt-1 text-sm text-muted">{result.error}</p>
        </Card>
      </section>
    );
  }

  // In Next.js 16 searchParams arrives as a Promise, so await it first.
  const searchParams = await props.searchParams;
  const initialPair = resolveInitialPair(
    searchParams,
    result.predictions,
    result.teams
  );

  return (
    <section className="lg:w-[min(80rem,calc(100vw_-_2rem))] lg:ml-[calc((100%_-_min(80rem,calc(100vw_-_2rem)))/2)]">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Predict</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">
        Pick any two Premier League teams to see the home, draw and away
        probabilities from the model, plus recent stats for both teams.
      </p>
      <MatchupTool
        predictions={result.predictions}
        teams={result.teams}
        teamStats={result.teamStats}
        initialHome={initialPair.home}
        initialAway={initialPair.away}
      />
    </section>
  );
}
