-- Migration: Consolidated Business Logic
-- Date: 2026-01-28
-- Description: Creates views and procedural functions. Idempotent.

-- 1. Views
CREATE OR REPLACE VIEW theme_scores AS
SELECT 
  user_id,
  theme,
  SUM(CASE WHEN outcome = 'POSITIVE' THEN 1 ELSE -0.5 END) as score,
  COUNT(*) as total_interactions
FROM theme_outcomes
GROUP BY user_id, theme;

-- 2. Functions
CREATE OR REPLACE FUNCTION increment_shared_link_views(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE shared_links
  SET current_views = current_views + 1
  WHERE token = p_token
    AND (expires_at IS NULL OR expires_at > now())
    AND current_views < max_views;
END;
$$;

CREATE OR REPLACE FUNCTION get_shared_link_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  resource_id uuid,
  owner_id uuid,
  type text,
  token text,
  max_views integer,
  current_views integer,
  expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id,
    resource_id,
    owner_id,
    type,
    token,
    max_views,
    current_views,
    expires_at,
    created_at,
    updated_at
  FROM shared_links
  WHERE token = p_token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION increment_shared_link_views(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_shared_link_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_shared_link_views(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_shared_link_by_token(text) TO anon, authenticated;

-- 3. Automated Timestamp Triggers (Optional but recommended)
-- Create a generic function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
DROP TRIGGER IF EXISTS update_stories_updated_at ON stories;
CREATE TRIGGER update_stories_updated_at
BEFORE UPDATE ON stories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_golden_moments_updated_at ON golden_moments;
CREATE TRIGGER update_golden_moments_updated_at
BEFORE UPDATE ON golden_moments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shared_links_updated_at ON shared_links;
CREATE TRIGGER update_shared_links_updated_at
BEFORE UPDATE ON shared_links
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
