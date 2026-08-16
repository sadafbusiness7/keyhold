# Backend task queue

Work top to bottom. **Do not start a task before its dependencies pass their
tests.** One task per branch, per PR, per agent session. Copy a task verbatim as
your agent prompt — each is scoped to be completable in one session.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done + tests green

---

## Phase 1 — Foundation (nothing works without this)

**[ ] T1. Project + Supabase bootstrap**
Set up Next.js + TypeScript + Tailwind + shadcn/ui, Supabase client (server and
browser), env handling, Sentry, and the lint/typecheck/test scripts. No features.
Done when: a protected route redirects anonymous users to sign-in.

**[ ] T2. Organization, users, auth**
Migration for `organization` and `app_user` per `docs/backend-spec.md §2`.
Supabase Auth wiring (magic link + password + Google OAuth). Session helper that
resolves `{ userId, organizationId, accountType }`.
Done when: a user signs up, an organization is created, and the session helper
returns the correct triple.

**[ ] T3. Roles, assignments, and RLS — THE critical task**
Migration for `property_assignment`. Enable RLS on all existing tables. Implement
policy patterns for owner / pm_full / pm_limited / tenant per spec §3.
Write `tests/rls/` proving, **by querying with each role's JWT**:
- a PM cannot read an unassigned property
- a `limited` PM cannot read any financial table
- a tenant cannot read another tenant's lease, invoice, or document
- no role can read another organization's rows
Done when: every one of those tests fails to return data.

**[ ] T4. Property, unit, tenant CRUD + document storage**
Tables, typed queries, Supabase Storage bucket with per-org path scoping and RLS.
Done when: CRUD works for owner and assigned PM, is denied for others, and each
mutation writes an audit event.

## Phase 2 — The spine

**[ ] T5. Lease + lease_tenant + state machine**
Statuses and transitions per spec §4. Signature locking (`locked = true` on first
signature; `revert_signature` is an explicit audited action).
Done when: illegal transitions are rejected with tests.

**[ ] T6. Money core — `lib/money/`**
Pure functions: cents arithmetic, half-up line rounding, province tax resolution,
proration by days. **No database, no I/O.** Exhaustive unit tests including
boundary cents and negative cases.
Done when: 100% branch coverage on `lib/money/`.

**[ ] T7. Invoices + lines + payments + credits**
Tables and transitions per spec §4. Partial payment, overpayment → credit,
credit auto-apply oldest-first, NSF reversal (new line, invoice back to overdue,
original rent line untouched), last-month-rent applied only to a final invoice.
Done when: the reconciliation invariant test passes —
`sum(lines) − sum(payments applied) − sum(credits applied) = balance`.

**[ ] T8. Scheduled jobs**
Monthly invoice generation (idempotency key `lease_id + period_start`), overdue
marking, reminder jobs. Dead-letter table for failures.
Done when: running any job twice produces zero duplicates (tested).

## Phase 3 — Operations

**[ ] T9. Maintenance → work order → vendor**
Full action log on every request. Access instructions carried to the work order.

**[ ] T10. Bills + approval flow**
Draft → pending_approval → approved → paid. Approver must differ from creator
when the org has more than one admin.

**[ ] T11. Notices (N1/N4) with form versioning**
Store `form_version`, `source_url`, `effective_date`, service method, and the
generated PDF. Bulk generation. Rent change scheduled to apply only after the
notice period. Human confirmation required before generation.

**[ ] T12. Reports + owner disbursement**
Deterministic queries. Disbursement statement snapshot is **immutable** once
issued.

## Phase 4 — Trust & commerce

**[ ] T13. Subscription + plan-limit enforcement**
Stripe Billing, webhook handling (signature verified, deduped by event id,
idempotent). Live unit counting against the tier curve. Prompt on crossing 12
units — never block the user's data.

**[ ] T14. Notifications, activity feed, audit-log UI**

**[ ] T15. Privacy surface**
Data export (JSON + CSV), account deletion with retention rules, consent records,
configurable retention per record type.

**[ ] T16. Inspections, assets, announcements, insurance tracking**

**[ ] T17. T776 tax package + Ontario rent-increase guideline automation**

---

## Task prompt template

```
Read AGENTS.md and docs/backend-spec.md first.

TASK: <paste the task above verbatim>

Constraints:
- Money in integer cents only; all math in lib/money/ with tests.
- Every new table: RLS policies + role tests in this same PR.
- Every mutation: audit event with before/after.
- One migration, with up and down.
- Do not modify files outside this task's scope. If you find work that belongs
  to another task, list it and stop.

Done when: lint, typecheck, and all tests pass, and the Definition of Done in
AGENTS.md is satisfied. Show me the diff summary and the test output.
```

---

## T11a. Provincial forms engine (insert before T11 — Notices)

Read `docs/forms-engine.md` first.

**[ ] T11a-1. Engine scaffolding**
Add `pdf-lib` and `tsx`. Wire `scripts/extract-form-fields.ts` and
`scripts/verify-form-mapping.ts` as `pnpm forms:extract` and `pnpm forms:verify`.
Create `forms/{on,bc,ns,nb,ab}/`, `forms/_pdfs/`, `forms/_skipped/`.
Add `pnpm forms:verify` to the CI pipeline as a blocking check.
Done when: verify runs green on an empty/sample set and fails on a deliberate typo.

**[ ] T11a-2. Definition loader + prefill resolver**
`lib/forms/registry.ts` (load definitions, select by province + effectiveDate,
warn when a newer version exists) and `lib/forms/prefill.ts` (resolve dot-paths
against the context object; missing path → empty + required-but-empty flag).
Tests: every `prefillPath` in every definition resolves against a sample fixture.

**[ ] T11a-3. Fill + flatten**
`lib/forms/fill.ts` using pdf-lib: set text fields, checkboxes, radios, embed
signatures, then `form.flatten()`. Currency formatted from integer cents; dates
in the form's expected format. Returns bytes → Supabase Storage → `document` /
`notice` row storing `form_version` and `source_url`.
Tests: golden-file snapshot per form.

**[ ] T11a-4. First three Ontario forms**
Ontario Standard Lease, N1, N4. For each: download the official PDF from the
government source, run `forms:extract`, complete labels/helpText/prefillPath/
required/sections, add a golden snapshot, commit definition + PDF + snapshot in
one PR. `forms:verify` must pass.

**[ ] T11a-5. Forms API**
Endpoints: list forms for a province, get a definition, save a draft, generate
(fill + store + audit). Human confirmation required before generation. Enforce
notice periods; block non-compliant rent increases with an explanation.
