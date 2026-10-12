# EPL Predictor website

Next.js site that reads precomputed Premier League match predictions from
Supabase. The model lives in the separate `epl-predictor/` Python project; this
website never runs the model, it only reads rows that the daily job uploads.

## Setup

1. Copy `.env.example` to `.env.local` and fill in the two values from the
   Supabase dashboard (Project Settings -> API): the project URL and the
   publishable (or anon) key. `.env.local` is ignored by git.
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open http://localhost:3000

## Current state

Stage 1: the home page (`src/app/page.tsx`) is a temporary connection check. It
shows row counts from `predictions` and `team_stats`, the latest `runs` row, and
the team names, to prove the Supabase connection works.
