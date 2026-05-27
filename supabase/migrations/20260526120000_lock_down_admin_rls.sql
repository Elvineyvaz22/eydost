/*
  Security hardening — replace permissive "any authenticated user" RLS
  policies with strict admin-only ones.

  Background:
    Several existing policies used `USING (true)` gated by
    `auth.role() = 'authenticated'`. That treats every signed-up Supabase
    user as an admin, which is wrong now that public signups can exist.
    `app_metadata.role` is server-side only (a regular user cannot set
    it — only the service_role can), so it is the correct admin gate.

  To grant admin to a user:
    update auth.users
       set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
     where email = 'you@example.com';

  This migration is idempotent.
*/

-- Helper: is the current JWT an admin?
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

-- ── contact_submissions ──────────────────────────────────────────────
-- Anyone may submit (anonymous POST), but only admins may read.
drop policy if exists "Anyone can submit contact form" on public.contact_submissions;
drop policy if exists "Authenticated users can view submissions" on public.contact_submissions;
drop policy if exists "Admins can read submissions" on public.contact_submissions;

create policy "Anyone can submit contact form"
  on public.contact_submissions
  for insert
  to anon, authenticated
  with check (true);

create policy "Admins can read submissions"
  on public.contact_submissions
  for select
  to authenticated
  using (public.is_admin());

-- ── site_content ─────────────────────────────────────────────────────
-- Public can READ (the homepage needs this), only admins can write.
drop policy if exists "Authenticated users can read site content" on public.site_content;
drop policy if exists "Authenticated users can insert site content" on public.site_content;
drop policy if exists "Authenticated users can update site content" on public.site_content;
drop policy if exists "Public can read site content" on public.site_content;
drop policy if exists "Allow public read access" on public.site_content;
drop policy if exists "Allow authenticated users to update" on public.site_content;
drop policy if exists "Allow authenticated users to insert" on public.site_content;
drop policy if exists "Allow authenticated users to delete" on public.site_content;
drop policy if exists "Admins can write site content" on public.site_content;

create policy "Public can read site content"
  on public.site_content
  for select
  to anon, authenticated
  using (true);

create policy "Admins can insert site content"
  on public.site_content
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update site content"
  on public.site_content
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete site content"
  on public.site_content
  for delete
  to authenticated
  using (public.is_admin());

-- ── esim_pricing ─────────────────────────────────────────────────────
-- Public reads active rows only; only admins can write.
drop policy if exists "Public read access for active pricing" on public.esim_pricing;
drop policy if exists "Admin full access" on public.esim_pricing;
drop policy if exists "Admins full access on esim_pricing" on public.esim_pricing;

create policy "Public read access for active pricing"
  on public.esim_pricing
  for select
  to anon, authenticated
  using (is_active = true);

create policy "Admins full access on esim_pricing"
  on public.esim_pricing
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── esim_packages ────────────────────────────────────────────────────
-- Public reads active rows only; only admins can write. (The daily Vercel
-- cron uses the service_role key, which bypasses RLS entirely.)
drop policy if exists "Public can read active esim packages" on public.esim_packages;
drop policy if exists "Admin full access to esim_packages" on public.esim_packages;
drop policy if exists "Admins full access on esim_packages" on public.esim_packages;

create policy "Public can read active esim packages"
  on public.esim_packages
  for select
  to anon, authenticated
  using (is_active = true);

create policy "Admins full access on esim_packages"
  on public.esim_packages
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
