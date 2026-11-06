export type Outcome = "home" | "draw" | "away";
export type ComparisonSide = "home" | "away" | null;

// Returns a colour only when exactly one outcome is highest. Missing values and
// ties stay neutral so the colour never implies a false leader.
export function probabilityColour(
  outcome: Outcome,
  home: number | null,
  draw: number | null,
  away: number | null
): string {
  const values = [home, draw, away];
  if (values.some((value) => value === null || !Number.isFinite(value))) return "";
  const highest = Math.max(home as number, draw as number, away as number);
  if (values.filter((value) => value === highest).length !== 1) return "";
  if (outcome === "home") return "text-better";
  if (outcome === "away") return "text-worse";
  return "text-draw";
}

// Colours a comparison value by whether it is the better or worse side. A
// missing value and a tie remain neutral.
export function statColour(
  leader: ComparisonSide,
  side: "home" | "away",
  value: number | null
): string {
  if (value === null || leader === null) return value === null ? "text-muted" : "text-ink";
  return leader === side ? "text-better" : "text-worse";
}

export function movementColour(tenths: number, text = false): string {
  if (tenths > 0) return text ? "text-better" : "bg-better";
  if (tenths < 0) return text ? "text-worse" : "bg-worse";
  return text ? "text-muted" : "bg-muted";
}
