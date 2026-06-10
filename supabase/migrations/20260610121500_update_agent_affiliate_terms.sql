alter table public.agents
  alter column commission_rate set default 15.00;

update public.agents
set commission_rate = 15.00,
    updated_at = now()
where commission_rate <> 15.00;
