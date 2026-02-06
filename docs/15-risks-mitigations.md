# 15. Risks & Mitigations

## Agentic Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Agent makes wrong decision | Parent frustrated | Medium | Always show "Why I chose this" + easy override |
| Too much autonomy feels creepy | Trust broken | Low | Default conservative, earn autonomy over time |
| Child interaction misunderstood | Story goes off track | Medium | Fallback to gentle acknowledge, not action |
| Sleep detection false positives | Story ends abruptly | Medium | Gradual fade, never hard stop |

---

## Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Vercel cold starts | Audio delay | Medium | Pre-warm critical functions, edge optimization |
| Voice clone quality issues | "Uncanny valley" | Low | A/B test, fallback to ElevenLabs for first story |
| Real-time audio latency | Breaks immersion | Medium | WebSocket + edge processing (Cloudflare) |
| API rate limits | Service degradation | Low | Caching, circuit breakers, graceful fallbacks |
| Database scaling | Slow queries | Low | Indexes, connection pooling, read replicas |

---

## Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Low conversion to paid | Revenue miss | Medium | Optimize free tier limits, add premium features |
| Competition from incumbents | Market share loss | Medium | Move fast, build moat (voice clone, memories) |
| AI cost increases | Margin compression | Low | Multi-provider strategy, cost optimization |
| Regulatory changes (COPPA) | Feature restrictions | Low | Privacy-by-design, compliance-first |

---

## Operational Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Content safety incident | Brand damage | Very Low | 4-layer safety, human review |
| Data breach | Trust destroyed | Very Low | Encryption, RLS, security audits |
| Service outage | User frustration | Low | Multi-region, health checks, alerts |

---

## Risk Register Summary

| Category | High Risk | Medium Risk | Low Risk |
|----------|-----------|-------------|----------|
| **Agentic** | 0 | 3 | 1 |
| **Technical** | 0 | 2 | 3 |
| **Business** | 0 | 2 | 2 |
| **Operational** | 0 | 0 | 4 |
