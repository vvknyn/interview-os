-- Add job_description column to applications table
alter table public.applications 
add column if not exists job_description text;
