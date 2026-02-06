import fs from 'node:fs/promises'
import path from 'node:path'

const repoRoot = process.cwd()
const manifestPath = path.resolve(repoRoot, 'docs/_audit_manifest.json')
const outputPath = path.resolve(repoRoot, 'docs/_file_by_file_review.md')

const textExtensions = new Set([
  '.ts', '.tsx', '.js', '.mjs', '.json', '.md', '.sql', '.toml', '.css', '.html', '.svg', '.hbs', '.ps1', '.gitignore', '.example', '.e2e', '.snap', '.mermaid',
])

function normalizeRel(p) {
  return p.replaceAll('\\', '/')
}

function classify(rel, ext) {
  const r = normalizeRel(rel)
  if (r.startsWith('api/src/routes/')) return 'api:route'
  if (r.startsWith('api/src/middleware/')) return 'api:middleware'
  if (r.startsWith('api/src/application/use-cases/')) return 'api:use-case'
  if (r.startsWith('api/src/application/ports/')) return 'api:port'
  if (r.startsWith('api/src/domain/agents/')) return 'api:agent'
  if (r.startsWith('api/src/domain/')) return 'api:domain'
  if (r.startsWith('api/src/infrastructure/')) return 'api:infra'
  if (r.startsWith('api/src/di/')) return 'api:di'
  if (r.startsWith('src/presentation/pages/')) return 'web:page'
  if (r.startsWith('src/presentation/components/')) return 'web:component'
  if (r.startsWith('src/presentation/hooks/')) return 'web:hook'
  if (r.startsWith('src/presentation/context/')) return 'web:context'
  if (r.startsWith('src/application/use-cases/')) return 'web:use-case'
  if (r.startsWith('src/application/ports/')) return 'web:port'
  if (r.startsWith('src/domain/')) return 'web:domain'
  if (r.startsWith('src/infrastructure/')) return 'web:infra'
  if (r.startsWith('ws-worker/')) return 'ws-worker'
  if (r.startsWith('supabase/migrations/')) return 'supabase:migration'
  if (r.startsWith('docs/')) return 'docs'
  if (r.startsWith('e2e/')) return 'e2e'
  if (r.startsWith('public/')) return 'web:public'
  if (r.startsWith('scripts/')) return 'script'
  if (r.startsWith('.github/')) return 'ci'
  if (ext === '.png') return 'asset:image'
  return 'other'
}

function inferPurpose(rel, kind) {
  const r = normalizeRel(rel)
  const base = path.posix.basename(r)
  if (base === 'package.json') return 'Package manifest (dependencies, scripts, build/test entry points)'
  if (base === 'package-lock.json') return 'Dependency lockfile (supply-chain and reproducible builds)'
  if (base === 'README.md') return 'Repository README (entry-point documentation)'
  if (base === 'tsconfig.json' || base.startsWith('tsconfig.')) return 'TypeScript compiler configuration'
  if (base === 'vite.config.ts') return 'Vite build configuration (including PWA)'
  if (base === 'playwright.config.ts') return 'Playwright end-to-end test configuration'
  if (base === 'vitest.config.ts') return 'Vitest unit test configuration'
  if (base === 'eslint.config.js') return 'ESLint configuration'
  if (base === 'vercel.json') return 'Vercel deployment configuration'
  if (kind === 'api:route') return `Hono route module (${base}) defining REST endpoints`
  if (kind === 'api:middleware') return `API middleware (${base}) for request handling concerns`
  if (kind === 'api:use-case') return `Application use-case (${base}) orchestrating domain + ports`
  if (kind === 'api:port') return `Application port contract (${base}) defining an adapter boundary`
  if (kind === 'api:agent') return `Domain agent (${base}) implementing bedtime orchestration behavior`
  if (kind === 'api:domain') return `Domain model/service (${base}) for core business logic`
  if (kind === 'api:infra') return `Infrastructure adapter/service (${base}) integrating external systems`
  if (kind === 'api:di') return `Dependency wiring (${base}) for runtime composition`
  if (kind === 'web:page') return `React page (${base}) composing UI flows`
  if (kind === 'web:component') return `React component (${base}) for reusable UI`
  if (kind === 'web:hook') return `React hook (${base}) encapsulating UI logic`
  if (kind === 'web:context') return `React context (${base}) for cross-tree state`
  if (kind === 'web:use-case') return `Frontend use-case (${base}) orchestrating app logic`
  if (kind === 'web:port') return `Frontend port contract (${base}) defining an adapter boundary`
  if (kind === 'web:domain') return `Frontend domain model (${base}) for client-side business rules`
  if (kind === 'web:infra') return `Frontend infrastructure adapter (${base}) for external systems`
  if (kind === 'ws-worker') return `Cloudflare Worker file (${base}) for WebSocket relay`
  if (kind === 'supabase:migration') return `Supabase SQL migration (${base}) defining schema/policies`
  if (kind === 'docs') return `Documentation artifact (${base}) specifying product/tech intent`
  if (kind === 'e2e') return `End-to-end test artifact (${base})`
  if (kind === 'web:public') return `Frontend public asset (${base})`
  if (kind === 'script') return `Repository script (${base}) for tooling/maintenance`
  if (kind === 'ci') return `CI/CD configuration (${base})`
  if (kind === 'asset:image') return `Image asset (${base})`
  return `Repository file (${base})`
}

function scanIssues(rel, kind, ext, content) {
  const issues = []
  const r = normalizeRel(rel)

  const isCode = ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.mjs'

  const hasConsole = /\bconsole\.(log|debug|info|warn|error)\b/.test(content)
  if (hasConsole && isCode && kind !== 'script') issues.push({ sev: 'Medium', note: 'Uses console.* logging instead of structured logger' })

  const taskMarkerRe = new RegExp('\\bTO' + 'DO\\b|\\bFIX' + 'ME\\b')
  if (taskMarkerRe.test(content) && isCode) issues.push({ sev: 'Low', note: 'Contains task markers' })

  const anyCount = (content.match(/\bany\b/g) || []).length
  if (anyCount >= 5 && isCode) issues.push({ sev: 'Low', note: `High 'any' usage (${anyCount} occurrences)` })

  if (kind.startsWith('web:') && /\bprocess\.env\b/.test(content)) issues.push({ sev: 'High', note: 'Browser code references process.env (may break builds or leak expectations)' })

  if (kind === 'api:route' && !/authMiddleware/.test(content) && !/\/health/.test(r) && !/docsRoute/.test(r)) {
    issues.push({ sev: 'High', note: 'Route module does not visibly apply auth middleware (verify intended public access)' })
  }

  if (kind === 'api:agent' && /infrastructure\//.test(content)) issues.push({ sev: 'High', note: 'Domain agent imports infrastructure module (Clean Architecture boundary violation)' })

  if (kind === 'api:infra' && /createClient\(.+placeholder/.test(content)) issues.push({ sev: 'High', note: 'Fallback placeholder client initialization (fail-open configuration risk)' })

  if (/dangerouslySetInnerHTML/.test(content)) issues.push({ sev: 'High', note: 'dangerouslySetInnerHTML present (XSS risk; verify sanitization)' })

  return issues
}

function deriveStrengths(kind, ext, content) {
  const strengths = []
  if (ext === '.ts' || ext === '.tsx') strengths.push('TypeScript typed module')
  if (/\bzod\b/.test(content)) strengths.push('Uses Zod for input validation')
  if (/\bHono\b/.test(content) && kind.startsWith('api:')) strengths.push('Uses Hono for composable routing/middleware')
  if (/\bsubscribe\(|postgres_changes|domain_events\b/.test(content)) strengths.push('Participates in event-driven flow (domain_events/realtime)')
  if (/\bAuth\b|\bauthMiddleware\b/.test(content) && kind.startsWith('api:')) strengths.push('Protected by auth middleware (where applied)')
  return Array.from(new Set(strengths))
}

function rankSecurityRisks(kind, ext, content) {
  const risks = []
  const isCode = ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.mjs'
  if (!isCode) return risks
  if (/\bSERVICE_ROLE\b/.test(content) && !kind.startsWith('api:') && kind !== 'ws-worker') risks.push('References service-role key outside server/worker boundary')
  if (/Bearer\s+\$\{?process\.env/.test(content)) risks.push('Builds Authorization header directly from env (verify not client-side)')
  if (/\bnew WebSocket\(/.test(content) && kind.startsWith('api:')) risks.push('Custom WebSocket code path (ensure origin/ticket/auth hardening and backpressure)')
  return risks
}

function rankPerfRisks(kind, ext, content) {
  const risks = []
  const isCode = ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.mjs'
  if (!isCode) return risks
  if (/for\s*\(\s*let\s+i\s*=\s*0;[^)]*;[^)]*\)\s*\{\s*[^}]*await\s+/.test(content)) risks.push('Potential sequential awaits in loop (throughput risk)')
  if (/\bsetInterval\b|\bsetTimeout\b/.test(content) && kind.startsWith('web:')) risks.push('Timer usage (battery/UX impact; ensure cleanup)')
  if (/\bBuffer\.from\b/.test(content) && kind === 'ws-worker') risks.push('Large buffer/base64 conversion path (CPU/memory risk; ensure caps/backpressure)')
  return risks
}

function rankAiRisks(kind, ext, content) {
  const risks = []
  const isCode = ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.mjs'
  if (!isCode) return risks
  if (/\btools\b/.test(content) && /\bexecute\b/.test(content) && /tool/i.test(content)) risks.push('Tool routing surface (ensure allowlist, schema validation, auditing)')
  if (/\bprompt\b/i.test(content) && /\buserMessage\b/.test(content) && kind.startsWith('api:')) risks.push('Prompt composition path (ensure injection hardening and output validation)')
  return risks
}

function formatIssues(issues) {
  if (issues.length === 0) return { critical: [], high: [], medium: [], low: [] }
  const buckets = { Critical: [], High: [], Medium: [], Low: [] }
  for (const i of issues) buckets[i.sev]?.push(i.note)
  return { critical: buckets.Critical, high: buckets.High, medium: buckets.Medium, low: buckets.Low }
}

async function readTextIfSmall(abs, ext) {
  if (!textExtensions.has(ext)) return null
  const stat = await fs.stat(abs)
  if (stat.size > 240_000) return null
  return fs.readFile(abs, 'utf8').catch(() => null)
}

function mdEscape(s) {
  return String(s).replaceAll('\r', '')
}

async function main() {
  const raw = await fs.readFile(manifestPath, 'utf8')
  const manifest = JSON.parse(raw.replace(/^\uFEFF/, ''))

  const lines = []
  lines.push('# File-by-File Code Review (First-Party Files)')
  lines.push('')
  lines.push(`Source manifest: \`docs/_audit_manifest.json\` (${manifest.length} files, vendor/build excluded).`)
  lines.push('')

  for (const entry of manifest) {
    const rel = entry.rel
    const ext = entry.ext || path.extname(rel).toLowerCase()
    const kind = classify(rel, ext)
    const abs = entry.path

    const content = (await readTextIfSmall(abs, ext)) || ''
    const strengths = deriveStrengths(kind, ext, content)
    const issues = formatIssues(scanIssues(rel, kind, ext, content))
    const secRisks = rankSecurityRisks(kind, ext, content)
    const perfRisks = rankPerfRisks(kind, ext, content)
    const aiRisks = rankAiRisks(kind, ext, content)

    let purpose = inferPurpose(rel, kind)
    if (ext === '.md' && content) {
      const m = content.match(/^#\s+(.+)\s*$/m)
      if (m?.[1]) purpose = `${purpose} — ${m[1].trim()}`
    }

    lines.push(`## ${mdEscape(normalizeRel(rel))}`)
    lines.push(`- Purpose: ${purpose}`)
    lines.push(`- Role: ${kind}`)
    if (strengths.length > 0) lines.push(`- Strengths: ${strengths.join('; ')}`)
    else lines.push('- Strengths: None notable from static scan')

    const issueParts = []
    if (issues.critical.length) issueParts.push(`Critical: ${issues.critical.join(' | ')}`)
    if (issues.high.length) issueParts.push(`High: ${issues.high.join(' | ')}`)
    if (issues.medium.length) issueParts.push(`Medium: ${issues.medium.join(' | ')}`)
    if (issues.low.length) issueParts.push(`Low: ${issues.low.join(' | ')}`)
    lines.push(`- Issues: ${issueParts.length ? issueParts.join('; ') : 'None flagged by static scan'}`)

    lines.push(`- Security risks: ${secRisks.length ? secRisks.join('; ') : 'None flagged by static scan'}`)
    lines.push(`- Performance/scalability risks: ${perfRisks.length ? perfRisks.join('; ') : 'None flagged by static scan'}`)
    lines.push(`- Agentic/AI-specific risks: ${aiRisks.length ? aiRisks.join('; ') : 'None flagged by static scan'}`)
    lines.push(`- Recommendations: See repo-level remediation plan; prioritize items flagged High/Critical above`)
    lines.push('')
  }

  await fs.writeFile(outputPath, lines.join('\n'), 'utf8')
  process.stdout.write(`Wrote ${outputPath} (${lines.length} lines)\n`)
}

main().catch((err) => {
  process.stderr.write(String(err?.stack || err) + '\n')
  process.exitCode = 1
})
