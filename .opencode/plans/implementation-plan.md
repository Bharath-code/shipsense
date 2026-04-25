# ShipSense Implementation Plan

**Created:** 2026-04-25
**Goal:** Activate 45% of new users into daily habit, convert 10% free → paid
**Timeline:** ~16 weeks (4 quarters of focused work)

---

## Phase 1: Trust & First Impressions (Week 1-2)

### 1.1 Real Social Proof

**Problem:** Placeholder testimonials and zero user counts destroy trust at signup.

**Hypothesis:** Real social proof will increase landing page → signup conversion from ~5% to 15%.

**Success Metric:** Signup conversion rate, time on landing page

**Implementation:**

| Step | Task | Files | Effort |
|------|------|-------|--------|
| 1 | Add live counters to landing page (`stats.totalRepos`, `stats.totalInsights`) | `src/routes/+page.server.ts`, `src/routes/+page.svelte` | 2h |
| 2 | Replace placeholder testimonials with real quotes (collect from existing users) | `src/routes/+page.svelte` | 1h |
| 3 | Add "X repos tracked this week" counter with animation | `src/routes/+page.svelte` | 2h |
| 4 | Add transparent scoring explainer modal ("How health score works") | `src/lib/components/`, `src/routes/+page.svelte` | 4h |
| 5 | Add founding member urgency ("12 of 50 spots remaining") | `src/routes/+page.server.ts`, `src/routes/+page.svelte` | 1h |

**Validation Before Building:**
- [ ] Email 5 existing users asking for testimonial + permission to use
- [ ] Confirm counters display real data (not zeros)

---

## Phase 2: Brief-First UX (Week 3-6)

### 2.1 Simplified "Today" View

**JTBD:** "When I log in, I want to see what I need to do today without navigating through tabs."

**Hypothesis:** A single "Today" view as default will increase 7-day retention from 20% to 35%.

**Success Metric:** 7-day retention, brief open rate, time-to-first-value

**Technical Approach:**
- New `todayView` Convex query that aggregates brief + top task + streak + anomalies
- New `TodayView.svelte` component as dashboard default
- Progressive disclosure: "Explore" button reveals full 5-tab dashboard
- For users > 7 days old, restore full dashboard

**Implementation:**

| Step | Task | Files | Effort |
|------|------|-------|--------|
| 1 | Create `convex/todayView.ts` — aggregate query for brief + top task + streak + risk | `convex/todayView.ts` | 4h |
| 2 | Create `src/lib/components/TodayView.svelte` — single-page layout | New component | 8h |
| 3 | Modify `dashboard/[repoId]/+page.svelte` — default to TodayView for new users | Existing route | 4h |
| 4 | Add "Explore Full Dashboard" button → reveals current 5-tab view | Existing route | 2h |
| 5 | Add user preference `showFullDashboard` to `userProfiles` schema | `convex/schema.ts`, `convex/settings.ts` | 2h |
| 6 | Add "Don't show Today view again" toggle in settings | `dashboard/settings/+page.svelte` | 2h |
| 7 | A/B test: 50% users get Today view, 50% get full dashboard | Feature flag in `userProfiles` | 4h |

**Schema Changes:**
```typescript
// Add to userProfiles:
showFullDashboard: v.optional(v.boolean()), // default false for new users
onboardingCompletedAt: v.optional(v.number()),
```

**Validation Before Building:**
- [ ] User test: Show Today view mockup to 3 users, ask "what would you do next?"
- [ ] Confirm existing brief data is sufficient for single-page view

---

## Phase 3: Slack Integration (Week 7-9)

### 3.1 Slack Brief Delivery

**JTBD:** "When I open Slack in the morning, I want to see my repo brief without opening another app."

**Hypothesis:** Slack delivery will increase daily active users by 50% and reduce dashboard dependency.

**Success Metric:** % users connecting Slack, brief CTR from Slack, DAU/MAU ratio

**Technical Approach:**
- Slack OAuth flow (add to existing Convex Auth)
- Store Slack workspace + channel in `userProfiles`
- Cron job at 7am UTC sends brief to connected Slack channels
- Interactive message buttons: "View Dashboard", "Complete Task", "Snooze"

**Implementation:**

| Step | Task | Files | Effort |
|------|------|-------|--------|
| 1 | Create Slack app, configure OAuth scopes | Slack Developer Portal | 2h |
| 2 | Add `slackIntegration.ts` — OAuth flow, token storage | `convex/slackIntegration.ts` | 6h |
| 3 | Add Slack fields to `userProfiles` schema | `convex/schema.ts` | 1h |
| 4 | Create `convex/slackBrief.ts` — format brief as Slack message | New file | 4h |
| 5 | Add Slack brief to daily digest cron | `convex/crons.ts`, `convex/dailyDigests.ts` | 3h |
| 6 | Create Slack connection UI in settings | `dashboard/settings/+page.svelte` | 4h |
| 7 | Add interactive message buttons (Block Kit) | `convex/slackBrief.ts` | 4h |
| 8 | Handle Slack webhook for button clicks | `convex/http.ts` | 4h |
| 9 | Add error handling (expired tokens, rate limits) | `convex/slackIntegration.ts` | 3h |

**Schema Changes:**
```typescript
// Add to userProfiles:
slackWorkspaceId: v.optional(v.string()),
slackChannelId: v.optional(v.string()),
slackAccessToken: v.optional(v.string()),
slackBriefEnabled: v.optional(v.boolean()),
```

**Validation Before Building:**
- [ ] Survey existing users: "Would you use Slack for daily brief?"
- [ ] Test Slack message format with 2-3 users manually

---

## Phase 4: Mobile Experience (Week 10-12)

### 4.1 Mobile-Responsive Brief

**JTBD:** "When I check my phone in the morning, I want to see my repo status in 5 seconds."

**Hypothesis:** Mobile-optimized brief will increase weekend usage by 40%.

**Success Metric:** Mobile DAU, weekend vs weekday usage ratio, bounce rate on mobile

**Technical Approach:**
- Audit all dashboard components for mobile responsiveness
- Create mobile-specific `TodayViewMobile.svelte` with stacked layout
- Optimize charts for small screens (simplify or hide on mobile)
- Add PWA manifest for "install to home screen"

**Implementation:**

| Step | Task | Files | Effort |
|------|------|-------|--------|
| 1 | Mobile audit: test all components on iPhone SE + Pixel | Manual testing | 4h |
| 2 | Fix TodayView mobile layout (stacked cards, larger tap targets) | `TodayView.svelte` | 6h |
| 3 | Simplify charts for mobile (hide legends, reduce data points) | `MomentumGraph.svelte`, `ScoreBreakdown.svelte` | 4h |
| 4 | Add PWA manifest + service worker | `static/manifest.json`, `src/app.html` | 4h |
| 5 | Add "Add to Home Screen" prompt | `src/lib/components/` | 2h |
| 6 | Test all touch interactions (swipe, tap, scroll) | Manual testing | 4h |
| 7 | Optimize load time for mobile (lazy load heavy components) | SvelteKit config | 4h |

**Validation Before Building:**
- [ ] Check analytics: what % of traffic is mobile?
- [ ] User test: ask 2 users to check brief on phone, observe friction

---

## Phase 5: Instant Value (Week 13-14)

### 5.1 Instant Health Estimate

**JTBD:** "When I connect my repo, I want to see something immediately, not wait for sync."

**Hypothesis:** Instant estimates will reduce drop-off during first sync by 60%.

**Success Metric:** Drop-off rate during first sync, time-to-first-value

**Technical Approach:**
- On repo connect, fetch basic GitHub data (stars, last commit, open issues) via REST
- Calculate estimated health score from basic data (simplified formula)
- Show "Estimated" badge until full sync completes
- Update to real score when sync finishes

**Implementation:**

| Step | Task | Files | Effort |
|------|------|-------|--------|
| 1 | Create `convex/quickScan.ts` — fetch basic GitHub data via REST | New file | 4h |
| 2 | Create `convex/quickScorer.ts` — simplified score from basic data | New file | 3h |
| 3 | Modify repo connect flow to run quick scan immediately | `convex/repos.ts` | 3h |
| 4 | Add `estimatedScore` field to `repoScores` schema | `convex/schema.ts` | 1h |
| 5 | Create `QuickScanResult.svelte` — show estimate with "syncing" state | New component | 4h |
| 6 | Add real-time update when full sync completes | Convex subscriptions | 3h |
| 7 | Add loading animation + ETA for full sync | `QuickScanResult.svelte` | 2h |

**Schema Changes:**
```typescript
// Add to repoScores:
estimatedScore: v.optional(v.number()),
isEstimated: v.optional(v.boolean()),
quickScanAt: v.optional(v.number()),
```

**Validation Before Building:**
- [ ] Measure current drop-off rate during first sync
- [ ] Test quick scan accuracy: compare estimate vs full score for 5 repos

---

## Phase 6: Actionable Tasks (Week 15-17)

### 6.1 One-Click Task Actions

**JTBD:** "When I see a task, I want to complete it without leaving ShipSense."

**Hypothesis:** In-app task completion will increase task completion rate from 10% to 40%.

**Success Metric:** Task completion rate, GitHub API write success rate, user satisfaction

**Technical Approach:**
- Add GitHub write permissions to OAuth scope
- Implement task-specific actions: reply to issue, update README, create PR
- Use AI to draft responses, user reviews before sending
- Track completed actions in `repoTasks`

**Implementation:**

| Step | Task | Files | Effort |
|------|------|-------|--------|
| 1 | Add GitHub write scopes to OAuth config | `convex/auth.config.ts` | 1h |
| 2 | Create `convex/githubActions.ts` — issue reply, README update, PR create | New file | 8h |
| 3 | Modify task UI to show "Complete" button with action preview | `TaskChecklist.svelte` | 4h |
| 4 | Add AI draft generation for issue replies (existing: `issueReplyDraft.ts`) | Integrate with tasks | 3h |
| 5 | Create action confirmation modal (show what will be sent) | New component | 3h |
| 6 | Handle GitHub API errors (rate limits, permissions) | `convex/githubActions.ts` | 3h |
| 7 | Add completed action tracking to `repoTasks` | `convex/taskGenerator.ts` | 2h |
| 8 | Add undo capability (delete comment, revert PR) | `convex/githubActions.ts` | 4h |

**Validation Before Building:**
- [ ] User test: show task action mockup, ask "would you trust this to send?"
- [ ] Test GitHub API rate limits for write operations

---

## Phase 7: Cohort Benchmarking (Week 18-21)

### 7.1 Benchmarking by Language, Size, Age

**JTBD:** "When I see my score, I want to know how I compare to similar repos."

**Hypothesis:** Cohort benchmarking will increase score engagement by 3x and make the score meaningful.

**Success Metric:** Benchmark page views, time spent on health tab, share rate of benchmark badge

**Technical Approach:**
- Create `repoBenchmarks` table with cohort data
- Aggregate anonymized data from all connected repos
- Calculate percentiles by language, size (stars), age (created_at)
- Show "You're in top X% of TypeScript repos with 100-500 stars"

**Implementation:**

| Step | Task | Files | Effort |
|------|------|-------|--------|
| 1 | Create `convex/benchmarks.ts` — cohort aggregation logic | New file | 6h |
| 2 | Add `repoBenchmarks` schema table | `convex/schema.ts` | 2h |
| 3 | Create cron job to update benchmarks daily | `convex/crons.ts` | 2h |
| 4 | Create `BenchmarkComparison.svelte` — cohort comparison UI | New component | 6h |
| 5 | Integrate into Health tab | `dashboard/[repoId]/+page.svelte` | 3h |
| 6 | Update `BenchmarkBadge.svelte` to show cohort context | Existing component | 2h |
| 7 | Add privacy controls (opt-out of benchmark data) | `convex/settings.ts` | 2h |
| 8 | Add "How benchmarks work" explainer | New component | 3h |

**Schema Changes:**
```typescript
// New table:
repoBenchmarks: defineTable({
  language: v.string(),
  starRange: v.string(), // "0-100", "100-500", "500-1000", "1000+"
  ageRange: v.string(), // "<1yr", "1-2yr", "2-5yr", "5yr+"
  p25Score: v.number(),
  p50Score: v.number(),
  p75Score: v.number(),
  p90Score: v.number(),
  repoCount: v.number(),
  updatedAt: v.number(),
}),
```

**Validation Before Building:**
- [ ] Check if we have enough repos for meaningful cohorts (need 50+ per cohort)
- [ ] User test: show benchmark mockup, ask "does this make the score more useful?"

---

## Dependencies & Order

```
Phase 1 (Social Proof) ──────────────────────────────────────────► Week 1-2
    │
    ▼
Phase 2 (Today View) ────────────────────────────────────────────► Week 3-6
    │
    ├──► Phase 3 (Slack) ────────────────────────────────────────► Week 7-9
    │       (depends on Today View for brief format)
    │
    ├──► Phase 4 (Mobile) ───────────────────────────────────────► Week 10-12
    │       (depends on Today View component)
    │
    ▼
Phase 5 (Instant Estimate) ─────────────────────────────────────► Week 13-14
    │
    ▼
Phase 6 (Task Actions) ─────────────────────────────────────────► Week 15-17
    │
    ▼
Phase 7 (Benchmarking) ─────────────────────────────────────────► Week 18-21
```

**Parallel Opportunities:**
- Phase 3 (Slack) and Phase 4 (Mobile) can overlap if 2 engineers available
- Phase 5 (Instant Estimate) is independent, can start anytime after Phase 2

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Not enough users for benchmarks | Start with broad cohorts (all repos), narrow as data grows |
| Slack OAuth complexity | Use existing Convex Auth patterns, test with personal workspace first |
| GitHub API rate limits | Cache aggressively, show stale data gracefully, implement backoff |
| Users don't trust AI task actions | Start with "preview only" mode, require explicit confirmation |
| Mobile responsive takes longer | Prioritize TodayView only, defer other tabs to later |

---

## Validation Checkpoints

| Phase | Before Build | After Ship |
|-------|-------------|------------|
| 1. Social Proof | Collect 3 real testimonials | Measure signup conversion change |
| 2. Today View | User test mockup with 3 users | Measure 7-day retention change |
| 3. Slack | Survey 10 users on interest | Measure Slack connection rate |
| 4. Mobile | Check mobile traffic % | Measure mobile DAU change |
| 5. Instant Estimate | Measure current drop-off | Measure first-sync drop-off change |
| 6. Task Actions | User test trust level | Measure task completion rate |
| 7. Benchmarking | Check cohort data sufficiency | Measure benchmark engagement |

---

## What NOT to Build (Yet)

| Feature | Why Not | When to Revisit |
|---------|---------|-----------------|
| Team portfolio view | Only 10% of users need this | When 5+ users request it |
| API access | Zero evidence users want this | When users ask for integrations |
| Goals & Progress | Nice-to-have, not core loop | After retention > 40% |
| Referral program | Need more users first | When > 500 active users |
| Blog/Content | Distraction from core product | After product-market fit proven |
| Smart issue dedup | Complex, low impact | When users complain about duplicate issues |

---

## Success Criteria (90 Days)

| Metric | Current | Target | How Measured |
|--------|---------|--------|--------------|
| Signup conversion | ~5% | 15% | Landing page analytics |
| 7-day retention | ~20% | 35% | Convex user activity tracking |
| Brief open rate | Unknown | 60% | Email/Slack open tracking |
| Task completion | ~10% | 30% | `repoTasks` completion rate |
| Slack connections | 0 | 30% of users | `userProfiles.slackChannelId` |
| Mobile DAU | Unknown | 40% of DAU | User agent analytics |

---

## Weekly Cadence

| Day | Activity |
|-----|----------|
| Monday | Plan week, review metrics from previous week |
| Tue-Thu | Build features, write tests |
| Friday | Ship, user testing, retrospective |
| Ongoing | Talk to 1 user per week (minimum) |
