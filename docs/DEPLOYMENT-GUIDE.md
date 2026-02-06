# DreamWeaver: Complete Deployment Guide

> **From Zero to Production in ~30 Minutes**
> 
> This guide walks you through every step to deploy DreamWeaver, including database setup, API keys, and all services. Follow in order.

---

## Prerequisites

- [ ] Node.js 20+ installed
- [ ] Git installed
- [ ] GitHub account (for Vercel deployment)
- [ ] Credit card (for free tier signups — no charges)

---

## Phase 1: Supabase (Database)

### Step 1.1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com/) → **Start your project**
2. Sign in with GitHub
3. Click **New Project**
4. Fill in:
   - **Name:** `dreamweaver-prod`
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to your users
5. Click **Create new project** (wait 2-3 minutes)

### Step 1.2: Get Supabase Keys

1. In your project dashboard, go to **Settings** → **API**
2. Copy these values:

| Key | Where to find | Env var |
|-----|---------------|---------|
| **Project URL** | Under "Project URL" | `SUPABASE_URL` |
| **anon/public** | Under "Project API keys" | `SUPABASE_ANON_KEY` |
| **service_role** | Under "Project API keys" (click reveal) | `SUPABASE_SERVICE_ROLE_KEY` |

> [!CAUTION]
> Never expose `service_role` key in frontend code!

### Step 1.3: Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Paste the following schema and click **Run**:

```sql
-- ============================================
-- DREAMWEAVER DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector for RAG (future)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    role TEXT DEFAULT 'parent' CHECK (role IN ('parent', 'child')),
    avatar_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================
-- STORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    theme TEXT,
    child_name TEXT,
    child_age INTEGER,
    audio_url TEXT,
    duration_seconds INTEGER,
    status TEXT DEFAULT 'completed' CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GOLDEN MOMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS golden_moments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('question', 'milestone', 'emotion', 'first_word', 'custom')),
    transcript TEXT,
    audio_url TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHARED LINKS TABLE (Grandma Mode)
-- ============================================
CREATE TABLE IF NOT EXISTS shared_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    view_count INTEGER DEFAULT 0,
    max_views INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPANIONS TABLE (Gamification)
-- ============================================
CREATE TABLE IF NOT EXISTS companions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    companion_type TEXT NOT NULL,
    name TEXT,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(profile_id, companion_type)
);

-- ============================================
-- VOICE PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS voice_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sample_url TEXT,
    voice_model_id TEXT,
    provider TEXT DEFAULT 'huggingface',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WS TICKETS TABLE (Live Mode Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS ws_tickets (
    ticket UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consumed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    preferred_themes TEXT[] DEFAULT '{}',
    preferred_length TEXT DEFAULT 'medium',
    notifications_enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stories_profile_id ON stories(profile_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_profile_id ON golden_moments(profile_id);
CREATE INDEX IF NOT EXISTS idx_moments_story_id ON golden_moments(story_id);
CREATE INDEX IF NOT EXISTS idx_shared_token ON shared_links(token);
CREATE INDEX IF NOT EXISTS idx_ws_tickets_user ON ws_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_ws_tickets_expires ON ws_tickets(expires_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE golden_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Stories: Users can only see/edit stories from their profile
CREATE POLICY "Users can view own stories" ON stories
    FOR SELECT USING (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can insert own stories" ON stories
    FOR INSERT WITH CHECK (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can update own stories" ON stories
    FOR UPDATE USING (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can delete own stories" ON stories
    FOR DELETE USING (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Golden Moments: Users can only see their own moments
CREATE POLICY "Users can view own moments" ON golden_moments
    FOR SELECT USING (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can insert own moments" ON golden_moments
    FOR INSERT WITH CHECK (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Shared Links: Users can manage their own share links
CREATE POLICY "Users can view own shared links" ON shared_links
    FOR SELECT USING (
        story_id IN (
            SELECT s.id FROM stories s
            JOIN profiles p ON s.profile_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can insert shared links" ON shared_links
    FOR INSERT WITH CHECK (
        story_id IN (
            SELECT s.id FROM stories s
            JOIN profiles p ON s.profile_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );

-- Companions: Users can view/manage their own companions
CREATE POLICY "Users can view own companions" ON companions
    FOR SELECT USING (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can insert own companions" ON companions
    FOR INSERT WITH CHECK (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- Voice Profiles: Users can manage their own voice profiles
CREATE POLICY "Users can view own voice profiles" ON voice_profiles
    FOR SELECT USING (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can insert own voice profiles" ON voice_profiles
    FOR INSERT WITH CHECK (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- WS Tickets: Users can only access their own tickets
CREATE POLICY "Users can view own tickets" ON ws_tickets
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own tickets" ON ws_tickets
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- User Preferences: Users can manage their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );
CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (
        profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    );

-- ============================================
-- SERVICE ROLE POLICIES (for API)
-- ============================================

-- Allow service role to bypass RLS for admin operations
-- (Automatically handled by Supabase when using service_role key)

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- DONE!
-- ============================================
SELECT 'Database schema created successfully!' as status;
```

4. You should see "Success" message

### Step 1.4: Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. (Optional) Enable **Google** or **GitHub** for social login

---

## Phase 2: Get API Keys

### Step 2.1: Google AI Studio (Gemini)

1. Go to [aistudio.google.com](https://aistudio.google.com/)
2. Sign in with Google
3. Click **Get API key** → **Create API key**
4. Choose "Create API key in new project" or select existing
5. Copy the key

| Key | Env var |
|-----|---------|
| API Key | `GEMINI_API_KEY` |

> [!TIP]
> Enable billing at [console.cloud.google.com](https://console.cloud.google.com/billing) to use your $300 free credits!

### Step 2.2: Upstash Redis

1. Go to [upstash.com](https://upstash.com/) → **Console**
2. Sign in with GitHub
3. Click **Create Database**
4. Fill in:
   - **Name:** `dreamweaver-cache`
   - **Region:** Choose closest to Vercel region
   - **Type:** Regional (free tier)
5. Click **Create**
6. Go to **REST API** tab and copy:

| Key | Env var |
|-----|---------|
| `UPSTASH_REDIS_REST_URL` | `UPSTASH_REDIS_REST_URL` |
| `UPSTASH_REDIS_REST_TOKEN` | `UPSTASH_REDIS_REST_TOKEN` |

Also copy the standard Redis URL for `REDIS_URL`.

### Step 2.3: Hugging Face (Voice Cloning - Optional)

1. Go to [huggingface.co](https://huggingface.co/) → **Sign Up**
2. Click your avatar → **Settings** → **Access Tokens**
3. Click **New Token**
4. Name: `dreamweaver-tts`, Role: **Read**
5. Copy the token

| Key | Env var |
|-----|---------|
| Token | `HUGGINGFACE_API_KEY` |

### Step 2.4: Google Cloud TTS (Optional)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create or select a project
3. Enable **Cloud Text-to-Speech API**
4. Go to **APIs & Services** → **Credentials**
5. Create an **API Key**

| Key | Env var |
|-----|---------|
| API Key | `GOOGLE_TTS_API_KEY` |

### Step 2.5: Generate Secrets

Generate two random secrets for internal auth:

```bash
# Run in terminal or use a password generator
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

| Purpose | Env var |
|---------|---------|
| WS Worker auth | `WS_WORKER_INTERNAL_TOKEN` |
| Cron endpoint auth | `CRON_SECRET` |

---

## Phase 3: Cloudflare Worker (WebSocket)

### Step 3.1: Create Cloudflare Account

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/)
2. Sign up for free account

### Step 3.2: Install Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

### Step 3.3: Configure Worker

1. Navigate to the worker directory:

```bash
cd ws-worker
```

2. Create `.dev.vars` file for local testing:

```bash
# Copy example
cp .dev.vars.example .dev.vars
```

3. Edit `.dev.vars` with your values:

```env
DW_API_BASE_URL=http://localhost:3001/api/v1
WS_WORKER_INTERNAL_TOKEN=your-secret-from-step-2.5
GEMINI_API_KEY=your-gemini-key
GEMINI_LIVE_MODEL=models/gemini-live-2.5-flash-native-audio
ALLOWED_ORIGINS=http://localhost:5173
```

### Step 3.4: Deploy Worker

```bash
# Deploy to Cloudflare
npx wrangler deploy

# Note the URL, e.g.: https://dw-live.your-account.workers.dev
```

### Step 3.5: Set Production Secrets

```bash
# Set each secret
wrangler secret put DW_API_BASE_URL
# Enter: https://your-api.vercel.app/api/v1

wrangler secret put WS_WORKER_INTERNAL_TOKEN
# Enter: your-secret-from-step-2.5

wrangler secret put GEMINI_API_KEY
# Enter: your-gemini-key

wrangler secret put ALLOWED_ORIGINS
# Enter: https://your-app.vercel.app
```

📝 **Save your Worker URL:** `https://dw-live.your-account.workers.dev`

---

## Phase 4: Vercel API Deployment

### Step 4.1: Prepare Repository

1. Push your code to GitHub (if not already)
2. Go to [vercel.com](https://vercel.com/) → Sign in with GitHub

### Step 4.2: Import Project (API)

1. Click **Add New** → **Project**
2. Import your DreamWeaver repository
3. Configure:
   - **Root Directory:** `api`
   - **Framework Preset:** Other
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Step 4.3: Set Environment Variables

Add these in Vercel's project settings → **Environment Variables**:

```env
# Required
NODE_ENV=production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=your-key
REDIS_URL=redis://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=your-token
WS_WORKER_INTERNAL_TOKEN=your-secret

# Gemini Models
GEMINI_MODEL_FLASH=gemini-3-flash-preview
GEMINI_MODEL_PRO=gemini-3-pro-preview
GEMINI_LIVE_MODEL=models/gemini-live-2.5-flash-native-audio

# App Config
PUBLIC_APP_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app

# Optional
GOOGLE_TTS_API_KEY=your-key
VOICE_CLONING_ENABLED=true
HUGGINGFACE_API_KEY=hf_...
HUGGINGFACE_TTS_MODEL=coqui/XTTS-v2
PUBLIC_DEMO_ENABLED=true
```

### Step 4.4: Deploy

1. Click **Deploy**
2. Wait for build to complete

📝 **Save your API URL:** `https://dreamweaver-api.vercel.app`

### Step 4.5: Update Cloudflare Worker

Now update the Cloudflare Worker with the real API URL:

```bash
wrangler secret put DW_API_BASE_URL
# Enter: https://dreamweaver-api.vercel.app/api/v1
```

---

## Phase 5: Vercel App Deployment

### Step 5.1: Import Project (App)

1. In Vercel, click **Add New** → **Project**
2. Import the same repository again
3. Configure:
   - **Root Directory:** `.` (root)
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Step 5.2: Set Environment Variables

```env
# Required
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_BASE_URL=https://dreamweaver-api.vercel.app

# WebSocket (Cloudflare Worker)
VITE_WS_BASE_URL=wss://dw-live.your-account.workers.dev
```

### Step 5.3: Deploy

1. Click **Deploy**
2. Wait for build to complete

📝 **Save your App URL:** `https://dreamweaver-app.vercel.app`

---

## Phase 6: Final Configuration

### Step 6.1: Update CORS Origins

Go back to your API project in Vercel and update:

```env
ALLOWED_ORIGINS=https://dreamweaver-app.vercel.app
PUBLIC_APP_URL=https://dreamweaver-app.vercel.app
```

Redeploy the API.

### Step 6.2: Update Cloudflare Origins

```bash
wrangler secret put ALLOWED_ORIGINS
# Enter: https://dreamweaver-app.vercel.app
```

---

## Phase 7: Testing & Demo

### Step 7.1: Health Check

```bash
# Check API health
curl https://dreamweaver-api.vercel.app/api/v1/health

# Expected: { "status": "healthy", ... }
```

### Step 7.2: Model Verification

```bash
# Check Gemini models
curl https://dreamweaver-api.vercel.app/api/v1/meta/gemini-models

# Expected: { "success": true, "data": { "flashModel": "gemini-3-flash-preview", ... } }
```

### Step 7.3: Demo Page Test

1. Open: `https://dreamweaver-app.vercel.app/demo`
2. You should see the demo page with model proof
3. Click **Generate Story**
4. A story should generate using Gemini 3 Flash

### Step 7.4: Full User Flow Test

1. **Sign Up:**
   - Go to `https://dreamweaver-app.vercel.app`
   - Click Sign Up → Create account with email
   - Check email for confirmation link

2. **Create Story:**
   - After login, go to Dashboard
   - Click "New Story"
   - Select theme, enter child name
   - Generate story

3. **Test Live Mode:**
   - Click "Live Mode" on a story
   - Allow microphone access
   - Speak to test bidirectional audio

4. **Test Sharing (Grandma Mode):**
   - On any story, click "Share"
   - Copy the link
   - Open in incognito → Should work without login

---

## Troubleshooting

### "CORS Error"
- Check `ALLOWED_ORIGINS` includes your app URL
- Redeploy both API and Worker after changes

### "WebSocket Connection Failed"
- Check Cloudflare Worker logs: `wrangler tail`
- Verify `WS_WORKER_INTERNAL_TOKEN` matches in API and Worker
- Check `DW_API_BASE_URL` is correct in Worker

### "Gemini API Error"
- Verify `GEMINI_API_KEY` is valid
- Check billing is enabled in Google Cloud Console
- Test key directly: `curl -H "x-goog-api-key: YOUR_KEY" https://generativelanguage.googleapis.com/v1beta/models`

### "Database Error"
- Check Supabase dashboard → Logs → API
- Verify RLS policies are created
- Check `SUPABASE_SERVICE_ROLE_KEY` for service role operations

---

## Quick Reference

| Service | URL |
|---------|-----|
| **App** | https://dreamweaver-app.vercel.app |
| **API** | https://dreamweaver-api.vercel.app |
| **WebSocket** | wss://dw-live.your-account.workers.dev |
| **Supabase** | https://xxx.supabase.co |

| Dashboard | Link |
|-----------|------|
| Vercel | [vercel.com/dashboard](https://vercel.com/dashboard) |
| Cloudflare | [dash.cloudflare.com](https://dash.cloudflare.com) |
| Supabase | [supabase.com/dashboard](https://supabase.com/dashboard) |
| Google AI Studio | [aistudio.google.com](https://aistudio.google.com) |
| Upstash | [console.upstash.com](https://console.upstash.com) |

---

## 🎉 Congratulations!

You've deployed DreamWeaver. Your AI-powered bedtime storytelling app is now live!

**Next Steps:**
1. Configure custom domain (optional)
2. Set up monitoring with Vercel Analytics
3. Disable demo mode for production: `PUBLIC_DEMO_ENABLED=false`
