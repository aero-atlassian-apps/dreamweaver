# 26. Application Design System

## Lullaby Design Language v2

> [!NOTE]
> For the complete design specification, see [design_vFinal.md](./design_vFinal.md).

---

## Color Palette

### Dark Mode (Default)

```css
/* Backgrounds */
--bg-primary: #0A0E1A;       /* Deep midnight blue */
--bg-secondary: #141B2E;     /* Elevated panels */
--bg-tertiary: #1E2942;      /* Cards */

/* Text */
--text-primary: #E8EDF4;     /* Soft white */
--text-secondary: #A8B3C7;   /* Muted gray-blue */

/* Accent */
--accent-primary: #7C9FFF;   /* Periwinkle blue */
--accent-secondary: #B8A1FF; /* Lavender */

/* Agentic States */
--agent-thinking: #A78BFA;   /* Violet (processing) */
--agent-suggestion: #34D399; /* Green (proactive) */
--sleep-mode: #4B5563;       /* Dim gray (sleep) */
```

---

## Typography

| Scale | Font | Use |
|-------|------|-----|
| Display | Newsreader, serif | Hero headings |
| H1-H2 | Newsreader, serif | Page titles |
| H3-Body | Inter, sans-serif | UI text |
| Caption | Inter, 12px | Metadata |

---

## Component Library

### Agent Suggestion Card

Pulsing border, explains *why* this recommendation.

### Sleep Indicator

Moon icon, opacity increases with sleep confidence.

### Child Bubble

Pink gradient, right-aligned, shows child's input.

### Story Player

Full-screen immersive, Ken Burns illustration, live lyrics.

---

## Principles

1. **Whisper, Don't Shout** — Calm interfaces, never jarring
2. **One-Handed Elegance** — Thumb-reachable actions
3. **Invisible Complexity** — AI does heavy lifting
4. **Dark Mode First** — Bedtime = dim rooms
5. **Sleep-Aware** — UI adapts as child sleeps
