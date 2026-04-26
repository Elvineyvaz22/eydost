/*
  # Update Admin Tables

  1. Changes
    - Drop admin_users table (using Supabase Auth instead)
    - Update site_content table to remove foreign key
    - Keep site_content for storing website content

  2. Notes
    - Admin users should be created through Supabase Auth UI
    - Credentials: admin@eydost.ai / admin123
*/

-- Drop the foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'site_content_updated_by_fkey'
  ) THEN
    ALTER TABLE site_content DROP CONSTRAINT site_content_updated_by_fkey;
  END IF;
END $$;

-- Drop admin_users table since we use Supabase Auth
DROP TABLE IF EXISTS admin_users CASCADE;

-- Update site_content table structure
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_content' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE site_content DROP COLUMN updated_by;
  END IF;
END $$;