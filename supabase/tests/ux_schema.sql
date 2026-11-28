-- Run as postgres against a migrated Supabase database. All fixtures roll back.
begin;
select set_config('test.owner_a', gen_random_uuid()::text, true);
select set_config('test.owner_b', gen_random_uuid()::text, true);
select set_config('test.scenario', gen_random_uuid()::text, true);
insert into auth.users(id) values
  (current_setting('test.owner_a')::uuid), (current_setting('test.owner_b')::uuid);

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.owner_a'), true);
insert into public.profiles(user_id) values (auth.uid());
insert into public.scenarios(id, title, tax_year, ruleset_version, input_schema_version, inputs)
values (current_setting('test.scenario')::uuid, 'Schema verification', 2026, 'test', '1', '{}');
insert into public.checklist_items(scenario_id, action_key, calculation_revision)
values (current_setting('test.scenario')::uuid, 'confirm_match', 1);

do $$
begin
  if not exists (select 1 from public.profiles where saving_preference = 'device_only') then
    raise exception 'Device-only default failed';
  end if;
  begin
    update public.scenarios set user_id = current_setting('test.owner_b')::uuid, revision = 2;
    raise exception 'Ownership reassignment was allowed';
  exception when check_violation or insufficient_privilege then null;
  end;
  begin
    insert into public.checklist_items(scenario_id, action_key, calculation_revision)
    values (current_setting('test.scenario')::uuid, 'invalid', 2);
    raise exception 'Future checklist revision was allowed';
  exception when serialization_failure then null;
  end;
end;
$$;

update public.scenarios set title = 'Updated', revision = 2;
do $$
begin
  begin
    update public.scenarios set title = 'Stale overwrite', revision = 2;
    raise exception 'Stale scenario update was allowed';
  exception when serialization_failure then null;
  end;
  if not exists (select 1 from public.scenarios where title = 'Updated' and revision = 2) then
    raise exception 'Scenario update failed';
  end if;
  if not exists (select 1 from public.checklist_items where calculation_revision = 1) then
    raise exception 'Historical checklist marks were lost';
  end if;
  begin
    update public.checklist_items set completion_state = 'done';
    raise exception 'Stale checklist completion was allowed';
  exception when serialization_failure then null;
  end;
end;
$$;
insert into public.checklist_items(scenario_id, action_key, calculation_revision, completion_state)
values (current_setting('test.scenario')::uuid, 'confirm_match', 2, 'planned');

-- Switch JWT identity without changing the database role.
select set_config('request.jwt.claim.sub', current_setting('test.owner_b'), true);
do $$
declare affected integer;
begin
  if exists (select 1 from public.profiles) or exists (select 1 from public.scenarios)
    or exists (select 1 from public.checklist_items) then
    raise exception 'Cross-owner read leaked rows';
  end if;
  update public.scenarios set title = 'Other user', revision = 3;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-owner update succeeded'; end if;
  delete from public.checklist_items;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-owner delete succeeded'; end if;
  begin
    insert into public.profiles(user_id) values (current_setting('test.owner_a')::uuid);
    raise exception 'Cross-owner profile insert succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.scenarios(user_id, title, tax_year, ruleset_version, input_schema_version, inputs)
    values (current_setting('test.owner_a')::uuid, 'Forbidden', 2026, 'test', '1', '{}');
    raise exception 'Cross-owner scenario insert succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.checklist_items(scenario_id, action_key, calculation_revision)
    values (current_setting('test.scenario')::uuid, 'forbidden', 2);
    raise exception 'Cross-owner checklist insert succeeded';
  exception when insufficient_privilege or serialization_failure then null;
  end;
end;
$$;

reset role;
do $$
declare table_name text;
begin
  foreach table_name in array array['profiles', 'scenarios', 'checklist_items'] loop
    if has_table_privilege('anon', 'public.' || table_name, 'SELECT,INSERT,UPDATE,DELETE') then
      raise exception 'Anonymous table privileges found on %', table_name;
    end if;
  end loop;
end;
$$;
delete from auth.users where id = current_setting('test.owner_a')::uuid;
do $$
begin
  if exists (select 1 from public.profiles where user_id = current_setting('test.owner_a')::uuid)
    or exists (select 1 from public.scenarios where id = current_setting('test.scenario')::uuid)
    or exists (select 1 from public.checklist_items where scenario_id = current_setting('test.scenario')::uuid) then
    raise exception 'Account cascade cleanup failed';
  end if;
end;
$$;
rollback;
select 'PASS: ownership, revisions, checklist history, anonymous privileges, and cascade cleanup; fixtures rolled back' as result;
