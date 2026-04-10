# ShipSense Scoring System

> Documented: 2026-04-08. All formulas, thresholds, and design decisions.

---

## 1. Health Score (0–100)

**Formula:** Stars 35% + Commits 25% + Issues 20% + PRs 10% + Contributors 10%

**File:** `convex/scorer.ts` — `computeRepoScore()`

### Stars (35 points) — Logarithmic scale

```
starScore = min(35, (log10(max(1, stars)) / 4) * 35)
```

| Stars | Score | Why |
|-------|-------|-----|
| 1 | 0 | log10(1) = 0 |
| 10 | 9 | log10(10)/4 × 35 = 8.75 |
| 100 | 18 | log10(100)/4 × 35 = 17.5 |
| 1,000 | 26 | log10(1000)/4 × 35 = 26.25 |
| 10,000 | 35 | log10(10000)/4 × 35 = 35 (saturation) |
| 100,000 | 35 | Still 35 — each order of magnitude adds ~8.75 |

**Why log10:** Star counts follow a power-law distribution. A linear scale (stars/100 × 35) means 100 stars = full marks, making 100→10,000 stars indistinguishable. Log10 differentiates meaningfully across the entire range.

### Commits (25 points) — Consistency over frequency

```
if commitGapHours ≤ 24:     25
if commitGapHours ≤ 48:     25 - ((gap - 24) / 24) × 7
if commitGapHours > 48:     max(0, 25 - ((gap - 48) / (30 × 24)) × 25)
```

| Gap | Score | Interpretation |
|-----|-------|----------------|
| 0h | 25 | Just committed |
| 12h | 25 | Same-day is fine |
| 24h | 25 | Daily rhythm = healthy |
| 36h | 22 | Starting to slip |
| 48h | 18 | ⚠️ Weekend gap — normal |
| 7 days | ~8 | Warning zone |
| 14 days | ~4 | Concerning |
| 30 days | ~2 | Critical |

**Why piecewise:** 0–24h gets full marks (solo builders don't need hourly commits). After 24h, gentle decline. After 48h, linear drop to zero over 30 days.

### Issues (20 points) — Exponential decay

```
issueScore = max(0, round(20 × e^(-issuesOpen / 40)))
```

| Open Issues | Score | Why |
|-------------|-------|-----|
| 0 | 20 | Perfect |
| 10 | 16 | Normal for active projects |
| 20 | 12 | Moderate load |
| 50 | 6 | Heavy but not dead |
| 100 | 2 | Overwhelming |
| 200+ | 0 | Crisis |

**Why exponential:** Unlike linear (20 - issues × 0.5), exponential decay never hits a hard cliff. A popular project with 50 open issues isn't necessarily unhealthy — some are feature requests, not bugs.

### PRs (10 points) — Saturation curve

```
prScore = min(10, round(10 × (1 - e^(-prsMerged7d / 3))))
```

| Merged (7d) | Score | Why |
|-------------|-------|-----|
| 0 | 0 | No PR activity |
| 1 | 3 | First merge matters most |
| 3 | 6 | Healthy flow |
| 5 | 8 | Active |
| 10+ | 10 | Saturated |

**Why saturation:** Most solo projects merge 0–5 PRs per week. The curve gives meaningful differentiation in that range without requiring 10+ merges.

### Contributors (10 points) — Solo-friendly

```
contributorScore = min(10, round(3 + 7 × (1 - e^(-contributors14d / 4))))
```

| Contributors (14d) | Score | Why |
|---------------------|-------|-----|
| 0 | 3 | Solo maintainer — not penalized |
| 1 | 5 | Solo with activity |
| 2 | 6 | Growing |
| 5 | 8 | Active team |
| 10+ | 10 | Saturated |

**Why base of 3:** Solo maintainers shouldn't lose 10 points for working alone. The 3-point baseline means a solo project with good stars, commits, and issues can still score 70+.

---

## 2. Trend Detection

**File:** `convex/scorer.ts` — `determineTrend()`, `computeMomentumDelta()`, `computeMomentumWithTime()`

### Trend vs Shipping Streak — Different Signals

The **trend** and the **shipping streak** measure fundamentally different things:

| Signal | Answers | Based On |
|--------|---------|----------|
| **Shipping streak** | "Did you commit on consecutive days?" | Daily commit presence (binary yes/no) |
| **Trend** | "Did the health score go up or down?" | Score comparison over time windows |

An 11-day shipping streak with a trend of 0 is **expected and correct**. The streak says "you're shipping consistently." The trend says "your health score hasn't changed." This happens when daily commits are small fixes or feature work that don't move the needle on any of the 5 scoring components (stars, commit gap, issues, PRs, contributors).

**Analogy:** Going to the gym 11 days straight = great streak. Lifting the same weight every day = no trend in your strength.

The trend is the actionable signal: it tells you to ship something worth talking about, close issues, or attract contributors — not just push code.

### Stored trend (at sync time)

When `calculateScore()` runs during a sync, it computes trend using the last 6 score records:

#### With < 4 scores (fallback)

```
delta = lastScore - previousScore
if delta ≥ +3:  'up'
if delta ≤ -3:  'down'
otherwise:      'stable'
```

The ±3 threshold filters rounding noise (scores are `Math.round`'d).

#### With ≥ 4 scores (momentum buckets)

```
n = min(3, floor(scores.length / 2))
recentAvg = average(last n scores)
priorAvg = average(n scores before that)
delta = recentAvg - priorAvg

if delta ≥ +2:  'up'
if delta ≤ -2:  'down'
otherwise:      'stable'
```

### Displayed momentum (at page load time)

The trend stored at sync time can become stale — inactive repos keep their last positive delta. To fix this, the displayed momentum is computed **fresh at page load** using `computeMomentumWithTime()`, which uses **actual time windows** instead of score record counts:

```
Recent window = last 7 days from now
Prior window  = 7–14 days ago

if no scores in recent window:
    → hasRecentActivity = false, trend = 'stable', delta = null
    → Display: "Inactive" / "No recent activity"
else if no scores in prior window:
    → Compare recent average to oldest known score (±3 threshold)
else:
    → delta = recentAvg - priorAvg
    → if delta ≥ +2: 'up'  |  if delta ≤ -2: 'down'  |  otherwise: 'stable'
```

**Why time windows over record counts:** A score from 3 days ago and a score from 3 weeks ago are treated equally by "last N records." Time windows ensure the comparison is always between "this week" and "last week," so inactive repos immediately show "Inactive" instead of a frozen positive delta.

**Example:**
```
[58, 60, 62, 65, 67, 69]  all within 7 days  → delta +7, recent → 'up'
[80, 82, 85]  all 10+ days old               → hasRecentActivity=false → 'Inactive'
[60]  synced 2 days ago, no prior history     → delta from first sync → 'Baseline'
```

### Stored in database

`calculateScore()` (internal mutation) fetches the last 6 scores, computes trend, and stores it in `repoScores.trend`. Downstream consumers read `score?.trend ?? 'stable'`.

### Displayed to users

`getRepoDetails()` (individual repo page) and `listMyRepos()` (dashboard list) both:
1. Fetch the last 6 scores from `repoScores` (with `_id`, `healthScore`, `calculatedAt`)
2. Call `computeMomentumWithTime(scoreHistory)` which uses time windows (7d / 14d)
3. Display the result rounded to 1 decimal (e.g., `+7.0`, `-2.3`)
4. If `hasRecentActivity` is false, show "Inactive" instead of a stale delta

---

## 3. Momentum Vector

**File:** `convex/trafficIntelligence.ts` — `computeMomentumVector()`

Classifies repo state as `accelerating`, `coasting`, or `stalling` using 3 signals.

### Star growth rate (percentage-based)

```
if prevStarsLast7d > 0:  starGrowthRate = (starsLast7d - prevStarsLast7d) / prevStarsLast7d
else if starsLast7d > 0: starGrowthRate = 1  // had zero, now positive
else:                    starGrowthRate = 0

starGrowing = starGrowthRate > 0.1  // >10% increase
```

**Why percentage:** Going from 1→2 stars (100%) is more significant than 100→101 (1%). Absolute difference treats them equally.

### Commit recency (smooth decay)

```
commitRecency = max(0, 1 - commitGapHours / (14 × 24))
```

| Gap | Recency |
|-----|---------|
| 0h | 1.0 |
| 24h | 0.93 |
| 48h | 0.86 |
| 7 days | 0.50 |
| 14 days | 0.0 |

### Decision matrix

| Condition | Result |
|-----------|--------|
| Score up AND (stars growing OR recency > 0.5) | `accelerating` |
| Score down OR commits dead (>168h / 7 days) | `stalling` |
| Score stable AND stars growing | `coasting` ("Score flat but stars growing X%") |
| Everything else | `coasting` ("Steady with recent commits" or "Quiet — needs a catalyst") |

**Symmetric design:** Equal logic applies for up vs down. The old version made `accelerating` too easy (score up OR stars growing alone was enough).

---

## 4. Anomaly Detection

**File:** `convex/anomalies.ts` — `detectAnomalies()`

### Momentum drop

```
scoreDrop = previousScore - currentScore
if scoreDrop ≥ 8:  severity = 'medium'  (title: "Momentum drop warning")
if scoreDrop ≥ 15: severity = 'high'
```

The 8-point threshold on a 0–100 scale represents roughly an 8–15% relative decline for typical repos (scores 50–90).

### Momentum recovery (growth moment)

**File:** `convex/dashboard.ts` — `deriveGrowthMoments()`

```
if latest ≥ previous + 5 AND previous ≤ beforePrevious:
    → momentum_recovered ("Health score bounced from X to Y")
```

This detects V-shaped recovery: the prior score was stable or declining, then jumped 5+ points.

---

## 5. Score History Storage

**File:** `convex/schema.ts` — `repoScores` table

```
repoScores: {
    repoId,
    healthScore,
    starScore,
    commitScore,
    issueScore,
    prScore,
    contributorScore,
    scoreExplanation,  // human-readable: "Stars (24/35) + Commits (25/25) + ..."
    trend,             // 'up' | 'stable' | 'down'
    previousScore,     // score from the immediately preceding sync
    calculatedAt
}
```

Indexed by `by_repoId_calculatedAt` for efficient history queries.

---

## 6. Design Principles

1. **No hard cliffs** — Exponential/logarithmic curves everywhere. No linear drop to zero.
2. **Solo-friendly** — Contributors have a 3-point base. Commits get 24h grace.
3. **Noise-filtered trends** — ±3 point threshold for single-point, ±2 for averages.
4. **Percentage over absolute** — Star growth uses %, not raw difference.
5. **Smooth decay over binary** — Commit recency is a continuum, not a cliff at 48h.
6. **Time windows over record counts** — Trend compares "this week vs last week" using actual time windows, not "last N score records." Inactive repos show "Inactive" immediately instead of a frozen positive delta. The displayed delta is always recomputed from time windows at page load, never read from a stale stored value.
7. **Stock vs Flow separation** — Conversion funnel is computed twice: cumulative (all-time totals tracked from first sync) and weekly (14-day rolling metrics from GitHub), so users see both the big picture and recent momentum.

---

## 8. Conversion Funnel

**File:** `convex/trafficIntelligence.ts` — `computeBothFunnels()`, `computeCumulativeFunnel()`, `computeWeeklyFunnel()`
**Data Collection:** `convex/collector.ts` — `fetchRepoData()`, `fetchStarsLast7d()`, `fetchTrafficData()`, `countUniqueAuthors14d()`

The funnel is computed **twice** — once with cumulative (all-time) data, once with weekly (14-day rolling) data — so users can see both the big picture and recent momentum.

### Data Collection Methods

#### Stars (Weekly)

**Primary method (with history):** Delta between current and previous snapshot
```
starsLast7d = max(0, currentStars - previousSnapshot.stars)
```

**Fallback method (first sync, no history):** GitHub stargazers API
```
// GitHub returns stargazers in ASCENDING order (oldest first)
// For repos with >100 stars, fetch last page to get newest stars
fetch(`/repos/${owner}/${name}/stargazers?per_page=100&page=${lastPage}`)
// Count stargazers where starred_at >= 7 days ago
```

**Important:** The `Accept: application/vnd.github.v3.star+json` header is required to get the `starred_at` timestamp field.

#### Traffic (Views & Clones)

**Source:** GitHub REST API traffic endpoints (last 14 days only)
```
GET /repos/{owner}/{repo}/traffic/views?per=day
GET /repos/{owner}/{repo}/traffic/clones?per=day
```

**Known limitations:**
- Only returns last 14 days of traffic (GitHub's limit)
- Requires push access to the repo
- Starts tracking from first API call (no historical data)
- Some repos may return 0 if GitHub isn't tracking them

**Cumulative tracking workaround:** Since GitHub doesn't provide all-time traffic, we track our own cumulative totals in the `repos` table:
```
cumulativeViews: initialized from first sync, then delta-added on each sync
cumulativeClones: same approach
```

#### Contributors (14-day rolling)

**Method:** Count unique commit authors from GraphQL commit history
```
// Fetch last 100 commits from default branch with author info
query { repository { defaultBranchRef { target { history(first: 100) { nodes { ... } } } } } }

// Count unique authors where committedDate >= 14 days ago
uniqueAuthors = new Set(commits.map(c => c.author.user?.login || c.author.email))
contributors14d = uniqueAuthors.size  // Can be 0 if no recent commits
```

**Why this method:** GitHub's `/contributors?since=DATE` REST endpoint has known issues and often ignores the `since` parameter, returning all-time contributors instead.

#### Contributors (All-time cumulative)

**Source:** GitHub GraphQL API `mentionableUsers.totalCount`
```
query { repository { mentionableUsers(first: 1) { totalCount } } }
```

This counts all users who have committed, opened issues, or opened PRs — the true all-time contributor count.

---

### Cumulative Funnel (Stock Metrics)

All values are absolute totals since the repo was created (or first sync for traffic).

| Stage | Metric | Source |
|-------|--------|--------|
| Views | `cumulativeViews` | Tracked in `repos.cumulativeViews` since first sync |
| Stars | `totalStars` | GitHub `stargazerCount` (all-time) |
| Clones | `cumulativeClones` | Tracked in `repos.cumulativeClones` since first sync |
| Contributors | `totalContributors` | GitHub `mentionableUsers.totalCount` (all-time) |

**Conversion formulas:**
```
Views → Stars: totalStars / cumulativeViews × 100
Stars → Clones: cumulativeClones / totalStars × 100
Clones → Contributors: totalContributors / cumulativeClones × 100
```

**Sentiment thresholds:**

| Conversion | Excellent | Good | Weak |
|-----------|-----------|------|------|
| Views → Stars | ≥ 5% | ≥ 2% | < 2% |
| Stars → Clones | ≥ 50% | ≥ 20% | < 20% |
| Clones → Contributors | ≥ 20% | ≥ 10% | < 10% |

---

### Weekly Funnel (Flow Metrics)

All values are **14-day rolling totals** from GitHub's API (not deltas between snapshots).

| Stage | Metric | Source |
|-------|--------|--------|
| Views | `views` (14-day rolling) | GitHub traffic API — raw value, not delta |
| Stars | `starsLast7d` (7-day rolling) | Snapshot field (from delta or API) |
| Clones | `clones` (14-day rolling) | GitHub traffic API — raw value, not delta |
| Contributors | `contributors14d` (14-day rolling) | Unique commit authors in last 14 days |

**Why NOT deltas:** GitHub's traffic API returns 14-day cumulative totals. Two snapshots taken 2 hours apart will have the same `views` value, so `delta = 0`. We use the raw values directly since they already represent "recent activity."

**Conversion formulas:**
```
Views → Stars: starsLast7d / views × 100
Stars → Clones: uniqueCloners / starsLast7d × 100
Clones → Contributors: contributors14d / uniqueCloners × 100
```

**Sentiment thresholds:**

| Conversion | Excellent | Good | Weak |
|-----------|-----------|------|------|
| Views → Stars | ≥ 5% | ≥ 2% | < 2% |
| Stars → Clones | ≥ 50% | ≥ 20% | < 20% |
| Clones → Contributors | ≥ 40% | ≥ 15% | < 15% |

**Why weekly thresholds are higher for contributors:** The contributor conversion uses `contributors14d` (rolling 14-day) against a 14-day cloner count, so the denominator is smaller and the rate appears higher.

---

### Diagnostic Panel

A diagnostic toggle is available in the Conversion Funnel UI (`ConversionFunnel.svelte`) that shows:
- Raw snapshot values (stars, views, clones, contributors)
- Previous snapshot values for delta comparison
- Weekly funnel computed values
- Traffic details from GitHub API (total views/clones, top referrers)
- Diagnosis for each metric (why it shows 0 or unexpected values)
- Cumulative traffic tracking status

**Endpoint:** `convex/diagnostics.ts` — `diagnoseFunnelData()`

---

### Design Principles

1. **Stock vs Flow separation:** Cumulative funnel uses all-time totals; Weekly funnel uses 14-day rolling metrics. Each is internally consistent.
2. **GitHub API limitations handled:** Traffic data starts from first sync, not historical. We compensate by tracking our own cumulative totals.
3. **First-sync accuracy:** On first sync, `starsLast7d` is fetched directly from GitHub's stargazers API (not delta-based) to ensure accurate weekly stars count.
4. **No silent zeros:** Comprehensive logging (`[Stars]`, `[Traffic]`, `[Contributors]` prefixes) and diagnostic panel surface exactly what GitHub returns, making data issues visible.

---

## 7. AI Insight Generation (Gemini)

> Documented: 2026-04-09. All prompt, model, and validation details.

**File:** `convex/insightGenerator.ts` — `generateInsights()`, `buildInsightPrompt()`

### Model Choice

All plans use **`gemini-3-flash-preview`** via the Gemini REST API (`https://generativelanguage.googleapis.com/v1beta/models`).

### Determinism Configuration

| Parameter | Value | Why |
|-----------|-------|-----|
| `temperature` | 0.1 | Analytical, consistent outputs |
| `maxOutputTokens` | 1024 | Prevents runaway responses |
| `topP` | 0.9 | Focused sampling |
| `candidateCount` | 1 | Single best response |
| `responseMimeType` | `application/json` | Forces JSON output |
| `responseSchema` | Strict JSON schema | Gemini must match `summary`, `risk`, `actions` exactly |

### Prompt Structure

Prompts use XML-tagged sections for clarity:

- `<role>` — System identity as a growth advisor
- `<task>` — What to produce (JSON summary, risk, actions)
- `<repository>` — Name and description
- `<metrics>` — All metric key-value pairs (filters out `scoreExplanation`)
- `<metric_glossary>` — Definitions of every metric field and its time window
- `<risk_criteria>` — What constitutes low/medium/high risk
- `<action_guidance>` — Rules for action quality (specific, prioritized, tied to data)
- `<output_format>` — The exact JSON schema expected in response

### Input Data Enrichment

The metrics payload includes trend context beyond raw numbers:

| Field | Source | Purpose |
|-------|--------|---------|
| `scoreTrend` | `repoScores.trend` | Whether repo is improving, declining, or stable |
| `previousScore` | `repoScores.previousScore` | Prior health score for comparison |
| `hasRecentCommits` | Derived from `commitGapHours` | Quick boolean context for activity recency |
| `anomalyFlags` | `repoAnomalies` (active) | Detected anomalies like `momentum_drop`, `star_spike` |

### Output Validation

Before saving to `repoInsights`, every response is validated:

| Check | Rule |
|-------|------|
| `summary` | Non-empty string, max 200 characters |
| `risk` | One of `['low', 'medium', 'high']` |
| `actions` | Non-empty array, 1–4 items, all non-empty strings |

Invalid outputs trigger a retry or fallback — they are never saved to the database.

### Retry & Fallback

- **Retries:** Up to 2 retries with exponential backoff (1s, 2s) for 429 and 5xx errors
- **Fallback:** When Gemini fails completely, a deterministic insight is generated from real metric values (commit gap, open issues, score trend) so the user always sees something useful
- **Defensive parsing:** Safe path traversal (`json?.candidates?.[0]?.content?.parts?.[0]?.text`) with graceful error handling at every step

---

## 9. Task Engine (Deterministic)

> Documented: 2026-04-09. All priority levels, stale-key logic, and task types.

**File:** `convex/taskGenerator.ts` — `determineTasks()`, `reconcileTasks()`

### Design Principles

1. **Tasks persist across syncs** — A task is only auto-completed when its underlying condition no longer exists (stale). It is NOT wiped on every sync.
2. **Score drop always outranks everything** — A health regression is more urgent than a missed commit day.
3. **Each task has a `staleKey`** — A stable string key that identifies the condition. If the key is absent on the next sync, the task is auto-completed.
4. **No duplicate tasks** — `createTask` checks for existing open tasks with the same `staleKey` before inserting.

### Priority Levels (0–9)

Tasks are sorted by `priority` ascending (0 = most urgent). The first task becomes "Today's Focus."

| Priority | Condition | Task Type | Task Source | Stale Key |
|----------|-----------|-----------|-------------|-----------|
| **0** | Score dropped ≥ 15 points | `anomaly` | `anomaly` | `score_drop_15` |
| **1** | Score dropped 10–14 points | `anomaly` | `anomaly` | `score_drop_10` |
| **2** | Star spike (high severity) | `anomaly` | `anomaly` | `anomaly_star_spike_high` |
| **2** | Contributor spike (high severity) | `anomaly` | `anomaly` | `anomaly_contributor_spike_high` |
| **2** | ≥ 3 vulnerable dependencies | `dependency` | `dependency` | `dep_vuln` |
| **2** | Commit gap ≥ 48h | `commit` | `hygiene` | `commit_gap_48` |
| **3** | Momentum drop (medium severity) | `anomaly` | `anomaly` | `anomaly_momentum_drop_medium` |
| **3** | Commit gap 24–48h | `commit` | `hygiene` | `commit_gap_24` |
| **4** | > 10 open issues | `issue` | `trend` | `issues_high` |
| **4** | Deprecated dependencies | `dependency` | `dependency` | `dep_deprecated` |
| **5** | Open PRs with 0 merges this week | `pr` | `trend` | `prs_stale` |
| **6** | 1–10 open issues (triage) | `issue` | `trend` | `issues_triage` |
| **7** | Major-version-outdated dependencies | `dependency` | `dependency` | `dep_major_outdated` |
| **8** | README score < 60 | `readme` | `readme` | `readme_low_XX` |
| **9** | ≥ 3 new contributors (welcome) | `general` | `trend` | `contributors_growth` |

### Stale-Key System

Each condition generates a stable key. On every sync:

```
1. Compute all tasks that SHOULD exist given current conditions
2. Collect their staleKeys into a set
3. For each existing open task:
   - If its staleKey is NOT in the current set → auto-complete it
   - If its staleKey IS in the current set → keep it
4. Only create tasks that don't already exist (by staleKey)
```

**Example:**
```
Sync 1:  commit_gap_48, issues_high → tasks created
Sync 2:  commit_gap_48 (issues now < 10) → issues_high task auto-completed
Sync 3:  (commit gap resolved) → commit_gap_48 task auto-completed
```

### Legacy Task Migration

Tasks created before the staleKey system exist without a `staleKey`. The `legacyStaleKey()` fallback maps them:

| Legacy taskType | Fallback staleKey |
|-----------------|-------------------|
| `commit` | `commit_gap_24` |
| `issue` (text includes "open issues") | `issues_high` |
| `issue` (triage text) | `issues_triage` |
| `pr` | `prs_stale` |
| `anomaly` (text includes "15") | `score_drop_15` |
| `anomaly` (text includes "10") | `score_drop_10` |
| anything else | `''` (never stale — kept forever) |

After one sync cycle, all new tasks will have proper staleKeys.

### Task Types and Sources

| taskType | Meaning | Examples |
|----------|---------|----------|
| `commit` | Push a commit to maintain activity | Streak maintenance |
| `issue` | Triage, close, or respond to issues | Backlog management |
| `pr` | Review or merge open PRs | Review flow unblocking |
| `anomaly` | React to detected signals | Score drops, spikes |
| `dependency` | Update or replace packages | Security, deprecation |
| `readme` | Improve documentation quality | Adding sections, badges |
| `general` | Growth-oriented actions | Welcoming contributors |

| taskSource | Meaning |
|------------|---------|
| `anomaly` | Triggered by anomaly detection |
| `trend` | Triggered by metric thresholds |
| `dependency` | Triggered by dependency scanner |
| `readme` | Triggered by README analyzer |
| `hygiene` | Triggered by activity maintenance |

### Task Reconciliation (What Gets Auto-Completed)

| Scenario | Result |
|----------|--------|
| Issues dropped from 15 → 8 | `issues_high` task auto-completed, `issues_triage` created |
| PRs merged this week | `prs_stale` task auto-completed |
| Score recovered | `score_drop_XX` task auto-completed |
| User marks task done manually | `isCompleted = true`, persists |
| Next sync, same conditions | Existing tasks survive, no duplicates created |

