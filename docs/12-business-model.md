# 12. Business Model

## Tiering Strategy

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0/mo | 5 stories/week, 1 voice, 10 saved memories |
| **Premium** | $9.99/mo | Unlimited stories, 3 voices, unlimited memories |
| **Family** | $14.99/mo | Multi-profile, grandparent access, priority support |

---

## Revenue Model

```
                    Free Users
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
    Engage enough            Don't engage
    (5+ stories)                  │
            │                     │
            ▼                     ▼
    Hit limit, upgrade         Churn
    to Premium ($9.99)       (acceptable)
            │
            ▼
    Family needs grow
    Upgrade to Family
       ($14.99)
```

---

## Unit Economics

| Metric | Value | Notes |
|--------|-------|-------|
| **CAC** | $8 | Blended (organic-heavy) |
| **LTV** | $72 | 12-month average |
| **LTV:CAC** | 9:1 | Healthy ratio |
| **ARPU** | $6/mo | Blended free + paid |
| **Gross Margin** | 75% | AI costs ~$0.10/story |

---

## Cost Structure

### Per-Story Costs

| Component | Cost | % of Total |
|-----------|------|------------|
| **Gemini API** | $0.04 | 40% |
| **TTS (Chirp 3)** | $0.03 | 30% |
| **Storage** | $0.01 | 10% |
| **Infrastructure** | $0.02 | 20% |
| **Total** | ~$0.10 | 100% |

---

## Monetization Timeline

| Phase | Focus |
|-------|-------|
| **0-6 months** | Free tier, build user base |
| **6-12 months** | Launch Premium, optimize conversion |
| **12-18 months** | Family tier, B2B exploration |
| **18+ months** | Enterprise (daycares, schools) |
