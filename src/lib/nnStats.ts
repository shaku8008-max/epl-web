// Row configuration and pure helpers for the neural model's team-stats card.
// Keeping this file free of Supabase imports lets the client card stay focused
// on display and keeps the table columns explicit for beginners.

import {
  betterSide,
  formatDecimal2,
  formatElo,
  formatSigned2,
  ordinal,
} from "@/lib/stats";
import type { NnTeamStats } from "@/lib/types";

export type NnStatFormat = "elo" | "decimal2" | "signed2" | "days";
export type NnStatDirection = "higher" | "lower" | "none";
export type NnStatGroup =
  | "Rating"
  | "Recent results"
  | "Shots"
  | "Trend"
  | "Venue form"
  | "Rest";
export type NnStatValueKey = Exclude<keyof NnTeamStats, "team" | "updated_at">;

export type NnStatRowDef = {
  id: string;
  label: string;
  format: NnStatFormat;
  betterWhen: NnStatDirection;
  group: NnStatGroup;
  homeKey: NnStatValueKey;
  awayKey: NnStatValueKey;
};

export const NN_STAT_GROUPS: NnStatGroup[] = [
  "Rating",
  "Recent results",
  "Shots",
  "Trend",
  "Venue form",
  "Rest",
];

export const NN_STAT_ROWS: NnStatRowDef[] = [
  {
    id: "elo",
    label: "Elo rating",
    format: "elo",
    betterWhen: "higher",
    group: "Rating",
    homeKey: "elo",
    awayKey: "elo",
  },
  {
    id: "points_last5",
    label: "Points per game, last 5",
    format: "decimal2",
    betterWhen: "higher",
    group: "Recent results",
    homeKey: "points_last5",
    awayKey: "points_last5",
  },
  {
    id: "goals_for_last5",
    label: "Goals scored per game, last 5",
    format: "decimal2",
    betterWhen: "higher",
    group: "Recent results",
    homeKey: "goals_for_last5",
    awayKey: "goals_for_last5",
  },
  {
    id: "goals_against_last5",
    label: "Goals conceded per game, last 5",
    format: "decimal2",
    betterWhen: "lower",
    group: "Recent results",
    homeKey: "goals_against_last5",
    awayKey: "goals_against_last5",
  },
  {
    id: "shots_for_last5",
    label: "Shots for per game, last 5",
    format: "decimal2",
    betterWhen: "higher",
    group: "Shots",
    homeKey: "shots_for_last5",
    awayKey: "shots_for_last5",
  },
  {
    id: "shots_against_last5",
    label: "Shots against per game, last 5",
    format: "decimal2",
    betterWhen: "lower",
    group: "Shots",
    homeKey: "shots_against_last5",
    awayKey: "shots_against_last5",
  },
  {
    id: "sot_for_last5",
    label: "Shots on target for per game, last 5",
    format: "decimal2",
    betterWhen: "higher",
    group: "Shots",
    homeKey: "sot_for_last5",
    awayKey: "sot_for_last5",
  },
  {
    id: "sot_against_last5",
    label: "Shots on target against per game, last 5",
    format: "decimal2",
    betterWhen: "lower",
    group: "Shots",
    homeKey: "sot_against_last5",
    awayKey: "sot_against_last5",
  },
  {
    id: "goal_diff_ewm20",
    label: "Goal difference, recent trend",
    format: "signed2",
    betterWhen: "higher",
    group: "Trend",
    homeKey: "goal_diff_ewm20",
    awayKey: "goal_diff_ewm20",
  },
  {
    id: "goal_diff_ewm40",
    label: "Goal difference, longer trend",
    format: "signed2",
    betterWhen: "higher",
    group: "Trend",
    homeKey: "goal_diff_ewm40",
    awayKey: "goal_diff_ewm40",
  },
  {
    id: "venue_points_last5",
    label: "Points per game at venue, last 5",
    format: "decimal2",
    betterWhen: "higher",
    group: "Venue form",
    homeKey: "home_points_venue5",
    awayKey: "away_points_venue5",
  },
  {
    id: "venue_goals_for_last5",
    label: "Goals scored at venue, last 5",
    format: "decimal2",
    betterWhen: "higher",
    group: "Venue form",
    homeKey: "home_goals_for_venue5",
    awayKey: "away_goals_for_venue5",
  },
  {
    id: "venue_goals_against_last5",
    label: "Goals conceded at venue, last 5",
    format: "decimal2",
    betterWhen: "lower",
    group: "Venue form",
    homeKey: "home_goals_against_venue5",
    awayKey: "away_goals_against_venue5",
  },
  {
    id: "rest_days",
    label: "Days since last match",
    format: "days",
    betterWhen: "none",
    group: "Rest",
    homeKey: "rest_days",
    awayKey: "rest_days",
  },
];

// Elo rank (1 = best) among rows that have an Elo value. Tied teams share a
// rank, matching the existing Predict card's ranking rule.
export function nnEloRank(team: string, rows: NnTeamStats[]): number | null {
  const me = rows.find((row) => row.team === team)?.elo ?? null;
  if (me === null) return null;
  return rows.filter((row) => row.elo !== null && row.elo > me).length + 1;
}

export function formatNnStatValue(
  def: NnStatRowDef,
  value: number | null,
  rank: number | null
): string {
  if (def.format === "elo") return formatElo(value, rank);
  if (def.format === "signed2") return formatSigned2(value);
  if (def.format === "days") {
    if (value === null) return "–";
    const days = Math.round(value);
    return `${days} ${days === 1 ? "day" : "days"}`;
  }
  return formatDecimal2(value);
}

export { betterSide, ordinal };
