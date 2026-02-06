-- Secure Worker Authentication Migration
-- 1. Create a dedicated role for the worker if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dreamweaver_worker') THEN
    CREATE ROLE dreamweaver_worker NOLOGIN;
  END IF;
END
$$;

-- 2. Grant usage on schema public (usually default, but good to be explicit for custom roles)
GRANT USAGE ON SCHEMA public TO dreamweaver_worker;

-- 3. Grant execute on the specific RPC
GRANT EXECUTE ON FUNCTION consume_ws_ticket(text) TO dreamweaver_worker;

-- REMINDER for User:
-- You must generate a JWT signed with your project's JWT Secret with the payload:
-- { "role": "dreamweaver_worker" }
-- Set this as SUPABASE_WORKER_TOKEN in your worker environment.
