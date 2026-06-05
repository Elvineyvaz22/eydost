alter table public.agents drop constraint if exists agents_status_check;
alter table public.agents
  add constraint agents_status_check check (status in ('pending', 'active', 'paused', 'blocked'));

alter table public.agents alter column status set default 'pending';

create index if not exists agent_referrals_status_idx on public.agent_referrals(status);
