# 07. Security & Compliance

## Trust & Safety Principles

DreamWeaver is designed for the most vulnerable users—children. Security is not an afterthought.

### Four-Layer Defense

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: INPUT SANITIZATION                                            │
│  User inputs (child names, themes) sanitized before prompt injection    │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER 2: PROMPT GUARDRAILS                                             │
│  System prompts include strict content policies                         │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER 3: OUTPUT VALIDATION                                             │
│  Structured outputs + post-generation filtering                         │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER 4: CONTENT AUDIT                                                 │
│  Periodic review of generated content for policy compliance             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Privacy by Design

### Data Minimization

| Data Type | Storage | Retention |
|-----------|---------|-----------|
| Voice clone | Encrypted, per-user | Until account deletion |
| Story audio | On-device preferred | 30 days |
| Golden moments | User-controlled | Forever (user choice) |
| Analytics | Anonymized | 12 months |

### Zero Trust Architecture

- **Zod validation** on every API input
- **Row-Level Security (RLS)** in Supabase
- User A can never access User B's data, even via API bugs

---

## Regulatory Compliance

### COPPA Considerations

| Requirement | Implementation |
|-------------|----------------|
| Parental consent | Account created by parent only |
| Data collection notice | Clear privacy policy |
| Parental access | Export all data on request |
| Data deletion | Full deletion within 24 hours |
| Third-party limitations | No sharing without consent |

### GDPR/CCPA

- Right to access: Yes (export feature)
- Right to deletion: Yes (account deletion)
- Right to portability: Yes (data export)
- Consent management: Yes (granular controls)

---

## Security Controls

| Control | Implementation |
|---------|----------------|
| **Authentication** | Supabase Auth (JWT) |
| **Authorization** | RLS + middleware |
| **Encryption** | TLS in transit, AES at rest |
| **Secrets management** | Env vars, never committed |
| **Rate limiting** | Per-IP, per-user |
| **CORS** | Strict origin allowlist |
