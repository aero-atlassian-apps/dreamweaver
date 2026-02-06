# 28. Devpost Submission Checklist

## Required Elements

### Project Information

- [x] Project name: DreamWeaver
- [x] Tagline: Your voice. Their stories. Memories forever.
- [x] Description (max 500 words)
- [x] Built with: React 19, Hono, TypeScript, Gemini 3, Supabase
- [x] Category: AI/ML, Consumer

### Media

- [ ] Cover image (1920x1080)
- [ ] Demo video (3 minutes max)
- [ ] Screenshots (3-5)
- [ ] Logo (square)

### Links

- [ ] Live demo URL
- [ ] GitHub repository
- [ ] API documentation (optional)

---

## Hackathon Requirements

### Gemini API Usage

| Model | Feature | Verified |
|-------|---------|----------|
| Gemini 3 Flash | Story generation | ✅ |
| Gemini 3 Pro | Golden moment detection | ✅ |
| Gemini 2.5 Live | Real-time voice interaction | ✅ |

### Proof Points

1. **Model verification endpoint**: `GET /api/v1/meta/gemini-models`
2. **No-login demo**: `/demo` route + `POST /api/v1/demo/story`
3. **Code evidence**: `GeminiAIGateway.ts`, `GeminiLiveSession.ts`

---

## Demo Script (3-minute)

See: [99-demo-script-3min.md](./99-demo-script-3min.md)

---

## Submission Checklist

### Technical

- [x] App runs without errors
- [x] Demo endpoint works without login
- [x] Gemini 3 models configured
- [ ] Live demo deployed
- [x] All environment variables documented

### Documentation

- [x] README complete
- [x] Architecture documented
- [x] API documented
- [x] Gemini integration explained

### Polish

- [ ] UI responsive on mobile
- [ ] Loading states implemented
- [ ] Error handling graceful
- [ ] Favicon and meta tags
