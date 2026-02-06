-- Migration: Add interview prep server-side cache
-- Reduces API costs by caching interview preparation data

CREATE TABLE IF NOT EXISTS interview_prep_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  company TEXT NOT NULL,
  position TEXT NOT NULL,
  round TEXT NOT NULL,
  
  -- Cached interview data
  recon_data JSONB,
  match_data JSONB,
  questions_data JSONB,
  reverse_data JSONB,
  technical_data JSONB,
  coding_challenge JSONB,
  system_design_data JSONB,
  resume_companies TEXT[],
  
  -- Metadata
  has_resume_context BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  CONSTRAINT unique_user_cache_key UNIQUE(user_id, cache_key)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_cache_lookup 
  ON interview_prep_cache(user_id, cache_key, expires_at);

-- Index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_cache_expiry 
  ON interview_prep_cache(expires_at);

-- Row Level Security
ALTER TABLE interview_prep_cache ENABLE ROW LEVEL SECURITY;

-- Users can only access their own cache
CREATE POLICY "Users can read own cache" 
  ON interview_prep_cache FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cache" 
  ON interview_prep_cache FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cache" 
  ON interview_prep_cache FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cache" 
  ON interview_prep_cache FOR DELETE 
  USING (auth.uid() = user_id);

-- Function to automatically clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM interview_prep_cache
  WHERE expires_at < NOW();
END;
$$;

-- Optional: Set up a scheduled job to run cleanup daily
-- (Requires pg_cron extension, uncomment if available)
-- SELECT cron.schedule(
--   'cleanup-expired-cache',
--   '0 2 * * *', -- Run at 2 AM daily
--   $$SELECT cleanup_expired_cache()$$
-- );

COMMENT ON TABLE interview_prep_cache IS 'Server-side cache for interview preparation data to reduce API costs';
COMMENT ON COLUMN interview_prep_cache.cache_key IS 'Hash of company+position+round for quick lookups';
COMMENT ON COLUMN interview_prep_cache.expires_at IS 'TTL for cache entry, default 24 hours from creation';
