# 00. Documentation Index

This folder is the single source for product + engineering documentation used for demos, judging, and deployment.

## Quick Links (Judges)
- **3-minute demo script**: [99-demo-script-3min.md](./99-demo-script-3min.md)
- **Gemini 3 write-up** (Pro + Flash + Live): [20-gemini3-integration.md](./20-gemini3-integration.md)
- **Model verification endpoint**: `GET /api/v1/meta/gemini-models` (returns resolved Flash/Pro/Live model names)
- **No-login demo**: Web route `/demo` + API route `POST /api/v1/demo/story` (enabled by default; set `PUBLIC_DEMO_ENABLED=false` to disable)
- **API docs**: Swagger UI at `/api/docs/`

## Where to Start (Engineers)
- **Environment variables** (authoritative list): [18-env-reference.md](./18-env-reference.md)
- **Deployment (Vercel + Cloudflare Worker)**: [19-deployment-vercel-cloudflare.md](./19-deployment-vercel-cloudflare.md)
- **Production runbook**: [16-go-live-runbook.md](./16-go-live-runbook.md)
- **Implementation status** (what is shipped vs planned): [17-implementation-status.md](./17-implementation-status.md)

## Full Index (Narrative)

### 1. Strategic Vision & Business Context
- **[01-vision.md](./01-vision.md)**: The "North Star" vision—why DreamWeaver exists.
- **[02-market-opportunity.md](./02-market-opportunity.md)**: Analysis of the bedtime economy and our "Blue Ocean".
- **[03-problem-statement.md](./03-problem-statement.md)**: Detailed breakdown of the friction points we solve for parents.
- **[04-target-users.md](./04-target-users.md)**: Personas: The Exhausted Parent, The Engaged Child, The Remote Grandparent.

### 2. Product Specification
- **[05-features.md](./05-features.md)**: Feature catalog (Story Engine, Golden Moments, Sleep Sentinel).
- **[06-agentic-ai-architecture.md](./06-agentic-ai-architecture.md)**: Agentic AI design (Bedtime Conductor, tools, loops).
- **[07-security-compliance.md](./07-security-compliance.md)**: Trust & safety and privacy design.

### 3. Technical Architecture
- **[08-solution-architecture.md](./08-solution-architecture.md)**: High-level system design (Clean Architecture, BFF, eventing).
- **[09-technical-stack.md](./09-technical-stack.md)**: Frontend, API, storage, AI, testing stack.
- **[10-data-architecture.md](./10-data-architecture.md)**: Data model and persistence strategy.

### 4. Execution & Growth
- **[11-go-to-market.md](./11-go-to-market.md)**: Growth strategy (Grandma Mode loop and partnerships).
- **[12-business-model.md](./12-business-model.md)**: Monetization assumptions and tiering.
- **[13-roadmap.md](./13-roadmap.md)**: Phased roadmap.
- **[14-success-metrics.md](./14-success-metrics.md)**: KPIs and targets.
- **[15-risks-mitigations.md](./15-risks-mitigations.md)**: Risk register and mitigations.

### 5. Operations
- **[16-go-live-runbook.md](./16-go-live-runbook.md)**: Production go-live steps and smoke tests.

## Appendix (Engineering + Hackathon)
- **[17-implementation-status.md](./17-implementation-status.md)**: Implemented status companion.
- **[18-env-reference.md](./18-env-reference.md)**: Environment variables (authoritative).
- **[19-deployment-vercel-cloudflare.md](./19-deployment-vercel-cloudflare.md)**: Deployment guide (Vercel + WS worker).
- **[20-gemini3-integration.md](./20-gemini3-integration.md)**: Gemini 3 integration details for judges.
- **[21-architecture-overview.md](./21-architecture-overview.md)**: Architecture overview.
- **[22-agentic-diagrams.md](./22-agentic-diagrams.md)**: Agentic diagrams (visual).
- **[23-solution-architecture-spec.md](./23-solution-architecture-spec.md)**: Source-reviewed solution spec.
- **[24-product-requirements.md](./24-product-requirements.md)**: Source-reviewed PRD.
- **[25-business-strategy-and-roadmap.md](./25-business-strategy-and-roadmap.md)**: Strategy + roadmap.
- **[26-application-design-system.md](./26-application-design-system.md)**: Design system reference.
- **[27-coppa-compliance.md](./27-coppa-compliance.md)**: COPPA posture summary.
- **[28-devpost-checklist.md](./28-devpost-checklist.md)**: Devpost submission checklist.
- **[99-demo-script-3min.md](./99-demo-script-3min.md)**: 3-minute demo script.

## Notes on Accuracy
- Documents under `01-vision.md` through `15-risks-mitigations.md` include strategy and roadmap content; future plans are described as goals and may not be fully implemented.
- Engineering documents (env/deploy/runbook/integration/spec) are intended to match the current codebase; if there is ever a conflict, the code is the final source of truth.
