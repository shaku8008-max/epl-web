import { getSupabaseClient } from "@/lib/supabase";
import type { Prediction, Run } from "@/lib/types";

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

// The 20 team names, alphabetically. Throws with the Supabase error message.
export async function getTeamNames(): Promise<string[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("team_stats")
    .select("team")
    .order("team");
  if (error) throw new Error(`team_stats: ${error.message}`);
  return ((data ?? []) as { team: string }[]).map((t) => t.team);
}