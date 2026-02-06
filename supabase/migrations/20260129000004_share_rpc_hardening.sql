REVOKE ALL ON FUNCTION increment_shared_link_views(text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION get_shared_link_by_token(text) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION increment_shared_link_views(text) TO service_role;
GRANT EXECUTE ON FUNCTION get_shared_link_by_token(text) TO service_role;
