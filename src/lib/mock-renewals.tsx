/**
 * MOCK RENEWALS STORE — prototype state only, NOT a backend.
 * ----------------------------------------------------------
 * Shaped like the future tables:
 *   renewals        -> { id, leaseId, status, offer, response, newLeaseId }
 *   move_outs       -> { id, leaseId, moveOutDate, checklist, forwardingAddress }
 *   renewal_reminders -> derived from Lease settings (renewalLeadDays)
 *
 * Money is stored in whole dollars here to match the existing lease records.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { TODAY, daysUntil, useLeases, type LeaseRecord } from "@/lib/mock-leases";

export type RenewalStatus =
  | "not-started"
  | "offer-sent"
  | "accepted"
  | "declined"
  | "renewed"
  | "ending";

export const RENEWAL_STATUSES: RenewalStatus[] = [
  "not-started",
  "offer-sent",
  "accepted",
  "declined",
  "renewed",
  "ending",
];

export const renewalStatusLabel: Record<RenewalStatus, string> = {
  "not-started": "Not started",
  "offer-sent": "Offer sent",
  accepted: "Accepted",
  declined: "Declined",
  renewed: "Renewed",
  ending: "Ending",
};

export type RenewalOffer = {
  termMonths: number;
  /** whole dollars per month */
  newRent: number;
  currentRent: number;
  percent: number;
  aboveGuideline: boolean;
  effectiveDate: string;
  note: string;
};

export const MOVE_OUT_STEPS = [
  { key: "final-inspection", label: "Final (move-out) inspection booked", help: "Compare against the move-in record." },
  { key: "deposit", label: "Deposit reconciled", help: "Last month's rent applied or returned with interest." },
  { key: "final-invoice", label: "Final invoice issued", help: "Pro-rated rent, damages and any outstanding balance." },
  { key: "portal", label: "Portal access deactivated", help: "Turn off the tenant's login on the move-out date." },
  { key: "forwarding", label: "Forwarding address on file", help: "Needed for the deposit and any tax slips." },
] as const;

export type MoveOutStepKey = (typeof MOVE_OUT_STEPS)[number]["key"];

export type RenewalEvent = { id: string; at: string; what: string };

export type RenewalRecord = {
  id: string;
  leaseId: string;
  status: RenewalStatus;
  offer: RenewalOffer | null;
  offerSentOn: string | null;
  respondedOn: string | null;
  newLeaseId: string | null;
  invoicingScheduledFrom: string | null;
  moveOutDate: string | null;
  moveOutReason: string;
  forwardingAddress: string;
  checklist: Record<string, boolean>;
  history: RenewalEvent[];
};

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

const emptyChecklist = (): Record<string, boolean> =>
  Object.fromEntries(MOVE_OUT_STEPS.map((s) => [s.key, false]));

function blank(leaseId: string): RenewalRecord {
  return {
    id: uid("rn"),
    leaseId,
    status: "not-started",
    offer: null,
    offerSentOn: null,
    respondedOn: null,
    newLeaseId: null,
    invoicingScheduledFrom: null,
    moveOutDate: null,
    moveOutReason: "",
    forwardingAddress: "",
    checklist: emptyChecklist(),
    history: [],
  };
}

/** 30 / 60 / 90 day buckets — anything sooner rolls into the 30-day group. */
export type RenewalBucket = "30" | "60" | "90";
export const BUCKET_LABEL: Record<RenewalBucket, string> = {
  "30": "Expiring within 30 days",
  "60": "31–60 days",
  "90": "61–90 days",
};

export function bucketFor(lease: LeaseRecord): RenewalBucket | null {
  const d = daysUntil(lease.endDate);
  if (d > 90) return null;
  if (d <= 30) return "30";
  if (d <= 60) return "60";
  return "90";
}

type Ctx = {
  today: string;
  records: RenewalRecord[];
  forLease: (leaseId: string) => RenewalRecord | undefined;
  statusOf: (leaseId: string) => RenewalStatus;
  startRenewal: (leaseId: string, offer: RenewalOffer) => RenewalRecord;
  sendOffer: (leaseId: string) => void;
  recordResponse: (leaseId: string, accepted: boolean, note?: string) => void;
  /** creates the next lease term and schedules invoicing from its start date */
  completeRenewal: (leaseId: string) => string | null;
  startEnding: (leaseId: string, moveOutDate: string, reason: string) => void;
  toggleStep: (leaseId: string, key: MoveOutStepKey) => void;
  setForwardingAddress: (leaseId: string, address: string) => void;
  reset: (leaseId: string) => void;
};

const RenewalsContext = createContext<Ctx | null>(null);

export function RenewalsProvider({ children }: { children: ReactNode }) {
  const leases = useLeases();
  const [records, setRecords] = useState<RenewalRecord[]>([]);

  const value = useMemo<Ctx>(() => {
    const upsert = (leaseId: string, fn: (r: RenewalRecord) => RenewalRecord) =>
      setRecords((prev) => {
        const existing = prev.find((r) => r.leaseId === leaseId);
        const base = existing ?? blank(leaseId);
        const next = fn(base);
        return existing ? prev.map((r) => (r.leaseId === leaseId ? next : r)) : [next, ...prev];
      });

    const logged = (r: RenewalRecord, what: string): RenewalRecord => ({
      ...r,
      history: [...r.history, { id: uid("ev"), at: now(), what }],
    });

    return {
      today: TODAY,
      records,
      forLease: (leaseId) => records.find((r) => r.leaseId === leaseId),
      statusOf: (leaseId) => records.find((r) => r.leaseId === leaseId)?.status ?? "not-started",

      startRenewal: (leaseId, offer) => {
        const record = logged(
          { ...blank(leaseId), offer, status: "not-started" },
          `Renewal started — ${offer.termMonths} months at $${offer.newRent}/mo from ${offer.effectiveDate}`,
        );
        setRecords((prev) => [record, ...prev.filter((r) => r.leaseId !== leaseId)]);
        return record;
      },

      sendOffer: (leaseId) =>
        upsert(leaseId, (r) =>
          logged({ ...r, status: "offer-sent", offerSentOn: TODAY }, "Renewal offer sent to the tenant"),
        ),

      recordResponse: (leaseId, accepted, note = "") =>
        upsert(leaseId, (r) =>
          logged(
            { ...r, status: accepted ? "accepted" : "declined", respondedOn: TODAY },
            accepted
              ? `Tenant accepted the renewal${note ? ` — ${note}` : ""}`
              : `Tenant declined the renewal${note ? ` — ${note}` : ""}`,
          ),
        ),

      completeRenewal: (leaseId) => {
        const record = records.find((r) => r.leaseId === leaseId);
        if (!record?.offer) return null;
        const created = leases.renew(leaseId, record.offer.termMonths, record.offer.newRent);
        upsert(leaseId, (r) =>
          logged(
            {
              ...r,
              status: "renewed",
              newLeaseId: created.id,
              invoicingScheduledFrom: created.firstInvoiceDate,
            },
            `New term created (${created.startDate} → ${created.endDate}) — invoicing scheduled from ${created.firstInvoiceDate}`,
          ),
        );
        return created.id;
      },

      startEnding: (leaseId, moveOutDate, reason) =>
        upsert(leaseId, (r) =>
          logged(
            { ...r, status: "ending", moveOutDate, moveOutReason: reason, checklist: r.checklist },
            `Move-out started — keys due ${moveOutDate}${reason ? ` (${reason})` : ""}`,
          ),
        ),

      toggleStep: (leaseId, key) =>
        upsert(leaseId, (r) => ({ ...r, checklist: { ...r.checklist, [key]: !r.checklist[key] } })),

      setForwardingAddress: (leaseId, address) =>
        upsert(leaseId, (r) => ({
          ...r,
          forwardingAddress: address,
          checklist: { ...r.checklist, forwarding: address.trim().length > 0 },
        })),

      reset: (leaseId) => setRecords((prev) => prev.filter((r) => r.leaseId !== leaseId)),
    };
  }, [records, leases]);

  return <RenewalsContext.Provider value={value}>{children}</RenewalsContext.Provider>;
}

export function useRenewals() {
  const ctx = useContext(RenewalsContext);
  if (!ctx) throw new Error("useRenewals must be used inside <RenewalsProvider>");
  return ctx;
}

/** Reminder maths — the lead time comes from Lease settings. */
export function reminderState(lease: LeaseRecord, leadDays: number) {
  const d = daysUntil(lease.endDate);
  return {
    daysLeft: d,
    due: d <= leadDays,
    /** the day the first reminder should fire */
    fireOn: new Date(new Date(lease.endDate).getTime() - leadDays * 864e5).toISOString().slice(0, 10),
  };
}
