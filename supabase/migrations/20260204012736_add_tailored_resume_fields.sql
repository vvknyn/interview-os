-- Add missing fields to tailored_resumes table to prevent data loss
-- These fields store the complete resume snapshot including profile (name, contact) and education

ALTER TABLE tailored_resumes 
ADD COLUMN IF NOT EXISTS original_profile JSONB,
ADD COLUMN IF NOT EXISTS original_education JSONB,
ADD COLUMN IF NOT EXISTS section_order TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN tailored_resumes.original_profile IS 'Stores the complete profile data (name, email, phone, location, etc.) from the original resume';
COMMENT ON COLUMN tailored_resumes.original_education IS 'Stores education entries from the original resume';
COMMENT ON COLUMN tailored_resumes.section_order IS 'Custom section ordering if user has manually reordered sections';
