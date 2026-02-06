-- Migration: Add trace correlation fields
-- Date: 2026-01-30
-- Description: Adds trace_id to domain_events for end-to-end correlation. Idempotent.

ALTER TABLE IF EXISTS domain_events
ADD COLUMN IF NOT EXISTS trace_id text;

CREATE INDEX IF NOT EXISTS idx_domain_events_trace_id ON domain_events(trace_id);

