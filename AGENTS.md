# AGENTS.md — rules for AI coding agents on this repo

Read this file **before every task**. It applies to Claude Code, Antigravity,
Cursor, and any other agent working in this repository. `docs/backend-spec.md`
is the authoritative behavioural spec; this file is how you work.

## What this project is

Keyhold — a Canada-first property-management SaaS for small landlords and small
property managers (1–50 units). Flat CA$4.99/month up to 12 units, then a
volume-discount curve where **per-unit price always falls**. We are deliberately
**not** enterprise software.

Stack: Next.js + TypeScript + Tailwind + shadcn/ui · Supabase (Postgres, Auth,
Storage, Edge Functions) · Stripe Billing · Resend · Sentry.

## Non-negotiable rules

1. **Money is deterministic.** Integer **cents** only — never floats, never
   `number` for currency amounts. All money math lives in `lib/money/` with unit
   tests. **An LLM never computes an amount.** Rounding is half-up at line level,
   then summed.
2. **Permissions live in the database.** Every table has RLS enabled. Hiding a
   control in the UI is never the access control. Every new table ships with its
   RLS policies and role tests in the same PR.
3. **Every mutation writes an audit event.** Money, permissions, notices, and
   deletions especially. `before`/`after` captured.
4. **Idempotency.** Every scheduled job and every webhook handler must be safely
   re-runnable with no duplicate side effects. Use explicit idempotency keys.
5. **No legal or financial decisions by AI.** AI may pre-fill, explain, find, and
   draft. It must never decide an eviction, a screening outcome, or a number.
6. **Province drives behaviour.** Jurisdiction rules are data/config, never
   hard-coded. The property's province determines forms, notices, and terminology.
7. **Soft delete** records with legal value (leases, invoices, payments, notices,
   inspections). Hard delete only through the privacy-deletion path.

## Working agreement

- **One task = one branch = one PR.** Branch names: `feat/…`, `fix/…`, `chore/…`.
  Conventional commits: `feat(rent): add NSF reversal handling`.
- **Read before writing.** Inspect existing patterns in the module you're touching
  and follow them. Do not introduce a second way of doing an existing thing.
- **Do not invent scope.** If the task implies work outside its stated boundary,
  stop and list what you found rather than building it.
- **Migrations:** one migration per PR, with an up and a down path. Never edit a
  migration that has been applied.
- **Secrets** never enter client code, logs, or the repo. Server-side only.
- **Tests are part of done.** A module is not complete until its RLS tests, money
  tests, state-machine tests, and idempotency tests pass.
- If a requirement in a task conflicts with `docs/backend-spec.md`, **the spec
  wins** — say so and stop rather than silently diverging.

## Definition of done

- [ ] Types/contracts defined and shared with the frontend
- [ ] Migration written with up/down
- [ ] RLS policies written + tested for owner / pm_full / pm_limited / tenant
- [ ] Money paths tested (if applicable), including the reconciliation invariant
- [ ] Illegal state transitions rejected and tested
- [ ] Audit events written for every mutation
- [ ] Errors handled; no unhandled promise rejections
- [ ] `lint`, `typecheck`, `test` all green
- [ ] PR describes what changed, why, and how it was tested

## Where things live

```
app/            Next.js routes (marketing, portal, tenant, owner)
lib/money/      All currency math. Pure functions. Heavily tested.
lib/auth/       Session, role resolution, permission helpers
lib/db/         Typed queries. No raw SQL in components.
lib/jobs/       Scheduled jobs. All idempotent.
supabase/migrations/   One migration per PR
docs/           backend-spec.md, decisions.md, glossary.md
tests/          rls/, money/, state/, integration/
```
