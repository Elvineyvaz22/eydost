/*
  Per-link taxi order history and favorite addresses.
*/

CREATE TABLE IF NOT EXISTS taxi_link_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id text NOT NULL,
  pickup_address text NOT NULL DEFAULT '',
  dropoff_address text NOT NULL DEFAULT '',
  pickup_lat double precision,
  pickup_lng double precision,
  dropoff_lat double precision,
  dropoff_lng double precision,
  status text NOT NULL DEFAULT 'saved',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_taxi_link_orders_link_created
  ON taxi_link_orders (link_id, created_at DESC);

CREATE TABLE IF NOT EXISTS taxi_link_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id text NOT NULL,
  label text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  lat double precision,
  lng double precision,
  kind text NOT NULL DEFAULT 'other'
    CHECK (kind IN ('home', 'work', 'pickup', 'dropoff', 'other')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_taxi_link_favorites_link
  ON taxi_link_favorites (link_id, created_at DESC);

ALTER TABLE taxi_link_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxi_link_favorites ENABLE ROW LEVEL SECURITY;
