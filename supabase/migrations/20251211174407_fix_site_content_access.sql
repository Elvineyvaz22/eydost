/*
  # Fix site_content table access for public users

  1. Changes
    - Drop existing restrictive policies
    - Add public read access policy for site_content
    - Maintain write restrictions for authenticated users only
  
  2. Security
    - Public users can read all site content
    - Only authenticated users can modify content
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON site_content;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON site_content;

-- Allow anyone to read site content (for public website display)
CREATE POLICY "Allow public read access"
  ON site_content
  FOR SELECT
  USING (true);

-- Only authenticated users can update content (admin panel)
CREATE POLICY "Allow authenticated users to update"
  ON site_content
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can insert content
CREATE POLICY "Allow authenticated users to insert"
  ON site_content
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can delete content
CREATE POLICY "Allow authenticated users to delete"
  ON site_content
  FOR DELETE
  TO authenticated
  USING (true);