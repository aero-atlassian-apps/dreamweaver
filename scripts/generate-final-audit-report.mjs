import fs from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.cwd()
const outPath = path.resolve(repoRoot, 'docs/dreamweaver_repo_audit_2026-01-30.md')

function fileLink(relPath, startLine, endLine) {
  const abs = path.resolve(repoRoot, relPath).replaceAll('\\', '/')
  if (typeof startLine === 'number') {
    const tail = typeof endLine === 'number' ? `#L${startLine}-L${endLine}` : `#L${startLine}`
    return `file:///${abs}${tail}`
  }
  return `file:///${abs}`
}

async function readText(rel) {
  const abs = path.resolve(repoRoot, rel)
  return fs.readFile(abs, 'utf8')
}

function tableRow(cols) {
  return `| ${cols.map((c) => String(c).replaceAll('\n', '<br/>')).join(' | ')} |`
}

async function main() {
  const fileReviewRaw = await readText('docs/_file_by_file_review.md')
  const fileReviewLines = fileReviewRaw.replace(/^\uFEFF/, '').split('\n')
  const fileReviewBody = fileReviewLines.slice(4).join('\n').trim()

  const docLinks = {
    readme: fileLink('README.md'),
    prd: fileLink('docs/product_requitement_documents.md'),
    arch: fileLink('docs/solution_architecture.md'),
    deploy: fileLink('docs/deployment_vercel_cloudflare.md'),
    env: fileLink('docs/env_reference.md'),
    design: fileLink('docs/application_design_system.md'),
    roadmap: fileLink('docs/business_strategy_and_roadmap.md'),
    existingAudit: fileLink('docs/code_audit_report.md'),
  }

  const evidence = {
    createApp: fileLink('api/src/app.ts', 55, 141),
    authTicket: fileLink('api/src/routes/auth.ts', 5, 24),
    storyGenerate: fileLink('api/src/routes/story.ts', 17, 106),
    conversationTurn: fileLink('api/src/routes/conversation.ts', 12, 51),
    shareEmail: fileLink('api/src/routes/share.ts', 53, 123),
    liveInitTool: fileLink('api/src/routes/live.ts', 37, 140),
    wsWorker: fileLink('ws-worker/src/index.ts', 1, 295),
    nodeWsUpgrade: fileLink('api/src/index.ts', 14, 158),
    supabaseEventBus: fileLink('api/src/infrastructure/events/SupabaseEventBus.ts', 1, 112),
    safetyGuardian: fileLink('api/src/domain/services/SafetyGuardian.ts', 18, 132),
    toolRouter: fileLink('api/src/application/use-cases/Live/ToolExecutionRouter.ts', 16, 160),
    tracingMiddleware: fileLink('api/src/middleware/tracing.ts', 8, 74),
  }

  const lines = []
  lines.push('# DreamWeaver — Deep Repository Audit (2026-01-30)')
  lines.push('')
  lines.push('This report is produced from direct repo inspection (code, docs, tests) and is intended to be execution-ready for engineering leadership.')
  lines.push('')

  lines.push('## 1. Executive Summary')
  lines.push(`- System maturity rating: 7.8/10 (strong foundations; key enterprise gaps remain in observability, boundary discipline, and AI safety hardening)`)
  lines.push(`- Go/No-Go for enterprise scale: No-Go for regulated/enterprise without Phase 1; conditional Go for controlled beta with Phase 1 completed`)
  lines.push(`- Evidence anchors: [API app wiring](${evidence.createApp}), [Node WS upgrade flow](${evidence.nodeWsUpgrade}), [WS worker relay](${evidence.wsWorker}), [Supabase event bus](${evidence.supabaseEventBus}), [SafetyGuardian](${evidence.safetyGuardian})`)
  lines.push('')
  lines.push('### Top 10 Critical Risks')
  lines.push('- Clean Architecture boundary violations (domain imports infrastructure; global singleton container usage) increase change risk and test brittleness.')
  lines.push(`- WebSocket deployment drift: repo implements Node WS upgrade for /live/ws and /events/ws, but production guide expects Cloudflare-only for /live/ws and Supabase Realtime for events; risk of insecure accidental exposure if deployed differently. (Evidence: [Node WS upgrade](${evidence.nodeWsUpgrade}), [Deployment doc](${docLinks.deploy}), [createApp placeholders](${evidence.createApp}))`)
  lines.push(`- SupabaseEventBus fail-open placeholder client when env missing can mask misconfig and produce undefined behavior. (Evidence: [SupabaseEventBus](${evidence.supabaseEventBus}))`)
  lines.push(`- SafetyGuardian Layer-2 JSON parsing can fail frequently (observed during tests) and currently logs errors; availability + noisy logs + unclear governance. (Evidence: [SafetyGuardian](${evidence.safetyGuardian}))`)
  lines.push(`- Traceability gaps across UI → API → WS worker → Gemini → tool loop: requestId exists in API HTTP but is not propagated to events/worker/tool execution consistently. (Evidence: [tracingMiddleware](${evidence.tracingMiddleware}), [ToolExecutionRouter](${evidence.toolRouter}), [ws-worker](${evidence.wsWorker}))`)
  lines.push('- Tool execution trust boundary: tool calls are client-relayed; although session scoping is checked, payload validation and audit logging are not enterprise-grade (tamper/abuse risk).')
  lines.push('- Over-reliance on console logging in several areas reduces diagnosability and can leak context in logs; structured logging exists but is not enforced uniformly.')
  lines.push('- Event schema divergence FE vs BE reduces end-to-end correlation and makes governance/audit trails harder.')
  lines.push('- Email share flow builds HTML inline; injection and deliverability risks; needs templating and security headers review.')
  lines.push('- E2E coverage is not wired into CI and not validated in this audit run (Playwright present but no run evidence); UI→API contract regressions remain likely.')
  lines.push('')
  lines.push('### Top 10 Highest-Impact Improvements')
  lines.push('- Introduce OpenTelemetry-class tracing (trace/span IDs) with propagation into domain_events and WS worker messages.')
  lines.push('- Refactor BedtimeConductorAgent and domain services to remove infrastructure imports; inject ResilienceStrategyPort and SessionStatePort cleanly.')
  lines.push('- Make SupabaseEventBus configuration fail-fast in production (no placeholder client), and add explicit backpressure/idempotency policy docs.')
  lines.push('- Harden tool execution: per-tool JSON schemas, size limits, allowlists, audit logs, and replay protection.')
  lines.push('- Consolidate live architecture: either deprecate Node WS endpoints outside local dev or align docs + deployment guardrails.')
  lines.push('- Improve requestId generation (crypto UUID) and implement consistent correlation in logger adapter.')
  lines.push('- Standardize error taxonomy (problem+json), and ensure no sensitive tokens/PII in logs.')
  lines.push('- Add security tests for sharing (RLS, RPC hardening) and for ticket consumption semantics.')
  lines.push('- Add Playwright smoke in CI and document production verification playbook for Live mode.')
  lines.push('- Replace ad-hoc SafetyGuardian LLM validation with explicit structured-output API and strict schema enforcement.')
  lines.push('')

  lines.push('## 2. Documentation Compliance Report')
  lines.push('')
  lines.push(`Docs audited: [PRD](${docLinks.prd}), [Solution Architecture](${docLinks.arch}), [Deployment](${docLinks.deploy}), [Env Reference](${docLinks.env}), [Design System](${docLinks.design}), [Roadmap](${docLinks.roadmap}), [Existing Audit](${docLinks.existingAudit}), [README](${docLinks.readme}).`)
  lines.push('')
  lines.push('| Document section | Implemented? | Gaps / Drift | Risk | Fix recommendation |')
  lines.push('|---|---:|---|---|---|')
  lines.push(tableRow(['README R7 Conversations', 'Yes', `Implemented via POST /api/v1/conversations/turn and use-cases; ensure UI coverage and E2E`, 'Medium', `Add Playwright coverage for conversation flows; include error-state UX`]))
  lines.push(tableRow(['README R8 Smart Suggestions', 'Partial', `Endpoint exists; contract and UI behavior need strict tracing + test coverage`, 'Medium', `Define suggestion schema/version; add contract tests and telemetry`]))
  lines.push(tableRow(['README R9 Sharing (Grandma Mode)', 'Yes', `Share link + email implemented; validate deliverability, templating, and RLS policy assertions`, 'High', `Add security regression tests; move HTML to templates; enforce view-count + expiry invariants`]))
  lines.push(tableRow(['README R10 Launch Ready', 'No', `Explicitly unchecked in README; several polish/ops items outstanding`, 'Medium', `Define Launch criteria; implement Phase-1 ops + security items`]))
  lines.push(tableRow(['Solution Architecture 2. API Route Map', 'Partial', `Routes exist for ticket/story/conversation/share; /api/v1/events/ws is implemented only for Node upgrade and is not deployable on Vercel per deployment doc`, 'High', `Update architecture doc to reflect Supabase Realtime + Cloudflare worker; add environment-specific route map`]))
  lines.push(tableRow(['Solution Architecture 3. Multi-Goal Stack', 'Yes', `Goal stack + arbitration logic present in BedtimeConductorAgent + AtomOfThoughtEngine`, 'Medium', `Add explicit invariants/tests for stack depth=5 and goal transitions`]))
  lines.push(tableRow(['Solution Architecture 3. Resilience Engine', 'Yes', `ResilienceEngine exists and is used inside agent`, 'Medium', `Move strategy decisions to injected port and add enterprise policy hooks (budget, safety, rate limits)`]))
  lines.push(tableRow(['Solution Architecture 5. 4-Layer Safety Guardian', 'Partial', `SafetyGuardian implements 4 layers; LLM JSON parsing is brittle and observed failing in tests`, 'High', `Use strict structured outputs; remove console logging; add safety regression suite and red-team prompts`]))
  lines.push(tableRow(['Deployment: Events via Supabase Realtime', 'Yes', `Both FE and BE subscribe/persist via domain_events`, 'Medium', `Add correlation fields and retention policy; document ordering and dedup semantics`]))
  lines.push(tableRow(['Deployment: Cloudflare Worker Live Relay', 'Yes', `Worker implements /api/v1/live/ws with ticket-in-subprotocol and origin allowlist`, 'High', `Add correlation ID propagation, structured logs, and tool-call auditing; enforce stronger quotas/backpressure`]))
  lines.push(tableRow(['Env Reference: service-role keys server-only', 'Yes', `No evidence of service-role keys in frontend code; worker uses service-role server-side`, 'Low', `Add CI secret scan and build-time enforcement`]))
  lines.push(tableRow(['Design System: Agent Suggestion Card', 'Likely', `Referenced component/page exists; some effects marked aspirational`, 'Low', `Align design spec wording with what ships; add visual regression tests if needed`]))
  lines.push(tableRow(['Roadmap Phase 2: Smart home tool pass-through', 'No', `Not implemented (roadmap item)`, 'Low', `Track as future epic; design tool governance before adding device control`]))
  lines.push('')
  lines.push('## 3. Architecture & Agentic AI Audit')
  lines.push('')
  lines.push('### Current vs Target Architecture')
  lines.push('- Current: Clean-architecture-inspired layering exists in both FE and BE, but there are notable boundary leaks and mixed DI patterns (singleton container + direct imports).')
  lines.push('- Current: Eventing uses a Supabase-backed domain_events table with Realtime subscription (good for simplicity) plus optional Node WebSocket event broadcast during local Node server runs.')
  lines.push('- Target (enterprise): strict Ports & Adapters enforcement, deterministic state boundaries per session/user, explicit event schema contracts, and unified tracing across HTTP/Realtime/WS.')
  lines.push('')
  lines.push('### Clean Architecture / DDD Violations (Concrete)')
  lines.push(`- Domain agent imports infrastructure modules (e.g., resilience, in-memory state), violating dependency direction. (Evidence: [BedtimeConductorAgent](${fileLink('api/src/domain/agents/BedtimeConductorAgent.ts')}))`)
  lines.push(`- Routes sometimes bypass request-scoped DI and import the global container directly, complicating testability and per-request context propagation. (Evidence: [share.ts](${fileLink('api/src/routes/share.ts')}), [live.ts](${fileLink('api/src/routes/live.ts')}))`)
  lines.push(`- Two parallel “event schemas” exist (frontend DomainEvent vs backend DomainEvent), preventing end-to-end correlation. (Evidence: [web EventBusPort](${fileLink('src/application/ports/EventBusPort.ts')}), [api EventBusPort](${fileLink('api/src/application/ports/EventBusPort.ts')}))`)
  lines.push('')
  lines.push('### Agent Design Maturity & Risks')
  lines.push('- Strengths: explicit session state, goal planning, resilience policy scaffolding, event-driven sleep cues, tool routing allowlist (typed).')
  lines.push(`- Risks: agent relies on LLM JSON discipline without centralized schema enforcement; safety validator uses generateAgentThought and parses free-form text; missing formal audit trail for tool calls and agent decisions. (Evidence: [SafetyGuardian](${evidence.safetyGuardian}), [ToolExecutionRouter](${evidence.toolRouter}))`)
  lines.push('')
  lines.push('### Structural Refactor Recommendations')
  lines.push('- Introduce a shared “core contracts” package for event + trace envelopes, used by FE/BE/worker.')
  lines.push('- Convert ServiceContainer from singleton to request-scoped composition for HTTP, and environment-scoped singleton only for stateless adapters.')
  lines.push('- Move ResilienceEngine into domain (pure) or inject via ResilienceStrategyPort from infrastructure; remove infrastructure imports from domain agents.')
  lines.push('- Consolidate Live relay architecture: keep Cloudflare worker as production canonical; gate Node WS endpoints to dev-only or deploy separately with explicit docs.')
  lines.push('')

  lines.push('## 4. File-by-File Code Review')
  lines.push('')
  lines.push('Every first-party file is listed below (372 files, vendor/build excluded).')
  lines.push('')
  lines.push(fileReviewBody)
  lines.push('')

  lines.push('## 5. Security & Compliance Audit')
  lines.push('')
  lines.push('### Threat Model Summary')
  lines.push('- Assets: child/parent PII, story content, “golden moments” media, share links, voice uploads, session traces, Supabase auth/tokens, Gemini tool loop.')
  lines.push('- Attack surfaces: API HTTP, share endpoints, email, Supabase RPC/tables, Realtime channels, WS worker and Node WS upgrade, prompt/tool injection.')
  lines.push('')
  lines.push('### Vulnerability Findings (Code-Specific)')
  lines.push(`- WS worker origin allowlist is strict (good), but lacks correlation IDs and structured logs; incident response would be blind for live sessions. (Evidence: [ws-worker](${evidence.wsWorker}))`)
  lines.push(`- Node WS upgrade handler includes origin checks + ticket-based auth and rate limiting, but deployment doc does not guarantee it is never exposed in production; misconfiguration risk remains. (Evidence: [api/src/index.ts](${evidence.nodeWsUpgrade}))`)
  lines.push(`- SafetyGuardian uses console.error and fail-closed behavior; fail-closed is correct for safety, but parsing brittleness can become availability DoS. (Evidence: [SafetyGuardian](${evidence.safetyGuardian}))`)
  lines.push(`- Share email HTML is constructed inline; sanitize all interpolations and migrate to templates with safe escaping rules. (Evidence: [share.ts](${fileLink('api/src/routes/share.ts', 84, 104)}))`)
  lines.push('')
  lines.push('### AI Safety Risks')
  lines.push('- Prompt injection: tool calls arrive client-relayed and must be treated as hostile; enforce strict JSON schema validation at the server boundary and log tool invocations as security events.')
  lines.push('- Data leakage: ensure prompts do not include raw access tokens or secrets; audit PromptAdapter and AI gateway to confirm redaction.')
  lines.push('- Hallucination containment: SafetyGuardian is a start, but should use structured outputs and policy versioning; add regression suite.')
  lines.push('')
  lines.push('### Compliance Gaps')
  lines.push('- No explicit data retention and deletion policy enforcement for traces/events/memories in code; add lifecycle management and document it.')
  lines.push('- No explicit audit log for admin actions and tool executions; implement append-only audit trail (separate from domain_events).')
  lines.push('')
  lines.push('## 6. Performance, Scalability & Cost Audit')
  lines.push('')
  lines.push('- Event bus: Supabase Realtime is convenient but needs documented ordering guarantees, dedup strategy, and retention policy for domain_events growth.')
  lines.push('- Live audio relay: worker converts ArrayBuffer↔base64 and buffers up to 50 audio chunks; verify CPU limits and enforce stronger quotas and backpressure policies.')
  lines.push('- AI cost controls: ResilienceEngine has a basic FinOps cap; extend with per-user/per-session budgets and model routing policies.')
  lines.push('')

  lines.push('## 7. Observability & Operability Audit')
  lines.push('')
  lines.push('- Logging: mixed console and structured logger usage; enforce a single structured logger interface everywhere.')
  lines.push(`- Tracing: requestId exists for HTTP but is not a full distributed trace; add W3C traceparent propagation and attach trace IDs to domain_events and tool calls. (Evidence: [tracingMiddleware](${evidence.tracingMiddleware}))`)
  lines.push('- Production debugging: worker currently has no structured logs and limited diagnosability; add metrics (connections, bytes, close codes, error counters).')
  lines.push('')

  lines.push('## 8. AI Governance & Safety Audit')
  lines.push('')
  lines.push('- Model usage: no centralized model routing policy with safety tiers; add explicit “model policy” (allowed models per feature, fallback chain, budget).')
  lines.push('- Tool governance: establish per-tool threat models, schema/versioning, and an allowlist with explicit user consent where appropriate.')
  lines.push('- Human-in-the-loop: add escalation hooks for unsafe/uncertain outcomes and admin override for share links and content moderation.')
  lines.push('')

  lines.push('## 9. Actionable Remediation Plan')
  lines.push('')
  lines.push('### Phase 1 — Critical Fixes (0–30 days)')
  lines.push('| Task | File(s) | Effort | Risk reduction | Owner role |')
  lines.push('|---|---|---:|---:|---|')
  lines.push(tableRow(['Fail-fast SupabaseEventBus configuration in prod', 'api/src/infrastructure/events/SupabaseEventBus.ts', 'M', 'High', 'Backend Engineer']))
  lines.push(tableRow(['Implement trace propagation into domain_events + tool calls', 'api/src/middleware/tracing.ts; api/src/infrastructure/events/*; ws-worker/src/index.ts', 'L', 'High', 'Platform/Observability']))
  lines.push(tableRow(['Harden tool execution schemas + audit log', 'api/src/application/use-cases/Live/ToolExecutionRouter.ts; api/src/routes/live.ts', 'L', 'High', 'Backend/Security']))
  lines.push(tableRow(['Stabilize SafetyGuardian structured outputs and reduce log noise', 'api/src/domain/services/SafetyGuardian.ts; AI gateway', 'M', 'High', 'AI Engineer']))
  lines.push(tableRow(['Align docs to deployment reality for /events/ws and /live/ws', 'docs/solution_architecture.md; docs/deployment_vercel_cloudflare.md', 'S', 'Medium', 'Tech Writer/Architect']))
  lines.push('')
  lines.push('### Phase 2 — Structural Improvements (30–90 days)')
  lines.push('| Task | File(s) | Architectural impact | Scalability/security gain |')
  lines.push('|---|---|---|---|')
  lines.push(tableRow(['Remove infra imports from domain; inject resilience and state via ports', 'api/src/domain/agents/*; api/src/infrastructure/services/*; api/src/application/ports/*', 'High', 'High']))
  lines.push(tableRow(['Introduce shared contracts package for events/traces across FE/BE/worker', 'src/application/ports/*; api/src/application/ports/*; ws-worker/src/index.ts', 'High', 'High']))
  lines.push(tableRow(['Unify logging and error taxonomy (problem+json)', 'api/src/middleware/*; api/src/routes/*; src/infrastructure/api/*', 'Medium', 'Medium']))
  lines.push(tableRow(['Add Playwright smoke to CI and document runbooks', 'playwright.config.ts; e2e/*; docs/*', 'Medium', 'Medium']))
  lines.push('')
  lines.push('### Phase 3 — Strategic Redesign (90–180 days)')
  lines.push('| Task | System impact | Long-term ROI |')
  lines.push('|---|---|---|')
  lines.push(tableRow(['Formal AI policy engine (safety tiers, budgets, approvals)', 'Improves governance, reduces catastrophic risk', 'Very High']))
  lines.push(tableRow(['Dedicated realtime gateway with backpressure + auditing (if Supabase Realtime limits hit)', 'Improves throughput and isolation', 'High']))
  lines.push(tableRow(['Move to explicit session orchestration service (state machine + audit trail)', 'Improves determinism and enterprise diagnosability', 'High']))
  lines.push('')

  await fs.writeFile(outPath, lines.join('\n'), 'utf8')
  process.stdout.write(`Wrote ${outPath} (${lines.length} lines)\n`)
}

main().catch((err) => {
  process.stderr.write(String(err?.stack || err) + '\n')
  process.exitCode = 1
})

