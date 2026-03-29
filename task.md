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
- [ ] GitHub API client (GraphQL + REST)
- [ ] Repo CRUD mutations (convex/repos.ts)
- [ ] Data Collector Agent (convex/collector.ts)
- [ ] Cron jobs config (convex/crons.ts)
- [ ] Repo selector UI (connect page)

## Phase 3 — Health Score Engine (Day 3)
- [ ] Score formula implementation (convex/scorer.ts)
- [ ] HealthScore component
- [ ] Main dashboard page

## Phase 4 — Insight Generator + Task Engine (Day 4)
- [ ] LLM Insight Agent with Gemini (convex/insightGenerator.ts)
- [ ] Deterministic Task Agent (convex/taskGenerator.ts)
- [ ] InsightCard component
- [ ] TaskChecklist component

## Phase 5 — Ship Streak + Momentum Graph (Day 5)
- [ ] Streak Tracker (convex/streakTracker.ts)
- [ ] ShipStreak component
- [ ] MomentumGraph component

## Phase 6 — Email Reports + Growth Card (Day 6)
- [ ] Email Agent (convex/email.ts)
- [ ] Growth Card generator
- [ ] GrowthCardModal component

## Phase 7 — Landing Page + Billing + Launch (Day 7)
- [ ] Landing page
- [ ] DodoPayments integration (billing.ts)
- [ ] Webhook handler (http.ts)
- [ ] Feature gates (plan.ts)
- [ ] Deploy to Vercel
