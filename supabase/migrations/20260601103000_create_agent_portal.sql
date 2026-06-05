create extension if not exists pgcrypto;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.partner_applications(id) on delete set null,
  full_name text not null,
  company_name text not null,
  email text not null unique,
  whatsapp text,
  partner_type text not null default 'agency',
  referral_code text not null unique,
  access_code text not null,
  commission_rate numeric(5, 2) not null default 10.00,
  status text not null default 'active' check (status in ('active', 'paused', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_referrals (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  customer_name text,
  customer_contact text,
  product_type text not null default 'esim' check (product_type in ('esim', 'taxi', 'other')),
  order_reference text,
  sale_amount numeric(10, 2) not null default 0,
  commission_amount numeric(10, 2) not null default 0,
  status text not null default 'lead' check (status in ('lead', 'confirmed', 'paid', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agents_referral_code_idx on public.agents(referral_code);
create index if not exists agent_referrals_agent_id_idx on public.agent_referrals(agent_id);

alter table public.agents enable row level security;
alter table public.agent_referrals enable row level security;

drop policy if exists "Admins full access on agents" on public.agents;
create policy "Admins full access on agents"
  on public.agents
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins full access on agent_referrals" on public.agent_referrals;
create policy "Admins full access on agent_referrals"
  on public.agent_referrals
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins full access on partner applications" on public.partner_applications;
create policy "Admins full access on partner applications"
  on public.partner_applications
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
