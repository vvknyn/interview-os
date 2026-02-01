-- Add structured resume data to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS resume_data jsonb,
ADD COLUMN IF NOT EXISTS resume_import_source text,
ADD COLUMN IF NOT EXISTS resume_import_confidence numeric,
ADD COLUMN IF NOT EXISTS resume_last_updated timestamp with time zone;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_profiles_resume_data ON public.profiles USING gin(resume_data);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.resume_data IS 'Structured resume data (profile, experience, competencies, education, summary)';
COMMENT ON COLUMN public.profiles.resume_import_source IS 'Source of last import: pdf, docx, text, or manual';
COMMENT ON COLUMN public.profiles.resume_import_confidence IS 'AI parsing confidence score (0-100)';
COMMENT ON COLUMN public.profiles.resume_last_updated IS 'Timestamp of last resume update';
