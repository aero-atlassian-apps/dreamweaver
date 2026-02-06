-- Migration: Consolidated Schema Initialization
-- Date: 2026-01-28
-- Description: Creates all base tables with proper types and FKs. Idempotent.

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Base Tables (Drop in reverse dependency order if exists)
DROP VIEW IF EXISTS theme_scores CASCADE;
DROP TABLE IF EXISTS domain_events CASCADE;
DROP TABLE IF EXISTS shared_links CASCADE;
DROP TABLE IF EXISTS golden_moments CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS preference_pairs CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS families CASCADE;
DROP TABLE IF EXISTS theme_outcomes CASCADE;
DROP TABLE IF EXISTS agent_memories CASCADE;

-- agent_memories
CREATE TABLE agent_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    type TEXT NOT NULL CHECK (type IN ('EPISODIC', 'SEMANTIC', 'PROCEDURAL', 'PREFERENCE')),
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- gemini-embedding-001 with output_dimensionality=1536 (see SupabaseAgentMemory.ts)
    confidence FLOAT DEFAULT 1.0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- theme_outcomes
CREATE TABLE theme_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL,
    outcome TEXT NOT NULL CHECK (outcome IN ('POSITIVE', 'NEGATIVE')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- families
CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- family_members
CREATE TABLE family_members (
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'parent',
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (family_id, user_id)
);

-- user_preferences
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    mic_enabled BOOLEAN NOT NULL DEFAULT true,
    reminders_enabled BOOLEAN NOT NULL DEFAULT false,
    weekly_digest_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- preference_pairs
CREATE TABLE preference_pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    win_theme TEXT NOT NULL,
    lose_theme TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- stories
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    theme TEXT NOT NULL,
    status TEXT NOT NULL,
    audio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    generated_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- golden_moments
CREATE TABLE golden_moments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
    media_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- shared_links
CREATE TABLE shared_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL, -- story_id or moment_id
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('STORY', 'MOMENT')),
    token TEXT NOT NULL UNIQUE,
    max_views INTEGER NOT NULL DEFAULT 3,
    current_views INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- domain_events
CREATE TABLE domain_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    request_id TEXT,
    type TEXT NOT NULL,
    payload JSONB NOT NULL,
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX idx_memories_user ON agent_memories(user_id);
CREATE INDEX idx_memories_type ON agent_memories(type);
CREATE INDEX idx_memories_session ON agent_memories(session_id);
CREATE INDEX idx_theme_user ON theme_outcomes(user_id);
CREATE INDEX idx_theme_name ON theme_outcomes(theme);
CREATE INDEX idx_preference_pairs_user ON preference_pairs(user_id);
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_moments_user_id ON golden_moments(user_id);
CREATE INDEX idx_moments_story_id ON golden_moments(story_id);
CREATE INDEX idx_shared_links_token ON shared_links(token);
CREATE INDEX idx_domain_events_occurred_at ON domain_events(occurred_at);
