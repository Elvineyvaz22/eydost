-- Migration: Create esim_packages table for daily bot sync
-- This table stores all eSIM packages fetched from bot.eydost.az

CREATE TABLE IF NOT EXISTS public.esim_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL,
    package_code TEXT NOT NULL,
    slug TEXT,
    name TEXT NOT NULL,
    volume_bytes BIGINT NOT NULL DEFAULT 0,
    duration_days INTEGER NOT NULL DEFAULT 1,
    sell_price_minor INTEGER NOT NULL DEFAULT 0,
    currency_code TEXT NOT NULL DEFAULT 'USD',
    is_unlimited BOOLEAN NOT NULL DEFAULT false,
    speed TEXT DEFAULT '4G',
    network_type TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS esim_packages_country_code_idx ON public.esim_packages(country_code);
CREATE INDEX IF NOT EXISTS esim_packages_active_idx ON public.esim_packages(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS esim_packages_country_active_idx ON public.esim_packages(country_code, is_active) WHERE is_active = true;

-- RLS
ALTER TABLE public.esim_packages ENABLE ROW LEVEL SECURITY;

-- Public can read active packages
CREATE POLICY "Public can read active esim packages"
    ON public.esim_packages
    FOR SELECT
    TO anon
    USING (is_active = true);

-- Admin can do everything
CREATE POLICY "Admin full access to esim_packages"
    ON public.esim_packages
    FOR ALL
    TO authenticated
    USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER esim_packages_updated_at
    BEFORE UPDATE ON public.esim_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-set last_synced_at when is_active changes
CREATE OR REPLACE TRIGGER esim_packages_synced_at
    BEFORE INSERT OR UPDATE ON public.esim_packages
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.esim_packages IS 'eSIM packages synced daily from bot.eydost.az';
