CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL, -- 'story', 'moment', etc.
    feedback_type TEXT NOT NULL, -- 'flag', 'rating'
    reason TEXT,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'resolved'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
ON public.feedback FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.feedback FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
