// Neural page: compares the neural network's upcoming predictions with the
// site's main model. It reads only public Supabase rows and never runs a model.

import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/Card";
import ModelTabs from "@/components/ModelTabs";
import NnMatchupTool from "@/components/NnMatchupTool";
import NnLaterFixtures from "@/components/NnLaterFixtures";
import {
  getNnPredictions,
  getNnTeamStats,
  getPredictions,
} from "@/lib/data";
import {
  nextRoundFixtures,
  resolveInitialPair,
  upcomingFixtures,
} from "@/lib/fixtures";
import { formatMelbourne } from "@/lib/format";
import { isStale } from "@/lib/jev";
import { getNnPredictionExplain } from "@/lib/explain";
import type { PredictionExplain } from "@/lib/explain";
import type { NnPrediction, NnTeamStats, Prediction } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Neural",
  description: "A neural network's Premier League match predictions.",
};

// Keep database work in a plain function so errors are caught outside JSX.
async function loadNeuralPage(): Promise<
  | {
      neural: NnPrediction[];
      main: Prediction[];
      teamStats: NnTeamStats[];
      explainRows: PredictionExplain[];
    }
  | { error: string }
> {
  try {
    const [neural, main, teamStats, explainRows] = await Promise.all([
      getNnPredictions(),
      getPredictions(),
      getNnTeamStats().catch(() => []),
      getNnPredictionExplain().catch(() => []),
    ]);
    return { neural, main, teamStats, explainRows };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export default async function NeuralPage(props: PageProps<"/neural">) {
  const result = await loadNeuralPage();

  if ("error" in result) {
    return (
      <section>
        <ModelTabs />
        <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Neural</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed">
          A second model that predicts goals and turns them into match probabilities.
        </p>
        <Card className="mt-8">
          <p className="font-semibold">Neural predictions are unavailable right now</p>
          <p className="mt-1 text-sm text-muted">{result.error}</p>
        </Card>
      </section>
    );
  }

  const { neural, main, teamStats, explainRows } = result;
  const latest = neural.reduce<NnPrediction | null>(
    (newest, prediction) =>
      newest === null || prediction.predicted_at > newest.predicted_at
        ? prediction
        : newest,
    null
  );
  const stale = isStale(latest?.predicted_at ?? null);

  if (neural.length === 0 || latest === null) {
    return (
      <section className="lg:w-[min(80rem,calc(100vw_-_2rem))] lg:ml-[calc((100%_-_min(80rem,calc(100vw_-_2rem)))/2)]">
        <ModelTabs />
        <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Neural</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed">
          A second model that predicts goals and turns them into match probabilities.
        </p>
        <p className="mt-2 max-w-2xl text-base text-muted">For fun only. Not betting advice.</p>
        <div className="mt-8 border-y border-border py-6">
          <p className="font-semibold">No neural net predictions yet</p>
          <p className="mt-1 text-sm text-muted">Check back after the neural network&apos;s next daily update.</p>
        </div>
      </section>
    );
  }

  const searchParams = await props.searchParams;
  const teams = [...new Set(neural.map((prediction) => prediction.home))].sort((a, b) =>
    a.localeCompare(b)
  );
  const initialPair = resolveInitialPair(searchParams, neural, teams);
  const allUpcoming = upcomingFixtures(neural);
  const nextRound = nextRoundFixtures(neural);
  const nextRoundKeys = new Set(nextRound.map((f) => `${f.home}|${f.away}|${f.fixture_date}`));
  const later = allUpcoming.filter(
    (fixture) => !nextRoundKeys.has(`${fixture.home}|${fixture.away}|${fixture.fixture_date}`)
  );

  return (
    <section className="lg:w-[min(80rem,calc(100vw_-_2rem))] lg:ml-[calc((100%_-_min(80rem,calc(100vw_-_2rem)))/2)]">
      <ModelTabs />
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Neural</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">
        A second model that predicts how many goals each team might score, then turns those goals into match probabilities.
      </p>
      <p className="mt-2 max-w-2xl text-base text-muted">For fun only. Not betting advice.</p>
      <p className="mt-3 text-sm font-semibold"><Link className="text-accent underline decoration-accent/40 underline-offset-4 hover:text-accent-dark" href="/neural/outlook">See the season outlook</Link></p>

      {stale && (
        <div className="mt-6 border-y border-border bg-tint p-6 text-ink">
          <p className="font-semibold">Predictions may be out of date</p>
          <p className="mt-1 text-sm text-muted">The latest neural net predictions were made more than two days ago.</p>
        </div>
      )}

      <NnMatchupTool
        predictions={neural}
        mainPredictions={main}
        teamStats={teamStats}
        teams={teams}
        initialHome={initialPair.home}
        initialAway={initialPair.away}
        explainRows={explainRows}
      />

      {later.length > 0 && <NnLaterFixtures fixtures={later} />}

      <Card className="mt-10">
        <h2 className="font-heading text-2xl font-semibold lg:text-3xl">About this model</h2>
        <div className="mt-4 space-y-4 leading-relaxed text-muted">
          <p>The neural network predicts how many goals each team is likely to score. It then turns those expected goals into home-win, draw and away probabilities.</p>
          <p>It looks at results and recent form: Elo rating, last-five form, home and away form, goal difference and rest days. It does not use bookmaker odds or xG.</p>
          <p>It was trained on Premier League seasons 2005 to 2025.</p>
          <p>On the last two full seasons (760 matches) it scored about the same as this site&apos;s main model, slightly better but within the noise, and a little behind the bookmakers&apos; odds.</p>
        </div>
        <p className="mt-6 border-t border-border pt-4 text-sm text-muted">
          {latest.model}, {latest.model_version}. Predicted {formatMelbourne(latest.predicted_at)}
        </p>
      </Card>
    </section>
  );
}
