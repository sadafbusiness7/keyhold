/**
 * MOCK CANADA STORE — prototype state only, NOT a backend.
 * --------------------------------------------------------
 * Three Canada-specific surfaces share one provider so the demo has a single
 * place to swap for Supabase later:
 *   1. tax ledger      — income/expense rows mapped to CRA T776 lines
 *   2. credit reporting — per-tenant consent + monthly reporting history
 *   3. rent guideline   — the provincial guideline % and scheduled increases
 * Every number is cents; every calculation lives in a pure engine file.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { leases as allLeases, properties, tenants, unitById } from "@/lib/mock-data";
import { useMaintenance } from "@/lib/mock-maintenance";
import { useRent } from "@/lib/mock-rent";
import { activePayments, toCents } from "@/lib/rent-engine";
import { suggestLine, type CcaRow, type LedgerEntry, type T776Code } from "@/lib/tax-engine";

export const TAX_TODAY = "2026-08-14";
export const TAX_YEARS = [2026, 2025, 2024];

/* ————————————————————— 1. tax ledger seeds ————————————————————— */

const seed = (
  id: string,
  date: string,
  propertyId: string,
  kind: "income" | "expense",
  code: T776Code | null,
  description: string,
  amount: number,
): LedgerEntry => ({ id, date, propertyId, kind, code, description, amountCents: toCents(amount), source: "manual" });

/** MOCK: a full prior tax year plus a partial current one. */
function seedLedger(): LedgerEntry[] {
  const out: LedgerEntry[] = [];
  const rentByProperty: Record<string, number> = { p1: 3925, p2: 4520, p3: 3100 };
  for (const year of [2024, 2025]) {
    for (const [pid, monthly] of Object.entries(rentByProperty)) {
      for (let m = 1; m <= 12; m++) {
        const mm = String(m).padStart(2, "0");
        out.push(seed(`inc-${year}-${pid}-${mm}`, `${year}-${mm}-01`, pid, "income", null, `Rent collected — ${year}-${mm}`, monthly));
      }
    }
  }
  const expenses: [string, string, T776Code | null, string, number][] = [
    ["2025-01-14", "p1", "insurance", "Landlord policy — annual premium", 1840],
    ["2025-01-31", "p1", "property-tax", "City of Toronto property tax instalment", 2210],
    ["2025-02-08", "p1", "maintenance", "Furnace repair — igniter replacement", 465],
    ["2025-03-02", "p1", "interest", "Mortgage interest — Q1", 4380],
    ["2025-04-19", "p1", "utilities", "Hydro — common area", 512],
    ["2025-05-06", "p1", null, "Sundry — 412 Lansdowne", 189],
    ["2025-06-30", "p1", "property-tax", "City of Toronto property tax instalment", 2210],
    ["2025-09-12", "p1", "maintenance", "Roof flashing repair", 1275],
    ["2025-11-20", "p1", "professional", "Accountant — rental schedule prep", 640],
    ["2025-01-11", "p2", "insurance", "Building policy — annual premium", 2260],
    ["2025-02-15", "p2", "utilities", "Enbridge gas — building", 1480],
    ["2025-03-05", "p2", "interest", "Mortgage interest — Q1", 5120],
    ["2025-03-22", "p2", "maintenance", "Snow clearing — season contract", 1650],
    ["2025-05-18", "p2", "management", "Management fee — Priya Raman", 2712],
    ["2025-07-04", "p2", "advertising", "Listing photos and Kijiji ad", 320],
    ["2025-08-01", "p2", null, "Cheque 214 — no description on file", 425],
    ["2025-10-09", "p2", "property-tax", "City of Hamilton property tax", 3140],
    ["2025-12-02", "p2", "maintenance", "Grounds & lawn care — season", 1850],
    ["2025-01-20", "p3", "insurance", "Landlord policy — annual premium", 1420],
    ["2025-04-14", "p3", "maintenance", "Appliance repair — dishwasher", 380],
    ["2025-06-11", "p3", "travel", "Mileage — inspections and showings", 268],
    ["2025-07-28", "p3", "property-tax", "City of Toronto property tax", 2680],
    ["2025-09-30", "p3", "interest", "Mortgage interest — Q3", 3960],
    ["2025-10-15", "p3", null, "Home Depot — misc", 212],
    ["2025-11-08", "p3", "office", "Postage and printing — notices", 96],
    ["2026-01-16", "p1", "insurance", "Landlord policy — annual premium", 1910],
    ["2026-02-03", "p1", "property-tax", "City of Toronto property tax instalment", 2290],
    ["2026-03-09", "p2", "interest", "Mortgage interest — Q1", 5180],
    ["2026-04-21", "p2", null, "E-transfer to J. Whyte", 340],
    ["2026-05-30", "p3", "maintenance", "Sump pump service", 415],
    ["2026-06-18", "p3", "utilities", "Water & sewer — building share", 288],
  ];
  expenses.forEach(([date, pid, code, desc, amount], i) =>
    out.push(seed(`exp-${i + 1}`, date, pid, "expense", code, desc, amount)),
  );
  return out;
}

const seedCca: CcaRow[] = [
  { className: "1", description: "Building — 412 Lansdowne Ave", openingUccCents: toCents(486000), additionsCents: 0, ratePct: 4 },
  { className: "8", description: "Appliances and equipment", openingUccCents: toCents(9400), additionsCents: toCents(1850), ratePct: 20 },
];

/* ————————————————————— 2. credit reporting seeds ————————————————————— */

export type EnrollmentStatus = "enrolled" | "not-enrolled" | "revoked";

export type CreditEnrollment = {
  tenantId: string;
  status: EnrollmentStatus;
  /** Timestamp the tenant gave (or withdrew) explicit consent. */
  consentAt: string | null;
  consentText: string;
  revokedAt: string | null;
  partner: string;
};

export type CreditReport = {
  id: string;
  tenantId: string;
  /** YYYY-MM */
  period: string;
  status: "reported-on-time" | "reported-late" | "pending" | "not-reported";
  submittedOn: string | null;
  note: string;
};

export const CREDIT_PARTNER = "Keyhold's partner bureau service";

export const CONSENT_TEXT =
  "I ask Keyhold to share my monthly rent payment history with its partner bureau service so it can appear on my credit file. " +
  "I understand this includes late and missed payments, that no credit-score outcome is promised, and that I can withdraw this consent at any time.";

const seedEnrollments = (): CreditEnrollment[] =>
  tenants.slice(0, 5).map((t, i) => ({
    tenantId: t.id,
    status: i < 2 ? "enrolled" : i === 2 ? "enrolled" : "not-enrolled",
    consentAt: i <= 2 ? `2026-0${i + 3}-0${i + 1}T14:2${i}:00-04:00` : null,
    consentText: i <= 2 ? CONSENT_TEXT : "",
    revokedAt: null,
    partner: CREDIT_PARTNER,
  }));

const REPORT_PERIODS = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];

function seedReports(enrollments: CreditEnrollment[]): CreditReport[] {
  const out: CreditReport[] = [];
  for (const e of enrollments.filter((x) => x.status === "enrolled")) {
    REPORT_PERIODS.forEach((period, i) => {
      const isCurrent = period === "2026-08";
      const late = e.tenantId === "t3" && period === "2026-07";
      out.push({
        id: `crp-${e.tenantId}-${period}`,
        tenantId: e.tenantId,
        period,
        status: isCurrent ? "pending" : late ? "reported-late" : "reported-on-time",
        submittedOn: isCurrent ? null : `${period}-0${(i % 4) + 5}`,
        note: isCurrent ? "Submits after the month closes." : late ? "Payment received after the due date." : "",
      });
    });
  }
  return out;
}

/* ————————————————————— 3. guideline seeds ————————————————————— */

export type GuidelineRow = {
  year: number;
  province: string;
  pct: number;
  sourceName: string;
  sourceUrl: string;
  sourceDate: string;
};

const seedGuidelines: GuidelineRow[] = [
  {
    year: 2026,
    province: "ON",
    pct: 2.5,
    sourceName: "Ontario rent increase guideline",
    sourceUrl: "https://www.ontario.ca/page/rent-increase-guideline",
    sourceDate: "2025-06-25",
  },
  {
    year: 2025,
    province: "ON",
    pct: 2.5,
    sourceName: "Ontario rent increase guideline",
    sourceUrl: "https://www.ontario.ca/page/rent-increase-guideline",
    sourceDate: "2024-06-26",
  },
];

export type ScheduledIncrease = {
  id: string;
  tenantId: string;
  unitId: string;
  currentRent: number;
  newRent: number;
  percent: number;
  effectiveDate: string;
  noticeGivenOn: string;
  status: "scheduled" | "applied" | "cancelled";
  noticeId: string | null;
  aboveGuideline: boolean;
  createdAt: string;
};

/* ————————————————————— provider ————————————————————— */

function useStore() {
  const maintenance = useMaintenance();
  const rent = useRent();

  const [manualEntries, setManualEntries] = useState<LedgerEntry[]>(seedLedger);
  const [overrides, setOverrides] = useState<Record<string, T776Code>>({});
  const [cca, setCca] = useState<CcaRow[]>(seedCca);
  const [enrollments, setEnrollments] = useState<CreditEnrollment[]>(seedEnrollments);
  const [reports, setReports] = useState<CreditReport[]>(() => seedReports(seedEnrollments()));
  const [guidelines, setGuidelines] = useState<GuidelineRow[]>(seedGuidelines);
  const [increases, setIncreases] = useState<ScheduledIncrease[]>([]);

  return useMemo(() => {
    /* —— derived ledger: live bills and live rent payments —— */
    const billEntries: LedgerEntry[] = maintenance.bills
      .filter((b) => b.status === "approved" || b.status === "awaiting-approval")
      .map((b) => {
        const subtotal = b.lines.reduce((s, l) => s + l.amountCents, 0);
        const text = `${b.reference} ${b.lines.map((l) => l.description).join(" ")}`;
        return {
          id: `bill:${b.id}`,
          date: b.issuedOn,
          propertyId: b.propertyId,
          kind: "expense" as const,
          code: suggestLine(text),
          description: `${b.reference} — ${b.lines[0]?.description ?? "Bill"}`,
          amountCents: Math.round(subtotal * (1 + b.taxRatePct / 100)),
          source: "bill" as const,
          sourceId: b.id,
        };
      });

    const paymentEntries: LedgerEntry[] = rent.payments
      .filter((p) => !p.reversedOn)
      .map((p) => {
        const invoice = rent.invoices.find((i) => i.id === p.invoiceId);
        const unit = invoice ? unitById(invoice.unitId) : null;
        return {
          id: `pay:${p.id}`,
          date: p.receivedOn,
          propertyId: unit?.propertyId ?? "p1",
          kind: "income" as const,
          code: null,
          description: `${invoice?.description ?? "Rent"} — ${p.method}`,
          amountCents: p.amountCents,
          source: "rent" as const,
          sourceId: p.id,
        };
      });

    const entries: LedgerEntry[] = [...manualEntries, ...billEntries, ...paymentEntries].map((e) =>
      overrides[e.id] ? { ...e, code: overrides[e.id]! } : e,
    );

    const categorize = (entryId: string, code: T776Code) => {
      setOverrides((prev) => ({ ...prev, [entryId]: code }));
      setManualEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, code } : e)));
    };
    const autoCategorize = () => {
      let n = 0;
      const next: Record<string, T776Code> = {};
      for (const e of entries) {
        if (e.kind !== "expense" || e.code) continue;
        const guess = suggestLine(e.description);
        if (guess) {
          next[e.id] = guess;
          n++;
        }
      }
      if (n) setOverrides((prev) => ({ ...prev, ...next }));
      return n;
    };
    const updateCca = (index: number, patch: Partial<CcaRow>) =>
      setCca((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
    const addCca = () =>
      setCca((prev) => [...prev, { className: "8", description: "New asset", openingUccCents: 0, additionsCents: 0, ratePct: 20 }]);
    const removeCca = (index: number) => setCca((prev) => prev.filter((_, i) => i !== index));

    /* —— credit reporting —— */
    const enrollmentFor = (tenantId: string) =>
      enrollments.find((e) => e.tenantId === tenantId) ?? {
        tenantId,
        status: "not-enrolled" as EnrollmentStatus,
        consentAt: null,
        consentText: "",
        revokedAt: null,
        partner: CREDIT_PARTNER,
      };

    const enroll = (tenantId: string, at = new Date().toISOString()) => {
      setEnrollments((prev) => {
        const row: CreditEnrollment = {
          tenantId,
          status: "enrolled",
          consentAt: at,
          consentText: CONSENT_TEXT,
          revokedAt: null,
          partner: CREDIT_PARTNER,
        };
        return prev.some((e) => e.tenantId === tenantId) ? prev.map((e) => (e.tenantId === tenantId ? row : e)) : [...prev, row];
      });
      setReports((prev) =>
        prev.some((r) => r.tenantId === tenantId)
          ? prev
          : [
              ...prev,
              {
                id: `crp-${tenantId}-2026-08`,
                tenantId,
                period: "2026-08",
                status: "pending",
                submittedOn: null,
                note: "First report submits after the month closes.",
              },
            ],
      );
    };

    const revoke = (tenantId: string, at = new Date().toISOString()) =>
      setEnrollments((prev) =>
        prev.map((e) => (e.tenantId === tenantId ? { ...e, status: "revoked", revokedAt: at } : e)),
      );

    const reportsFor = (tenantId: string) =>
      reports.filter((r) => r.tenantId === tenantId).sort((a, b) => b.period.localeCompare(a.period));

    /* —— guideline + increases —— */
    const guidelineFor = (year: number, province = "ON") =>
      guidelines.find((g) => g.year === year && g.province === province) ?? null;

    const upsertGuideline = (row: GuidelineRow) =>
      setGuidelines((prev) => {
        const i = prev.findIndex((g) => g.year === row.year && g.province === row.province);
        if (i === -1) return [row, ...prev].sort((a, b) => b.year - a.year);
        return prev.map((g, gi) => (gi === i ? row : g));
      });

    const scheduleIncrease = (input: Omit<ScheduledIncrease, "id" | "status" | "createdAt">) => {
      const row: ScheduledIncrease = {
        ...input,
        id: `ri-${Math.random().toString(36).slice(2, 8)}`,
        status: "scheduled",
        createdAt: TAX_TODAY,
      };
      setIncreases((prev) => [row, ...prev]);
      return row;
    };
    const cancelIncrease = (id: string) =>
      setIncreases((prev) => prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));

    const increasesForTenant = (tenantId: string) => increases.filter((r) => r.tenantId === tenantId);

    /* —— shared helpers —— */
    const tenantRent = (tenantId: string) => {
      const lease = allLeases.find((l) => l.tenantId === tenantId);
      return lease?.rent ?? 0;
    };
    const paidOnTimeCount = (tenantId: string) =>
      rent.invoices.filter(
        (i) => i.tenantId === tenantId && activePayments(rent.payments, i.id).some((p) => p.receivedOn <= i.dueDate),
      ).length;

    return {
      today: TAX_TODAY,
      // tax
      entries,
      properties,
      cca,
      categorize,
      autoCategorize,
      updateCca,
      addCca,
      removeCca,
      // credit
      enrollments,
      reports,
      enrollmentFor,
      enroll,
      revoke,
      reportsFor,
      // guideline
      guidelines,
      guidelineFor,
      upsertGuideline,
      increases,
      scheduleIncrease,
      cancelIncrease,
      increasesForTenant,
      // helpers
      tenantRent,
      paidOnTimeCount,
    };
  }, [manualEntries, overrides, cca, enrollments, reports, guidelines, increases, maintenance, rent]);
}

type Ctx = ReturnType<typeof useStore>;
const CanadaContext = createContext<Ctx | null>(null);

export function CanadaProvider({ children }: { children: ReactNode }) {
  const value = useStore();
  return <CanadaContext.Provider value={value}>{children}</CanadaContext.Provider>;
}

export function useCanada() {
  const ctx = useContext(CanadaContext);
  if (!ctx) throw new Error("useCanada must be used inside CanadaProvider");
  return ctx;
}
