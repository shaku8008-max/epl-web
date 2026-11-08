// Lean prediction page. The route is separate from the track record so the
// Predict nav item can open the evidence page first.

import type { Metadata } from "next";
import Card from "@/components/Card";
import MatchupTool from "@/components/MatchupTool";
import ModelTabs from "@/components/ModelTabs";
import { getLatestRun, getPredictions, getTeamStats } from "@/lib/data";
import { resolveInitialPair } from "@/lib/fixtures";
import { formatDateOnly } from "@/lib/format";
import type { Prediction, Run, TeamStats } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Predict",
  description: "Pick any two Premier League teams to see the home, draw and away probabilities.",
};

async function loadPredictPage(): Promise<
  | { predictions: Prediction[]; teamStats: TeamStats[]; teams: string[]; latestRun: Run | null }
  | { error: string }
> {
  try {
    const [predictions, teamStats, latestRun] = await Promise.all([
      getPredictions(),
      getTeamStats(),
      getLatestRun(),
    ]);
    const teams = teamStats.map((r) => r.team).sort((a, b) => a.localeCompare(b));
    if (teams.length < 2 || predictions.length === 0) {
      return { error: "The database returned no rows (expected 380 predictions and 20 teams)." };
    }
    return { predictions, teamStats, teams, latestRun };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export default async function LeanPage(props: PageProps<"/lean">) {
  const result = await loadPredictPage();

  if ("error" in result) {
    return (
      <section>
        <ModelTabs />
        <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Predict</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed">Pick any two Premier League teams to see the home, draw and away probabilities from the model, plus recent stats for both teams.</p>
        <Card className="mt-8">
          <p className="font-semibold">Predictions are unavailable right now</p>
          <p className="mt-1 text-sm text-muted">{result.error}</p>
        </Card>
      </section>
    );
  }

  const searchParams = await props.searchParams;
  const initialPair = resolveInitialPair(searchParams, result.predictions, result.teams);
  const xgNote = result.latestRun?.xg_ok === false && result.latestRun.xg_through !== null
    ? `xG form data runs through ${formatDateOnly(result.latestRun.xg_through)}. The xG feed has stopped updating, so xG-based form is out of date. Elo and match results are current.`
    : null;

  return (
    <section className="lg:w-[min(80rem,calc(100vw_-_2rem))] lg:ml-[calc((100%_-_min(80rem,calc(100vw_-_2rem)))/2)]">
      <ModelTabs />
      {xgNote && <p className="mb-6 rounded-card bg-tint px-4 py-3 text-base text-muted">{xgNote}</p>}
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Predict</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">Pick any two Premier League teams to see the home, draw and away probabilities from the model, plus recent stats for both teams.</p>
      <MatchupTool predictions={result.predictions} teams={result.teams} teamStats={result.teamStats} initialHome={initialPair.home} initialAway={initialPair.away} />
    </section>
  );
}
