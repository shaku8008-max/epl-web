import type { Metadata } from "next";
import Card from "@/components/Card";
import FinishChances from "@/components/FinishChances";
import ModelTabs from "@/components/ModelTabs";
import { getSeasonOutlook } from "@/lib/data";
import { formatMelbourne } from "@/lib/format";
import { formatChance, tintForChance } from "@/lib/outlook";
import type { SeasonOutlook } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Season outlook",
  description: "A Neural network simulation of where Premier League teams may finish.",
};

async function loadOutlook(): Promise<SeasonOutlook[] | { error: string }> {
  try {
    return await getSeasonOutlook();
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

function signedGoalDifference(value: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "–";
  return value > 0 ? `+${value}` : `${value}`;
}

function wholeNumber(value: number | null): string {
  return typeof value === "number" && Number.isFinite(value) ? String(Math.round(value)) : "–";
}

function expectedPoints(value: number | null): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(1) : "–";
}

function chanceCellClass(value: number | null): string {
  return `px-3 py-3 font-tabular text-ink ${value !== null && Number.isFinite(value) && value >= 0.5 ? "font-semibold" : ""}`;
}

export default async function SeasonOutlookPage() {
  const result = await loadOutlook();
  const rows = "error" in result ? [] : result;
  const latest = rows.reduce<string | null>((newest, row) => row.updated_at && (!newest || row.updated_at > newest) ? row.updated_at : newest, null);

  return (
    <section className="lg:w-[min(80rem,calc(100vw_-_2rem))] lg:ml-[calc((100%_-_min(80rem,calc(100vw_-_2rem)))/2)]">
      <ModelTabs />
      <h1 className="font-heading text-4xl font-bold tracking-tight text-primary lg:text-5xl">Season outlook</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">We play out the rest of the season 10,000 times using the Neural network&apos;s expected goals, then count how often each team finishes where.</p>

      <Card className="mt-8" variant="white">
        <h2 className="font-heading text-xl font-semibold">A simulation, not a certain forecast</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-muted">
          <li>This is a simulation, not a forecast we are sure of. Percentages are how often something happened across 10,000 simulated seasons.</li>
          <li>Later fixtures use each team&apos;s form as of today. Team strength does not update as the simulated season goes on, and injuries, transfers and the model being wrong about a team are not allowed for. So very high and very low percentages are probably more extreme than they should be.</li>
          <li>Tie-breaks use goal difference then goals scored (the real league uses head-to-head after that).</li>
          <li>Lean and the Neural network are statistically tied on the 760-match backtest, so treat this as one reasonable view, not the answer.</li>
          <li>Only the Neural network drives this page. There is no Lean outlook.</li>
        </ul>
      </Card>

      {"error" in result ? (
        <Card className="mt-8"><p className="font-semibold">The season outlook is unavailable right now</p><p className="mt-1 text-sm text-muted">{result.error}</p></Card>
      ) : result.length === 0 ? (
        <p className="mt-8 border-y border-border py-6 text-muted">The season outlook is not available yet.</p>
      ) : (
        <Card className="mt-8 p-0" variant="white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[72rem] text-left text-sm">
              <caption className="sr-only">Season outlook sorted by expected points</caption>
              <thead className="border-b border-border bg-tint text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="sticky left-0 z-20 w-12 bg-tint px-3 py-3 text-right">#</th>
                  <th scope="col" className="sticky left-12 z-20 w-44 bg-tint px-3 py-3">Team</th>
                  <th scope="col" className="px-3 py-3">Played</th>
                  <th scope="col" className="px-3 py-3">Points</th>
                  <th scope="col" className="px-3 py-3">Goal diff</th>
                  <th scope="col" className="px-3 py-3">Expected points</th>
                  <th scope="col" className="px-3 py-3">Title %</th>
                  <th scope="col" className="px-3 py-3">Top 4 %</th>
                  <th scope="col" className="px-3 py-3">Bottom 3 %</th>
                  <th scope="col" className="px-3 py-3">Finish chances</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.map((row, index) => (
                  <tr key={`${row.team ?? "team"}-${index}`} className="group hover:bg-tint">
                    <td className="sticky left-0 z-10 bg-white px-3 py-3 text-right font-tabular text-muted group-hover:bg-tint">{index + 1}</td>
                    <th scope="row" className="sticky left-12 z-10 bg-white px-3 py-3 font-semibold group-hover:bg-tint">{row.team ?? "Team unavailable"}</th>
                    <td className="px-3 py-3 font-tabular">{wholeNumber(row.played)}</td>
                    <td className="px-3 py-3 font-tabular">{wholeNumber(row.points)}</td>
                    <td className={`px-3 py-3 font-tabular font-semibold ${row.goal_diff === null ? "text-muted" : row.goal_diff > 0 ? "text-better" : row.goal_diff < 0 ? "text-worse" : "text-muted"}`}>{signedGoalDifference(row.goal_diff)}</td>
                    <td className="px-3 py-3 font-tabular">{expectedPoints(row.expected_points)}</td>
                    <td className={chanceCellClass(row.p_title)} style={{ backgroundColor: tintForChance(row.p_title, "better") }}>{formatChance(row.p_title)}</td>
                    <td className={chanceCellClass(row.p_top4)} style={{ backgroundColor: tintForChance(row.p_top4, "better") }}>{formatChance(row.p_top4)}</td>
                    <td className={chanceCellClass(row.p_relegation)} style={{ backgroundColor: tintForChance(row.p_relegation, "worse") }}>{formatChance(row.p_relegation)}</td>
                    <td className="px-3 py-3"><FinishChances probabilities={row.position_probs} team={row.team ?? `team-${index}`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-xs text-muted" aria-label="Finish chance colour legend">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-better" />
              Title and top 4
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-rule-strong" />
              Mid-table
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-worse" />
              Bottom 3
            </span>
            <span>Darker cell = higher chance.</span>
          </div>
        </Card>
      )}
      <p className="mt-3 text-sm text-muted">Last updated: {latest ? formatMelbourne(latest) : "unavailable"}</p>
    </section>
  );
}
