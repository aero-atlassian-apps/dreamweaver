---
name: api-security-best-practices
description: Audit and secure API endpoints against OWASP Top 10 risks. Use when reviewing API code, routes, or authentication logic.
---

# API Security Best Practices

## Checklist

### 1. Authentication & Authorization
- [ ] **No Broken Auth**: Is `authMiddleware` applied to all private routes?
- [ ] **Role Checks**: Does the code check user roles/permissions, not just presence of a token?
- [ ] **Token Validation**: Are JWTs verified with the correct secret?

### 2. Data Validation (Input/Output)
- [ ] **Input Sanitization**: Is `zod` or similar used to validate ALL request bodies/params?
- [ ] **No SQL Injection**: Are ORM methods used? (Avoid raw SQL strings with user input).
- [ ] **Rate Limiting**: Is there protection against brute force?

### 3. Data Privacy
- [ ] **No Sensitive Leakage**: Are passwords/secrets stripped from responses?
- [ ] **HTTPS Only**: (Verify via config).

### 4. Error Handling
- [ ] **Generic Errors**: Do production errors hide stack traces?
- [ ] **Logging**: Are security events logged (without sensitive data)?

## Usage
Run this checklist against every file in `api/src/routes` and `api/src/controllers`.
