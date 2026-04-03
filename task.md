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

- [x] Replace growth-card download placeholder with a real export flow (html-to-image)
- [x] Add a success state after sharing / downloading
- [x] Make dashboard empty states guide users toward first value faster

## Phase 15 — Beyond GitHub MVP (Deferred to Phase 22)

Moved to Phase 22 for proper implementation with unified insights layer.

## Phase 16 — UX Improvements

### Tooltips & Help

- [x] Add tooltip component (src/lib/components/ui/tooltip/)
- [x] Add tooltips to health score metrics explaining each component
- [x] Add tooltips to streak, stars, forks in repo detail
- [x] Add "?" help button in header with keyboard shortcuts

### Keyboard Shortcuts

- [x] Add keyboard shortcuts handler
- [x] Implement `?` - Show keyboard shortcuts modal
- [x] Implement `r` - Refresh sync
- [x] Implement `d` - Go to dashboard
- [x] Implement `,` - Go to settings

### Empty States

- [x] Enhance dashboard empty state with illustration + CTA
- [x] Improve connect page empty state guidance

### Loading States

- [x] Audit all components for skeleton loading
- [x] Add shimmer animation to loading states

### Mobile Responsive

- [x] Audit dashboard on mobile viewports
- [x] Fix any overflow or layout issues
- [x] Ensure 44px minimum touch targets

---

## Phase 17 — Accessibility (A11y)

### Keyboard Navigation

- [x] Add skip link to main content
- [x] Verify logical tab order throughout app
- [x] Add keyboard support for all interactive elements

### Focus States

- [x] Add visible focus indicators (2px outline)
- [x] Implement focus trap in modals
- [x] Manage focus return after modal close

### Screen Reader Support

- [x] Add ARIA labels to all buttons and interactive elements
- [x] Add aria-live regions for dynamic content
- [x] Add proper heading hierarchy
- [x] Add alt text for images

### Color & Contrast

- [x] Audit WCAG AA contrast ratios
- [x] Fix any contrast issues found

### Forms & Inputs

- [x] Verify all form inputs have associated labels
- [x] Add required field indicators

### Reduced Motion

- [x] Respect prefers-reduced-motion media query
- [x] Pause animations when requested

---

## Phase 18 — Quick Product Enhancements

### Search & Filter

- [x] Add search input to dashboard for repos with many connected
- [x] Filter repos by name, language, health score range
- [x] Persist search state in URL params

### Bulk Connect

- [x] Add checkboxes to select multiple repos on connect page
- [x] "Connect Selected" batch action
- [x] Show total repo count in selection UI

---

## Phase 19 — Onboarding Tour

- [x] Create interactive walkthrough component (OnboardingTour.svelte)
- [x] Step 1: Welcome + value prop
- [x] Step 2: Connect first repo prompt
- [x] Step 3: Explain health score
- [x] Step 4: Show first task
- [x] Add tour trigger on first login (no repos state)
- [x] "Dismiss" and "Skip" options with localStorage persistence
- [x] "Start Tour" button in empty state

---

## Phase 20 — Real-time Updates

- [ ] Set up Convex realtime subscriptions for sync status
- [ ] Show "Live" indicator with pulse animation when actively syncing
- [ ] Push notifications for: sync complete, score change, streak break
- [ ] Implement using convex-svelte's realtime features

---

## Phase 21 — In-app Notifications

- [x] Create notification center dropdown in header
- [x] Notification types: score drops, streak breaks, new PRs needing review, weekly report sent
- [x] Mark as read / dismiss functionality
- [x] Persist notifications in Convex (notifications table)
- [x] Real-time updates when new notification arrives

---

## Phase 22 — Growth & Intelligence Features

### Phase 22A — Public Health Badge + Shareable Health Page

#### Badge Infrastructure

- [x] Add `slug` field to repos table (computed from owner/name)
- [x] Create `getPublicRepoHealth` query in convex/dashboard.ts
- [x] Create badge SVG generator (src/lib/badge/generateBadge.ts)
- [x] Create SVG badge endpoint (src/routes/api/badge/[repoId].svg/+server.ts)
- [x] Cache badge in Convex, regenerate on score change

#### Public Health Page

- [x] Create public route (src/routes/p/[slug]/+page.svelte)
- [x] Create public page component with metrics, score, activity
- [x] Add Open Graph meta tags for social sharing
- [x] Add "Track your repo" CTA on public page
- [x] Add "Get Badge" button in repo detail page
- [x] Add copy badge URL to clipboard feature

#### Badge Design

- [x] Design color-coded badge (Green 80+, Yellow 60-79, Orange 40-59, Red <40)
- [x] Make badge clickable → links to public health page
- [x] Add "Powered by ShipSense" branding on badge

### Phase 22B — README Quality Score

#### Backend

- [x] Fetch README content during sync (update convex/collector.ts)
- [x] Create README analyzer (convex/readmeAnalyzer.ts)
- [x] Implement scoring criteria: length, sections, code blocks, badges, license, contributing
- [x] Store readmeScore and readmeSuggestions in repoSnapshots

#### Frontend

- [x] Create ReadmeScore component (src/lib/components/dashboard/ReadmeScore.svelte)
- [x] Add ReadmeScore widget to repo detail page
- [x] Show actionable recommendations (what's missing, how to improve)

### Phase 22C — Dependency Monitoring

#### Schema

- [x] Add repoDependencies table to schema
- [x] Add dependency_alert notification type

#### Backend

- [x] Parse package.json, requirements.txt during sync
- [x] Create npm API client (convex/npmRegistry.ts)
- [x] Create dependency monitoring logic (convex/dependencies.ts)
- [x] Add dependency check to orchestrator sync pipeline
- [x] Add notifications for: vulnerabilities, major outdated, deprecated

#### Frontend

- [x] Create DependencyList component (src/lib/components/dashboard/DependencyList.svelte)
- [x] Add DependencyList widget to repo detail page
- [x] Show outdated count, vulnerability warnings, latest versions

### Phase 23 — Traction Loop V1

#### Anomaly Intelligence

- [x] Add repoAnomalies table to schema
- [x] Detect star spikes, contributor spikes, and momentum drops during sync
- [x] Add anomaly_alert notification type
- [x] Show anomaly alerts widget on repo detail page

#### Daily Action Loop

- [x] Upgrade task generation so anomaly alerts feed a stronger “what to do today” recommendation
- [x] Add a compact daily brief card combining anomaly + insight + top task

#### Growth Proof

- [ ] Surface “best week” and “momentum recovered” moments in the public/shareable views
- [ ] Promote anomaly wins into public growth-card copy when relevant

---

## Working Rule

- [ ] Only start one unchecked feature at a time
- [ ] Finish implementation, verification, and UX copy before moving to the next feature
- [ ] Update this file after every completed feature

## Score Transparency Fix (April 2026)

- [x] Fix score breakdown not showing after sync - now shows snapshot data even if score not calculated yet
