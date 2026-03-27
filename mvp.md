EXACT MVP FEATURE SET (7-Day Ship)

You must resist feature greed.

MVP = GitHub-only intelligence.

No GA. No npm. No Stripe.

🔵 Feature 1 — Connect GitHub
OAuth login
Select repo(s)
Done

Time to value: < 30 seconds

🔵 Feature 2 — Daily Repo Health Report (CORE MAGIC)

User opens dashboard → sees:

Repo Health Score: 68 / 100

Yesterday:
+ 12 stars
+ 3 issues opened
+ 1 PR merged
Last commit: 2 days ago ⚠️

Insight:
Star velocity slowing.

Suggested action:
Ship small update OR post feature update on Twitter.

This is THE PRODUCT.

Not charts.

🔵 Feature 3 — Momentum Graph (simple)

Just:

Star velocity
Issue velocity
Commit frequency

Very minimal.

🔵 Feature 4 — “Today Action Engine”

Most important retention loop.

TODAY FOUNDER TASKS

1. Reply to issue #214 (user high intent)
2. Push small commit (repo inactive 48h)
3. Close stale PR

Feels like AI PM.

🔵 Feature 5 — Daily Email Report

Super important.

You must push value.

Morning email:

“Your repo growth slowed 22% yesterday.”

Now product enters daily routine.

Retention ↑

🔵 Feature 6 — Ship Streak

Gamified signal:

🔥 5 day shipping streak
⚠️ Streak broken

Cheap dopamine. Huge impact.

❌ NOT in MVP
Google Analytics
npm downloads
Search console
Revenue metrics
Team collaboration
Multi-project workspace
Slack integration

All distractions.

EXACT SYSTEM ARCHITECTURE (Agent Flow)

Keep this SIMPLE.

You are solo.

🔵 Step 1 — Data Collector Agent

Cron job every 6 hours.

Fetch:

stars count
new issues
PR events
commits
contributors

Store snapshot.

Table:

repo_metrics
- repo_id
- timestamp
- stars
- open_issues
- prs_open
- last_commit_at
🔵 Step 2 — Change Detection Agent

Runs after collector.

Compute:

star_delta
issue_delta
commit_gap_hours
PR response time

Creates:

repo_signals
- signal_type
- severity
- metadata

Example:

commit_gap > 48h → warning

🔵 Step 3 — Insight Generator Agent (LLM)

Input:

last 7 days signals
repo description

Output:

insight_summary
recommended_actions
risk_score

Cache result.

Do NOT run LLM every page load.

🔵 Step 4 — Task Generator Agent

Transforms insights → actionable checklist.

Very deterministic logic.

Example:

IF issue_opened AND label=bug
→ task = “Reply to issue”

IF no_commit_48h
→ task = “Push small commit”

No need heavy AI here.

🔵 Step 5 — Email Agent

Daily scheduled:

pulls latest insight
sends short report

This builds habit loop.

⭐ Stack Suggestion (for YOU)

Perfect solo stack:

SvelteKit
Supabase Postgres
GitHub GraphQL API
Upstash cron / background jobs
OpenAI or local LLM
Resend for email

You can ship this FAST.