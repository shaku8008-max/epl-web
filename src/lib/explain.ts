import { getSupabaseClient } from "@/lib/supabase";

export type PredictionExplain = {
  home: string;
  away: string;
  start_pct: number;
  end_pct: number;
  steps: unknown;
  model: string;
  model_version: string;
  updated_at: string;
};

export type ExplainStep = {
  key: string;
  label: string;
  subLabel?: string;
  raw: number;
  tenths: number;
};

export type ExplainDisplay = {
  startTenths: number;
  endTenths: number;
  steps: ExplainStep[];
};

export type ExplainStepDefinition = {
  key: string;
  label: string;
  subLabel?: string;
  keys: readonly string[];
};

const STEP_DEFINITIONS: readonly ExplainStepDefinition[] = [
  {
    key: "elo",
    label: "Elo rating",
    keys: ["elo"],
  },
  {
    key: "attacking",
    label: "Attacking form",
    subLabel: "xG for, last 5 and 10 matches",
    keys: ["xg_for_last5", "xg_for_last10"],
  },
  {
    key: "defensive",
    label: "Defensive form",
    subLabel: "xG against, last 5 and 10 matches",
    keys: ["xg_against_last5", "xg_against_last10"],
  },
  {
    key: "long-run",
    label: "Long-run xG form",
    subLabel: "xG difference over a long run of matches",
    keys: ["xg_diff_ewm20", "xg_diff_ewm40"],
  },
] as const;

export const NN_STEP_DEFINITIONS: readonly ExplainStepDefinition[] = [
  {
    key: "elo",
    label: "Team strength (Elo)",
    subLabel: "How strong each team has been compared with its opponents.",
    keys: ["elo"],
  },
  {
    key: "recent_form",
    label: "Recent results",
    subLabel: "How each team has performed in its most recent matches.",
    keys: ["recent_form"],
  },
  {
    key: "shots",
    label: "Shots and shots on target",
    subLabel: "How often each team shoots and tests the goalkeeper.",
    keys: ["shots"],
  },
  {
    key: "goal_difference",
    label: "Longer-run goal difference",
    subLabel: "The balance between goals scored and conceded over time.",
    keys: ["goal_difference"],
  },
  {
    key: "venue_form",
    label: "Home and away form",
    subLabel: "How each team has performed in its usual home or away setting.",
    keys: ["venue_form"],
  },
  {
    key: "rest_days",
    label: "Days of rest",
    subLabel: "The gap since each team last played.",
    keys: ["rest_days"],
  },
];

function roundTenths(value: number): number {
  return Math.round(value * 10);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatKeyValue(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

export async function getPredictionExplain(
  home: string,
  away: string
): Promise<PredictionExplain | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("prediction_explain")
    .select("home, away, start_pct, end_pct, steps, model, model_version, updated_at")
    .eq("home", home)
    .eq("away", away)
    .maybeSingle();

  if (error) throw new Error(`prediction_explain: ${error.message}`);
  return (data ?? null) as PredictionExplain | null;
}

export async function getNnPredictionExplain(): Promise<PredictionExplain[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("nn_prediction_explain")
    .select("home, away, start_pct, end_pct, steps, model, model_version, updated_at");

  if (error) throw new Error(`nn_prediction_explain: ${error.message}`);
  return (data ?? []) as PredictionExplain[];
}

export function mergeExplainRow(
  row: PredictionExplain,
  definitions: readonly ExplainStepDefinition[] = STEP_DEFINITIONS,
  endPercent?: number
): ExplainDisplay | null {
  const start = formatKeyValue(row.start_pct);
  const end = formatKeyValue(row.end_pct);
  if (start === null || end === null || !isRecord(row.steps)) return null;

  const values = new Map<string, number>();
  for (const [key, value] of Object.entries(row.steps)) {
    const numeric = formatKeyValue(value);
    if (numeric === null) return null;
    values.set(key, numeric);
  }

  const rawTotal = Array.from(values.values()).reduce((sum, value) => sum + value, 0);
  if (Math.abs(rawTotal - (end - start)) > 0.005) return null;

  const steps: ExplainStep[] = definitions.map((definition) => ({
    key: definition.key,
    label: definition.label,
    subLabel: "subLabel" in definition ? definition.subLabel : undefined,
    raw: definition.keys.reduce((sum, key) => sum + (values.get(key) ?? 0), 0),
    tenths: 0,
  }));

  const mappedKeys = new Set(definitions.flatMap((definition) => definition.keys));
  const otherRaw = Array.from(values.entries())
    .filter(([key]) => !mappedKeys.has(key))
    .reduce((sum, [, value]) => sum + value, 0);
  const otherTenths = roundTenths(otherRaw);
  if (otherTenths !== 0) {
    steps.push({
      key: "other",
      label: "Other factors",
      raw: otherRaw,
      tenths: otherTenths,
    });
  }

  for (const step of steps) step.tenths = roundTenths(step.raw);

  const startTenths = roundTenths(start);
  const endTenths = roundTenths(endPercent ?? end);
  const displayedStepTotal = steps.reduce((sum, step) => sum + step.tenths, 0);
  const leftover = endTenths - startTenths - displayedStepTotal;

  if (leftover !== 0 && steps.length > 0) {
    const largest = steps.reduce((best, step, index) =>
      Math.abs(step.raw) > Math.abs(steps[best].raw) ? index : best,
      0
    );
    steps[largest].tenths += leftover;
  }

  if (startTenths + steps.reduce((sum, step) => sum + step.tenths, 0) !== endTenths) {
    return null;
  }

  return { startTenths, endTenths, steps };
}
