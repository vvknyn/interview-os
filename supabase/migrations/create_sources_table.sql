-- Create the sources table
create table public.sources (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  user_id uuid references auth.users null,
  type text not null, -- 'text', 'url', 'file'
  title text not null,
  content text not null,
  constraint sources_pkey primary key (id)
);

-- Enable Row Level Security (RLS)
alter table public.sources enable row level security;

-- Create policies
create policy "Enable read access for all users"
on public.sources for select
to public
using (true);

create policy "Enable insert access for all users"
on public.sources for insert
to public
with check (true);

create policy "Enable delete access for all users"
on public.sources for delete
to public
using (true);
