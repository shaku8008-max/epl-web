# EPL predictor website

Next.js 16 (App Router, TypeScript, Tailwind 4) site, deployed on Vercel from
`main`. It reads precomputed predictions from Supabase. The models live in the
separate `epl-predictor` Python project (`~/epl_webapp/epl-predictor`). This
site never runs a model.

## Pages

| Route | What it is |
|---|---|
| `/` | Predict (Lean model): team picker, probabilities, team stats, waterfall, next round |
| `/neural` | Neural network predictions, expected goals, comparison with Lean, stats, waterfall, next fixtures |
| `/neural/outlook` | Season outlook from 10,000 simulated seasons (table, finish-chance bars, caveats) |
| `/track-record` | Live record of both models, log loss chart, scored matches, caveats |
| `/jev` | News-adjusted predictions (experiment) |
| `/jev/scoreboard` | Does Jev's shift beat the plain model on finished matches |
| `/journal`, `/journal/history` | Private bet journal with summary cards and a profit/loss area chart |
| `/refresh` | Triggers the predictor workflow on GitHub Actions and polls for new data |
| `/status` | Supabase troubleshooting, not indexed |

The model row (Lean, Neural network, Track record, Season outlook) is
`src/components/ModelTabs.tsx`; the main nav is `src/components/Tabs.tsx`.

## Setup

```bash
cd ~/epl_webapp/web
cp .env.example .env.local     # then fill in the values
npm install
npm run dev                    # http://localhost:3000
npm run lint && npm run build  # both must pass before merging
```

## Environment variables (names only, never values)

Public (inlined into the browser, safe for the publishable key):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable/anon key only, never the
  service key.

Server-only (never add a `NEXT_PUBLIC_` prefix, never pass to a client
component):
- `SUPABASE_SERVICE_KEY`: private `journal` and `results` tables (Journal
  page, auto-settle).
- `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_WORKFLOW`,
  `GITHUB_REF`: used by `src/app/api/refresh/route.ts` and `src/lib/github.ts`
  to dispatch the predictor workflow. Fine-grained token, Actions read/write
  on the predictor repo only.

On Vercel the same names go under Project Settings -> Environment Variables.

## Data it reads (Supabase)

Public (anon key): `predictions`, `team_stats`, `runs`, `nn_predictions`,
`nn_team_stats`, `nn_season_outlook`, `jev_predictions`, the `*_explain`
tables, and the view `track_record`. Private (service key): `journal`,
`results`.

`track_record` is a view (`security_invoker = true`) that joins
`prediction_history` and `nn_prediction_history` to `results` on
`(home, away, fixture_date)`, keeps rows with
`predicted_at < (fixture_date + 1)::timestamptz`, and adds `predicted_result`,
`correct` and per-match `log_loss`. Re-create it from the SQL kept in the
project notes if it is ever dropped.

## How the code is organised

- `src/app/*/page.tsx`: server components with `export const dynamic =
  "force-dynamic"`. Each has a plain `loadX()` function (no JSX inside
  try/catch, the linter forbids it) and a friendly error card.
- `src/lib/data.ts`: all Supabase reads. `src/lib/types.ts`: row types.
- `src/lib/colour.ts` and the tokens in `src/app/globals.css`: the one place
  for result colours. Green = home/better, red = away/worse, grey = draw.
  Colour is never the only signal (labels, signs or glyphs always accompany
  it).
- Interactive charts and cards are client components (waterfall, journal
  chart, track record chart, finish-chance bars) with hover, tap and keyboard.
- Null-safety: database numbers can be null, so format through helpers
  (`formatXg`, etc.) instead of calling `.toFixed` directly.

## How I ship changes

1. Branch from `main` (`git checkout -b some-name`).
2. Make the change (usually via an opencode prompt), then `npm run lint` and
   `npm run build`.
3. Commit with `git add -A src` after checking `git --no-pager status --short`
   lists only the expected files. **Forgetting to commit a file that the new
   code imports is the classic Vercel build failure.**
4. `git checkout main && git pull --ff-only && git merge --ff-only branch &&
   git push`. Vercel deploys `main`.

## Gotchas

- Stale or blank charts locally: stop the dev server, `rm -rf .next`, start
  again. Another dev server holding port 3000 moves you to 3001.
- zsh needs quotes around `"src/app/(predict)/page.tsx"`.
- A branch merged on GitHub (even by accident via a PR) makes a later
  `git push` of the same work get rejected. `git pull --ff-only` first.
- Use `git --no-pager` for log/diff/status.
- `/status` and `/refresh` need the server-only env vars to work.

## Honest-limits copy used on the site

Live record is thin; Lean's xG feed is stale since about late October; a
prediction counts only if stored before the end of match day (an
approximation); Lean and the NN are statistically tied on the 760-match
backtest; the season outlook holds team strength fixed and is probably
overconfident at the extremes.