-- Ensure eSIM sync upserts target one row per country/package.
CREATE UNIQUE INDEX IF NOT EXISTS esim_packages_country_package_code_key
    ON public.esim_packages (country_code, package_code);
