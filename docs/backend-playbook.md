# Keyhold — Complete Backend Development Playbook

Everything needed to take the backend from empty repo to launch-ready, in order,
with the exact prompt for every task.

**How to use this:** work top to bottom. One task = one branch = one PR = one
agent session. Copy the prompt verbatim into Claude Code or Antigravity. Never
start a task before its dependencies pass their tests.

---

## Part 0 — Environment setup (do this once, by hand)

### 0.1 Accounts to create
| Service | Purpose | Notes |
|---|---|---|
| GitHub | Repo + CI | **Do this first.** Private repo. |
| Supabase | Postgres, Auth, Storage, Edge Functions | Choose a **Canadian region** (data residency matters for PIPEDA optics) |
| Vercel | Hosting | Connect to the GitHub repo |
| Stripe | Subscription billing | Canadian entity, CAD |
| Resend | Transactional email | Verify your sending domain |
| Sentry | Error monitoring | Free tier to start |
| Anthropic API | Ask Keyhold | **Enterprise/commercial terms + DPA** — no training on your data |

### 0.2 Local toolchain
```bash
node -v        # 20 LTS or newer
pnpm -v        # package manager
git --version
# Supabase CLI for local DB + migrations
npm i -g supabase
```

### 0.3 Repo bootstrap (run before any agent task)
```bash
mkdir keyhold && cd keyhold
git init
pnpm create next-app@latest . --typescript --tailwind --app --eslint
pnpm add @supabase/supabase-js @supabase/ssr zod pdf-lib stripe resend
pnpm add -D vitest @vitest/coverage-v8 tsx @types/node
supabase init
```

Then **copy in the starter files** (from `keyhold-backend-starter.zip`):
```
AGENTS.md                       ← agents read this before every task
docs/backend-spec.md            ← the behavioural bible
docs/backend-tasks.md           ← the task queue
docs/forms-engine.md            ← forms engine spec
docs/backend-playbook.md        ← this file
scripts/extract-form-fields.ts
scripts/verify-form-mapping.ts
```

Add to `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:rls": "vitest run tests/rls",
    "test:money": "vitest run tests/money --coverage",
    "forms:extract": "tsx scripts/extract-form-fields.ts",
    "forms:verify": "tsx scripts/verify-form-mapping.ts",
    "db:migrate": "supabase migration up",
    "db:reset": "supabase db reset"
  }
}
```

### 0.4 Environment variables (`.env.local`, never committed)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only, never in client code
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
ANTHROPIC_API_KEY=
SENTRY_DSN=
```

### 0.5 CI (GitHub Actions) — blocking checks from day one
`.github/workflows/ci.yml` must run: `lint`, `typecheck`, `test`,
`test:rls`, `forms:verify`. **A red build never merges.**

---

## Part 1 — The build sequence (17 tasks)

Each task below gives you: what it does, why it matters, and the **exact prompt**.

Every prompt assumes this preamble — agents also read `AGENTS.md` automatically:

> Read `AGENTS.md` and `docs/backend-spec.md` before starting. Money in integer
> cents only. Every new table ships with RLS policies + role tests in the same PR.
> Every mutation writes an audit event. One migration with up and down. Do not
> modify files outside this task's scope — if you find work belonging to another
> task, list it and stop. Done when lint, typecheck, and all tests pass.

---

### PHASE 1 — FOUNDATION

#### T1. Project + Supabase bootstrap
*Gets the skeleton running. No features.*

```
TASK T1 — Project and Supabase bootstrap.

Set up the application shell:
- Supabase clients: a browser client and a server client using @supabase/ssr,
  with correct cookie handling for Next.js App Router.
- Environment variable validation at startup using zod — fail fast with a clear
  message if a required var is missing. Service-role key must be server-only and
  must never be importable from a client component.
- Sentry initialisation for both client and server.
- Vitest configured with a tests/ directory and coverage reporting.
- A middleware that protects /portal/* routes: unauthenticated users are
  redirected to /sign-in.
- A health check route at /api/health returning build info and DB connectivity.

Done when: `pnpm dev` runs, an anonymous request to /portal redirects to
/sign-in, and `pnpm test` passes with the sample test.
```

#### T2. Organization, users, auth
*Creates the tenancy root. Everything hangs off `organization`.*

```
TASK T2 — Organization, users, and authentication.

Create the migration for `organization` and `app_user` exactly as specified in
docs/backend-spec.md §2 (uuid PKs, created_at/updated_at/created_by, proper
enums, indexed FKs).

Implement:
- Sign-up flow: creates a Supabase auth user, then an `organization`, then an
  `app_user` row with account_type='owner' linked to both. This must be atomic —
  use a Postgres function or a transaction; a half-created account is a bug.
- Sign-in: magic link, email+password, and Google OAuth.
- `getSession()` server helper resolving { userId, organizationId, accountType,
  fullName }. Cached per request.
- Sign-out, password reset, and email verification.

Done when: a new sign-up produces exactly one organization and one owner
app_user, and getSession() returns the correct triple. Test the atomicity by
forcing a failure mid-flow and asserting no orphan rows.
```

#### T3. Roles, assignments, and RLS — **the critical task**
*This is the one that matters most. Do not rush it.*

```
TASK T3 — Roles, property assignments, and row-level security.

This is the security foundation. Take it slowly and test it exhaustively.

1. Migration for `property_assignment` (id, organization_id, pm_user_id,
   property_id, level ['full'|'limited'], granted_by, granted_at, revoked_at)
   per docs/backend-spec.md §2.

2. Enable RLS on EVERY table created so far. Implement the policy patterns in
   docs/backend-spec.md §3:
   - Owner: full access where organization_id = current_org()
   - PM: only rows whose property_id is in their active (revoked_at IS NULL)
     assignments
   - PM with level='limited': additionally DENIED on all financial tables
   - Tenant: only rows tied to their own lease/unit
   - No role may ever read another organization's rows

3. Helper SQL functions: current_org(), current_account_type(),
   is_assigned_to_property(uuid), assignment_level(uuid).

4. Write tests/rls/ that authenticate as each role using a real JWT and attempt
   to read/write rows they should not reach. Cover: owner, pm_full, pm_limited,
   tenant, and cross-organization access.

Done when: every unauthorized query returns ZERO rows (not an error — zero rows),
proven by test. This is non-negotiable; do not proceed to T4 until green.
```

#### T4. Property, unit, tenant, documents
```
TASK T4 — Property, unit, tenant CRUD and document storage.

Migrations for `property`, `unit`, `tenant`, `document` per spec §2, with RLS
policies and role tests in this same PR.

- Typed query layer in lib/db/ (no raw SQL in components). Zod schemas shared
  with the frontend.
- Supabase Storage bucket with per-organization path scoping
  (org/{organization_id}/...) and Storage RLS so cross-org file access is
  impossible.
- Document metadata: category, scope (org/property/unit/tenant), visibility
  ['private'|'shared_with_tenant'|'shared_with_owner'], review_date, expiry_date,
  version, uploaded_by.
- Soft delete (deleted_at) on property, unit, tenant, document.
- Every mutation writes an audit_event with before/after.

Done when: CRUD works for owner and assigned PM, is denied for unassigned PM and
tenant (tested), and files cannot be read across organizations.
```

---

### PHASE 2 — THE SPINE

#### T5. Lease + state machine
```
TASK T5 — Lease, lease_tenant, and the lease state machine.

Migrations for `lease` and `lease_tenant` per spec §2.

Implement the state machine from spec §4:
  draft → out_for_signature → active → expiring → ended | terminated
- Transitions enforced in code. Every illegal transition is REJECTED with a clear
  error, and each rejection is covered by a test.
- Signature locking: on first signature, lease.locked = true. Editing a locked
  lease requires an explicit revertSignature() action that voids collected
  signatures and writes an audit event.
- Creating an `active` lease SCHEDULES the first invoice (does not create
  retroactive invoices).
- The "existing tenant" path: create tenant + active lease directly from an
  uploaded signed lease, skipping the wizard states.

Done when: all legal transitions work, all illegal ones are rejected by test, and
a locked lease cannot be edited without an audited revert.
```

#### T6. Money core — `lib/money/`
*Pure functions. No database. This is where correctness is won.*

```
TASK T6 — Money core library.

Create lib/money/ containing PURE functions only — no database access, no I/O,
no framework imports. All amounts are integer cents.

Implement:
- add/subtract/multiply/allocate on cents (allocate distributes a total across
  n parts with the remainder going to the last part — no lost pennies).
- roundHalfUp(cents) applied at LINE level, then summed (never sum-then-round).
- resolveTaxRate(province, taxCode, asOfDate) and calculateTax(amountCents, rate).
- prorate(amountCents, periodStart, periodEnd, actualStart, actualEnd) by days,
  remainder to the final day.
- formatMoney(cents, locale) for display only, at the edge.
- parseMoney(string) → cents, rejecting ambiguous input.

Tests: exhaustive. Include boundary cents (1, 0, negative), rounding at .005,
proration across month boundaries and leap years, allocation remainders, and
tax on tax-exempt items.

Done when: 100% branch coverage on lib/money/ and every test passes.
```

#### T7. Invoices, payments, credits
```
TASK T7 — Invoices, invoice lines, payments, and tenant credits.

Migrations for `invoice`, `invoice_line`, `payment`, `tenant_credit` per spec §2.
All amounts in cents. All math via lib/money/.

Implement the transitions in spec §4 and these rules:
- Partial payment → invoice status part_paid, balance recalculated.
- Overpayment → creates a tenant_credit for the excess.
- Credit auto-apply (when enabled): consumes credits OLDEST FIRST until zero.
- NSF reversal: sets payment.status='reversed', adds an 'nsf' invoice_line per
  the configured charge, returns the invoice to 'overdue'. The original rent line
  is NEVER mutated.
- Last-month-rent: applies ONLY to the final invoice of an ending lease.
- Void invoice: allowed only when no payments are applied; audited.
- Idempotency: invoice creation keyed on lease_id + period_start (UNIQUE).

Tests must include the RECONCILIATION INVARIANT: for any lease and period,
sum(invoice_lines) − sum(payments applied) − sum(credits applied) = balance.
Property-based tests over random sequences of charges/payments/reversals.

Done when: the invariant holds across all generated scenarios.
```

#### T8. Scheduled jobs
```
TASK T8 — Scheduled jobs with idempotency and dead-lettering.

Implement in lib/jobs/, run via Supabase scheduled Edge Functions:
- generateMonthlyInvoices: for each active lease due this cycle, create the
  invoice. Idempotency key lease_id + period_start — a re-run is a NO-OP.
- markOverdue: invoices past due_date → 'overdue'.
- sendReminders: rent due, rent overdue, lease expiring (per configured lead
  time), insurance expiring, document expiring.
- applyLateFees: after due_date + grace_days, create a reviewable BATCH (not
  applied immediately) that a user can waive before it commits. Respect the
  configured cap.

Every job: runs in a transaction, logs start/end/duration, writes failures to a
`job_failure` dead-letter table with the payload, and is safely re-runnable.
A job must NEVER silently skip a period — a missed run is logged loudly.

Tests: run each job twice against the same data and assert zero duplicates.

Done when: double-run tests pass and a forced failure lands in the dead-letter
table.
```

---

### PHASE 3 — OPERATIONS

#### T9. Maintenance → work orders → vendors
```
TASK T9 — Maintenance requests, work orders, and vendors.

Migrations for `maintenance_request`, `work_order`, `vendor` per spec §2, with
RLS (a tenant sees only their own unit's requests) and role tests.

- State machine: new → triaged → scheduled → in_progress → resolved → closed.
- Every action (status change, assignment, comment, photo) appends to an
  immutable action log on the request — this is the defensible history.
- Work order created from a request CARRIES OVER description, photos, tenant
  details, and access instructions. Assign to a vendor; notify by email/SMS.
- Recurring requests: a schedule that generates requests (idempotent, keyed on
  schedule_id + period).
- Photo uploads to Storage with org-scoped paths.

Done when: a tenant can submit, a PM can triage and dispatch, the log is complete
and immutable, and cross-unit access is denied by test.
```

#### T10. Bills and approvals
```
TASK T10 — Bills, line items, and the approval flow.

Migration for `bill` and `bill_line` per spec §2. All amounts in cents via
lib/money/.

- State machine: draft → pending_approval → approved → paid | void.
- SEGREGATION OF DUTIES: when the organization has more than one admin, the
  approver must be a different user than the creator. Enforce in code; test it.
- Create a bill from a work order with property/unit pre-associated.
- Line items with tax per line (rate resolved and STORED at creation).
- Attachments (receipt/photo) to Storage.
- Duplicate-for-recurring: clones a bill as a new draft with a new period.
- Financial tables are DENIED to level='limited' PMs — verify by test.

Done when: the approval rule is enforced, tax is stored historically, and RLS
tests confirm limited PMs cannot read bills.
```

#### T11a. Provincial forms engine
*See `docs/forms-engine.md`. This is the moat.*

```
TASK T11a-1 — Forms engine scaffolding.

Wire scripts/extract-form-fields.ts and scripts/verify-form-mapping.ts as
`pnpm forms:extract` and `pnpm forms:verify`. Create forms/{on,bc,ns,nb,ab}/,
forms/_pdfs/, forms/_skipped/. Add `pnpm forms:verify` to the CI pipeline as a
BLOCKING check.
Done when: verify runs green on a sample definition and FAILS on a deliberately
introduced typo in a pdfFieldName.
```
```
TASK T11a-2 — Definition registry and prefill resolver.

lib/forms/registry.ts: load definitions from forms/, select by province +
formCode + the latest effectiveDate ≤ document date, and expose a warning when a
newer version exists.
lib/forms/prefill.ts: resolve dot-path prefillPath against a context object
{ organization, property, unit, lease, primaryTenant, tenants[], owner,
computed }. A missing path resolves to empty AND flags the field as
required-but-empty — it must never silently blank a required legal field.
Tests: every prefillPath in every committed definition resolves against a sample
fixture.
```
```
TASK T11a-3 — Fill and flatten.

lib/forms/fill.ts using pdf-lib: set text fields, checkboxes, radio groups and
dropdowns; embed typed or drawn signatures into signature fields; then
form.flatten() so the issued document cannot be edited.
Currency formatted from integer cents; dates in the form's expected format.
Returns bytes → Supabase Storage → creates a `document` and (for notices) a
`notice` row storing form_version and source_url.
Tests: golden-file snapshot per form — fill with a fixed fixture, extract text,
compare to an approved snapshot.
```
```
TASK T11a-4 — First three Ontario forms.

For the Ontario Standard Lease, N1, and N4:
1. Place the official PDF (downloaded from the government source) in
   forms/_pdfs/on/ and record the exact source URL and effective date.
2. Run `pnpm forms:extract` on each.
3. Complete every TODO: labels, plain-language helpText, required flags,
   sections, prefillPath, noticePeriodDays, certificateOfService.
4. Add a golden snapshot.
5. `pnpm forms:verify` must pass with zero unmapped fields.
Commit definition + PDF + snapshot together, one form per PR.
```
```
TASK T11a-5 — Forms API.

Endpoints: list forms for a province; get a definition; save/resume a draft;
generate (fill + store + audit).
Rules: a human must confirm before generation. Enforce notice periods — a rent
change applies only AFTER the required period. BLOCK a rent increase that
exceeds the provincial guideline, with a plain-language explanation. Every
generated document records form_version, source_url, filled_by, and confirmed_at.
```

#### T11. Notices
```
TASK T11 — Notices (N1/N4) built on the forms engine.

Migration for `notice` per spec §2.
- Generate individually and in BULK (select many tenants).
- Save the generated PDF to the tenant's document history.
- Record a certificate of service: method (personal, mail, email, posting) and
  date, with the provincial deemed-service rules applied to compute the effective
  date.
- Bulk N1: after the notice period elapses, a scheduled job applies the new rent
  to those leases — audited, never silent.
- Every notice stores form_version and source_url for reproducibility.
Guardrail: AI may pre-fill and explain; a human confirms before generation.
```

#### T12. Reports and owner disbursement
```
TASK T12 — Reports and owner disbursement.

Deterministic SQL/query layer for: rent roll, income vs expense by property,
aged receivables (30/60/90+), outstanding rent, habitual late payers, occupancy
and vacancy with days-vacant, maintenance summary, vendor spend, lease expiry
schedule, security deposit ledger.
Each: filter by property + date range, export CSV and PDF, saved views.

OWNER DISBURSEMENT: management fee basis (% collected | % invoiced | flat) stored
on the property. Statement = collected income − expenses − management fee = net
payable. Once issued, the statement is an IMMUTABLE SNAPSHOT (store the computed
values, never recompute historical statements from live data).

All figures via lib/money/. Tests compare against hand-computed fixtures.
```

---

### PHASE 4 — TRUST AND COMMERCE

#### T13. Subscription and plan limits
```
TASK T13 — Stripe subscription and plan-limit enforcement.

- Stripe Billing integration: create customer, checkout, subscription lifecycle.
- Webhook handler: verify signature, dedupe by event id, process idempotently,
  retry with backoff, dead-letter after N attempts. NEVER trust the client for
  subscription state.
- Live unit counting per organization (cached, recomputed on unit changes).
- Pricing curve per docs/master-strategy.md: flat CA$4.99 for 1–12 units, then
  the volume-discount curve where per-unit price always FALLS, capped at 50 units.
  Implement in lib/money/pricing.ts with tests at every tier boundary.
- On crossing 12 units: prompt with the new price. NEVER block or delete data.
- Billing portal: change plan (with proration), payment method, invoice history,
  cancel with a retention step.

Tests: tier boundaries (12→13, 25→26, 40→41, 50), proration, and webhook
idempotency.
```

#### T14. Notifications, activity feed, audit log
```
TASK T14 — Notifications, activity feed, and the audit log surface.

- `notification` table + delivery via Resend (email) and in-app.
- Per-user, per-event, per-channel preferences honoured on every send.
- Triggers: rent received/overdue, maintenance submitted, urgent maintenance,
  lease expiring, notice served, insurance expiring, document expiring, payment
  failed, team member added, import complete.
- Activity feed: per-record timeline derived from audit_event, showing who did
  what when, with before → after.
- Audit log UI (owner-only): filterable by user/date/entity, exportable CSV.
- Daily/weekly digest email per preferences.
Idempotent: a notification is never sent twice for the same event.
```

#### T15. Privacy and compliance surface
```
TASK T15 — PIPEDA privacy surface.

- Data export: complete organization data as JSON + CSV, generated
  asynchronously, delivered via a signed time-limited link.
- Account deletion: a clear flow stating what is deleted, what is retained for
  legal/tax reasons and for how long, with a grace period before permanent
  deletion. Soft-delete first, hard-delete after the grace period via a job.
- `consent_record` table: credit check, e-sign, e-communications, rent reporting,
  marketing — each with timestamp, version, method, IP. Viewable history and
  withdrawal.
- Configurable retention per record type with data-minimizing defaults.
- MFA enrollment with recovery codes; active session list with revoke; login
  history.
Tests: an exported archive contains all of the organization's data and NONE of
another organization's.
```

#### T16. Inspections, assets, announcements, insurance
```
TASK T16 — Inspections, assets, announcements, insurance tracking.

- `inspection` + template builder (sections → items → response type). Move-in /
  move-out / periodic. PAIRED inspections: move_out links to its move_in via
  paired_inspection_id for side-by-side comparison. Photos per item. Both parties
  sign; export PDF to the unit and tenant records.
- `asset`: appliances/equipment per unit (make, model, serial, purchase date,
  warranty expiry, linked maintenance history). Shared-info assets (door code,
  wifi) shareable to specific tenants' portals.
- `announcement`: audience (all/property/unit/owners), channels (email/SMS/
  portal), schedule or send now, delivery report.
- Insurance tracking: per-lease requirement + minimum coverage; tenant uploads
  proof (policy number, provider, coverage, effective, expiry, document);
  status Valid/Expiring/Expired/Never provided; automatic expiry reminders.
```

#### T17. T776 tax package and rent-increase guideline
```
TASK T17 — T776 tax package and Ontario rent-increase guideline automation.

T776 PACKAGE:
- Select tax year + properties. Map income and expenses to CRA T776 categories:
  gross rents, advertising, insurance, interest, maintenance and repairs,
  management and administration fees, motor vehicle, office expenses, legal and
  accounting, property taxes, salaries, travel, utilities, other.
- Per-property and consolidated totals. Flag uncategorized bills BEFORE
  generating so nothing is silently omitted.
- Export accountant-ready PDF + CSV.
- Line: "Prepared from your records to help you and your accountant. Not tax
  advice — confirm figures before filing."

RENT-INCREASE GUIDELINE:
- Store the annual provincial guideline % with effective year and source URL
  (editable, versioned).
- Calculate: current rent, guideline %, new rent, earliest legal effective date,
  required notice period.
- Generate the N1 pre-filled via the forms engine; schedule the rent change to
  apply only after the notice period.
- BLOCK increases exceeding the guideline or with insufficient notice, with a
  plain-language explanation of why.
All math via lib/money/. Tests against hand-computed fixtures.
```

---

## Part 2 — Provincial forms checklist

**Verify every entry on the official site before mapping.** Form numbers and
versions change. Always download from the government source, and record the exact
URL and effective date in the definition.

### Ontario — Landlord and Tenant Board (tribunalsontario.ca) — LAUNCH PRIORITY
| Form | Purpose | Priority |
|---|---|---|
| Residential Tenancy Agreement (Standard Form of Lease, 2229E) | Mandatory standard lease | **P0** |
| N1 | Notice of Rent Increase | **P0** |
| N4 | Notice to End Tenancy — Non-payment of Rent | **P0** |
| N2 | Rent increase (units not covered by guideline) | P1 |
| N5 | Termination — interference/damage/overcrowding | P1 |
| N6 | Termination — illegal act or misrepresentation | P2 |
| N7 | Termination — serious impairment of safety | P2 |
| N8 | Termination at end of term | P1 |
| N9 | Tenant's Notice to Terminate | P1 |
| N10 | Agreement to Increase Rent Above Guideline | P2 |
| N11 | Agreement to End the Tenancy | P1 |
| N12 | Termination — landlord/purchaser own use | **P1** |
| N13 | Termination — demolition/repair/conversion | P2 |
| L1 | Application to evict for non-payment | P2 |
| L2 | Application to end tenancy | P2 |
| Certificate of Service | Proof of service | **P0** |
| Rent Deposit / Interest calculation | Deposit interest | P1 |

### British Columbia — Residential Tenancy Branch (gov.bc.ca)
Residential Tenancy Agreement (RTB-1) · Notice to End Tenancy for Unpaid Rent
(RTB-30) · Notice for Cause (RTB-33) · Notice for Landlord's Use (RTB-32) ·
Mutual Agreement to End Tenancy (RTB-8) · Condition Inspection Report (RTB-27) ·
Notice of Rent Increase (RTB-7). **Verify current numbers.**

### Alberta — no standard lease
Alberta does not mandate a standard lease — support a **custom template upload**
path. Relevant: Notice to Terminate (14-day / 24-hour for substantial breach),
Notice of Rent Increase, Inspection Report (move-in/move-out are legally
required in Alberta). Reference: Residential Tenancies Act; RTDRS forms.

### Quebec — Tribunal administratif du logement (TAL) — deferred
Mandatory TAL lease form, Notice of Rent Increase, Notice of Modification.
**French-first; requires translation, Quebec privacy review, and counsel.** Do
not attempt before the rest is stable.

### Nova Scotia / New Brunswick — post-launch
NS: Standard Form of Lease, Notice to Quit forms (Residential Tenancies Program).
NB: Standard Form of Lease, Notice of Termination (Residential Tenancies
Tribunal). **Verify on the official provincial sites.**

### Manitoba / Saskatchewan — later
MB: Residential Tenancies Branch standard tenancy agreement + notices.
SK: Office of Residential Tenancies agreement + notices.

**Launch scope recommendation:** ship **Ontario P0 + P1** only. Ontario alone is
the largest English rental market in Canada and depth beats breadth. Add BC next.

---

## Part 3 — Definition of launch-ready

The backend is launch-ready when all of these are true:

- [ ] T1–T15 complete with tests green
- [ ] RLS role tests pass for owner / pm_full / pm_limited / tenant / cross-org
- [ ] `lib/money/` at 100% branch coverage; reconciliation invariant holds
- [ ] Every job proven idempotent by double-run test
- [ ] Stripe webhooks verified, deduped, dead-lettered
- [ ] Ontario P0 forms mapped, `forms:verify` green in CI
- [ ] Data export and account deletion working end to end
- [ ] MFA available; audit log complete and exportable
- [ ] Legal pages reviewed by **Canadian counsel** (ToS, Privacy, form flows)
- [ ] Backups verified by a **tested restore**, not just configured
- [ ] Sentry catching errors; a runbook exists for the top 5 failure modes
- [ ] Load-tested at 10× expected launch volume

**Do not launch without counsel review of the form flows and privacy policy.**
Everything else on this list you can fix in a week; that one can end the company.

---

## Part 4 — Production readiness tasks (launch blockers)

Read `docs/production-readiness.md`. These are **not** optional polish.

**[ ] T18. Observability foundation**
```
TASK T18 — Structured logging, metrics, and alerting.

Implement JSON structured logging where every line carries request_id,
organization_id, user_id, route, duration_ms. Never log PII, secrets, or full
record bodies. Propagate a correlation ID from browser → API → DB → job → email.

Emit metrics and configure alerts per docs/production-readiness.md §2: request
p95 latency, error rate, job failures, job overruns, webhook dead-letter depth,
DB connection saturation, failed-login spikes, and money reconciliation drift.

Add /api/health (liveness) and /api/ready (checks DB, Storage, Stripe, Resend).

Done when: a request can be traced end to end by correlation ID, and each alert
fires when deliberately triggered.
```

**[ ] T19. Scale hardening**
```
TASK T19 — Query performance and scale hardening.

Target: 10,000 units, 1,000 organizations, p95 < 200ms on every user-facing
request.

- Add composite and partial indexes per docs/production-readiness.md §1.
- Convert all list endpoints to cursor-based (keyset) pagination — remove OFFSET.
- Eliminate every N+1 with batched loaders or single queries.
- Add transactionally-maintained denormalized counters (organization.unit_count_
  cached, property.unit_count, lease.balance_cents).
- Partition audit_event and notification by month.
- Seed a load-test dataset (1,000 orgs × 10,000 units) and record EXPLAIN ANALYZE
  for the 20 hottest queries.

Done when: the load test passes at 10× expected launch volume with p95 < 200ms,
and every hot query has a recorded query plan.
```

**[ ] T20. Reliability and safe deployment**
```
TASK T20 — Backups, migrations, feature flags, degradation.

- Verify automated backups + PITR. Perform and DOCUMENT a full restore test.
- Adopt expand → migrate → contract for all schema changes; every migration has a
  tested rollback. Large backfills run as batched jobs, never inside a migration.
- Feature-flag system, per-organization, with kill switches on anything that
  touches money or sends messages.
- Graceful degradation: if screening, e-sign, or the AI provider is unavailable,
  the app stays usable with a clear "temporarily unavailable" state.
- Rate limiting per IP and per organization on auth, AI, exports, bulk sends.
- Write runbooks for: invoice job failure, Stripe webhook backlog, email
  deliverability drop, DB connection exhaustion, storage quota, suspected data
  leak.

Done when: a restore is proven, a flag can disable a money path in production,
and a simulated third-party outage does not break rent tracking.
```

**[ ] T21. Security hardening**
```
TASK T21 — Security hardening and email deliverability.

- CSP, HSTS, X-Frame-Options, X-Content-Type-Options headers.
- Rate-limited login, lockout with backoff, MFA for owners/admins, session
  revocation, forced re-auth for sensitive changes.
- File uploads: type/size validation, virus scanning, signed time-limited URLs,
  no public buckets.
- Dependency scanning in CI; criticals patched within 7 days.
- Secrets rotation procedure documented and rehearsed.
- Configure and VERIFY SPF, DKIM, DMARC — send test mail to Gmail, Outlook, and
  a corporate domain and confirm inbox placement (not spam).

Done when: an abuse simulation is rate-limited, and test emails land in the
inbox on all three providers.
```

**[ ] T22. Nightly reconciliation (the safety net)**
```
TASK T22 — Nightly integrity reconciliation.

A scheduled job that verifies, across every organization:
- The money invariant per lease: sum(invoice_lines) − sum(payments applied) −
  sum(credits applied) = balance_cents.
- Cached counters (unit counts, balances) match their source of truth.
- No orphaned records (invoice without lease, unit without property).
- No lease in an impossible state (active with end_date in the past, etc.).

Any drift raises an immediate alert with the affected organization and record
ids. The job is read-only — it reports, it never auto-corrects.

Done when: the job runs green, and a deliberately corrupted fixture triggers the
alert.
```

**[ ] T23. Online rent payments (highest-value remaining feature)**
```
TASK T23 — Online rent collection via Stripe.

- Pre-authorized debit (PAD) and card payments for tenants, through Stripe.
- Tenant portal: save a payment method, pay a specific invoice, view history.
- Optional autopay per lease, with a clear pre-charge notification and easy
  cancellation.
- FEES ARE PASSED THROUGH OR CONFIGURABLE — never absorbed into the subscription.
  The tenant sees the exact amount and any fee BEFORE confirming.
- Handle: pending → succeeded → failed, PAD returns and NSF (create the NSF
  charge, return the invoice to overdue), refunds, and disputes.
- Webhooks verified, deduped by event id, idempotent, dead-lettered.
- Reconcile every Stripe payout against recorded payments; alert on mismatch.

Done when: a tenant can pay, a failure correctly produces an NSF, and payout
reconciliation is green.
```
