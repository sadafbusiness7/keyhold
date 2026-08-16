/**
 * MAINTENANCE ENGINE — pure types + deterministic helpers.
 * -------------------------------------------------------
 * Request -> work order -> vendor -> bill -> approval. No React, no state:
 * every function here is a pure calculation so the money side (bill totals,
 * tax, approval rules) is testable and never guessed.
 * Amounts are integer CENTS, exactly like rent-engine.ts.
 */
import { properties, units, tenants } from "@/lib/mock-data";
import { seedAssignments, seedUsers } from "@/lib/mock-access";

// —— vocabulary ————————————————————————————————————————
export type Urgency = "emergency" | "urgent" | "soon" | "whenever";
export type RequestStatus = "new" | "assigned" | "in-progress" | "resolved" | "cancelled";
export type WorkOrderStatus = "assigned" | "scheduled" | "in-progress" | "completed" | "cancelled";
export type BillStatus = "draft" | "awaiting-approval" | "approved" | "rejected";
export type Cadence = "monthly" | "quarterly" | "semi-annual" | "annual";

export const URGENCY: { id: Urgency; label: string; help: string }[] = [
  { id: "emergency", label: "Emergency", help: "Unsafe or causing damage right now" },
  { id: "urgent", label: "Urgent", help: "It can't wait until tomorrow" },
  { id: "soon", label: "Soon", help: "Within a few days is fine" },
  { id: "whenever", label: "Whenever", help: "Next time someone is by" },
];

export const CATEGORIES: { name: string; subs: string[] }[] = [
  { name: "Heating & water", subs: ["No heat", "No hot water", "Leak or burst pipe", "Furnace noise", "Thermostat"] },
  { name: "Plumbing", subs: ["Dripping tap", "Blocked drain", "Toilet won't flush", "Low water pressure"] },
  { name: "Electrical", subs: ["Outlet not working", "Breaker keeps tripping", "Light fixture", "Flickering lights"] },
  { name: "Appliances", subs: ["Fridge", "Stove or oven", "Dishwasher", "Washer or dryer"] },
  { name: "Outside & grounds", subs: ["Snow or ice", "Lawn or trees", "Fence or gate", "Roof or gutters", "Parking"] },
  { name: "Safety", subs: ["Smoke alarm", "CO alarm", "Lock or key", "Window or door won't close"] },
  { name: "Pests", subs: ["Mice or rats", "Insects", "Wasp nest"] },
  { name: "Something else", subs: ["Not sure — please take a look"] },
];

export const PREFERRED_TIMES = ["Any time", "Weekday mornings", "Weekday afternoons", "Weekday evenings", "Weekends"];

export const TRADES = ["Plumber", "Electrician", "HVAC", "Handyman", "Appliance repair", "Landscaping & snow", "Pest control", "Cleaner", "Roofer"];

// —— records ————————————————————————————————————————————
export type LogKind = "created" | "message" | "assignment" | "status" | "work-order" | "bill" | "notification";

export type LogEntry = {
  id: string;
  at: string;
  actor: string;
  kind: LogKind;
  text: string;
};

export type MaintenanceRequest = {
  id: string;
  propertyId: string;
  unitId: string;
  tenantId: string | null;
  category: string;
  subcategory: string;
  description: string;
  photos: string[];
  urgency: Urgency;
  permissionToEnter: boolean;
  preferredTime: string;
  accessInstructions: string;
  status: RequestStatus;
  assigneeId: string | null;
  openedOn: string;
  source: "tenant" | "manager" | "recurring";
  recurringRuleId?: string;
  log: LogEntry[];
};

export type VendorDoc = {
  id: string;
  name: string;
  kind: "Insurance certificate" | "Licence" | "GST/HST registration" | "Contract" | "Other";
  /** null when the document never expires */
  expiresOn: string | null;
  uploadedOn: string;
};

export type Vendor = {
  id: string;
  name: string;
  trade: string;
  contactName: string;
  email: string;
  phone: string;
  notes: string;
  /** preferred vendor for this trade — surfaced first when assigning work */
  preferred: boolean;
  serviceArea: string;
  hourlyRate: number;
  calloutFee: number;
  /** business number shown on their invoices */
  gstNumber: string;
  licenceNumber: string;
  insuranceExpiry: string | null;
  documents: VendorDoc[];
};

export type WorkOrder = {
  id: string;
  requestId: string | null;
  propertyId: string;
  unitId: string;
  tenantId: string | null;
  title: string;
  scope: string;
  photos: string[];
  accessInstructions: string;
  vendorId: string | null;
  scheduledFor: string | null;
  notifyEmail: boolean;
  notifySms: boolean;
  status: WorkOrderStatus;
  createdOn: string;
  completedOn: string | null;
  completionNote: string;
  log: LogEntry[];
};

export type BillLine = { id: string; description: string; amountCents: number };

export type Bill = {
  id: string;
  workOrderId: string | null;
  propertyId: string;
  unitId: string | null;
  vendorId: string | null;
  reference: string;
  issuedOn: string;
  dueDate: string;
  lines: BillLine[];
  taxRatePct: number;
  attachments: string[];
  status: BillStatus;
  submittedById: string | null;
  approvedById: string | null;
  decidedOn: string | null;
  decisionNote: string;
  recurring: boolean;
  log: LogEntry[];
};

export type RecurringRule = {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  propertyId: string;
  unitId: string | null;
  vendorId: string | null;
  cadence: Cadence;
  nextDue: string;
  lastRun: string | null;
  notes: string;
  active: boolean;
};

// —— pure math ————————————————————————————————————————
export const billSubtotalCents = (lines: BillLine[]) => lines.reduce((s, l) => s + l.amountCents, 0);

/** Tax rounded once, on the subtotal — never per line, so totals always reconcile. */
export const billTaxCents = (lines: BillLine[], taxRatePct: number) =>
  Math.round((billSubtotalCents(lines) * taxRatePct) / 100);

export const billTotalCents = (bill: Pick<Bill, "lines" | "taxRatePct">) =>
  billSubtotalCents(bill.lines) + billTaxCents(bill.lines, bill.taxRatePct);

export const CADENCE_MONTHS: Record<Cadence, number> = {
  monthly: 1,
  quarterly: 3,
  "semi-annual": 6,
  annual: 12,
};

/** Add whole months to an ISO date, clamping to the end of the month. */
export function addMonthsToDate(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const target = new Date(Date.UTC(y, m - 1 + n, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export const nextOccurrence = (rule: Pick<RecurringRule, "nextDue" | "cadence">) =>
  addMonthsToDate(rule.nextDue, CADENCE_MONTHS[rule.cadence]);

export const isDue = (rule: RecurringRule, today: string) => rule.active && rule.nextDue <= today;

/** A second person must approve: never the submitter. */
export function canApprove(bill: Bill, userId: string, isOwner: boolean) {
  if (bill.status !== "awaiting-approval") return false;
  if (bill.submittedById === userId) return false;
  return isOwner;
}

export const URGENCY_RANK: Record<Urgency, number> = { emergency: 0, urgent: 1, soon: 2, whenever: 3 };
export const REQUEST_RANK: Record<RequestStatus, number> = { new: 0, assigned: 1, "in-progress": 2, resolved: 3, cancelled: 4 };

// —— lookups ————————————————————————————————————————
export const propertyOfUnit = (unitId: string) => units.find((u) => u.id === unitId)?.propertyId ?? "";

/** MOCK routing: the PM assigned to the property, else the owner. */
export function managerForProperty(propertyId: string) {
  const assignment = seedAssignments.find((a) => a.propertyId === propertyId);
  const user = assignment ? seedUsers.find((u) => u.id === assignment.pmUserId) : null;
  return user ?? seedUsers[0]!;
}

export const propertyName = (id: string) => properties.find((p) => p.id === id)?.name ?? "—";
export const tenantName = (id: string | null) => tenants.find((t) => t.id === id)?.name ?? "No tenant";

export function makeLog(kind: LogKind, actor: string, text: string, at: string): LogEntry {
  return { id: `log-${Math.random().toString(36).slice(2, 9)}`, at, actor, kind, text };
}
