"use server";

// Journal server actions and loaders. Everything here runs on the server and
// uses the service key (lib/supabaseAdmin), so the journal stays private and
// the service key never reaches the browser. The public key cannot read or
// write these tables (RLS denies anon access).

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { JournalEntry, Result } from "@/lib/types";

// All journal entries, oldest fixture first. The page groups open vs settled.
export async function getJournalEntries(): Promise<JournalEntry[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("journal")
    .select("*")
    .order("fixture_date", { ascending: true });
  if (error) throw new Error(`journal: ${error.message}`);
  return (data ?? []) as JournalEntry[];
}

// Settles every open entry whose match has a result in the `results` table:
// pick === result -> won, otherwise lost. Returns how many were settled.
// Idempotent: already-settled entries are skipped because only "open" rows
// are read. Called on every journal page load, so results settle as soon as
// the Python job uploads them.
export async function autoSettle(): Promise<number> {
  const supabase = getSupabaseAdminClient();

  const { data: openEntries, error: openErr } = await supabase
    .from("journal")
    .select("*")
    .eq("status", "open");
  if (openErr) throw new Error(`journal: ${openErr.message}`);
  if (!openEntries || openEntries.length === 0) return 0;

  const { data: results, error: resErr } = await supabase
    .from("results")
    .select("*");
  if (resErr) throw new Error(`results: ${resErr.message}`);

  const resultMap = new Map<string, Result>();
  for (const r of (results ?? []) as Result[]) {
    resultMap.set(`${r.home}|${r.away}|${r.fixture_date}`, r);
  }

  let settled = 0;
  for (const entry of openEntries as JournalEntry[]) {
    const r = resultMap.get(`${entry.home}|${entry.away}|${entry.fixture_date}`);
    if (!r || !r.result) continue;
    const status = entry.pick === r.result ? "won" : "lost";
    const { error } = await supabase
      .from("journal")
      .update({ status, result: r.result, settled_at: new Date().toISOString() })
      .eq("id", entry.id);
    if (error) throw new Error(`journal update: ${error.message}`);
    settled += 1;
  }
  return settled;
}

// Adds a new bet. The caller (AddBetForm) has already validated the values;
// this only inserts. `notes` is trimmed to null when blank.
export async function addEntry(input: {
  home: string;
  away: string;
  fixtureDate: string;
  pick: "H" | "D" | "A";
  stake: number;
  odds: number;
  notes: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const notes = input.notes?.trim() || null;
  const { error } = await supabase.from("journal").insert({
    home: input.home,
    away: input.away,
    fixture_date: input.fixtureDate,
    pick: input.pick,
    stake: input.stake,
    odds: input.odds,
    notes,
  });
  if (error) throw new Error(`journal insert: ${error.message}`);
  revalidatePath("/journal");
}

// Manual override: mark an entry won/lost/void, or back to open. Does not
// touch `result` (the actual match result, only known from the results table).
export async function settleEntry(
  id: number,
  status: "won" | "lost" | "void" | "open"
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const settled_at = status === "open" ? null : new Date().toISOString();
  const { error } = await supabase
    .from("journal")
    .update({ status, settled_at })
    .eq("id", id);
  if (error) throw new Error(`journal update: ${error.message}`);
  revalidatePath("/journal");
}

export async function deleteEntry(id: number): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("journal").delete().eq("id", id);
  if (error) throw new Error(`journal delete: ${error.message}`);
  revalidatePath("/journal");
}
