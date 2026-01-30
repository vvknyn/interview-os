-- Create enum for application status
create type application_status as enum ('applied', 'interviewing', 'offer', 'rejected', 'withdrawn');

-- Create applications table
create table if not exists public.applications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    company_name text not null,
    position text not null,
    job_url text,
    applied_at timestamp with time zone,
    status application_status default 'applied' not null,
    resume_version_id uuid references public.tailored_resumes(id) on delete set null,
    cover_letter text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.applications enable row level security;

-- Create policies
create policy "Users can view own applications"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "Users can insert own applications"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own applications"
  on public.applications for update
  using (auth.uid() = user_id);

create policy "Users can delete own applications"
  on public.applications for delete
  using (auth.uid() = user_id);

-- Create indexes
create index if not exists applications_user_id_idx on public.applications(user_id);
create index if not exists applications_created_at_idx on public.applications(created_at desc);
