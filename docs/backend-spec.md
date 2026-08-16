# Backend build specification (production)

The spec the backend is built against. `backend-setup.md` covers *what services*
we use; this covers *how the system must behave*. When an AI coding agent
(Claude Code, Antigravity, etc.) builds a module, it reads this file first.

**Three rules that override convenience everywhere:**
1. **Money is deterministic.** Every amount is computed by tested code, stored in
   integer cents, never by an LLM, never in floats.
2. **Permissions live in the database.** RLS is the boundary. UI hiding is
   cosmetic and is never the control.
3. **Nothing important is silent.** Every state change writes an audit event.

---

## 1. Foundations

**Tenancy root:** `organization`. Every business table carries `organization_id`
and is scoped by RLS. One org = one Owner account (may represent a small PM
company). Multi-owner accounting is deferred (see `master-strategy.md`).

**Conventions**
- `uuid` primary keys; `created_at`, `updated_at`, `created_by` on every table.
- Money: `bigint` **cents** + `currency` (`CAD`). Never float, never decimal-as-text.
- Soft delete: `deleted_at` on records with legal/audit value (leases, invoices,
  payments, notices, inspections, documents, tenants). Hard delete only via the
  privacy-deletion path.
- All timestamps `timestamptz`, stored UTC. Province drives display timezone.
- Enums as Postgres enums or `text` + `CHECK`; never free strings for status.
- Every foreign key indexed. Every list query has a covering index.

## 2. Core schema (build in this order)

```
organization(id, name, legal_name, province, timezone, locale, plan_tier,
             stripe_customer_id, unit_count_cached, created_at, ...)

app_user(id, auth_user_id→supabase, organization_id, account_type
         ['owner'|'pm'|'tenant'], full_name, email, phone, status
         ['invited'|'active'|'suspended'], mfa_enabled, last_login_at)

property(id, organization_id, name, address_line1, city, province, postal_code,
         property_type, owner_contact_id?, is_managed_for_owner bool,
         management_fee_type?, management_fee_value?, created_at, deleted_at)

unit(id, organization_id, property_id, label, bedrooms, bathrooms,
     market_rent_cents, status ['occupied'|'vacant'|'notice'|'offline'])

property_assignment(id, organization_id, pm_user_id, property_id,
                    level ['full'|'limited'], granted_by, granted_at, revoked_at)
   -- the mechanism for "different managers for different regions"

tenant(id, organization_id, full_name, email, phone, portal_status,
       moved_out_at?, forwarding_address?)

lease(id, organization_id, unit_id, status ['draft'|'out_for_signature'|
      'active'|'expiring'|'ended'|'terminated'], start_date, end_date,
      rent_cents, rent_due_day, deposit_cents, last_month_rent_cents,
      insurance_required bool, insurance_min_coverage_cents?,
      document_id?, signed_at?, locked bool)

lease_tenant(lease_id, tenant_id, is_primary, rent_share_cents?)

invoice(id, organization_id, lease_id, unit_id, period_start, period_end,
        due_date, status ['draft'|'open'|'part_paid'|'paid'|'overdue'|'void'],
        subtotal_cents, tax_cents, total_cents, balance_cents,
        idempotency_key UNIQUE)   -- prevents duplicate monthly generation

invoice_line(id, invoice_id, kind ['rent'|'parking'|'storage'|'utility'|
             'late_fee'|'nsf'|'damage'|'other'], description,
             amount_cents, tax_code, tax_cents)

payment(id, organization_id, invoice_id?, tenant_id, method ['etransfer'|
        'cheque'|'cash'|'card'|'pad'], amount_cents, received_at,
        processor_ref?, status ['recorded'|'cleared'|'reversed'],
        reversed_reason?, recorded_by)

tenant_credit(id, organization_id, tenant_id, amount_cents, source, applied_to?)

maintenance_request(id, organization_id, unit_id, submitted_by, category,
                    subcategory, description, urgency ['emergency'|'high'|
                    'normal'|'low'], permission_to_enter bool, preferred_time?,
                    status ['new'|'triaged'|'scheduled'|'in_progress'|
                    'resolved'|'closed'], resolved_at?)

work_order(id, organization_id, request_id, vendor_id?, scope, access_notes,
           scheduled_for?, status, cost_estimate_cents?)

vendor(id, organization_id, name, trade, email, phone, insurance_expiry?,
       is_preferred bool)

bill(id, organization_id, vendor_id, property_id?, unit_id?, work_order_id?,
     status ['draft'|'pending_approval'|'approved'|'paid'|'void'],
     subtotal_cents, tax_cents, total_cents, due_date, approved_by?, approved_at?)

notice(id, organization_id, lease_id, form_type ['N1'|'N4'|...], province,
       generated_at, served_at?, service_method?, effective_date?,
       document_id, form_version, source_url, created_by)

inspection(id, organization_id, unit_id, template_id, kind ['move_in'|
           'move_out'|'periodic'], performed_at, performed_by,
           tenant_signed_at?, manager_signed_at?, paired_inspection_id?)

document(id, organization_id, scope_type, scope_id, category, filename,
         storage_path, visibility ['private'|'shared_with_tenant'|'shared_with_owner'],
         review_date?, expiry_date?, version, uploaded_by)

consent_record(id, organization_id, person_id, person_type, consent_type
               ['credit_check'|'e_sign'|'e_comms'|'rent_reporting'|'marketing'],
               granted_at, withdrawn_at?, version, method, ip)

notification(id, organization_id, user_id, kind, payload jsonb, read_at?,
             entity_type, entity_id)

audit_event(id, organization_id, actor_user_id, action, entity_type, entity_id,
            before jsonb, after jsonb, ip, user_agent, created_at)
```

## 3. Row-level security (the real permission layer)

Enable RLS on **every** table. Policy patterns:

**Owner** — full access where `organization_id = current_org()`.

**Property Manager** — access only to rows whose property is in their active
assignments:
```sql
property_id IN (
  SELECT property_id FROM property_assignment
  WHERE pm_user_id = auth.uid() AND revoked_at IS NULL
)
```
For `limited` level, additionally deny all financial tables (`invoice`,
`payment`, `bill`, `tenant_credit`, reports) — enforce by policy, not by UI.

**Tenant** — access only rows tied to their own lease/unit:
```sql
lease_id IN (SELECT lease_id FROM lease_tenant WHERE tenant_id = current_tenant())
```
Tenants get **zero** access to `invoice` rows of others, any `bill`, any
`property_assignment`, any report, any other tenant's `document`.

**Owner-contact (owner portal)** — read-only, restricted to their properties and
only to statement/summary views, never operational tables.

**Test requirement:** for every table, a test proves a PM cannot read an
unassigned property's row and a tenant cannot read another unit's row —
by querying with that role's JWT, not by checking the UI.

## 4. State machines (enforce transitions in code, not by free updates)

**Application → Lease → Tenancy**
```
prospect: new → screening_requested → references_received → approved | declined
lease:    draft → out_for_signature → active → expiring → ended | terminated
```
- A lease may only be created from an `approved` prospect (or the explicit
  "existing tenant" path).
- On first signature, `lease.locked = true`; edits require an explicit
  `revert_signature` action that voids collected signatures and writes an audit
  event.
- `active` lease creation **schedules** the first invoice; it never creates
  invoices retroactively.

**Invoice → Payment**
```
invoice: draft → open → part_paid → paid
                    ↘ overdue ↗
                    ↘ void
payment: recorded → cleared | reversed(NSF)
```
- NSF: reverse the payment, create an `nsf` invoice line per the configured
  charge, return the invoice to `overdue`. Never mutate the original rent line.
- Overpayment creates a `tenant_credit`; auto-apply (if enabled) consumes credit
  oldest-first until zero.
- Last-month-rent applies **only** to the final invoice of an ending lease.

**Maintenance → Work order → Bill**
```
request: new → triaged → scheduled → in_progress → resolved → closed
bill:    draft → pending_approval → approved → paid
```
Approval requires a different user than the creator when the org has >1 admin.

## 5. Money rules (non-negotiable)

- **Integer cents everywhere.** Compute in cents; format at the edge.
- **Rounding:** half-up, at the line level, then sum. Never sum-then-round.
- **Tax:** rate resolved by province + tax code at invoice creation time and
  **stored on the line** (historical invoices must never change when rates change).
- **Idempotency:** monthly invoice generation keyed
  `lease_id + period_start`; a re-run must be a no-op. Same for webhook handlers.
- **Proration:** by days-in-period, computed in cents, remainder to the final day.
- **Late fees:** applied by a scheduled job only after `due_date + grace_days`;
  capped by the configured maximum; produce a reviewable batch the user can waive
  before it commits.
- **Owner disbursement:** `collected income − expenses − management fee = net
  payable`; fee basis (% collected / % invoiced / flat) stored on the property,
  and the computed statement snapshot is **immutable** once issued.
- Every money mutation writes an `audit_event` with before/after.
- **Reconciliation invariant (test it):** for any lease and period,
  `sum(invoice_lines) − sum(payments applied) − sum(credits applied) = balance`.

## 6. Jobs & scheduling

| Job | Cadence | Must be |
|---|---|---|
| Generate monthly invoices | daily (checks due leases) | idempotent |
| Mark overdue | daily | idempotent |
| Apply late fees | daily, after grace | batched + reviewable |
| Lease expiry / renewal reminders | daily | idempotent |
| Insurance + document expiry reminders | daily | idempotent |
| Digest emails | daily/weekly per prefs | idempotent |
| Rent-increase effective-date application | daily | writes audit |

All jobs: run in a transaction, log start/end, record failures to a dead-letter
table, and be safely re-runnable. Never let a failed job silently skip a month.

## 7. API boundaries

- Server-side only for anything touching secrets, money, or another user's data.
- Typed contracts (zod/TypeScript) shared with the frontend; the frontend never
  reaches the DB shape directly.
- Every mutation endpoint: authz check → validation → transaction → audit write.
- Webhooks (Stripe, e-sign, screening): verify signature, dedupe by event id,
  process idempotently, retry with backoff, dead-letter after N attempts.

## 8. Testing gates (a module isn't done until these pass)

1. **RLS tests** per role: owner / PM-full / PM-limited / tenant / owner-contact.
2. **Money tests:** rounding, tax, proration, NSF, credit application,
   last-month-rent, late-fee cap, disbursement math, and the reconciliation
   invariant.
3. **State-machine tests:** every illegal transition is rejected.
4. **Idempotency tests:** every job and webhook re-run produces no duplicates.
5. **Audit tests:** every money and permission mutation writes an event.

## 9. Build order (dependency-correct)

1. Org, users, auth, roles, `property_assignment`, **RLS + role tests**
2. Property, unit, tenant, document storage
3. Lease + lease_tenant + state machine + e-sign status
4. Invoice + line + payment + credits + **money test suite**
5. Scheduled jobs (invoice generation, overdue, reminders)
6. Maintenance → work order → vendor → bill + approvals
7. Notices (N1/N4) + form versioning + audit
8. Reports + owner disbursement
9. Inspections, assets, announcements, insurance
10. Notifications, activity feed, audit-log UI
11. Subscription + plan-limit enforcement
12. Privacy surface (export, delete, consent, retention)
13. T776 package, rent-increase guideline automation

Do not start a step before its dependencies pass their tests.
