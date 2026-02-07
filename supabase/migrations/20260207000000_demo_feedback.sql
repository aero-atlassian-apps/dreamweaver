
-- Create table for storing demo/jury feedback
create table if not exists demo_feedback (
    id uuid primary key default gen_random_uuid(),
    verdict text not null check (verdict in ('approved', 'needs_work')),
    message text,
    context jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

-- Enable RLS
alter table demo_feedback enable row level security;

-- Allow public insert (since demo is unauthenticated)
create policy "Allow public insert to demo_feedback"
    on demo_feedback for insert
    with check (true);

-- Only allow admins to view (service role or authenticated admins)
create policy "Allow admins to view demo_feedback"
    on demo_feedback for select
    using (auth.role() = 'service_role');
