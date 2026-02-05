-- Add a dedicated JSONB column for provider API keys
-- This is more robust than storing JSON as TEXT in custom_api_key

-- Add new JSONB column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS provider_api_keys JSONB DEFAULT '{}'::jsonb;

-- Migrate existing data from custom_api_key (TEXT) to provider_api_keys (JSONB)
-- Only migrate if custom_api_key looks like valid JSON
UPDATE profiles
SET provider_api_keys = custom_api_key::jsonb
WHERE custom_api_key IS NOT NULL
  AND custom_api_key != ''
  AND custom_api_key LIKE '{%}'
  AND provider_api_keys = '{}'::jsonb;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_provider_api_keys
ON profiles USING gin (provider_api_keys);

-- Comment for documentation
COMMENT ON COLUMN profiles.provider_api_keys IS 'JSON object storing API keys per provider: { groq: "key", gemini: "key", openai: "key" }';
