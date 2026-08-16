/**
 * Provincial forms — DATA CONTRACT.
 *
 * The real engine lives in the backend: it will return exactly this JSON shape.
 * Nothing in the UI may hard-code a form's fields — components render whatever
 * definitions this module (later: the API) hands them.
 */

export type FormFieldType =
  | "text"
  | "textarea"
  | "date"
  | "currency"
  | "postal"
  | "number"
  | "select"
  | "checkbox";

export type FormFieldDef = {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  helpText: string;
  /** Dot path into the prefill context, e.g. "tenant.name". */
  prefillPath?: string;
  /** Field name in the official fillable PDF. */
  pdfFieldName: string;
  options?: string[];
};

export type FormSectionDef = { id: string; title: string; fields: FormFieldDef[] };

export type FormSignerDef = { id: string; role: string; label: string };

export type FormCategory =
  | "Lease"
  | "Rent increase"
  | "Ending tenancy"
  | "Application"
  | "Inspection";

export type FormDefinition = {
  formCode: string;
  province: string;
  version: string;
  effectiveDate: string;
  /** Set by the backend when a newer official version exists. */
  latestVersion?: string;
  sourceUrl: string;
  category: FormCategory;
  title: string;
  description: string;
  /** Whether a certificate of service applies to this form. */
  serviceRequired?: boolean;
  sections: FormSectionDef[];
  signers: FormSignerDef[];
};

export const provinceNames: Record<string, string> = {
  ON: "Ontario",
  BC: "British Columbia",
  AB: "Alberta",
  QC: "Quebec",
  MB: "Manitoba",
  SK: "Saskatchewan",
  NS: "Nova Scotia",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  PE: "Prince Edward Island",
};

const partiesSection = (): FormSectionDef => ({
  id: "parties",
  title: "Landlord and tenant",
  fields: [
    {
      id: "landlordName",
      label: "Landlord legal name",
      type: "text",
      required: true,
      helpText: "Use the exact legal name that owns the property — a numbered company counts.",
      prefillPath: "landlord.name",
      pdfFieldName: "landlord_name",
    },
    {
      id: "tenantName",
      label: "Tenant name",
      type: "text",
      required: true,
      helpText: "Every adult on the tenancy. A missing name can make the form unenforceable against them.",
      prefillPath: "tenant.name",
      pdfFieldName: "tenant_name",
    },
    {
      id: "address",
      label: "Rental address",
      type: "text",
      required: true,
      helpText: "Street address including unit number, exactly as the tenant would write it.",
      prefillPath: "unit.address",
      pdfFieldName: "rental_address",
    },
    {
      id: "postalCode",
      label: "Postal code",
      type: "postal",
      required: true,
      helpText: "Canadian format, e.g. M6H 3Y2.",
      prefillPath: "property.postalCode",
      pdfFieldName: "postal_code",
    },
  ],
});

export const formDefinitions: FormDefinition[] = [
  {
    formCode: "2229E",
    province: "ON",
    version: "2024-12",
    effectiveDate: "2024-12-01",
    sourceUrl: "https://www.ontario.ca/page/guide-ontarios-standard-lease",
    category: "Lease",
    title: "Residential Tenancy Agreement (Standard Lease)",
    description: "Required for most new private residential tenancies in Ontario signed on or after March 1, 2021.",
    signers: [
      { id: "landlord", role: "Landlord", label: "Landlord signature" },
      { id: "tenant", role: "Tenant", label: "Tenant signature" },
    ],
    sections: [
      partiesSection(),
      {
        id: "term",
        title: "Term of the tenancy",
        fields: [
          {
            id: "startDate",
            label: "Tenancy start date",
            type: "date",
            required: true,
            helpText: "The first day the tenant may move in — not the day they signed.",
            prefillPath: "lease.start",
            pdfFieldName: "term_start",
          },
          {
            id: "endDate",
            label: "Fixed term end date",
            type: "date",
            required: false,
            helpText: "Leave blank for month-to-month. After a fixed term ends the tenancy continues monthly by law.",
            prefillPath: "lease.end",
            pdfFieldName: "term_end",
          },
        ],
      },
      {
        id: "rent",
        title: "Rent",
        fields: [
          {
            id: "rentAmount",
            label: "Monthly rent",
            type: "currency",
            required: true,
            helpText: "Base rent only. Parking and storage are listed separately so future increases are calculated correctly.",
            prefillPath: "lease.rent",
            pdfFieldName: "rent_amount",
          },
          {
            id: "rentDueDay",
            label: "Rent is due on",
            type: "select",
            required: true,
            helpText: "The day of the month rent is payable. Most Ontario tenancies use the 1st.",
            options: ["1st of the month", "15th of the month", "Last day of the month"],
            pdfFieldName: "rent_due_day",
          },
          {
            id: "parking",
            label: "Parking fee",
            type: "currency",
            required: false,
            helpText: "Charged on top of rent. Keeping it separate protects you at rent-increase time.",
            pdfFieldName: "parking_fee",
          },
          {
            id: "deposit",
            label: "Rent deposit held",
            type: "currency",
            required: false,
            helpText: "Ontario allows a last-month's-rent deposit only. Damage deposits are not permitted.",
            prefillPath: "lease.deposit",
            pdfFieldName: "rent_deposit",
          },
        ],
      },
      {
        id: "services",
        title: "Services and utilities",
        fields: [
          {
            id: "utilities",
            label: "Utilities included in rent",
            type: "textarea",
            required: false,
            helpText: "List what you pay for (heat, hydro, water). Anything not listed is the tenant's responsibility.",
            pdfFieldName: "services_included",
          },
          {
            id: "smoking",
            label: "Smoking rules",
            type: "select",
            required: false,
            helpText: "A smoking rule must be written into the lease to be enforceable.",
            options: ["No smoking anywhere", "Smoking allowed outdoors only", "No rule"],
            pdfFieldName: "smoking_rules",
          },
        ],
      },
    ],
  },
  {
    formCode: "N1",
    province: "ON",
    version: "2023-06",
    latestVersion: "2025-04",
    effectiveDate: "2023-06-01",
    sourceUrl: "https://tribunalsontario.ca/ltb/forms/",
    category: "Rent increase",
    title: "Notice of Rent Increase",
    description: "Tells a tenant their rent is going up. Must be given at least 90 days before the increase takes effect.",
    serviceRequired: true,
    signers: [{ id: "landlord", role: "Landlord", label: "Landlord signature" }],
    sections: [
      partiesSection(),
      {
        id: "increase",
        title: "The increase",
        fields: [
          {
            id: "currentRent",
            label: "Current lawful rent",
            type: "currency",
            required: true,
            helpText: "The rent the tenant pays today, before this increase.",
            prefillPath: "lease.rent",
            pdfFieldName: "current_rent",
          },
          {
            id: "newRent",
            label: "New rent",
            type: "currency",
            required: true,
            helpText: "Must stay within the provincial guideline unless the LTB has approved an above-guideline increase.",
            pdfFieldName: "new_rent",
          },
          {
            id: "effectiveDate",
            label: "First day of the new rent",
            type: "date",
            required: true,
            helpText: "At least 90 days after the tenant receives this notice, and at least 12 months after the last increase.",
            pdfFieldName: "increase_effective",
          },
          {
            id: "lastIncrease",
            label: "Date of last increase",
            type: "date",
            required: false,
            helpText: "Used to prove the 12-month rule was respected. Leave blank if rent has never increased.",
            pdfFieldName: "last_increase_date",
          },
        ],
      },
      {
        id: "service",
        title: "How the notice is given",
        fields: [
          {
            id: "serviceMethod",
            label: "Method of service",
            type: "select",
            required: true,
            helpText: "How the tenant receives the notice. Some methods add days before it counts as received.",
            options: ["Handed to the tenant", "Mail", "Placed in mailbox", "Under the door", "Email (consented)"],
            pdfFieldName: "service_method",
          },
          {
            id: "serviceDate",
            label: "Date given to tenant",
            type: "date",
            required: true,
            helpText: "The date you actually serve it — the 90 days count from here, not from today.",
            pdfFieldName: "service_date",
          },
        ],
      },
    ],
  },
  {
    formCode: "N4",
    province: "ON",
    version: "2024-02",
    effectiveDate: "2024-02-01",
    sourceUrl: "https://tribunalsontario.ca/ltb/forms/",
    category: "Ending tenancy",
    title: "Notice to End a Tenancy Early for Non-payment of Rent",
    description: "First formal step when rent is unpaid. It gives the tenant a deadline to pay before you may apply to the LTB.",
    serviceRequired: true,
    signers: [{ id: "landlord", role: "Landlord", label: "Landlord signature" }],
    sections: [
      partiesSection(),
      {
        id: "arrears",
        title: "Rent owing",
        fields: [
          {
            id: "periodFrom",
            label: "Rent period from",
            type: "date",
            required: true,
            helpText: "Start of the first unpaid rental period.",
            pdfFieldName: "period_from",
          },
          {
            id: "periodTo",
            label: "Rent period to",
            type: "date",
            required: true,
            helpText: "End of the last unpaid rental period.",
            pdfFieldName: "period_to",
          },
          {
            id: "rentCharged",
            label: "Rent charged",
            type: "currency",
            required: true,
            helpText: "Total rent charged for those periods.",
            prefillPath: "lease.rent",
            pdfFieldName: "rent_charged",
          },
          {
            id: "rentPaid",
            label: "Rent paid",
            type: "currency",
            required: true,
            helpText: "Everything received for those periods, including partial payments.",
            pdfFieldName: "rent_paid",
          },
          {
            id: "totalOwing",
            label: "Total owing",
            type: "currency",
            required: true,
            helpText: "Rent charged minus rent paid. Never include late fees or NSF charges here.",
            prefillPath: "rent.balance",
            pdfFieldName: "total_owing",
          },
        ],
      },
      {
        id: "termination",
        title: "Termination date and service",
        fields: [
          {
            id: "terminationDate",
            label: "Termination date",
            type: "date",
            required: true,
            helpText: "For monthly tenancies this is at least 14 days after the tenant receives the notice.",
            pdfFieldName: "termination_date",
          },
          {
            id: "serviceMethod",
            label: "Method of service",
            type: "select",
            required: true,
            helpText: "Recorded on the certificate of service so you can prove delivery at a hearing.",
            options: ["Handed to the tenant", "Mail", "Placed in mailbox", "Under the door", "Email (consented)"],
            pdfFieldName: "service_method",
          },
          {
            id: "serviceDate",
            label: "Date given to tenant",
            type: "date",
            required: true,
            helpText: "The 14-day clock starts the day after service (longer if mailed).",
            pdfFieldName: "service_date",
          },
        ],
      },
    ],
  },
  {
    formCode: "RTB-7",
    province: "BC",
    version: "2024-01",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://www2.gov.bc.ca/gov/content/housing-tenancy/residential-tenancies/forms",
    category: "Rent increase",
    title: "Notice of Rent Increase — Residential",
    description: "British Columbia rent increase notice. Three full months' notice is required.",
    serviceRequired: true,
    signers: [{ id: "landlord", role: "Landlord", label: "Landlord signature" }],
    sections: [
      partiesSection(),
      {
        id: "increase",
        title: "The increase",
        fields: [
          {
            id: "currentRent",
            label: "Current rent",
            type: "currency",
            required: true,
            helpText: "The rent payable today.",
            prefillPath: "lease.rent",
            pdfFieldName: "current_rent",
          },
          {
            id: "newRent",
            label: "New rent",
            type: "currency",
            required: true,
            helpText: "Must not exceed the BC annual allowable increase.",
            pdfFieldName: "new_rent",
          },
          {
            id: "effectiveDate",
            label: "Effective date",
            type: "date",
            required: true,
            helpText: "At least three full rental months after the notice is served.",
            pdfFieldName: "effective_date",
          },
        ],
      },
    ],
  },
];

export const formCategories: FormCategory[] = [
  "Lease",
  "Rent increase",
  "Ending tenancy",
  "Application",
  "Inspection",
];

export const isOutdated = (d: FormDefinition) => Boolean(d.latestVersion && d.latestVersion !== d.version);

/** Resolve a dot path from a prefill context object. */
export function readPath(ctx: unknown, path?: string): string {
  if (!path) return "";
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, ctx);
  if (value === undefined || value === null) return "";
  return String(value);
}

const postalRe = /^[A-Za-z]\d[A-Za-z][ ]?\d[A-Za-z]\d$/;

/** Per-type validation. Returns an error message, or null when valid. */
export function validateField(field: FormFieldDef, raw: string): string | null {
  const value = (raw ?? "").trim();
  if (!value) return field.required ? "This field is required." : null;
  switch (field.type) {
    case "date":
      return Number.isNaN(new Date(value).getTime()) ? "Use a real date." : null;
    case "currency":
      return Number.isNaN(Number(value.replace(/[$,\s]/g, ""))) ? "Enter an amount, e.g. 1850.00" : null;
    case "number":
      return Number.isNaN(Number(value)) ? "Enter a number." : null;
    case "postal":
      return postalRe.test(value) ? null : "Use a Canadian postal code, e.g. M6H 3Y2.";
    default:
      return null;
  }
}

export function formatForPreview(field: FormFieldDef, raw: string): string {
  const value = (raw ?? "").trim();
  if (!value) return "";
  if (field.type === "currency") {
    const n = Number(value.replace(/[$,\s]/g, ""));
    return Number.isNaN(n)
      ? value
      : new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
  }
  if (field.type === "date") {
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? value
      : d.toLocaleDateString("en-CA", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  }
  return value;
}

export const allFields = (def: FormDefinition) => def.sections.flatMap((s) => s.fields);

export function completion(def: FormDefinition, values: Record<string, string>) {
  const required = allFields(def).filter((f) => f.required);
  const done = required.filter((f) => (values[f.id] ?? "").trim() !== "");
  return { done: done.length, total: required.length };
}

export function firstMissing(def: FormDefinition, values: Record<string, string>) {
  return allFields(def).find((f) => f.required && !(values[f.id] ?? "").trim()) ?? null;
}
