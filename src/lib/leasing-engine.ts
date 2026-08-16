/**
 * LEASING & VENDOR ENGINE — pure, deterministic helpers.
 * -----------------------------------------------------
 * Vacancy maths, listing copy blocks, applicant comparison ratios and vendor
 * performance stats. No React, no state, no randomness: every function here
 * returns the same answer for the same inputs so the numbers on screen can be
 * trusted and tested.
 */
import { billTotalCents, type Bill, type WorkOrder } from "@/lib/maintenance-engine";

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

const DAY = 86_400_000;

export function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso}T00:00:00Z`);
  const b = Date.parse(`${toIso}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / DAY);
}

export const addDaysIso = (iso: string, days: number) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);

/** Days a home has been empty. Future dates (soon-empty) return 0. */
export const vacancyDays = (vacantSince: string, today: string) => Math.max(0, daysBetween(vacantSince, today));

/** Days until a home becomes empty. Already-empty homes return 0. */
export const daysUntilVacant = (vacantFrom: string, today: string) => Math.max(0, daysBetween(today, vacantFrom));

/**
 * Rent lost while a home sits empty, to the nearest dollar.
 * A 30-day month keeps the arithmetic predictable and easy to explain.
 */
export const lostRent = (monthlyRent: number, days: number) => Math.round((monthlyRent * days) / 30);

/* ------------------------------------------------------------------ */
/* Expiry (insurance certificates, licences, documents)                */
/* ------------------------------------------------------------------ */

export type ExpiryTone = "success" | "warning" | "maple";
export type Expiry = { days: number; label: string; tone: ExpiryTone; expired: boolean; expiringSoon: boolean };

/** Plain-language expiry state. "Soon" is 60 days — enough time to chase a certificate. */
export function expiryStatus(iso: string | null | undefined, today: string, soonDays = 60): Expiry | null {
  if (!iso) return null;
  const days = daysBetween(today, iso);
  if (days < 0) return { days, label: `Expired ${Math.abs(days)} days ago`, tone: "maple", expired: true, expiringSoon: false };
  if (days === 0) return { days, label: "Expires today", tone: "maple", expired: false, expiringSoon: true };
  if (days <= soonDays) return { days, label: `Expires in ${days} days`, tone: "warning", expired: false, expiringSoon: true };
  return { days, label: `Valid — ${days} days left`, tone: "success", expired: false, expiringSoon: false };
}

/* ------------------------------------------------------------------ */
/* Listing copy for the marketplaces landlords actually use            */
/* ------------------------------------------------------------------ */

export const LISTING_CHANNELS = [
  "Kijiji",
  "Facebook Marketplace",
  "Rentals.ca",
  "Zumper",
  "PadMapper",
  "Craigslist",
] as const;
export type ListingChannel = (typeof LISTING_CHANNELS)[number];

/** We do not syndicate automatically yet — this is the block a human pastes. */
export type CopyBlockInput = {
  headline: string;
  description: string;
  address: string;
  city: string;
  province: string;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  deposit: number;
  availableFrom: string;
  amenities: string[];
  utilitiesIncluded: string[];
  parking: string;
  petPolicy: string;
  smokingPolicy: string;
  publicUrl: string;
  contactEmail: string;
};

const money = (n: number) => `CA$${n.toLocaleString("en-CA")}`;

export function listingCopyBlock(input: CopyBlockInput): string {
  const beds = input.bedrooms === 0 ? "Bachelor" : `${input.bedrooms} bedroom`;
  const lines = [
    input.headline,
    "",
    `${beds} · ${input.bathrooms} bath · ${input.address}, ${input.city}, ${input.province}`,
    `${money(input.rent)}/month · Available ${input.availableFrom}`,
    input.deposit > 0 ? `Deposit: ${money(input.deposit)}` : "",
    "",
    input.description,
    "",
    input.amenities.length ? `Included: ${input.amenities.join(", ")}` : "",
    input.utilitiesIncluded.length ? `Utilities included: ${input.utilitiesIncluded.join(", ")}` : "Utilities: paid by tenant",
    `Parking: ${input.parking}`,
    `Pets: ${input.petPolicy}`,
    `Smoking: ${input.smokingPolicy}`,
    "",
    `Photos, full details and the application form: ${input.publicUrl}`,
    `Questions: ${input.contactEmail}`,
  ];
  return lines.filter((l) => l !== "").join("\n");
}

/* ------------------------------------------------------------------ */
/* Applicant comparison — ratios only. A human makes the decision.     */
/* ------------------------------------------------------------------ */

/** Rent as a share of gross monthly income, rounded to a whole percent. */
export const rentToIncomePct = (rent: number, monthlyIncome: number) =>
  monthlyIncome > 0 ? Math.round((rent / monthlyIncome) * 100) : 0;

/** Descriptive only — never a pass/fail rule, and never applied automatically. */
export function affordabilityNote(pct: number): { label: string; tone: "success" | "warning" | "maple" } {
  if (pct === 0) return { label: "No income given", tone: "warning" };
  if (pct <= 30) return { label: `${pct}% of income`, tone: "success" };
  if (pct <= 40) return { label: `${pct}% of income`, tone: "warning" };
  return { label: `${pct}% of income`, tone: "maple" };
}

export const DECLINE_REASONS = [
  "Home was rented to another applicant",
  "Applicant withdrew",
  "Incomplete application after follow-up",
  "References could not be verified",
  "Screening consent not given",
  "Other (written below)",
];

/* ------------------------------------------------------------------ */
/* Vendor performance                                                  */
/* ------------------------------------------------------------------ */

export type VendorStats = {
  jobs: number;
  completed: number;
  openJobs: number;
  spendCents: number;
  /** Average calendar days from work order created to completed, 1 decimal. */
  avgCompletionDays: number | null;
  lastJobOn: string | null;
};

export function vendorStats(vendorId: string, workOrders: WorkOrder[], bills: Bill[]): VendorStats {
  const mine = workOrders.filter((w) => w.vendorId === vendorId);
  const completed = mine.filter((w) => w.status === "completed" && w.completedOn);
  const totalDays = completed.reduce((s, w) => s + Math.max(0, daysBetween(w.createdOn, w.completedOn!)), 0);
  const spendCents = bills
    .filter((b) => b.vendorId === vendorId && b.status !== "rejected")
    .reduce((s, b) => s + billTotalCents(b), 0);
  const dates = mine.map((w) => w.completedOn ?? w.createdOn).sort();
  return {
    jobs: mine.length,
    completed: completed.length,
    openJobs: mine.filter((w) => w.status !== "completed" && w.status !== "cancelled").length,
    spendCents,
    avgCompletionDays: completed.length ? Math.round((totalDays / completed.length) * 10) / 10 : null,
    lastJobOn: dates.length ? dates[dates.length - 1]! : null,
  };
}

/* ------------------------------------------------------------------ */
/* Option lists used by the listing editor                             */
/* ------------------------------------------------------------------ */

export const AMENITY_OPTIONS = [
  "In-suite laundry",
  "Shared laundry",
  "Dishwasher",
  "Fridge & stove",
  "Air conditioning",
  "Balcony",
  "Storage locker",
  "Elevator",
  "Wheelchair accessible",
  "Backyard",
  "Fireplace",
  "Gym",
];

export const UTILITY_OPTIONS = ["Heat", "Water", "Hydro", "Internet", "Gas"];

export const PET_POLICIES = [
  "Pets welcome (Ontario law limits no-pet clauses)",
  "Pets welcome — cats only",
  "Pets welcome — dogs under 25 lb",
  "Ask us about pets",
];

export const SMOKING_POLICIES = ["No smoking inside the home", "No smoking anywhere on the property", "Smoking permitted outdoors"];
