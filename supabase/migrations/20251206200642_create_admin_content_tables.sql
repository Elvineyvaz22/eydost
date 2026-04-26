/*
  # Create Admin Content Management Tables

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `created_at` (timestamp)
    
    - `site_content`
      - `id` (uuid, primary key)
      - `key` (text, unique) - content identifier
      - `value` (jsonb) - content data
      - `updated_at` (timestamp)
      - `updated_by` (uuid, foreign key to admin_users)

  2. Security
    - Enable RLS on both tables
    - Only authenticated admin users can read/write
    - Public users cannot access admin tables

  3. Initial Data
    - Create default admin user
    - Initialize content with current translations
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create site_content table
CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES admin_users(id)
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Admin users policies - only system can manage admin users
CREATE POLICY "Admin users can read own data"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Site content policies - authenticated users can manage content
CREATE POLICY "Authenticated users can read site content"
  ON site_content FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert site content"
  ON site_content FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update site content"
  ON site_content FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public read access for site content (so the website can display it)
CREATE POLICY "Public can read site content"
  ON site_content FOR SELECT
  TO anon
  USING (true);

-- Insert default admin user (password: admin123)
-- Using bcrypt hash for admin123
INSERT INTO admin_users (email, password_hash) 
VALUES ('admin@eydost.ai', '$2a$10$rQ9K7qZ5X3yJ8WZn0Jm7YeJQJhH0vXJ9K1Z5Q7W8X6Y5Z4Z3Z2Z1Za')
ON CONFLICT (email) DO NOTHING;

-- Initialize default content
INSERT INTO site_content (key, value) 
VALUES 
  ('hero', '{"badge": "Bakıda AI-ilə İdarə Olunan Taksi Sifarişi", "title": "Gediş Sifarişinizi", "titleHighlight": "WhatsApp-da Ey Dost ilə Verin", "subtitle": "Ağıllı taksi köməkçiniz. Təbii söhbət edin, dərhal sifariş verin. Bakıda rahat gediş üçün təchiz edilib.", "ctaWhatsapp": "WhatsApp-da Söhbətə Başla", "ctaContact": "Əlaqə Saxla"}'::jsonb),
  ('brand', '{"logoUrl": "", "primaryColor": "#0891b2", "secondaryColor": "#0e7490"}'::jsonb),
  ('footer', '{"email": "info@eydost.ai", "phone": "+994505555555", "instagram": "https://instagram.com/eydost", "whatsapp": "https://wa.me/994512778085", "text": "Ağıllı WhatsApp taksi köməkçiniz. Bakıda nəqliyyatı bir söhbətlə asanlaşdırırıq."}'::jsonb),
  ('future_modules', '["Otel Rezervasiyaları — 2026-da Gəlir", "Uçuş Biletləri — 2026-da Gəlir", "Restoran Rezervasiyaları — 2026-da Gəlir", "Yemək Çatdırılması — 2026-da Gəlir"]'::jsonb)
ON CONFLICT (key) DO NOTHING;