// Side-by-side pre-match stats for the two selected teams. Animated values
// count here so only this card re-renders per frame.

"use client";

import { memo, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Card from "@/components/Card";
import {
  ANIM_EASE_CSS,
  ANIM_MS,
  fadeInStyle,
  useAnimatedNumber,
  useHasChanged,
} from "@/lib/animate";
import { formatMelbourne } from "@/lib/format";
import {
  betterSide,
  eloRank,
  formatStatValue,
  ordinal,
  STAT_GROUPS,
  STAT_ROWS,
} from "@/lib/stats";
import type { StatRowDef } from "@/lib/stats";
import type { TeamStats } from "@/lib/types";

type TeamStatsCardProps = {
  home: string;
  away: string;
  teamStats: TeamStats[];
};

// One animated numeric cell. Keeps its format while counting (2 decimals,
// signed trends through zero, whole-number Elo); a null on either side fades
// instantly instead of counting. The visible number is aria-hidden; the
// card's sr-only live region announces final values only.
const CountedStat = memo(function CountedStat({
  def,
  value,
  rank,
  animate,
}: {
  def: StatRowDef;
  value: number | null;
  rank: number | null;
  animate: boolean;
}) {
  const [display, done] = useAnimatedNumber(value);
  const instant = value === null || display === null;
  // "–" switches fade in via the shared mount animation instead of counting.
  if (instant) {
    const dash = formatStatValue(def, value, rank);
    return (
      <span
        key={dash}
        aria-hidden="true"
        className={`inline-block tabular-nums${animate ? " epl-anim" : ""}`}
        style={fadeInStyle(animate)}
      >
        {dash}
      </span>
    );
  }
  // Elo counts whole numbers; the rank text appears when the count finishes.
  let text: string;
  if (def.format === "elo") {
    const whole = Math.round(display as number).toString();
    text = rank === null || !done ? whole : `${whole} (${ordinal(rank)})`;
  } else if (def.format === "signed2") {
    text = formatSignedFromNumber(display as number);
  } else {
    text = (display as number).toFixed(2);
  }
  return (
    <span aria-hidden="true" className="inline-block tabular-nums">
      {text}
    </span>
  );
});

// Formats a non-null counted number as a signed trend, reusing the same
// rounding rule as formatSigned2 (tiny negatives show as +0.00).
function formatSignedFromNumber(n: number): string {
  const rounded = Number(n.toFixed(2));
  if (rounded < 0) return `−${Math.abs(rounded).toFixed(2)}`;
  return `+${rounded.toFixed(2)}`;
}

// Visible text that fades in on change (column titles, freshness line).
// Keyed mount animation like the prediction headings; aria-hidden with the
// final text in the card's sr-only live region.
function FadeSpan({ text, animate }: { text: string; animate: boolean }) {
  return (
    <span
      key={text}
      aria-hidden="true"
      className={`inline-block${animate ? " epl-anim" : ""}`}
      style={fadeInStyle(animate)}
    >
      {text}
    </span>
  );
}

// One comparison row: two counted cells plus a fading winner tint. The tint
// transitions via CSS background-color; bold switches only when the target
// leader is settled, so nothing flickers mid-count. Keyed by matchup above,
// so a new selection resets the shown leader without syncing state in render.
const StatRow = memo(function StatRow({
  def,
  targetLeader,
  homeCell,
  awayCell,
  animate,
}: {
  def: StatRowDef;
  targetLeader: "home" | "away" | null;
  homeCell: ReactNode;
  awayCell: ReactNode;
  animate: boolean;
}) {
  const [shownLeader, setShownLeader] = useState(targetLeader);
  useEffect(() => {
    if (!animate || shownLeader === targetLeader) return;
    const id = setTimeout(() => setShownLeader(targetLeader), ANIM_MS);
    return () => clearTimeout(id);
  }, [targetLeader, animate, shownLeader]);

  // Bold carries the meaning; the tint is decoration only so colour is never
  // the only signal. Background colour transitions via inline style (same
  // duration/easing as the counts); Tailwind cannot take the shared constant.
  const tintStyle = { transition: `background-color ${ANIM_MS}ms ${ANIM_EASE_CSS}` };
  const homeClasses = shownLeader === "home" ? "bg-home/10 font-bold text-ink" : "text-muted";
  const awayClasses = shownLeader === "away" ? "bg-away/10 font-bold text-ink" : "text-muted";

  return (
    <tr className="border-t border-border">
      <td className={`px-2 py-2 text-left${animate ? " epl-anim" : ""} ${homeClasses}`} style={tintStyle}>
        {homeCell}
      </td>
      <th scope="row" className="px-1 py-2 text-center font-medium text-ink">
        {def.label}
      </th>
      <td className={`px-2 py-2 text-right${animate ? " epl-anim" : ""} ${awayClasses}`} style={tintStyle}>
        {awayCell}
      </td>
    </tr>
  );
});

export default function TeamStatsCard({ home, away, teamStats }: TeamStatsCardProps) {
  // Animate only after the first selection change, never on page load.
  const animate = useHasChanged(`${home}|${away}`);
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
  const freshnessText = `Stats updated: ${latestUpdate ? formatMelbourne(latestUpdate) : "unavailable"}`;

  // Final values only for the live region: intermediates stay silent.
  const liveSummary =
    `Team stats, ${home} at home against ${away}. ` +
    STAT_ROWS.map((def) => {
      const hv = formatStatValue(def, homeRow[def.key], homeEloRank);
      const av = formatStatValue(def, awayRow[def.key], awayEloRank);
      return `${def.label}: ${home} ${hv}, ${away} ${av}`;
    }).join(". ");

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
                <FadeSpan text={home} animate={animate} />{" "}
                <span className="font-normal text-muted">(home)</span>
              </th>
              <th scope="col" className="pb-2 font-normal text-muted">
                <span className="sr-only">Stat</span>
              </th>
              <th scope="col" className="pb-2 text-right font-semibold">
                <FadeSpan text={away} animate={animate} />{" "}
                <span className="font-normal text-muted">(away)</span>
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
              {STAT_ROWS.filter((def) => def.group === group).map((def) => (
                <StatRow
                  key={`${def.key}|${home}|${away}`}
                  def={def}
                  targetLeader={betterSide(homeRow[def.key], awayRow[def.key], def.betterWhen)}
                  homeCell={
                    <CountedStat
                      def={def}
                      value={homeRow[def.key]}
                      rank={homeEloRank}
                      animate={animate}
                    />
                  }
                  awayCell={
                    <CountedStat
                      def={def}
                      value={awayRow[def.key]}
                      rank={awayEloRank}
                      animate={animate}
                    />
                  }
                  animate={animate}
                />
              ))}
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
        <FadeSpan text={freshnessText} animate={animate} />
        <span className="sr-only" role="status">
          {freshnessText}. {liveSummary}
        </span>
      </p>
    </Card>
  );
}
