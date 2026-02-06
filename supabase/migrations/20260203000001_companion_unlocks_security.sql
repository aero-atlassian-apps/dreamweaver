-- Migration: Companion Unlock Policies
-- Date: 2026-02-03
-- Description: Enables RLS and defines access control for companion unlocks.

ALTER TABLE companion_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own companion unlocks" ON companion_unlocks;
CREATE POLICY "Users can manage their own companion unlocks" ON companion_unlocks
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

