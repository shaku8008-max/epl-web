import { getSupabaseClient } from "@/lib/supabase";
import type {
  JevPrediction,
  NnPrediction,
  NnTeamStats,
  Prediction,
  Run,
  TrackRecord,
  TeamStats,
} from "@/lib/types";

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

// All neural-network prediction rows, including expected goals. Throws with
// the Supabase error message so the calling page can show it to the user.
export async function getNnPredictions(): Promise<NnPrediction[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("nn_predictions").select("*");
  if (error) throw new Error(`nn_predictions: ${error.message}`);
  return (data ?? []) as NnPrediction[];
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

// All 20 neural model team-stat rows, ordered alphabetically by team. The
// neural page falls back to no stats when this optional table is unavailable.
export async function getNnTeamStats(): Promise<NnTeamStats[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("nn_team_stats")
    .select("*")
    .order("team");
  if (error) throw new Error(`nn_team_stats: ${error.message}`);
  return ((data ?? []) as NnTeamStats[]).sort((a, b) =>
    a.team.localeCompare(b.team)
  );
}

// Scored predictions from the public track_record view, newest fixture first.
// The view owns the before-match-day filtering and scoring logic.
export async function getTrackRecord(): Promise<TrackRecord[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("track_record")
    .select("*")
    .order("fixture_date", { ascending: false });
  if (error) throw new Error(`track_record: ${error.message}`);
  return (data ?? []) as TrackRecord[];
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

// Settled Jev fixtures (result already filled in), newest first. Only finished
// matches are useful for the scoreboard. Public client only; throws with the
// Supabase error message so the calling page can report it.
export async function getJevSettledPredictions(): Promise<JevPrediction[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("jev_predictions")
    .select("*")
    .not("result", "is", null)
    .order("fixture_date", { ascending: false })
    .order("home", { ascending: true });
  if (error) throw new Error(`jev_predictions: ${error.message}`);
  return (data ?? []) as JevPrediction[];
}
