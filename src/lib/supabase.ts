import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Returns a Supabase client built from the two public environment variables.
//
// NEXT_PUBLIC_ variables are inlined at build time and are safe to expose in
// the browser. We use the publishable (or anon) key only — never the secret
// or service key, per the project rules.
//
// Throws a clear error naming whichever variable is missing, so a missing
// value in web/.env.local is easy to spot.
export function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    throw new Error(
      "Missing environment variable NEXT_PUBLIC_SUPABASE_URL. " +
        "Create web/.env.local (copy web/.env.example) and set it to your Supabase project URL."
    );
  }
  if (!key) {
    throw new Error(
      "Missing environment variable NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
        "Create web/.env.local (copy web/.env.example) and set it to your Supabase publishable (or anon) key."
    );
  }

  return createClient(url, key);
}