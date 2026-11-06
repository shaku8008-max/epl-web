// Side-by-side input statistics for the two selected teams. This follows the
// Predict page's card so values count and the better side moves smoothly when
// the selected matchup changes.

"use client";

import { memo, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Card from "@/components/Card";
import { statColour } from "@/lib/colour";
import {
  ANIM_EASE_CSS,
  ANIM_MS,
  fadeInStyle,
  fadeOutStyle,
  RIPPLE_MS,
  TEXT_MS,
  useAnimatedNumber,
  useHasChanged,
  usePrefersReducedMotion,
} from "@/lib/animate";
import { formatMelbourne } from "@/lib/format";
import {
  betterSide,
  formatNnStatValue,
  nnEloRank,
  NN_STAT_GROUPS,
  NN_STAT_ROWS,
} from "@/lib/nnStats";
import type { NnStatRowDef } from "@/lib/nnStats";
import type { NnTeamStats } from "@/lib/types";

type NnTeamStatsCardProps = {
  home: string;
  away: string;
  teamStats: NnTeamStats[];
};

// One animated statistic. Null values switch to a dash instead of counting;
// the visible value is hidden from screen readers and announced below once.
const CountedStat = memo(function CountedStat({
  def,
  value,
  rank,
  animate,
  delayMs,
}: {
  def: NnStatRowDef;
  value: number | null;
  rank: number | null;
  animate: boolean;
  delayMs: number;
}) {
  const [display, done] = useAnimatedNumber(value, animate ? delayMs : 0);
  const instant = value === null || display === null;
  const flipKey = `${def.id}-${instant ? "dash" : "num"}`;

  if (instant) {
    return (
      <span
        key={flipKey}
        aria-hidden="true"
        className={`inline-block font-tabular${animate ? " epl-anim" : ""}`}
        style={fadeInStyle(animate)}
      >
        {formatNnStatValue(def, value, rank)}
      </span>
    );
  }

  const shownRank = def.format === "elo" && done ? rank : null;
  return (
    <span
      key={flipKey}
      aria-hidden="true"
      className={`inline-block font-tabular${animate ? " epl-anim" : ""}`}
      style={fadeInStyle(animate)}
    >
      {formatNnStatValue(def, display, shownRank)}
    </span>
  );
});

// Team names and the freshness line crossfade on a pair change while retaining
// their space, so the rows below do not jump as the selected teams change.
function FadeSpan({ text, animate }: { text: string; animate: boolean }) {
  const [current, setCurrent] = useState(text);
  const [outgoing, setOutgoing] = useState<string | null>(null);

  if (current !== text) {
    if (animate) setOutgoing(current);
    setCurrent(text);
  }

  useEffect(() => {
    if (outgoing === null) return;
    const id = setTimeout(() => setOutgoing(null), TEXT_MS);
    return () => clearTimeout(id);
  }, [outgoing]);

  return (
    <span className="inline-grid">
      {outgoing !== null && (
        <span
          aria-hidden="true"
          className="col-start-1 row-start-1 epl-anim"
          style={fadeOutStyle()}
        >
          {outgoing}
        </span>
      )}
      <span
        key={current}
        aria-hidden="true"
        className={`col-start-1 row-start-1${animate ? " epl-anim" : ""}`}
        style={fadeInStyle(animate)}
      >
        {current}
      </span>
      <span className="sr-only">{current}</span>
    </span>
  );
}

// One comparison row with two animated values and a decorative winner pill.
// The text weight also changes, so colour is never the only signal.
const StatRow = memo(function StatRow({
  def,
  homeValue,
  awayValue,
  homeEloRank,
  awayEloRank,
  animate,
  delayMs,
}: {
  def: NnStatRowDef;
  homeValue: number | null;
  awayValue: number | null;
  homeEloRank: number | null;
  awayEloRank: number | null;
  animate: boolean;
  delayMs: number;
}) {
  const targetLeader =
    def.betterWhen === "none"
      ? null
      : betterSide(homeValue, awayValue, def.betterWhen);
  const [shownLeader, setShownLeader] = useState(targetLeader);

  useEffect(() => {
    if (!animate || shownLeader === targetLeader) return;
    const id = setTimeout(() => setShownLeader(targetLeader), delayMs + ANIM_MS);
    return () => clearTimeout(id);
  }, [targetLeader, animate, shownLeader, delayMs]);

  const leader = animate ? shownLeader : targetLeader;
  const pillVisible = leader !== null || targetLeader !== null;
  const pillSide = targetLeader ?? leader;
  const pillColor = pillSide === "home" ? "bg-better/25" : "bg-worse/25";
  const pillStyle: CSSProperties = {
    transform:
      pillSide === "away"
        ? "translateX(calc(100% + var(--stats-label-w)))"
        : "translateX(0%)",
    opacity: targetLeader === null ? 0 : 1,
    transition: animate
      ? `transform ${ANIM_MS}ms ${ANIM_EASE_CSS} ${delayMs}ms, ` +
        `opacity ${ANIM_MS}ms ${ANIM_EASE_CSS} ${delayMs}ms, ` +
        `background-color ${ANIM_MS}ms ${ANIM_EASE_CSS} ${delayMs}ms`
      : undefined,
  };
  const homeClasses = `${statColour(leader, "home", homeValue)}${leader === "home" ? " font-bold" : ""}`;
  const awayClasses = `${statColour(leader, "away", awayValue)}${leader === "away" ? " font-bold" : ""}`;

  return (
    <div
      role="row"
      className={`stats-row border-t border-border${animate ? " epl-anim" : ""}`}
    >
      <span
        aria-hidden="true"
        className="stats-pill z-0"
        style={{ ...pillStyle, visibility: pillVisible ? "visible" : "hidden" }}
      >
        <span className={`stats-pill-fill block ${pillColor}`} />
      </span>
      <div role="cell" className={`relative z-10 px-2 py-2 text-center font-tabular ${homeClasses}`}>
        <CountedStat
          def={def}
          value={homeValue}
          rank={homeEloRank}
          animate={animate}
          delayMs={delayMs}
        />
      </div>
      <div role="rowheader" className="relative z-10 px-1 py-2 text-center font-medium text-ink">
        {def.label}
      </div>
      <div role="cell" className={`relative z-10 px-2 py-2 text-center font-tabular ${awayClasses}`}>
        <CountedStat
          def={def}
          value={awayValue}
          rank={awayEloRank}
          animate={animate}
          delayMs={delayMs}
        />
      </div>
    </div>
  );
});

export default function NnTeamStatsCard({
  home,
  away,
  teamStats,
}: NnTeamStatsCardProps) {
  // Do not animate the first load; also honour the visitor's reduced-motion
  // preference just as the Predict card does.
  const changed = useHasChanged(`${home}|${away}`);
  const reduced = usePrefersReducedMotion();
  const animate = changed && !reduced;
  const homeRow = teamStats.find((row) => row.team === home) ?? null;
  const awayRow = teamStats.find((row) => row.team === away) ?? null;

  if (!homeRow || !awayRow) {
    const missing = !homeRow ? home : away;
    return (
      <Card variant="white">
        <h2 className="font-heading text-xl font-semibold">Team stats</h2>
        <p className="mt-2 text-sm text-muted">
          No stats found for {missing} yet. Predictions above still work.
        </p>
      </Card>
    );
  }

  const homeEloRank = nnEloRank(home, teamStats);
  const awayEloRank = nnEloRank(away, teamStats);
  const latestUpdate = teamStats
    .map((row) => row.updated_at)
    .filter((timestamp): timestamp is string => timestamp !== null)
    .sort()
    .at(-1);
  const freshnessText = `Stats updated: ${latestUpdate ? formatMelbourne(latestUpdate) : "unavailable"}`;
  const liveSummary =
    `Team stats, ${home} at home against ${away}. ` +
    NN_STAT_ROWS.map((def) => {
      const homeValue = homeRow[def.homeKey];
      const awayValue = awayRow[def.awayKey];
      return `${def.label}: ${home} ${formatNnStatValue(def, homeValue, homeEloRank)}, ${away} ${formatNnStatValue(def, awayValue, awayEloRank)}`;
    }).join(". ");

  return (
    <Card variant="white">
      <h2 className="font-heading text-xl font-semibold">Team stats</h2>
      <p className="mt-1 text-xs text-muted">Green = better value, red = worse value.</p>
      <div
        role="table"
        aria-label={`Team stats comparison: ${home} at home, ${away} away`}
        className="stats-table mt-4 text-sm"
      >
        <span aria-hidden="true" className="stats-divider stats-divider-left" />
        <span aria-hidden="true" className="stats-divider stats-divider-right" />
        <div role="row" className="stats-row pb-2">
          <div role="columnheader" className="px-1 text-center font-semibold">
            <FadeSpan text={home} animate={animate} />{" "}
            <span className="font-normal text-muted">(home)</span>
          </div>
          <div role="columnheader" className="px-1 text-center font-normal text-muted">
            <span className="sr-only">Stat</span>
          </div>
          <div role="columnheader" className="px-1 text-center font-semibold">
            <FadeSpan text={away} animate={animate} />{" "}
            <span className="font-normal text-muted">(away)</span>
          </div>
        </div>

        {NN_STAT_GROUPS.map((group) => (
          <div role="rowgroup" key={group}>
            <div role="row" className="stats-row stats-group-row pb-1 pt-4">
              <div
                role="columnheader"
                aria-colspan={3}
                className="col-span-3 px-1 text-left font-heading text-xs font-semibold text-muted"
              >
                {group}
              </div>
            </div>
            {NN_STAT_ROWS.filter((def) => def.group === group).map((def) => (
              <StatRow
                key={def.id}
                def={def}
                homeValue={homeRow[def.homeKey]}
                awayValue={awayRow[def.awayKey]}
                homeEloRank={homeEloRank}
                awayEloRank={awayEloRank}
                animate={animate}
                delayMs={NN_STAT_ROWS.indexOf(def) * RIPPLE_MS}
              />
            ))}
          </div>
        ))}
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer rounded-card font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          What do these mean?
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          <li>Elo rating rises with wins and falls with losses, adjusted for opponent strength. 1500 is roughly average.</li>
          <li>Per game, last 5 means an average over the team&apos;s most recent five matches, not a season total.</li>
          <li>Shots are all attempts; shots on target are attempts that would have tested the goalkeeper.</li>
          <li>Goal difference trend is goals scored minus goals conceded. The recent trend weighs the last ~20 matches more, while the longer trend uses about 40.</li>
          <li>Venue form uses the home team&apos;s home matches and the away team&apos;s away matches.</li>
          <li>Days since last match shows how long each team has had to rest.</li>
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
