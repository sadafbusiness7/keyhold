// Realistic Canadian mock data for Keyhold.
// Shaped like future Supabase tables so a backend can replace these arrays
// without touching the UI.

export type PaymentStatus = "paid" | "due-soon" | "overdue" | "partial";
export type TicketStatus = "emergency" | "open" | "in-progress" | "resolved";

export type Property = {
  id: string;
  /** MOCK: which owner account this property belongs to. */
  ownerId: string;
  portfolioId?: string; // Link to a regional group
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  kind: string;
};


export type UnitStatus = "occupied" | "vacant" | "turnover" | "listing";

export type Unit = {
  id: string;
  propertyId: string;
  label: string;
  kind: string;
  bedrooms: number;
  rent: number;
  tenantId: string | null;
  leaseEnd: string | null;
  status?: UnitStatus;
  turnoverDays?: number; // Days vacant during turnover
  turnoverCostCents?: number; // Total cost of make-ready in cents
  turnoverStartedOn?: string;
  turnoverCompletedOn?: string;
  turnoverTasks?: { id: string; label: string; status: "todo" | "done"; assignee?: string }[];
};



export type Tenant = {
  id: string;
  name: string;
  email: string;
  phone: string;
  unitId: string;
  movedIn: string;
};

export type RentRow = {
  id: string;
  tenantId: string;
  unitId: string;
  rent: number;
  balance: number;
  dueDate: string;
  paidOn: string | null;
  status: PaymentStatus;
  method: string | null;
};

export type Ticket = {
  id: string;
  unitId: string;
  tenantId: string;
  title: string;
  category: string;
  status: TicketStatus;
  openedOn: string;
  note: string;
};

export type Lease = {
  id: string;
  unitId: string;
  tenantId: string;
  start: string;
  end: string;
  rent: number;
  type: "Fixed term" | "Month-to-month";
  depositHeld: number;
};

export type Portfolio = {
  id: string;
  name: string;
  propertyIds: string[];
};

export const portfolios: Portfolio[] = [
  { id: "toronto", name: "Toronto Portfolio", propertyIds: ["p1", "p3", "p4"] },
  { id: "hamilton", name: "Hamilton Portfolio", propertyIds: ["p2"] },
  { id: "vancouver", name: "Vancouver Portfolio", propertyIds: ["p5", "p6"] },
];

export const properties: Property[] = [


  {
    id: "p1",
    ownerId: "u_owner",
    portfolioId: "toronto",
    name: "Lansdowne Duplex",
    address: "412 Lansdowne Ave",
    city: "Toronto",
    province: "ON",
    postalCode: "M6H 3Y2",
    kind: "Duplex",
  },

  {
    id: "p2",
    ownerId: "u_owner",
    portfolioId: "hamilton",
    name: "Ottawa Street Triplex",
    address: "88 Ottawa St N",
    city: "Hamilton",
    province: "ON",
    postalCode: "L8H 3Z1",
    kind: "Triplex",
  },

  {
    id: "p3",
    ownerId: "u_owner",
    portfolioId: "toronto",
    name: "Birchmount Townhome",
    address: "27 Birchmount Rd",
    city: "Toronto",
    province: "ON",
    postalCode: "M1N 3J7",
    kind: "Townhome",
  },

  {
    id: "p4",
    ownerId: "u_owner",
    portfolioId: "toronto",
    name: "Danforth Walk-up",
    address: "1290 Danforth Ave",
    city: "Toronto",
    province: "ON",
    postalCode: "M4J 1M6",
    kind: "Walk-up apartment",
  },

  {
    id: "p5",
    ownerId: "u_owner",
    portfolioId: "vancouver",
    name: "Kitsilano Apartments",
    address: "2450 W 4th Ave",
    city: "Vancouver",
    province: "BC",
    postalCode: "V6K 1P3",
    kind: "Low-rise apartment",
  },

  {
    id: "p6",
    ownerId: "u_owner",
    portfolioId: "vancouver",
    name: "Mount Pleasant Lofts",
    address: "185 E 8th Ave",
    city: "Vancouver",
    province: "BC",
    postalCode: "V5T 1R8",
    kind: "Loft building",
  },

];

// MOCK: generated units so the demo portfolio is ~40 doors across two regions.
function makeUnits(propertyId: string, count: number, baseRent: number, startAt = 1): Unit[] {
  return Array.from({ length: count }, (_, i) => {
    const n = startAt + i;
    const bedrooms = n % 3 === 0 ? 2 : n % 3 === 1 ? 1 : 0;
    return {
      id: `${propertyId}-${n}`,
      propertyId,
      label: `Unit ${n}`,
      kind: bedrooms === 0 ? "Bachelor" : `${bedrooms} bed unit`,
      bedrooms,
      rent: baseRent + bedrooms * 350,
      tenantId: n % 7 === 0 ? null : `t-${propertyId}-${n}`,
      leaseEnd: n % 7 === 0 ? null : `2027-0${(n % 9) + 1}-01`,
    } satisfies Unit;
  });
}

export const units: Unit[] = [
  { id: "u1", propertyId: "p1", label: "Main floor", kind: "2 bed unit", bedrooms: 2, rent: 2350, tenantId: "t1", leaseEnd: "2026-10-31" },
  { id: "u2", propertyId: "p1", label: "Basement suite", kind: "1 bed suite", bedrooms: 1, rent: 1575, tenantId: "t2", leaseEnd: "2026-09-30" },
  { id: "u3", propertyId: "p2", label: "Unit A", kind: "2 bed unit", bedrooms: 2, rent: 1895, tenantId: "t3", leaseEnd: "2026-08-31" },
  { id: "u4", propertyId: "p2", label: "Unit B", kind: "1 bed unit", bedrooms: 1, rent: 1495, tenantId: "t4", leaseEnd: "2027-01-31" },
  { id: "u5", propertyId: "p2", label: "Unit C", kind: "Bachelor", bedrooms: 0, rent: 1250, tenantId: null, leaseEnd: null },
  { id: "u6", propertyId: "p3", label: "Whole home", kind: "3 bed townhome", bedrooms: 3, rent: 3100, tenantId: "t5", leaseEnd: "2026-08-31" },
  ...makeUnits("p4", 14, 1450),
  ...makeUnits("p5", 12, 1850),
  ...makeUnits("p6", 8, 1950),
];

// MOCK: one tenant per occupied generated unit.
const generatedFirst = ["Amrit", "Chloé", "Noah", "Priyanka", "Diego", "Mei", "Omar", "Sofia", "Jonas", "Ayesha", "Tariq", "Elena", "Ravi", "Hana"];
const generatedLast = ["Singh", "Bouchard", "Wong", "Patel", "Alvarez", "Chen", "Haddad", "Rossi", "Berg", "Khan", "Aziz", "Novak", "Iyer", "Kim"];
const generatedTenants: Tenant[] = units
  .filter((u) => u.tenantId?.startsWith("t-"))
  .map((u, i) => ({
    id: u.tenantId!,
    name: `${generatedFirst[i % generatedFirst.length]} ${generatedLast[(i * 3) % generatedLast.length]}`,
    email: `tenant${i + 1}@example.ca`,
    phone: `(${u.propertyId === "p4" ? "416" : "604"}) 555-0${(200 + i).toString().padStart(3, "0")}`,
    unitId: u.id,
    movedIn: "2025-06-01",
  }));

export const tenants: Tenant[] = [
  { id: "t1", name: "Marie Tremblay", email: "marie.tremblay@example.ca", phone: "(416) 555-0142", unitId: "u1", movedIn: "2023-11-01" },
  { id: "t2", name: "Dev Sharma", email: "dev.sharma@example.ca", phone: "(647) 555-0118", unitId: "u2", movedIn: "2024-10-01" },
  { id: "t3", name: "Grace Okafor", email: "grace.okafor@example.ca", phone: "(905) 555-0177", unitId: "u3", movedIn: "2022-09-01" },
  { id: "t4", name: "Liam Gallagher", email: "liam.g@example.ca", phone: "(289) 555-0163", unitId: "u4", movedIn: "2025-02-01" },
  { id: "t5", name: "Wen & Alice Zhou", email: "zhou.family@example.ca", phone: "(416) 555-0199", unitId: "u6", movedIn: "2021-08-01" },
  ...generatedTenants,
];

export const rentRows: RentRow[] = [
  { id: "r1", tenantId: "t1", unitId: "u1", rent: 2350, balance: 0, dueDate: "2026-08-01", paidOn: "2026-08-01", status: "paid", method: "e-Transfer" },
  { id: "r2", tenantId: "t2", unitId: "u2", rent: 1575, balance: 0, dueDate: "2026-08-01", paidOn: "2026-08-02", status: "paid", method: "Pre-authorized debit" },
  { id: "r3", tenantId: "t3", unitId: "u3", rent: 1895, balance: 1895, dueDate: "2026-08-01", paidOn: null, status: "overdue", method: null },
  { id: "r4", tenantId: "t4", unitId: "u4", rent: 1495, balance: 495, dueDate: "2026-08-01", paidOn: "2026-08-03", status: "partial", method: "e-Transfer" },
  { id: "r5", tenantId: "t5", unitId: "u6", rent: 3100, balance: 3100, dueDate: "2026-08-15", paidOn: null, status: "due-soon", method: null },
];

export const tickets: Ticket[] = [
  {
    id: "m1",
    unitId: "u3",
    tenantId: "t3",
    title: "No hot water",
    category: "Heating & water",
    status: "emergency",
    openedOn: "2026-08-08",
    note: "Tank pilot light out since last night. Tenant has two young children at home.",
  },
  {
    id: "m2",
    unitId: "u1",
    tenantId: "t1",
    title: "Kitchen tap drips",
    category: "Plumbing",
    status: "open",
    openedOn: "2026-08-05",
    note: "Slow drip, no damage. Tenant can be home weekdays after 4pm.",
  },
  {
    id: "m3",
    unitId: "u6",
    tenantId: "t5",
    title: "Back fence board loose",
    category: "Outside & grounds",
    status: "in-progress",
    openedOn: "2026-07-29",
    note: "Handyman booked for Thursday morning.",
  },
  {
    id: "m4",
    unitId: "u2",
    tenantId: "t2",
    title: "Smoke alarm chirping",
    category: "Safety",
    status: "resolved",
    openedOn: "2026-07-18",
    note: "Battery replaced, tested with tenant present.",
  },
];

export const leases: Lease[] = [
  { id: "l1", unitId: "u1", tenantId: "t1", start: "2023-11-01", end: "2026-10-31", rent: 2350, type: "Fixed term", depositHeld: 2350 },
  { id: "l2", unitId: "u2", tenantId: "t2", start: "2024-10-01", end: "2026-09-30", rent: 1575, type: "Fixed term", depositHeld: 1575 },
  { id: "l3", unitId: "u3", tenantId: "t3", start: "2022-09-01", end: "2026-08-31", rent: 1895, type: "Month-to-month", depositHeld: 1800 },
  { id: "l4", unitId: "u4", tenantId: "t4", start: "2025-02-01", end: "2027-01-31", rent: 1495, type: "Fixed term", depositHeld: 1495 },
  { id: "l5", unitId: "u6", tenantId: "t5", start: "2021-08-01", end: "2026-08-31", rent: 3100, type: "Month-to-month", depositHeld: 2900 },
];

export type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  detail: string;
  tone: "action" | "warning" | "maple" | "success";
  /** what kind of thing this is — drives the calendar colour + icon + label */
  type: "rent" | "lease-end" | "inspection" | "maintenance" | "move-in";
};

export const calendarEvents: CalendarEvent[] = [
  { id: "c1", date: "2026-08-10", title: "Plumber at 88 Ottawa St N", detail: "Hot water tank, Unit A, 9:00am", tone: "maple", type: "maintenance" },
  { id: "c2", date: "2026-08-12", title: "Fence repair", detail: "27 Birchmount Rd, handyman 8:30am", tone: "action", type: "maintenance" },
  { id: "c3", date: "2026-08-15", title: "Rent due — Zhou family", detail: "CA$3,100.00 · 27 Birchmount Rd", tone: "warning", type: "rent" },
  { id: "c4", date: "2026-08-20", title: "Unit inspection", detail: "412 Lansdowne Ave, basement suite, 1:00pm", tone: "action", type: "inspection" },
  { id: "c5", date: "2026-08-31", title: "Lease ends — Grace Okafor", detail: "88 Ottawa St N, Unit A", tone: "warning", type: "lease-end" },
];

export type Doc = {
  id: string;
  name: string;
  kind: string;
  linkedTo: string;
  updated: string;
  size: string;
};

export const documents: Doc[] = [
  { id: "d1", name: "Standard Lease — Lansdowne main floor.pdf", kind: "Lease", linkedTo: "412 Lansdowne Ave · Main floor", updated: "2026-07-02", size: "412 KB" },
  { id: "d2", name: "N4 notice — Unit A.pdf", kind: "LTB notice", linkedTo: "88 Ottawa St N · Unit A", updated: "2026-08-06", size: "88 KB" },
  { id: "d3", name: "Furnace service receipt.pdf", kind: "Receipt", linkedTo: "27 Birchmount Rd", updated: "2026-06-19", size: "204 KB" },
  { id: "d4", name: "Fire safety inspection 2026.pdf", kind: "Inspection", linkedTo: "88 Ottawa St N", updated: "2026-05-11", size: "1.1 MB" },
];

export type Thread = {
  id: string;
  tenantId: string;
  subject: string;
  last: string;
  when: string;
  unread: boolean;
  messages: { id: string; from: "you" | "tenant"; body: string; when: string }[];
};

export const threads: Thread[] = [
  {
    id: "th1",
    tenantId: "t3",
    subject: "Hot water is out",
    last: "Thank you — the plumber is booked for Monday 9am.",
    when: "Today, 8:12am",
    unread: true,
    messages: [
      { id: "n1", from: "tenant", body: "Hi, we have no hot water since last night.", when: "Yesterday, 9:41pm" },
      { id: "n2", from: "you", body: "Sorry about that. I've called a plumber now.", when: "Yesterday, 10:02pm" },
      { id: "n3", from: "you", body: "Thank you — the plumber is booked for Monday 9am.", when: "Today, 8:12am" },
    ],
  },
  {
    id: "th2",
    tenantId: "t1",
    subject: "Kitchen tap",
    last: "Any weekday after 4pm works for me.",
    when: "Aug 5",
    unread: false,
    messages: [
      { id: "n4", from: "tenant", body: "The kitchen tap drips a little. Not urgent.", when: "Aug 5, 11:20am" },
      { id: "n5", from: "tenant", body: "Any weekday after 4pm works for me.", when: "Aug 5, 11:21am" },
    ],
  },
  {
    id: "th3",
    tenantId: "t5",
    subject: "August rent",
    last: "Rent will be sent on the 15th as usual.",
    when: "Aug 2",
    unread: false,
    messages: [{ id: "n6", from: "tenant", body: "Rent will be sent on the 15th as usual.", when: "Aug 2, 6:03pm" }],
  },
];

// ——— helpers ———

export const cad = (amount: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(amount).replace("$", "CA$");

export const cadShort = (amount: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 })
    .format(amount)
    .replace("$", "CA$");

export const longDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });

export const shortDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric" });

export const tenantById = (id: string | null) => tenants.find((t) => t.id === id) ?? null;
export const unitById = (id: string) => units.find((u) => u.id === id)!;
export const propertyById = (id: string) => properties.find((p) => p.id === id)!;
export const unitAddress = (unitId: string) => {
  const u = unitById(unitId);
  const p = propertyById(u.propertyId);
  return `${p.address} · ${u.label}`;
};

export const expectedRent = rentRows.reduce((s, r) => s + r.rent, 0);
export const receivedRent = rentRows.reduce((s, r) => s + (r.rent - r.balance), 0);
export const owedRent = rentRows.reduce((s, r) => s + r.balance, 0);
export const occupiedUnits = units.filter((u) => u.tenantId).length;
export const needsYou = tickets.filter((t) => t.status !== "resolved").length;
export const leasesEndingSoon = leases.filter((l) => new Date(l.end) <= new Date("2026-10-01")).length;
