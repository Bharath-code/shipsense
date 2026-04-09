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

**File:** `convex/scorer.ts` — `determineTrend()`

### With < 4 scores (fallback)

```
delta = lastScore - previousScore
if delta ≥ +3:  'up'
if delta ≤ -3:  'down'
otherwise:      'stable'
```

The ±3 threshold filters rounding noise (scores are `Math.round`'d).

### With ≥ 4 scores (momentum buckets)

```
n = min(3, floor(scores.length / 2))
recentAvg = average(last n scores)
priorAvg = average(n scores before that)
delta = recentAvg - priorAvg

if delta ≥ +2:  'up'
if delta ≤ -2:  'down'
otherwise:      'stable'
```

**Why ±2 for averages:** Averages are smoother than single points, so a smaller threshold (2 vs 3) catches real trends without being overly sensitive.

**Example:**
```
[58, 60, 62, 65, 67, 69]  → recent avg 67, prior avg 60  → delta +7 → 'up'
[62, 60, 58, 55, 53, 51]  → recent avg 53, prior avg 60  → delta -7 → 'down'
[59, 60, 61, 60, 61, 62]  → recent avg 61, prior avg 60  → delta +1 → 'stable'
[50, 52, 50, 52, 50, 52]  → both avg 51                    → delta 0  → 'stable' (no false oscillation)
```

### Stored in database

`calculateScore()` (internal mutation) fetches the last 6 scores, computes trend, and stores it in `repoScores.trend`. Downstream consumers read `score?.trend ?? 'stable'`.

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
6. **Momentum over snapshot** — Trend compares rolling averages, not just last 2 points.
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
