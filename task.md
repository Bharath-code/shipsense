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

- [x] Surface “best week” and “momentum recovered” moments in the public/shareable views
- [x] Promote anomaly wins into public growth-card copy when relevant

### Phase 24 — Share Nudges

- [x] Nudge users after sync when a share-worthy win is detected
- [x] Dedupe prompts per event so repeated syncs do not spam the same nudge
- [x] Connect prompt CTA directly to X share flow

### Phase 25 — Daily Habit Loop

#### Daily Digest

- [x] Create a daily digest model that summarizes repo changes, top risk, top win, and one recommended action
- [x] Add a daily digest card to the dashboard with “what changed since yesterday”
- [x] Trigger digest generation on schedule so each active repo gets a fresh morning brief
- [x] Add a lightweight “nothing major changed” fallback so the digest still feels useful on quiet days

#### Daily Focus

- [x] Promote exactly one primary “do this today” action above the rest of the task list
- [x] Add expected-impact copy to daily actions so users understand why the recommendation matters
- [x] Highlight whether today’s action comes from anomaly, trend, dependency risk, or README weakness

### Phase 26 — Goals & Progress

#### Personalized Goals

- [ ] Add repo goals table for user-defined targets like score milestones, streak targets, and issue response goals
- [ ] Create goal setup UX with suggested starter goals for new repos
- [ ] Show goal progress bars and completion states on the dashboard
- [ ] Trigger celebration states when a goal is reached and suggest a follow-up goal

#### Progress Memory

- [ ] Build a timeline of key wins and regressions so users can see how the repo is evolving
- [ ] Connect actions to outcomes where possible, such as README improvements followed by better repo health
- [ ] Add “since last week” and “since last month” progress summaries to reinforce momentum

### Phase 27 — Benchmarking & Context

#### Repo Benchmarking

- [ ] Define benchmark cohorts by repo size, language, and project type
- [ ] Compare repo health, issue responsiveness, and contributor activity against similar repos
- [ ] Add benchmark insights like “faster than similar repos” or “lagging on contributor activation”
- [ ] Show benchmark context in dashboard and public-growth surfaces without overwhelming the user

#### Watchlists

- [ ] Let users subscribe to specific signals like stars, contributors, issue latency, dependency risk, and README quality
- [ ] Add per-metric thresholds so users can choose what counts as noteworthy
- [ ] Use watchlists to personalize alerts, digests, and share prompts

### Phase 28 — Wins, Recovery & Celebration

#### Win Detection

- [x] Expand growth moments to include streak milestones, contributor milestones, score recoveries, and best month
- [x] Add celebratory UI states for notable wins so the product feels rewarding, not only corrective
- [x] Generate reusable "win cards" for sharing recent milestones across public and private views

#### Recovery Loops

- [x] Detect recovery states after a prior slowdown, not just the slowdown itself
- [x] Show "you recovered from" messaging to reinforce continued use after a bad week
- [x] Feed recovery moments into the daily digest and share nudge system

### Phase 29 — Notification Preferences

#### Alert Controls

- [ ] Add notification preference settings for quiet mode, important-only, and growth mode
- [ ] Let users choose channel preferences for in-app, email, and future Slack/Discord delivery
- [ ] Add per-event toggles for anomalies, streaks, wins, dependency alerts, and share nudges
- [ ] Respect snooze windows so the product does not over-notify during heavy activity

#### Delivery Quality

- [ ] Add dedupe and cooldown rules across all notification types, not just share prompts
- [ ] Prioritize user-facing notifications by urgency and likely usefulness
- [ ] Track notification engagement so low-value alerts can be refined or removed

### Phase 30 — Workflow Integrations

### Phase 31 — Dashboard Simplification & Information Architecture

#### Core Product Loop

- [x] Re-center the repo detail experience around 3 questions: what changed, what matters, what should I do next
- [x] Reduce the default dashboard to one primary decision path instead of showing every feature at once
- [x] Define success criteria for the default view: understandable in under 5 seconds, trusted at a glance, actionable without scrolling

#### New Tab Structure

- [x] Add tab navigation to the repo detail page: `Overview`, `Tasks`, `Signals`, `Health`, `Share`
- [x] Make `Overview` the default tab for every repo
- [x] Preserve direct deep-linking to tabs with URL params so shared links can open the right section
- [x] Ensure mobile tab behavior remains compact and touch-friendly

#### Overview Tab

- [x] Keep only the highest-signal modules above the fold: health score, trend, last synced status, daily digest, top anomaly, top task
- [x] Collapse score breakdown into a secondary expandable area instead of a competing primary card
- [x] Shrink ship streak from a large widget into a compact supporting stat unless it is the primary insight
- [x] Keep sync freshness and trust signals visible near the top so users know the data is current

#### Tasks Tab

- [x] Move the full task checklist out of the main dashboard flow into the dedicated `Tasks` tab
- [x] Highlight one “today’s focus” task at the top of the `Tasks` tab
- [x] Group remaining tasks by priority or source so the list feels operational, not noisy

#### Signals Tab

- [x] Move anomaly alerts and the momentum graph into the `Signals` tab
- [x] Keep "top signal" summarized in `Overview` and move historical/detail views behind this tab
- [x] Move historical score/trend explanation into `Signals` so the default view stays lighter

#### Health Tab

- [x] Move README score and dependency monitoring into the `Health` tab
- [x] Reframe this tab as repo hygiene and maintainability, not growth
- [x] Keep a compact health summary on `Overview` only if it directly changes the recommended next action

#### Share Tab

- [x] Move growth card, badge, public health page link, and share nudges into the `Share` tab
- [x] Remove share actions from the main above-the-fold workflow unless a notable win is detected
- [x] Keep sharing available but clearly secondary to repo operations

#### Visual Priority Cleanup

- [x] Audit the repo detail page for widgets competing with the main action and remove redundant framing
- [x] Reduce the number of equal-weight glass cards visible on first load
- [x] Standardize section hierarchy so only one primary CTA or action exists per viewport
- [x] Review whether decorative UI is slowing comprehension and simplify where clarity wins

#### Validation

- [x] Run an internal UX pass on desktop and mobile to verify the new IA feels calmer and faster to scan
- [x] Confirm that users can still discover README, dependency, and sharing features without cluttering the default view
- [ ] Revisit landing page copy after the dashboard simplification so positioning matches the calmer product experience

#### Delivery Channels

- [x] Add email delivery for daily digests and important repo alerts
- [ ] Add Slack integration for teams who want sync summaries and anomalies in-channel
- [ ] Add Discord integration for open-source maintainers managing communities there

#### In-Flow Usage

- [ ] Deliver “top action today” into external channels with a deep link back to the repo dashboard
- [ ] Add GitHub-friendly surfaces where useful, such as optional issue/comment summaries for maintainers
- [ ] Ensure integrations reuse the same digest, anomaly, and win engine so product logic stays consistent

---

## Working Rule

- [ ] Only start one unchecked feature at a time
- [ ] Finish implementation, verification, and UX copy before moving to the next feature
- [ ] Update this file after every completed feature

- [x] Fix score breakdown not showing after sync - now shows snapshot data even if score not calculated yet

## Phase 32 — Product Strategy Sprint (April 2026)

### Immediate (from impl plan §7)

- [x] Build Conversion Funnel composite (views → stars → clones → contributors) — ConversionFunnel.svelte + trafficIntelligence.ts
- [x] Add Momentum Vector (Accelerating | Coasting | Stalling) — computed from score trend + star velocity + commit freshness
- [x] Restructure tabs → Overview | Growth | Health | Tasks | Share
- [x] Implement blurred/teased paywall on Traffic Intelligence and Conversion Funnel for free users — PaywallBlur.svelte

### Short-term (from impl plan §7)

- [x] Add star forecast (linear regression projection toward next milestone) — getStarForecast query + StarForecast.svelte
- [x] Wire StarForecast into Growth tab alongside ConversionFunnel
- [x] Add network ranking percentile badge ("Top 10% of frameworks") — BenchmarkBadge.svelte
- [x] Integrate BenchmarkBadge into Overview tab (below Daily Brief)
- [x] Add weekly summary email for lapsed users (7+ days since last daily digest) — orchestrator.ts sendDailyDigests upgrade

### Medium-term (from impl plan §7)

- [x] Refactor pricing page to frame around intelligence layers, not repo count (Free = Health, Indie = Predictive Intelligence, Builder = Operations)
- [x] Add modeled impact to task engine (e.g. "This PR will push Health to 85")
- [ ] Implement team-level portfolio health overview
- [ ] Add Slack / Discord webhooks for anomalies and weekly summaries

---

## Phase 33 — Pre-Launch Polish Sprint

> Goal: make the product shippable for paid plans. All items are quick-to-medium wins that improve discoverability, trust, and conversion.

### SEO / Discovery

- [x] Add `<link rel="canonical">` to all pages (landing, login, dashboard, public health, legal)
- [x] Generate OG social preview image (1200×630) — create `/api/og/+server.ts` endpoint that renders a branded card with headline + mock dashboard
- [x] Add `og:image`, `twitter:image`, and `og:site_name` meta tags to landing + login pages
- [x] Add `<meta name="author">` and `<meta name="theme-color">` to layout
- [x] Add JSON-LD `SoftwareApplication` schema to landing page (name, description, offers, aggregateRating placeholder)
- [x] Add JSON-LD `FAQPage` schema to landing page (4-5 FAQs about what ShipSense does)
- [x] Create `/sitemap.xml` route listing: landing, login, legal pages, and all public health pages (`/p/[slug]`)
- [x] Add `Sitemap:` directive to `static/robots.txt`
- [x] Fix public health page `og:image` — replace tiny badge URL with proper 1200×630 social card endpoint

### Accessibility

- [x] Fix `prefers-reduced-motion` for landing page — inline `@keyframes float` and `@keyframes pulse-soft` are not covered by global reduced-motion rule
- [x] Add focus trapping to `OnboardingTour` modal (Tab/Shift+Tab should stay inside)
- [x] Add focus trapping to `NotificationCenter` dropdown
- [x] Add mobile hamburger menu to landing page nav (links are `hidden md:flex` — invisible on mobile)
- [x] Add `aria-hidden="true"` to decorative SVG icons (hero CTA arrow, login page mock stats, nav fingerprint icon)
- [x] Add "Back to home" link on login page (above the fold)
- [x] Add `role="alert"` to ErrorBoundary error state for screen reader announcement

### UX / Conversion

- [x] Add social proof section to landing page — "Trusted by X maintainers", repo count, or early adopter testimonials
- [x] Add annual/monthly pricing toggle with discount (e.g. "Save 20% with annual")
- [x] Add floating "Get Started Free" CTA that appears after scrolling past hero
- [x] Add "See a live demo" link to a pre-seeded public health page (let users experience product before auth)
- [x] Change "Most popular" badge on Indie plan to "Recommended" (product is in beta, "most popular" is unverifiable)
- [x] Add email capture on landing page — "Get a free health report for any repo" input without requiring GitHub OAuth
- [x] Add `.env.example` to repo root documenting required env vars
- [x] Fix design inconsistencies across landing and dashboard
  - [x] Replace hardcoded `https://shipsense.app` with relative `/p/example` path
  - [x] Dashboard header: `bg-white/5` → `bg-background/80` (CSS variable, works in light/dark theme)
  - [x] Dashboard nav items: `bg-white/5` / `bg-white/10` → `bg-muted` (theme-aware)
  - [x] Dashboard icon buttons: `bg-white/5` → `hover:bg-muted` (consistent hover state)
  - [x] Dashboard divider: `bg-white/10` → `bg-border` (theme-aware)
  - [x] Dashboard ambient glow: empty div → matching 100px blur animated glows (same as landing)
- [x] Fix auth redirect on page reload — `wasAuthenticated` was volatile `$state(false)` resetting on reload, guard fired before token restoration
  - [x] Remove `wasAuthenticated` flag entirely
  - [x] Single `$effect`: wait for `auth.isLoading` → if not authenticated → redirect
- [x] Add founding member pricing — 50 spots at $4.50/mo (50% off Indie, forever) with urgency banner + progress bar
  - [x] Add `foundingMembers` table to Convex schema
  - [x] Create `getFoundingMemberCount` public query for landing page
  - [x] Create `claimFoundingMemberSpot` internal mutation (auto-claimed via DodoPayments webhook)
  - [x] Create `claimMyFoundingMemberSpot` public mutation (manual user claim)
  - [x] Wire auto-claim into billing `activateSubscription` for Indie plan
  - [x] Update landing page `+page.server.ts` to fetch real count from Convex
  - [x] Write 10 test cases (capacity logic, duplicate prevention, pricing math, progress display)
- [x] Add plan management to settings page — current plan card, usage meter, inline plan picker, Dodo checkout redirect
  - [x] Create `getMyProfile` query (plan + repo count + billing info)
  - [x] Create `getCheckoutUrl` mutation (generates Dodo checkout link)
  - [x] Build current plan card with usage meter (repos used / limit)
  - [x] Build inline 3-column plan picker (expandable "Change Plan" section)
  - [x] Wire "Manage billing" link to Dodo customer portal
  - [x] Fix free plan maxRepos from 10 → 1 (matching actual enforcement)

### Code Quality / DevEx

- [x] Replace hardcoded `https://shipsense.app` in `src/routes/p/[slug]/+page.svelte` with relative paths (`/` and `/auth/login`)
- [x] Replace NotificationCenter's custom dropdown with focus trap + outside click detection
- [x] Clean up `OnboardingTour` — remove unused `createEventDispatcher` (Svelte 4 pattern), keep only runes
- [x] Add FAQ section to landing page as accordion (5 questions: "What is ShipSense?", "What data do you access?", "Is it free?", "Do I need to install anything?", "Can I use it for private repos?")

### Performance

- [x] Add `content-visibility: auto` to below-the-fold landing page sections (capabilities, vision, pricing, CTA)
- [x] Reduce ambient glow blur from `blur-[140px]` to `blur-[100px]` for mobile perf

---

## Phase 34 — Gemini Prompt Reliability & Output Quality

> Goal: Make AI insights deterministic, structured, and trustworthy. Users should get consistent, actionable guidance — not vague, varying text.

### Problem

Current Gemini prompting has 4 critical reliability gaps:
1. No output validation — malformed JSON or missing keys gets saved to DB
2. No `responseSchema` — Gemini can return any JSON shape
3. No temperature/seed — identical inputs produce different outputs
4. Missing trend context — Gemini doesn't know if repo is improving or declining

### Prompt Structure Overhaul

- [x] Restructure prompt with explicit XML-tagged sections: `<role>`, `<task>`, `<repository>`, `<metrics>`, `<output_format>`
- [x] Add metric glossary so Gemini knows what each field means and its time window (e.g. "prsMerged7d = PRs merged in last 7 days")
- [x] Add risk evaluation criteria: what constitutes low/medium/high risk (e.g. "high = score dropped 15+ points, no commits in 14+ days")
- [x] Add action quality guidance: actions must be specific, prioritized, and tied to observed metrics (not generic advice)
- [x] Remove leading whitespace from template literal to save tokens
- [x] Drop `scoreExplanation` from metrics payload (too verbose, duplicates info model can infer)

### Input Data Enrichment

- [x] Add `scoreTrend` ('up' | 'down' | 'stable') to metrics payload
- [x] Add `previousScore` to metrics payload for context
- [x] Add `commitGapHours` interpretation hint (e.g. "last commit was X hours ago")
- [x] Add `anomalyFlags` array if recent anomalies detected (e.g. ["momentum_drop", "star_spike"])
- [x] Add `hasRecentCommits` boolean for quick context

### Response Format Enforcement

- [x] Add `responseSchema` to `generationConfig` with strict JSON schema:
  ```ts
  {
    type: 'object',
    properties: {
      summary: { type: 'string', description: '2-3 sentence assessment, max 200 chars' },
      risk: { type: 'string', enum: ['low', 'medium', 'high'] },
      actions: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 4 }
    },
    required: ['summary', 'risk', 'actions']
  }
  ```

### Determinism Configuration

- [x] Set `temperature: 0.1` for consistent, analytical outputs
- [x] Set `maxOutputTokens: 1024` to prevent runaway responses
- [x] Set `topP: 0.9` for focused sampling
- [x] Set `candidateCount: 1` (default, but explicit)

### Output Validation

- [x] Validate `summary` exists and is a string before saving
- [x] Validate `risk` is one of `['low', 'medium', 'high']`
- [x] Validate `actions` is a non-empty array of strings
- [x] Throw descriptive error if validation fails (triggers fallback insight)
- [x] Add defensive JSON parsing: `json?.candidates?.[0]?.content?.parts?.[0]?.text`

### Error Handling Improvements

- [x] Add retry logic with exponential backoff for 429/5xx errors
- [x] Check for existing recent insight before inserting duplicate fallback
- [x] Improve error messages to include repo context for debugging

### Model Configuration

- [x] Keep `gemini-3-flash-preview` for all plans (user decision)
- [x] Document model choice in `SCORING_SYSTEM.md` alongside funnel docs

### Verification

- [x] Add unit tests for prompt builder function
- [x] Add unit tests for output validation logic
- [ ] Manual test: run sync twice with same data, verify identical insight output
- [ ] Test fallback behavior when Gemini API returns malformed response
- [ ] Test error recovery with retry logic

### Strategic (deferred to post-launch)

- [ ] **Phase 20** — Real-time Convex subscriptions (live sync indicator, push notifications)
- [ ] **Phase 26** — Goals & Progress tracking
- [ ] **Phase 27** — Benchmarking cohorts + watchlists
- [ ] **Phase 29** — Notification preferences (quiet mode, per-event toggles, snooze)
- [ ] **Phase 30** — Slack / Discord integrations
- [ ] **Phase 32** — Team-level portfolio health overview
- [ ] Deploy to Vercel (Phase 9 — unchecked)
- [ ] Add privacy-friendly analytics (Plausible / Umami)
- [ ] Add changelog / "What's New" page

---

## Phase 34 — Market Analysis Sprint (April 2026)

> Goal: add "wow moment" features that make users say "take my money".
> Based on market analysis in `market-analysis.md` — targeting indie hackers + small startups.

### Competitor Watch (P0 — FOMO driver)

- [x] Add `watchlistRepos` table to schema (owner, name, fullName, cached metrics)
- [x] Create `convex/watchlist.ts` — getMyWatchlist, addToWatchlist, removeFromWatchlist, syncWatchedRepo, syncAllActiveUsers
- [x] Add cron job to sync all watched repos daily at 11am UTC
- [x] Build WatchlistCard.svelte component with add form, empty state, paywall blur for free users
- [x] Wire into Growth tab on repo detail page
- [ ] Add competitor comparison to weekly email digest ("Your repo grew X%, [competitor] grew Y%")

### Email Capture / Lead Gen (P0 — top-of-funnel)

- [x] Add `emailLeads` table to schema (email, repoUrl, reportGenerated, reportUrl, convertedToUser)
- [x] Create `convex/emailLeads.ts` — captureLead mutation, generateReport internal mutation, sendReport internal action
- [x] Add `getPlatformStats` query to foundingMembers.ts (totalUsers, totalRepos, totalLeads)
- [x] Add social proof stats bar to landing page (only shows when data exists)
- [x] Add email capture form to landing page — "Get a free health report for any repo"
- [x] Lead email sends beautifully formatted HTML report via Resend with CTA to sign up

### Investor Report (P1 — revenue-adjacent wow)

- [x] Create `convex/investorReport.ts` — getInvestorReportData query + generateInvestorReport action
- [x] Report includes: health score, star velocity, trend chart, milestones, shipping streak
- [x] Add "Generate Report" button to Share tab → opens print-ready HTML in new tab
- [ ] Add plan gating: Indie = 1 report/mo, Builder = unlimited
- [ ] Add "Generated by ShipSense" watermark on free tier reports

### One-Click Actions (P1 — dashboard → agent)

- [ ] Create `convex/issueReplyDraft.ts` — AI-drafted issue responses via Gemini
- [ ] Add `issueReplyDraft` field to repoTasks schema
- [ ] Update TaskCard to show "✨ Draft ready" badge + expandable draft text
- [ ] Add "Copy" and "Open on GitHub" buttons to draft
- [ ] Plan gating: Free = no drafts, Indie = 5/mo, Builder = unlimited

### AI Issue Prioritization (P2 — burnout antidote)

- [ ] Add issue classification during sync: fetch recent issues, classify urgency/type/duplicates via Gemini
- [ ] Add `urgency` field to repoTasks (critical/high/medium/low)
- [ ] Add `isDuplicate` and `duplicateOf` fields to repoTasks
- [ ] Show urgency badges in Tasks tab (🔴 Critical, 🟡 High, etc.)
- [ ] Overview tab shows "1 critical issue needs attention" when urgency=critical

### Landing Page GTM Readiness

- [ ] Add testimonial cards from founding members (placeholder quotes until real users)
- [ ] Add "Join X builders" count to hero section when totalTracked > 10
- [ ] Add blog/content section for SEO (1 post/week targeting "github repo health", "github analytics dashboard")

### Remaining from market-analysis.md (Future Phases)

- [ ] **Smart Issue Deduplication** — compare new issues against existing using embedding similarity
- [ ] **Team Portfolio Health** — `/dashboard/portfolio` page with aggregate health across all repos
- [ ] **Slack Webhook Delivery** — send daily digest to Slack webhook URL
- [ ] **Discord Integration** — same as Slack but for Discord
- [ ] **Referral Program** — invite 3 friends → get 1 month free
- [ ] **Content Marketing Engine** — 1 SEO blog post/week, 3 tweets/week, 1 Indie Hackers post/week
