// Row types for the four Supabase tables (public schema).
// supabase-js returns database dates and timestamps as strings:
//   date columns      -> "YYYY-MM-DD"
//   timestamptz columns -> ISO string, e.g. "2026-10-12T02:30:00+00:00"

// Table `predictions`: one row per ordered pair of teams, 380 rows.
// Primary key (home, away).
export type Prediction = {
  home: string;
  away: string;
  p_home: number;
  p_draw: number;
  p_away: number;
  fixture_date: string | null; // null unless it is a real upcoming fixture
  model: string;
  model_version: string;
  predicted_at: string;
};

// A prediction row that is a real upcoming fixture (fixture_date is set).
export type Fixture = Prediction & { fixture_date: string };

// Table `team_stats`: one row per team, 20 rows. Primary key (team).
// The "last5"/"last10" columns are per-match averages, not totals.
export type TeamStats = {
  team: string;
  elo: number;
  points_last5: number;
  goals_for_last5: number;
  goals_against_last5: number;
  xg_for_last5: number;
  xg_against_last5: number;
  xg_for_last10: number;
  xg_against_last10: number;
  xg_diff_ewm20: number;
  xg_diff_ewm40: number;
  updated_at: string;
};

// Table `prediction_history`: next-round fixtures with results filled in once
// played. Same columns as `predictions` plus the three below.
// Primary key (home, away, fixture_date).
export type PredictionHistory = Prediction & {
  home_goals: number | null; // null until played
  away_goals: number | null; // null until played
  result: "H" | "D" | "A" | null; // null until played
};

// Table `runs`: one row per prediction job run.
export type Run = {
  id: number;
  started_at: string;
  data_as_of: string;
  model: string;
  model_version: string;
  xg_ok: boolean;
  status: string;
};