/*
  Per-customer taxi link session (secret link_id from Taxibooker bot).
  Access from the web app goes through /api/taxi-session (service role), not anon RLS.
*/

CREATE TABLE IF NOT EXISTS taxi_link_sessions (
  link_id text PRIMARY KEY,
  wa_id text,
  pickup_address text DEFAULT '',
  dropoff_address text DEFAULT '',
  pickup_lat double precision,
  pickup_lng double precision,
  dropoff_lat double precision,
  dropoff_lng double precision,
  pickup_country_code text,
  step text DEFAULT 'select_pickup'
    CHECK (step IN ('select_pickup', 'select_dropoff', 'confirm_ride')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_taxi_link_sessions_updated_at
  ON taxi_link_sessions (updated_at DESC);

ALTER TABLE taxi_link_sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_taxi_link_sessions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_taxi_link_sessions_updated_at ON taxi_link_sessions;
CREATE TRIGGER trg_taxi_link_sessions_updated_at
  BEFORE UPDATE ON taxi_link_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_taxi_link_sessions_updated_at();
