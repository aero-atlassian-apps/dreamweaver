# 99. Demo Script (3 Minutes)

## Setup Before Demo

1. Open browser to https://dreamweaver-app.vercel.app/demo
2. Have terminal ready for API check
3. Have slide with architecture diagram (optional)

---

## Demo Flow

### Intro (0:00-0:30)

> "Every night, millions of parents feel guilty because they're too tired to read with enthusiasm. DreamWeaver solves this—an AI that knows your family, sounds like you, and captures magic moments automatically."

**Action:** Show home screen with proactive story suggestion.

---

### Feature 1: Gemini-Powered Story (0:30-1:15)

> "Let me show you how it works. We use Gemini 3 Flash for fast story generation."

**Action:** 
1. Click "Generate Story"
2. Show model proof in footer: "Flash: gemini-3-flash-preview"
3. Story generates and displays

> "Notice the story mentions the child's name and interests—this is personalized, not generic."

---

### Feature 2: Proof of Gemini 3 (1:15-1:45)

> "Let me prove we're using Gemini 3."

**Action:** Show API response with model names:
```bash
curl https://your-domain.vercel.app/api/v1/meta/gemini-models
```

> "Flash for fast generation, Pro for complex reasoning like golden moment detection, and Gemini 2.5 Live for real-time voice interaction."

---

### Feature 3: Live Mode (1:45-2:15)

> "The killer feature: children can interact. Using Gemini Live, Emma can interrupt the story."

**Action:** Click "Live Mode" button (show UI, describe flow if not live):
- Child says "What's that star?"
- AI answers *in the story narrative*
- Memory automatically captured

> "The child isn't passive—they direct the story."

---

### Feature 4: Memory Capture (2:15-2:30)

> "And those magical moments? Automatically captured."

**Action:** Show Memory Vault with a captured golden moment.

> "Parents get a weekly digest. Grandparents get Grandma Mode links—48-hour secure sharing."

---

### Close (2:30-3:00)

> "DreamWeaver isn't an LLM wrapper. It's a true agentic AI that:
> - Knows your family
> - Learns from every session  
> - Anticipates what story you need tonight
> - Captures memories you'd otherwise forget
> 
> Bedtime, transformed. Thank you."

---

## Key Talking Points

| Feature | Gemini Model | Why It Matters |
|---------|--------------|----------------|
| Story Generation | 3 Flash | Fast, cost-effective |
| Golden Moments | 3 Pro | Complex reasoning |
| Live Interaction | 2.5 Live | Real-time voice |

---

## Backup: If Demo Fails

1. Show pre-recorded video
2. Show API curl response proving model usage
3. Show code: `GeminiAIGateway.ts` using `gemini-3-flash-preview`
