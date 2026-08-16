/**
 * MOCK LEASE LIFECYCLE STORE — prototype state only, NOT a backend.
 * ----------------------------------------------------------------
 * Shaped like the future tables so a backend can drop in:
 *   leases         -> leases (status, term, money, province answers)
 *   lease_signers  -> per-signer e-sign state
 *   lease_audit    -> immutable audit trail (who / what / when)
 *   lease_invoices -> rent_invoices linked to the lease
 *   lease_notices  -> notices served under the lease
 *
 * Nothing here is security or legal logic. The human always confirms.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  leases as seedLeaseRows,
  tenantById,
  unitById,
  propertyById,
  units,
} from "@/lib/mock-data";

export type LeaseStatus = "draft" | "out-for-signature" | "active" | "ended";
export type SignerState = "not-sent" | "sent" | "viewed" | "signed";
export type SignerRole = "Tenant" | "Landlord";

export type LeaseSigner = {
  id: string;
  name: string;
  email: string;
  role: SignerRole;
  state: SignerState;
  updatedAt?: string | undefined;
};

export type LeaseAuditEntry = {
  id: string;
  at: string;
  who: string;
  what: string;
};

export type LeaseInvoiceLink = {
  id: string;
  dueDate: string;
  amount: number;
  label: string;
  paid: boolean;
};

export type LeaseNoticeLink = {
  id: string;
  type: string;
  servedOn: string;
  summary: string;
};

export type LeaseRecord = {
  id: string;
  propertyId: string;
  unitId: string;
  tenantId?: string | undefined;
  tenants: { name: string; email: string; phone: string }[];
  occupants: string;
  startDate: string;
  endDate: string;
  termType: "Fixed term" | "Month-to-month";
  firstInvoiceDate: string;
  rent: number;
  parkingFee: number;
  storageFee: number;
  otherCharges: { label: string; amount: number }[];
  deposit: number;
  keyDeposit: number;
  province: string;
  standardAnswers: Record<string, string>;
  clauses: string;
  addenda: string[];
  status: LeaseStatus;
  /** true once fully signed — editing requires an explicit revert */
  locked: boolean;
  paperUpload?: string | undefined;
  renewedFromId?: string | undefined;
  signers: LeaseSigner[];
  audit: LeaseAuditEntry[];
  invoices: LeaseInvoiceLink[];
  notices: LeaseNoticeLink[];
};

export const TODAY = "2026-08-14";

let seq = 200;
const nextId = (p: string) => `${p}${++seq}`;
const now = () => new Date().toISOString();

export const daysUntil = (iso: string) =>
  Math.round((new Date(iso).getTime() - new Date(TODAY).getTime()) / 864e5);

/** Display status: "expiring" is derived, never stored. */
export type DisplayStatus = LeaseStatus | "expiring";
export function displayStatus(l: LeaseRecord): DisplayStatus {
  if (l.status !== "active") return l.status;
  const d = daysUntil(l.endDate);
  if (d < 0) return "ended";
  if (l.termType === "Fixed term" && d <= 90) return "expiring";
  return "active";
}

export const statusLabel: Record<DisplayStatus, string> = {
  draft: "Draft",
  "out-for-signature": "Out for signature",
  active: "Active",
  expiring: "Expiring soon",
  ended: "Ended",
};

export const signerLabel: Record<SignerState, string> = {
  "not-sent": "Not sent",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
};

export const monthlyTotal = (l: LeaseRecord) =>
  l.rent + l.parkingFee + l.storageFee + l.otherCharges.reduce((s, c) => s + c.amount, 0);

export const addMonthsIso = (iso: string, months: number) => {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

const standardFor = (province: string): Record<string, string> => ({
  smoking: "Not permitted inside the unit",
  pets: "Allowed, subject to provincial law",
  utilities: "Heat and water included; hydro paid by tenant",
  services: "Parking and storage as listed in the charges above",
  maintenance: province === "ON" ? "Landlord maintains the unit per s.20 RTA" : "Landlord maintains the unit per the tenancy act",
});

function seedRecord(row: (typeof seedLeaseRows)[number]): LeaseRecord {
  const unit = unitById(row.unitId);
  const property = propertyById(unit.propertyId);
  const tenant = tenantById(row.tenantId);
  const ended = daysUntil(row.end) < 0;
  return {
    id: row.id,
    propertyId: property.id,
    unitId: row.unitId,
    tenantId: row.tenantId,
    tenants: [{ name: tenant?.name ?? "Tenant", email: tenant?.email ?? "", phone: tenant?.phone ?? "" }],
    occupants: "As declared on the application",
    startDate: row.start,
    endDate: row.end,
    termType: row.type,
    firstInvoiceDate: row.start,
    rent: row.rent,
    parkingFee: 0,
    storageFee: 0,
    otherCharges: [],
    deposit: row.depositHeld,
    keyDeposit: 0,
    province: property.province,
    standardAnswers: standardFor(property.province),
    clauses: "",
    addenda: [`Signed lease — ${property.name}.pdf`],
    status: ended ? "ended" : "active",
    locked: true,
    signers: [
      { id: nextId("sg"), name: tenant?.name ?? "Tenant", email: tenant?.email ?? "", role: "Tenant", state: "signed", updatedAt: row.start },
      { id: nextId("sg"), name: "Keyhold Owner", email: "owner@keyhold.ca", role: "Landlord", state: "signed", updatedAt: row.start },
    ],
    audit: [
      { id: nextId("au"), at: `${row.start}T09:12:00Z`, who: "Keyhold Owner", what: "Lease sent for signature" },
      { id: nextId("au"), at: `${row.start}T14:41:00Z`, who: tenant?.name ?? "Tenant", what: "Signed the lease" },
      { id: nextId("au"), at: `${row.start}T15:02:00Z`, who: "Keyhold Owner", what: "Countersigned — lease locked" },
    ],
    invoices: [0, 1, 2].map((i) => ({
      id: nextId("in"),
      dueDate: addMonthsIso(TODAY, i - 1),
      amount: row.rent,
      label: "Monthly rent",
      paid: i < 1,
    })),
    notices: [],
  };
}

const vacant = units.find((u) => !u.tenantId);

const extraSeeds: LeaseRecord[] = [
  // A draft mid-wizard
  {
    id: "l6",
    propertyId: vacant ? vacant.propertyId : "p2",
    unitId: vacant?.id ?? "u5",
    tenants: [{ name: "Amara Cole", email: "amara.cole@example.ca", phone: "(905) 555-0142" }],
    occupants: "One adult",
    startDate: "2026-09-01",
    endDate: "2027-08-31",
    termType: "Fixed term",
    firstInvoiceDate: "2026-09-01",
    rent: vacant?.rent ?? 1250,
    parkingFee: 0,
    storageFee: 45,
    otherCharges: [],
    deposit: vacant?.rent ?? 1250,
    keyDeposit: 50,
    province: "ON",
    standardAnswers: standardFor("ON"),
    clauses: "",
    addenda: [],
    status: "draft",
    locked: false,
    signers: [],
    audit: [{ id: nextId("au"), at: "2026-08-11T10:05:00Z", who: "Keyhold Owner", what: "Draft created from an approved application" }],
    invoices: [],
    notices: [],
  },
  // One out for signature
  {
    id: "l7",
    propertyId: "p4",
    unitId: units.find((u) => u.propertyId === "p4")?.id ?? "u7",
    tenants: [{ name: "Devon Mercier", email: "devon.mercier@example.ca", phone: "(416) 555-0188" }],
    occupants: "Two adults",
    startDate: "2026-09-15",
    endDate: "2027-09-14",
    termType: "Fixed term",
    firstInvoiceDate: "2026-09-15",
    rent: 2100,
    parkingFee: 95,
    storageFee: 0,
    otherCharges: [],
    deposit: 2100,
    keyDeposit: 50,
    province: "ON",
    standardAnswers: standardFor("ON"),
    clauses: "Bicycle storage in the rear shed is included.",
    addenda: ["Building rules.pdf"],
    status: "out-for-signature",
    locked: false,
    signers: [
      { id: nextId("sg"), name: "Devon Mercier", email: "devon.mercier@example.ca", role: "Tenant", state: "viewed", updatedAt: "2026-08-13T18:20:00Z" },
      { id: nextId("sg"), name: "Keyhold Owner", email: "owner@keyhold.ca", role: "Landlord", state: "signed", updatedAt: "2026-08-12T11:00:00Z" },
    ],
    audit: [
      { id: nextId("au"), at: "2026-08-12T10:55:00Z", who: "Keyhold Owner", what: "Draft reviewed and confirmed" },
      { id: nextId("au"), at: "2026-08-12T11:00:00Z", who: "Keyhold Owner", what: "Sent for signature to 2 signers" },
      { id: nextId("au"), at: "2026-08-13T18:20:00Z", who: "Devon Mercier", what: "Opened the lease" },
    ],
    invoices: [],
    notices: [],
  },
];

const seed: LeaseRecord[] = [...seedLeaseRows.map(seedRecord), ...extraSeeds];

export function blankLease(propertyId: string, unitId: string, province: string): LeaseRecord {
  const start = addMonthsIso(TODAY, 1).slice(0, 8) + "01";
  return {
    id: nextId("ls"),
    propertyId,
    unitId,
    tenants: [{ name: "", email: "", phone: "" }],
    occupants: "",
    startDate: start,
    endDate: addMonthsIso(start, 12),
    termType: "Fixed term",
    firstInvoiceDate: start,
    rent: unitById(unitId)?.rent ?? 0,
    parkingFee: 0,
    storageFee: 0,
    otherCharges: [],
    deposit: unitById(unitId)?.rent ?? 0,
    keyDeposit: 0,
    province,
    standardAnswers: standardFor(province),
    clauses: "",
    addenda: [],
    status: "draft",
    locked: false,
    signers: [],
    audit: [],
    invoices: [],
    notices: [],
  };
}

type Ctx = {
  leases: LeaseRecord[];
  byId: (id: string) => LeaseRecord | undefined;
  create: (l: LeaseRecord) => LeaseRecord;
  save: (id: string, patch: Partial<LeaseRecord>, note?: string) => void;
  sendForSignature: (id: string) => void;
  resend: (id: string, signerId: string) => void;
  /** demo helper: move a signer forward one state */
  advanceSigner: (id: string, signerId: string) => void;
  uploadPaperLease: (id: string, fileName: string) => void;
  revertSignature: (id: string) => void;
  renew: (id: string, months: number, rent: number) => LeaseRecord;
  endTenancy: (id: string, moveOut: string, reason: string) => void;
  remove: (id: string) => void;
};

const LeasesContext = createContext<Ctx | null>(null);

export function LeasesProvider({ children }: { children: ReactNode }) {
  const [leases, setLeases] = useState<LeaseRecord[]>(seed);

  const value = useMemo<Ctx>(() => {
    const logged = (l: LeaseRecord, what: string): LeaseRecord => ({
      ...l,
      audit: [...l.audit, { id: nextId("au"), at: now(), who: "Keyhold Owner", what }],
    });
    const patchOne = (id: string, fn: (l: LeaseRecord) => LeaseRecord) =>
      setLeases((prev) => prev.map((l) => (l.id === id ? fn(l) : l)));

    return {
      leases,
      byId: (id) => leases.find((l) => l.id === id),
      create: (l) => {
        const created = logged(l, "Draft created");
        setLeases((prev) => [created, ...prev]);
        return created;
      },
      save: (id, patch, note) =>
        patchOne(id, (l) => (note ? logged({ ...l, ...patch }, note) : { ...l, ...patch })),
      sendForSignature: (id) =>
        patchOne(id, (l) => {
          const signers: LeaseSigner[] =
            l.signers.length > 0
              ? l.signers.map((s) => (s.state === "not-sent" ? { ...s, state: "sent", updatedAt: now() } : s))
              : [
                  ...l.tenants
                    .filter((t) => t.name)
                    .map<LeaseSigner>((t) => ({ id: nextId("sg"), name: t.name, email: t.email, role: "Tenant", state: "sent", updatedAt: now() })),
                  { id: nextId("sg"), name: "Keyhold Owner", email: "owner@keyhold.ca", role: "Landlord", state: "sent", updatedAt: now() },
                ];
          return logged({ ...l, status: "out-for-signature", signers }, `Sent for signature to ${signers.length} signer(s)`);
        }),
      resend: (id, signerId) =>
        patchOne(id, (l) => {
          const s = l.signers.find((x) => x.id === signerId);
          return logged(
            { ...l, signers: l.signers.map((x) => (x.id === signerId ? { ...x, state: "sent", updatedAt: now() } : x)) },
            `Signature request resent to ${s?.name ?? "signer"}`,
          );
        }),
      advanceSigner: (id, signerId) =>
        patchOne(id, (l) => {
          const order: SignerState[] = ["not-sent", "sent", "viewed", "signed"];
          const signers = l.signers.map((s) =>
            s.id === signerId ? { ...s, state: order[Math.min(order.indexOf(s.state) + 1, 3)]!, updatedAt: now() } : s,
          );
          const allSigned = signers.length > 0 && signers.every((s) => s.state === "signed");
          const moved = signers.find((s) => s.id === signerId);
          const next = logged(
            { ...l, signers, ...(allSigned ? { status: "active" as LeaseStatus, locked: true } : null) },
            `${moved?.name ?? "Signer"} — ${signerLabel[moved?.state ?? "sent"].toLowerCase()}`,
          );
          return allSigned ? logged(next, "All signatures received — lease locked and activated") : next;
        }),
      uploadPaperLease: (id, fileName) =>
        patchOne(id, (l) =>
          logged(
            {
              ...l,
              paperUpload: fileName,
              status: "active",
              locked: true,
              addenda: [...l.addenda, fileName],
              signers: l.signers.length
                ? l.signers.map((s) => ({ ...s, state: "signed" as SignerState, updatedAt: now() }))
                : l.tenants
                    .filter((t) => t.name)
                    .map<LeaseSigner>((t) => ({ id: nextId("sg"), name: t.name, email: t.email, role: "Tenant", state: "signed", updatedAt: now() })),
            },
            `Signed paper lease uploaded (${fileName}) — lease locked`,
          ),
        ),
      revertSignature: (id) =>
        patchOne(id, (l) =>
          logged(
            {
              ...l,
              locked: false,
              status: "draft",
              signers: l.signers.map((s) => ({ ...s, state: "not-sent" as SignerState, updatedAt: now() })),
            },
            "Signature reverted — lease unlocked for editing",
          ),
        ),
      renew: (id, months, rent) => {
        const base = leases.find((l) => l.id === id)!;
        const start = addMonthsIso(base.endDate, 0);
        const startNext = new Date(base.endDate);
        startNext.setDate(startNext.getDate() + 1);
        const from = startNext.toISOString().slice(0, 10);
        const renewal: LeaseRecord = {
          ...base,
          id: nextId("ls"),
          renewedFromId: base.id,
          startDate: from,
          endDate: addMonthsIso(from, months),
          firstInvoiceDate: from,
          rent,
          status: "draft",
          locked: false,
          paperUpload: undefined,
          signers: [],
          invoices: [],
          notices: [],
          audit: [
            { id: nextId("au"), at: now(), who: "Keyhold Owner", what: `Renewal drafted from lease ${base.id} (previous term ended ${start})` },
          ],
        };
        setLeases((prev) => [renewal, ...prev]);
        return renewal;
      },
      endTenancy: (id, moveOut, reason) =>
        patchOne(id, (l) => logged({ ...l, status: "ended", endDate: moveOut }, `Move-out started — ${reason} (keys due ${moveOut})`)),
      remove: (id) => setLeases((prev) => prev.filter((l) => l.id !== id)),
    };
  }, [leases]);

  return <LeasesContext.Provider value={value}>{children}</LeasesContext.Provider>;
}

export function useLeases() {
  const ctx = useContext(LeasesContext);
  if (!ctx) throw new Error("useLeases must be used inside <LeasesProvider>");
  return ctx;
}

/** The official standard-lease source, with its version date. */
export const STANDARD_LEASE_SOURCES: Record<string, { authority: string; formName: string; version: string; effectiveDate: string; url: string }> = {
  ON: {
    authority: "Government of Ontario",
    formName: "Residential Tenancy Agreement (Standard Form of Lease) 2229E",
    version: "2229E (2021/12)",
    effectiveDate: "2021-12-01",
    url: "https://www.ontario.ca/page/guide-ontarios-standard-lease",
  },
  BC: {
    authority: "Government of British Columbia",
    formName: "Residential Tenancy Agreement (RTB-1)",
    version: "RTB-1 (2023/09)",
    effectiveDate: "2023-09-01",
    url: "https://www2.gov.bc.ca/gov/content/housing-tenancy/residential-tenancies/forms",
  },
};

export const standardLeaseSource = (province: string) =>
  STANDARD_LEASE_SOURCES[province] ?? STANDARD_LEASE_SOURCES["ON"]!;
