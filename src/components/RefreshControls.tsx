"use client";

// Browser-side refresh controls: button, cooldown countdown and the polling
// loop while a workflow run is active. The server page passes the initial
// state once; after that this component talks to GET/POST /api/refresh only
// (never to GitHub or Supabase directly, and it never sees the token).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import type { RefreshStatus } from "@/app/api/refresh/route";
import { formatMelbourne } from "@/lib/format";

// Poll the status every 10 seconds while refreshing.
const POLL_MS = 10 * 1000;
// Give up after 5 minutes with no newer data.
const TIMEOUT_MS = 5 * 60 * 1000;

type Phase =
  | { name: "idle" }
  | { name: "refreshing"; startedAt: number; seenDataAsOf: string | null }
  | { name: "done"; newDataAsOf: string }
  | { name: "timedOut" }
  | { name: "error"; message: string; detail: string | null };

type RefreshControlsProps = {
  initial: RefreshStatus;
};

export default function RefreshControls({ initial }: RefreshControlsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<RefreshStatus>(initial);
  const [cooldownDone, setCooldownDone] = useState(false);
  // "now" for the cooldown check. Lives in state (ticked every 30 s) because
  // calling Date.now() during render breaks the purity lint rule. Declared
  // with the other hooks: hooks must run before any early return below.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(id);
  }, []);
  const [phase, setPhase] = useState<Phase>(() =>
    initial.runActive
      ? { name: "refreshing", startedAt: Date.now(), seenDataAsOf: initial.dataAsOf }
      : { name: "idle" }
  );
  // Timer ids, so polling and the countdown stop when they should.
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  // Latest phase inside timer callbacks (avoids stale state in closures).
  // Updated in an effect: writing a ref during render breaks the lint rule.
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  function stopPolling() {
    if (pollTimer.current) clearInterval(pollTimer.current);
    if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
    pollTimer.current = null;
    timeoutTimer.current = null;
  }

  // Minute tick while cooling down: refresh the status so the button
  // re-enables on time without a page reload.
  useEffect(() => {
    const waiting =
      phase.name === "idle" &&
      !status.runActive &&
      !cooldownDone &&
      status.nextAllowedAt;
    if (!waiting) return;
    cooldownTimer.current = setInterval(async () => {
      try {
        const res = await fetch("/api/refresh", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as RefreshStatus;
        setStatus(next);
        if (next.runActive) {
          setPhase({
            name: "refreshing",
            startedAt: Date.now(),
            seenDataAsOf: next.dataAsOf,
          });
        } else if (
          !next.nextAllowedAt ||
          new Date(next.nextAllowedAt).getTime() <= Date.now()
        ) {
          setCooldownDone(true);
        }
      } catch {
        // Keep the old state; the next tick retries.
      }
    }, 60 * 1000);
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, [phase.name, status.runActive, status.nextAllowedAt, cooldownDone]);

  // Polling loop while refreshing. Stops when data_as_of moves past the value
  // seen before dispatch (done), or after 5 minutes (timed out).
  useEffect(() => {
    if (phase.name !== "refreshing") return;
    const seen = phase.seenDataAsOf;
    const startedAt = phase.startedAt;

    async function pollOnce() {
      if (phaseRef.current.name !== "refreshing") return;
      try {
        const res = await fetch("/api/refresh", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as RefreshStatus;
        setStatus(next);
        if (next.dataAsOf && next.dataAsOf !== seen) {
          stopPolling();
          setPhase({ name: "done", newDataAsOf: next.dataAsOf });
          // Re-render server components (footer "Data as of") in place.
          router.refresh();
        } else if (Date.now() - startedAt > TIMEOUT_MS) {
          stopPolling();
          setPhase({ name: "timedOut" });
        }
      } catch {
        if (Date.now() - startedAt > TIMEOUT_MS) {
          stopPolling();
          setPhase({ name: "timedOut" });
        }
      }
    }

    pollOnce();
    pollTimer.current = setInterval(pollOnce, POLL_MS);
    timeoutTimer.current = setTimeout(() => {
      if (phaseRef.current.name !== "refreshing") return;
      stopPolling();
      setPhase({ name: "timedOut" });
    }, TIMEOUT_MS + POLL_MS);
    return stopPolling;
  }, [phase, router]);

  // Disabled from the moment it is pressed: prevents double submission.
  async function startRefresh() {
    if (phase.name === "refreshing") return;
    setPhase({
      name: "refreshing",
      startedAt: Date.now(),
      seenDataAsOf: status.dataAsOf,
    });
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      const json = (await res.json()) as {
        error?: string;
        dataAsOf?: string | null;
        nextAllowedAt?: string;
      };
      if (res.status === 202) {
        // Keep polling with the pre-dispatch value from the server.
        setPhase({
          name: "refreshing",
          startedAt: Date.now(),
          seenDataAsOf: json.dataAsOf ?? status.dataAsOf,
        });
        return;
      }
      stopPolling();
      if (res.status === 409 || res.status === 429) {
        setPhase({
          name: "error",
          message: json.error ?? "Please try again later.",
          detail: null,
        });
        if (json.nextAllowedAt) {
          setStatus((s) => ({ ...s, nextAllowedAt: json.nextAllowedAt ?? null }));
        }
      } else {
        setPhase({
          name: "error",
          message: "The refresh could not start.",
          detail: json.error ?? null,
        });
      }
    } catch {
      stopPolling();
      setPhase({
        name: "error",
        message: "The refresh could not start.",
        detail: "Network error. Check your connection and try again.",
      });
    }
  }

  if (phase.name === "refreshing") {
    return (
      <div className="mt-4" role="status">
        <Button disabled>
          <span
            aria-hidden="true"
            className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          Refreshing…
        </Button>
        <p className="mt-3 text-sm text-muted">
          Refreshing… this usually takes one to two minutes. You can leave this
          page; the new data will be here when you come back.
        </p>
      </div>
    );
  }

  if (phase.name === "done") {
    return (
      <div className="mt-4" role="status">
        <p className="font-semibold text-primary">Refresh complete</p>
        <p className="mt-1 text-sm text-muted">
          Data as of {formatMelbourne(phase.newDataAsOf)} (Melbourne time).
        </p>
        <p className="mt-3">
          <Link
            href="/"
            className="font-medium text-primary underline underline-offset-2"
          >
            View the new predictions
          </Link>
        </p>
      </div>
    );
  }

  if (phase.name === "timedOut") {
    return (
      <div className="mt-4" role="status">
        <p className="font-semibold">The update is taking longer than usual.</p>
        <p className="mt-1 text-sm text-muted">
          Please check back later — the new data will appear automatically.
        </p>
        <div className="mt-3">
          <Button onClick={() => setPhase({ name: "idle" })} variant="secondary">
            Check again
          </Button>
        </div>
      </div>
    );
  }

  if (phase.name === "error") {
    return (
      <div className="mt-4" role="alert">
        <p className="font-semibold">{phase.message}</p>
        {phase.detail && <p className="mt-1 text-sm text-muted">{phase.detail}</p>}
        <div className="mt-3">
          <Button onClick={() => setPhase({ name: "idle" })} variant="secondary">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  // Idle: ready now, or cooling down until nextAllowedAt passes.
  const coolingDown =
    !cooldownDone &&
    !status.runActive &&
    status.nextAllowedAt &&
    new Date(status.nextAllowedAt).getTime() > now;

  if (coolingDown && status.nextAllowedAt) {
    const timeOnly = new Date(status.nextAllowedAt).toLocaleTimeString("en-AU", {
      timeZone: "Australia/Melbourne",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return (
      <div className="mt-4">
        <Button disabled>Refresh data</Button>
        <p className="mt-3 text-sm text-muted">
          Data was updated recently. You can refresh again at {timeOnly}{" "}
          (Melbourne time).
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <Button onClick={startRefresh}>Refresh data</Button>
      <p className="mt-3 text-sm text-muted">
        Fetches the latest results and recomputes every prediction. Takes about
        two minutes.
      </p>
    </div>
  );
}
