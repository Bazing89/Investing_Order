-- UX section 8. Auth owns identity; financial inputs are uploaded only after opt-in.
-- This adds structured persistence without changing existing manual snapshots.
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  saving_preference text not null default 'device_only'
    check (saving_preference in ('device_only', 'cloud')),
  onboarding_state text not null default 'not_started'
    check (onboarding_state in ('not_started', 'in_progress', 'completed')),
  updated_at timestamptz not null default now()
);

create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  tax_year integer not null check (tax_year between 1900 and 9999),
  ruleset_version text not null check (length(btrim(ruleset_version)) > 0),
  input_schema_version text not null check (length(btrim(input_schema_version)) > 0),
  inputs jsonb not null check (jsonb_typeof(inputs) = 'object'),
  status text not null default 'draft'
    check (status in ('draft', 'ready', 'calculated', 'dirty')),
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
create index scenarios_user_updated_idx on public.scenarios(user_id, updated_at desc);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.scenarios(id) on delete cascade,
  action_key text not null check (length(btrim(action_key)) > 0),
  calculation_revision integer not null check (calculation_revision > 0),
  completion_state text not null default 'to_review'
    check (completion_state in ('to_review', 'planned', 'done')),
  updated_at timestamptz not null default now(),
  unique (scenario_id, calculation_revision, action_key)
);

-- Server timestamps and immutable row identities. No privileged execution needed.
create function public.guard_profile_write() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if TG_OP = 'UPDATE' and new.user_id is distinct from old.user_id then
    raise exception 'Profile ownership is immutable' using errcode = '23514';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger guard_profile_write before insert or update on public.profiles
for each row execute function public.guard_profile_write();

-- Clients submit expected_revision + 1, ideally also filtering by expected revision.
-- Row locking during UPDATE ensures a competing stale write cannot overwrite data.
create function public.guard_scenario_write() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    if new.revision <> 1 then
      raise exception 'New scenarios must start at revision 1' using errcode = '23514';
    end if;
  else
    if new.id is distinct from old.id or new.user_id is distinct from old.user_id then
      raise exception 'Scenario identity and ownership are immutable' using errcode = '23514';
    end if;
    if new.revision <> old.revision + 1 then
      raise exception 'Scenario revision conflict: reload before saving' using errcode = '40001';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger guard_scenario_write before insert or update on public.scenarios
for each row execute function public.guard_scenario_write();

-- Preserve historical completion marks; clients treat a mismatched revision as
-- needing review. New marks must refer to the current scenario revision.
create function public.guard_checklist_write() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare current_revision integer;
begin
  if TG_OP = 'UPDATE' and
    (new.id is distinct from old.id or new.scenario_id is distinct from old.scenario_id) then
    raise exception 'Checklist identity and parent are immutable' using errcode = '23514';
  end if;
  select revision into current_revision from public.scenarios
    where id = new.scenario_id for share;
  if current_revision is null or new.calculation_revision is distinct from current_revision then
    raise exception 'Checklist revision conflict: recalculate before saving' using errcode = '40001';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger guard_checklist_write before insert or update on public.checklist_items
for each row execute function public.guard_checklist_write();

revoke all on function public.guard_profile_write() from public, anon, authenticated;
revoke all on function public.guard_scenario_write() from public, anon, authenticated;
revoke all on function public.guard_checklist_write() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.scenarios enable row level security;
alter table public.checklist_items enable row level security;

create policy "Owners manage profiles" on public.profiles for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Owners manage scenarios" on public.scenarios for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Owners manage scenario checklists" on public.checklist_items for all to authenticated
  using (exists (select 1 from public.scenarios s
    where s.id = scenario_id and s.user_id = (select auth.uid())))
  with check (exists (select 1 from public.scenarios s
    where s.id = scenario_id and s.user_id = (select auth.uid())));

revoke all on public.profiles, public.scenarios, public.checklist_items from public, anon, authenticated;
grant select, insert, update, delete on public.profiles, public.scenarios, public.checklist_items to authenticated;

comment on table public.profiles is 'Nonfinancial preferences; create via authenticated onboarding, device_only by default.';
comment on table public.scenarios is 'Opted-in cloud inputs only. Recompute results locally using recorded versions. Reuse the scenario UUID on insert retries.';
comment on column public.scenarios.revision is 'Start at 1. Every update must submit the previously read revision + 1; stale writes fail with SQLSTATE 40001.';
comment on table public.checklist_items is 'Self-reported actions. Historical revision marks require review after scenario changes; never imply actual funding.';
