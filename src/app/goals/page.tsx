import type { Metadata } from "next";
import Card from "@/components/Card";
import GoalsMatchupTool from "@/components/GoalsMatchupTool";
import ModelTabs from "@/components/ModelTabs";
import LinkButton from "@/components/LinkButton";
import { getGoalsPredictions, getNnTeamStats } from "@/lib/data";
import { nextRoundFixtures, resolveInitialPair, upcomingFixtures } from "@/lib/fixtures";
import { formatMelbourne } from "@/lib/format";
import { isStale } from "@/lib/jev";
import type { GoalsPrediction, NnTeamStats } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Linear goals",
  description: "A linear goal-difference model's Premier League match predictions.",
};

async function loadGoalsPage(): Promise<
  | { goals: GoalsPrediction[]; teamStats: NnTeamStats[] }
  | { error: string }
> {
  try {
    const [goals, teamStats] = await Promise.all([
      getGoalsPredictions(),
      getNnTeamStats().catch(() => []),
    ]);
    return { goals, teamStats };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export default async function GoalsPage(props: PageProps<"/goals">) {
  const result = await loadGoalsPage();

  if ("error" in result) {
    return (
      <section>
        <ModelTabs />
        <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Linear goals</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed">A straight-line model that predicts the expected goal margin, then turns it into match probabilities.</p>
        <Card className="mt-8">
          <p className="font-semibold">Linear goals predictions are unavailable right now</p>
          <p className="mt-1 text-sm text-muted">{result.error}</p>
        </Card>
      </section>
    );
  }

  const { goals, teamStats } = result;
  const latest = goals.reduce<GoalsPrediction | null>(
    (newest, prediction) => newest === null || prediction.predicted_at > newest.predicted_at ? prediction : newest,
    null
  );

  if (goals.length === 0 || latest === null) {
    return (
      <section className="lg:w-[min(80rem,calc(100vw_-_2rem))] lg:ml-[calc((100%_-_min(80rem,calc(100vw_-_2rem)))/2)]">
        <ModelTabs />
        <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Linear goals</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed">A straight-line model that predicts the expected goal margin, then turns it into match probabilities.</p>
        <p className="mt-2 max-w-2xl text-base text-muted">For fun only. Not betting advice.</p>
        <div className="mt-8 border-y border-border py-6">
          <p className="font-semibold">No predictions yet</p>
          <p className="mt-1 text-sm text-muted">Check back after the linear goals model&apos;s next daily update.</p>
        </div>
      </section>
    );
  }

  const searchParams = await props.searchParams;
  const teams = [...new Set(goals.map((prediction) => prediction.home))].sort((a, b) => a.localeCompare(b));
  const initialPair = resolveInitialPair(searchParams, goals, teams);
  const allUpcoming = upcomingFixtures(goals);
  const nextRound = nextRoundFixtures(goals);
  const nextRoundKeys = new Set(nextRound.map((fixture) => `${fixture.home}|${fixture.away}|${fixture.fixture_date}`));
  const later = allUpcoming.filter((fixture) => !nextRoundKeys.has(`${fixture.home}|${fixture.away}|${fixture.fixture_date}`));
  const stale = isStale(latest.predicted_at);

  return (
    <section className="lg:w-[min(80rem,calc(100vw_-_2rem))] lg:ml-[calc((100%_-_min(80rem,calc(100vw_-_2rem)))/2)]">
      <ModelTabs />
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Linear goals</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">A straight-line model that predicts the expected goal margin, then turns it into match probabilities.</p>
      <p className="mt-2 max-w-2xl text-base text-muted">For fun only. Not betting advice.</p>
      {stale && (
        <div className="mt-6 border-y border-border bg-tint p-6 text-ink">
          <p className="font-semibold">Predictions may be out of date</p>
          <p className="mt-1 text-sm text-muted">The latest linear goals predictions were made more than two days ago.</p>
        </div>
      )}
      <GoalsMatchupTool predictions={goals} teamStats={teamStats} teams={teams} initialHome={initialPair.home} initialAway={initialPair.away} laterFixtures={later} />
      <Card className="mt-10">
        <h2 className="font-heading text-2xl font-semibold lg:text-3xl">About this model</h2>
        <div className="mt-4 space-y-4 leading-relaxed text-muted">
          <p>It predicts the goal difference of a match with a straight-line model, assumes the real difference scatters around that in a bell curve, and reads home-win, draw and away-win chances off the curve.</p>
          <p>It uses the same inputs as the neural network: Elo, last-five and venue form, goal difference trends and rest days. No bookmaker odds and no xG.</p>
          <p>It was trained on Premier League seasons 2005 to 2025.</p>
          <p>The goals shown for each side come from two extra straight-line models, one for home goals and one for away goals, on the same inputs. They are averages, not predicted scores, and they are not separately tested: the track record scores home, draw and away, not goal totals. The totals can differ a little from the neural network&apos;s.</p>
          <p>On the 2012 to 2023 backtest (4,560 matches) it scored slightly better than a standard win-draw-loss model. On the last two full seasons (760 matches) the difference shrank to within the noise.</p>
          <p>It gives draws a little too little probability, roughly 21 to 22% on average against about 24% of real matches, and it is behind the bookmakers&apos; odds. Its live record has only just started.</p>
        </div>
        <p className="mt-6 border-t border-border pt-4 text-sm text-muted">{latest.model}, {latest.model_version}. Predicted {formatMelbourne(latest.predicted_at)}</p>
      </Card>
       <LinkButton href="/track-record" variant="cta" className="mt-6">See how this model has done</LinkButton>
    </section>
  );
}
