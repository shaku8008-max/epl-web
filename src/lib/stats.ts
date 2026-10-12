// Row configuration and pure helpers for the stage 4 team-stats comparison.
// Kept free of Supabase imports so the client MatchupTool bundle stays small.
// To add or relabel a stat later, edit STAT_ROWS only; the card renders from it.

import type { TeamStats } from "@/lib/types";

// Which direction counts as "better" for a row.
export type StatDirection = "higher" | "lower";

// How to format the raw value.
export type StatFormat = "elo" | "decimal2" | "signed2";

export type StatGroup = "Rating" | "Recent results" | "Expected goals";

// One entry per table row, in display order. `key` is the team_stats column.
export type StatRowDef = {
  key: Exclude<keyof TeamStats, "team" | "updated_at">;
  label: string;
  format: StatFormat;
  betterWhen: StatDirection;
  group: StatGroup;
};

export const STAT_GROUPS: StatGroup[] = [
  "Rating",
  "Recent results",
  "Expected goals",
];

export const STAT_ROWS: StatRowDef[] = [
  { key: "elo", label: "Elo rating", format: "elo", betterWhen: "higher", group: "Rating" },
  { key: "points_last5", label: "Points per game, last 5", format: "decimal2", betterWhen: "higher", group: "Recent results" },
  { key: "goals_for_last5", label: "Goals scored per game, last 5", format: "decimal2", betterWhen: "higher", group: "Recent results" },
  { key: "goals_against_last5", label: "Goals conceded per game, last 5", format: "decimal2", betterWhen: "lower", group: "Recent results" },
  { key: "xg_for_last5", label: "xG for per game, last 5", format: "decimal2", betterWhen: "higher", group: "Expected goals" },
  { key: "xg_against_last5", label: "xG against per game, last 5", format: "decimal2", betterWhen: "lower", group: "Expected goals" },
  { key: "xg_for_last10", label: "xG for per game, last 10", format: "decimal2", betterWhen: "higher", group: "Expected goals" },
  { key: "xg_against_last10", label: "xG against per game, last 10", format: "decimal2", betterWhen: "lower", group: "Expected goals" },
  { key: "xg_diff_ewm20", label: "xG difference, recent trend", format: "signed2", betterWhen: "higher", group: "Expected goals" },
  { key: "xg_diff_ewm40", label: "xG difference, longer trend", format: "signed2", betterWhen: "higher", group: "Expected goals" },
];

// Who leads a row: "home", "away", or null when tied or a value is missing.
// A null value never wins, so "–" is never bold or tinted.
export function betterSide(
  home: number | null,
  away: number | null,
  direction: StatDirection
): "home" | "away" | null {
  if (home === null || away === null || home === away) return null;
  if (direction === "higher") return home > away ? "home" : "away";
  return home < away ? "home" : "away";
}

// Elo league rank (1 = best) among rows that have an Elo value. Teams tied on
// Elo share a rank (count of strictly better teams + 1). Null when the team
// has no Elo value.
export function eloRank(team: string, rows: TeamStats[]): number | null {
  const me = rows.find((r) => r.team === team)?.elo ?? null;
  if (me === null) return null;
  return rows.filter((r) => r.elo !== null && (r.elo as number) > me).length + 1;
}

// e.g. 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 11 -> "11th".
export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const mod10 = n % 10;
  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}

// Plain 2-decimal average, e.g. 1.40. Null becomes "–".
export function formatDecimal2(value: number | null): string {
  if (value === null) return "–";
  return value.toFixed(2);
}

// Signed 2-decimal trend, e.g. "+0.35" or "−0.12" (minus sign U+2212).
// Rounds first so tiny negatives show as "+0.00", never "−0.00".
export function formatSigned2(value: number | null): string {
  if (value === null) return "–";
  const rounded = Number(value.toFixed(2));
  if (rounded < 0) return `−${Math.abs(rounded).toFixed(2)}`;
  return `+${rounded.toFixed(2)}`;
}

// Elo as a whole number plus rank, e.g. "1612 (3rd)". Rank is omitted when
// unknown (should not normally happen when the value exists).
export function formatElo(value: number | null, rank: number | null): string {
  if (value === null) return "–";
  const whole = Math.round(value).toString();
  return rank === null ? whole : `${whole} (${ordinal(rank)})`;
}

// Formats one row's value according to its StatRowDef.
export function formatStatValue(
  def: StatRowDef,
  value: number | null,
  rank: number | null
): string {
  if (def.format === "elo") return formatElo(value, rank);
  if (def.format === "signed2") return formatSigned2(value);
  return formatDecimal2(value);
}
