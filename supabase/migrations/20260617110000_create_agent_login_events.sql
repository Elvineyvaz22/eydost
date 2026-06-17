create table if not exists public.agent_login_events (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references public.agents(id) on delete set null,
  email text not null,
  event_type text not null default 'login' check (event_type in ('login', 'register')),
  ip_country text,
  ip_region text,
  ip_city text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists agent_login_events_agent_id_idx on public.agent_login_events(agent_id);
create index if not exists agent_login_events_email_idx on public.agent_login_events(email);
create index if not exists agent_login_events_created_at_idx on public.agent_login_events(created_at desc);

alter table public.agent_login_events enable row level security;

drop policy if exists "Admins read agent login events" on public.agent_login_events;
create policy "Admins read agent login events"
  on public.agent_login_events
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins full access on agent login events" on public.agent_login_events;
create policy "Admins full access on agent login events"
  on public.agent_login_events
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
