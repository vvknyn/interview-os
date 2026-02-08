-- Admin flag on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Feature flags table (single-row config)
CREATE TABLE IF NOT EXISTS public.app_config (
    id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- singleton row
    show_donation boolean NOT NULL DEFAULT false,
    donation_url text DEFAULT '',
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read config (public feature flags)
CREATE POLICY "Anyone can read app config" ON public.app_config FOR SELECT USING (true);
-- Only admins can update
CREATE POLICY "Admins can update app config" ON public.app_config FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can insert app config" ON public.app_config FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Seed the singleton row
INSERT INTO public.app_config (id, show_donation, donation_url)
VALUES (1, false, '')
ON CONFLICT (id) DO NOTHING;
