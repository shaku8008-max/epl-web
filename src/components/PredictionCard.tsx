// The prediction for the selected pair: heading, probability bar and the
// three outcomes. Used inside MatchupTool (client bundle); no state here.

import Card from "@/components/Card";
import { formatFixtureDate, toWholePercentages } from "@/lib/format";
import type { Prediction } from "@/lib/types";

type PredictionCardProps = {
  home: string;
  away: string;
  prediction: Prediction | null;
};

export default function PredictionCard({
  home,
  away,
  prediction,
}: PredictionCardProps) {
  if (!prediction) {
    return (
      <div id="prediction-card" className="scroll-mt-4">
        <Card>
          <h2 className="font-heading text-xl font-semibold">
            {home} (home) v {away} (away)
          </h2>
          <p className="mt-2 text-muted">No prediction found for this pairing.</p>
        </Card>
      </div>
    );
  }

  const pct = toWholePercentages(
    prediction.p_home,
    prediction.p_draw,
    prediction.p_away
  );

  // The three outcomes in words, in home/draw/away order.
  const outcomes = [
    {
      key: "home",
      label: `${home} win`,
      barLabel: "Home",
      value: pct.home,
      color: "bg-home",
    },
    { key: "draw", label: "Draw", barLabel: "Draw", value: pct.draw, color: "bg-draw" },
    {
      key: "away",
      label: `${away} win`,
      barLabel: "Away",
      value: pct.away,
      color: "bg-away",
    },
  ];
  const mostLikely = outcomes.reduce((best, o) => (o.value > best.value ? o : best));

  return (
    <div id="prediction-card" className="scroll-mt-4">
      <Card>
        <h2 className="font-heading text-xl font-semibold">
          {home} (home) v {away} (away)
        </h2>

        {/* One bar split into three segments, home/draw/away. A segment shows
            its label inside only when wide enough for it (>= 15%); the labels
            under the bar always show all three. */}
        <div className="mt-4 flex h-10 overflow-hidden rounded-full" aria-hidden="true">
          {outcomes.map((o) => (
            <div
              key={o.key}
              className={`flex min-w-0 items-center justify-center overflow-hidden whitespace-nowrap px-2 text-xs font-semibold text-white ${o.color}`}
              style={{ width: `${o.value}%` }}
            >
              {o.value >= 15 ? `${o.barLabel} ${o.value}%` : ""}
            </div>
          ))}
        </div>

        {/* All three outcomes with their percentages. The most likely one is
            bold and tagged, so colour is never the only difference. */}
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {outcomes.map((o) => {
            const isMostLikely = o.key === mostLikely.key;
            return (
              <li
                key={o.key}
                className={isMostLikely ? "font-semibold text-ink" : "text-muted"}
              >
                {o.label} <span className="tabular-nums">{o.value}%</span>
                {isMostLikely && (
                  <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                    Most likely
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {prediction.fixture_date ? (
          <p className="mt-4 text-sm text-muted">
            Upcoming fixture: {formatFixtureDate(prediction.fixture_date)}
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Hypothetical matchup: if they played next, on current form.
          </p>
        )}
      </Card>
    </div>
  );
}