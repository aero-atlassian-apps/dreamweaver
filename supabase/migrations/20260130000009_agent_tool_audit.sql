-- Migration: Agent tool audit log
-- Date: 2026-01-30
-- Description: Append-only audit trail for live tool executions. Idempotent.

CREATE TABLE IF NOT EXISTS agent_tool_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    occurred_at timestamptz NOT NULL DEFAULT now(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id text NOT NULL,
    request_id text,
    trace_id text,
    tool_name text NOT NULL,
    tool_call_id text,
    allowed boolean NOT NULL DEFAULT true,
    args jsonb NOT NULL DEFAULT '{}'::jsonb,
    result jsonb,
    error text,
    args_hash text,
    result_hash text
);

ALTER TABLE agent_tool_audit ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_agent_tool_audit_user_id ON agent_tool_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_tool_audit_session_id ON agent_tool_audit(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_tool_audit_occurred_at ON agent_tool_audit(occurred_at);
CREATE INDEX IF NOT EXISTS idx_agent_tool_audit_trace_id ON agent_tool_audit(trace_id);

