/**
 * MOCK LEASING PIPELINE — prototype only, NOT a backend.
 * ------------------------------------------------------
 * The whole lead-to-lease chain lives here so a real backend can replace it:
 *   listings          -> listings table (property_id, unit_type, unit_id, photos)
 *   applications      -> applications table (+ consent audit row)
 *   prospects         -> pipeline view over applications
 *   screenings        -> SingleKey integration rows
 *   leaseDrafts       -> leases table (draft -> sent -> signed -> active)
 *   scheduledInvoices -> rent_invoices table
 *
 * CRITICAL RULE encoded here: every step is created FROM the previous record,
 * so nothing is ever re-typed. See `draftFromProspect()` and `activate()`.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { properties, units, unitById, propertyById } from "@/lib/mock-data";

export type ListingStatus = "draft" | "published" | "leased";

/** Where a listing was posted by hand. Automatic syndication is on the roadmap. */
export type ChannelPost = { channel: string; postedOn: string; reference?: string };
export type Inquiry = { id: string; name: string; email: string; channel: string; at: string; message: string };

export type Listing = {
  id: string;
  propertyId: string;
  /** prospects search by unit TYPE, not by door number */
  unitType: string;
  unitId: string;
  headline: string;
  rent: number;
  deposit: number;
  bedrooms: number;
  bathrooms: number;
  availableFrom: string;
  parking: boolean;
  storage: boolean;
  photos: string[];
  description: string;
  amenities: string[];
  utilitiesIncluded: string[];
  parkingDetail: string;
  petPolicy: string;
  smokingPolicy: string;
  status: ListingStatus;
  /** shareable public link slug */
  slug: string;
  postedTo: ChannelPost[];
  inquiries: Inquiry[];
};

export type ProspectStatus = "new" | "screening" | "references" | "approved" | "declined";
export type ScreeningStatus = "none" | "invited" | "in-progress" | "complete";

export type ProspectNote = { id: string; at: string; author: string; text: string };
/** The written record of who decided what, and why — the audit trail. */
export type Decision = { outcome: "approved" | "declined"; reason: string; detail: string; by: string; on: string };

export type Application = {
  id: string;
  listingId: string;
  fullName: string;
  email: string;
  phone: string;
  employer: string;
  jobTitle: string;
  monthlyIncome: number;
  moveIn: string;
  occupants: string;
  referenceName: string;
  referencePhone: string;
  guarantorName?: string;
  guarantorPhone?: string;
  documents: string[];
  creditConsent: boolean;
  submittedOn: string;
  note?: string;
};

export type Prospect = {
  id: string;
  applicationId: string;
  status: ProspectStatus;
  screening: { status: ScreeningStatus; requestedOn?: string; score?: number; reportUrl?: string };
  leaseDraftId?: string;
  notes: ProspectNote[];
  /** written when an applicant is approved or declined — kept for the audit trail */
  decision?: Decision;
  referencesChecked?: { name: string; outcome: string; checkedOn: string }[];
};

export type LeaseDraft = {
  id: string;
  prospectId?: string;
  listingId?: string;
  propertyId: string;
  unitId: string;
  tenants: { name: string; email: string; phone: string }[];
  occupants: string;
  startDate: string;
  endDate: string;
  termType: "Fixed term" | "Month-to-month";
  firstInvoiceDate: string;
  rent: number;
  parkingFee: number;
  storageFee: number;
  deposit: number;
  keyDeposit: number;
  province: string;
  standardAnswers: Record<string, string>;
  clauses: string;
  addenda: string[];
  status: "draft" | "sent" | "signed" | "active";
};

export type ScheduledInvoice = {
  id: string;
  unitId: string;
  tenantName: string;
  amount: number;
  dueDate: string;
};

const photo = (seed: string) => `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=900&q=70`;

// MOCK listings — two vacant homes, one already leased.
const seedListings: Listing[] = [
  {
    id: "lst1",
    propertyId: "p2",
    unitType: "Bachelor",
    unitId: "u5",
    headline: "Bright bachelor near Ottawa St shops",
    rent: 1250,
    deposit: 1250,
    bedrooms: 0,
    bathrooms: 1,
    availableFrom: "2026-09-01",
    parking: false,
    storage: true,
    photos: [photo("1502672260266-1c1ef2d93688"), photo("1493809842364-78817add7ffb")],
    description: "Renovated bachelor with in-suite laundry, steps from the Ottawa Street market.",
    amenities: ["In-suite laundry", "Storage locker", "Fridge & stove", "Air conditioning"],
    utilitiesIncluded: ["Heat", "Water"],
    parkingDetail: "Street permit parking only",
    petPolicy: "Pets welcome (Ontario law limits no-pet clauses)",
    smokingPolicy: "No smoking inside the home",
    status: "published",
    slug: "hamilton-bachelor",
    postedTo: [
      { channel: "Kijiji", postedOn: "2026-08-03", reference: "kijiji.ca/v-1794..." },
      { channel: "Facebook Marketplace", postedOn: "2026-08-03" },
    ],
    inquiries: [
      { id: "iq1", name: "Tobi Adeyemi", email: "tobi.adeyemi@example.ca", channel: "Kijiji", at: "2026-08-05", message: "Is the bachelor still available for September 1?" },
      { id: "iq2", name: "Renée Caron", email: "renee.caron@example.ca", channel: "Facebook Marketplace", at: "2026-08-07", message: "Can I see it this weekend? I have a small cat." },
    ],
  },
  {
    id: "lst2",
    propertyId: "p4",
    unitType: "2 bed unit",
    unitId: "p4-7",
    headline: "Sunny 2 bedroom on the Danforth",
    rent: 2150,
    deposit: 2150,
    bedrooms: 2,
    bathrooms: 1,
    availableFrom: "2026-10-01",
    parking: true,
    storage: false,
    photos: [photo("1560448204-e02f11c3d0e2"), photo("1522708323590-d24dbb6b0267")],
    description: "Second-floor walk-up with a south-facing balcony, one parking spot included.",
    amenities: ["Balcony", "Dishwasher", "Fridge & stove", "Shared laundry"],
    utilitiesIncluded: ["Heat", "Water"],
    parkingDetail: "One surface spot included",
    petPolicy: "Pets welcome (Ontario law limits no-pet clauses)",
    smokingPolicy: "No smoking inside the home",
    status: "published",
    slug: "danforth-two-bed",
    postedTo: [
      { channel: "Kijiji", postedOn: "2026-08-01" },
      { channel: "Rentals.ca", postedOn: "2026-08-02" },
      { channel: "Zumper", postedOn: "2026-08-02" },
    ],
    inquiries: [
      { id: "iq3", name: "Nadia Fournier", email: "nadia.fournier@example.ca", channel: "Rentals.ca", at: "2026-08-04", message: "Applying today — is October 1 firm?" },
      { id: "iq4", name: "Étienne Lavoie", email: "etienne.lavoie@example.ca", channel: "Kijiji", at: "2026-08-08", message: "Would October 15 work instead?" },
      { id: "iq5", name: "Sam Whitby", email: "sam.whitby@example.ca", channel: "Zumper", at: "2026-08-09", message: "Is the parking spot covered?" },
    ],
  },
];

// MOCK applications already in the funnel.
const seedApplications: Application[] = [
  {
    id: "app1",
    listingId: "lst2",
    fullName: "Nadia Fournier",
    email: "nadia.fournier@example.ca",
    phone: "(416) 555-0311",
    employer: "Sunnybrook Health Sciences",
    jobTitle: "Registered nurse",
    monthlyIncome: 6400,
    moveIn: "2026-10-01",
    occupants: "Nadia + partner",
    referenceName: "Kelly Doyle (previous landlord)",
    referencePhone: "(905) 555-0122",
    documents: ["Pay stub — July 2026.pdf", "Photo ID.pdf"],
    creditConsent: true,
    submittedOn: "2026-08-06",
    note: "Non-smoker, no pets.",
  },
  {
    id: "app2",
    listingId: "lst1",
    fullName: "Tobi Adeyemi",
    email: "tobi.adeyemi@example.ca",
    phone: "(289) 555-0144",
    employer: "McMaster University",
    jobTitle: "Lab technician",
    monthlyIncome: 4300,
    moveIn: "2026-09-01",
    occupants: "Tobi only",
    referenceName: "Jean Petit (current landlord)",
    referencePhone: "(905) 555-0190",
    guarantorName: "Bola Adeyemi",
    guarantorPhone: "(416) 555-0177",
    documents: ["Employment letter.pdf"],
    creditConsent: true,
    submittedOn: "2026-08-09",
  },
  {
    id: "app3",
    listingId: "lst2",
    fullName: "Étienne Lavoie",
    email: "etienne.lavoie@example.ca",
    phone: "(647) 555-0155",
    employer: "Freelance (design)",
    jobTitle: "Self-employed",
    monthlyIncome: 5200,
    moveIn: "2026-10-15",
    occupants: "Étienne + one child",
    referenceName: "Sara Mahmoud (previous landlord)",
    referencePhone: "(416) 555-0166",
    documents: ["2025 Notice of Assessment.pdf", "Photo ID.pdf"],
    creditConsent: true,
    submittedOn: "2026-08-10",
  },
];

const seedProspects: Prospect[] = [
  {
    id: "pr1",
    applicationId: "app1",
    status: "approved",
    screening: { status: "complete", requestedOn: "2026-08-07", score: 742, reportUrl: "#singlekey-report-1" },
    notes: [
      { id: "pn1", at: "2026-08-07", author: "Mr. J (you)", text: "Viewed the unit with her partner. Asked good questions about parking." },
      { id: "pn2", at: "2026-08-08", author: "Priya Raman", text: "Landlord reference confirmed: paid on time for 3 years, no complaints." },
    ],
    referencesChecked: [{ name: "Kelly Doyle (previous landlord)", outcome: "Positive — always paid on time", checkedOn: "2026-08-08" }],
    decision: { outcome: "approved", reason: "Complete application, references verified", detail: "Approved for October 1 move-in at CA$2,150.", by: "Mr. J (you)", on: "2026-08-09" },
  },
  {
    id: "pr2",
    applicationId: "app2",
    status: "screening",
    screening: { status: "in-progress", requestedOn: "2026-08-10" },
    notes: [{ id: "pn3", at: "2026-08-10", author: "Mr. J (you)", text: "Guarantor offered up front. Waiting on the screening report." }],
  },
  { id: "pr3", applicationId: "app3", status: "new", screening: { status: "none" }, notes: [] },
];

export const prospectStages: { key: ProspectStatus; label: string }[] = [
  { key: "new", label: "New" },
  { key: "screening", label: "Screening requested" },
  { key: "references", label: "References received" },
  { key: "approved", label: "Approved" },
  { key: "declined", label: "Declined" },
];

let counter = 100;
const nextId = (prefix: string) => `${prefix}${++counter}`;

const addMonths = (iso: string, months: number) => {
  const d = new Date(iso + "T12:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

type Ctx = {
  listings: Listing[];
  applications: Application[];
  prospects: Prospect[];
  drafts: LeaseDraft[];
  invoices: ScheduledInvoice[];
  addListing: (
    l: Partial<Listing> & Pick<Listing, "propertyId" | "unitId" | "unitType" | "headline" | "rent">,
  ) => Listing;
  updateListing: (id: string, patch: Partial<Listing>) => void;
  /** photo drag-to-reorder — the first photo is the cover */
  movePhoto: (listingId: string, from: number, to: number) => void;
  /** record that a human posted this listing to a marketplace (no auto-syndication yet) */
  togglePosted: (listingId: string, channel: string) => void;
  addInquiry: (listingId: string, inquiry: Omit<Inquiry, "id">) => void;
  submitApplication: (a: Omit<Application, "id" | "submittedOn">) => Prospect;
  setProspectStatus: (id: string, status: ProspectStatus) => void;
  /** approve or decline with a written reason — always by a named person */
  decideProspect: (id: string, decision: Omit<Decision, "on">) => void;
  addProspectNote: (id: string, note: Omit<ProspectNote, "id" | "at">) => void;
  requestScreening: (id: string) => void;
  advanceScreening: (id: string) => void;
  /** PRE-FILL: builds a lease draft entirely from the application + unit + property. */
  draftFromProspect: (prospectId: string) => LeaseDraft;
  saveDraft: (draft: LeaseDraft) => void;
  sendForSignature: (draftId: string) => void;
  markSigned: (draftId: string) => void;
  /** Creates the tenant, assigns the unit and schedules the first rent invoice. */
  activate: (draftId: string) => ScheduledInvoice;
  addExistingTenant: (input: {
    propertyId: string;
    unitId: string;
    name: string;
    email: string;
    phone: string;
    rent: number;
    startDate: string;
    endDate: string;
    leaseFile: string;
    deposit?: number;
  }) => ScheduledInvoice;
};

const LeasingContext = createContext<Ctx | null>(null);

export function LeasingProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState(seedListings);
  const [applications, setApplications] = useState(seedApplications);
  const [prospects, setProspects] = useState(seedProspects);
  const [drafts, setDrafts] = useState<LeaseDraft[]>([]);
  const [invoices, setInvoices] = useState<ScheduledInvoice[]>([]);

  const value = useMemo<Ctx>(() => {
    const findApp = (id: string) => applications.find((a) => a.id === id)!;

    return {
      listings,
      applications,
      prospects,
      drafts,
      invoices,
      addListing: (l) => {
        const listing: Listing = {
          deposit: l.rent,
          bedrooms: 1,
          bathrooms: 1,
          availableFrom: new Date().toISOString().slice(0, 10),
          parking: false,
          storage: false,
          photos: [],
          description: "",
          amenities: [],
          utilitiesIncluded: [],
          parkingDetail: "",
          petPolicy: "Pets welcome (Ontario law limits no-pet clauses)",
          smokingPolicy: "No smoking inside the home",
          postedTo: [],
          inquiries: [],
          ...l,
          status: l.status ?? "published",
          id: nextId("lst"),
          slug: l.headline.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40),
        };
        setListings((prev) => [listing, ...prev]);
        return listing;
      },
      updateListing: (id, patch) => setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l))),
      movePhoto: (listingId, from, to) =>
        setListings((prev) =>
          prev.map((l) => {
            if (l.id !== listingId) return l;
            const photos = [...l.photos];
            if (from < 0 || to < 0 || from >= photos.length || to >= photos.length) return l;
            const moved = photos.splice(from, 1)[0];
            if (moved === undefined) return l;
            photos.splice(to, 0, moved);
            return { ...l, photos };
          }),
        ),
      togglePosted: (listingId, channel) =>
        setListings((prev) =>
          prev.map((l) => {
            if (l.id !== listingId) return l;
            const has = l.postedTo.some((p) => p.channel === channel);
            return {
              ...l,
              postedTo: has
                ? l.postedTo.filter((p) => p.channel !== channel)
                : [...l.postedTo, { channel, postedOn: new Date().toISOString().slice(0, 10) }],
            };
          }),
        ),
      addInquiry: (listingId, inquiry) =>
        setListings((prev) =>
          prev.map((l) => (l.id === listingId ? { ...l, inquiries: [{ ...inquiry, id: nextId("iq") }, ...l.inquiries] } : l)),
        ),
      submitApplication: (a) => {
        const application: Application = { ...a, id: nextId("app"), submittedOn: new Date().toISOString().slice(0, 10) };
        const prospect: Prospect = { id: nextId("pr"), applicationId: application.id, status: "new", screening: { status: "none" }, notes: [] };
        setApplications((prev) => [application, ...prev]);
        setProspects((prev) => [prospect, ...prev]);
        return prospect;
      },
      setProspectStatus: (id, status) =>
        setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p))),
      decideProspect: (id, decision) =>
        setProspects((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, status: decision.outcome, decision: { ...decision, on: new Date().toISOString().slice(0, 10) } }
              : p,
          ),
        ),
      addProspectNote: (id, note) =>
        setProspects((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, notes: [{ ...note, id: nextId("pn"), at: new Date().toISOString().slice(0, 10) }, ...p.notes] }
              : p,
          ),
        ),
      requestScreening: (id) =>
        setProspects((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, status: "screening", screening: { status: "invited", requestedOn: new Date().toISOString().slice(0, 10) } }
              : p,
          ),
        ),
      advanceScreening: (id) =>
        setProspects((prev) =>
          prev.map((p) => {
            if (p.id !== id) return p;
            if (p.screening.status === "invited") return { ...p, screening: { ...p.screening, status: "in-progress" } };
            if (p.screening.status === "in-progress")
              return {
                ...p,
                status: p.status === "screening" ? "references" : p.status,
                screening: { ...p.screening, status: "complete", score: 718, reportUrl: "#singlekey-report" },
              };
            return p;
          }),
        ),
      draftFromProspect: (prospectId) => {
        const prospect = prospects.find((p) => p.id === prospectId)!;
        const app = findApp(prospect.applicationId);
        const listing = listings.find((l) => l.id === app.listingId)!;
        const unit = unitById(listing.unitId);
        const property = propertyById(listing.propertyId);
        const existing = drafts.find((d) => d.prospectId === prospectId);
        if (existing) return existing;
        const draft: LeaseDraft = {
          id: nextId("ld"),
          prospectId,
          listingId: listing.id,
          propertyId: property.id,
          unitId: unit.id,
          // PRE-FILLED from the application — never re-typed
          tenants: [{ name: app.fullName, email: app.email, phone: app.phone }],
          occupants: app.occupants,
          startDate: app.moveIn,
          endDate: addMonths(app.moveIn, 12),
          termType: "Fixed term",
          firstInvoiceDate: app.moveIn,
          rent: listing.rent,
          parkingFee: listing.parking ? 95 : 0,
          storageFee: listing.storage ? 45 : 0,
          deposit: listing.rent,
          keyDeposit: 50,
          province: property.province,
          standardAnswers: {
            smoking: "Not permitted inside the unit",
            pets: "Allowed, subject to provincial law",
            utilities: "Heat and water included; hydro paid by tenant",
            services: `Parking ${listing.parking ? "included" : "not included"}, storage ${listing.storage ? "included" : "not included"}`,
          },
          clauses: "",
          addenda: [],
          status: "draft",
        };
        setDrafts((prev) => [...prev, draft]);
        setProspects((prev) => prev.map((p) => (p.id === prospectId ? { ...p, leaseDraftId: draft.id } : p)));
        return draft;
      },
      saveDraft: (draft) => setDrafts((prev) => prev.map((d) => (d.id === draft.id ? draft : d))),
      sendForSignature: (draftId) =>
        setDrafts((prev) => prev.map((d) => (d.id === draftId ? { ...d, status: "sent" } : d))),
      markSigned: (draftId) =>
        setDrafts((prev) => prev.map((d) => (d.id === draftId ? { ...d, status: "signed" } : d))),
      activate: (draftId) => {
        const draft = drafts.find((d) => d.id === draftId)!;
        const invoice: ScheduledInvoice = {
          id: nextId("inv"),
          unitId: draft.unitId,
          tenantName: draft.tenants[0]?.name ?? "New tenant",
          amount: draft.rent + draft.parkingFee + draft.storageFee,
          dueDate: draft.firstInvoiceDate,
        };
        setDrafts((prev) => prev.map((d) => (d.id === draftId ? { ...d, status: "active" } : d)));
        setListings((prev) => prev.map((l) => (l.id === draft.listingId ? { ...l, status: "leased" } : l)));
        setInvoices((prev) => [invoice, ...prev]);
        return invoice;
      },
      addExistingTenant: (input) => {
        const draft: LeaseDraft = {
          id: nextId("ld"),
          propertyId: input.propertyId,
          unitId: input.unitId,
          tenants: [{ name: input.name, email: input.email, phone: input.phone }],
          occupants: input.name,
          startDate: input.startDate,
          endDate: input.endDate,
          termType: "Fixed term",
          firstInvoiceDate: input.startDate,
          rent: input.rent,
          parkingFee: 0,
          storageFee: 0,
          deposit: input.deposit ?? 0,
          keyDeposit: 0,
          province: propertyById(input.propertyId).province,
          standardAnswers: {},
          clauses: "Existing signed lease uploaded.",
          addenda: [input.leaseFile],
          status: "active",
        };
        const invoice: ScheduledInvoice = {
          id: nextId("inv"),
          unitId: input.unitId,
          tenantName: input.name,
          amount: input.rent,
          dueDate: input.startDate,
        };
        setDrafts((prev) => [...prev, draft]);
        setInvoices((prev) => [invoice, ...prev]);
        return invoice;
      },
    };
  }, [listings, applications, prospects, drafts, invoices]);

  return <LeasingContext.Provider value={value}>{children}</LeasingContext.Provider>;
}

export function useLeasing() {
  const ctx = useContext(LeasingContext);
  if (!ctx) throw new Error("useLeasing must be used inside <LeasingProvider>");
  return ctx;
}

/** Unit types available for a property — prospects search "2 bedroom", not "unit 101". */
export function unitTypesFor(propertyId: string) {
  const kinds = new Set(units.filter((u) => u.propertyId === propertyId).map((u) => u.kind));
  return [...kinds];
}

export const vacantUnits = () => units.filter((u) => !u.tenantId);
export const allProperties = properties;
