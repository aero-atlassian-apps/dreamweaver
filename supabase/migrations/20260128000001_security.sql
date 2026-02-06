-- Migration: Consolidated Security Policies
-- Date: 2026-01-28
-- Description: Enforces RLS and defines access control policies for all tables.

-- 1. Enable RLS on all tables
ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE preference_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE golden_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_events ENABLE ROW LEVEL SECURITY;

-- 2. Define Policies (Drop then Create for idempotency)

-- agent_memories
DROP POLICY IF EXISTS "Users can only manage their own memories" ON agent_memories;
CREATE POLICY "Users can only manage their own memories" ON agent_memories
    FOR ALL USING (auth.uid() = user_id);

-- theme_outcomes
DROP POLICY IF EXISTS "Users can only manage their own outcomes" ON theme_outcomes;
CREATE POLICY "Users can only manage their own outcomes" ON theme_outcomes
    FOR ALL USING (auth.uid() = user_id);

-- families
DROP POLICY IF EXISTS "Users can view their own families" ON families;
CREATE POLICY "Users can view their own families" ON families
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM family_members
            WHERE family_members.family_id = families.id
            AND family_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create families" ON families;
CREATE POLICY "Users can create families" ON families
    FOR INSERT WITH CHECK (true);

-- family_members
DROP POLICY IF EXISTS "Members can view family members" ON family_members;
CREATE POLICY "Members can view family members" ON family_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM family_members AS my_membership
            WHERE my_membership.family_id = family_members.family_id
            AND my_membership.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can join families" ON family_members;
CREATE POLICY "Users can join families" ON family_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- user_preferences
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- preference_pairs
DROP POLICY IF EXISTS "Users can manage their own preference signals" ON preference_pairs;
CREATE POLICY "Users can manage their own preference signals" ON preference_pairs
    FOR ALL USING (auth.uid() = user_id);

-- stories
DROP POLICY IF EXISTS "Users can manage their own stories" ON stories;
CREATE POLICY "Users can manage their own stories" ON stories
    FOR ALL USING (auth.uid() = user_id);

-- golden_moments
DROP POLICY IF EXISTS "Users can manage their own moments" ON golden_moments;
CREATE POLICY "Users can manage their own moments" ON golden_moments
    FOR ALL USING (auth.uid() = user_id);

-- shared_links
DROP POLICY IF EXISTS "Public can view shared links via token" ON shared_links;
DROP POLICY IF EXISTS "Users can manage their own shared links" ON shared_links;
CREATE POLICY "Users can manage their own shared links" ON shared_links
    FOR ALL USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- domain_events
DROP POLICY IF EXISTS "Users can view their own events" ON domain_events;
CREATE POLICY "Users can view their own events" ON domain_events
    FOR SELECT USING (auth.uid() = user_id);
