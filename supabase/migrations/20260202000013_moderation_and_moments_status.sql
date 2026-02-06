-- Moderation tables and content blocking

ALTER TABLE golden_moments
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked'));

CREATE INDEX IF NOT EXISTS idx_golden_moments_status ON golden_moments(status);

CREATE TABLE IF NOT EXISTS moderation_blocks (
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT,
    notes TEXT,
    blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (content_type, content_id)
);

ALTER TABLE moderation_blocks ENABLE ROW LEVEL SECURITY;

