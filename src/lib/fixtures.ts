// Pure helpers for prediction rows that have a fixture date. Deliberately free
// of Supabase imports, so client components can use them without pulling the
// database client into the browser bundle.

import type { Fixture, Prediction } from "@/lib/types";

// Upcoming fixtures (rows with a fixture date), sorted by date, then by home
// team alphabetically.
export function upcomingFixtures(predictions: Prediction[]): Fixture[] {
  return predictions
    .filter((p): p is Fixture => p.fixture_date !== null)
    .sort((a, b) =>
      a.fixture_date === b.fixture_date
        ? a.home.localeCompare(b.home)
        : a.fixture_date.localeCompare(b.fixture_date)
    );
}

// "The next round": fixtures whose date is within four days of the earliest
// upcoming fixture. Empty when there are no upcoming fixtures.
export function nextRoundFixtures(predictions: Prediction[]): Fixture[] {
  const upcoming = upcomingFixtures(predictions);
  if (upcoming.length === 0) return [];

  const earliest = new Date(`${upcoming[0].fixture_date}T00:00:00Z`).getTime();
  const fourDaysMs = 4 * 24 * 60 * 60 * 1000;
  return upcoming.filter(
    (f) => new Date(`${f.fixture_date}T00:00:00Z`).getTime() <= earliest + fourDaysMs
  );
}

// Picks the matchup shown when the Predict page opens:
// 1. ?home=...&away=... when both are known team names and different;
// 2. otherwise the earliest upcoming fixture (ties: alphabetically first home);
// 3. otherwise the first two teams alphabetically.
export function resolveInitialPair(
  searchParams: Record<string, string | string[] | undefined>,
  predictions: Prediction[],
  teams: string[]
): { home: string; away: string } {
  const home = typeof searchParams.home === "string" ? searchParams.home : undefined;
  const away = typeof searchParams.away === "string" ? searchParams.away : undefined;
  if (home && away && home !== away && teams.includes(home) && teams.includes(away)) {
    return { home, away };
  }

  const upcoming = upcomingFixtures(predictions);
  if (upcoming.length > 0) {
    return { home: upcoming[0].home, away: upcoming[0].away };
  }
  return { home: teams[0], away: teams[1] };
}