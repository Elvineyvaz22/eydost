-- Migration: Fix esim_packages unique constraints
--
-- Original schema had a global UNIQUE on `package_code`, which is wrong:
-- different countries can legitimately share an eSIM package code (regional
-- and global plans, in particular). That made the parallel sync drop ~46
-- countries (Türkiyə daxil) because their packages collided with rows
-- inserted seconds earlier from another country in the same batch.
--
-- Fix: drop the global unique, add a compound unique on (country_code,
-- package_code) so the daily Vercel cron can use ON CONFLICT for fast,
-- conflict-safe upserts.

ALTER TABLE public.esim_packages
  DROP CONSTRAINT IF EXISTS esim_packages_package_code_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'esim_packages_country_package_unique'
      AND conrelid = 'public.esim_packages'::regclass
  ) THEN
    ALTER TABLE public.esim_packages
      ADD CONSTRAINT esim_packages_country_package_unique
      UNIQUE (country_code, package_code);
  END IF;
END$$;
