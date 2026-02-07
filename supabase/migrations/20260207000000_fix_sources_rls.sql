-- Fix sources table RLS: restrict to user-scoped access
-- Previously had USING (true) which allowed any authenticated user to read all sources

-- Drop existing open policies
drop policy if exists "Enable read access for all users" on public.sources;
drop policy if exists "Enable insert access for all users" on public.sources;
drop policy if exists "Enable delete access for all users" on public.sources;

-- Ensure RLS is enabled
alter table public.sources enable row level security;

-- Create user-scoped policies
create policy "Users can view own sources"
on public.sources for select
using (auth.uid() = user_id);

create policy "Users can insert own sources"
on public.sources for insert
with check (auth.uid() = user_id);

create policy "Users can update own sources"
on public.sources for update
using (auth.uid() = user_id);

create policy "Users can delete own sources"
on public.sources for delete
using (auth.uid() = user_id);
