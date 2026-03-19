-- Supported Countries for Phone Number Search
-- Admin-manageable list of countries for dynamic phone number provisioning

CREATE TABLE IF NOT EXISTS public.supported_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- ISO 3166-1 alpha-2 (e.g., 'US', 'CA', 'GB')
  name TEXT NOT NULL,
  dial_code TEXT NOT NULL, -- e.g., '+1', '+44'
  flag_emoji TEXT, -- e.g., '🇺🇸'
  is_active BOOLEAN NOT NULL DEFAULT true,
  supports_local BOOLEAN NOT NULL DEFAULT true,
  supports_toll_free BOOLEAN NOT NULL DEFAULT false,
  supports_mobile BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supported_countries ENABLE ROW LEVEL SECURITY;

-- Public read access for active countries
CREATE POLICY "Active countries are viewable by everyone" ON public.supported_countries
  FOR SELECT USING (is_active = true);

-- Admin can manage countries
CREATE POLICY "Admins can manage countries" ON public.supported_countries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS supported_countries_active_idx ON public.supported_countries(is_active, sort_order);
CREATE INDEX IF NOT EXISTS supported_countries_code_idx ON public.supported_countries(code);

-- Seed default countries
INSERT INTO public.supported_countries (code, name, dial_code, flag_emoji, is_active, supports_local, supports_toll_free, sort_order) VALUES
  ('US', 'United States', '+1', '🇺🇸', true, true, true, 1),
  ('CA', 'Canada', '+1', '🇨🇦', true, true, true, 2),
  ('GB', 'United Kingdom', '+44', '🇬🇧', true, true, false, 3),
  ('AU', 'Australia', '+61', '🇦🇺', true, true, false, 4),
  ('DE', 'Germany', '+49', '🇩🇪', false, true, false, 5),
  ('FR', 'France', '+33', '🇫🇷', false, true, false, 6)
ON CONFLICT (code) DO NOTHING;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_supported_countries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_supported_countries_updated_at ON public.supported_countries;
CREATE TRIGGER set_supported_countries_updated_at
  BEFORE UPDATE ON public.supported_countries
  FOR EACH ROW EXECUTE FUNCTION update_supported_countries_updated_at();
