# ShipSense — Task Tracker

## Current Strategy

Ship the real product one feature at a time.

Focus order:

1. Fix correctness gaps in already-built features
2. Wire retention loops that make the product sticky
3. Improve trust and conversion UX
4. Expand intelligence depth only after the core loop works

## Phase 1 — Foundation + Auth (Day 1)

- [x] Scaffold SvelteKit project (Svelte 5, TypeScript)
- [x] Install core dependencies (Convex, convex-svelte, @convex-dev/auth)
- [x] Install & initialize shadcn-svelte
- [x] Configure Tailwind CSS + design tokens (app.css)
- [x] Set up svelte.config.js with adapter-vercel
- [x] Create Convex schema (schema.ts)
- [x] Create Convex auth config (auth.ts)
- [x] Set up root layout with Convex client (+layout.svelte)
- [x] Create auth login page
- [x] Set up hooks.server.ts (auth middleware)

## Phase 2 — Repo Connect + Data Collection (Day 2)

- [x] GitHub API client (GraphQL + REST)
- [x] Repo CRUD mutations (convex/repos.ts)
- [x] Data Collector Agent (convex/collector.ts)
- [x] Cron jobs config (convex/crons.ts)
- [x] Repo selector UI (connect page)

## Phase 3 — Health Score Engine (Day 3)

- [x] Score formula implementation (convex/scorer.ts)
- [x] HealthScore component (Implemented on Dashboard UI placeholders)
- [x] Main dashboard page

## Phase 4 — Insight Generator + Task Engine (Day 4)

- [x] LLM Insight Agent with Gemini (convex/insightGenerator.ts)
- [x] Deterministic Task Agent (convex/taskGenerator.ts)
- [x] InsightCard component
- [x] TaskChecklist component

## Phase 5 — Ship Streak + Momentum Graph (Day 5)

- [x] Streak Tracker (convex/streakTracker.ts)
- [x] ShipStreak component
- [x] MomentumGraph component

## Phase 6 — Email Reports + Growth Card (Day 6)

- [x] Email Agent (convex/email.ts)
- [x] Growth Card generator
- [x] GrowthCardModal component

## Phase 7 — Landing Page + Billing + Launch (Day 7)

- [x] Landing page refinement
  - [x] Enhance Hero Dashboard Preview (Animated Glass Cards)
  - [x] Add Vision Section (Maintainer Path)
  - [x] Add Pricing Section (Tiers)
  - [x] Add Final CTA Section
- [x] DodoPayments integration (billing.ts)
- [x] Webhook handler (http.ts)

## Phase 8 — Feature Gating & Plan Management (Day 8)

- [x] Centralized plan configuration
  - [x] Create convex/plan.ts (PLAN_CONFIG)
  - [x] Update connectRepo mutations (Repo Limits)
  - [x] Update insightGenerator (AI Model Tiers)
  - [x] Update email alerts (Plan Gates)

## Phase 9 — Dashboard Aesthetic Pivot (Day 9) [x]

- [x] High-End Spatial UI for Dashboard
  - [x] Refactor dashboard layout (Floating Glass Nav)
  - [x] Add background ambient glows to dashboard shell
  - [x] Redesign repository list cards (Glass-Card)
  - [x] Pivot Repo Detail page and widgets to Glassmorphism
- [x] TypeScript & Svelte 5 Diagnostics Fixes
  - [x] Resolve verbatimModuleSyntax errors
  - [x] Fix Svelte 5 @const placement & deprecated svelte:component
  - [x] Fix Convex backend schema & dependency scope errors
- [x] Final Production Build Verification (npm run build)
- [ ] Deploy to Vercel

## Phase 10 — Reality Check Fixes (Next)

- [x] Wire ship streak updates into the sync pipeline
- [x] Compute streak from latest commit date instead of leaving streak data stale
- [x] Verify streak UI reflects real repository activity
- [x] Replace placeholder score trend logic with real previous-vs-current comparison
- [x] Fix plan limits so paid tiers are strictly better than free
- [x] Align login consent copy with actual GitHub OAuth scopes
- [x] Replace default scaffold README with real product/project documentation

## Phase 11 — Data Quality Hardening

- [x] Implement real `starsLast7d` calculation from snapshot history
- [x] Replace placeholder `contributors14d` metric with real GitHub-derived data
- [x] Replace placeholder `medianIssueResponseHours` with real issue-response metric
- [x] Store and expose last synced timestamp per repository
- [x] Add collector error handling and visible sync failure states in the UI

## Phase 12 — Action Engine V1

- [x] Expand task generation beyond commit gap and generic issue triage
- [x] Add issue-based tasks for repos with growing open issue load
- [x] Add PR-based tasks for repos with stale open PRs
- [x] Add score-drop / anomaly-triggered tasks
- [x] Sort and display tasks by real priority in the dashboard

## Phase 13 — Retention Loop V1

- [x] Build a real daily or weekly report payload from repo insights
- [x] Schedule report sending through cron (Sundays 10am UTC)
- [x] Respect per-user report preferences (emailReportsEnabled toggle)
- [x] Add in-app setting to enable or disable reports (/dashboard/settings)
- [x] Add last report sent metadata for debugging and trust

## Phase 14 — Growth + Sharing UX

- [ ] Replace growth-card download placeholder with a real export flow
- [ ] Improve growth card copy so it reflects real repository state
- [ ] Add a success state after sharing / downloading
- [ ] Make dashboard empty states guide users toward first value faster

## Phase 15 — Beyond GitHub MVP

- [ ] Add npm downloads integration
- [ ] Add website traffic integration
- [ ] Add search console integration
- [ ] Unify GitHub + traffic + package metrics into a single insight layer
- [ ] Generate cross-channel recommendations instead of repo-only recommendations

## Working Rule

- [ ] Only start one unchecked feature at a time
- [ ] Finish implementation, verification, and UX copy before moving to the next feature
- [ ] Update this file after every completed feature
