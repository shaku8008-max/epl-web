// Melbourne-time formatting, shared by every page that shows a date.
// Display rule: all dates and times are shown in Australia/Melbourne.

// "Mon" in Melbourne time. Dates are built from two pieces ("Mon" + "12 Oct")
// because en-AU puts a comma between them ("Mon, 12 Oct") and the design
// calls for "Mon 12 Oct".
const melbourneWeekday = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  weekday: "short",
});

// "12 Oct" in Melbourne time
const melbourneDayMonth = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  day: "numeric",
  month: "short",
});

// e.g. "4:17 pm"
const melbourneTime = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

// Fixture dates are plain UK calendar dates ("2026-10-17") with no time of
// day. Format them exactly as stored (UTC), never in Melbourne time, because
// a timezone conversion could move the date to the wrong day.
const fixtureWeekday = new Intl.DateTimeFormat("en-AU", {
  timeZone: "UTC",
  weekday: "short",
});

const fixtureDayMonth = new Intl.DateTimeFormat("en-AU", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});

// e.g. "Sat 17 Oct"
export function formatFixtureDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return `${fixtureWeekday.format(d)} ${fixtureDayMonth.format(d)}`;
}

// Turns the three probabilities into whole-number percentages that always add
// up to exactly 100, using largest-remainder rounding: take the whole part of
// each, then hand the leftover points to the largest fractional parts.
export function toWholePercentages(
  pHome: number,
  pDraw: number,
  pAway: number
): { home: number; draw: number; away: number } {
  const probs = [pHome, pDraw, pAway];
  const total = probs.reduce((a, b) => a + b, 0);
  if (total <= 0) return { home: 0, draw: 0, away: 0 };

  const exact = probs.map((p) => (p / total) * 100);
  const result = exact.map((x) => Math.floor(x));
  let remaining = 100 - result.reduce((a, b) => a + b, 0);

  // Biggest fractional parts get the leftover points first (stable sort, so
  // ties go to home, then draw, then away — always the same result).
  const byFraction = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);
  for (const { i } of byFraction) {
    if (remaining === 0) break;
    result[i] += 1;
    remaining -= 1;
  }

  return { home: result[0], draw: result[1], away: result[2] };
}

// Formats a timestamptz ISO string, e.g. "Mon 12 Oct, 4:17 pm".
export function formatMelbourne(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unavailable";
  return `${melbourneWeekday.format(date)} ${melbourneDayMonth.format(date)}, ${melbourneTime.format(date)}`;
}