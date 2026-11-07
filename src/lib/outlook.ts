export type ChanceTone = "better" | "worse";

export function formatChance(value: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return "unavailable";
  if (value === 0) return "0%";
  const percent = value * 100;
  return percent < 1 ? "<1%" : `${Math.round(percent)}%`;
}

export function tintForChance(value: number | null, tone: ChanceTone): string {
  const chance = typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  if (chance === 0) return "transparent";
  const token = tone === "better" ? "var(--color-better)" : "var(--color-worse)";
  const mix = 8 + Math.sqrt(chance) * 52;
  return `color-mix(in srgb, ${token} ${mix}%, white)`;
}

export function barHeights(values: number[] | null): number[] {
  if (!values || values.length !== 20) return Array.from({ length: 20 }, () => 0);
  const finite = values.map((value) => (Number.isFinite(value) && value >= 0 ? value : 0));
  const maximum = Math.max(...finite, 0);
  return maximum > 0 ? finite.map((value) => (value / maximum) * 100) : finite;
}

export function ordinal(position: number): string {
  const remainder = position % 100;
  if (remainder >= 11 && remainder <= 13) return `${position}th`;
  return `${position}${position % 10 === 1 ? "st" : position % 10 === 2 ? "nd" : position % 10 === 3 ? "rd" : "th"}`;
}
