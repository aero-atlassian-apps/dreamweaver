-- Migration: Companion Unlock Persistence
-- Date: 2026-02-03
-- Description: Stores permanently unlocked companions per user.

CREATE TABLE IF NOT EXISTS companion_unlocks (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    companion_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, companion_id)
);

CREATE INDEX IF NOT EXISTS idx_companion_unlocks_user_id ON companion_unlocks(user_id);

