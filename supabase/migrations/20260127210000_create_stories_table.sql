-- Create the stories table
create table public.stories (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  title text not null,
  content text not null,
  user_id uuid references auth.users null,
  constraint stories_pkey primary key (id)
);

-- Enable Row Level Security (RLS)
alter table public.stories enable row level security;

-- Create policies (start with public access for simplicity, can be tightened later)
create policy "Enable read access for all users"
on public.stories for select
to public
using (true);

create policy "Enable insert access for all users"
on public.stories for insert
to public
with check (true);
