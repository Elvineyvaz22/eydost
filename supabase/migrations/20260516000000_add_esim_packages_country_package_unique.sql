-- Ensure sync upserts can safely target a package within a country.
-- Keep the newest row if earlier sync attempts created duplicate keys.
WITH ranked AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY country_code, package_code
            ORDER BY is_active DESC, last_synced_at DESC, updated_at DESC, created_at DESC, id DESC
        ) AS rn
    FROM public.esim_packages
)
DELETE FROM public.esim_packages p
USING ranked r
WHERE p.id = r.id
  AND r.rn > 1;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'esim_packages_country_package_code_key'
          AND conrelid = 'public.esim_packages'::regclass
    ) THEN
        ALTER TABLE public.esim_packages
            ADD CONSTRAINT esim_packages_country_package_code_key
            UNIQUE (country_code, package_code);
    END IF;
END $$;
