-- Add ON DELETE CASCADE to stories and sources foreign keys
-- This ensures all user data is cleaned up when an auth user is deleted

-- Fix stories.user_id: drop and recreate with CASCADE
alter table public.stories
  drop constraint if exists stories_user_id_fkey;

alter table public.stories
  add constraint stories_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- Fix sources.user_id: drop and recreate with CASCADE
alter table public.sources
  drop constraint if exists sources_user_id_fkey;

alter table public.sources
  add constraint sources_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;
