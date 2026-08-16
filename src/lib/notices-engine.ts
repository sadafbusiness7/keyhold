/**
 * PROVINCIAL NOTICES — pure rules engine (no React, no state).
 * ------------------------------------------------------------
 * Every date and dollar figure on a notice is computed here, deterministically.
 * AI may explain these fields in plain language, but it never decides them and
 * never decides to serve a notice — a human confirms before anything generates.
 *
 * Ontario is implemented first (LTB forms N1 and N4). Other provinces are
 * declared as "coming" so the UI can say so honestly.
 */
import type { PdfLine } from "@/lib/pdf-writer";

export type Province = "ON" | "BC" | "AB" | "QC" | "MB" | "SK" | "NS" | "NB" | "NL" | "PE";
export type NoticeType = "N1" | "N4";

export type NoticeSource = {
  authority: string;
  formName: string;
  version: string;
  effectiveDate: string;
  url: string;
};

/** Official source of truth shown beside every notice. */
export const NOTICE_SOURCES: Record<NoticeType, NoticeSource> = {
  N1: {
    authority: "Ontario Landlord and Tenant Board",
    formName: "Form N1 — Notice of Rent Increase",
    version: "Version 2024/06",
    effectiveDate: "2024-06-01",
    url: "https://tribunalsontario.ca/ltb/forms/#landlord-forms",
  },
  N4: {
    authority: "Ontario Landlord and Tenant Board",
    formName: "Form N4 — Notice to End a Tenancy Early for Non-payment of Rent",
    version: "Version 2024/06",
    effectiveDate: "2024-06-01",
    url: "https://tribunalsontario.ca/ltb/forms/#landlord-forms",
  },
};

/** Ontario rent increase guideline by year (published by the province). */
export const ON_GUIDELINE: Record<number, number> = { 2024: 2.5, 2025: 2.5, 2026: 2.5 };

export const NOTICE_RULES: Record<NoticeType, { title: string; short: string; noticeDays: number; plain: string }> = {
  N1: {
    title: "N1 — Notice of Rent Increase",
    short: "Rent increase",
    noticeDays: 90,
    plain:
      "Ontario requires at least 90 days' written notice before a rent increase takes effect, and at least 12 months between increases. Most units are capped at the provincial guideline.",
  },
  N4: {
    title: "N4 — Notice to End a Tenancy Early for Non-payment of Rent",
    short: "Non-payment of rent",
    noticeDays: 14,
    plain:
      "An N4 tells the tenant how much rent is owed and gives them at least 14 days to pay it. It does not end the tenancy on its own — only the Landlord and Tenant Board can order that.",
  },
};

export const PROVINCE_STATUS: Record<string, { label: string; forms: NoticeType[]; ready: boolean }> = {
  ON: { label: "Ontario", forms: ["N1", "N4"], ready: true },
  BC: { label: "British Columbia", forms: [], ready: false },
  AB: { label: "Alberta", forms: [], ready: false },
  QC: { label: "Quebec", forms: [], ready: false },
};

// —— date maths ————————————————————————————————————————
export const addDays = (iso: string, days: number) => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const addMonths = (iso: string, months: number) => {
  const d = new Date(iso + "T12:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

/** First day of the month on/after a date — rent increases start a rent period. */
export const startOfNextRentPeriod = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  if (d.getDate() !== 1) {
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
  }
  return d.toISOString().slice(0, 10);
};

export const daysBetween = (fromIso: string, toIso: string) =>
  Math.round((new Date(toIso + "T12:00:00").getTime() - new Date(fromIso + "T12:00:00").getTime()) / 86_400_000);

export const fullDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });

export const money = (amount: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount).replace("$", "CA$");

// —— N1: rent increase —————————————————————————————————
export type N1Calc = {
  earliestEffective: string;
  effectiveDate: string;
  guidelinePct: number;
  proposedPct: number;
  currentRent: number;
  newRent: number;
  increase: number;
  aboveGuideline: boolean;
  noticeDaysGiven: number;
  noticeOk: boolean;
};

export function calcN1(input: {
  today: string;
  currentRent: number;
  percent: number;
  effectiveDate?: string | undefined;
}): N1Calc {
  const earliestEffective = startOfNextRentPeriod(addDays(input.today, NOTICE_RULES.N1.noticeDays));
  const effectiveDate = input.effectiveDate || earliestEffective;
  const year = Number(effectiveDate.slice(0, 4));
  const guidelinePct = ON_GUIDELINE[year] ?? 2.5;
  const proposedPct = Math.round(input.percent * 100) / 100;
  // Round to the cent, then to the nearest dollar the way landlords bill.
  const newRent = Math.round(input.currentRent * (1 + proposedPct / 100) * 100) / 100;
  const noticeDaysGiven = daysBetween(input.today, effectiveDate);
  return {
    earliestEffective,
    effectiveDate,
    guidelinePct,
    proposedPct,
    currentRent: input.currentRent,
    newRent,
    increase: Math.round((newRent - input.currentRent) * 100) / 100,
    aboveGuideline: proposedPct > guidelinePct + 0.0001,
    noticeDaysGiven,
    noticeOk: noticeDaysGiven >= NOTICE_RULES.N1.noticeDays,
  };
}

// —— N4: non-payment ——————————————————————————————————
export type N4Calc = {
  earliestTermination: string;
  terminationDate: string;
  totalOwing: number;
  noticeDaysGiven: number;
  noticeOk: boolean;
};

export function calcN4(input: { today: string; owing: number; terminationDate?: string | undefined }): N4Calc {
  const earliestTermination = addDays(input.today, NOTICE_RULES.N4.noticeDays);
  const terminationDate = input.terminationDate || earliestTermination;
  const noticeDaysGiven = daysBetween(input.today, terminationDate);
  return {
    earliestTermination,
    terminationDate,
    totalOwing: Math.round(input.owing * 100) / 100,
    noticeDaysGiven,
    noticeOk: noticeDaysGiven >= NOTICE_RULES.N4.noticeDays,
  };
}

// —— certificate of service ——————————————————————————
export type ServiceMethod =
  | "Handed to the tenant"
  | "Left in the mail box"
  | "Slid under the door"
  | "Mailed (add 5 days)"
  | "Email (tenant consented in writing)";

export const SERVICE_METHODS: ServiceMethod[] = [
  "Handed to the tenant",
  "Left in the mail box",
  "Slid under the door",
  "Mailed (add 5 days)",
  "Email (tenant consented in writing)",
];

/** Mailing adds 5 days to when a notice is considered received in Ontario. */
export const deemedReceived = (servedOn: string, method: ServiceMethod) =>
  method === "Mailed (add 5 days)" ? addDays(servedOn, 5) : servedOn;

// —— PDF content ————————————————————————————————————
export type NoticeParty = {
  landlordName: string;
  tenantName: string;
  address: string;
  unitLabel: string;
  city: string;
  province: string;
  postalCode: string;
};

const disclaimer =
  "General information, not legal advice. Keyhold helps you fill in and keep a copy of this form; it does not tell you whether to serve it. Confirm the current form and rules with the Landlord and Tenant Board before serving.";

function header(type: NoticeType, party: NoticeParty, preparedOn: string): PdfLine[] {
  const src = NOTICE_SOURCES[type];
  return [
    { t: "title", text: src.formName },
    { t: "small", text: `${src.authority} · ${src.version} · effective ${fullDate(src.effectiveDate)}` },
    { t: "small", text: src.url },
    { t: "rule" },
    { t: "field", label: "To (tenant name)", value: party.tenantName },
    {
      t: "field",
      label: "Rental unit address",
      value: `${party.address}, ${party.unitLabel}, ${party.city}, ${party.province} ${party.postalCode}`,
    },
    { t: "field", label: "From (landlord)", value: party.landlordName },
    { t: "field", label: "Prepared on", value: fullDate(preparedOn) },
    { t: "rule" },
  ];
}

export function n1Pdf(party: NoticeParty, calc: N1Calc, preparedOn: string): PdfLine[] {
  return [
    ...header("N1", party, preparedOn),
    { t: "h", text: "Your new rent" },
    { t: "field", label: "Current lawful rent", value: `${money(calc.currentRent)} per month` },
    { t: "field", label: "New rent", value: `${money(calc.newRent)} per month` },
    { t: "field", label: "Amount of the increase", value: `${money(calc.increase)} (${calc.proposedPct.toFixed(2)}%)` },
    { t: "field", label: "First month at the new rent", value: fullDate(calc.effectiveDate) },
    { t: "space" },
    {
      t: "check",
      checked: !calc.aboveGuideline,
      text: `This increase is at or below the ${calc.guidelinePct}% guideline for ${calc.effectiveDate.slice(0, 4)}.`,
    },
    {
      t: "check",
      checked: calc.aboveGuideline,
      text: "This increase is above the guideline and requires an order from the Landlord and Tenant Board.",
    },
    { t: "space" },
    { t: "h", text: "Notice period" },
    {
      t: "p",
      text: `This notice gives ${calc.noticeDaysGiven} days' notice. Ontario requires at least 90 days before the first rent period at the new rent, and at least 12 months since the last increase.`,
    },
    { t: "rule" },
    { t: "h", text: "Signature" },
    { t: "field", label: "Landlord signature", value: "" },
    { t: "field", label: "Date signed", value: "" },
    { t: "space" },
    { t: "small", text: disclaimer },
  ];
}

export function n4Pdf(
  party: NoticeParty,
  calc: N4Calc,
  rows: { period: string; due: number; paid: number; owing: number }[],
  preparedOn: string,
): PdfLine[] {
  return [
    ...header("N4", party, preparedOn),
    { t: "h", text: "Termination date" },
    { t: "field", label: "You must move out by", value: fullDate(calc.terminationDate) },
    {
      t: "p",
      text: "You can stop this notice by paying the full amount below on or before the termination date. This notice does not end your tenancy by itself — only the Landlord and Tenant Board can order an eviction.",
    },
    { t: "h", text: "Rent owing" },
    ...rows.map(
      (r): PdfLine => ({
        t: "field",
        label: `${r.period} · charged ${money(r.due)} · paid ${money(r.paid)}`,
        value: money(r.owing),
      }),
    ),
    { t: "field", label: "Total owing", value: money(calc.totalOwing) },
    { t: "space" },
    { t: "h", text: "How to pay" },
    { t: "p", text: "Pay the landlord named above by the method set out in your lease. Keep your receipt." },
    { t: "rule" },
    { t: "h", text: "Signature" },
    { t: "field", label: "Landlord signature", value: "" },
    { t: "field", label: "Date signed", value: "" },
    { t: "space" },
    { t: "small", text: disclaimer },
  ];
}

export function certificatePdf(input: {
  party: NoticeParty;
  type: NoticeType;
  servedOn: string;
  method: ServiceMethod;
  servedBy: string;
  time: string;
}): PdfLine[] {
  return [
    { t: "title", text: "Certificate of Service" },
    { t: "small", text: `${NOTICE_SOURCES[input.type].authority} · record of how and when a notice was delivered` },
    { t: "rule" },
    { t: "field", label: "Notice served", value: NOTICE_SOURCES[input.type].formName },
    { t: "field", label: "Tenant", value: input.party.tenantName },
    { t: "field", label: "Rental unit", value: `${input.party.address}, ${input.party.unitLabel}` },
    { t: "field", label: "Served on", value: `${fullDate(input.servedOn)} at ${input.time}` },
    { t: "field", label: "How it was served", value: input.method },
    { t: "field", label: "Considered received", value: fullDate(deemedReceived(input.servedOn, input.method)) },
    { t: "field", label: "Served by", value: input.servedBy },
    { t: "space" },
    { t: "small", text: disclaimer },
  ];
}

/** Plain-language explanation an AI assistant may show — never a decision. */
export function explainField(type: NoticeType, field: string): string {
  const map: Record<string, string> = {
    effectiveDate:
      "The first day of the rent period when the new rent applies. It must be at least 90 days after the tenant gets this notice.",
    percent: `The increase as a percentage of the current rent. Anything above the provincial guideline needs a Landlord and Tenant Board order first.`,
    terminationDate:
      "The earliest date you could ask the tenant to move out — at least 14 days after they get the notice. They can cancel it by paying in full.",
    owing: "The rent charged minus the rent received, taken straight from your rent ledger.",
  };
  return map[field] ?? NOTICE_RULES[type].plain;
}
