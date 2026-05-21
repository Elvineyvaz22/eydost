-- Ensure cron sync upserts can target one row per country/package pair.
-- Keep the newest active row if older duplicate rows exist from prior sync attempts.

WITH ranked_packages AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY country_code, package_code
            ORDER BY is_active DESC, last_synced_at DESC, updated_at DESC, created_at DESC, id DESC
        ) AS row_number
    FROM public.esim_packages
)
DELETE FROM public.esim_packages
WHERE id IN (
    SELECT id
    FROM ranked_packages
    WHERE row_number > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS esim_packages_country_package_code_key
    ON public.esim_packages(country_code, package_code);
