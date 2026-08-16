/**
 * REPORT ENGINE — deterministic reporting + analytics maths.
 * ----------------------------------------------------------
 * Extends finance-engine.ts with the reports and Insights figures that the
 * money screens don't already cover: maintenance summaries, vendor spend,
 * lease expiry, deposit ledger, KPIs, trends and comparisons.
 *
 * Rules that never bend here:
 *   • Pure functions only — no React, no state, no randomness, no clock reads.
 *   • Amounts are INTEGER CENTS; only the formatter converts back to dollars.
 *   • Nothing is inferred or generated. Every number traces to an input row.
 *   • Portfolio signals are DESCRIPTIVE counts only — never a tenant score,
 *     ranking or automated judgement about a person.
 */
import type { Property, Unit, Tenant, Lease } from "@/lib/mock-data";
import type { Invoice, Payment } from "@/lib/rent-engine";
import { balanceCents } from "@/lib/rent-engine";
import type { Bill, MaintenanceRequest, Vendor, WorkOrder } from "@/lib/maintenance-engine";
import { billTotalCents } from "@/lib/maintenance-engine";
import { daysBetween, inRange, type DateRange } from "@/lib/finance-engine";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const monthLabel = (period: string) => `${MONTHS[Number(period.slice(5, 7)) - 1]} ${period.slice(2, 4)}`;

/** "2026-08" -> "August 2026" — for prose, where "Aug 26" reads like a date. */
export function monthYearLabel(period: string) {
  const full = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${full[Number(period.slice(5, 7)) - 1]} ${period.slice(0, 4)}`;
}

/** Whole months from `period`, keeping the YYYY-MM shape. */
export function shiftPeriod(period: string, n: number) {
  const y = Number(period.slice(0, 4));
  const m = Number(period.slice(5, 7));
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** The n periods ending with the month of `today`, oldest first. */
export function periodsEnding(today: string, n: number) {
  const base = today.slice(0, 7);
  return Array.from({ length: n }, (_, i) => shiftPeriod(base, i - (n - 1)));
}

export function periodRange(period: string): DateRange {
  const [y, m] = period.split("-").map(Number);
  const last = new Date(Date.UTC(y!, m!, 0)).getUTCDate();
  return { from: `${period}-01`, to: `${period}-${String(last).padStart(2, "0")}` };
}

export const pct = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10);

/* ------------------------------------------------------------------ */
/* Maintenance summary                                                 */
/* ------------------------------------------------------------------ */

export type MaintenanceSummaryRow = {
  propertyId: string;
  property: string;
  opened: number;
  resolved: number;
  openNow: number;
  avgResolutionDays: number;
  costCents: number;
  costPerUnitCents: number;
};

/** Resolution time is measured from request opened to its work order completion. */
export function maintenanceSummary(args: {
  properties: Property[];
  units: Unit[];
  requests: MaintenanceRequest[];
  workOrders: WorkOrder[];
  bills: Bill[];
  range: DateRange;
}): MaintenanceSummaryRow[] {
  return args.properties.map((property) => {
    const opened = args.requests.filter((r) => r.propertyId === property.id && inRange(r.openedOn, args.range));
    const unitCount = args.units.filter((u) => u.propertyId === property.id).length;
    const durations: number[] = [];
    let resolved = 0;
    for (const request of opened) {
      const wo = args.workOrders.find((w) => w.requestId === request.id && w.completedOn);
      if (request.status === "resolved" || wo?.completedOn) {
        resolved += 1;
        if (wo?.completedOn) durations.push(Math.max(0, daysBetween(request.openedOn, wo.completedOn)));
      }
    }
    const costCents = args.bills
      .filter((b) => b.propertyId === property.id && b.status === "approved" && inRange(b.issuedOn, args.range))
      .reduce((s, b) => s + billTotalCents(b), 0);
    return {
      propertyId: property.id,
      property: property.name,
      opened: opened.length,
      resolved,
      openNow: opened.length - resolved,
      avgResolutionDays: durations.length
        ? Math.round((durations.reduce((s, d) => s + d, 0) / durations.length) * 10) / 10
        : 0,
      costCents,
      costPerUnitCents: unitCount ? Math.round(costCents / unitCount) : 0,
    };
  });
}

export type CategoryCostRow = { category: string; jobs: number; costCents: number };

export function maintenanceByCategory(args: {
  requests: MaintenanceRequest[];
  workOrders: WorkOrder[];
  bills: Bill[];
}): CategoryCostRow[] {
  const acc = new Map<string, CategoryCostRow>();
  const bump = (category: string, jobs: number, costCents: number) => {
    const row = acc.get(category) ?? { category, jobs: 0, costCents: 0 };
    row.jobs += jobs;
    row.costCents += costCents;
    acc.set(category, row);
  };
  for (const request of args.requests) bump(request.category, 1, 0);
  for (const bill of args.bills) {
    if (bill.status !== "approved") continue;
    const wo = args.workOrders.find((w) => w.id === bill.workOrderId);
    const req = wo ? args.requests.find((r) => r.id === wo.requestId) : undefined;
    bump(req?.category ?? "Other work", 0, billTotalCents(bill));
  }
  return [...acc.values()].sort((a, b) => b.costCents - a.costCents || b.jobs - a.jobs);
}

/* ------------------------------------------------------------------ */
/* Vendor spend                                                        */
/* ------------------------------------------------------------------ */

export type VendorSpendRow = {
  vendorId: string;
  vendor: string;
  trade: string;
  jobs: number;
  billsApproved: number;
  spentCents: number;
  awaitingCents: number;
  avgBillCents: number;
  lastJob: string;
};

export function vendorSpend(args: {
  vendors: Vendor[];
  workOrders: WorkOrder[];
  bills: Bill[];
  range: DateRange;
}): VendorSpendRow[] {
  return args.vendors
    .map((vendor) => {
      const bills = args.bills.filter((b) => b.vendorId === vendor.id && inRange(b.issuedOn, args.range));
      const approved = bills.filter((b) => b.status === "approved");
      const awaiting = bills.filter((b) => b.status === "awaiting-approval");
      const jobs = args.workOrders.filter(
        (w) => w.vendorId === vendor.id && inRange(w.createdOn, args.range),
      );
      const spentCents = approved.reduce((s, b) => s + billTotalCents(b), 0);
      const dates = jobs.map((w) => w.completedOn ?? w.scheduledFor ?? w.createdOn).sort();
      return {
        vendorId: vendor.id,
        vendor: vendor.name,
        trade: vendor.trade,
        jobs: jobs.length,
        billsApproved: approved.length,
        spentCents,
        awaitingCents: awaiting.reduce((s, b) => s + billTotalCents(b), 0),
        avgBillCents: approved.length ? Math.round(spentCents / approved.length) : 0,
        lastJob: dates.length ? dates[dates.length - 1]! : "—",
      };
    })
    .sort((a, b) => b.spentCents - a.spentCents || a.vendor.localeCompare(b.vendor));
}

/* ------------------------------------------------------------------ */
/* Lease expiry schedule                                               */
/* ------------------------------------------------------------------ */

export type LeaseExpiryRow = {
  leaseId: string;
  property: string;
  unit: string;
  tenant: string;
  termType: string;
  endDate: string;
  monthLabel: string;
  daysToEnd: number;
  rentCents: number;
};

/** Every lease ending inside the next `months` months, soonest first. */
export function leaseExpirySchedule(args: {
  leases: Lease[];
  units: Unit[];
  properties: Property[];
  tenants: Tenant[];
  today: string;
  months?: number;
}): LeaseExpiryRow[] {
  const horizonPeriod = shiftPeriod(args.today.slice(0, 7), (args.months ?? 12) - 1);
  const horizon = periodRange(horizonPeriod).to;
  const rows: LeaseExpiryRow[] = [];
  for (const lease of args.leases) {
    if (lease.end < args.today || lease.end > horizon) continue;
    const unit = args.units.find((u) => u.id === lease.unitId);
    if (!unit) continue;
    rows.push({
      leaseId: lease.id,
      property: args.properties.find((p) => p.id === unit.propertyId)?.name ?? "—",
      unit: unit.label,
      tenant: args.tenants.find((t) => t.id === lease.tenantId)?.name ?? "—",
      termType: lease.type,
      endDate: lease.end,
      monthLabel: monthLabel(lease.end.slice(0, 7)),
      daysToEnd: daysBetween(args.today, lease.end),
      rentCents: Math.round(lease.rent * 100),
    });
  }
  return rows.sort((a, b) => a.endDate.localeCompare(b.endDate));
}

/** Count of leases ending per month across the horizon — zero months included. */
export function expiriesByMonth(rows: LeaseExpiryRow[], today: string, months = 12) {
  const periods = Array.from({ length: months }, (_, i) => shiftPeriod(today.slice(0, 7), i));
  return periods.map((period) => {
    const scoped = rows.filter((r) => r.endDate.slice(0, 7) === period);
    return {
      label: monthLabel(period),
      leases: scoped.length,
      rentCents: scoped.reduce((s, r) => s + r.rentCents, 0),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Security deposit ledger                                             */
/* ------------------------------------------------------------------ */

export type DepositState = "Held" | "Returned";
export type DepositRow = {
  leaseId: string;
  property: string;
  unit: string;
  tenant: string;
  heldCents: number;
  appliedCents: number;
  returnedCents: number;
  state: DepositState;
  since: string;
};

/**
 * Deposits are tracked per lease. A lease that has already ended has had its
 * deposit returned (less anything applied to a damage or final invoice for
 * that tenant); a running lease still holds it.
 */
export function depositLedger(args: {
  leases: Lease[];
  units: Unit[];
  properties: Property[];
  tenants: Tenant[];
  invoices: Invoice[];
  payments: Payment[];
  today: string;
}): DepositRow[] {
  return args.leases
    .map((lease) => {
      const unit = args.units.find((u) => u.id === lease.unitId);
      const heldCents = Math.round(lease.depositHeld * 100);
      const ended = lease.end < args.today;
      const appliedCents = ended
        ? args.invoices
            .filter((i) => i.tenantId === lease.tenantId && !i.voidedOn && i.kind === "damage")
            .reduce((s, i) => s + Math.min(i.amountCents, Math.max(0, balanceCents(i, args.payments))), 0)
        : 0;
      const returnedCents = ended ? Math.max(0, heldCents - appliedCents) : 0;
      return {
        leaseId: lease.id,
        property: args.properties.find((p) => p.id === unit?.propertyId)?.name ?? "—",
        unit: unit?.label ?? "—",
        tenant: args.tenants.find((t) => t.id === lease.tenantId)?.name ?? "—",
        heldCents: ended ? 0 : heldCents,
        appliedCents,
        returnedCents,
        state: (ended ? "Returned" : "Held") as DepositState,
        since: ended ? lease.end : lease.start,
      };
    })
    .sort((a, b) => a.property.localeCompare(b.property) || a.unit.localeCompare(b.unit));
}

/* ------------------------------------------------------------------ */
/* Trends                                                              */
/* ------------------------------------------------------------------ */

export type MonthMoney = { period: string; label: string; expectedCents: number; collectedCents: number; ratePct: number };

export function collectionByMonth(args: { invoices: Invoice[]; payments: Payment[]; today: string; months?: number }): MonthMoney[] {
  const live = args.invoices.filter((i) => !i.voidedOn);
  const paidByInvoice = new Map<string, number>();
  for (const p of args.payments) {
    if (p.reversedOn) continue;
    paidByInvoice.set(p.invoiceId, (paidByInvoice.get(p.invoiceId) ?? 0) + p.amountCents);
  }
  return periodsEnding(args.today, args.months ?? 12).map((period) => {
    const scoped = live.filter((i) => i.period === period);
    const expectedCents = scoped.reduce((s, i) => s + i.amountCents, 0);
    const collectedCents = scoped.reduce(
      (s, i) => s + Math.min(i.amountCents, (paidByInvoice.get(i.id) ?? 0) + i.creditAppliedCents),
      0,
    );
    return { period, label: monthLabel(period), expectedCents, collectedCents, ratePct: pct(collectedCents, expectedCents) };
  });
}

export type ExpensePoint = { label: string; period: string; expenseCents: number; incomeCents: number; noiCents: number };

export function expenseTrend(args: {
  invoices: Invoice[];
  payments: Payment[];
  bills: Bill[];
  today: string;
  months?: number;
}): ExpensePoint[] {
  const byInvoice = new Map(args.invoices.map((i) => [i.id, i]));
  return periodsEnding(args.today, args.months ?? 12).map((period) => {
    const range = periodRange(period);
    const incomeCents = args.payments
      .filter((p) => !p.reversedOn && inRange(p.receivedOn, range) && byInvoice.has(p.invoiceId))
      .reduce((s, p) => s + p.amountCents, 0);
    const expenseCents = args.bills
      .filter((b) => b.status === "approved" && inRange(b.issuedOn, range))
      .reduce((s, b) => s + billTotalCents(b), 0);
    return { period, label: monthLabel(period), incomeCents, expenseCents, noiCents: incomeCents - expenseCents };
  });
}

export type NoiRow = { propertyId: string; property: string; incomeCents: number; expenseCents: number; noiCents: number; marginPct: number };

/** Net operating income, cash basis: money received less approved bills. */
export function noiByProperty(args: {
  properties: Property[];
  units: Unit[];
  invoices: Invoice[];
  payments: Payment[];
  bills: Bill[];
  range: DateRange;
}): NoiRow[] {
  const byInvoice = new Map(args.invoices.map((i) => [i.id, i]));
  const unitProperty = new Map(args.units.map((u) => [u.id, u.propertyId]));
  return args.properties.map((property) => {
    const incomeCents = args.payments.reduce((s, p) => {
      if (p.reversedOn || !inRange(p.receivedOn, args.range)) return s;
      const invoice = byInvoice.get(p.invoiceId);
      if (!invoice || invoice.voidedOn || unitProperty.get(invoice.unitId) !== property.id) return s;
      return s + p.amountCents;
    }, 0);
    const expenseCents = args.bills
      .filter((b) => b.propertyId === property.id && b.status === "approved" && inRange(b.issuedOn, args.range))
      .reduce((s, b) => s + billTotalCents(b), 0);
    return {
      propertyId: property.id,
      property: property.name,
      incomeCents,
      expenseCents,
      noiCents: incomeCents - expenseCents,
      marginPct: pct(incomeCents - expenseCents, incomeCents),
    };
  });
}

/* ------------------------------------------------------------------ */
/* KPIs                                                                */
/* ------------------------------------------------------------------ */

export type Kpi = {
  id: string;
  label: string;
  value: number;
  previous: number;
  format: "pct" | "days" | "money" | "count";
  /** true when a rise is the good direction */
  higherIsBetter: boolean;
  help: string;
};

export const kpiDelta = (kpi: Kpi) => Math.round((kpi.value - kpi.previous) * 10) / 10;

/** "up and that's good", "down and that's bad", or flat — never colour alone. */
export function kpiTone(kpi: Kpi): "good" | "bad" | "flat" {
  const delta = kpiDelta(kpi);
  if (delta === 0) return "flat";
  return delta > 0 === kpi.higherIsBetter ? "good" : "bad";
}

/** Average days between an invoice's due date and the payment that settled it. */
export function averageDaysToPay(args: { invoices: Invoice[]; payments: Payment[]; range: DateRange }) {
  const byInvoice = new Map(args.invoices.map((i) => [i.id, i]));
  let total = 0;
  let counted = 0;
  for (const p of args.payments) {
    if (p.reversedOn || !inRange(p.receivedOn, args.range)) continue;
    const invoice = byInvoice.get(p.invoiceId);
    if (!invoice || invoice.voidedOn) continue;
    total += daysBetween(invoice.dueDate, p.receivedOn);
    counted += 1;
  }
  return counted ? Math.round((total / counted) * 10) / 10 : 0;
}

/** Tenancies that ended in the range, as a share of all homes. */
export function turnoverRatePct(args: { leases: Lease[]; units: Unit[]; range: DateRange }) {
  const ended = args.leases.filter((l) => inRange(l.end, args.range)).length;
  return pct(ended, args.units.length);
}

export function collectionRatePct(args: { invoices: Invoice[]; payments: Payment[]; range: DateRange }) {
  const scoped = args.invoices.filter((i) => !i.voidedOn && inRange(i.dueDate, args.range));
  const expected = scoped.reduce((s, i) => s + i.amountCents, 0);
  const ids = new Set(scoped.map((i) => i.id));
  const collected = args.payments
    .filter((p) => !p.reversedOn && ids.has(p.invoiceId))
    .reduce((s, p) => s + p.amountCents, 0);
  return pct(Math.min(collected, expected), expected);
}

export function maintenanceCostPerUnitCents(args: { bills: Bill[]; units: Unit[]; range: DateRange }) {
  const total = args.bills
    .filter((b) => b.status === "approved" && inRange(b.issuedOn, args.range))
    .reduce((s, b) => s + billTotalCents(b), 0);
  return args.units.length ? Math.round(total / args.units.length) : 0;
}

export function buildKpis(args: {
  invoices: Invoice[];
  payments: Payment[];
  bills: Bill[];
  leases: Lease[];
  units: Unit[];
  range: DateRange;
  previous: DateRange;
}): Kpi[] {
  const of = (range: DateRange) => ({
    collection: collectionRatePct({ invoices: args.invoices, payments: args.payments, range }),
    daysToPay: averageDaysToPay({ invoices: args.invoices, payments: args.payments, range }),
    costPerUnit: maintenanceCostPerUnitCents({ bills: args.bills, units: args.units, range }),
    turnover: turnoverRatePct({ leases: args.leases, units: args.units, range }),
  });
  const now = of(args.range);
  const before = of(args.previous);
  return [
    {
      id: "collection",
      label: "Collection rate",
      value: now.collection,
      previous: before.collection,
      format: "pct",
      higherIsBetter: true,
      help: "Rent collected against rent charged in the period.",
    },
    {
      id: "days-to-pay",
      label: "Average days to pay",
      value: now.daysToPay,
      previous: before.daysToPay,
      format: "days",
      higherIsBetter: false,
      help: "Days between the due date and the payment landing. Negative means early.",
    },
    {
      id: "cost-per-unit",
      label: "Maintenance per home",
      value: now.costPerUnit,
      previous: before.costPerUnit,
      format: "money",
      higherIsBetter: false,
      help: "Approved repair bills divided by the number of homes.",
    },
    {
      id: "turnover",
      label: "Turnover rate",
      value: now.turnover,
      previous: before.turnover,
      format: "pct",
      higherIsBetter: false,
      help: "Tenancies that ended in the period, as a share of all homes.",
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Portfolio health signals — descriptive only                         */
/* ------------------------------------------------------------------ */

export type RepeatIssueRow = {
  unitId: string;
  unit: string;
  property: string;
  requests: number;
  categories: string[];
  costCents: number;
};

/** Homes with `threshold`+ requests in the period. A count, not a verdict. */
export function repeatedIssueUnits(args: {
  requests: MaintenanceRequest[];
  workOrders: WorkOrder[];
  bills: Bill[];
  units: Unit[];
  properties: Property[];
  range: DateRange;
  threshold?: number;
}): RepeatIssueRow[] {
  const min = args.threshold ?? 2;
  const acc = new Map<string, { requests: number; categories: Set<string> }>();
  for (const request of args.requests) {
    if (!inRange(request.openedOn, args.range)) continue;
    const entry = acc.get(request.unitId) ?? { requests: 0, categories: new Set<string>() };
    entry.requests += 1;
    entry.categories.add(request.category);
    acc.set(request.unitId, entry);
  }
  return [...acc.entries()]
    .filter(([, v]) => v.requests >= min)
    .map(([unitId, v]) => {
      const unit = args.units.find((u) => u.id === unitId);
      const costCents = args.bills
        .filter((b) => b.unitId === unitId && b.status === "approved" && inRange(b.issuedOn, args.range))
        .reduce((s, b) => s + billTotalCents(b), 0);
      return {
        unitId,
        unit: unit?.label ?? "—",
        property: args.properties.find((p) => p.id === unit?.propertyId)?.name ?? "—",
        requests: v.requests,
        categories: [...v.categories],
        costCents,
      };
    })
    .sort((a, b) => b.requests - a.requests || b.costCents - a.costCents);
}

export type PaymentPatternRow = {
  tenantId: string;
  tenant: string;
  property: string;
  recentAvgDaysLate: number;
  earlierAvgDaysLate: number;
  changeDays: number;
  direction: "later" | "earlier" | "steady";
  paymentsCounted: number;
};

/**
 * Compares each tenant's average days-late in the most recent half of the
 * window against the earlier half. DESCRIPTIVE ONLY: this is a plain
 * observation of dates, never a score, ranking or recommendation.
 */
export function paymentPatterns(args: {
  invoices: Invoice[];
  payments: Payment[];
  units: Unit[];
  properties: Property[];
  tenants: Tenant[];
  today: string;
  months?: number;
}): PaymentPatternRow[] {
  const months = args.months ?? 6;
  const periods = periodsEnding(args.today, months);
  const split = periods[Math.floor(months / 2)]!;
  const from = periodRange(periods[0]!).from;
  const byInvoice = new Map(args.invoices.map((i) => [i.id, i]));
  const acc = new Map<string, { recent: number[]; earlier: number[] }>();

  for (const p of args.payments) {
    if (p.reversedOn || p.receivedOn < from || p.receivedOn > args.today) continue;
    const invoice = byInvoice.get(p.invoiceId);
    if (!invoice || invoice.voidedOn) continue;
    const late = daysBetween(invoice.dueDate, p.receivedOn);
    const entry = acc.get(p.tenantId) ?? { recent: [], earlier: [] };
    (p.receivedOn.slice(0, 7) >= split ? entry.recent : entry.earlier).push(late);
    acc.set(p.tenantId, entry);
  }

  const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10 : 0);

  return [...acc.entries()]
    .filter(([, v]) => v.recent.length > 0 && v.earlier.length > 0)
    .map(([tenantId, v]) => {
      const tenant = args.tenants.find((t) => t.id === tenantId);
      const unit = args.units.find((u) => u.id === tenant?.unitId);
      const recentAvgDaysLate = mean(v.recent);
      const earlierAvgDaysLate = mean(v.earlier);
      const changeDays = Math.round((recentAvgDaysLate - earlierAvgDaysLate) * 10) / 10;
      return {
        tenantId,
        tenant: tenant?.name ?? "—",
        property: args.properties.find((p) => p.id === unit?.propertyId)?.name ?? "—",
        recentAvgDaysLate,
        earlierAvgDaysLate,
        changeDays,
        direction: (changeDays > 0.5 ? "later" : changeDays < -0.5 ? "earlier" : "steady") as PaymentPatternRow["direction"],
        paymentsCounted: v.recent.length + v.earlier.length,
      };
    })
    .sort((a, b) => b.changeDays - a.changeDays);
}

/* ------------------------------------------------------------------ */
/* Saved views                                                         */
/* ------------------------------------------------------------------ */

export type SavedView = {
  id: string;
  name: string;
  report: string;
  propertyId: string;
  from: string;
  to: string;
};

const VIEWS_KEY = "keyhold.report-views.v1";

export function loadSavedViews(): SavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(VIEWS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SavedView[]) : [];
  } catch {
    return [];
  }
}

export function storeSavedViews(views: SavedView[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VIEWS_KEY, JSON.stringify(views));
  } catch {
    /* storage unavailable — views simply don't persist */
  }
}

/* ------------------------------------------------------------------ */
/* Vacancy                                                             */
/* ------------------------------------------------------------------ */

/** MOCK: a stable "empty since" date per home so figures never jitter. */
export function vacantSinceFor(unitId: string, today: string) {
  const seed = unitId.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const days = 8 + (seed % 70);
  return new Date(Date.parse(`${today}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);
}

export type VacancyRow = {
  unitId: string;
  property: string;
  unit: string;
  status: "Lived in" | "Empty";
  daysVacant: number;
  askingRentCents: number;
  lostRentCents: number;
};

export function vacancyDetail(args: { properties: Property[]; units: Unit[]; today: string }): VacancyRow[] {
  return args.units.map((unit) => {
    const empty = !unit.tenantId;
    const daysVacant = empty ? Math.max(0, daysBetween(vacantSinceFor(unit.id, args.today), args.today)) : 0;
    const askingRentCents = Math.round(unit.rent * 100);
    return {
      unitId: unit.id,
      property: args.properties.find((p) => p.id === unit.propertyId)?.name ?? "—",
      unit: unit.label,
      status: (empty ? "Empty" : "Lived in") as VacancyRow["status"],
      daysVacant,
      askingRentCents,
      lostRentCents: Math.round((askingRentCents * daysVacant) / 30),
    };
  });
}
