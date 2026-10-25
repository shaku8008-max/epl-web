"use client";

import { useEffect, useState } from "react";
import {
  getPredictionExplain,
  mergeExplainRow,
  type ExplainDisplay,
  type ExplainStep,
} from "@/lib/explain";

type StatsWaterfallProps = {
  home: string;
  away: string;
};

type WaterfallState =
  | { status: "loading" }
  | { status: "ready"; display: ExplainDisplay }
  | { status: "unavailable" };

function formatTenths(tenths: number): string {
  return (tenths / 10).toFixed(1);
}

function signedValue(tenths: number): string {
  if (tenths === 0) return "0.0";
  return `${tenths > 0 ? "+" : "-"}${formatTenths(Math.abs(tenths))}`;
}

function direction(tenths: number): "raises" | "lowers" | "no change" {
  if (tenths > 0) return "raises";
  if (tenths < 0) return "lowers";
  return "no change";
}

function stepDescription(step: ExplainStep): string {
  const value = formatTenths(Math.abs(step.tenths));
  const move = direction(step.tenths);
  if (move === "no change") return `${step.label}: home win chance ${value} points, no change.`;
  return `${step.label} ${move} the home win chance by ${value} points.`;
}

function stepColour(tenths: number): string {
  if (tenths > 0) return "bg-home";
  if (tenths < 0) return "bg-away";
  return "bg-muted";
}

function stepTextColour(tenths: number): string {
  if (tenths > 0) return "text-home";
  if (tenths < 0) return "text-away";
  return "text-muted";
}

function StepRow({
  label,
  subLabel,
  value,
  scale,
}: {
  label: string;
  subLabel?: string;
  value: number;
  scale: number;
}) {
  const width = Math.min(50, (Math.abs(value / 10) / scale) * 50);
  const move = direction(value);

  return (
    <div className="waterfall-step waterfall-row">
      <div className="waterfall-step-label min-w-0">
        <p className="font-medium">{label}</p>
        {subLabel && <p className="mt-0.5 text-sm text-muted">{subLabel}</p>}
      </div>
      <div className="waterfall-bar-track waterfall-bar" aria-hidden="true">
        <span className="waterfall-centre-line" />
        <span
          className={`waterfall-bar-fill ${value < 0 ? "waterfall-bar-fill--lower" : value > 0 ? "waterfall-bar-fill--raise" : "waterfall-bar-fill--zero"} ${stepColour(value)}`}
          style={{ width: value === 0 ? "2px" : `max(4px, ${width}%)` }}
        />
      </div>
      <div className={`waterfall-step-value text-right ${stepTextColour(value)}`}>
        <p className="font-tabular text-[22px] font-semibold leading-none">{signedValue(value)}</p>
        <p className="text-sm">{move}</p>
      </div>
    </div>
  );
}

export default function StatsWaterfall({ home, away }: StatsWaterfallProps) {
  const [state, setState] = useState<WaterfallState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    getPredictionExplain(home, away)
      .then((row) => {
        if (cancelled) return;
        const display = row ? mergeExplainRow(row) : null;
        setState(display ? { status: "ready", display } : { status: "unavailable" });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "unavailable" });
      });

    return () => {
      cancelled = true;
    };
  }, [home, away]);

  if (state.status === "loading") {
    return (
      <section className="lg:col-span-2" aria-busy="true">
        <h2 className="font-heading text-2xl font-semibold">
          How the stats move the home win chance
        </h2>
        <div className="mt-4 min-h-[24rem] border-y border-border" aria-hidden="true" />
      </section>
    );
  }

  if (state.status === "unavailable") {
    return (
      <p className="lg:col-span-2 border-t border-border pt-6 text-base text-muted">
        Stats explanation not available for this pairing.
      </p>
    );
  }

  const { display } = state;
  const stepScale = Math.max(3, ...display.steps.map((step) => Math.abs(step.tenths / 10)));

  return (
    <section className="lg:col-span-2 border-t border-border pt-6" aria-labelledby="stats-waterfall-heading">
      <h2 id="stats-waterfall-heading" className="font-heading text-2xl font-semibold">
        How the stats move the home win chance
      </h2>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">
        The chart starts from the home win chance for an average home team against an average visiting team ({formatTenths(display.startTenths)}%). Each step shows how much one group of stats moves that chance for this pairing, using each team&apos;s current numbers. The last bar is the model&apos;s home win chance, shown to one decimal place; the ribbon above rounds it to a whole number, so the two can differ slightly. This shows how the model weighs its inputs, not proof of what causes a result. Points and goals in the table above are not used by the model, so they do not appear here.
      </p>

      <div className="waterfall-chart mt-6" aria-hidden="true">
        <div className="waterfall-summary waterfall-row">
          <div>
            <p className="font-medium">Average match</p>
            <p className="mt-0.5 text-sm text-muted">Starting point: an average home team against an average visitor</p>
          </div>
          <div />
          <p className="waterfall-summary-value text-right font-tabular text-[28px] font-semibold leading-none text-ink">{formatTenths(display.startTenths)}%</p>
        </div>

        <div className="waterfall-direction-row text-sm text-muted">
          <span />
          <div className="flex justify-between">
            <span>&larr; Lowers the home win chance</span>
            <span>Raises the home win chance &rarr;</span>
          </div>
          <span />
        </div>

        {display.steps.map((step) => {
          return (
            <StepRow
              key={step.key}
              label={step.label}
              subLabel={step.subLabel}
              value={step.tenths}
              scale={stepScale}
            />
          );
        })}

        <div className="waterfall-model waterfall-row">
          <p className="font-medium">Model</p>
          <div />
          <p className="waterfall-summary-value text-right font-tabular text-[28px] font-semibold leading-none text-ink">{formatTenths(display.endTenths)}%</p>
        </div>
      </div>

      <ol className="sr-only">
        <li>Average match: home win chance {formatTenths(display.startTenths)} percent.</li>
        {display.steps.map((step) => (
          <li key={step.key}>{stepDescription(step)}</li>
        ))}
        <li>Model: home win chance {formatTenths(display.endTenths)} percent.</li>
      </ol>
    </section>
  );
}
