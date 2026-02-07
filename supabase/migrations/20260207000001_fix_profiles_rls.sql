-- Fix profiles table RLS: restrict SELECT to own profile only
-- Previously had USING (true) which exposed all user data including
-- resume_data, resume_text, provider_api_keys, username, custom_api_key

-- Drop the open SELECT policy
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;

-- Create user-scoped SELECT policy
create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);
