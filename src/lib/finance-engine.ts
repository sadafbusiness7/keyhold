/**
 * FINANCE ENGINE — deterministic reporting + owner disbursement math.
 * -------------------------------------------------------------------
 * Pure functions only. Every figure the Reports and Owner disbursement
 * screens show comes from here, so the backend can compute the identical
 * numbers later. Amounts are INTEGER CENTS, exactly like rent-engine.ts.
 *
 * Explicitly out of scope (and never modelled here): journal entries,
 * trial balance, period locking, bank reconciliation, cheque printing,
 * a chart of accounts, or CAM.
 */
import type { Property, Unit, Tenant, Lease } from "@/lib/mock-data";
import type { Invoice, Payment } from "@/lib/rent-engine";
import { activePayments, balanceCents, money, toCsv } from "@/lib/rent-engine";
import type { Bill } from "@/lib/maintenance-engine";
import { billTotalCents, billSubtotalCents, billTaxCents } from "@/lib/maintenance-engine";
import { buildPdf, downloadPdf, type PdfLine } from "@/lib/pdf-writer";

// —— shared ————————————————————————————————————————————
export type DateRange = { from: string; to: string };

export const inRange = (iso: string, r: DateRange) => iso >= r.from && iso <= r.to;

/** First and last day of the calendar month a date falls in. */
export function monthRange(period: string): DateRange {
  const [y, m] = period.split("-").map(Number);
  const last = new Date(Date.UTC(y!, m!, 0)).getUTCDate();
  return { from: `${period}-01`, to: `${period}-${String(last).padStart(2, "0")}` };
}

export function yearToDate(today: string): DateRange {
  return { from: `${today.slice(0, 4)}-01-01`, to: today };
}

export const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

// —— rent roll ————————————————————————————————————————
export type RentRollRow = {
  unitId: string;
  propertyId: string;
  property: string;
  unit: string;
  tenant: string;
  rentCents: number;
  leaseStart: string;
  leaseEnd: string;
  occupied: boolean;
};

export function rentRoll(args: {
  properties: Property[];
  units: Unit[];
  leases: Lease[];
  tenants: Tenant[];
}): RentRollRow[] {
  const propertyName = (id: string) => args.properties.find((p) => p.id === id)?.name ?? "—";
  return args.units.map((u) => {
    const lease = args.leases.find((l) => l.unitId === u.id) ?? null;
    const tenant = args.tenants.find((t) => t.id === (lease?.tenantId ?? u.tenantId)) ?? null;
    return {
      unitId: u.id,
      propertyId: u.propertyId,
      property: propertyName(u.propertyId),
      unit: u.label,
      tenant: tenant?.name ?? "Empty",
      rentCents: Math.round((lease?.rent ?? u.rent) * 100),
      leaseStart: lease?.start ?? "—",
      leaseEnd: lease?.end ?? "—",
      occupied: !!u.tenantId,
    };
  });
}

// —— occupancy ————————————————————————————————————————
export type OccupancyRow = { propertyId: string; property: string; total: number; filled: number; ratePct: number };

export function occupancy(properties: Property[], units: Unit[]): OccupancyRow[] {
  return properties.map((p) => {
    const own = units.filter((u) => u.propertyId === p.id);
    const filled = own.filter((u) => u.tenantId).length;
    return {
      propertyId: p.id,
      property: p.name,
      total: own.length,
      filled,
      ratePct: own.length ? Math.round((filled / own.length) * 1000) / 10 : 0,
    };
  });
}

// —— outstanding rent + aged receivables ——————————————
export type OutstandingRow = {
  invoiceId: string;
  propertyId: string;
  property: string;
  unit: string;
  tenant: string;
  description: string;
  dueDate: string;
  amountCents: number;
  balanceCents: number;
  daysLate: number;
};

export function outstanding(args: {
  invoices: Invoice[];
  payments: Payment[];
  units: Unit[];
  properties: Property[];
  tenants: Tenant[];
  today: string;
}): OutstandingRow[] {
  const rows: OutstandingRow[] = [];
  for (const invoice of args.invoices) {
    if (invoice.voidedOn) continue;
    const balance = balanceCents(invoice, args.payments);
    if (balance <= 0) continue;
    const unit = args.units.find((u) => u.id === invoice.unitId);
    if (!unit) continue;
    rows.push({
      invoiceId: invoice.id,
      propertyId: unit.propertyId,
      property: args.properties.find((p) => p.id === unit.propertyId)?.name ?? "—",
      unit: unit.label,
      tenant: args.tenants.find((t) => t.id === invoice.tenantId)?.name ?? "—",
      description: invoice.description,
      dueDate: invoice.dueDate,
      amountCents: invoice.amountCents,
      balanceCents: balance,
      daysLate: Math.max(0, daysBetween(invoice.dueDate, args.today)),
    });
  }
  return rows.sort((a, b) => b.daysLate - a.daysLate);
}

export const AGE_BUCKETS = ["Current", "1–30 days", "31–60 days", "61–90 days", "90+ days"] as const;
export type AgeBucket = (typeof AGE_BUCKETS)[number];

export function bucketOf(daysLate: number): AgeBucket {
  if (daysLate <= 0) return "Current";
  if (daysLate <= 30) return "1–30 days";
  if (daysLate <= 60) return "31–60 days";
  if (daysLate <= 90) return "61–90 days";
  return "90+ days";
}

export function agedReceivables(rows: OutstandingRow[]) {
  const totals = new Map<AgeBucket, number>(AGE_BUCKETS.map((b) => [b, 0]));
  for (const r of rows) totals.set(bucketOf(r.daysLate), (totals.get(bucketOf(r.daysLate)) ?? 0) + r.balanceCents);
  return AGE_BUCKETS.map((bucket) => ({ bucket, totalCents: totals.get(bucket) ?? 0 }));
}

// —— habitual late payers ————————————————————————————
export type LatePayerRow = {
  tenantId: string;
  tenant: string;
  property: string;
  paymentsCounted: number;
  lateCount: number;
  avgDaysLate: number;
  stillOwingCents: number;
};

/** A payment is "late" when it landed after the invoice due date. */
export function latePayers(args: {
  invoices: Invoice[];
  payments: Payment[];
  units: Unit[];
  properties: Property[];
  tenants: Tenant[];
  range: DateRange;
  today: string;
}): LatePayerRow[] {
  const byInvoice = new Map(args.invoices.map((i) => [i.id, i]));
  const acc = new Map<string, { counted: number; late: number; days: number }>();
  for (const p of args.payments) {
    if (p.reversedOn || !inRange(p.receivedOn, args.range)) continue;
    const invoice = byInvoice.get(p.invoiceId);
    if (!invoice) continue;
    const unit = args.units.find((u) => u.id === invoice.unitId);
    if (!unit) continue;
    const entry = acc.get(p.tenantId) ?? { counted: 0, late: 0, days: 0 };
    entry.counted += 1;
    const late = daysBetween(invoice.dueDate, p.receivedOn);
    if (late > 0) {
      entry.late += 1;
      entry.days += late;
    }
    acc.set(p.tenantId, entry);
  }
  const owing = outstanding({ ...args, today: args.today });
  return [...acc.entries()]
    .map(([tenantId, v]) => {
      const lease = args.invoices.find((i) => i.tenantId === tenantId);
      const unit = args.units.find((u) => u.id === lease?.unitId);
      return {
        tenantId,
        tenant: args.tenants.find((t) => t.id === tenantId)?.name ?? "—",
        property: args.properties.find((p) => p.id === unit?.propertyId)?.name ?? "—",
        paymentsCounted: v.counted,
        lateCount: v.late,
        avgDaysLate: v.late ? Math.round(v.days / v.late) : 0,
        stillOwingCents: owing.filter((o) => o.tenant === (args.tenants.find((t) => t.id === tenantId)?.name ?? "")).reduce((s, o) => s + o.balanceCents, 0),
      };
    })
    .sort((a, b) => b.lateCount - a.lateCount || b.avgDaysLate - a.avgDaysLate);
}

// —— income vs expense ————————————————————————————————
export type IncomeExpenseRow = {
  propertyId: string;
  property: string;
  rentCents: number;
  otherIncomeCents: number;
  expenseCents: number;
  netCents: number;
};

/** Cash basis: money actually received, against approved bills issued in the range. */
export function incomeVsExpense(args: {
  properties: Property[];
  units: Unit[];
  invoices: Invoice[];
  payments: Payment[];
  bills: Bill[];
  range: DateRange;
}): IncomeExpenseRow[] {
  const byInvoice = new Map(args.invoices.map((i) => [i.id, i]));
  const unitProperty = new Map(args.units.map((u) => [u.id, u.propertyId]));
  return args.properties.map((property) => {
    let rentCents = 0;
    let otherIncomeCents = 0;
    for (const p of args.payments) {
      if (p.reversedOn || !inRange(p.receivedOn, args.range)) continue;
      const invoice = byInvoice.get(p.invoiceId);
      if (!invoice || invoice.voidedOn) continue;
      if (unitProperty.get(invoice.unitId) !== property.id) continue;
      if (invoice.kind === "rent") rentCents += p.amountCents;
      else otherIncomeCents += p.amountCents;
    }
    const expenseCents = args.bills
      .filter((b) => b.propertyId === property.id && b.status === "approved" && inRange(b.issuedOn, args.range))
      .reduce((s, b) => s + billTotalCents(b), 0);
    return {
      propertyId: property.id,
      property: property.name,
      rentCents,
      otherIncomeCents,
      expenseCents,
      netCents: rentCents + otherIncomeCents - expenseCents,
    };
  });
}

// —— owner disbursement ————————————————————————————————
export type FeeModel = "pct-collected" | "pct-invoiced" | "flat";

export const FEE_MODELS: { id: FeeModel; label: string; help: string }[] = [
  { id: "pct-collected", label: "% of rent collected", help: "You only earn on money that actually arrived." },
  { id: "pct-invoiced", label: "% of rent invoiced", help: "You earn on what was charged, paid or not." },
  { id: "flat", label: "Flat monthly fee", help: "The same amount every month, whatever comes in." },
];

export type OwnerConfig = {
  propertyId: string;
  managed: boolean;
  ownerName: string;
  ownerEmail: string;
  feeModel: FeeModel;
  /** percent (e.g. 8 = 8%) for the % models, or dollars for the flat model */
  feeValue: number;
  /** tax charged on the management fee itself, e.g. 13 for HST in Ontario */
  feeTaxPct: number;
  /** true once the statement has been shared to the owner's portal view */
  sharedToPortal: boolean;
};

export type StatementLine = { label: string; detail: string; amountCents: number };

export type DisbursementStatement = {
  propertyId: string;
  property: string;
  range: DateRange;
  rentReceivedCents: number;
  otherIncomeCents: number;
  invoicedCents: number;
  expenses: StatementLine[];
  expenseTotalCents: number;
  feeBaseCents: number;
  feeCents: number;
  feeTaxCents: number;
  netPayableCents: number;
  incomeLines: StatementLine[];
};

export function managementFeeCents(config: OwnerConfig, collectedCents: number, invoicedCents: number) {
  if (config.feeModel === "flat") return Math.round(config.feeValue * 100);
  const base = config.feeModel === "pct-collected" ? collectedCents : invoicedCents;
  return Math.round((base * config.feeValue) / 100);
}

export function disbursementStatement(args: {
  property: Property;
  config: OwnerConfig;
  units: Unit[];
  tenants: Tenant[];
  invoices: Invoice[];
  payments: Payment[];
  bills: Bill[];
  range: DateRange;
}): DisbursementStatement {
  const unitIds = new Set(args.units.filter((u) => u.propertyId === args.property.id).map((u) => u.id));
  const scopedInvoices = args.invoices.filter((i) => unitIds.has(i.unitId) && !i.voidedOn);
  const byInvoice = new Map(scopedInvoices.map((i) => [i.id, i]));

  const incomeLines: StatementLine[] = [];
  let rentReceivedCents = 0;
  let otherIncomeCents = 0;
  for (const p of args.payments) {
    if (p.reversedOn || !inRange(p.receivedOn, args.range)) continue;
    const invoice = byInvoice.get(p.invoiceId);
    if (!invoice) continue;
    if (invoice.kind === "rent") rentReceivedCents += p.amountCents;
    else otherIncomeCents += p.amountCents;
    incomeLines.push({
      label: args.tenants.find((t) => t.id === invoice.tenantId)?.name ?? "Tenant",
      detail: `${invoice.description} · ${p.method} · ${p.receivedOn}`,
      amountCents: p.amountCents,
    });
  }

  const invoicedCents = scopedInvoices
    .filter((i) => i.kind === "rent" && inRange(i.dueDate, args.range))
    .reduce((s, i) => s + i.amountCents, 0);

  const expenses: StatementLine[] = args.bills
    .filter((b) => b.propertyId === args.property.id && b.status === "approved" && inRange(b.issuedOn, args.range))
    .map((b) => ({
      label: b.reference || b.id,
      detail: `Issued ${b.issuedOn} · subtotal ${money(billSubtotalCents(b.lines))} + tax ${money(billTaxCents(b.lines, b.taxRatePct))}`,
      amountCents: billTotalCents(b),
    }));
  const expenseTotalCents = expenses.reduce((s, e) => s + e.amountCents, 0);

  const feeBaseCents = args.config.feeModel === "pct-invoiced" ? invoicedCents : rentReceivedCents;
  const feeCents = managementFeeCents(args.config, rentReceivedCents, invoicedCents);
  const feeTaxCents = Math.round((feeCents * args.config.feeTaxPct) / 100);

  return {
    propertyId: args.property.id,
    property: args.property.name,
    range: args.range,
    rentReceivedCents,
    otherIncomeCents,
    invoicedCents,
    expenses,
    expenseTotalCents,
    feeBaseCents,
    feeCents,
    feeTaxCents,
    netPayableCents: rentReceivedCents + otherIncomeCents - expenseTotalCents - feeCents - feeTaxCents,
    incomeLines,
  };
}

// —— exports ————————————————————————————————————————
export type ExportTable = { title: string; headers: string[]; rows: (string | number)[][] };

export function tableToCsv(table: ExportTable) {
  return toCsv(table.headers, table.rows);
}

/** Simple, readable PDF: a title block then one section per table. */
export function tablesToPdf(args: { title: string; subtitle: string; tables: ExportTable[] }) {
  const lines: PdfLine[] = [
    { t: "title", text: args.title },
    { t: "small", text: args.subtitle },
    { t: "rule" },
  ];
  for (const table of args.tables) {
    lines.push({ t: "h", text: table.title });
    if (!table.rows.length) lines.push({ t: "small", text: "Nothing in this period." });
    for (const row of table.rows) {
      const [first, ...rest] = row;
      lines.push({
        t: "field",
        label: String(first ?? ""),
        value: rest.map((cell, i) => `${table.headers[i + 1]}: ${cell}`).join("  ·  "),
      });
    }
    lines.push({ t: "space", size: 8 });
  }
  lines.push({ t: "rule" });
  lines.push({ t: "small", text: "Prepared by Keyhold. Summary information only — not an audited financial statement." });
  return buildPdf(lines);
}

export function downloadTablesPdf(filename: string, args: { title: string; subtitle: string; tables: ExportTable[] }) {
  downloadPdf(tablesToPdf(args), filename);
}
