-- Manual, opt-in backups. Apply to your own Supabase project before enabling cloud uploads.
create table if not exists public.scenario_snapshots (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.scenario_snapshots enable row level security;
create policy "Read own snapshot" on public.scenario_snapshots for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Create own snapshot" on public.scenario_snapshots for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Update own snapshot" on public.scenario_snapshots for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Delete own snapshot" on public.scenario_snapshots for delete to authenticated using ((select auth.uid()) = owner_id);
revoke all on public.scenario_snapshots from anon;
grant select, insert, update, delete on public.scenario_snapshots to authenticated;
