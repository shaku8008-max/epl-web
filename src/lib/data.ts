import { getSupabaseClient } from "@/lib/supabase";
import type { JevPrediction, Prediction, Run, TeamStats } from "@/lib/types";

// Latest prediction-job run, or null if there is no run yet or the query
// fails. Returns null instead of throwing so the footer can show
// "Data as of: unavailable" and the rest of the page still works; /status is
// the troubleshooting page that shows the real error messages.
export async function getLatestRun(): Promise<Run | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0] as Run;
  } catch {
    return null;
  }
}

// All 380 prediction rows (one per ordered pair of teams). Throws with the
// Supabase error message so the calling page can show it to the user.
export async function getPredictions(): Promise<Prediction[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("predictions").select("*");
  if (error) throw new Error(`predictions: ${error.message}`);
  return (data ?? []) as Prediction[];
}

// All 20 full team_stats rows (one per team), ordered alphabetically by team.
// One query serves both the picker names and the comparison card, so
// the browser never refetches when the selection changes. Throws with the
// Supabase error message so the calling page can show it to the user.
export async function getTeamStats(): Promise<TeamStats[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("team_stats")
    .select("*")
    .order("team");
  if (error) throw new Error(`team_stats: ${error.message}`);
  return ((data ?? []) as TeamStats[]).sort((a, b) =>
    a.team.localeCompare(b.team)
  );
}

// Upcoming Jev fixtures, oldest first. "Today" is the UTC date (fixture dates
// are UK dates; the Melbourne date runs ahead and would hide matches that have
// not kicked off yet). The filter is display-only: rows are never deleted.
export async function getJevPredictions(): Promise<JevPrediction[]> {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("jev_predictions")
    .select("*")
    .gte("fixture_date", today)
    .order("fixture_date", { ascending: true })
    .order("home", { ascending: true });
  if (error) throw new Error(`jev_predictions: ${error.message}`);
  return (data ?? []) as JevPrediction[];
}