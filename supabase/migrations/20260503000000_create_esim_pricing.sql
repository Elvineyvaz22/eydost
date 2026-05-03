-- Create esim_pricing table
CREATE TABLE IF NOT EXISTS public.esim_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL CHECK (target_type IN ('global', 'region', 'country', 'package')),
    target_id TEXT, -- region name, country code (ISO), or package code
    margin FLOAT DEFAULT 1.75,
    fixed_price INTEGER, -- in smallest currency units (10000 = $1.00)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure target_id is present for non-global rules
    CONSTRAINT target_id_required CHECK (
        (target_type = 'global' AND target_id IS NULL) OR 
        (target_type != 'global' AND target_id IS NOT NULL)
    ),
    
    -- Nullable target_id means global uniqueness is enforced by partial indexes below.
    UNIQUE(target_type, target_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS esim_pricing_one_global_rule
    ON public.esim_pricing (target_type)
    WHERE target_type = 'global';

CREATE UNIQUE INDEX IF NOT EXISTS esim_pricing_unique_target_rule
    ON public.esim_pricing (target_type, target_id)
    WHERE target_type != 'global';

-- Enable RLS
ALTER TABLE public.esim_pricing ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access for active pricing" ON public.esim_pricing
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin full access" ON public.esim_pricing
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert default global margin
INSERT INTO public.esim_pricing (target_type, margin)
VALUES ('global', 1.75)
ON CONFLICT (target_type, target_id) DO NOTHING;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_esim_pricing_updated_at
    BEFORE UPDATE ON public.esim_pricing
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
