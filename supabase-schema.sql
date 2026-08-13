-- ==========================================================
-- LEDGER — FINAL SUPABASE SCHEMA
-- Direct Access Version
-- No Login / No Signup / No user_id
-- ==========================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";


-- ==========================================================
-- TASKS TABLE
-- ==========================================================

create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),

    title text not null,

    priority text not null default 'medium'
        check (priority in ('high', 'medium', 'low')),

    due_date date,

    completed boolean not null default false,

    created_at timestamptz not null default now()
);


-- ==========================================================
-- REMOVE OLD AUTH COLUMN
-- ==========================================================

alter table public.tasks
drop column if exists user_id;


-- ==========================================================
-- INDEX
-- ==========================================================

create index if not exists tasks_created_at_idx
on public.tasks (created_at);


-- ==========================================================
-- ROW LEVEL SECURITY
-- ==========================================================

alter table public.tasks enable row level security;


-- ==========================================================
-- REMOVE OLD POLICIES
-- ==========================================================

drop policy if exists "Users can view their own tasks"
on public.tasks;

drop policy if exists "Users can insert their own tasks"
on public.tasks;

drop policy if exists "Users can update their own tasks"
on public.tasks;

drop policy if exists "Users can delete their own tasks"
on public.tasks;

drop policy if exists "Anyone can view tasks"
on public.tasks;

drop policy if exists "Anyone can insert tasks"
on public.tasks;

drop policy if exists "Anyone can update tasks"
on public.tasks;

drop policy if exists "Anyone can delete tasks"
on public.tasks;


-- ==========================================================
-- PUBLIC SELECT
-- ==========================================================

create policy "Anyone can view tasks"
on public.tasks
for select
to anon, authenticated
using (true);


-- ==========================================================
-- PUBLIC INSERT
-- ==========================================================

create policy "Anyone can insert tasks"
on public.tasks
for insert
to anon, authenticated
with check (true);


-- ==========================================================
-- PUBLIC UPDATE
-- ==========================================================

create policy "Anyone can update tasks"
on public.tasks
for update
to anon, authenticated
using (true)
with check (true);


-- ==========================================================
-- PUBLIC DELETE
-- ==========================================================

create policy "Anyone can delete tasks"
on public.tasks
for delete
to anon, authenticated
using (true);


-- ==========================================================
-- FINAL TABLE
--
-- id          → UUID
-- title       → TEXT
-- priority    → high / medium / low
-- due_date    → DATE
-- completed   → BOOLEAN
-- created_at  → TIMESTAMPTZ
--
-- No authentication.
-- No user_id.
-- ==========================================================
