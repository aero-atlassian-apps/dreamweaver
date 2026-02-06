CREATE OR REPLACE FUNCTION increment_shared_link_views(p_token TEXT)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  UPDATE shared_links
  SET current_views = current_views + 1,
      updated_at = now()
  WHERE token = p_token
    AND expires_at > now()
    AND current_views < max_views;
END;
$$ LANGUAGE plpgsql;

