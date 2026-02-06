---
name: security-audit
description: >
  Performs security audits on code changes before committing. Use when reviewing
  for vulnerabilities (injection, secrets, auth), checking OWASP Top 10 compliance,
  or validating security best practices. Triggers on: security review, vulnerability
  check, secret scanning, auth/authz validation.
---

# Security Audit Skill

## 1. Purpose

This skill defines security checks that must be performed before any code is committed. Run this audit as part of the CI workflow and code review process.

## When to use this skill

- Before creating a PR with new features
- When adding authentication/authorization code
- When handling user input or external data
- When adding API endpoints or database queries
- Before any release

## 2. Security Checklist

### 2.1 Secrets & Credentials (CRITICAL)

- [ ] **No hardcoded secrets**: API keys, passwords, tokens must use environment variables
- [ ] **Check for leaked secrets**: Scan for patterns like `api_key`, `secret`, `password`, `token` in code
- [ ] **.env files**: Ensure `.env` is in `.gitignore` and never committed
- [ ] **Example configs**: Use `.env.example` with placeholder values only

```bash
# Quick secret scan
grep -rn --include="*.ts" --include="*.tsx" --include="*.js" \
  -E "(apiKey|api_key|secret|password|token)\s*[:=]\s*['\"][^'\"]+['\"]" src/
```

### 2.2 Injection Prevention

- [ ] **SQL Injection**: Use parameterized queries or ORM (never string concatenation)
- [ ] **NoSQL Injection**: Sanitize MongoDB queries
- [ ] **XSS Prevention**: Escape user input in React (JSX auto-escapes, but check `dangerouslySetInnerHTML`)
- [ ] **Command Injection**: Never pass user input to `exec()` or `spawn()` without validation
- [ ] **Prototype Pollution**: Validate recursive merges and JSON parsing

### 2.3 AI & LLM Security (NEW)

- [ ] **Prompt Injection**: Never concatenate user input directly into system prompts. Use parameterized prompts or specific "User Input" blocks.
- [ ] **Output Validation**: Always validate LLM output structure with Zod before using it.
- [ ] **Sensitive Data Scrubbing**: Sanitize PII (names, emails, IDs) from prompts before sending to external AI providers.
- [ ] **Cost Control**: Implement strict token limits and budget alerts.

### 2.3 Authentication & Authorization

- [ ] **Protected Routes**: All sensitive endpoints use `authMiddleware`
- [ ] **Session Management**: Tokens expire, are rotated, and stored securely
- [ ] **CORS Configuration**: `ALLOWED_ORIGINS` is restrictive, not `*` in production
- [ ] **Rate Limiting**: Consider adding for public endpoints

### 2.4 Input Validation

- [ ] **Type Validation**: Use Zod or similar for runtime validation
- [ ] **Sanitization**: Strip dangerous characters from user input
- [ ] **File Uploads**: Validate file types, sizes, and scan for malware
- [ ] **URL Validation**: Check for SSRF vulnerabilities when fetching external URLs

### 2.5 Data Protection

- [ ] **Sensitive Data Logging**: Never log passwords, tokens, or PII
- [ ] **HTTPS Only**: Ensure all external requests use HTTPS
- [ ] **Encryption**: Encrypt sensitive data at rest
- [ ] **GDPR Compliance**: Audit data collection and retention

### 2.6 Dependency Security

- [ ] **Outdated Dependencies**: Run `npm audit` to check for vulnerabilities
- [ ] **Lock Files**: Ensure `package-lock.json` is committed
- [ ] **Minimal Dependencies**: Avoid unnecessary packages that expand attack surface

```bash
# Check for vulnerable dependencies
npm audit

# Validate lockfile consistency
npm ci --dry-run
```

### 2.7 Supply Chain Security

- [ ] **Pinned Versions**: Avoid fuzzy versions (`^` or `~`) for critical shared libraries if stability is paramount.
- [ ] **Script Auditing**: Review `postinstall` scripts in node_modules for suspicious activity.
- [ ] **Public Registry Only**: Ensure no private packages are accidentally published or requested from public registries (dependency confusion).

## 3. OWASP Top 10 Quick Reference

| # | Vulnerability | Check |
|---|---------------|-------|
| A01 | Broken Access Control | Are routes protected? |
| A02 | Cryptographic Failures | Using HTTPS? Secure hashing? |
| A03 | Injection | Parameterized queries? |
| A04 | Insecure Design | Threat modeling done? |
| A05 | Security Misconfiguration | Headers set? CORS restrictive? |
| A06 | Vulnerable Components | npm audit clean? |
| A07 | Auth Failures | Token rotation? Session timeout? |
| A08 | Software/Data Integrity | Lock files committed? |
| A09 | Logging Failures | No secrets in logs? |
| A10 | SSRF | URL validation on external fetches? |

## 4. Decision Tree

```
Is this code handling user input?
├── Yes → Run injection prevention checks (2.2)
└── No → Continue

Is this code making API calls?
├── Yes → Check for hardcoded secrets (2.1)
└── No → Continue

Is this an API endpoint?
├── Yes → Verify auth middleware + CORS + rate limiting (2.3)
└── No → Continue

Is this touching the database?
├── Yes → Check for SQL injection + logging (2.2, 2.5)
└── No → Continue
```

## 5. Automated Checks

Run these commands as part of CI:

```bash
# Check for secrets
npm run lint

# Check dependencies for vulnerabilities
npm audit --audit-level=moderate

# Type check (catches undefined access patterns)
npm run typecheck
```

## 6. Reporting

When issues are found, report with:
- **Severity**: Critical / High / Medium / Low
- **Location**: File and line number
- **Issue**: What the vulnerability is
- **Fix**: How to remediate
