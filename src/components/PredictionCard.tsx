// The prediction for the selected pair: heading, probability bar and the
// three outcomes. Used inside MatchupTool (client bundle); animated values
// count here so only this card re-renders per frame.

"use client";

import { memo } from "react";
import Card from "@/components/Card";
import { ANIM_EASE_CSS, ANIM_MS, fadeInStyle, useAnimatedNumber, useHasChanged } from "@/lib/animate";
import { formatFixtureDate, toWholePercentages } from "@/lib/format";
import type { Prediction } from "@/lib/types";

type PredictionCardProps = {
  home: string;
  away: string;
  prediction: Prediction | null;
};

// One animated percentage cell under the bar. The visible number counts and
// is hidden from screen readers; the card's sr-only live region announces
// the final values only.
const CountedPercent = memo(function CountedPercent({ value }: { value: number }) {
  const [display] = useAnimatedNumber(value);
  const shown = display === null ? value : Math.round(display);
  return (
    <span aria-hidden="true" className="font-tabular">
      {shown}%
    </span>
  );
});

// One bar segment: width slides via CSS, label fades via opacity. Both use
// the same duration and easing as the number counting so they move together.
const BarSegment = memo(function BarSegment({
  label,
  value,
  color,
  animate,
}: {
  label: string;
  value: number;
  color: string;
  animate: boolean;
}) {
  const [display] = useAnimatedNumber(value);
  const shown = display === null ? value : Math.round(display);
  const wide = value >= 15;
  return (
    <div
      className={`flex min-w-0 items-center justify-center overflow-hidden whitespace-nowrap px-2 text-sm font-semibold text-white ${color}${animate ? " epl-anim" : ""}`}
      style={
        animate
          ? { width: `${value}%`, transition: `width ${ANIM_MS}ms ${ANIM_EASE_CSS}` }
          : { width: `${value}%` }
      }
    >
      <span
        className={`inline-block${animate ? " epl-anim" : ""}`}
        style={
          animate
            ? { opacity: wide ? 1 : 0, transition: `opacity ${ANIM_MS}ms ${ANIM_EASE_CSS}` }
            : undefined
        }
      >
        {`${label} ${shown}%`}
      </span>
    </div>
  );
});

// Heading or fixture text that fades in briefly on change, keeping its space
// so the layout never shifts. Keyed by text with the shared mount animation;
// the visible copy is aria-hidden and callers announce finals separately.
function FadeText({ text, animate }: { text: string; animate: boolean }) {
  return (
    <span
      key={text}
      aria-hidden="true"
      className={`inline-block${animate ? " epl-anim" : ""}`}
      style={fadeInStyle(animate)}
    >
      {text}
    </span>
  );
}

export default function PredictionCard({
  home,
  away,
  prediction,
}: PredictionCardProps) {
  // Animate only after the first selection change, never on page load.
  const pairKey = prediction ? `${home}|${away}` : "missing";
  const animate = useHasChanged(pairKey);
  const heading = `${home} at home against ${away}`;

  if (!prediction) {
    return (
      <div id="prediction-card" className="scroll-mt-4">
        <Card variant="white">
          <h2 aria-hidden="true" className="grid grid-cols-2 gap-4 font-heading">
            <span className="min-w-0">
              <span className="block text-sm font-normal text-muted">home</span>
              <span className="block break-words text-3xl font-semibold leading-tight lg:text-5xl">
                <FadeText text={home} animate={animate} />
              </span>
            </span>
            <span className="min-w-0 text-right">
              <span className="block text-sm font-normal text-muted">away</span>
              <span className="block break-words text-3xl font-semibold leading-tight lg:text-5xl">
                <FadeText text={away} animate={animate} />
              </span>
            </span>
          </h2>
          <span className="sr-only" role="status">
            {heading}
          </span>
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
  const fixtureText = prediction.fixture_date
    ? `Upcoming fixture: ${formatFixtureDate(prediction.fixture_date)}`
    : "Hypothetical matchup: if they played next, on current form.";
  // Final values only for the live region: intermediates stay silent.
  const liveSummary =
    `${heading}. ${outcomes.map((o) => `${o.label} ${o.value}%`).join(", ")}. ` +
    `Most likely: ${mostLikely.label}. ${fixtureText}`;

  return (
    <div id="prediction-card" className={`scroll-mt-4${animate ? " epl-anim" : ""}`}>
      <Card variant="white">
        <h2 aria-hidden="true" className="grid grid-cols-2 gap-4 font-heading">
          <span className="min-w-0">
              <span className="block text-sm font-normal text-muted">home</span>
              <span className="block break-words text-3xl font-semibold leading-tight lg:text-5xl">
              <FadeText text={home} animate={animate} />
            </span>
          </span>
          <span className="min-w-0 text-right">
              <span className="block text-sm font-normal text-muted">away</span>
              <span className="block break-words text-3xl font-semibold leading-tight lg:text-5xl">
              <FadeText text={away} animate={animate} />
            </span>
          </span>
        </h2>
        {/* One bar split into three segments, home/draw/away. Widths slide;
            in-segment labels fade and count along with the list below. */}
        <div className="mt-4 flex h-14 overflow-hidden rounded-full lg:h-16" aria-hidden="true">
          {outcomes.map((o) => (
            <BarSegment
              key={o.key}
              label={o.barLabel}
              value={o.value}
              color={o.color}
              animate={animate}
            />
          ))}
        </div>

        {/* Equal columns keep every percentage legible, even when one ribbon
            segment is very small. */}
        <div className="mt-3 grid min-w-0 grid-cols-3 gap-2" aria-hidden="true">
          {outcomes.map((o) => {
            const isMostLikely = o.key === mostLikely.key;
            return (
              <div key={o.key} className="min-w-0 text-center">
                <div className={`h-1 ${o.color}`} />
                <span
                  key={mostLikely.key}
                   className={`mt-2 block font-tabular text-4xl leading-none lg:text-6xl ${isMostLikely ? "font-semibold text-ink" : "text-muted"}${animate ? " epl-anim" : ""}`}
                  style={fadeInStyle(animate)}
                >
                  <CountedPercent value={o.value} />
                </span>
                <span
                   className={`mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm ${isMostLikely ? "font-semibold text-ink" : "text-muted"}`}
                >
                  <span className="whitespace-nowrap">{o.barLabel}</span>
                  {isMostLikely && (
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-sm font-semibold text-white">
                      Most likely
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-base text-muted">
          <FadeText text={fixtureText} animate={animate} />
        </p>

        {/* Screen readers hear the final values only, never the counting. */}
        <span className="sr-only" role="status">
          {liveSummary}
        </span>
      </Card>
    </div>
  );
}
