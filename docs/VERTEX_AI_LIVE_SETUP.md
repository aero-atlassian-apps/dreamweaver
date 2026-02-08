# Vertex AI Live API Setup Guide

## Overview

To use `gemini-live-2.5-flash-native-audio` (the latest native audio model), you need to switch from **Google AI Studio** to **Vertex AI**. They use different endpoints and authentication.

## Current Setup (AI Studio)

- **Endpoint**: `wss://generativelanguage.googleapis.com/ws/...`
- **Auth**: API Key (`GEMINI_API_KEY`)
- **Model**: `gemini-2.0-flash-exp`

## Vertex AI Setup (For Native Audio)

### 1. Prerequisites

```bash
# Install Google Cloud CLI
# https://cloud.google.com/sdk/docs/install

# Login and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable aiplatform.googleapis.com
```

### 2. Environment Variables

Add these to your `.env` and Vercel:

```env
# Vertex AI Configuration
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
VERTEX_AI_REGION=us-central1
GEMINI_LIVE_MODEL=gemini-live-2.5-flash-native-audio

# For Vercel: Use Service Account JSON (base64 encoded)
GOOGLE_APPLICATION_CREDENTIALS_JSON=<base64-encoded-service-account-json>
```

### 3. Create Service Account

```bash
# Create service account
gcloud iam service-accounts create dreamweaver-live \
    --display-name="DreamWeaver Live API"

# Grant Vertex AI User role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:dreamweaver-live@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# Create and download key
gcloud iam service-accounts keys create ./sa-key.json \
    --iam-account=dreamweaver-live@YOUR_PROJECT_ID.iam.gserviceaccount.com

# Base64 encode for Vercel
cat sa-key.json | base64 -w 0
```

### 4. Code Changes Required

Update `GeminiLiveSession.ts`:

```typescript
constructor(apiKey: string, options?: LiveSessionOptions) {
    const model = options?.model || process.env['GEMINI_LIVE_MODEL'] || 'models/gemini-2.0-flash-exp'
    const isVertexModel = model.includes('gemini-live-') || model.includes('native-audio')
    
    let url: string
    let headers: Record<string, string> = {}
    
    if (isVertexModel) {
        // Vertex AI endpoint
        const region = process.env['VERTEX_AI_REGION'] || 'us-central1'
        const projectId = process.env['GOOGLE_CLOUD_PROJECT']
        if (!projectId) {
            throw new Error('GOOGLE_CLOUD_PROJECT required for Vertex AI')
        }
        
        // Get OAuth token (requires google-auth-library)
        const accessToken = await getAccessToken() // Implement this
        
        url = `wss://${region}-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent`
        headers = { 'Authorization': `Bearer ${accessToken}` }
    } else {
        // AI Studio endpoint (current)
        url = `wss://generativelanguage.googleapis.com/ws/...?key=${apiKey}`
    }
    
    this.ws = new WebSocket(url, { headers })
}
```

### 5. OAuth Token Helper

```typescript
import { GoogleAuth } from 'google-auth-library'

async function getAccessToken(): Promise<string> {
    const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    })
    const client = await auth.getClient()
    const token = await client.getAccessToken()
    return token.token!
}
```

### 6. Vercel Deployment

For Vercel, load the service account from env:

```typescript
// In api/src/index.ts or a bootstrap file
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    const decoded = Buffer.from(
        process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON, 
        'base64'
    ).toString('utf-8')
    const tmpPath = '/tmp/gcp-sa.json'
    fs.writeFileSync(tmpPath, decoded)
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath
}
```

## Model Comparison

| Feature | AI Studio (`gemini-2.0-flash-exp`) | Vertex AI (`gemini-live-2.5-flash-native-audio`) |
|---------|-----------------------------------|--------------------------------------------------|
| Audio Quality | Standard | Native (higher quality) |
| Latency | ~200ms | ~100ms |
| Auth | API Key | OAuth/Service Account |
| Pricing | Free tier available | Pay-per-use |
| Region | Global | Region-specific |

## Regions Available

- us-central1, us-east1, us-east4, us-east5, us-south1, us-west1, us-west4
- europe-central2, europe-north1, europe-southwest1, europe-west1, europe-west4, europe-west8

## Troubleshooting

1. **1011 Upstream Closed**: Usually means invalid model name or auth failure
2. **403 Permission Denied**: Check IAM roles for service account
3. **Connection Timeout**: Check region matches your project location
