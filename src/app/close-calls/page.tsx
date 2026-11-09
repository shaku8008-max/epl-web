import type { Metadata } from "next";
import Card from "@/components/Card";
import LinkButton from "@/components/LinkButton";
import ModelTabs from "@/components/ModelTabs";
import {
  getGoalsPredictions,
  getNnPredictions,
  getPredictions,
  getTrackRecord,
} from "@/lib/data";
import { formatDateOnly, toWholePercentages } from "@/lib/format";
import { modelColour, modelLabel, trackedModels } from "@/lib/trackRecord";
import type { GoalsPrediction, NnPrediction, Prediction, TrackRecord } from "@/lib/types";
import {
  CLOSE_CALL_GAP,
  compareScoredMatches,
  compareUpcomingFixtures,
  countScoredMultiModelMatches,
  disagreementTallies,
  scoredCloseCalls,
  type FixtureComparison,
  type ModelComparison,
  type ModelPrediction,
  type Outcome,
} from "@/lib/closeCalls";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Close calls and disagreements",
  description: "A descriptive look at model disagreements and near coin flips.",
};

type Source<T> = { rows: T[]; failed: boolean };

async function loadSource<T>(loader: () => Promise<T[]>): Promise<Source<T>> {
  try {
    return { rows: await loader(), failed: false };
  } catch {
    return { rows: [], failed: true };
  }
}

function outcomeLabel(outcome: Outcome | null): string {
  return outcome === "H" ? "Home" : outcome === "D" ? "Draw" : outcome === "A" ? "Away" : "not available";
}

function outcomeClass(outcome: Outcome): string {
  return outcome === "H" ? "text-better" : outcome === "D" ? "text-draw" : "text-worse";
}

function probabilityLine(model: ModelComparison) {
  const values = toWholePercentages(model.probabilities.home, model.probabilities.draw, model.probabilities.away);
  return <span className="font-tabular text-sm text-muted">H {values.home}% · D {values.draw}% · A {values.away}%</span>;
}

function gapLabel(value: number): string {
  return `gap ${Math.round(value * 100)} pts`;
}

function ModelMark({ modelKey }: { modelKey: string }) {
  const colour = modelColour(modelKey);
  return <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: colour.line }} /><span className={colour.text}>{modelLabel(modelKey)}</span></span>;
}

function ModelPredictionRow({ comparison, modelKey }: { comparison: FixtureComparison; modelKey: string }) {
  const model = comparison.models.find((item) => item.modelKey === modelKey);
  return <div className="grid gap-1 border-t border-border py-3 sm:grid-cols-[minmax(10rem,1fr)_minmax(8rem,auto)_auto] sm:items-center sm:gap-4">
    <ModelMark modelKey={modelKey} />
    {model ? <><span className={`font-semibold ${outcomeClass(model.pick)}`}>{outcomeLabel(model.pick)}</span><span className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:justify-end">{probabilityLine(model)}{model.gap <= CLOSE_CALL_GAP && <span className="text-sm font-semibold text-muted">{gapLabel(model.gap)}</span>}</span></> : <span className="text-sm text-muted sm:col-span-2">not available</span>}
  </div>;
}

function FlagTags({ comparison }: { comparison: FixtureComparison }) {
  return <div className="flex flex-wrap gap-2">
    {comparison.disagreement && <span className="rounded-full border border-edge bg-tint px-2.5 py-1 text-xs font-semibold text-ink">Models disagree</span>}
    {comparison.closeCall && <span className="rounded-full border border-edge bg-tint px-2.5 py-1 text-xs font-semibold text-ink">Close call</span>}
  </div>;
}

function NextRoundSection({ comparisons, failed }: { comparisons: FixtureComparison[]; failed: boolean }) {
  const flagged = comparisons.filter((comparison) => comparison.disagreement || comparison.closeCall).sort((a, b) => Number(b.disagreement) - Number(a.disagreement) || (a.smallestGap ?? 1) - (b.smallestGap ?? 1));
  return <section className="mt-10" aria-labelledby="next-round-heading">
    <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="next-round-heading" className="font-heading text-2xl font-semibold">Next round</h2>{comparisons.length > 0 && <p className="text-sm font-semibold text-muted">{flagged.length} of {comparisons.length} next-round fixtures are flagged</p>}</div>
    {failed && comparisons.length === 0 ? <p className="mt-4 text-muted">Upcoming model predictions are unavailable right now.</p> : comparisons.length === 0 ? <p className="mt-4 text-muted">No upcoming next-round predictions are available yet.</p> : flagged.length === 0 ? <p className="mt-4 text-muted">The models agree on every fixture in the next round and none is a close call.</p> : <div className="mt-4 grid gap-4">{flagged.map((comparison) => <Card key={comparison.key}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-heading text-xl font-semibold">{comparison.home} v {comparison.away}</h3><p className="mt-1 text-sm text-muted">{formatDateOnly(comparison.fixture_date)}</p></div><FlagTags comparison={comparison} /></div>
      <div className="mt-4">{trackedModels.map((model) => <ModelPredictionRow key={model.key} comparison={comparison} modelKey={model.key} />)}</div>
    </Card>)}</div>}
  </section>;
}

function ScoredDisagreementsSection({ comparisons, rows, failed }: { comparisons: FixtureComparison[]; rows: TrackRecord[]; failed: boolean }) {
  const tallies = disagreementTallies(comparisons);
  const modelHeaders = trackedModels;
  return <section className="mt-12" aria-labelledby="scored-disagreements-heading">
    <h2 id="scored-disagreements-heading" className="font-heading text-2xl font-semibold">Scored matches where the models disagreed</h2>
    {failed && comparisons.length === 0 ? <p className="mt-4 text-muted">The scored track record is unavailable right now.</p> : comparisons.length === 0 ? <p className="mt-4 text-muted">No scored matches have disagreements yet. {countScoredMultiModelMatches(rows)} matches have been scored by more than one model so far.</p> : <>
      <div className="mt-4 overflow-x-auto rounded-card border border-edge bg-white"><table className="w-full min-w-[58rem] text-left text-sm"><caption className="sr-only">Scored matches where model picks disagreed</caption><thead className="border-b border-border bg-tint text-xs uppercase tracking-wide text-muted"><tr><th scope="col" className="px-4 py-3">Match</th>{modelHeaders.map((model) => <th scope="col" key={model.key} className="px-4 py-3"><ModelMark modelKey={model.key} /></th>)}</tr></thead><tbody className="divide-y divide-border">{comparisons.map((comparison) => <tr key={comparison.key}><th scope="row" className="px-4 py-3 font-medium"><span className="block">{comparison.home} v {comparison.away}</span><span className="mt-1 block text-xs font-normal text-muted">{formatDateOnly(comparison.fixture_date)}</span></th>{modelHeaders.map((model) => { const item = comparison.models.find((candidate) => candidate.modelKey === model.key); return <td key={model.key} className="px-4 py-3 align-top">{item ? <><span className={`font-semibold ${outcomeClass(item.pick)}`}>{outcomeLabel(item.pick)}</span><span className="mt-1 block text-xs text-muted">{item.correct === true ? "✓ Correct" : item.correct === false ? "✕ Incorrect" : "Correctness unavailable"}</span><span className="mt-1 block text-xs text-muted">Actual: {outcomeLabel(comparison.actual)}</span></> : <span className="text-muted">not available</span>}</td>; })}</tr>)}</tbody></table></div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">{modelHeaders.map((model) => { const tally = tallies.get(model.key) ?? { right: 0, total: 0 }; return <span key={model.key}><ModelMark modelKey={model.key} />: Right in <span className="font-tabular text-ink">{tally.right} of {tally.total}</span> disagreements</span>; })}</div>
    </>}
  </section>;
}

function ScoredCloseCallsSection({ comparisons, failed }: { comparisons: FixtureComparison[]; failed: boolean }) {
  const closeRows = comparisons.flatMap((comparison) => comparison.models.map((model) => ({ comparison, model }))).sort((a, b) => b.comparison.fixture_date.localeCompare(a.comparison.fixture_date));
  return <section className="mt-12" aria-labelledby="scored-close-calls-heading">
    <h2 id="scored-close-calls-heading" className="font-heading text-2xl font-semibold">Scored close calls</h2>
    {failed && closeRows.length === 0 ? <p className="mt-4 text-muted">The scored close-call record is unavailable right now.</p> : <>
      <div className="mt-4 overflow-x-auto rounded-card border border-edge bg-white"><table className="w-full min-w-[38rem] text-left text-sm"><caption className="sr-only">Scored close-call totals by model</caption><thead className="border-b border-border bg-tint text-xs uppercase tracking-wide text-muted"><tr><th scope="col" className="px-4 py-3">Model</th><th scope="col" className="px-4 py-3">Close calls</th><th scope="col" className="px-4 py-3">Correct</th></tr></thead><tbody className="divide-y divide-border">{trackedModels.map((model) => { const modelRows = closeRows.filter((row) => row.model.modelKey === model.key); const correct = modelRows.filter((row) => row.model.correct === true).length; return <tr key={model.key}><th scope="row" className="px-4 py-3 font-medium"><ModelMark modelKey={model.key} /></th><td className="px-4 py-3 font-tabular">{modelRows.length === 0 ? "None yet" : modelRows.length}</td><td className="px-4 py-3 font-tabular">{modelRows.length === 0 ? "None yet" : `${correct} (${Math.round((correct / modelRows.length) * 100)}%)`}</td></tr>; })}</tbody></table></div>
      {closeRows.length > 0 ? <div className="mt-6 overflow-x-auto rounded-card border border-edge bg-white"><table className="w-full min-w-[48rem] text-left text-sm"><caption className="sr-only">The ten most recent scored close calls</caption><thead className="border-b border-border bg-tint text-xs uppercase tracking-wide text-muted"><tr><th scope="col" className="px-4 py-3">Fixture</th><th scope="col" className="px-4 py-3">Model</th><th scope="col" className="px-4 py-3">Pick</th><th scope="col" className="px-4 py-3">Gap</th><th scope="col" className="px-4 py-3">Result</th></tr></thead><tbody className="divide-y divide-border">{closeRows.slice(0, 10).map(({ comparison, model }) => <tr key={`${comparison.key}-${model.modelKey}`}><th scope="row" className="px-4 py-3 font-medium"><span className="block">{comparison.home} v {comparison.away}</span><span className="mt-1 block text-xs font-normal text-muted">{formatDateOnly(comparison.fixture_date)}</span></th><td className="px-4 py-3"><ModelMark modelKey={model.modelKey} /></td><td className={`px-4 py-3 font-semibold ${outcomeClass(model.pick)}`}>{outcomeLabel(model.pick)}</td><td className="px-4 py-3 font-tabular">{gapLabel(model.gap)}</td><td className="px-4 py-3">{model.correct === true ? "✓ Correct" : model.correct === false ? "✕ Incorrect" : "Correctness unavailable"}</td></tr>)}</tbody></table></div> : <p className="mt-4 text-muted">No scored close calls yet.</p>}
    </>}
  </section>;
}

function toModelPredictions(main: Prediction[], neural: NnPrediction[], goals: GoalsPrediction[]): ModelPrediction[] {
  return [
    ...main.map((row) => ({ ...row, modelKey: "lean" })),
    ...neural.map((row) => ({ ...row, modelKey: "nn" })),
    ...goals.map((row) => ({ ...row, modelKey: "goals" })),
  ];
}

export default async function CloseCallsPage() {
  const [main, neural, goals, scored] = await Promise.all([
    loadSource(getPredictions),
    loadSource(getNnPredictions),
    loadSource(getGoalsPredictions),
    loadSource(getTrackRecord),
  ]);
  const upcomingComparisons = compareUpcomingFixtures(toModelPredictions(main.rows, neural.rows, goals.rows));
  const disagreementComparisons = compareScoredMatches(scored.rows);
  const closeComparisons = scoredCloseCalls(scored.rows);
  const upcomingLoadFailed = main.failed || neural.failed || goals.failed;

  return <section className="lg:w-[min(80rem,calc(100vw_-_2rem))] lg:ml-[calc((100%_-_min(80rem,calc(100vw_-_2rem)))/2)]">
    <ModelTabs />
    <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Close calls and disagreements</h1>
    <p className="mt-3 max-w-2xl text-lg leading-relaxed">A descriptive look at where the three models split and where a prediction was nearly a coin flip.</p>
    <Card className="mt-6"><h2 className="font-heading text-xl font-semibold">How we define them</h2><p className="mt-3 max-w-3xl leading-relaxed text-muted">A close call means a model&apos;s top two outcomes are within 6 percentage points. A disagreement means at least two available models pick different outcomes. The numbers here are small, so read them as a snapshot rather than a verdict.</p></Card>
    <NextRoundSection comparisons={upcomingComparisons} failed={upcomingLoadFailed} />
    <ScoredDisagreementsSection comparisons={disagreementComparisons} rows={scored.rows} failed={scored.failed} />
    <ScoredCloseCallsSection comparisons={closeComparisons} failed={scored.failed} />
    <Card className="mt-12"><h2 className="font-heading text-xl font-semibold">A note about these comparisons</h2><p className="mt-3 leading-relaxed text-muted">These counts are tiny. A close call is not a bad prediction, and a disagreement is not a verdict on which model is better. None of these models beats the bookmaker. This is a learning project, not betting advice.</p></Card>
    <div className="mt-8 flex flex-wrap gap-3"><LinkButton href="/track-record" variant="cta">Back to the track record</LinkButton><LinkButton href="/lean" variant="secondary">Try a matchup</LinkButton></div>
  </section>;
}
