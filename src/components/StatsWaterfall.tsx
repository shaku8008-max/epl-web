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
  return "bg-border";
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
  before,
  after,
  scaleMin,
  scaleRange,
}: {
  label: string;
  subLabel?: string;
  value: number;
  before: number;
  after: number;
  scaleMin: number;
  scaleRange: number;
}) {
  const left = ((Math.min(before, after) - scaleMin) / scaleRange) * 100;
  const width = (Math.abs(after - before) / scaleRange) * 100;
  const move = direction(value);

  return (
    <div className="grid grid-cols-[minmax(7rem,1fr)_minmax(0,1.5fr)_4.5rem] items-center gap-3 border-t border-border py-3 sm:grid-cols-[minmax(12rem,1fr)_minmax(14rem,3fr)_6rem]">
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        {subLabel && <p className="mt-0.5 text-sm text-muted">{subLabel}</p>}
      </div>
      <div className="relative h-8" aria-hidden="true">
        <span className="absolute inset-x-0 top-1/2 border-t border-border" />
        <span
          className={`absolute top-1/2 h-4 -translate-y-1/2 ${stepColour(value)}`}
          style={{ left: `${left}%`, width: `max(2px, ${width}%)` }}
        />
      </div>
      <div className={`text-right ${stepTextColour(value)}`}>
        <p className="font-tabular font-semibold">{signedValue(value)}</p>
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
  const values = [
    display.startTenths / 10,
    ...display.steps.reduce<number[]>((running, step) => {
      running.push(running[running.length - 1] + step.tenths / 10);
      return running;
    }, [display.startTenths / 10]),
    display.endTenths / 10,
  ];
  const scaleMin = Math.min(...values) - 2;
  const scaleMax = Math.max(...values) + 2;
  const scaleRange = scaleMax - scaleMin || 1;
  const start = display.startTenths / 10;
  const end = display.endTenths / 10;

  return (
    <section className="lg:col-span-2 border-t border-border pt-6" aria-labelledby="stats-waterfall-heading">
      <h2 id="stats-waterfall-heading" className="font-heading text-2xl font-semibold">
        How the stats move the home win chance
      </h2>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed">
        The chart starts from the home win chance for an average home team against an average visiting team ({formatTenths(display.startTenths)}%). Each step shows how much one group of stats moves that chance for this pairing, using each team&apos;s current numbers. The last bar is the model&apos;s home win chance, shown to one decimal place; the ribbon above rounds it to a whole number, so the two can differ slightly. This shows how the model weighs its inputs, not proof of what causes a result. Points and goals in the table above are not used by the model, so they do not appear here.
      </p>

      <div className="mt-6">
        <div className="grid grid-cols-[minmax(7rem,1fr)_minmax(0,1.5fr)_4.5rem] items-center gap-3 border-y border-border py-3 sm:grid-cols-[minmax(12rem,1fr)_minmax(14rem,3fr)_6rem]">
          <p className="font-medium">Average match</p>
          <div className="relative h-8" aria-hidden="true">
            <span className="absolute inset-x-0 top-1/2 border-t border-border" />
            <span
              className="absolute top-1/2 h-5 w-1 -translate-x-1/2 -translate-y-1/2 bg-primary"
              style={{ left: `${((start - scaleMin) / scaleRange) * 100}%` }}
            />
          </div>
          <p className="text-right font-tabular font-semibold text-primary">{formatTenths(display.startTenths)}%</p>
        </div>

        {display.steps.map((step, index) => {
          const before = values[index];
          const after = values[index + 1];
          return (
            <StepRow
              key={step.key}
              label={step.label}
              subLabel={step.subLabel}
              value={step.tenths}
              before={before}
              after={after}
              scaleMin={scaleMin}
              scaleRange={scaleRange}
            />
          );
        })}

        <div className="grid grid-cols-[minmax(7rem,1fr)_minmax(0,1.5fr)_4.5rem] items-center gap-3 border-t border-border py-3 sm:grid-cols-[minmax(12rem,1fr)_minmax(14rem,3fr)_6rem]">
          <p className="font-medium">Model</p>
          <div className="relative h-8" aria-hidden="true">
            <span className="absolute inset-x-0 top-1/2 border-t border-border" />
            <span
              className="absolute top-1/2 h-5 -translate-x-1/2 -translate-y-1/2 bg-primary"
              style={{ left: `${((end - scaleMin) / scaleRange) * 100}%`, width: "4px" }}
            />
          </div>
          <p className="text-right font-tabular font-semibold text-primary">{formatTenths(display.endTenths)}%</p>
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
