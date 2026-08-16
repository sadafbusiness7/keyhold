/**
 * SETTINGS + SUBSCRIPTION — isolated mock store, shaped like the real schema.
 *
 * Tables this mirrors:
 *   business_profile(id, name, logo_url, address, phone, email, business_number,
 *                    province, time_zone, language)
 *   notification_prefs(event, channel, enabled) + digest
 *   rent_settings(due_day, grace_days, late_fee_*, nsf_cents, auto_apply_*, methods[])
 *   lease_settings(default_term_months, deposit_rules, clauses[], renewal_lead_days)
 *   tax_settings(registered, gst_hst_number, rates[{province, ratePct, label}], applies_to[])
 *   message_templates(id, event, channel, subject, body)
 *   auth_sessions(id, device, location, last_seen, current)
 *   consent_records(id, kind, subject, granted_on, source)
 *   subscriptions(plan_id, units_included, price_cents, renews_on, status)
 *   invoices(id, date, amount_cents, status)
 *
 * Nothing here talks to a backend: it is React state so the prototype can be
 * driven live. Money is integer cents.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/* ------------------------------- types ---------------------------------- */

export type BusinessProfile = {
  name: string;
  logoName: string | null;
  address: string;
  city: string;
  province: string;
  postal: string;
  phone: string;
  email: string;
  businessNumber: string;
  timeZone: string;
  language: "en" | "fr";
};

export const NOTIFY_EVENTS = [
  { key: "rent-due", label: "Rent due" },
  { key: "rent-received", label: "Rent received" },
  { key: "rent-overdue", label: "Rent overdue" },
  { key: "maintenance-submitted", label: "Maintenance submitted" },
  { key: "lease-expiring", label: "Lease expiring" },
  { key: "notice-served", label: "Notice served" },
] as const;
export type NotifyEvent = (typeof NOTIFY_EVENTS)[number]["key"];
export const CHANNELS = ["email", "sms", "in-app"] as const;
export type Channel = (typeof CHANNELS)[number];

export type NotificationPrefs = {
  matrix: Record<NotifyEvent, Record<Channel, boolean>>;
  digest: "off" | "daily" | "weekly";
};

export type LateFeeKind = "flat" | "percent";
export type RentSettings = {
  dueDay: number;
  graceDays: number;
  lateFeeKind: LateFeeKind;
  lateFeeFlatCents: number;
  lateFeePercent: number;
  lateFeeAfterDays: number;
  lateFeeCapCents: number;
  nsfCents: number;
  autoApplyCredits: boolean;
  autoApplyLastMonth: boolean;
  methods: { key: string; label: string; on: boolean }[];
};

export type Clause = { id: string; title: string; body: string };
export type LeaseSettings = {
  defaultTermMonths: number;
  depositRule: "last-month" | "none" | "custom";
  depositCustomCents: number;
  petDepositCents: number;
  keyDepositCents: number;
  provinceForm: string;
  renewalLeadDays: number;
  clauses: Clause[];
};

export type TaxRate = { province: string; label: string; ratePct: number };
export type TaxSettings = {
  registered: boolean;
  gstHstNumber: string;
  rates: TaxRate[];
  appliesTo: { key: string; label: string; on: boolean }[];
};

export type Template = {
  id: string;
  event: NotifyEvent;
  channel: Exclude<Channel, "in-app">;
  subject: string;
  body: string;
};

export type Session = {
  id: string;
  device: string;
  location: string;
  lastSeen: string;
  current: boolean;
};

export type ConsentRecord = {
  id: string;
  kind: string;
  subject: string;
  grantedOn: string;
  source: string;
};

export type BillingInvoice = {
  id: string;
  date: string;
  description: string;
  amountCents: number;
  status: "paid" | "refunded";
};

export type PaymentMethodOnFile = {
  brand: string;
  last4: string;
  expiry: string;
  name: string;
};

export type Subscription = {
  planId: "solo" | "growing" | "portfolio" | "manager";
  includedUnits: number;
  renewsOn: string;
  status: "active" | "cancelled";
  mfaEnabled: boolean;
};

/* ------------------------------- defaults -------------------------------- */

const defaultMatrix = () => {
  const m = {} as NotificationPrefs["matrix"];
  for (const e of NOTIFY_EVENTS) {
    m[e.key] = { email: true, sms: e.key === "rent-overdue", "in-app": true };
  }
  return m;
};

const initialProfile: BusinessProfile = {
  name: "Reid Property Co.",
  logoName: null,
  address: "412 Lansdowne Ave",
  city: "Toronto",
  province: "ON",
  postal: "M6H 3Y2",
  phone: "(416) 555-0142",
  email: "alison@keyhold.ca",
  businessNumber: "80123 4567 RT0001",
  timeZone: "America/Toronto",
  language: "en",
};

const initialRent: RentSettings = {
  dueDay: 1,
  graceDays: 3,
  lateFeeKind: "flat",
  lateFeeFlatCents: 2500,
  lateFeePercent: 2,
  lateFeeAfterDays: 5,
  lateFeeCapCents: 10000,
  nsfCents: 4500,
  autoApplyCredits: true,
  autoApplyLastMonth: true,
  methods: [
    { key: "etransfer", label: "Interac e-Transfer", on: true },
    { key: "cheque", label: "Cheque", on: true },
    { key: "cash", label: "Cash", on: false },
    { key: "preauth", label: "Pre-authorized debit", on: false },
  ],
};

const initialLease: LeaseSettings = {
  defaultTermMonths: 12,
  depositRule: "last-month",
  depositCustomCents: 0,
  petDepositCents: 0,
  keyDepositCents: 5000,
  provinceForm: "Ontario Standard Lease (2229E, Dec 2024)",
  renewalLeadDays: 90,
  clauses: [
    { id: "cl_smoke", title: "No smoking", body: "Smoking of any kind is not permitted inside the rental unit or on balconies." },
    { id: "cl_pets", title: "Pets", body: "Pets are welcome. Tenants remain responsible for any damage or noise caused by their animals." },
    { id: "cl_snow", title: "Snow clearing", body: "The landlord clears the driveway and walkways after snowfalls of 5cm or more." },
  ],
};

const initialTax: TaxSettings = {
  registered: true,
  gstHstNumber: "80123 4567 RT0001",
  rates: [
    { province: "ON", label: "HST", ratePct: 13 },
    { province: "BC", label: "GST + PST", ratePct: 12 },
    { province: "AB", label: "GST", ratePct: 5 },
    { province: "QC", label: "GST + QST", ratePct: 14.975 },
    { province: "NS", label: "HST", ratePct: 14 },
  ],
  appliesTo: [
    { key: "mgmt-fee", label: "Management fees", on: true },
    { key: "parking", label: "Parking & storage", on: true },
    { key: "residential-rent", label: "Residential rent (usually exempt)", on: false },
    { key: "late-fees", label: "Late fees", on: false },
  ],
};

const initialTemplates: Template[] = [
  {
    id: "tpl_due",
    event: "rent-due",
    channel: "email",
    subject: "Rent for {{month}} is due {{due_date}}",
    body: "Hi {{first_name}},\n\nA friendly reminder that {{amount}} for {{unit}} is due on {{due_date}}.\n\nThank you,\n{{business_name}}",
  },
  {
    id: "tpl_received",
    event: "rent-received",
    channel: "email",
    subject: "Thanks — we received {{amount}}",
    body: "Hi {{first_name}},\n\nWe received {{amount}} for {{unit}}. Your receipt is attached.\n\n{{business_name}}",
  },
  {
    id: "tpl_overdue",
    event: "rent-overdue",
    channel: "sms",
    subject: "",
    body: "Hi {{first_name}}, rent of {{amount}} for {{unit}} is now overdue. Reply here if something's gone wrong.",
  },
  {
    id: "tpl_lease",
    event: "lease-expiring",
    channel: "email",
    subject: "Your lease ends {{lease_end}}",
    body: "Hi {{first_name}},\n\nYour lease for {{unit}} ends on {{lease_end}}. We'd be glad to renew — just reply and let us know.\n\n{{business_name}}",
  },
];

const initialSessions: Session[] = [
  { id: "s1", device: "Chrome on macOS", location: "Toronto, ON", lastSeen: "Just now", current: true },
  { id: "s2", device: "Safari on iPhone", location: "Toronto, ON", lastSeen: "2 hours ago", current: false },
  { id: "s3", device: "Firefox on Windows", location: "Hamilton, ON", lastSeen: "Aug 3, 2026", current: false },
];

const initialConsents: ConsentRecord[] = [
  { id: "c1", kind: "Electronic notices", subject: "Marie Tremblay", grantedOn: "2023-11-01", source: "Lease signing" },
  { id: "c2", kind: "SMS reminders", subject: "Grace Okafor", grantedOn: "2022-09-01", source: "Tenant portal" },
  { id: "c3", kind: "Credit check", subject: "Dev Sharma", grantedOn: "2024-09-14", source: "Application form" },
];

const initialInvoices: BillingInvoice[] = [
  { id: "KH-2026-08", date: "2026-08-01", description: "Keyhold subscription — August", amountCents: 1689, status: "paid" },
  { id: "KH-2026-07", date: "2026-07-01", description: "Keyhold subscription — July", amountCents: 1689, status: "paid" },
  { id: "KH-2026-06", date: "2026-06-01", description: "Keyhold subscription — June", amountCents: 499, status: "paid" },
  { id: "KH-2026-05", date: "2026-05-01", description: "Keyhold subscription — May", amountCents: 499, status: "paid" },
];

/* ------------------------------- context --------------------------------- */

type Ctx = {
  profile: BusinessProfile;
  setProfile: (p: Partial<BusinessProfile>) => void;
  notifications: NotificationPrefs;
  toggleNotify: (event: NotifyEvent, channel: Channel) => void;
  setDigest: (d: NotificationPrefs["digest"]) => void;
  rent: RentSettings;
  setRent: (p: Partial<RentSettings>) => void;
  toggleMethod: (key: string) => void;
  lease: LeaseSettings;
  setLease: (p: Partial<LeaseSettings>) => void;
  addClause: (c: Omit<Clause, "id">) => void;
  removeClause: (id: string) => void;
  tax: TaxSettings;
  setTax: (p: Partial<TaxSettings>) => void;
  setRate: (province: string, ratePct: number) => void;
  toggleAppliesTo: (key: string) => void;
  templates: Template[];
  saveTemplate: (t: Template) => void;
  sessions: Session[];
  revokeSession: (id: string) => void;
  consents: ConsentRecord[];
  subscription: Subscription;
  setSubscription: (p: Partial<Subscription>) => void;
  paymentMethod: PaymentMethodOnFile;
  setPaymentMethod: (p: Partial<PaymentMethodOnFile>) => void;
  invoices: BillingInvoice[];
};

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState(initialProfile);
  const [notifications, setNotifications] = useState<NotificationPrefs>({
    matrix: defaultMatrix(),
    digest: "weekly",
  });
  const [rent, setRentState] = useState(initialRent);
  const [lease, setLeaseState] = useState(initialLease);
  const [tax, setTaxState] = useState(initialTax);
  const [templates, setTemplates] = useState(initialTemplates);
  const [sessions, setSessions] = useState(initialSessions);
  const [consents] = useState(initialConsents);
  const [subscription, setSubState] = useState<Subscription>({
    planId: "growing",
    includedUnits: 12,
    renewsOn: "2026-09-01",
    status: "active",
    mfaEnabled: false,
  });
  const [paymentMethod, setPmState] = useState<PaymentMethodOnFile>({
    brand: "Visa",
    last4: "4242",
    expiry: "09/28",
    name: "Alison Reid",
  });

  const value = useMemo<Ctx>(
    () => ({
      profile,
      setProfile: (p) => setProfileState((s) => ({ ...s, ...p })),
      notifications,
      toggleNotify: (event, channel) =>
        setNotifications((s) => ({
          ...s,
          matrix: { ...s.matrix, [event]: { ...s.matrix[event], [channel]: !s.matrix[event][channel] } },
        })),
      setDigest: (digest) => setNotifications((s) => ({ ...s, digest })),
      rent,
      setRent: (p) => setRentState((s) => ({ ...s, ...p })),
      toggleMethod: (key) =>
        setRentState((s) => ({
          ...s,
          methods: s.methods.map((m) => (m.key === key ? { ...m, on: !m.on } : m)),
        })),
      lease,
      setLease: (p) => setLeaseState((s) => ({ ...s, ...p })),
      addClause: (c) =>
        setLeaseState((s) => ({ ...s, clauses: [...s.clauses, { ...c, id: `cl_${Date.now()}` }] })),
      removeClause: (id) => setLeaseState((s) => ({ ...s, clauses: s.clauses.filter((c) => c.id !== id) })),
      tax,
      setTax: (p) => setTaxState((s) => ({ ...s, ...p })),
      setRate: (province, ratePct) =>
        setTaxState((s) => ({
          ...s,
          rates: s.rates.map((r) => (r.province === province ? { ...r, ratePct } : r)),
        })),
      toggleAppliesTo: (key) =>
        setTaxState((s) => ({
          ...s,
          appliesTo: s.appliesTo.map((a) => (a.key === key ? { ...a, on: !a.on } : a)),
        })),
      templates,
      saveTemplate: (t) => setTemplates((s) => s.map((x) => (x.id === t.id ? t : x))),
      sessions,
      revokeSession: (id) => setSessions((s) => s.filter((x) => x.id !== id)),
      consents,
      subscription,
      setSubscription: (p) => setSubState((s) => ({ ...s, ...p })),
      paymentMethod,
      setPaymentMethod: (p) => setPmState((s) => ({ ...s, ...p })),
      invoices: initialInvoices,
    }),
    [profile, notifications, rent, lease, tax, templates, sessions, consents, subscription, paymentMethod],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

/** Safe read for chrome that renders outside the provider. */
export function useOptionalSettings() {
  return useContext(SettingsContext);
}

/** Fill {{tags}} in a template with a sample tenant so the preview reads real. */
export const SAMPLE_TAGS: Record<string, string> = {
  first_name: "Marie",
  last_name: "Tremblay",
  unit: "Main floor, 412 Lansdowne Ave",
  amount: "CA$2,350.00",
  due_date: "September 1, 2026",
  month: "September",
  lease_end: "October 31, 2026",
  business_name: "Reid Property Co.",
};

export function fillTags(text: string, tags: Record<string, string> = SAMPLE_TAGS) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k: string) => tags[k] ?? m);
}
