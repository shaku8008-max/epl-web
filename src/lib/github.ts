// Server-only GitHub helper: triggers the predictor workflow and checks
// whether a workflow run is active. Runs on the server only (route handlers
// import it; no client component ever does). The guard below throws if this
// file is ever bundled into the browser, where `window` exists.

// "server-only" is not installed, so this runtime check is the guard instead
// of adding a new npm package just for this.
if (typeof window !== "undefined") {
  throw new Error("lib/github must only be imported by server code.");
}

type GithubConfig = {
  token: string;
  owner: string;
  repo: string;
  workflow: string;
  ref: string;
};

// Current documented GitHub REST API version, sent on every request.
const GITHUB_API_VERSION = "2022-11-28";

export type ActiveRun = {
  active: boolean;
  startedAt: string | null;
};

// Reads the five server-only variables (no NEXT_PUBLIC_ prefix, so Next.js
// never inlines them into the browser bundle). Names any missing variable.
function readConfig(): GithubConfig {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const workflow = process.env.GITHUB_WORKFLOW;
  const ref = process.env.GITHUB_REF;

  const missing: string[] = [];
  if (!token) missing.push("GITHUB_TOKEN");
  if (!owner) missing.push("GITHUB_OWNER");
  if (!repo) missing.push("GITHUB_REPO");
  if (!workflow) missing.push("GITHUB_WORKFLOW");
  if (!ref) missing.push("GITHUB_REF");
  if (missing.length > 0) {
    throw new Error(`Missing environment variable(s): ${missing.join(", ")}.`);
  }

  return {
    token: token as string,
    owner: owner as string,
    repo: repo as string,
    workflow: workflow as string,
    ref: ref as string,
  };
}

// Short, safe message for GitHub failures: status code only, never the token
// and never the response body (which could echo secrets or internal details).
function githubError(action: string, status: number): Error {
  return new Error(`GitHub ${action} failed (status ${status}).`);
}

// Starts the predictor workflow via workflow dispatch. Any 2xx counts as
// success; anything else throws the safe error above.
export async function dispatchWorkflow(): Promise<void> {
  const { token, owner, repo, workflow, ref } = readConfig();
  const url =
    `https://api.github.com/repos/${owner}/${repo}` +
    `/actions/workflows/${workflow}/dispatches`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
      },
      body: JSON.stringify({ ref }),
    });
  } catch {
    throw new Error("Could not reach GitHub. Check your connection and try again.");
  }
  if (!res.ok) throw githubError("refresh", res.status);
}

// Whether a workflow run is currently queued or in progress. Checks both
// statuses with two small requests (per_page=1 keeps them cheap) because the
// runs endpoint filters to a single status per request.
export async function getActiveRun(): Promise<ActiveRun> {
  const { token, owner, repo, workflow } = readConfig();
  const base =
    `https://api.github.com/repos/${owner}/${repo}` +
    `/actions/workflows/${workflow}/runs`;

  async function earliestStart(status: "queued" | "in_progress"): Promise<string | null> {
    let res: Response;
    try {
      res = await fetch(`${base}?status=${status}&per_page=1`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": GITHUB_API_VERSION,
        },
      });
    } catch {
      throw new Error("Could not reach GitHub. Check your connection and try again.");
    }
    if (!res.ok) throw githubError("status check", res.status);
    const json = (await res.json()) as {
      workflow_runs?: { run_started_at?: string }[];
    };
    return json.workflow_runs?.[0]?.run_started_at ?? null;
  }

  const [queued, inProgress] = await Promise.all([
    earliestStart("queued"),
    earliestStart("in_progress"),
  ]);
  const startedAt = [queued, inProgress].filter((s) => s !== null).sort()[0] ?? null;
  return { active: startedAt !== null, startedAt };
}
