import type { JournalEntry } from "@/lib/types";
import {
  betProfit,
  breakEvenRate,
  returnOnInvestment,
  settledEntries,
  valueColour,
  winRate,
} from "@/lib/history";

const aud = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });

type JournalSummaryProps = { entries: JournalEntry[] };

const colourClasses = {
  better: { text: "text-better", border: "border-better", bg: "bg-better-soft" },
  worse: { text: "text-worse", border: "border-worse", bg: "bg-worse-soft" },
  draw: { text: "text-draw", border: "border-draw", bg: "bg-draw-soft" },
};

function StatCard({ label, value, colour, caption }: {
  label: string;
  value: string;
  colour: keyof typeof colourClasses;
  caption?: string;
}) {
  const styles = colourClasses[colour];
  return (
    <div className={`rounded-card border border-border border-l-4 ${styles.border} ${styles.bg} p-4 sm:p-5`}>
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className={`mt-2 font-heading text-4xl font-bold leading-none tracking-tight tabular-nums sm:text-5xl ${styles.text}`}>
        {value}
      </dd>
      {caption && <p className="mt-2 text-xs leading-snug text-muted">{caption}</p>}
    </div>
  );
}

export default function JournalSummary({ entries }: JournalSummaryProps) {
  const settled = settledEntries(entries);
  const scored = settled.filter((entry) => entry.status !== "void");
  const profit = betProfit(entries);
  const roi = returnOnInvestment(entries);
  const rate = winRate(entries);
  const breakEven = breakEvenRate(entries);
  const rateColour = rate === null || breakEven === null ? "draw" : valueColour(rate - breakEven);
  const counts = [
    ["won", entries.filter((entry) => entry.status === "won").length, "bg-better-soft text-better"],
    ["lost", entries.filter((entry) => entry.status === "lost").length, "bg-worse-soft text-worse"],
    ["void", entries.filter((entry) => entry.status === "void").length, "bg-draw-soft text-draw"],
    ["open", entries.filter((entry) => entry.status === "open").length, "bg-open-soft text-open"],
  ] as const;

  return (
    <div>
      <h2 className="font-heading text-2xl font-semibold">Summary</h2>
      <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Profit / loss"
          value={profit > 0 ? `▲ +${aud.format(profit)}` : profit < 0 ? `▼ −${aud.format(Math.abs(profit))}` : aud.format(0)}
          colour={valueColour(profit)}
        />
        <StatCard
          label="ROI"
          value={roi === null ? "-" : `${roi > 0 ? "▲ +" : roi < 0 ? "▼ −" : ""}${Math.abs(roi).toFixed(1)}%`}
          colour={valueColour(roi)}
        />
        <StatCard
          label="Win rate"
          value={rate === null ? "-" : `${rate >= (breakEven ?? Infinity) ? "▲ " : "▼ "}${rate.toFixed(0)}%`}
          colour={rateColour}
          caption={breakEven === null ? "Break-even needs valid odds" : `Break-even is about ${breakEven.toFixed(0)}% at your odds`}
        />
        <StatCard label="Bets settled" value={String(scored.length)} colour="draw" />
      </dl>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Bet counts">
        {counts.map(([label, count, styles]) => (
          <span key={label} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>
            {count} {label}
          </span>
        ))}
      </div>
    </div>
  );
}
