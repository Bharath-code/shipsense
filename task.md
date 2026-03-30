# ShipSense — Task Tracker

## Phase 1 — Foundation + Auth (Day 1)

- [x] Scaffold SvelteKit project (Svelte 5, TypeScript)
- [x] Install core dependencies (Convex, convex-svelte, @convex-dev/auth)
- [x] Install & initialize shadcn-svelte
- [x] Configure Tailwind CSS + design tokens (app.css)
- [x] Set up svelte.config.js with adapter-vercel
- [x] Create Convex schema (schema.ts)
- [x] Create Convex auth config (auth.ts)
- [ ] Set up root layout with Convex client (+layout.svelte)
- [ ] Create auth login page
- [ ] Set up hooks.server.ts (auth middleware)

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
- [ ] DodoPayments integration (billing.ts)
- [ ] Webhook handler (http.ts)
- [ ] Feature gates (plan.ts)
- [ ] Deploy to Vercel
