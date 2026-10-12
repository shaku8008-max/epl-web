import { getSupabaseClient } from "@/lib/supabase";
import type { Run } from "@/lib/types";

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