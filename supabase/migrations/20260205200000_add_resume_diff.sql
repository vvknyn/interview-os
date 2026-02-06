-- Add resume_diff column to store git-like diffs instead of full copies
-- This dramatically reduces storage size and makes version control more efficient

ALTER TABLE tailored_resumes 
ADD COLUMN IF NOT EXISTS resume_diff JSONB,
ADD COLUMN IF NOT EXISTS base_resume_id TEXT;

-- Add comments
COMMENT ON COLUMN tailored_resumes.resume_diff IS 'Git-like diff containing only the changes between base and this version';
COMMENT ON COLUMN tailored_resumes.base_resume_id IS 'ID of the base resume this version is derived from (for diff chain)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tailored_resumes_base_id ON tailored_resumes(base_resume_id);
