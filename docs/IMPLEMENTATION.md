# Investing Order implementation

The Expo starter is now an interactive, mobile-first planning MVP with a Robinhood-inspired charcoal/lime palette, simple typography, desktop navigation rail and mobile bottom navigation. This is an independent Investing Order interface.

## Run

```sh
npm install
npm run web
# Or run `npm start` and open in Expo Go / a compatible development build.
npm run lint
npm run typecheck
npm test
```

Expo SDK 58 is retained. Native projects remain generated. Reusable React Native style tokens and Expo UI controls provide cross-platform styling; Tailwind was not added. No site, backend or store deployment was performed.

## Available

- Overview with synthetic sample data visibly labeled; four example households.
- Eight-part household wizard with Single/MFJ branching, year-end ages, wages, existing/committed contributions, simple employer matches, HSA eligibility, IRA review items, contribution budget and explicit brokerage-before-education targets.
- Pure TypeScript calculation engine; integer-cent allocations; progressive ordinary federal tax; per-person workplace and IRA ledgers; Roth phaseouts; age catch-ups; high-wage Roth catch-up handling; employer dollars outside the contribution budget.
- Full contribution ladder with account reasoning and tax arithmetic; separate taxable-income and IRA-MAGI views.
- Original-versus-modified scenario comparison with copy-to-draft.
- Review checklist; local CSV export and native PDF sharing / web print-to-PDF preview. Files include model limitations and sources.
- Session-only default; opt-in device persistence; draft resume; clear-device action; checklist invalidation when recalculating a saved plan.
- Supabase email registration, sign-in, resend verification and recovery screens, callback handling, and an owner-protected SQL migration for manually uploaded cloud snapshots. No financial upload occurs during calculation.

## Connect Supabase

1. Copy `.env.example` to `.env.local` and enter your project URL and **public** anon/publishable key. Never use a service-role key in Expo.
2. Apply `supabase/migrations/202611270001_snapshots.sql` to the intended project.
3. Enable email confirmation and configure the application callback URLs in Supabase. The current scheme is `rao`, with callback path `/auth/callback`; add the appropriate web origin as well. Recovery callbacks include `type=recovery`.
4. Restart Expo after changing environment variables.
5. Verify cold/warm email callbacks on each target platform and test policies with two independent users before publishing.

Without configuration the app explicitly runs as a local preview. It does not pretend an account has been created. Once configured, the builder requires authentication to finish a personal plan. Authentication tokens and email-flow verifiers persist using Expo SecureStore on native and origin-scoped browser storage on web; this is separate from financial-data saving. Cloud snapshots require separate explicit opt-in and are manual uploads, **not automatic multi-device synchronization**. Settings can explicitly restore a snapshot, replacing the workspace after a warning.

## Boundaries before production

- Backend provisioning, live auth/recovery tests, conflict-aware synchronization, profile/email changes and a protected recent-authentication account-deletion function remain to be implemented and verified. Account deletion is visibly unavailable; clearing local data does not claim to delete an account.
- Device storage is unencrypted; it must not be advertised as a secure vault. Cloud backup schema has owner row policies but has not been exercised against a live Supabase project.
- The engine supports a limited federal ordinary income model and simple full-salary, single-tier matching. It excludes capital-gain/qualified-dividend stacking, tax credits, state taxes, AMT, QBI, NIIT, IRMAA, partial-year HSA coverage and simultaneous-plan aggregation. Those limitations appear in the app and exports.
- Only the selected HSA owner’s catch-up is modeled. A spouse’s separate HSA catch-up requires review. Age 65+ requires a reviewed deduction estimate.
- Backdoor IRA dollars are conditionally reserved, not treated as a completed tax-free conversion. Roth/pre-tax preferences and lower-bracket sequencing are methodology assumptions, not statutory rules.
- PDF/CSV code is bundled, but actual native share sheets, browser print dialogs, large text, keyboard behavior and screen readers require device/browser QA.
- The sourced 2026 rules and golden fixtures need independent qualified tax review before this becomes a public financial-planning product. A 2027 ruleset is not included.

## Validation

The engine suite exercises bracket boundaries, the article’s $6,200/$1,488 fixture, Roth phaseouts, contribution ages, household HSA room, external employer dollars, zero budgets, education ordering, conditional IRA workflows and 400 deterministic generated scenarios. The generated cases check cents conservation, unique allocation IDs, workplace capacity and explanation-tax reconciliation.

Browser UI automation was unavailable in the implementation environment. Build checks and server responses do not substitute for an interactive device walkthrough.
