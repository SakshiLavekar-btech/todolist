-- ==========================================================
-- Ledger — Supabase schema
-- DIRECT ACCESS VERSION
-- No Login / No Signup / No user_id
-- ==========================================================

create extension if not exists "pgcrypto";


-- ==========================================================
-- Tasks table
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
-- Index
-- ==========================================================

create index if not exists tasks_created_at_idx
on public.tasks (created_at);


-- ==========================================================
-- Row Level Security
-- ==========================================================
-- Since there is NO authentication, we allow the public
-- application to read/write tasks.
-- ==========================================================

alter table public.tasks enable row level security;


-- Remove old policies if they already exist

drop policy if exists "Users can view their own tasks"
on public.tasks;

drop policy if exists "Users can insert their own tasks"
on public.tasks;

drop policy if exists "Users can update their own tasks"
on public.tasks;

drop policy if exists "Users can delete their own tasks"
on public.tasks;


-- ==========================================================
-- Public access policies
-- ==========================================================

create policy "Anyone can view tasks"
on public.tasks
for select
to anon, authenticated
using (true);


create policy "Anyone can insert tasks"
on public.tasks
for insert
to anon, authenticated
with check (true);


create policy "Anyone can update tasks"
on public.tasks
for update
to anon, authenticated
using (true)
with check (true);


create policy "Anyone can delete tasks"
on public.tasks
for delete
to anon, authenticated
using (true);
