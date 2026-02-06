# 24. Product Requirements Document

> [!NOTE]
> This is a source-reviewed summary. For the complete PRD, see [prd_vFinal.md](./prd_vFinal.md).

## Executive Summary

DreamWeaver is a **family AI companion** that actively participates in the bedtime ritual—listening, learning, anticipating, and creating moments that matter.

### What Makes This Version Different

| Characteristic | LLM Wrapper | DreamWeaver (Agentic) |
|----------------|-------------|----------------------|
| **Trigger** | User command | Context + Autonomous |
| **Memory** | Session-only | Persistent family context |
| **Decision-making** | None | Goal-directed with trade-offs |
| **Learning** | None | Active preference adaptation |
| **Proactivity** | Never | Suggests, warns, anticipates |

---

## Core Features

1. **Story Engine** — Personalized stories via Gemini 3
2. **Voice Clone** — Stories in parent's voice (Chirp 3)
3. **Sleep Sentinel** — Detects sleep cues, adjusts pacing
4. **Memory Curator** — Captures golden moments automatically
5. **Grandma Mode** — Secure one-tap sharing
6. **Live Mode** — Real-time conversational storytelling

---

## Success Metrics

| Metric | Target |
|--------|--------|
| D7 Retention | >50% |
| Stories/week | 5+ |
| Sleep detection accuracy | >85% |
| Premium conversion | >5% |
| NPS | >50 |

---

## Non-Goals (MVP)

- Native mobile apps (PWA first)
- Voice clone training (instant clone only)
- Enterprise/B2B features
- Multi-language support
