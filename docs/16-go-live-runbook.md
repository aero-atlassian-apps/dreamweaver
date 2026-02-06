# 16. Go-Live Runbook

## Pre-Launch Checklist

### Environment Setup

- [ ] Supabase project created (production)
- [ ] Vercel project connected to repo
- [ ] Cloudflare Worker deployed
- [ ] All environment variables set
- [ ] DNS configured

### Infrastructure Verification

- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] API endpoints responding
- [ ] WebSocket connection working
- [ ] TTS service accessible

### Security Checks

- [ ] HTTPS enforced everywhere
- [ ] CORS configured correctly
- [ ] API rate limiting active
- [ ] Auth flows tested
- [ ] No secrets in code

---

## Deployment Steps

### 1. Deploy API (Vercel)

```bash
cd api
vercel --prod
```

### 2. Deploy WebSocket Worker (Cloudflare)

```bash
cd ws-worker
npx wrangler deploy
```

### 3. Deploy Frontend (Vercel)

```bash
cd /
vercel --prod
```

---

## Smoke Tests

### API Health

```bash
# Meta endpoint (model verification)
curl https://your-domain.vercel.app/api/v1/meta/gemini-models

# Expected: { success: true, data: { flashModel: "...", proModel: "...", liveModel: "..." } }
```

### Demo Story Generation

```bash
# Demo endpoint (no auth required)
curl -X POST https://your-domain.vercel.app/api/v1/demo/story \
  -H "Content-Type: application/json" \
  -d '{"theme":"space","childName":"Emma","childAge":6}'

# Expected: { success: true, data: { title: "...", content: "..." } }
```

### WebSocket Connection

```javascript
// Browser console test
const ws = new WebSocket('wss://ws-worker.your-domain.workers.dev?ticket=TEST_TICKET');
ws.onopen = () => console.log('✅ WS connected');
ws.onerror = (e) => console.error('❌ WS error', e);
```

---

## Rollback Plan

### Symptoms Requiring Rollback

- Error rate > 5%
- P95 latency > 10s
- Critical security issue
- Data integrity problem

### Rollback Steps

1. **Vercel**: Dashboard → Deployments → Promote previous deployment
2. **Cloudflare**: `npx wrangler rollback`
3. **Database**: Restore from backup (Supabase dashboard)

---

## Monitoring Checklist

| Check | Frequency | Tool |
|-------|-----------|------|
| Error rate | Real-time | Vercel Logs |
| Latency P95 | Every 5 min | Vercel Analytics |
| API health | Every 1 min | UptimeRobot |
| Database connections | Every 5 min | Supabase Dashboard |
| AI costs | Daily | Custom FinOps logs |
