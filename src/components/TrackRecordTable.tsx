"use client";

import { useState } from "react";
import { probabilityColour } from "@/lib/colour";
import { formatDateOnly } from "@/lib/format";
import { fixtureKey, modelColour, modelLabel, trackedModels } from "@/lib/trackRecord";
import type { TrackRecord } from "@/lib/types";
import Card from "@/components/Card";
import Dropdown, { type DropdownOption } from "@/components/Dropdown";

type Filter = "all" | "home" | "draw" | "away";

function outcomeLabel(outcome: TrackRecord["result"]): string {
  return outcome === "H" ? "Home" : outcome === "D" ? "Draw" : outcome === "A" ? "Away" : "unavailable";
}

function outcomeTreatment(outcome: TrackRecord["result"]): string {
  const colour = outcome === "H" ? "text-better" : outcome === "A" ? "text-worse" : outcome === "D" ? "text-draw" : "text-muted";
  const tint = outcome === "H" ? "bg-better-soft" : outcome === "A" ? "bg-worse-soft" : outcome === "D" ? "bg-draw-soft" : "bg-tint";
  return `${colour} ${tint}`;
}

function probabilityCells(row: TrackRecord) {
  const percent = (value: number | null) => typeof value === "number" && Number.isFinite(value) ? `${Math.round(value * 100)}%` : "unavailable";
  return <><span className={probabilityColour("home", row.p_home, row.p_draw, row.p_away)}>H {percent(row.p_home)}</span> · <span className={probabilityColour("draw", row.p_home, row.p_draw, row.p_away)}>D {percent(row.p_draw)}</span> · <span className={probabilityColour("away", row.p_home, row.p_draw, row.p_away)}>A {percent(row.p_away)}</span></>;
}

function score(row: TrackRecord): string {
  return typeof row.home_goals === "number" && typeof row.away_goals === "number" ? `${row.home_goals}-${row.away_goals}` : "score unavailable";
}

function logLoss(value: number | null): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "unavailable";
}

export default function TrackRecordTable({ rows }: { rows: TrackRecord[] }) {
  const [model, setModel] = useState("all");
  const [predicted, setPredicted] = useState<Filter>("all");
  const [actual, setActual] = useState<Filter>("all");
  const [correct, setCorrect] = useState("all");
  const [openFilter, setOpenFilter] = useState<"model" | "predicted" | "actual" | "correct" | null>(null);
  const active = model !== "all" || predicted !== "all" || actual !== "all" || correct !== "all";
  const scoredModels = trackedModels.filter((item) => rows.some((row) => row.model_key === item.key));
  const outcomeOptions: DropdownOption[] = [{ value: "all", label: "All" }, ...(["home", "draw", "away"] as const).map((outcome) => ({ value: outcome, label: outcomeLabel(outcome === "home" ? "H" : outcome === "draw" ? "D" : "A"), badge: <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tint text-xs font-semibold text-ink">{outcome === "home" ? "H" : outcome === "draw" ? "D" : "A"}</span> }))];
  const modelOptions: DropdownOption[] = [{ value: "all", label: "All" }, ...scoredModels.map((item) => ({ value: item.key, label: item.label, badge: <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: modelColour(item.key).line }} /> }))];
  const correctOptions: DropdownOption[] = [{ value: "all", label: "All" }, { value: "correct", label: "Correct" }, { value: "incorrect", label: "Incorrect" }];
  const filteredRows = rows.filter((row) =>
    (model === "all" || row.model_key === model) &&
    (predicted === "all" || row.predicted_result === predicted.toUpperCase().charAt(0)) &&
    (actual === "all" || row.result === actual.toUpperCase().charAt(0)) &&
    (correct === "all" || (correct === "correct" ? row.correct === true : row.correct === false))
  );
  const clear = () => { setModel("all"); setPredicted("all"); setActual("all"); setCorrect("all"); };
  const filter = (name: "model" | "predicted" | "actual" | "correct", label: string, value: string, options: DropdownOption[], onChange: (value: string) => void) => <label className={`flex min-w-[calc(50%-0.5rem)] flex-1 flex-col gap-1 text-sm font-semibold sm:min-w-0 ${value !== "all" ? "text-ink" : "text-muted"}`}><span>{label}</span><Dropdown label={label} options={options} value={value} onChange={onChange} searchable={false} tinted={value !== "all"} open={openFilter === name} onOpen={() => setOpenFilter(name)} onClose={() => setOpenFilter(null)} /></label>;

  return <Card className="mt-8 p-0" variant="white">
    <div className="border-b border-border p-4 sm:p-5">
      <div className="flex flex-wrap items-end gap-3">
        {filter("model", "Model", model, modelOptions, setModel)}
        {filter("predicted", "Predicted", predicted, outcomeOptions, (value) => setPredicted(value as Filter))}
        {filter("actual", "Actual", actual, outcomeOptions, (value) => setActual(value as Filter))}
        {filter("correct", "Correct", correct, correctOptions, setCorrect)}
        <span className="pb-2 text-sm font-semibold text-muted">Showing {filteredRows.length} of {rows.length} scored matches</span>
         {active && <button type="button" onClick={clear} className="min-h-11 rounded-full border border-edge bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-tint focus-visible:outline-2 focus-visible:outline-ink">Clear filters</button>}
      </div>
      <p className="mt-3 text-sm text-muted">Filters change the table only; charts and win rates always use every scored match.</p>
    </div>
     {filteredRows.length === 0 ? <div className="p-6 text-muted">{active ? <><p>No scored matches match these filters</p><button type="button" onClick={clear} className="mt-3 min-h-11 rounded-full border border-border bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-tint">Clear filters</button></> : "No scored matches have been returned yet."}</div> : <div className="overflow-x-auto">
      <table className="w-full min-w-[60rem] text-left text-sm">
        <caption className="sr-only">Scored prediction matches, newest first</caption>
        <thead className="border-b border-border bg-tint text-xs uppercase tracking-wide text-muted"><tr>{["Date", "Match", "Model", "Probabilities", "Predicted", "Actual", "Correct", "Log loss"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead>
       <tbody className="divide-y divide-border">{filteredRows.map((row, index) => <tr key={`${row.model_key}-${fixtureKey(row)}-${index}`} tabIndex={0} style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }} className="epl-table-row transition-colors hover:bg-tint focus-within:bg-tint">
          <td className="whitespace-nowrap px-4 py-3">{row.fixture_date ? formatDateOnly(row.fixture_date) : "unavailable"}</td>
          <td className="min-w-40 px-4 py-3">{row.home ?? "Home unavailable"} v {row.away ?? "Away unavailable"}</td>
          <td className="px-4 py-3"><span className={`rounded-button px-2 py-1 font-semibold ${modelColour(row.model_key).text} ${modelColour(row.model_key).tint}`}>{modelLabel(row.model_key)}</span></td>
          <td className="whitespace-nowrap px-4 py-3 tabular">{probabilityCells(row)}</td>
          <td className="px-4 py-3"><span className={`rounded-button px-2 py-1 font-medium ${outcomeTreatment(row.predicted_result)}`}>{outcomeLabel(row.predicted_result)}</span></td>
          <td className="whitespace-nowrap px-4 py-3"><span className={`rounded-button px-2 py-1 font-medium ${outcomeTreatment(row.result)}`}>{outcomeLabel(row.result)} ({score(row)})</span></td>
          <td className="whitespace-nowrap px-4 py-3"><span className={`rounded-button px-2 py-1 font-medium ${row.correct === true ? "bg-better-soft text-better" : row.correct === false ? "bg-worse-soft text-worse" : "bg-tint text-muted"}`}>{row.correct === true ? "✓ Yes" : row.correct === false ? "✕ No" : "— unavailable"}</span></td>
          <td className="px-4 py-3 tabular">{logLoss(row.log_loss)}</td>
        </tr>)}</tbody>
      </table>
    </div>}
  </Card>;
}
