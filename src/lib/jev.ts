// Pure helpers for the Jev page. Free of Supabase imports so the page stays a
// simple server component and the logic is easy to test.

import type { JevPlayer } from "@/lib/types";

// shift_points is the probability-weighted shift to the home win probability,
// in percentage points. Positive favours the home team, negative favours the
// away team. Near zero (between -1 and +1) is neutral. Returns null when the
// shift is missing, so the caller can omit the line entirely.
export function shiftLabel(shift: number | null): string | null {
  if (shift === null) return null;
  if (shift > 1) return `+${shift.toFixed(1)} points for the home win`;
  if (shift < -1) return `+${Math.abs(shift).toFixed(1)} points for the away win`;
  return "Neutral";
}

// Whether the newest news is older than two days (stale).
export function isStale(generatedAt: string | null): boolean {
  if (!generatedAt) return false;
  const ageMs = Date.now() - new Date(generatedAt).getTime();
  return ageMs > 2 * 24 * 60 * 60 * 1000;
}

// A player's severity, normalised to "out" | "doubtful" | null. Anything else
// (missing or unexpected) is treated as null so the UI shows no badge.
export function playerLevel(player: JevPlayer): "out" | "doubtful" | null {
  if (player.level === "out") return "out";
  if (player.level === "doubtful") return "doubtful";
  return null;
}
