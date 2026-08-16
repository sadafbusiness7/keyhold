# Production readiness & scale

The layer that separates a demo from a system real businesses trust with their
money. **These are launch blockers, not polish.** If you have production
engineering experience, this is where it shows.

Target: **10,000 units and 1,000 organizations without degradation**, while
marketing to small operators.

---

## 1. Scale architecture (design for it now, not later)

**Query budget:** no user-facing request may exceed **200ms p95** at 10,000
units. Every list query is paginated, indexed, and bounded — never `SELECT *`
across an organization.

**Indexing (non-negotiable):**
- Every FK indexed.
- Composite indexes matching real access patterns:
  `(organization_id, status, due_date)` on invoice,
  `(organization_id, property_id, status)` on unit and maintenance_request,
  `(organization_id, created_at DESC)` on audit_event.
- Partial indexes for hot filtered queries (e.g. `WHERE deleted_at IS NULL`,
  `WHERE status = 'overdue'`).
- **Every new query ships with an `EXPLAIN ANALYZE` in the PR description.**

**Denormalized counters** (maintained transactionally, never computed on read):
`organization.unit_count_cached`, `property.unit_count`, `lease.balance_cents`.
A nightly reconciliation job verifies caches against source of truth and alerts
on drift.

**Pagination:** cursor-based (keyset) for all lists — never `OFFSET` on large
tables.

**Partitioning readiness:** `audit_event` and `notification` grow without bound.
Partition by month from day one; retention policy drops or archives old
partitions.

**Connection pooling:** Supabase pooler in transaction mode. Long-running work
never holds a connection — it goes to a job.

**N+1 elimination:** every list endpoint fetches related data in a single query
or a batched loader. A PR that introduces an N+1 is rejected.

## 2. Observability (you cannot fix what you cannot see)

**Structured logging** — JSON, every log line carries `request_id`,
`organization_id`, `user_id`, `route`, `duration_ms`. Never log PII, secrets, or
full record bodies.

**Metrics to emit and alert on:**
| Metric | Alert threshold |
|---|---|
| Request p95 latency | > 500ms for 5 min |
| Error rate | > 1% for 5 min |
| Job failure | any failure, immediately |
| Job overrun | invoice generation not complete by 06:00 |
| Webhook dead-letter depth | > 0 |
| DB connection saturation | > 80% |
| Failed logins | > 20/min from one IP |
| Money reconciliation drift | any non-zero, immediately |

**Correlation IDs** propagate from the browser through API → DB → job → email, so
one user complaint can be traced end to end.

**Health checks:** `/api/health` (liveness) and `/api/ready` (DB, Storage,
Stripe, Resend reachable). A public **status page**.

## 3. Reliability

**Backups:** automated daily + point-in-time recovery. **A restore is tested
monthly and the result recorded** — an untested backup is not a backup.

**RPO / RTO:** define and publish internally. Target RPO ≤ 1 hour, RTO ≤ 4 hours.

**Zero-downtime migrations:** expand → migrate → contract. Never a destructive
change in a single deploy. Every migration has a tested rollback path. Large
backfills run as batched jobs, not in the migration.

**Feature flags:** every risky feature ships behind a flag, enabled per
organization. Kill switch for anything touching money or sending.

**Graceful degradation:** if screening, e-sign, or the AI provider is down, the
app stays usable and shows a clear "temporarily unavailable" state. A third-party
outage never takes down rent tracking.

**Rate limiting:** per-IP and per-organization on auth, AI, exports, and bulk
sends. Exponential backoff on all outbound calls.

**Runbooks** for the top failure modes: invoice job failed, Stripe webhook
backlog, email deliverability drop, DB connection exhaustion, storage quota,
suspected data leak. Each: symptoms → diagnosis → fix → verification.

## 4. Security

- **Secrets:** managed, rotated quarterly, never in the repo or logs. Rotation
  procedure documented and rehearsed.
- **Headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options.
- **Auth hardening:** rate-limited login, account lockout with backoff, MFA for
  owners/admins, session revocation, forced re-auth for sensitive changes.
- **Input validation** at every boundary (zod). Parameterized queries only.
- **File uploads:** type + size validation, virus scanning, served via signed
  time-limited URLs, never public buckets.
- **Dependency scanning** in CI; patch criticals within 7 days.
- **Penetration test before launch**, retest annually.
- **Email auth:** SPF, DKIM, DMARC configured and verified — otherwise your rent
  reminders land in spam and the product silently fails.

## 5. Environments & deployment

Three environments: **local → staging → production.** Staging mirrors production
config with seeded, synthetic data — never a copy of real customer data.

Deploy: trunk-based, CI-gated (lint, typecheck, unit, RLS, money, forms:verify,
e2e smoke), preview deploy per PR, automatic rollback on health-check failure.
**No manual production database edits, ever** — every change is a migration.

## 6. Testing pyramid

| Layer | Coverage requirement |
|---|---|
| Unit (money, forms, pure logic) | 100% branch on `lib/money/` |
| RLS / authorization | every table × every role |
| Integration (API + DB) | every mutation endpoint |
| State machines | every illegal transition rejected |
| Idempotency | every job and webhook double-run |
| E2E smoke | sign-up → property → tenant → lease → invoice → payment |
| **Load** | **10× expected launch volume before go-live** |
| Accessibility | automated axe + manual screen-reader on core flows |

## 7. Data integrity

- **Foreign keys enforced** at the DB level — never application-only.
- **Check constraints** on money (`amount_cents >= 0` where applicable), dates
  (`end_date > start_date`), and enums.
- **Unique constraints** for natural keys (unit label per property, idempotency
  keys).
- **Nightly reconciliation job:** verifies the money invariant across all leases,
  verifies cached counters, and **alerts on any drift**. This is the single most
  valuable safety net in the system.
- **Immutable records:** issued statements, generated notices, and audit events
  are append-only. Corrections create new records, never edits.

## 8. Launch gate checklist

- [ ] Load test at 10× expected volume; p95 < 200ms
- [ ] Restore from backup tested and documented
- [ ] Runbooks written for the top 6 failure modes
- [ ] Alerting verified (deliberately trigger each alert)
- [ ] Penetration test complete; criticals resolved
- [ ] SPF/DKIM/DMARC verified; test sends land in inbox
- [ ] Staging environment mirrors production
- [ ] Feature flags + kill switches working
- [ ] Rate limiting verified under abuse simulation
- [ ] Nightly reconciliation job green for 14 consecutive days
- [ ] Status page live; incident process documented
- [ ] Counsel review: ToS, privacy policy, form flows
