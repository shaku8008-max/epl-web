// Side-by-side pre-match stats for the two selected teams. Animated values
// count here so only this card re-renders per frame.

"use client";

import { memo, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Card from "@/components/Card";
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
  delayMs,
}: {
  def: StatRowDef;
  value: number | null;
  rank: number | null;
  animate: boolean;
  delayMs: number;
}) {
  const [display, done] = useAnimatedNumber(value, animate ? delayMs : 0);
  const instant = value === null || display === null;
  // Keys flip only when a value appears or disappears, so the dash and the
  // number swap places once (each fading in) instead of popping, while the
  // key stays stable through every counting frame.
  const flipKey = `${def.key}-${instant ? "dash" : "num"}`;
  // "–" switches fade in via the shared mount animation instead of counting.
  if (instant) {
    const dash = formatStatValue(def, value, rank);
    return (
      <span
        key={flipKey}
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
    <span
      key={flipKey}
      aria-hidden="true"
      className={`inline-block tabular-nums${animate ? " epl-anim" : ""}`}
      style={fadeInStyle(animate)}
    >
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

// Visible text that crossfades to the new value: the outgoing text stays
// mounted for TEXT_MS, stacked in the same grid cell as the incoming text
// (so the box never changes size), and the two column headings swap with no
// layout shift. Screen readers get a stable sr-only copy of the current
// text; the card's live region announces changes.
function FadeSpan({
  text,
  animate,
}: {
  text: string;
  animate: boolean;
}) {
  const [current, setCurrent] = useState(text);
  const [outgoing, setOutgoing] = useState<string | null>(null);

  // React's documented "adjust state when a prop changes": stash the previous
  // text for one crossfade. Done during render, never in an effect. Nothing is
  // stashed when not animating (first load or reduced motion), so the text
  // simply swaps.
  if (current !== text) {
    if (animate) setOutgoing(current);
    setCurrent(text);
  }

  // Drop the outgoing copy once the fade is over. No timer when motion is
  // reduced (the outgoing copy is not rendered then anyway).
  useEffect(() => {
    if (outgoing === null) return;
    const id = setTimeout(() => setOutgoing(null), TEXT_MS);
    return () => clearTimeout(id);
  }, [outgoing]);

  // inline-grid (not grid) so the team name and its "(home)" label flow on one
  // line when there is room and wrap only when there is not. The box still
  // sizes to the widest of the two copies, and because the column widths are
  // fixed by the row grid nothing around it ever moves.
  return (
    <span className="inline-grid">
      {outgoing !== null && (
        <span
          aria-hidden="true"
          className={`col-start-1 row-start-1 epl-anim`}
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

// One comparison row: two counted cells plus a sliding winner pill. The pill
// is an absolutely positioned rounded highlight behind the winning value; it
// is never a grid item, so it can never shift the cells. It moves with a CSS
// transform between the two value columns, fading out where it is when
// neither side leads and fading in on the newly leading side. Bold switches
// when the slide finishes, so nothing flickers mid-count.
//
// Stable identity matters: rows are keyed by stat only and keep their own
// state, so a selection change updates values in place (counting from the
// current display) instead of remounting and jumping.
const StatRow = memo(function StatRow({
  def,
  homeValue,
  awayValue,
  homeEloRank,
  awayEloRank,
  animate,
  delayMs,
}: {
  def: StatRowDef;
  homeValue: number | null;
  awayValue: number | null;
  homeEloRank: number | null;
  awayEloRank: number | null;
  animate: boolean;
  delayMs: number;
}) {
  const targetLeader = betterSide(homeValue, awayValue, def.betterWhen);
  const [shownLeader, setShownLeader] = useState(targetLeader);
  useEffect(() => {
    // Bold follows the slide: wait for the ripple delay plus the slide
    // duration. When not animating (first load or reduced motion) the derived
    // leader below already equals the target, so there is nothing to wait for.
    if (!animate || shownLeader === targetLeader) return;
    const id = setTimeout(() => setShownLeader(targetLeader), delayMs + ANIM_MS);
    return () => clearTimeout(id);
  }, [targetLeader, animate, shownLeader, delayMs]);

  // Which side the bold currently marks: the settled leader while animating,
  // otherwise the target straight away.
  const leader = animate ? shownLeader : targetLeader;

  // Pill position and colour follow the target, so the tint morphs while the
  // pill travels. The away shift is "one pill width + the label column",
  // which is exactly the gap between the two value columns, so it lands right
  // at any width (the widths are defined in globals.css). When neither side
  // leads the pill fades out where it is, and a side becoming better fades in
  // on that side rather than sliding across from the old one.
  const pillVisible = leader !== null || targetLeader !== null;
  const pillSide = targetLeader ?? leader;
  const pillColor = pillSide === "home" ? "bg-home/25" : "bg-away/25";
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

  // Bold carries the meaning; the pill is decoration only so colour is never
  // the only signal.
  const homeClasses = leader === "home" ? "font-bold text-ink" : "text-muted";
  const awayClasses = leader === "away" ? "font-bold text-ink" : "text-muted";

  return (
    <div
      role="row"
      className={`stats-row border-t border-border${animate ? " epl-anim" : ""}`}
    >
      {/* Sliding highlight behind the winning value. pointer-events-none so it
          never blocks taps; the cells above it are z-10. */}
      <span
        aria-hidden="true"
        className="stats-pill z-0"
        style={{ ...pillStyle, visibility: pillVisible ? "visible" : "hidden" }}
      >
        <span className={`stats-pill-fill block ${pillColor}`} />
      </span>
      <div
        role="cell"
        className={`relative z-10 px-2 py-2 text-center tabular-nums ${homeClasses}`}
      >
        <CountedStat
          def={def}
          value={homeValue}
          rank={homeEloRank}
          animate={animate}
          delayMs={delayMs}
        />
      </div>
      <div
        role="rowheader"
        className="relative z-10 px-1 py-2 text-center font-medium text-ink"
      >
        {def.label}
      </div>
      <div
        role="cell"
        className={`relative z-10 px-2 py-2 text-center tabular-nums ${awayClasses}`}
      >
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

export default function TeamStatsCard({ home, away, teamStats }: TeamStatsCardProps) {
  // Animate only after the first selection change, never on page load, and
  // never when the device asks for reduced motion. Both hooks must be called
  // unconditionally, so they are combined after the fact.
  const changed = useHasChanged(`${home}|${away}`);
  const reduced = usePrefersReducedMotion();
  const animate = changed && !reduced;
  const homeRow = teamStats.find((r) => r.team === home) ?? null;
  const awayRow = teamStats.find((r) => r.team === away) ?? null;

  // A selected team with no row at all: show a message instead of the table.
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
    <Card variant="white">
      <h2 className="font-heading text-xl font-semibold">Team stats</h2>

      {/* A grid of divs with table roles: the layout is a CSS grid (needed for
          the absolutely positioned highlight) and the roles keep it readable
          as a table for screen readers. */}
      <div
        role="table"
        aria-label={`Team stats comparison: ${home} at home, ${away} away`}
        className="stats-table mt-4 text-sm"
      >
        {/* Continuous vertical rules: home values | labels | away values. */}
        <span aria-hidden="true" className="stats-divider stats-divider-left" />
        <span aria-hidden="true" className="stats-divider stats-divider-right" />

        {/* Team-name headings, centred over their own columns. */}
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

        {/* Ripple: STAT_ROWS is already in display order, so the flat index
            staggers each row ~28 ms after the one above; the whole table
            finishes in ~700 ms. Group headers render from the same pass. */}
        {STAT_GROUPS.map((group) => (
          <div role="rowgroup" key={group}>
            <div role="row" className="stats-row pb-1 pt-4">
              <div
                role="columnheader"
                aria-colspan={3}
                className="col-span-3 px-1 text-left font-heading text-xs font-semibold uppercase tracking-wide text-muted"
              >
                {group}
              </div>
            </div>
            {STAT_ROWS.filter((def) => def.group === group).map((def) => (
              <StatRow
                key={def.key}
                def={def}
                homeValue={homeRow[def.key]}
                awayValue={awayRow[def.key]}
                homeEloRank={homeEloRank}
                awayEloRank={awayEloRank}
                animate={animate}
                delayMs={STAT_ROWS.indexOf(def) * RIPPLE_MS}
              />
            ))}
          </div>
        ))}
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
