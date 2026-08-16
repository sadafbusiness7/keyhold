/**
 * MOCK MAINTENANCE STORE — prototype state only, NOT a backend.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { usePermissions } from "@/lib/mock-access";
import { TODAY } from "@/lib/mock-rent";
import { tenantById, unitById, units as allUnits } from "@/lib/mock-data";

import {
  addMonthsToDate,
  makeLog,
  managerForProperty,
  nextOccurrence,
  propertyOfUnit,
  type Bill,
  type BillLine,
  type LogEntry,
  type MaintenanceRequest,
  type RecurringRule,
  type RequestStatus,
  type Urgency,
  type Vendor,
  type VendorDoc,
  type WorkOrder,
  type WorkOrderStatus,
} from "@/lib/maintenance-engine";

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

// —— seeds ——————————————————————————————————————————————
const vdoc = (id: string, name: string, kind: VendorDoc["kind"], expiresOn: string | null, uploadedOn: string): VendorDoc => ({
  id,
  name,
  kind,
  expiresOn,
  uploadedOn,
});

const seedVendors: Vendor[] = [
  {
    id: "v1", name: "Riverside Plumbing", trade: "Plumber", contactName: "Tony Marchetti",
    email: "dispatch@riversideplumbing.ca", phone: "(416) 555-0110",
    notes: "24h emergency line. Invoices within 3 days.", preferred: true,
    serviceArea: "Toronto & East GTA", hourlyRate: 125, calloutFee: 95,
    gstNumber: "81234 5678 RT0001", licenceNumber: "ON-P-44219", insuranceExpiry: "2026-09-14",
    documents: [
      vdoc("vd1", "Liability insurance 2025–26.pdf", "Insurance certificate", "2026-09-14", "2025-09-15"),
      vdoc("vd2", "Master plumber licence.pdf", "Licence", "2027-03-31", "2025-04-02"),
    ],
  },
  {
    id: "v2", name: "Bright Spark Electric", trade: "Electrician", contactName: "Dana Whitfield",
    email: "jobs@brightspark.ca", phone: "(647) 555-0134",
    notes: "ESA certified. Needs 48h notice for non-urgent work.", preferred: true,
    serviceArea: "Toronto, Scarborough", hourlyRate: 140, calloutFee: 110,
    gstNumber: "84422 1190 RT0001", licenceNumber: "ESA-7741", insuranceExpiry: "2027-01-31",
    documents: [
      vdoc("vd3", "Liability insurance.pdf", "Insurance certificate", "2027-01-31", "2026-01-20"),
      vdoc("vd4", "ESA contractor licence.pdf", "Licence", "2026-12-31", "2026-01-05"),
    ],
  },
  {
    id: "v3", name: "Northline HVAC", trade: "HVAC", contactName: "Curtis Lam",
    email: "service@northlinehvac.ca", phone: "(905) 555-0188",
    notes: "Does the seasonal furnace checks on all Ontario properties.", preferred: true,
    serviceArea: "Hamilton, Halton, Peel", hourlyRate: 135, calloutFee: 120,
    gstNumber: "80991 4433 RT0001", licenceNumber: "TSSA-G2-8830", insuranceExpiry: "2026-08-31",
    documents: [
      vdoc("vd5", "Insurance certificate.pdf", "Insurance certificate", "2026-08-31", "2025-08-28"),
      vdoc("vd6", "TSSA gas licence.pdf", "Licence", "2028-06-30", "2024-07-01"),
    ],
  },
  {
    id: "v4", name: "Chen Handyman Services", trade: "Handyman", contactName: "Wei Chen",
    email: "wei@chenhandy.ca", phone: "(416) 555-0155",
    notes: "Good for fences, doors and small carpentry.", preferred: false,
    serviceArea: "Toronto west end", hourlyRate: 75, calloutFee: 0,
    gstNumber: "", licenceNumber: "", insuranceExpiry: "2026-07-31",
    documents: [vdoc("vd7", "Insurance certificate 2025.pdf", "Insurance certificate", "2026-07-31", "2025-07-25")],
  },
  {
    id: "v5", name: "Frostline Snow & Lawn", trade: "Landscaping & snow", contactName: "Marc Girard",
    email: "book@frostline.ca", phone: "(289) 555-0121",
    notes: "Seasonal contract Nov–Apr, per-visit billing.", preferred: true,
    serviceArea: "Hamilton & Niagara", hourlyRate: 65, calloutFee: 0,
    gstNumber: "83320 7712 RT0001", licenceNumber: "", insuranceExpiry: "2027-04-30",
    documents: [
      vdoc("vd8", "Insurance certificate.pdf", "Insurance certificate", "2027-04-30", "2026-04-22"),
      vdoc("vd9", "Winter contract 2026–27.pdf", "Contract", null, "2026-06-10"),
    ],
  },
];

function log(kind: Parameters<typeof makeLog>[0], actor: string, text: string, at = TODAY): LogEntry {
  return makeLog(kind, actor, text, at);
}

const seedRequests: MaintenanceRequest[] = [
  {
    id: "req-1",
    propertyId: "p2",
    unitId: "u3",
    tenantId: "t3",
    category: "Heating & water",
    subcategory: "No hot water",
    description: "Tank pilot light out since last night. Two young children at home.",
    photos: ["tank-pilot.jpg"],
    urgency: "emergency",
    permissionToEnter: true,
    preferredTime: "Any time",
    accessInstructions: "Side door, lockbox code 4417. Small dog in the kitchen.",
    status: "in-progress",
    assigneeId: "u_priya",
    openedOn: "2026-08-08",
    source: "tenant",
    log: [
      log("created", "Grace Okafor", "Request submitted from the tenant portal.", "2026-08-08"),
      log("notification", "Keyhold", "Priya Raman notified by email and SMS (emergency).", "2026-08-08"),
      log("assignment", "Keyhold", "Assigned to Priya Raman.", "2026-08-08"),
      log("status", "Priya Raman", "Status changed to Being fixed.", "2026-08-09"),
      log("work-order", "Priya Raman", "Work order WO-1 created for Riverside Plumbing.", "2026-08-09"),
    ],
  },
  {
    id: "req-2",
    propertyId: "p1",
    unitId: "u1",
    tenantId: "t1",
    category: "Plumbing",
    subcategory: "Dripping tap",
    description: "Kitchen tap drips all day, even when turned off tight. No damage.",
    photos: [],
    urgency: "soon",
    permissionToEnter: false,
    preferredTime: "Weekday evenings",
    accessInstructions: "Please knock — tenant is home after 4pm.",
    status: "assigned",
    assigneeId: "u_priya",
    openedOn: "2026-08-05",
    source: "tenant",
    log: [
      log("created", "Marie Tremblay", "Request submitted from the tenant portal.", "2026-08-05"),
      log("notification", "Keyhold", "Priya Raman notified by email.", "2026-08-05"),
      log("assignment", "Keyhold", "Assigned to Priya Raman.", "2026-08-05"),
      log("message", "Priya Raman", "Thanks — I'll book someone for a weekday evening.", "2026-08-06"),
    ],
  },
  {
    id: "req-3",
    propertyId: "p3",
    unitId: "u6",
    tenantId: "t5",
    category: "Outside & grounds",
    subcategory: "Fence or gate",
    description: "Back fence board loose after the storm.",
    photos: ["fence.jpg"],
    urgency: "whenever",
    permissionToEnter: true,
    preferredTime: "Weekday mornings",
    accessInstructions: "Gate is unlocked, no need for anyone to be home.",
    status: "resolved",
    assigneeId: "u_priya",
    openedOn: "2026-07-29",
    source: "tenant",
    log: [
      log("created", "Wen & Alice Zhou", "Request submitted from the tenant portal.", "2026-07-29"),
      log("assignment", "Keyhold", "Assigned to Priya Raman.", "2026-07-29"),
      log("work-order", "Priya Raman", "Work order WO-2 created for Chen Handyman Services.", "2026-07-30"),
      log("status", "Priya Raman", "Status changed to Resolved.", "2026-08-02"),
    ],
  },
];

const seedWorkOrders: WorkOrder[] = [
  {
    id: "WO-1",
    requestId: "req-1",
    propertyId: "p2",
    unitId: "u3",
    tenantId: "t3",
    title: "No hot water — relight/replace pilot assembly",
    scope: "Tank pilot light out since last night. Two young children at home.",
    photos: ["tank-pilot.jpg"],
    accessInstructions: "Side door, lockbox code 4417. Small dog in the kitchen.",
    vendorId: "v1",
    scheduledFor: "2026-08-10",
    notifyEmail: true,
    notifySms: true,
    status: "in-progress",
    createdOn: "2026-08-09",
    completedOn: null,
    completionNote: "",
    log: [
      log("created", "Priya Raman", "Work order created from request req-1.", "2026-08-09"),
      log("notification", "Keyhold", "Riverside Plumbing notified by email and SMS.", "2026-08-09"),
      log("status", "Riverside Plumbing", "On site, diagnosing.", "2026-08-10"),
    ],
  },
  {
    id: "WO-2",
    requestId: "req-3",
    propertyId: "p3",
    unitId: "u6",
    tenantId: "t5",
    title: "Refasten loose fence board",
    scope: "Back fence board loose after the storm.",
    photos: ["fence.jpg"],
    accessInstructions: "Gate is unlocked, no need for anyone to be home.",
    vendorId: "v4",
    scheduledFor: "2026-08-01",
    notifyEmail: true,
    notifySms: false,
    status: "completed",
    createdOn: "2026-07-30",
    completedOn: "2026-08-01",
    completionNote: "Two boards refastened, one replaced. Gate realigned.",
    log: [
      log("created", "Priya Raman", "Work order created from request req-3.", "2026-07-30"),
      log("notification", "Keyhold", "Chen Handyman Services notified by email.", "2026-07-30"),
      log("status", "Wei Chen", "Marked completed.", "2026-08-01"),
      log("bill", "Priya Raman", "Bill BILL-1 created from this work order.", "2026-08-02"),
    ],
  },
];

const seedBills: Bill[] = [
  {
    id: "BILL-1",
    workOrderId: "WO-2",
    propertyId: "p3",
    unitId: "u6",
    vendorId: "v4",
    reference: "CHS-2291",
    issuedOn: "2026-08-02",
    dueDate: "2026-08-16",
    lines: [
      { id: "bl-1", description: "Labour — 1.5 hrs", amountCents: 12000 },
      { id: "bl-2", description: "Cedar board + fasteners", amountCents: 3450 },
    ],
    taxRatePct: 13,
    attachments: ["chen-invoice-2291.pdf"],
    status: "awaiting-approval",
    submittedById: "u_priya",
    approvedById: null,
    decidedOn: null,
    decisionNote: "",
    recurring: false,
    log: [
      log("bill", "Priya Raman", "Bill created from work order WO-2.", "2026-08-02"),
      log("status", "Priya Raman", "Submitted for approval.", "2026-08-02"),
    ],
  },
  {
    id: "BILL-2",
    workOrderId: null,
    propertyId: "p2",
    unitId: null,
    vendorId: "v5",
    reference: "FROST-AUG",
    issuedOn: "2026-08-01",
    dueDate: "2026-08-15",
    lines: [{ id: "bl-3", description: "Monthly grounds & lawn care", amountCents: 18500 }],
    taxRatePct: 13,
    attachments: [],
    status: "approved",
    submittedById: "u_priya",
    approvedById: "u_owner",
    decidedOn: "2026-08-03",
    decisionNote: "Same as July. Approved.",
    recurring: true,
    log: [
      log("bill", "Priya Raman", "Bill created (recurring monthly expense).", "2026-08-01"),
      log("status", "Priya Raman", "Submitted for approval.", "2026-08-01"),
      log("status", "Mr. J (you)", "Approved.", "2026-08-03"),
    ],
  },
];

const seedRules: RecurringRule[] = [
  { id: "rr-1", title: "Furnace check before heating season", category: "Heating & water", subcategory: "Furnace noise", propertyId: "p1", unitId: null, vendorId: "v3", cadence: "annual", nextDue: "2026-09-15", lastRun: "2025-09-16", notes: "Both units — filter change included.", active: true },
  { id: "rr-2", title: "Snow & ice clearing", category: "Outside & grounds", subcategory: "Snow or ice", propertyId: "p2", unitId: null, vendorId: "v5", cadence: "monthly", nextDue: "2026-08-11", lastRun: "2026-07-11", notes: "Per-visit billing Nov–Apr, walkways first.", active: true },
  { id: "rr-3", title: "Smoke & CO alarm test", category: "Safety", subcategory: "Smoke alarm", propertyId: "p3", unitId: "u6", vendorId: "v4", cadence: "semi-annual", nextDue: "2026-12-01", lastRun: "2026-06-01", notes: "Record the test date for LTB evidence.", active: true },
];

// —— context ————————————————————————————————————————————
type Ctx = ReturnType<typeof useStore>;
const MaintenanceContext = createContext<Ctx | null>(null);

function useStore() {
  const { isDemo } = usePermissions();
  const [requests, setRequests] = useState<MaintenanceRequest[]>(seedRequests);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(seedWorkOrders);
  const [vendors, setVendors] = useState<Vendor[]>(seedVendors);
  const [bills, setBills] = useState<Bill[]>(seedBills);
  const [rules, setRules] = useState<RecurringRule[]>(seedRules);


  return useMemo(() => {
    const pushRequestLog = (id: string, entry: LogEntry) =>
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, log: [...r.log, entry] } : r)));
    const pushWoLog = (id: string, entry: LogEntry) =>
      setWorkOrders((prev) => prev.map((w) => (w.id === id ? { ...w, log: [...w.log, entry] } : w)));
    const pushBillLog = (id: string, entry: LogEntry) =>
      setBills((prev) => prev.map((b) => (b.id === id ? { ...b, log: [...b.log, entry] } : b)));

    /** Create a request and notify the assigned manager immediately. */
    const createRequest = (input: {
      unitId: string;
      tenantId: string | null;
      category: string;
      subcategory: string;
      description: string;
      photos?: string[];
      urgency: Urgency;
      permissionToEnter: boolean;
      preferredTime: string;
      accessInstructions?: string;
      source?: MaintenanceRequest["source"];
      actor?: string;
      recurringRuleId?: string;
    }) => {
      const propertyId = propertyOfUnit(input.unitId);
      const manager = managerForProperty(propertyId);
      const actor = input.actor ?? tenantById(input.tenantId)?.name ?? "You";
      const channel = input.urgency === "emergency" || input.urgency === "urgent" ? "email and SMS" : "email";
      const request: MaintenanceRequest = {
        id: uid("req"),
        propertyId,
        unitId: input.unitId,
        tenantId: input.tenantId,
        category: input.category,
        subcategory: input.subcategory,
        description: input.description,
        photos: input.photos ?? [],
        urgency: input.urgency,
        permissionToEnter: input.permissionToEnter,
        preferredTime: input.preferredTime,
        accessInstructions: input.accessInstructions ?? "",
        status: "assigned",
        assigneeId: manager.id,
        openedOn: TODAY,
        source: input.source ?? "tenant",
        ...(input.recurringRuleId ? { recurringRuleId: input.recurringRuleId } : {}),
        log: [
          log("created", actor, `Request submitted (${input.category} · ${input.subcategory}).`),
          log("notification", "Keyhold", `${manager.name} notified by ${channel}.`),
          log("assignment", "Keyhold", `Assigned to ${manager.name}.`),
        ],
      };

      if (isDemo) {
        toast.info("Simulation: Request received. In demo mode, notifications are simulated.", {
          description: `${manager.name} would be notified by ${channel}.`,
        });
        return { request, manager, channel };
      }

      setRequests((prev) => [request, ...prev]);
      return { request, manager, channel };
    };

    const addMessage = (requestId: string, actor: string, body: string) =>
      pushRequestLog(requestId, log("message", actor, body));

    const setRequestStatus = (requestId: string, status: RequestStatus, actor: string) => {
      setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status } : r)));
      pushRequestLog(requestId, log("status", actor, `Status changed to ${status}.`));
    };

    const assignRequest = (requestId: string, userId: string, userName: string, actor: string) => {
      setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, assigneeId: userId, status: r.status === "new" ? "assigned" : r.status } : r)));
      pushRequestLog(requestId, log("assignment", actor, `Reassigned to ${userName}.`));
      pushRequestLog(requestId, log("notification", "Keyhold", `${userName} notified by email.`));
    };

    /** Work order carries over everything from the request — no re-typing. */
    const createWorkOrder = (input: { requestId: string; vendorId: string | null; scheduledFor: string | null; notifyEmail: boolean; notifySms: boolean; actor: string; scopeOverride?: string }) => {
      if (isDemo) {
        toast.info("Simulation: Work order created. In demo mode, vendors are not really notified.");
        // We still need to return a valid object for the UI to not crash if it expects it
        const req = requests.find(r => r.id === input.requestId);
        return { id: "WO-DEMO", requestId: input.requestId, title: req?.subcategory || "Repair" };
      }

      const request = requests.find((r) => r.id === input.requestId);
      if (!request) return null;
      const id = `WO-${workOrders.length + 1}`;
      const vendor = vendors.find((v) => v.id === input.vendorId) ?? null;
      const channels = [input.notifyEmail && "email", input.notifySms && "SMS"].filter(Boolean).join(" and ");
      const wo: WorkOrder = {
        id,
        requestId: request.id,
        propertyId: request.propertyId,
        unitId: request.unitId,
        tenantId: request.tenantId,
        title: `${request.subcategory} — ${unitById(request.unitId).label}`,
        scope: input.scopeOverride?.trim() || request.description,
        photos: request.photos,
        accessInstructions: request.accessInstructions || (request.permissionToEnter ? "Tenant gave permission to enter when not home." : "Knock — tenant wants to be home."),
        vendorId: input.vendorId,
        scheduledFor: input.scheduledFor,
        notifyEmail: input.notifyEmail,
        notifySms: input.notifySms,
        status: input.scheduledFor ? "scheduled" : "assigned",
        createdOn: TODAY,
        completedOn: null,
        completionNote: "",
        log: [
          log("created", input.actor, `Work order created from request ${request.id}.`),
          ...(vendor && channels ? [log("notification", "Keyhold", `${vendor.name} notified by ${channels}.`)] : []),
        ],
      };
      setWorkOrders((prev) => [wo, ...prev]);
      pushRequestLog(request.id, log("work-order", input.actor, `Work order ${id} created${vendor ? ` for ${vendor.name}` : ""}.`));
      if (request.status === "new" || request.status === "assigned") {
        setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status: "in-progress" } : r)));
      }
      return wo;
    };

    const setWorkOrderStatus = (id: string, status: WorkOrderStatus, actor: string, note = "") => {
      setWorkOrders((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, status, completedOn: status === "completed" ? TODAY : w.completedOn, completionNote: note || w.completionNote }
            : w,
        ),
      );
      pushWoLog(id, log("status", actor, status === "completed" ? `Marked completed.${note ? ` ${note}` : ""}` : `Status changed to ${status}.`));
      const wo = workOrders.find((w) => w.id === id);
      if (wo?.requestId && status === "completed") {
        pushRequestLog(wo.requestId, log("status", actor, `Work order ${id} completed.`));
      }
    };

    const notifyVendor = (id: string, actor: string) => {
      const wo = workOrders.find((w) => w.id === id);
      const vendor = vendors.find((v) => v.id === wo?.vendorId);
      const channels = [wo?.notifyEmail && "email", wo?.notifySms && "SMS"].filter(Boolean).join(" and ") || "email";
      pushWoLog(id, log("notification", actor, `${vendor?.name ?? "Vendor"} re-notified by ${channels}.`));
      return { vendor, channels };
    };

    // —— vendors ——
    const addVendor = (v: Partial<Vendor> & Pick<Vendor, "name" | "trade">) => {
      const vendor: Vendor = {
        contactName: "",
        email: "",
        phone: "",
        notes: "",
        preferred: false,
        serviceArea: "",
        hourlyRate: 0,
        calloutFee: 0,
        gstNumber: "",
        licenceNumber: "",
        insuranceExpiry: null,
        documents: [],
        ...v,
        id: uid("v"),
      };
      setVendors((prev) => [...prev, vendor]);
      return vendor;
    };
    const updateVendor = (id: string, patch: Partial<Vendor>) =>
      setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
    const historyForVendor = (vendorId: string) => ({
      workOrders: workOrders.filter((w) => w.vendorId === vendorId),
      bills: bills.filter((b) => b.vendorId === vendorId),
    });

    // —— bills ——
    const createBill = (input: {
      workOrderId: string | null;
      propertyId: string;
      unitId: string | null;
      vendorId: string | null;
      reference: string;
      dueDate: string;
      lines: BillLine[];
      taxRatePct: number;
      attachments: string[];
      submit: boolean;
      actor: string;
      actorId: string;
      recurring?: boolean;
    }) => {
      const id = `BILL-${bills.length + 1}`;
      const bill: Bill = {
        id,
        workOrderId: input.workOrderId,
        propertyId: input.propertyId,
        unitId: input.unitId,
        vendorId: input.vendorId,
        reference: input.reference,
        issuedOn: TODAY,
        dueDate: input.dueDate,
        lines: input.lines,
        taxRatePct: input.taxRatePct,
        attachments: input.attachments,
        status: input.submit ? "awaiting-approval" : "draft",
        submittedById: input.submit ? input.actorId : null,
        approvedById: null,
        decidedOn: null,
        decisionNote: "",
        recurring: input.recurring ?? false,
        log: [
          log("bill", input.actor, input.workOrderId ? `Bill created from work order ${input.workOrderId}.` : "Bill created."),
          ...(input.submit ? [log("status", input.actor, "Submitted for approval.")] : []),
        ],
      };
      setBills((prev) => [bill, ...prev]);
      if (input.workOrderId) pushWoLog(input.workOrderId, log("bill", input.actor, `Bill ${id} created from this work order.`));
      return bill;
    };

    const submitBill = (id: string, actorId: string, actor: string) => {
      setBills((prev) => prev.map((b) => (b.id === id ? { ...b, status: "awaiting-approval", submittedById: actorId } : b)));
      pushBillLog(id, log("status", actor, "Submitted for approval."));
    };

    const decideBill = (id: string, decision: "approved" | "rejected", actorId: string, actor: string, note: string) => {
      setBills((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: decision, approvedById: actorId, decidedOn: TODAY, decisionNote: note } : b,
        ),
      );
      pushBillLog(id, log("status", actor, `${decision === "approved" ? "Approved" : "Rejected"}.${note ? ` ${note}` : ""}`));
    };

    /** Duplicate for a recurring monthly expense — same lines, next month's dates. */
    const duplicateBill = (id: string, actor: string) => {
      const source = bills.find((b) => b.id === id);
      if (!source) return null;
      const newId = `BILL-${bills.length + 1}`;
      const copy: Bill = {
        ...source,
        id: newId,
        issuedOn: addMonthsToDate(source.issuedOn, 1),
        dueDate: addMonthsToDate(source.dueDate, 1),
        lines: source.lines.map((l) => ({ ...l, id: uid("bl") })),
        status: "draft",
        submittedById: null,
        approvedById: null,
        decidedOn: null,
        decisionNote: "",
        recurring: true,
        attachments: [],
        log: [log("bill", actor, `Duplicated from ${source.id} for next month.`)],
      };
      setBills((prev) => [copy, ...prev]);
      return copy;
    };

    // —— recurring ——
    const addRule = (r: Omit<RecurringRule, "id" | "lastRun" | "active">) => {
      const rule: RecurringRule = { ...r, id: uid("rr"), lastRun: null, active: true };
      setRules((prev) => [...prev, rule]);
      return rule;
    };
    const toggleRule = (id: string) => setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));

    /** Turn a due rule into a real request, then roll the schedule forward. */
    const runRule = (id: string, actor: string) => {
      const rule = rules.find((r) => r.id === id);
      if (!rule) return null;
      const targetUnit = rule.unitId ?? firstUnitOf(rule.propertyId);
      if (!targetUnit) return null;
      const created = createRequest({
        unitId: targetUnit,
        tenantId: null,
        category: rule.category,
        subcategory: rule.subcategory,
        description: `${rule.title}. ${rule.notes}`.trim(),
        urgency: "soon",
        permissionToEnter: true,
        preferredTime: "Any time",
        accessInstructions: "Routine scheduled work — manager arranges access.",
        source: "recurring",
        actor,
        recurringRuleId: rule.id,
      });
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, lastRun: TODAY, nextDue: nextOccurrence(r) } : r)),
      );
      return created;
    };

    return {
      today: TODAY,
      requests,
      workOrders,
      vendors,
      bills,
      rules,
      requestById: (id: string) => requests.find((r) => r.id === id) ?? null,
      workOrderById: (id: string) => workOrders.find((w) => w.id === id) ?? null,
      billById: (id: string) => bills.find((b) => b.id === id) ?? null,
      vendorById: (id: string | null) => vendors.find((v) => v.id === id) ?? null,
      requestsForTenant: (tenantId: string) => requests.filter((r) => r.tenantId === tenantId),
      historyForVendor,
      createRequest,
      addMessage,
      setRequestStatus,
      assignRequest,
      createWorkOrder,
      setWorkOrderStatus,
      notifyVendor,
      addVendor,
      updateVendor,
      createBill,
      submitBill,
      decideBill,
      duplicateBill,
      addRule,
      toggleRule,
      runRule,
    };
  }, [requests, workOrders, vendors, bills, rules]);
}

/** MOCK: first unit of a property, used when routine work isn't unit-specific. */
function firstUnitOf(propertyId: string) {
  return allUnits.find((u) => u.propertyId === propertyId)?.id ?? null;
}

export function MaintenanceProvider({ children }: { children: ReactNode }) {
  return <MaintenanceContext.Provider value={useStore()}>{children}</MaintenanceContext.Provider>;
}

export function useMaintenance() {
  const ctx = useContext(MaintenanceContext);
  if (!ctx) throw new Error("useMaintenance must be used inside <MaintenanceProvider>");
  return ctx;
}
