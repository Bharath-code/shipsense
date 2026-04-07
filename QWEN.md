# ShipSense — Project Context

## Overview

ShipSense is a **GitHub-first founder intelligence dashboard** built with SvelteKit 5 and Convex. It monitors repository health, tracks shipping streaks, generates AI-powered insights (via Gemini), and produces deterministic action checklists for open-source maintainers, indie hackers, and solo builders.

The core product loop: connect a GitHub repo → get a health score (0–100) → receive AI insights → complete prioritized tasks → maintain shipping momentum.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | SvelteKit 2, Svelte 5 (runes mode), TypeScript |
| **Styling** | Tailwind CSS 4, shadcn-svelte (Lyra style), glassmorphism UI |
| **Backend** | Convex (serverless database + functions) |
| **Auth** | Convex Auth + GitHub OAuth (`@convex-dev/auth`) |
| **AI** | Google Gemini API for insight generation |
| **Charts** | LayerChart |
| **Icons** | Lucide Svelte, Phosphor Svelte |
| **Deployment** | Vercel (adapter-vercel, Node.js 22 runtime) |
| **Billing** | Dodo Payments |
| **Email** | Resend |
| **Testing** | Vitest with `convex-test` + edge-runtime |

## Project Structure

```
shipsense/
├── convex/                    # Convex backend (serverless functions + schema)
│   ├── schema.ts              # Full data model (13+ tables)
│   ├── auth.ts                # GitHub OAuth provider config
│   ├── auth.config.ts         # JWT auth provider settings
│   ├── repos.ts               # Repo CRUD (connect/list/disconnect)
│   ├── collector.ts           # GitHub data collection (GraphQL + REST)
│   ├── scorer.ts              # Health score computation (Stars/Commits/Issues/PRs/Contributors)
│   ├── taskGenerator.ts       # Deterministic task engine
│   ├── insightGenerator.ts    # Gemini-powered AI insights
│   ├── streakTracker.ts       # Commit streak logic
│   ├── anomalies.ts           # Anomaly detection (star spikes, momentum drops)
│   ├── dependencies.ts        # Dependency monitoring (npm/pypi)
│   ├── readmeAnalyzer.ts      # README quality scoring
│   ├── trafficIntelligence.ts # Traffic & conversion analysis
│   ├── email.ts               # Daily digest email sending
│   ├── dailyDigests.ts        # Daily digest summary generation
│   ├── billing.ts             # Dodo Payments plan management
│   ├── plan.ts                # Plan configuration (free/indie/builder)
│   ├── http.ts                # HTTP endpoints (webhooks, badges)
│   ├── orchestrator.ts        # Sync pipeline orchestration
│   ├── crons.ts               # Scheduled jobs (collection, digests, etc.)
│   ├── notifications.ts       # In-app notification center
│   ├── dashboard.ts           # Dashboard data aggregation
│   ├── users.ts               # User profile management
│   ├── migrations.ts          # Schema/data migrations
│   └── _generated/            # Auto-generated Convex types + API refs
│       └── ai/guidelines.md   # Convex function guidelines (READ FIRST)
├── src/
│   ├── routes/                # SvelteKit file-based routing
│   │   ├── +page.svelte       # Landing page
│   │   ├── auth/login/        # GitHub sign-in
│   │   ├── dashboard/         # Main dashboard area
│   │   │   ├── +page.svelte   # Repo list with search/filter
│   │   │   ├── connect/       # Repository connection flow
│   │   │   └── [repoId]/      # Per-repository detail page
│   │   └── p/[slug]/          # Public health page (shareable)
│   ├── lib/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/            # shadcn-svelte primitives
│   │   │   └── dashboard/     # Dashboard-specific widgets
│   │   ├── badge/             # Health badge generation
│   │   └── constants/         # Labels, tooltips, config
│   ├── app.html               # Root HTML template
│   ├── app.d.ts               # TypeScript declarations
│   ├── hooks.server.ts        # Server hooks (security headers)
│   └── hooks.client.ts        # Client error handling
├── svelte.config.js           # SvelteKit config (Vercel adapter, runes)
├── vite.config.ts             # Vite + Vitest config
├── tsconfig.json              # TypeScript config (strict mode)
├── package.json               # Dependencies + scripts
└── task.md                    # Active implementation backlog
```

## Key Commands

```sh
# Install dependencies
npm install

# Start dev server (SvelteKit + Convex)
npm run dev

# Type check
npm run check          # one-shot
npm run check:watch    # watch mode

# Lint & format
npm run lint           # prettier + eslint
npm run format         # prettier --write

# Run tests
npm run test           # vitest (run once)
npm run test:unit      # vitest (watch mode)

# Build for production
npm run build
```

**Note:** Convex functions are developed separately with `npx convex dev` in the `convex/` directory. The dev server runs SvelteKit on one port and Convex on another.

## Data Model (Schema Overview)

The Convex schema defines these core tables:

| Table | Purpose |
|---|---|
| `userProfiles` | User profile, plan, billing, email preferences |
| `repos` | Connected GitHub repositories |
| `repoSnapshots` | Historical metric snapshots (every 6 hours) |
| `repoScores` | Computed health scores with trend direction |
| `repoInsights` | Cached Gemini-generated insights |
| `repoDailyDigests` | Daily summary briefs per repo |
| `repoTasks` | Actionable tasks (deterministic + anomaly-driven) |
| `repoAnomalies` | Detected signals (star spikes, momentum drops) |
| `repoDependencies` | Dependency monitoring (npm/pypi) |
| `shipStreaks` | Shipping streak state |
| `notifications` | In-app notification center |
| `repoReferrers` | Traffic referrer data |
| `repoSharePrompts` | Shareable win nudges |

## Health Score Model

The health score (0–100) is computed from 5 weighted components:

| Component | Weight | Logic |
|---|---|---|
| Stars | 35% | `min(stars / 100 * 35, 35)` |
| Commits | 25% | `max(0, 25 - commitGapHours * 0.5)` |
| Issues | 20% | `max(0, 20 - issuesOpen * 0.5)` |
| PRs | 10% | `min(prsMerged7d / 5 * 10, 10)` |
| Contributors | 10% | `min(contributors14d / 3 * 10, 10)` |

Trend (`up`/`down`/`stable`) is determined by comparing the latest score against the previous score.

## Development Conventions

### Convex Function Patterns

- **Always read** `convex/_generated/ai/guidelines.md` before editing Convex code — it contains project-specific rules that override general Convex knowledge.
- Use `internalQuery`, `internalMutation`, `internalAction` for internal functions; `query`, `mutation`, `action` for public API endpoints.
- Always include argument validators (`args`) on every function.
- Use `internal` and `api` objects from `_generated/api.ts` for function calls — never pass functions directly.
- Add type annotations on return values when calling functions in the same file (TypeScript circularity limitation).
- Queries and mutations are transactions — minimize `ctx.runQuery`/`ctx.runMutation` calls within a single function to avoid race conditions.

### Svelte 5

- The project uses **runes mode** by default (configured in `svelte.config.js`).
- Use `$state`, `$derived`, `$effect` for reactivity — not the old `let`/`$: ` syntax.
- Import from `$app/stores`, `$app/navigation`, `$app/environment` for SvelteKit runtime APIs.

### Testing

- Convex functions are tested with `convex-test` + Vitest + `@edge-runtime/vm`.
- Test files live alongside source files in `convex/` (e.g., `scorer.spec.ts`).
- Pass `import.meta.glob('./**/*.ts')` as the module map to `convexTest()` — it's required.

### Styling

- Uses Tailwind CSS 4 with shadcn-svelte component library.
- Design system uses glassmorphism with neutral base colors.
- Path aliases: `$lib/components` → UI components, `$convex` → convex directory.

### Auth Flow

- GitHub OAuth via Convex Auth. JWT cookie is set **client-side** after OAuth redirect.
- Auth guarding is done client-side in `dashboard/+layout.svelte` via `useAuth()`, NOT in server hooks (to avoid race conditions).
- Server hooks (`hooks.server.ts`) only add security headers.

## Plans

| Plan | Max Repos | AI Model | Reporting |
|---|---|---|---|
| Free | 1 | Basic | — |
| Indie | 5 | Better | Email reports |
| Builder | 50 | Best | Full reporting + team features |

## Environment Variables

| Variable | Purpose |
|---|---|
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth credentials |
| `PUBLIC_CONVEX_URL` | Convex deployment URL |
| `GEMINI_API_KEY` | Google Gemini API for insights |
| `RESEND_API_KEY` | Email delivery |
| `DODO_INDIE_PRODUCT_ID` / `DODO_BUILDER_PRODUCT_ID` | Dodo Payments product IDs |

## Active Development Focus

Check `task.md` for the current implementation backlog. The project is in active iteration — not finished polish. Current priorities center on:

1. Data quality hardening (real metrics instead of placeholders)
2. Retention loops (daily digests, email reports)
3. Growth intelligence (traffic analysis, benchmarking)
4. Notification preferences and workflow integrations

## Important Files to Know

- **`convex/schema.ts`** — Single source of truth for the data model
- **`convex/orchestrator.ts`** — Sync pipeline that chains collection → scoring → insights → tasks
- **`convex/crons.ts`** — All scheduled jobs (data collection, digests, emails)
- **`convex/plan.ts`** — Plan configuration and feature gating logic
- **`task.md`** — Implementation tracker with phase-by-phase progress
- **`mvp.md`** — Original MVP spec and architecture decisions
- **`whole.md`** — Broader product vision beyond current scope
