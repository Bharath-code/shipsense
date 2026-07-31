---
version: alpha
name: ShipSense
description: Dark-first founder intelligence dashboard — dense, precise, and quiet, so the numbers and the one action that matters are the only things competing for attention.

colors:
  background: "#0A0A0B"
  surface: "#131316"
  surface-raised: "#18181D"
  surface-hover: "#1D1D23"
  on-background: "#F2F2F5"
  on-surface: "#F2F2F5"
  on-surface-muted: "#8B8B95"
  on-surface-subtle: "#5C5C66"
  border: "#232329"
  border-strong: "#33333C"
  primary: "#6D5EF5"
  on-primary: "#FFFFFF"
  primary-muted: "#211E3D"
  accent: "#22D3EE"
  on-accent: "#04262B"
  success: "#34D399"
  on-success: "#04231A"
  warning: "#FBBF24"
  on-warning: "#2B1B02"
  danger: "#F2555F"
  on-danger: "#FFFFFF"
  info: "#60A5FA"
  on-info: "#04182E"
  background-light: "#FFFFFF"
  surface-light: "#F7F7F9"
  surface-raised-light: "#FFFFFF"
  on-background-light: "#151519"
  on-surface-muted-light: "#6B6B76"
  border-light: "#E7E7EC"

typography:
  display:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  h1:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  h2:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  h3:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.06em"
  metric-lg:
    fontFamily: "JetBrains Mono Variable, monospace"
    fontSize: "2.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  metric:
    fontFamily: "JetBrains Mono Variable, monospace"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.1
    fontFeature: "tnum"
  metric-sm:
    fontFamily: "JetBrains Mono Variable, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
    fontFeature: "tnum"
  code:
    fontFamily: "JetBrains Mono Variable, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5

rounded:
  none: "0px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"

spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
  20: "80px"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  button-destructive:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-danger}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "20px"
  card-interactive:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "20px"
  badge-neutral:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
    height: "22px"
  badge-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.on-success}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
    height: "22px"
  badge-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.on-warning}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
    height: "22px"
  badge-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-danger}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
    height: "22px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  metric-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.metric-lg}"
    rounded: "{rounded.lg}"
    padding: "20px"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  tab-active:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
---

# ShipSense Design System

## Overview

ShipSense is a daily-use dashboard for solo founders and indie hackers who check one question every morning: is my repo getting healthier, and what should I do about it today. The person using this is not browsing — they are scanning for the one number and the one action, usually on a laptop, usually in the first two minutes of their day, often at night too, before or after they actually write code. The interface has to feel like a cockpit, not a magazine: calm, dense, legible at a glance, and honest about what's good and bad. It should never feel like a marketing site that leaked into the product, and it should never feel like a spreadsheet either. The two things this design must never become: (1) generic shadcn gray — indistinguishable from every other unstyled Tailwind starter, which is exactly what today's UI is, and (2) gamified-cute — the streaks and confetti are real product mechanics, but the chrome around them stays serious, because the user's business is the actual stakes, not the app.

## Colors

Dark is the primary mode — this is a tool developers open in a dark terminal-adjacent environment, and a near-black background lets score colors (success green, warning amber, danger coral) do real work without competing against a busy UI. `background` and `surface` are two steps apart on purpose (`#0A0A0B` vs `#131316`) so cards read as distinct layers against the page without needing shadows. `primary` is a single confident violet (`#6D5EF5`) reserved for the brand and the one primary action per screen — not decoration. `accent` (`#22D3EE`, cyan) is kept separate from `primary` specifically for data visualization — momentum lines, forecast bands — so charts don't fight with buttons for the same color. Semantic colors (`success`, `warning`, `danger`, `info`) are desaturated enough to sit on dark surfaces all day without fatiguing the eye, but saturated enough to read instantly as a signal, since the health score literally lives or dies by these three colors being unambiguous. All text/background pairs are built to clear WCAG AA (4.5:1) at minimum; verify any new pairing before shipping it.

## Typography

Two typefaces, already in the project's dependencies, now used with intent instead of defaulting everywhere to Inter. Inter carries all prose, labels, and UI chrome — it's neutral and doesn't call attention to itself. JetBrains Mono is reserved for anything that is a *number a founder needs to compare*: the health score, star counts, momentum deltas, percentages, dates in tables. Tabular figures (`fontFeature: tnum`) keep those numbers from jittering as they update — this matters because scores animate on load and on refresh. `metric-lg` is the hero score number on a repo's Brief tab; `metric` and `metric-sm` are for secondary stats scattered through cards. `caption` is uppercase-tracked and used exclusively for section eyebrows and badges, never for body copy — if you're using caption for a sentence, that's a sign the sentence should be a tooltip instead.

## Layout

4px base spacing scale. Dashboard density should read as "comfortable engineering tool," not "consumer app with room to breathe" — cards use 20px internal padding, page gutters are 24–32px, and related items sit 8–12px apart while unrelated sections get at least 24px of separation. Avoid the current pattern of full-bleed 1,600-line pages with no visual grouping; every tab should read as 3–5 clearly bounded zones (hero metric, secondary stats row, detail cards, actions), not a scroll of undifferentiated cards.

## Elevation & Depth

Border-first, not shadow-first — this is the single biggest departure from the current default shadcn look, and the biggest signal of taste. Cards are distinguished from the page by a 1px `border` plus one step of surface lightness, not a drop shadow. Reserve actual shadows for things that are genuinely floating above the page and need to say so unambiguously: dropdowns, popovers, modals, toasts. A card sitting in the normal document flow should never cast a shadow — that's the tell of an unconsidered design system copy-pasted from a template.

## Shapes

Radius scale sits in the 6–12px range for functional UI (buttons, inputs, cards) — enough to feel modern and considered, not so much that it reads as playful/consumer. `full` (pill) radius is reserved for badges, tags, and the streak counter — anything that's a small, discrete status chip. Never mix a sharp 0px radius with a heavily rounded 16px+ radius in the same view; the current codebase forces `rounded-none` on buttons and cards regardless of the theme's radius tokens, which is exactly the kind of accidental inconsistency this system replaces.

## Components

Buttons: `button-primary` (violet fill) is the one call-to-action per view — "Send reply," "Connect repo." `button-secondary` (raised surface, no fill) is for parallel/equal actions. `button-ghost` is for tertiary and icon-only actions in toolbars. `button-destructive` uses `danger` and is reserved for disconnect/delete flows, always behind a confirm step. Cards: `card` is the base container for every dashboard block; `card-interactive` is identical but adds a hover state (`surface-hover` background, `border-strong` border) for cards that navigate somewhere — the score breakdown, a task row. Badges: pill-shaped, one of four semantic tones, used for score bands, task priority, and streak status — never more than one badge competing for attention per card. Metric tiles: the core visual unit of the Brief tab — big `metric-lg` number, `caption` label above it, trend delta below in `metric-sm` colored by direction (success/danger/muted for flat). Tabs: underline-free, using a raised-surface pill for the active tab against a transparent inactive state — this reads calmer than the current bordered-underline tab pattern at high tab counts (five tabs today, more likely later).

## Do's and Don'ts

**Do:**
- Use `metric`/`metric-lg`/`metric-sm` (JetBrains Mono, tabular numerals) for every number a founder is meant to compare over time.
- Keep exactly one `button-primary` visible per screen/section — if two things compete for primary emphasis, demote one to secondary.
- Color-code trend direction consistently everywhere: `success` = improving, `danger` = declining, `on-surface-muted` = flat/no data. Never invert this mapping.
- Use borders + surface-layer steps for card elevation; save real shadows for floating overlays only.
- Let whitespace separate sections instead of adding dividers/lines everywhere.

**Don't:**
- Don't fall back to default shadcn gray (`oklch(0.97 0 0)` style neutrals) — every gray in this system is intentional, not a Tailwind default.
- Don't mix `rounded-none` and rounded components in the same view; pick from the `rounded` scale consistently per component type.
- Don't use `primary` violet for anything that isn't the single most important action or the brand mark — it loses meaning if it's decorative.
- Don't introduce a second accent color for charts/highlights beyond `accent` (cyan) — one is enough to stay legible against semantic score colors.
- Don't let gamification chrome (streak flames, confetti, "wins") take over the visual hierarchy — they're a small reward, not the headline.
