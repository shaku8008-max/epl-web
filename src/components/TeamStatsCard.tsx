// Side-by-side pre-match stats for the two selected teams. Pure display:
// the server passes all team_stats rows once, so changing the picker updates
// instantly with no extra requests. Rendered inside MatchupTool.

import Card from "@/components/Card";
import { formatMelbourne } from "@/lib/format";
import {
  betterSide,
  eloRank,
  formatStatValue,
  STAT_GROUPS,
  STAT_ROWS,
} from "@/lib/stats";
import type { TeamStats } from "@/lib/types";

type TeamStatsCardProps = {
  home: string;
  away: string;
  teamStats: TeamStats[];
};

export default function TeamStatsCard({ home, away, teamStats }: TeamStatsCardProps) {
  const homeRow = teamStats.find((r) => r.team === home) ?? null;
  const awayRow = teamStats.find((r) => r.team === away) ?? null;

  // A selected team with no row at all: show a message instead of the table.
  if (!homeRow || !awayRow) {
    const missing = !homeRow ? home : away;
    return (
      <Card>
        <h2 className="font-heading text-xl font-semibold">Team stats</h2>
        <p className="mt-2 text-sm text-muted">
          No stats found for {missing} yet. Predictions above still work.
        </p>
      </Card>
    );
  }

  const homeEloRank = eloRank(home, teamStats);
  const awayEloRank = eloRank(away, teamStats);

  // Freshness: the newest updated_at across all rows (nulls ignored).
  const latestUpdate = teamStats
    .map((r) => r.updated_at)
    .filter((t): t is string => t !== null)
    .sort()
    .at(-1);

  return (
    <Card>
      <h2 className="font-heading text-xl font-semibold">Team stats</h2>

      <div className="mt-4 overflow-x-hidden">
        <table className="w-full table-fixed text-sm">
          {/* Fixed thirds: narrow side columns so long team names wrap instead
              of pushing the table wider than a 360 px phone. */}
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[40%]" />
            <col className="w-[30%]" />
          </colgroup>
          <thead>
            <tr className="align-bottom">
              <th scope="col" className="pb-2 text-left font-semibold">
                {home} <span className="font-normal text-muted">(home)</span>
              </th>
              <th scope="col" className="pb-2 font-normal text-muted">
                <span className="sr-only">Stat</span>
              </th>
              <th scope="col" className="pb-2 text-right font-semibold">
                {away} <span className="font-normal text-muted">(away)</span>
              </th>
            </tr>
          </thead>
          {STAT_GROUPS.map((group) => (
            <tbody key={group}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={3}
                  className="pb-1 pt-4 text-left font-heading text-xs font-semibold uppercase tracking-wide text-muted"
                >
                  {group}
                </th>
              </tr>
              {STAT_ROWS.filter((def) => def.group === group).map((def) => {
                const homeValue = homeRow[def.key];
                const awayValue = awayRow[def.key];
                const leader = betterSide(homeValue, awayValue, def.betterWhen);
                const homeWins = leader === "home";
                const awayWins = leader === "away";

                // Bold carries the meaning; the tint is decoration only so
                // colour is never the only signal.
                const homeClasses = homeWins
                  ? "bg-home/10 font-bold text-ink"
                  : "text-muted";
                const awayClasses = awayWins
                  ? "bg-away/10 font-bold text-ink"
                  : "text-muted";

                return (
                  <tr key={def.key} className="border-t border-border">
                    <td className={`px-2 py-2 text-left tabular-nums ${homeClasses}`}>
                      {formatStatValue(def, homeValue, homeEloRank)}
                    </td>
                    <th scope="row" className="px-1 py-2 text-center font-medium text-ink">
                      {def.label}
                    </th>
                    <td className={`px-2 py-2 text-right tabular-nums ${awayClasses}`}>
                      {formatStatValue(def, awayValue, awayEloRank)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer rounded-card font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          What do these mean?
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          <li>
            Elo rating: a rating that rises with wins and falls with losses,
            adjusted for opponent strength. 1500 is roughly average.
          </li>
          <li>
            Per game, last 5/10: averages over the team&apos;s most recent 5 or
            10 Premier League matches — never season totals.
          </li>
          <li>
            xG (expected goals): how many goals a team&apos;s chances would
            typically produce. Steadier than actual goals for judging performance.
          </li>
          <li>
            xG difference trend: xG for minus xG against, weighted towards recent
            matches. Positive means the team has been creating more than it concedes.
          </li>
          <li>
            For promoted teams, &quot;last 5&quot; and &quot;last 10&quot; can reach
            back to their previous Premier League season, and teams with no recent
            Premier League history have fewer matches behind their numbers.
          </li>
        </ul>
      </details>

      <p className="mt-4 text-xs text-muted">
        Stats updated: {latestUpdate ? formatMelbourne(latestUpdate) : "unavailable"}
      </p>
    </Card>
  );
}
