-- Add visibility column to sources table
ALTER TABLE public.sources ADD COLUMN visibility text NOT NULL DEFAULT 'private'
  CHECK (visibility IN ('private', 'public'));

-- Replace SELECT policy: keep user-scoped + add public access
DROP POLICY IF EXISTS "Users can view own sources" ON public.sources;
CREATE POLICY "Users can view own sources" ON public.sources FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view public sources" ON public.sources FOR SELECT
  USING (visibility = 'public');

-- Index for efficient public source queries
CREATE INDEX idx_sources_visibility ON public.sources(visibility) WHERE visibility = 'public';
