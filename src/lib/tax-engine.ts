/**
 * T776 ENGINE — pure functions, no state, no I/O.
 * ------------------------------------------------
 * Maps plain rental records onto the CRA's T776 (Statement of Real Estate
 * Rentals) expense lines, totals them per property and consolidated, and
 * renders the accountant-ready CSV and PDF. Money is integer cents throughout;
 * a backend can run these same functions server-side and get identical output.
 *
 * This is arithmetic on the landlord's own records. It is not tax advice.
 */
import { toCsv } from "@/lib/rent-engine";
import type { PdfLine } from "@/lib/pdf-writer";

/* ————————————————————— T776 line map ————————————————————— */

export type T776Code =
  | "advertising"
  | "insurance"
  | "interest"
  | "maintenance"
  | "management"
  | "professional"
  | "property-tax"
  | "utilities"
  | "travel"
  | "office"
  | "salaries"
  | "other";

export type T776LineDef = {
  code: T776Code;
  /** CRA's own line number on the T776 form. */
  line: string;
  label: string;
  help: string;
  /** Lower-case keywords used by the categorization helper. */
  keywords: string[];
};

export const T776_LINES: T776LineDef[] = [
  { code: "advertising", line: "8521", label: "Advertising", help: "Listing fees, photos, signage.", keywords: ["advertis", "listing", "kijiji", "facebook ad", "photo", "sign"] },
  { code: "insurance", line: "8690", label: "Insurance", help: "Building and liability premiums.", keywords: ["insur", "premium", "policy"] },
  { code: "interest", line: "8710", label: "Interest and bank charges", help: "Mortgage interest (not principal) and bank fees.", keywords: ["interest", "mortgage", "bank charge", "bank fee"] },
  { code: "maintenance", line: "8960", label: "Maintenance and repairs", help: "Repairs, trades, cleaning, snow, lawn.", keywords: ["repair", "maintenance", "plumb", "electric", "furnace", "hvac", "snow", "lawn", "grounds", "handyman", "clean", "roof", "paint", "appliance", "fence", "boards", "labour", "cedar"] },
  { code: "management", line: "8871", label: "Management and administration fees", help: "Property management and admin fees.", keywords: ["management fee", "manage", "admin", "leasing fee", "software"] },
  { code: "professional", line: "8860", label: "Professional fees (legal, accounting)", help: "Lawyer, accountant, LTB filing help.", keywords: ["legal", "lawyer", "account", "bookkeep", "paralegal", "ltb filing", "notary"] },
  { code: "property-tax", line: "9180", label: "Property taxes", help: "Municipal property tax bills.", keywords: ["property tax", "municipal tax", "city of", "tax instal"] },
  { code: "utilities", line: "9200", label: "Utilities", help: "Heat, hydro, water, gas you pay.", keywords: ["hydro", "utility", "utilities", "water", "sewer", "gas", "enbridge", "heat", "electricity", "internet"] },
  { code: "travel", line: "9200-t", label: "Travel", help: "Trips to collect rent, show or maintain the property.", keywords: ["travel", "mileage", "kilometre", "km", "parking", "fuel"] },
  { code: "office", line: "8810", label: "Office expenses", help: "Stationery, postage, printing.", keywords: ["office", "postage", "print", "courier", "stationery"] },
  { code: "salaries", line: "8810-s", label: "Salaries, wages and benefits", help: "Superintendent or staff pay.", keywords: ["salary", "wage", "super", "payroll"] },
  { code: "other", line: "9270", label: "Other expenses", help: "Anything that doesn't fit a line above.", keywords: [] },
];

export const lineDef = (code: T776Code) => T776_LINES.find((l) => l.code === code) ?? T776_LINES[T776_LINES.length - 1]!;

/** Best-guess T776 line from free text. Returns null when nothing is confident. */
export function suggestLine(text: string): T776Code | null {
  const hay = text.toLowerCase();
  for (const def of T776_LINES) {
    if (def.keywords.some((k) => hay.includes(k))) return def.code;
  }
  return null;
}

/* ————————————————————— ledger ————————————————————— */

export type LedgerSource = "rent" | "bill" | "manual";

export type LedgerEntry = {
  id: string;
  date: string;
  propertyId: string;
  kind: "income" | "expense";
  /** null on an expense means "uncategorized" — the helper flags these. */
  code: T776Code | null;
  description: string;
  amountCents: number;
  source: LedgerSource;
  /** Set when the row came from a bill or an invoice, so it can be traced back. */
  sourceId?: string;
};

export const yearOf = (iso: string) => Number(iso.slice(0, 4));

export const entriesForYear = (entries: LedgerEntry[], year: number, propertyIds: string[]) =>
  entries.filter((e) => yearOf(e.date) === year && propertyIds.includes(e.propertyId));

export const uncategorized = (entries: LedgerEntry[]) => entries.filter((e) => e.kind === "expense" && e.code === null);

/* ————————————————————— statement ————————————————————— */

export type CcaRow = {
  className: string;
  description: string;
  openingUccCents: number;
  additionsCents: number;
  ratePct: number;
};

export type PropertyStatement = {
  propertyId: string;
  propertyName: string;
  address: string;
  ownershipPct: number;
  grossIncomeCents: number;
  expenses: { code: T776Code; line: string; label: string; amountCents: number }[];
  totalExpensesCents: number;
  netIncomeCents: number;
  uncategorizedCount: number;
};

export type TaxPackage = {
  year: number;
  properties: PropertyStatement[];
  grossIncomeCents: number;
  totalExpensesCents: number;
  netIncomeCents: number;
  byLine: { code: T776Code; line: string; label: string; amountCents: number }[];
  uncategorizedCount: number;
};

export function buildPackage(args: {
  year: number;
  entries: LedgerEntry[];
  properties: { id: string; name: string; address: string; ownershipPct?: number }[];
}): TaxPackage {
  const ids = args.properties.map((p) => p.id);
  const rows = entriesForYear(args.entries, args.year, ids);

  const properties = args.properties.map((p) => {
    const mine = rows.filter((e) => e.propertyId === p.id);
    const grossIncomeCents = mine.filter((e) => e.kind === "income").reduce((s, e) => s + e.amountCents, 0);
    const expenses = T776_LINES.map((def) => ({
      code: def.code,
      line: def.line,
      label: def.label,
      amountCents: mine.filter((e) => e.kind === "expense" && e.code === def.code).reduce((s, e) => s + e.amountCents, 0),
    })).filter((row) => row.amountCents > 0);
    const totalExpensesCents = expenses.reduce((s, r) => s + r.amountCents, 0);
    return {
      propertyId: p.id,
      propertyName: p.name,
      address: p.address,
      ownershipPct: p.ownershipPct ?? 100,
      grossIncomeCents,
      expenses,
      totalExpensesCents,
      netIncomeCents: grossIncomeCents - totalExpensesCents,
      uncategorizedCount: mine.filter((e) => e.kind === "expense" && e.code === null).length,
    };
  });

  const byLine = T776_LINES.map((def) => ({
    code: def.code,
    line: def.line,
    label: def.label,
    amountCents: properties.reduce(
      (s, p) => s + (p.expenses.find((e) => e.code === def.code)?.amountCents ?? 0),
      0,
    ),
  })).filter((row) => row.amountCents > 0);

  const grossIncomeCents = properties.reduce((s, p) => s + p.grossIncomeCents, 0);
  const totalExpensesCents = properties.reduce((s, p) => s + p.totalExpensesCents, 0);

  return {
    year: args.year,
    properties,
    grossIncomeCents,
    totalExpensesCents,
    netIncomeCents: grossIncomeCents - totalExpensesCents,
    byLine,
    uncategorizedCount: properties.reduce((s, p) => s + p.uncategorizedCount, 0),
  };
}

/* ————————————————————— exports ————————————————————— */

export const DISCLAIMER =
  "Prepared from your records to help you and your accountant. Not tax advice — confirm figures before filing.";

const dollars = (cents: number) => (cents / 100).toFixed(2);

export function packageCsv(pkg: TaxPackage, cca: CcaRow[]) {
  const rows: (string | number)[][] = [];
  for (const p of pkg.properties) {
    rows.push([p.propertyName, p.address, "Income", "8141", "Gross rental income", dollars(p.grossIncomeCents)]);
    for (const e of p.expenses) rows.push([p.propertyName, p.address, "Expense", e.line, e.label, dollars(e.amountCents)]);
    rows.push([p.propertyName, p.address, "Subtotal", "", "Total expenses", dollars(p.totalExpensesCents)]);
    rows.push([p.propertyName, p.address, "Subtotal", "9369", "Net income before CCA", dollars(p.netIncomeCents)]);
  }
  rows.push(["ALL PROPERTIES", "", "Income", "8141", "Gross rental income", dollars(pkg.grossIncomeCents)]);
  for (const e of pkg.byLine) rows.push(["ALL PROPERTIES", "", "Expense", e.line, e.label, dollars(e.amountCents)]);
  rows.push(["ALL PROPERTIES", "", "Subtotal", "", "Total expenses", dollars(pkg.totalExpensesCents)]);
  rows.push(["ALL PROPERTIES", "", "Subtotal", "9369", "Net income before CCA", dollars(pkg.netIncomeCents)]);
  for (const c of cca) {
    rows.push([
      "CCA (for your accountant)",
      c.description,
      `Class ${c.className}`,
      "",
      `Opening UCC / additions / rate`,
      `${dollars(c.openingUccCents)} / ${dollars(c.additionsCents)} / ${c.ratePct}%`,
    ]);
  }
  rows.push(["NOTE", DISCLAIMER, "", "", "", ""]);
  return toCsv(["Property", "Address", "Type", "T776 line", "Description", "Amount (CAD)"], rows);
}

export function packagePdf(args: { pkg: TaxPackage; cca: CcaRow[]; preparedFor: string; preparedOn: string }): PdfLine[] {
  const { pkg, cca } = args;
  const out: PdfLine[] = [
    { t: "title", text: `T776 rental summary — ${pkg.year}` },
    { t: "small", text: `Prepared for ${args.preparedFor} on ${args.preparedOn} by Keyhold.` },
    { t: "small", text: DISCLAIMER },
    { t: "rule" },
  ];

  for (const p of pkg.properties) {
    out.push({ t: "h", text: p.propertyName });
    out.push({ t: "small", text: `${p.address} · ownership ${p.ownershipPct}%` });
    out.push({ t: "field", label: "8141 Gross rental income", value: `$${dollars(p.grossIncomeCents)}` });
    for (const e of p.expenses) out.push({ t: "field", label: `${e.line} ${e.label}`, value: `$${dollars(e.amountCents)}` });
    out.push({ t: "field", label: "Total expenses", value: `$${dollars(p.totalExpensesCents)}` });
    out.push({ t: "field", label: "9369 Net income before CCA", value: `$${dollars(p.netIncomeCents)}` });
    out.push({ t: "space" });
  }

  out.push({ t: "pagebreak" });
  out.push({ t: "h", text: "All properties — consolidated" });
  out.push({ t: "field", label: "8141 Gross rental income", value: `$${dollars(pkg.grossIncomeCents)}` });
  for (const e of pkg.byLine) out.push({ t: "field", label: `${e.line} ${e.label}`, value: `$${dollars(e.amountCents)}` });
  out.push({ t: "field", label: "Total expenses", value: `$${dollars(pkg.totalExpensesCents)}` });
  out.push({ t: "field", label: "9369 Net income before CCA", value: `$${dollars(pkg.netIncomeCents)}` });

  out.push({ t: "rule" });
  out.push({ t: "h", text: "Capital cost allowance — for your accountant" });
  out.push({
    t: "p",
    text: "CCA is optional and depends on decisions Keyhold cannot make for you. The fields below are left for your accountant to complete.",
  });
  for (const c of cca) {
    out.push({ t: "field", label: `Class ${c.className} — ${c.description}`, value: "" });
    out.push({ t: "field", label: "  Opening UCC", value: `$${dollars(c.openingUccCents)}` });
    out.push({ t: "field", label: "  Additions this year", value: `$${dollars(c.additionsCents)}` });
    out.push({ t: "field", label: "  Dispositions", value: "________________" });
    out.push({ t: "field", label: `  Rate (${c.ratePct}%) — CCA claimed`, value: "________________" });
  }
  out.push({ t: "space" });
  out.push({ t: "small", text: DISCLAIMER });
  out.push({ t: "small", text: "CRA T776 guide: canada.ca — Statement of Real Estate Rentals (T4036)." });
  return out;
}
