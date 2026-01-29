-- Create table for storing job posting analyses
create table if not exists public.job_analyses (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    job_url text,
    job_text text not null,
    company_name text,
    position_title text,
    extracted_requirements jsonb, -- Array of requirements
    extracted_skills jsonb, -- Array of skills
    culture_indicators jsonb, -- Array of culture/values
    seniority_level text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create table for storing tailored resume versions
create table if not exists public.tailored_resumes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    job_analysis_id uuid references public.job_analyses(id) on delete cascade,
    version_name text not null,
    
    -- Original resume data (snapshot)
    original_summary text,
    original_experience jsonb,
    original_competencies jsonb,
    
    -- Tailored content
    tailored_summary text,
    tailored_experience jsonb,
    tailored_competencies jsonb,
    
    -- AI recommendations (for reference/iteration)
    recommendations jsonb,
    
    -- Metadata
    company_name text,
    position_title text,
    applied_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.job_analyses enable row level security;
alter table public.tailored_resumes enable row level security;

-- RLS Policies for job_analyses
create policy "Users can view own job analyses"
on public.job_analyses for select
using (auth.uid() = user_id);

create policy "Users can insert own job analyses"
on public.job_analyses for insert
with check (auth.uid() = user_id);

create policy "Users can update own job analyses"
on public.job_analyses for update
using (auth.uid() = user_id);

create policy "Users can delete own job analyses"
on public.job_analyses for delete
using (auth.uid() = user_id);

-- RLS Policies for tailored_resumes
create policy "Users can view own tailored resumes"
on public.tailored_resumes for select
using (auth.uid() = user_id);

create policy "Users can insert own tailored resumes"
on public.tailored_resumes for insert
with check (auth.uid() = user_id);

create policy "Users can update own tailored resumes"
on public.tailored_resumes for update
using (auth.uid() = user_id);

create policy "Users can delete own tailored resumes"
on public.tailored_resumes for delete
using (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists job_analyses_user_id_idx on public.job_analyses(user_id);
create index if not exists job_analyses_created_at_idx on public.job_analyses(created_at desc);
create index if not exists tailored_resumes_user_id_idx on public.tailored_resumes(user_id);
create index if not exists tailored_resumes_job_analysis_id_idx on public.tailored_resumes(job_analysis_id);
create index if not exists tailored_resumes_created_at_idx on public.tailored_resumes(created_at desc);
