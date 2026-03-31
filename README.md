# ShipSense

ShipSense is a GitHub-first founder intelligence dashboard for open-source maintainers, indie hackers, and solo builders.

Instead of just aggregating repo metrics, ShipSense is designed to answer two questions:

1. Is this repository getting healthier or weaker?
2. What should I do next to keep momentum alive?

Today the product is centered on GitHub repository health, shipping streaks, score tracking, AI-generated insights, and a deterministic action checklist. The broader vision in [whole.md](./whole.md) expands that into a full founder operating system across GitHub, analytics, npm, and distribution signals.

## Current Product Scope

Implemented today:

- GitHub sign-in with Convex Auth
- Connect one or more GitHub repositories
- Background GitHub sync via Convex actions and cron jobs
- Repo health score generation
- Score history and momentum graph
- Shipping streak tracking
- AI insight generation with Gemini
- Deterministic task generation for next actions
- Premium landing page and login flow
- Billing plan model with free, indie, and builder tiers

Partially implemented or still evolving:

- Email reporting
- Better anomaly detection
- Richer task prioritization
- Traffic, npm, and search-console integrations
- Better sync observability and error states

## Stack

- SvelteKit 2
- Svelte 5
- Tailwind CSS 4
- Convex
- Convex Auth
- Convex Svelte
- Vercel adapter
- Gemini API for AI insights
- Dodo Payments for billing hooks

## App Architecture

### Frontend

- [src/routes/+page.svelte](./src/routes/+page.svelte): landing page
- [src/routes/auth/login/+page.svelte](./src/routes/auth/login/+page.svelte): GitHub sign-in
- [src/routes/dashboard/+page.svelte](./src/routes/dashboard/+page.svelte): connected repo overview
- [src/routes/dashboard/connect/+page.svelte](./src/routes/dashboard/connect/+page.svelte): repository connection flow
- [src/routes/dashboard/[repoId]/+page.svelte](./src/routes/dashboard/%5BrepoId%5D/+page.svelte): per-repository dashboard

### Convex backend

- [convex/schema.ts](./convex/schema.ts): tables for repos, snapshots, scores, insights, tasks, streaks, profiles
- [convex/repos.ts](./convex/repos.ts): repo connect/list/disconnect logic
- [convex/collector.ts](./convex/collector.ts): GitHub data collection
- [convex/scorer.ts](./convex/scorer.ts): repo health score and trend calculation
- [convex/taskGenerator.ts](./convex/taskGenerator.ts): deterministic task engine
- [convex/insightGenerator.ts](./convex/insightGenerator.ts): Gemini-based repo insights
- [convex/streakTracker.ts](./convex/streakTracker.ts): commit streak logic
- [convex/crons.ts](./convex/crons.ts): recurring collection and insight jobs
- [convex/auth.ts](./convex/auth.ts): GitHub OAuth provider config
- [convex/billing.ts](./convex/billing.ts): plan activation and plan state

## Health Score Model

ShipSense currently computes a health score from:

- stars
- commit recency
- open issues
- PRs merged in the last 7 days
- active contributors

The score is stored per snapshot. Trend is calculated by comparing the latest score with the previous score.

Important:
some inputs are still placeholders and need hardening, especially contributor and issue-response metrics. The UI and README reflect the current state of the codebase, not the final vision.

## Plans

Current plan configuration:

- Free: 1 repo
- Indie: 5 repos
- Builder: 50 repos

Higher tiers unlock better AI models and reporting capabilities.

## Environment Variables

You will need these before the full app works end-to-end.

### Auth

- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`

### Convex / client

- `PUBLIC_CONVEX_URL`

### AI

- `GEMINI_API_KEY`

### Email

- `RESEND_API_KEY`

### Billing

- `DODO_INDIE_PRODUCT_ID`
- `DODO_BUILDER_PRODUCT_ID`

Depending on your deployment setup, some of these will live in Convex env config and some in the app runtime environment.

## Local Development

Install dependencies:

```sh
npm install
```

Run the app:

```sh
npm run dev
```

Run type checks:

```sh
npm run check
```

Run tests:

```sh
npm run test
```

Build for production:

```sh
npm run build
```

## Convex Notes

This project uses Convex heavily.

Before editing Convex code, read:

- [convex/\_generated/ai/guidelines.md](./convex/_generated/ai/guidelines.md)

That file contains project-specific and framework-specific rules that take priority over generic Convex habits.

## Product Direction

The long-term direction is not “another analytics dashboard.”

ShipSense is meant to become:

- a repo health monitor
- a momentum tracker
- an action engine
- a founder report system

The deeper strategy, UX direction, pricing ideas, and growth positioning live in:

- [whole.md](./whole.md)

The active implementation backlog lives in:

- [task.md](./task.md)

## Known Gaps

Current known gaps include:

- some sync flows still need better debugging visibility
- email reports are not fully production-ready
- some score inputs are still simplified placeholders
- public/private GitHub scope could be narrowed later if product requirements change
- traffic, npm, and search-console integrations are not implemented yet

## Status

This repo is in active product iteration, not finished polish.

The current focus is:

1. make the GitHub-first loop trustworthy
2. tighten UX and retention
3. improve data quality
4. expand into the broader founder intelligence vision
