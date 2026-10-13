import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client built from the service key. The service key
// bypasses row-level security, so it must never reach the browser. The guard
// below throws if this file is ever bundled into a client component, where
// `window` exists (same pattern as lib/github.ts).

if (typeof window !== "undefined") {
  throw new Error("lib/supabaseAdmin must only be imported by server code.");
}

// Returns a Supabase client using the service key. Throws a clear error if
// the variable is missing, so a missing value in web/.env.local is easy to
// spot. The service key is server-only: no NEXT_PUBLIC_ prefix, so Next.js
// never inlines it into the browser bundle.
export function getSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url) {
    throw new Error(
      "Missing environment variable NEXT_PUBLIC_SUPABASE_URL. " +
        "Create web/.env.local (copy web/.env.example) and set it to your Supabase project URL."
    );
  }
  if (!key) {
    throw new Error(
      "Missing environment variable SUPABASE_SERVICE_KEY. " +
        "Set it in web/.env.local (server-only, never NEXT_PUBLIC_) to your Supabase service_role key."
    );
  }

  return createClient(url, key);
}
