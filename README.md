# EPL Predictor website

Next.js site that reads precomputed Premier League match predictions from
Supabase. The model lives in the separate `epl-predictor/` Python project; this
website never runs the model, it only reads rows that the job uploads.

Pages: `/` (Predict: team picker, probabilities, team-stats comparison and the
next round), `/refresh` (triggers the predictor workflow on GitHub Actions and
polls until the new data arrives), `/status` (Supabase troubleshooting, not
indexed by search engines).

## Setup

1. Copy `.env.example` to `.env.local` and fill in the values below.
   `.env.local` is ignored by git.
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open http://localhost:3000

`npm run build` and `npm run lint` must pass before deploying.

## Environment variables (names only, never values)

Supabase (Project Settings -&gt; API). Both are public and inlined into the
browser bundle, which is safe for the publishable/anon key:

- `NEXT_PUBLIC_SUPABASE_URL` — the Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the publishable (or anon) key only;
  never the secret/service key.

Refresh trigger. Server-only: read by `src/app/api/refresh/route.ts` and
`src/lib/github.ts`, which run on the server. They must never gain a
`NEXT_PUBLIC_` prefix and must never be passed to a client component, or the
token would ship to visitors:

- `GITHUB_TOKEN` — fine-grained token limited to Actions read and write on the
  predictor repository.
- `GITHUB_OWNER` — repository owner.
- `GITHUB_REPO` — repository name.
- `GITHUB_WORKFLOW` — workflow file name.
- `GITHUB_REF` — git ref the workflow runs on.

