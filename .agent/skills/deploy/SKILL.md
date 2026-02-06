---
name: deploy
description: Deploy the application to Vercel/Cloudflare. Use when asked to "deploy", "ship it", or "release".
---

# Deployment Skill

## Overview
This skill handles the deployment of the DreamWeaver application to Vercel (Frontend/API) and Cloudflare (if applicable for Workers).

## Prerequisites
- Vercel CLI installed (`npm i -g vercel`)
- User logged in (`vercel login`)
- Project linked (`vercel link`)

## Deploy Workflow

### 1. Pre-flight Checks
Before deploying, run the quality gates:
```bash
npm run typecheck
npm run test
npm run build
```

### 2. Vercel Deployment

**Preview Deployment:**
```bash
vercel
```

**Production Deployment:**
```bash
vercel --prod
```

### 3. Verification
After deployment:
- Check the returned URL.
- Verify critical flows (Login, Story Generation).

## Troubleshooting

- **Build Failures**: Check `vercel-build` output.
- **Env Vars**: Ensure `.env.production` vars are set in Vercel Dashboard.
