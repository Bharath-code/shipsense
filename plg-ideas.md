# PLG Ideas for ShipSense

## Overview

Product-led growth strategies to drive user acquisition, activation, and referral.

---

## 1. The "Magic Moment" - First Sync Complete

**What**: Celebrate the moment a user's first repo sync completes with health data.

**Ideas**:

- Auto-tweet when health score first appears (opt-in)
- Show "Share your starter card" prompt (already implemented ✓)
- Badge: "Just connected" that users can add to their GitHub profile readme

**Why it works**: Captures the "aha" moment when value is delivered.

---

## 2. GitHub Profile Badge

**What**: Embeddable image showing repo health for GitHub readmes.

**Implementation**:

```markdown
[![ShipSense](https://shipsense.dev/badge/{owner}/{repo})](https://shipsense.dev/r/{owner}/{repo})
```

**Example output**: A badge showing health score, streak days, and star count.

**Why it works**: Users naturally add to readme → free backlinks + brand awareness + social proof.

---

## 3. GitHub Action - Auto-Sync

**What**: Official GitHub Action to sync repo metrics automatically.

```yaml
# .github/workflows/shipsense.yml
name: ShipSense Sync
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: shipsense/sync-action@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```

**Why it works**: Creates natural discovery - developers see "I use ShipSense" in action workflows.

---

## 4. Milestone Auto-Tweet

**What**: Auto-tweet when users hit milestones.

| Trigger       | Tweet                                                       |
| ------------- | ----------------------------------------------------------- |
| 7-day streak  | "🔥 1 week of shipping! My repo is on fire 🔥 #OpenSource"  |
| 30-day streak | "💪 30 days straight! ShipSense is tracking my journey"     |
| 100 stars     | "🎉 {repo} hit 100 stars! Ship it forward 🚀"               |
| 500 stars     | "🚀 {repo} just hit 500 stars! Thank you all 💜"            |
| Score 80+     | "💚 My repo is healthy! Health score: 85/100 on @ShipSense" |
| 1000th fork   | "🍴 1000 forks! My OSS project is growing @ShipSense"       |

**Features**:

- Opt-in toggle in settings
- Auto-attach share card image
- @mention ShipSense for visibility

---

## 5. Leaderboard / Trending Page

**What**: Public page showing trending and top repos.

**Pages**:

- `shipsense.dev/trending` - Most improved repos this week
- `shipsense.dev/leaderboard` - Top streak leaders
- `shipsense.dev/top` - Highest health scores

**Why it works**: Social proof + competition = shares + backlinks + SEO traffic.

---

## 6. Embeddable Widget

**What**: JavaScript widget for personal sites.

```html
<script src="https://shipsense.dev/widget.js?repo=owner/name"></script>
```

**Output**: Mini health card (100x60px) with score + streak + stars.

**Why it works**: Each embed = free backlink + brand awareness on personal blogs/sites.

---

## 7. "Powered by ShipSense" Footer

**What**: Subtle branding on shared content.

**Places**:

- Share card images: "Made with ShipSense" (small, bottom-right)
- Email reports: "Tracked by ShipSense" in footer
- API responses: `X-Powered-By` header

**Why it works**: Low friction, high awareness over time.

---

## 8. Freemium Tier Model

**What**: Free tier for individuals, paid for teams/enterprises.

| Feature        | Free     | Pro ($9/mo) | Team ($29/mo) |
| -------------- | -------- | ----------- | ------------- |
| Repos          | 1        | Unlimited   | Unlimited     |
| Sync frequency | Every 6h | Hourly      | Real-time     |
| History        | 7 days   | Unlimited   | Unlimited     |
| Email reports  | Weekly   | Daily       | Custom        |
| AI insights    | Basic    | Full        | Full          |
| Custom badges  | -        | ✓           | ✓             |
| Team members   | -        | 1           | 5             |
| API access     | -        | ✓           | ✓             |

**Why it works**:

- Free tier captures individual maintainers (low CAC)
- Pro tier is affordable for serious developers
- Team tier targets companies with multiple repos

---

## Implementation Priority

| Priority | Idea              | Effort | Impact |
| -------- | ----------------- | ------ | ------ |
| 1        | GitHub Badge      | Low    | High   |
| 2        | GitHub Action     | Medium | High   |
| 3        | Milestone Tweets  | Low    | Medium |
| 4        | Leaderboard       | Medium | Medium |
| 5        | Freemium Model    | High   | High   |
| 6        | Embeddable Widget | Medium | Medium |
| 7        | Powered Footer    | Low    | Low    |

---

## Metrics to Track

- **Activation Rate**: % of users who connect repo and get first score within 24h
- **Referral Rate**: % of new users from existing user shares
- **Sticky Users**: Weekly active users / Monthly active users
- **Time to Value**: Minutes from signup to first insight
- **Share Rate**: % of users who share their growth card
- **Embed Rate**: % of users who add badge to readme

---

## Notes

- Focus on **developer-owned** growth (badges, actions, shares) over paid ads
- Every share should include the ShipSense name/handle for attribution
- Track which channels drive most signups to double down
