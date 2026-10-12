// Refresh status API. Server code only: reads runs via the Supabase
// public-key client and checks the workflow via the token helper.

import { getLatestRun } from "@/lib/data";
import { getActiveRun } from "@/lib/github";

// Never cached: every poll must see the newest runs row and workflow state.
export const dynamic = "force-dynamic";

// Cooldown between successful refreshes: 30 minutes after data_as_of.
export const REFRESH_COOLDOWN_MS = 30 * 60 * 1000;

export type RefreshStatus = {
  dataAsOf: string | null;
  runActive: boolean;
  runStartedAt: string | null;
  nextAllowedAt: string | null;
};

// Shared loader for GET and POST, so both report the same state shape.
// Throws safe errors (message only) that the handlers turn into JSON.
export async function loadRefreshStatus(): Promise<RefreshStatus> {
  const [run, active] = await Promise.all([getLatestRun(), getActiveRun()]);
  const dataAsOf = run?.data_as_of ?? null;
  const nextAllowedAt =
    dataAsOf === null
      ? null
      : new Date(new Date(dataAsOf).getTime() + REFRESH_COOLDOWN_MS).toISOString();
  return {
    dataAsOf,
    runActive: active.active,
    runStartedAt: active.startedAt,
    nextAllowedAt,
  };
}

// GET /api/refresh: current state for the page and its polling loop.
export async function GET(): Promise<Response> {
  try {
    const status = await loadRefreshStatus();
    return Response.json(status);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}

// POST /api/refresh: 409 if a run is active, 429 if inside the cooldown,
// otherwise dispatch the workflow and return 202 with the data_as_of seen
// before dispatching (the client polls until a newer one appears).
export async function POST(): Promise<Response> {
  try {
    const status = await loadRefreshStatus();

    if (status.runActive) {
      return Response.json(
        { error: "A refresh is already running. Please wait for it to finish." },
        { status: 409 }
      );
    }

    if (status.dataAsOf && status.nextAllowedAt) {
      const waitMs = new Date(status.nextAllowedAt).getTime() - Date.now();
      if (waitMs > 0) {
        const minutesLeft = Math.ceil(waitMs / 60000);
        return Response.json(
          {
            error:
              `Data was updated recently. You can refresh again in ` +
              `${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`,
            nextAllowedAt: status.nextAllowedAt,
          },
          { status: 429 }
        );
      }
    }

    const { dispatchWorkflow } = await import("@/lib/github");
    await dispatchWorkflow();
    return Response.json({ dataAsOf: status.dataAsOf }, { status: 202 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
