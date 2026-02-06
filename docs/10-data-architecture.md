# 10. Data Architecture

## Entity Model

```
┌──────────────────┐       ┌──────────────────┐
│      User        │       │     Profile      │
├──────────────────┤       ├──────────────────┤
│ id (UUID)        │───────│ id (UUID)        │
│ email            │       │ user_id (FK)     │
│ created_at       │       │ display_name     │
└──────────────────┘       │ role (parent/child)│
                           │ settings (JSONB) │
                           └──────────────────┘
                                    │
                                    │ 1:N
                                    ▼
┌──────────────────┐       ┌──────────────────┐
│     Story        │       │   GoldenMoment   │
├──────────────────┤       ├──────────────────┤
│ id (UUID)        │───────│ id (UUID)        │
│ profile_id (FK)  │       │ story_id (FK)    │
│ title            │       │ type             │
│ content          │       │ transcript       │
│ audio_url        │       │ audio_url        │
│ theme            │       │ detected_at      │
│ duration         │       │ metadata (JSONB) │
│ status           │       └──────────────────┘
│ created_at       │
└──────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐       ┌──────────────────┐
│   SharedLink     │       │   WsTicket       │
├──────────────────┤       ├──────────────────┤
│ id (UUID)        │       │ ticket (UUID)    │
│ story_id (FK)    │       │ user_id (FK)     │
│ token            │       │ consumed_at      │
│ expires_at       │       │ expires_at       │
│ view_count       │       └──────────────────┘
│ max_views        │
└──────────────────┘
```

---

## Key Tables

### stories

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `profile_id` | UUID | FK to profiles |
| `title` | TEXT | Story title |
| `content` | TEXT | Story content |
| `audio_url` | TEXT | Optional TTS audio |
| `theme` | TEXT | Theme category |
| `duration` | INT | Duration in seconds |
| `status` | ENUM | draft, generating, completed |
| `created_at` | TIMESTAMP | Creation time |

### golden_moments

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `story_id` | UUID | FK to stories |
| `type` | TEXT | question, milestone, emotion |
| `transcript` | TEXT | Child's words |
| `audio_url` | TEXT | Voice recording |
| `detected_at` | TIMESTAMP | Detection time |
| `metadata` | JSONB | Additional data |

### shared_links

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `story_id` | UUID | FK to stories |
| `token` | TEXT | Magic link token |
| `expires_at` | TIMESTAMP | 48h from creation |
| `view_count` | INT | Current views |
| `max_views` | INT | Default 3 |

---

## Security (RLS)

All tables use Row-Level Security:

```sql
-- Users can only see their own stories
CREATE POLICY "Users see own stories" ON stories
  FOR SELECT USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );
```

---

## Indexes

```sql
CREATE INDEX idx_stories_profile_id ON stories(profile_id);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_moments_story_id ON golden_moments(story_id);
CREATE INDEX idx_shared_token ON shared_links(token);
```
