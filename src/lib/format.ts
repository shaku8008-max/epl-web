// Melbourne-time formatting, shared by every page that shows a date.
// Display rule: all dates and times are shown in Australia/Melbourne.

// e.g. "Mon 12 Oct"
const melbourneDate = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  weekday: "short",
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

// Formats a timestamptz ISO string, e.g. "Mon 12 Oct, 4:17 pm".
export function formatMelbourne(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unavailable";
  return `${melbourneDate.format(date)}, ${melbourneTime.format(date)}`;
}