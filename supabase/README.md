# Supabase database

Project: **InvestingOrder** (`ipxpalktuyftzgeghglm`), Rao’s Rendezvous.

Project URL: https://ipxpalktuyftzgeghglm.supabase.co

Migration `202611270001_snapshots.sql` was applied to this project's main database through the SQL Editor on November 27, 2026. Version `202611270001`, name `snapshots`, was then recorded in `supabase_migrations.schema_migrations` using the same metadata column layout as the Supabase CLI. The history table is internal migration metadata, not an application data table.

Verified directly against PostgreSQL catalogs:

- `public.scenario_snapshots` exists with row-level security enabled.
- Four policies exist for the `authenticated` role: SELECT, INSERT, UPDATE and DELETE.
- Every read/write policy restricts access to `auth.uid() = owner_id`; UPDATE checks both the existing and proposed owner.
- Migration history returns version `202611270001` with name `snapshots`.

The migration defines `owner_id` as the primary key and a cascading foreign key to `auth.users`, a required object-valued JSONB payload, and an update timestamp. It revokes anonymous table privileges and grants authenticated CRUD access subject to the owner policies.

No financial scenarios or test users were inserted. Live two-user authentication and isolation testing has not been performed. The application still needs its public project URL and key in `.env.local` to use this database; no secret credentials were copied into the repository.

Future schema changes should use new versioned SQL files in `supabase/migrations`. Do not reapply the initial policy definitions manually now that its version is recorded.

## UX data model — applied November 27, 2026

Migration `20261127235613_ux_profiles_scenarios_checklists.sql` adds every application table in section 8 of `docs/INVESTING_ORDER_UX_FLOWS.md`:

- `profiles`: Auth user primary/foreign key, optional display name, saving preference, onboarding state, server timestamp.
- `scenarios`: UUID ID, immutable Auth owner, title, tax year, ruleset/input schema versions, object-valued JSON inputs, calculation status, revision, server timestamp.
- `checklist_items`: UUID ID, immutable scenario parent, action key, calculation revision, completion state, server timestamp; one action per scenario revision.

`auth.users` remains managed by Supabase. Household members and accounts belong inside `scenarios.inputs`. All three new tables have authenticated owner-only RLS and no anonymous privileges. Auth deletion cascades through profiles, scenarios and checklists. The scenario owner/list index and checklist uniqueness index cover foreign-key lookups.

Profiles are created explicitly during authenticated onboarding (there is no Auth signup trigger). Saving preferences are `device_only` (default) or `cloud`; onboarding states are `not_started`, `in_progress`, `completed`. Scenario statuses are `draft`, `ready`, `calculated`, `dirty`; network save states belong to the client. Checklist states are `to_review`, `planned`, `done`.

Start scenarios at revision 1. On every update, send the last-read revision plus one, and filter by both scenario ID and the last-read revision. A stale update either affects zero rows with that filter or raises SQLSTATE `40001`; the client must show a conflict rather than retrying blindly. Use stable scenario UUIDs for insert retries and read the existing row after duplicate-ID responses. Checklist writes must name the current scenario revision. Older marks remain stored but require review when their revision differs from the current scenario. Recalculation and export must use the recorded ruleset and input schema versions.

Migration `20261127235719_restrict_rls_helper_execution.sql` revokes client execution of the existing Supabase-provisioned `rls_auto_enable()` event-trigger helper. It preserves automatic RLS enabling and safely skips projects without that helper.

Verification: `supabase/tests/ux_schema.sql` passed against the live database with two temporary Auth identities and the `authenticated` database role. It tests owner isolation, forbidden cross-owner inserts/updates/deletes, immutable scenario ownership, stale scenario/checklist writes, retained historical marks, anonymous privileges and account cascades. The transaction rolls back all fixtures. Security advisors returned no findings; lint and typecheck passed. This is SQL policy testing, not an end-to-end email/session test.

The frontend still uses `scenario_snapshots` for manual backups. Creating these tables does not switch the app to structured sync: onboarding/profile persistence, per-plan upload consent, conflict UI, queued-write retry handling, checklist revision UI and protected account deletion still need application integration. No existing snapshot data was migrated or uploaded into the new tables.

Supabase migration history reference: https://supabase.com/docs/guides/deployment/database-migrations
