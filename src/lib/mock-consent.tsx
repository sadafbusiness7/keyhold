/**
 * CONSENT, PRIVACY RIGHTS + RETENTION — isolated mock store, real schema shape.
 *
 * Tables this mirrors:
 *   consent_records(id, person_id, person_name, kind, status, version, method,
 *                   recorded_at, recorded_by, withdrawn_at, note)
 *   retention_settings(record_type, months, minimum_months, legal_note)
 *   privacy_requests(id, kind, subject, opened_at, due_at, status, grace_until)
 *   login_events(id, at, device, location, result)
 *   recovery_codes(code, used)
 *
 * Everything is React state — no backend. Dates are ISO strings.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/* --------------------------------- consent -------------------------------- */

export const CONSENT_KINDS = [
  { key: "credit-check", label: "Credit check", body: "Permission to order a credit or tenancy report for an application.", version: "2026-03 v2", required: false },
  { key: "rent-reporting", label: "Rent reporting opt-in", body: "Reporting on-time rent payments to a credit bureau. Opt-in only, and reversible.", version: "2026-01 v1", required: false },
  { key: "electronic-communication", label: "Electronic communication", body: "Receiving notices, receipts and documents by email instead of paper.", version: "2025-11 v3", required: false },
  { key: "e-signature", label: "Electronic signature", body: "Signing leases and forms electronically under provincial e-commerce law.", version: "2025-11 v2", required: false },
  { key: "marketing", label: "Marketing messages (CASL)", body: "Product news and tips. Express consent under Canada's anti-spam legislation.", version: "2026-02 v1", required: false },
] as const;

export type ConsentKind = (typeof CONSENT_KINDS)[number]["key"];
export type ConsentMethod = "lease-signing" | "tenant-portal" | "application-form" | "in-person" | "email-reply" | "admin-recorded";
export type ConsentStatus = "granted" | "withdrawn";

export const METHOD_LABEL: Record<ConsentMethod, string> = {
  "lease-signing": "Lease signing",
  "tenant-portal": "Tenant portal",
  "application-form": "Application form",
  "in-person": "In person, recorded by staff",
  "email-reply": "Email reply",
  "admin-recorded": "Recorded by the owner",
};

export type ConsentRecordFull = {
  id: string;
  personId: string;
  personName: string;
  kind: ConsentKind;
  status: ConsentStatus;
  version: string;
  method: ConsentMethod;
  recordedAt: string;
  recordedBy: string;
  withdrawnAt?: string | undefined;
  note?: string | undefined;
};

export const consentLabel = (k: ConsentKind) => CONSENT_KINDS.find((c) => c.key === k)?.label ?? k;
export const consentVersion = (k: ConsentKind) => CONSENT_KINDS.find((c) => c.key === k)?.version ?? "v1";

const seedConsents: ConsentRecordFull[] = [
  { id: "cn_1", personId: "t_marie", personName: "Marie Tremblay", kind: "electronic-communication", status: "granted", version: "2025-11 v3", method: "lease-signing", recordedAt: "2023-11-01T14:05:00Z", recordedBy: "Alison Reid" },
  { id: "cn_2", personId: "t_marie", personName: "Marie Tremblay", kind: "e-signature", status: "granted", version: "2025-11 v2", method: "lease-signing", recordedAt: "2023-11-01T14:06:00Z", recordedBy: "Alison Reid" },
  { id: "cn_3", personId: "t_grace", personName: "Grace Okafor", kind: "electronic-communication", status: "granted", version: "2025-11 v3", method: "tenant-portal", recordedAt: "2022-09-01T18:22:00Z", recordedBy: "Self-serve" },
  { id: "cn_4", personId: "t_grace", personName: "Grace Okafor", kind: "rent-reporting", status: "granted", version: "2026-01 v1", method: "tenant-portal", recordedAt: "2026-02-11T13:40:00Z", recordedBy: "Self-serve" },
  { id: "cn_5", personId: "t_dev", personName: "Dev Sharma", kind: "credit-check", status: "granted", version: "2026-03 v2", method: "application-form", recordedAt: "2024-09-14T09:15:00Z", recordedBy: "Priya Nair" },
  { id: "cn_6", personId: "t_dev", personName: "Dev Sharma", kind: "marketing", status: "withdrawn", version: "2026-02 v1", method: "email-reply", recordedAt: "2025-04-02T11:00:00Z", recordedBy: "Self-serve", withdrawnAt: "2026-05-19T08:30:00Z", note: "Replied STOP to a reminder." },
  { id: "cn_7", personId: "u_owner", personName: "Alison Reid", kind: "marketing", status: "granted", version: "2026-02 v1", method: "admin-recorded", recordedAt: "2026-01-05T16:00:00Z", recordedBy: "Self-serve" },
];

/* -------------------------------- retention ------------------------------- */

export type RetentionKey = "moved-out-tenants" | "screening-references" | "documents" | "messages" | "sign-in-logs" | "declined-applicants";

export type RetentionRule = {
  key: RetentionKey;
  label: string;
  hint: string;
  months: number;
  options: number[];
  legalNote: string;
};

const seedRetention: RetentionRule[] = [
  { key: "moved-out-tenants", label: "Moved-out tenant records", hint: "Contact details and tenancy history after the tenancy ends.", months: 24, options: [12, 24, 36, 84], legalNote: "Financial records tied to rent stay 7 years regardless — only contact details are removed." },
  { key: "screening-references", label: "Screening & reference results", hint: "Credit and reference reports gathered during an application.", months: 12, options: [3, 6, 12, 24], legalNote: "Keep long enough to answer a human-rights complaint; the shorter the better." },
  { key: "declined-applicants", label: "Declined applicants", hint: "Applications that did not proceed.", months: 12, options: [6, 12, 24], legalNote: "Decline reasons support a fair-housing audit trail." },
  { key: "documents", label: "Uploaded documents", hint: "Leases, inspection photos and attachments after a tenancy ends.", months: 84, options: [24, 36, 84, 120], legalNote: "Leases and receipts are commonly kept 7 years for CRA purposes." },
  { key: "messages", label: "Messages & announcements", hint: "Conversations with tenants, vendors and team.", months: 24, options: [12, 24, 36], legalNote: "Useful evidence in a tenancy dispute." },
  { key: "sign-in-logs", label: "Sign-in & security logs", hint: "Login history and session activity.", months: 12, options: [3, 6, 12, 24], legalNote: "Needed to investigate misuse; 12 months is our default." },
];

/* ----------------------------- privacy requests --------------------------- */

export type PrivacyRequestKind = "access" | "correction" | "deletion";
export type PrivacyRequest = {
  id: string;
  kind: PrivacyRequestKind;
  subject: string;
  detail: string;
  openedAt: string;
  dueAt: string;
  status: "open" | "completed" | "cancelled";
  graceUntil?: string | undefined;
};

/** What deletion actually removes, and what the law makes us keep. */
export const DELETION_MATRIX = [
  { item: "Tenant contact details, portals and messages", action: "deleted" as const, when: "At the end of the grace period" },
  { item: "Properties, units, leases and documents you uploaded", action: "deleted" as const, when: "At the end of the grace period" },
  { item: "Screening and reference results", action: "deleted" as const, when: "At the end of the grace period" },
  { item: "Rent invoices, receipts and payouts", action: "retained" as const, when: "7 years — Income Tax Act record-keeping" },
  { item: "Consent records", action: "retained" as const, when: "7 years after withdrawal — proof of what was agreed" },
  { item: "Keyhold billing invoices", action: "retained" as const, when: "7 years — our own tax records" },
  { item: "Security and audit logs", action: "retained" as const, when: "12 months, then deleted" },
  { item: "Backups", action: "retained" as const, when: "Purged on the normal 35-day backup cycle" },
];

export const DELETION_GRACE_DAYS = 30;

/* -------------------------------- security -------------------------------- */

export type LoginEvent = { id: string; at: string; device: string; location: string; ip: string; result: "success" | "failed" | "mfa-challenge" };

const seedLogins: LoginEvent[] = [
  { id: "le1", at: "2026-08-15T13:02:00Z", device: "Chrome on macOS", location: "Toronto, ON", ip: "24.114.10.8", result: "success" },
  { id: "le2", at: "2026-08-14T21:47:00Z", device: "Safari on iPhone", location: "Toronto, ON", ip: "24.114.10.8", result: "success" },
  { id: "le3", at: "2026-08-12T07:12:00Z", device: "Firefox on Windows", location: "Hamilton, ON", ip: "99.240.66.2", result: "mfa-challenge" },
  { id: "le4", at: "2026-08-09T02:31:00Z", device: "Unknown browser", location: "Phoenix, AZ", ip: "38.15.201.77", result: "failed" },
  { id: "le5", at: "2026-08-03T15:20:00Z", device: "Chrome on macOS", location: "Toronto, ON", ip: "24.114.10.8", result: "success" },
];

/** Deterministic, readable recovery codes — no randomness so the demo repeats. */
export function makeRecoveryCodes(seed = 1): string[] {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const codes: string[] = [];
  let n = seed * 7919;
  for (let i = 0; i < 10; i++) {
    let code = "";
    for (let c = 0; c < 10; c++) {
      n = (n * 1103515245 + 12345) % 2147483648;
      code += alphabet[n % alphabet.length];
      if (c === 4) code += "-";
    }
    codes.push(code);
  }
  return codes;
}

/* --------------------------------- context -------------------------------- */

type Ctx = {
  consents: ConsentRecordFull[];
  people: { id: string; name: string }[];
  consentsFor: (personId: string) => ConsentRecordFull[];
  grantConsent: (input: { personId: string; personName: string; kind: ConsentKind; method: ConsentMethod; recordedBy?: string | undefined; note?: string | undefined }) => void;
  withdrawConsent: (id: string, note?: string) => void;
  retention: RetentionRule[];
  setRetention: (key: RetentionKey, months: number) => void;
  resetRetention: () => void;
  requests: PrivacyRequest[];
  openRequest: (input: { kind: PrivacyRequestKind; subject: string; detail: string }) => PrivacyRequest;
  cancelRequest: (id: string) => void;
  completeRequest: (id: string) => void;
  logins: LoginEvent[];
  recoveryCodes: string[] | null;
  generateRecoveryCodes: () => string[];
  cookiePrefs: Record<string, boolean>;
  setCookiePref: (key: string, on: boolean) => void;
};

const ConsentContext = createContext<Ctx | null>(null);

const addDays = (iso: string, days: number) => new Date(new Date(iso).getTime() + days * 86400000).toISOString();

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consents, setConsents] = useState<ConsentRecordFull[]>(seedConsents);
  const [retention, setRetentionState] = useState<RetentionRule[]>(seedRetention);
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [cookiePrefs, setCookiePrefs] = useState<Record<string, boolean>>({ essential: true, preferences: true, analytics: false });

  const value = useMemo<Ctx>(() => {
    const people = Array.from(new Map(consents.map((c) => [c.personId, { id: c.personId, name: c.personName }])).values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    return {
      consents,
      people,
      consentsFor: (personId) =>
        consents.filter((c) => c.personId === personId).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
      grantConsent: ({ personId, personName, kind, method, recordedBy = "Alison Reid", note }) =>
        setConsents((s) => [
          {
            id: `cn_${Date.now()}`,
            personId,
            personName,
            kind,
            status: "granted",
            version: consentVersion(kind),
            method,
            recordedAt: new Date().toISOString(),
            recordedBy,
            note,
          },
          ...s,
        ]),
      withdrawConsent: (id, note) =>
        setConsents((s) =>
          s.map((c) => (c.id === id ? { ...c, status: "withdrawn", withdrawnAt: new Date().toISOString(), note: note ?? c.note } : c)),
        ),
      retention,
      setRetention: (key, months) => setRetentionState((s) => s.map((r) => (r.key === key ? { ...r, months } : r))),
      resetRetention: () => setRetentionState(seedRetention),
      requests,
      openRequest: ({ kind, subject, detail }) => {
        const openedAt = new Date().toISOString();
        const req: PrivacyRequest = {
          id: `pr_${Date.now()}`,
          kind,
          subject,
          detail,
          openedAt,
          dueAt: addDays(openedAt, 30),
          status: "open",
          graceUntil: kind === "deletion" ? addDays(openedAt, DELETION_GRACE_DAYS) : undefined,
        };
        setRequests((s) => [req, ...s]);
        return req;
      },
      cancelRequest: (id) => setRequests((s) => s.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r))),
      completeRequest: (id) => setRequests((s) => s.map((r) => (r.id === id ? { ...r, status: "completed" } : r))),
      logins: seedLogins,
      recoveryCodes,
      generateRecoveryCodes: () => {
        const codes = makeRecoveryCodes(Math.max(1, requests.length + consents.length));
        setRecoveryCodes(codes);
        return codes;
      },
      cookiePrefs,
      setCookiePref: (key, on) => setCookiePrefs((s) => ({ ...s, [key]: on })),
    };
  }, [consents, retention, requests, recoveryCodes, cookiePrefs]);

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used inside ConsentProvider");
  return ctx;
}

export function useOptionalConsent() {
  return useContext(ConsentContext);
}

/* -------------------------------- formatting ------------------------------ */

export const stamp = (iso: string) =>
  new Date(iso).toLocaleString("en-CA", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export const dayOnly = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });

export const monthsLabel = (m: number) => (m % 12 === 0 ? `${m / 12} year${m === 12 ? "" : "s"}` : `${m} months`);
