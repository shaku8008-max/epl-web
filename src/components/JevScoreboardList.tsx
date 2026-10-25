// The per-match list on the Jev scoreboard, newest first. For every finished
// match it shows the score and result, the shift, and how much probability
// each version gave to the actual result. The difference in log loss carries
// a +/- sign and the words "better"/"worse", so colour is never the only
// signal. Server component: pure display.

import Card from "@/components/Card";
import { formatFixtureDate } from "@/lib/format";
import { logLoss, type MatchView } from "@/lib/jevScore";

type JevScoreboardListProps = {
  matches: MatchView[];
};

const RESULT_WORDS = {
  H: "Home win",
  D: "Draw",
  A: "Away win",
} as const;

function formatProb(prob: number | null): string {
  return prob === null ? "–" : `${(prob * 100).toFixed(1)}%`;
}

function formatLoss(prob: number | null): string {
  return prob === null ? "–" : logLoss(prob).toFixed(3);
}

// Positive difference means the version had a lower log loss than the model,
// so it was better on that match.
function diffLabel(plain: number | null, version: number | null): string {
  if (plain === null || version === null) return "Not scored";
  const diff = logLoss(plain) - logLoss(version);
  if (diff > 1e-9) return `+${diff.toFixed(3)} better`;
  if (diff < -1e-9) return `\u2212${Math.abs(diff).toFixed(3)} worse`;
  return "0.000 identical";
}

function shiftLabel(shift: number | null): string {
  if (shift === null) return "No shift reported";
  if (Math.abs(shift) < 0.05) return "0.0 points (no meaningful shift)";
  const sign = shift > 0 ? "+" : "\u2212";
  const direction = shift > 0 ? "towards the home win" : "towards the away win";
  return `${sign}${Math.abs(shift).toFixed(1)} points ${direction}`;
}

export default function JevScoreboardList({
  matches,
}: JevScoreboardListProps) {
  return (
    <div className="mt-6 space-y-4">
      {matches.map((m) => {
        const score = `${m.homeGoals ?? "–"}\u2013${m.awayGoals ?? "–"}`;
        return (
          <Card key={m.key} variant="white">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-heading text-lg font-semibold">
                {m.home} v {m.away}
              </h2>
              <span className="font-heading text-lg font-semibold tabular-nums">
                {score}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {formatFixtureDate(m.fixtureDate)} · {RESULT_WORDS[m.result]}
            </p>
            <p className="mt-2 text-sm">Shift: {shiftLabel(m.shiftPoints)}</p>

            <div className="mt-3 overflow-x-auto rounded-card border border-border">
              <table className="w-full text-sm">
                <thead className="bg-tint">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left font-semibold">
                      Version
                    </th>
                    <th
                      scope="col"
                      className="whitespace-nowrap px-3 py-2 text-right font-semibold"
                    >
                      Gave the actual result
                    </th>
                    <th
                      scope="col"
                      className="whitespace-nowrap px-3 py-2 text-right font-semibold"
                    >
                      Log loss
                    </th>
                    <th
                      scope="col"
                      className="whitespace-nowrap px-3 py-2 text-right font-semibold"
                    >
                      vs model
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <th scope="row" className="px-3 py-2 text-left font-medium">
                      Model
                    </th>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatProb(m.plain)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatLoss(m.plain)}
                    </td>
                    <td className="px-3 py-2 text-right text-muted">
                      baseline
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <th scope="row" className="px-3 py-2 text-left font-medium">
                      Jev half
                    </th>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatProb(m.half)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatLoss(m.half)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      {diffLabel(m.plain, m.half)}
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <th scope="row" className="px-3 py-2 text-left font-medium">
                      Jev full
                    </th>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatProb(m.full)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatLoss(m.full)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      {diffLabel(m.plain, m.full)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
