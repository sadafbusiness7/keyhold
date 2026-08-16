/**
 * CHART DATA — pure derivations for the visualisations.
 * No new facts: every series is computed from the same invoices, payments,
 * bills and leases the tables already use. Amounts stay in integer cents
 * until the formatter runs.
 */
import type { Invoice, Payment } from "@/lib/rent-engine";
import type { Bill, WorkOrder, MaintenanceRequest } from "@/lib/maintenance-engine";
import { billTotalCents } from "@/lib/maintenance-engine";
import type { Lease, Unit } from "@/lib/mock-data";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-08" -> "Aug 26" */
export function periodLabel(period: string) {
  return `${MONTH_LABELS[Number(period.slice(5, 7)) - 1]} ${period.slice(2, 4)}`;
}

/** The n periods ending with the month of `today`, oldest first. */
export function lastPeriods(today: string, n: number): string[] {
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7));
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export type RentPoint = { period: string; label: string; expectedCents: number; collectedCents: number; ratePct: number };

export function rentByMonth(args: {
  invoices: Invoice[];
  payments: Payment[];
  today: string;
  months?: number;
}): RentPoint[] {
  const periods = lastPeriods(args.today, args.months ?? 6);
  const live = args.invoices.filter((i) => !i.voidedOn);
  const byInvoice = new Map<string, number>();
  for (const p of args.payments) {
    if (p.reversedOn) continue;
    byInvoice.set(p.invoiceId, (byInvoice.get(p.invoiceId) ?? 0) + p.amountCents);
  }
  return periods.map((period) => {
    const scoped = live.filter((i) => i.period === period);
    const expectedCents = scoped.reduce((s, i) => s + i.amountCents, 0);
    const collectedCents = scoped.reduce(
      (s, i) => s + Math.min(i.amountCents, (byInvoice.get(i.id) ?? 0) + i.creditAppliedCents),
      0,
    );
    return {
      period,
      label: periodLabel(period),
      expectedCents,
      collectedCents,
      ratePct: expectedCents === 0 ? 0 : Math.round((collectedCents / expectedCents) * 100),
    };
  });
}

export type IncomeExpensePoint = { label: string; incomeCents: number; expenseCents: number };

export function incomeExpenseByMonth(args: {
  invoices: Invoice[];
  payments: Payment[];
  bills: Bill[];
  today: string;
  months?: number;
}): IncomeExpensePoint[] {
  const rent = rentByMonth({ invoices: args.invoices, payments: args.payments, today: args.today, months: args.months ?? 6 });
  return rent.map((r) => ({
    label: r.label,
    incomeCents: r.collectedCents,
    expenseCents: args.bills
      .filter((b) => b.status === "approved" && b.issuedOn.slice(0, 7) === r.period)
      .reduce((s, b) => s + billTotalCents(b), 0),
  }));
}

export type CategorySlice = { name: string; valueCents: number };

/** Approved bill spend grouped by the originating request category. */
export function expenseByCategory(args: {
  bills: Bill[];
  workOrders: WorkOrder[];
  requests: MaintenanceRequest[];
}): CategorySlice[] {
  const totals = new Map<string, number>();
  for (const bill of args.bills) {
    if (bill.status !== "approved") continue;
    const wo = args.workOrders.find((w) => w.id === bill.workOrderId);
    const req = wo ? args.requests.find((r) => r.id === wo.requestId) : undefined;
    const name = req?.category ?? "Other work";
    totals.set(name, (totals.get(name) ?? 0) + billTotalCents(bill));
  }
  return [...totals.entries()]
    .map(([name, valueCents]) => ({ name, valueCents }))
    .sort((a, b) => b.valueCents - a.valueCents);
}

export type OccupancyPoint = { label: string; ratePct: number; filled: number; total: number };

/** Homes with a lease running in each month, against total homes. */
export function occupancyByMonth(args: { leases: Lease[]; units: Unit[]; today: string; months?: number }): OccupancyPoint[] {
  const total = args.units.length;
  return lastPeriods(args.today, args.months ?? 6).map((period) => {
    const first = `${period}-01`;
    const last = `${period}-28`;
    const filled = new Set(
      args.leases.filter((l) => l.start <= last && l.end >= first).map((l) => l.unitId),
    ).size;
    return {
      label: periodLabel(period),
      filled,
      total,
      ratePct: total === 0 ? 0 : Math.round((filled / total) * 100),
    };
  });
}
