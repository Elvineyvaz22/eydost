CREATE TABLE IF NOT EXISTS public.partner_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  company_name text NOT NULL DEFAULT '',
  email text NOT NULL,
  whatsapp text NOT NULL DEFAULT '',
  partner_type text NOT NULL DEFAULT 'agency',
  monthly_clients text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit partner applications"
  ON public.partner_applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view partner applications"
  ON public.partner_applications
  FOR SELECT
  TO authenticated
  USING (true);
