# 20. Gemini 3 Integration

## Model Usage

DreamWeaver leverages multiple Gemini models for different capabilities:

| Model | Use Case | Endpoint |
|-------|----------|----------|
| **Gemini 3 Flash** | Story generation (fast) | `gemini-3-flash-preview` |
| **Gemini 3 Pro** | Complex reasoning, golden moments | `gemini-3-pro-preview` |
| **Gemini 2.5 Live** | Real-time voice interaction | `gemini-live-2.5-flash-native-audio` |

> [!NOTE]
> Gemini 3 Live is not yet available. Live Mode uses Gemini 2.5 Flash Native Audio.

---

## Gemini 3 Features Used

### 1. Story Generation (Flash)

```typescript
// Fast story generation with structured output
const story = await gemini.generateContent({
  model: 'gemini-3-flash-preview',
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: storySchema, // Zod-derived schema
  },
});
```

### 2. Golden Moment Detection (Pro)

```typescript
// Complex reasoning for milestone detection
const moment = await gemini.generateContent({
  model: 'gemini-3-pro-preview',
  contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }],
  systemInstruction: 'Analyze for developmental milestones, emotional moments...',
});
```

### 3. Live Voice Interaction (2.5 Live)

```typescript
// Real-time bidirectional audio
const session = await gemini.live.connect({
  model: 'models/gemini-live-2.5-flash-native-audio',
  config: {
    voice: 'Puck',
    systemInstruction: 'You are a gentle bedtime storyteller...',
  },
});
```

---

## Configuration

### Environment Variables

```bash
# .env
GEMINI_API_KEY=your-api-key
GEMINI_MODEL_FLASH=gemini-3-flash-preview
GEMINI_MODEL_PRO=gemini-3-pro-preview
GEMINI_LIVE_MODEL=models/gemini-live-2.5-flash-native-audio
```

### Verification Endpoint

```bash
# Test model configuration
curl https://your-domain.vercel.app/api/v1/meta/gemini-models

# Response
{
  "success": true,
  "data": {
    "flashModel": "gemini-3-flash-preview",
    "proModel": "gemini-3-pro-preview",
    "liveModel": "models/gemini-live-2.5-flash-native-audio"
  }
}
```

---

## Cost Optimization

| Model | Input Cost | Output Cost | Use Case |
|-------|------------|-------------|----------|
| **3 Flash** | $0.10/1M | $0.40/1M | Default for stories |
| **3 Pro** | $1.25/1M | $5.00/1M | Critical reasoning only |
| **2.5 Live** | Session-based | Session-based | Voice interaction |

**Strategy:** Use Flash for 90% of operations, Pro only for golden moment detection.
