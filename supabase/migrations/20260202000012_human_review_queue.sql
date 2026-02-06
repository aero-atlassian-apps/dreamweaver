-- Human Review Queue (GKD stage 3)

CREATE TABLE IF NOT EXISTS human_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type TEXT NOT NULL,
    item_content JSONB NOT NULL,
    item_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    reason TEXT NOT NULL,
    confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_human_review_queue_status_created ON human_review_queue(status, created_at DESC);

ALTER TABLE human_review_queue ENABLE ROW LEVEL SECURITY;

