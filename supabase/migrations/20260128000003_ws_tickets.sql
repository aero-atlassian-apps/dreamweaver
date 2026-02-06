CREATE TABLE IF NOT EXISTS ws_tickets (
  ticket text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ws_tickets ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ws_tickets_expires_at ON ws_tickets (expires_at);
CREATE INDEX IF NOT EXISTS idx_ws_tickets_user_id ON ws_tickets (user_id);

CREATE OR REPLACE FUNCTION consume_ws_ticket(p_ticket text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  UPDATE ws_tickets
  SET consumed_at = now()
  WHERE ticket = p_ticket
    AND consumed_at IS NULL
    AND expires_at > now()
  RETURNING user_id INTO v_user_id;

  RETURN v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION consume_ws_ticket(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_ws_ticket(text) TO service_role;
