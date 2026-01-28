-- Lock down stories table
-- First, drop existing policies to avoid conflicts
drop policy if exists "Enable read access for all users" on public.stories;
drop policy if exists "Enable insert access for all users" on public.stories;
drop policy if exists "Enable update access for all users" on public.stories;
drop policy if exists "Enable delete access for all users" on public.stories;

-- Enable RLS (just to be safe, though already enabled)
alter table public.stories enable row level security;

-- Create restrictive policies
create policy "Users can view own stories"
on public.stories for select
using (auth.uid() = user_id);

create policy "Users can insert own stories"
on public.stories for insert
with check (auth.uid() = user_id);

create policy "Users can update own stories"
on public.stories for update
using (auth.uid() = user_id);

create policy "Users can delete own stories"
on public.stories for delete
using (auth.uid() = user_id);

-- Add resume to profiles
alter table public.profiles add column if not exists resume_text text;
