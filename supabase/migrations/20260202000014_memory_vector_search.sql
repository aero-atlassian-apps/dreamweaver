-- Memory semantic search support (pgvector)

CREATE INDEX IF NOT EXISTS idx_agent_memories_embedding_cosine
ON agent_memories
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE OR REPLACE FUNCTION match_memories(
    query_embedding vector(1536),
    match_user_id uuid,
    match_count int
)
RETURNS TABLE (
    id uuid,
    type text,
    content text,
    confidence double precision,
    metadata jsonb,
    created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        m.id,
        m.type,
        m.content,
        m.confidence,
        m.metadata,
        m.created_at
    FROM agent_memories m
    WHERE m.user_id = match_user_id
      AND m.embedding IS NOT NULL
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
$$;

