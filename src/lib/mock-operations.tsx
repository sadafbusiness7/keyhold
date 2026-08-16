/**
 * MOCK OPERATIONS STORE — prototype state only, NOT a backend.
 * ---------------------------------------------------------------------------
 * Four operational modules share one provider because they cross-reference each
 * other (an inspection produces a document; an asset links to maintenance; an
 * announcement targets properties/units). Shapes mirror future Supabase tables:
 *   inspection_templates, inspections, inspection_results, documents,
 *   document_versions, assets, asset_shares, announcements, announcement_deliveries
 * so a backend can drop in behind the same API without touching the UI.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { properties, units, tenants, tenantById, unitById, propertyById } from "@/lib/mock-data";

/* ------------------------------------------------------------------ */
/* Inspections                                                         */
/* ------------------------------------------------------------------ */

export type ResponseType = "condition" | "yes-no" | "text" | "photo";
export type Condition = "excellent" | "good" | "fair" | "damaged" | "na";

export const conditionMeta: Record<Condition, { label: string; tone: string; rank: number }> = {
  excellent: { label: "Excellent", tone: "bg-success-soft text-success", rank: 4 },
  good: { label: "Good", tone: "bg-success-soft text-success", rank: 3 },
  fair: { label: "Fair", tone: "bg-warning-soft text-warning", rank: 2 },
  damaged: { label: "Damaged", tone: "bg-maple-soft text-maple", rank: 1 },
  na: { label: "N/A", tone: "bg-navy-soft text-navy", rank: 0 },
};

export type TemplateItem = {
  id: string;
  label: string;
  response: ResponseType;
  photoRequired: boolean;
};

export type TemplateSection = { id: string; name: string; items: TemplateItem[] };

export type InspectionKind = "move-in" | "move-out" | "custom";

export type InspectionTemplate = {
  id: string;
  name: string;
  kind: InspectionKind;
  description: string;
  sections: TemplateSection[];
};

export type ItemResult = {
  condition?: Condition;
  yesNo?: boolean;
  text?: string;
  note: string;
  /** MOCK: object URLs from the file picker, or seeded placeholder names. */
  photos: string[];
};

export type Signature = { name: string; role: "Inspector" | "Tenant"; signedOn: string };

export type InspectionStatus = "draft" | "in-progress" | "completed";

export type Inspection = {
  id: string;
  templateId: string;
  kind: InspectionKind;
  name: string;
  unitId: string;
  tenantId: string | null;
  inspector: string;
  status: InspectionStatus;
  startedOn: string;
  completedOn: string | null;
  results: Record<string, ItemResult>;
  signatures: Signature[];
  pdfFileName?: string;
};

const item = (id: string, label: string, response: ResponseType = "condition", photoRequired = false): TemplateItem => ({
  id,
  label,
  response,
  photoRequired,
});

const roomItems = (prefix: string) => [
  item(`${prefix}-walls`, "Walls & ceiling", "condition", true),
  item(`${prefix}-floor`, "Flooring", "condition", true),
  item(`${prefix}-windows`, "Windows & coverings"),
  item(`${prefix}-lights`, "Lights & outlets"),
  item(`${prefix}-notes`, "Anything else to note", "text"),
];

const moveSections = (p: string): TemplateSection[] => [
  { id: `${p}-entry`, name: "Entry & hallway", items: roomItems(`${p}-entry`) },
  { id: `${p}-living`, name: "Living room", items: roomItems(`${p}-living`) },
  {
    id: `${p}-kitchen`,
    name: "Kitchen",
    items: [
      ...roomItems(`${p}-kitchen`),
      item(`${p}-kitchen-fridge`, "Fridge — clean and cold", "yes-no"),
      item(`${p}-kitchen-stove`, "Stove & oven", "condition", true),
      item(`${p}-kitchen-sink`, "Sink & taps — no leaks", "yes-no"),
    ],
  },
  {
    id: `${p}-bath`,
    name: "Bathroom",
    items: [
      ...roomItems(`${p}-bath`),
      item(`${p}-bath-toilet`, "Toilet flushes and seals", "yes-no"),
      item(`${p}-bath-fan`, "Exhaust fan works", "yes-no"),
    ],
  },
  { id: `${p}-bed`, name: "Bedroom", items: roomItems(`${p}-bed`) },
  {
    id: `${p}-safety`,
    name: "Safety & keys",
    items: [
      item(`${p}-safety-smoke`, "Smoke alarm tested", "yes-no"),
      item(`${p}-safety-co`, "Carbon monoxide alarm tested", "yes-no"),
      item(`${p}-safety-keys`, "Keys handed over (count)", "text"),
      item(`${p}-safety-meter`, "Utility meter reading", "photo", true),
    ],
  },
];

export const seedTemplates: InspectionTemplate[] = [
  {
    id: "tpl-move-in",
    name: "Move-in inspection",
    kind: "move-in",
    description: "Room-by-room condition record signed at key handover.",
    sections: moveSections("mi"),
  },
  {
    id: "tpl-move-out",
    name: "Move-out inspection",
    kind: "move-out",
    description: "The same rooms and items as move-in, so the two compare side by side.",
    sections: moveSections("mi"),
  },
  {
    id: "tpl-fire",
    name: "Fire safety check",
    kind: "custom",
    description: "Alarms, extinguishers and exits.",
    sections: [
      {
        id: "fire-alarms",
        name: "Alarms",
        items: [
          item("fire-smoke", "Smoke alarms on every level", "yes-no"),
          item("fire-co", "CO alarm near sleeping areas", "yes-no"),
          item("fire-batteries", "Batteries replaced", "yes-no"),
        ],
      },
      {
        id: "fire-exits",
        name: "Exits & equipment",
        items: [
          item("fire-ext", "Extinguisher charged (photo of gauge)", "photo", true),
          item("fire-exit", "Exit routes clear", "condition", true),
          item("fire-notes", "Notes", "text"),
        ],
      },
    ],
  },
  {
    id: "tpl-seasonal",
    name: "Seasonal check",
    kind: "custom",
    description: "Furnace, eaves, walkways — before the weather turns.",
    sections: [
      {
        id: "season-out",
        name: "Outside",
        items: [
          item("season-roof", "Roof & eaves", "condition", true),
          item("season-walk", "Walkways & steps", "condition"),
          item("season-drain", "Drainage away from foundation", "yes-no"),
        ],
      },
      {
        id: "season-in",
        name: "Mechanical",
        items: [
          item("season-furnace", "Furnace filter changed", "yes-no"),
          item("season-water", "Water heater — no corrosion", "condition", true),
          item("season-notes", "Notes", "text"),
        ],
      },
    ],
  },
  {
    id: "tpl-annual",
    name: "Annual unit review",
    kind: "custom",
    description: "A yearly walk-through with 24 hours' written notice.",
    sections: [
      {
        id: "annual-general",
        name: "General condition",
        items: [
          item("annual-walls", "Walls & ceilings", "condition", true),
          item("annual-floor", "Flooring", "condition", true),
          item("annual-plumb", "Visible plumbing — no leaks", "yes-no"),
          item("annual-notes", "Follow-up needed", "text"),
        ],
      },
    ],
  },
];

const seedResult = (over: Partial<ItemResult> = {}): ItemResult => ({ note: "", photos: [], ...over });

/** MOCK: a matched move-in / move-out pair on u3 so Compare has something real. */
const moveInResults: Record<string, ItemResult> = {
  "mi-entry-walls": seedResult({ condition: "excellent", photos: ["move-in-entry.jpg"] }),
  "mi-entry-floor": seedResult({ condition: "good", photos: ["move-in-entry-floor.jpg"] }),
  "mi-living-walls": seedResult({ condition: "excellent", photos: ["move-in-living.jpg"] }),
  "mi-living-floor": seedResult({ condition: "excellent", photos: ["move-in-living-floor.jpg"] }),
  "mi-kitchen-walls": seedResult({ condition: "good", photos: ["move-in-kitchen.jpg"] }),
  "mi-kitchen-stove": seedResult({ condition: "good", photos: ["move-in-stove.jpg"] }),
  "mi-kitchen-fridge": seedResult({ yesNo: true }),
  "mi-bath-walls": seedResult({ condition: "good", photos: ["move-in-bath.jpg"] }),
  "mi-bath-toilet": seedResult({ yesNo: true }),
  "mi-bed-walls": seedResult({ condition: "excellent", photos: ["move-in-bed.jpg"] }),
  "mi-bed-floor": seedResult({ condition: "good" }),
  "mi-safety-smoke": seedResult({ yesNo: true }),
  "mi-safety-co": seedResult({ yesNo: true }),
  "mi-safety-keys": seedResult({ text: "3 keys, 1 mail key, 1 fob" }),
};

const moveOutResults: Record<string, ItemResult> = {
  "mi-entry-walls": seedResult({ condition: "good", photos: ["move-out-entry.jpg"] }),
  "mi-entry-floor": seedResult({ condition: "good", photos: ["move-out-entry-floor.jpg"] }),
  "mi-living-walls": seedResult({ condition: "damaged", note: "Two anchor holes above the sofa wall", photos: ["move-out-living.jpg"] }),
  "mi-living-floor": seedResult({ condition: "fair", note: "Scuffing near the balcony door", photos: ["move-out-living-floor.jpg"] }),
  "mi-kitchen-walls": seedResult({ condition: "good", photos: ["move-out-kitchen.jpg"] }),
  "mi-kitchen-stove": seedResult({ condition: "fair", note: "Burner drip pans need replacing", photos: ["move-out-stove.jpg"] }),
  "mi-kitchen-fridge": seedResult({ yesNo: false, note: "Left unplugged with food inside" }),
  "mi-bath-walls": seedResult({ condition: "good", photos: ["move-out-bath.jpg"] }),
  "mi-bath-toilet": seedResult({ yesNo: true }),
  "mi-bed-walls": seedResult({ condition: "good", photos: ["move-out-bed.jpg"] }),
  "mi-bed-floor": seedResult({ condition: "good" }),
  "mi-safety-smoke": seedResult({ yesNo: true }),
  "mi-safety-co": seedResult({ yesNo: true }),
  "mi-safety-keys": seedResult({ text: "3 keys returned, fob missing" }),
};

const seedInspections: Inspection[] = [
  {
    id: "insp-1",
    templateId: "tpl-move-in",
    kind: "move-in",
    name: "Move-in inspection",
    unitId: "u3",
    tenantId: "t3",
    inspector: "Mr. J (you)",
    status: "completed",
    startedOn: "2022-09-01",
    completedOn: "2022-09-01",
    results: moveInResults,
    signatures: [
      { name: "Mr. J", role: "Inspector", signedOn: "2022-09-01" },
      { name: "Grace Okafor", role: "Tenant", signedOn: "2022-09-01" },
    ],
    pdfFileName: "Move-in inspection — 88 Ottawa St N Unit A — 2022-09-01.pdf",
  },
  {
    id: "insp-2",
    templateId: "tpl-move-out",
    kind: "move-out",
    name: "Move-out inspection",
    unitId: "u3",
    tenantId: "t3",
    inspector: "Mr. J (you)",
    status: "completed",
    startedOn: "2026-08-14",
    completedOn: "2026-08-14",
    results: moveOutResults,
    signatures: [{ name: "Mr. J", role: "Inspector", signedOn: "2026-08-14" }],
    pdfFileName: "Move-out inspection — 88 Ottawa St N Unit A — 2026-08-14.pdf",
  },
  {
    id: "insp-3",
    templateId: "tpl-fire",
    kind: "custom",
    name: "Fire safety check",
    unitId: "u1",
    tenantId: "t1",
    inspector: "Mr. J (you)",
    status: "in-progress",
    startedOn: "2026-08-12",
    completedOn: null,
    results: { "fire-smoke": seedResult({ yesNo: true }) },
    signatures: [],
  },
];

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

export const DOC_CATEGORIES = [
  "Lease",
  "Notice",
  "Inspection",
  "Insurance",
  "Receipt",
  "Certificate",
  "Correspondence",
  "Other",
] as const;
export type DocCategory = (typeof DOC_CATEGORIES)[number];

export type DocVersion = { version: number; uploadedOn: string; by: string; note: string; size: string };

export type DocumentRecord = {
  id: string;
  name: string;
  category: DocCategory;
  folder: string;
  propertyId: string | null;
  unitId: string | null;
  tenantId: string | null;
  leaseId: string | null;
  reviewDate: string | null;
  expiryDate: string | null;
  visibility: "private" | "shared";
  uploadedOn: string;
  size: string;
  versions: DocVersion[];
};

const seedDocuments: DocumentRecord[] = [
  {
    id: "doc-1",
    name: "Standard Lease — Lansdowne main floor.pdf",
    category: "Lease",
    folder: "Leases",
    propertyId: "p1",
    unitId: "u1",
    tenantId: "t1",
    leaseId: "l1",
    reviewDate: "2026-09-01",
    expiryDate: "2026-10-31",
    visibility: "shared",
    uploadedOn: "2026-07-02",
    size: "412 KB",
    versions: [
      { version: 2, uploadedOn: "2026-07-02", by: "Mr. J", note: "Signed copy", size: "412 KB" },
      { version: 1, uploadedOn: "2026-06-24", by: "Mr. J", note: "Draft sent for signature", size: "398 KB" },
    ],
  },
  {
    id: "doc-2",
    name: "N4 notice — Unit A.pdf",
    category: "Notice",
    folder: "Notices",
    propertyId: "p2",
    unitId: "u3",
    tenantId: "t3",
    leaseId: null,
    reviewDate: null,
    expiryDate: null,
    visibility: "private",
    uploadedOn: "2026-08-06",
    size: "88 KB",
    versions: [{ version: 1, uploadedOn: "2026-08-06", by: "Mr. J", note: "Generated by Keyhold", size: "88 KB" }],
  },
  {
    id: "doc-3",
    name: "Building insurance — Ottawa St.pdf",
    category: "Insurance",
    folder: "Insurance",
    propertyId: "p2",
    unitId: null,
    tenantId: null,
    leaseId: null,
    reviewDate: "2026-09-15",
    expiryDate: "2026-10-01",
    visibility: "private",
    uploadedOn: "2025-10-01",
    size: "1.4 MB",
    versions: [{ version: 1, uploadedOn: "2025-10-01", by: "Mr. J", note: "Annual policy", size: "1.4 MB" }],
  },
  {
    id: "doc-4",
    name: "Fire safety inspection 2026.pdf",
    category: "Inspection",
    folder: "Inspections",
    propertyId: "p2",
    unitId: null,
    tenantId: null,
    leaseId: null,
    reviewDate: null,
    expiryDate: "2027-05-11",
    visibility: "private",
    uploadedOn: "2026-05-11",
    size: "1.1 MB",
    versions: [{ version: 1, uploadedOn: "2026-05-11", by: "Mr. J", note: "City inspection", size: "1.1 MB" }],
  },
  {
    id: "doc-5",
    name: "Furnace service receipt.pdf",
    category: "Receipt",
    folder: "Maintenance",
    propertyId: "p3",
    unitId: "u6",
    tenantId: null,
    leaseId: null,
    reviewDate: null,
    expiryDate: null,
    visibility: "private",
    uploadedOn: "2026-06-19",
    size: "204 KB",
    versions: [{ version: 1, uploadedOn: "2026-06-19", by: "Mr. J", note: "Paid invoice", size: "204 KB" }],
  },
  {
    id: "doc-6",
    name: "Tenant insurance — Marie Tremblay.pdf",
    category: "Certificate",
    folder: "Tenants",
    propertyId: "p1",
    unitId: "u1",
    tenantId: "t1",
    leaseId: null,
    reviewDate: "2026-08-20",
    expiryDate: "2026-08-31",
    visibility: "shared",
    uploadedOn: "2025-09-01",
    size: "96 KB",
    versions: [{ version: 1, uploadedOn: "2025-09-01", by: "Marie Tremblay", note: "Uploaded from portal", size: "96 KB" }],
  },
];

export const DOC_FOLDERS = ["Leases", "Notices", "Inspections", "Insurance", "Maintenance", "Tenants", "Other"] as const;

/* ------------------------------------------------------------------ */
/* Assets                                                              */
/* ------------------------------------------------------------------ */

export type AssetKind = "equipment" | "info";

export type Asset = {
  id: string;
  kind: AssetKind;
  name: string;
  type: string;
  propertyId: string;
  unitId: string | null;
  /** equipment */
  make?: string;
  model?: string;
  serial?: string;
  purchaseDate?: string | null;
  warrantyExpiry?: string | null;
  /** info assets: door codes, wifi, parking */
  value?: string;
  notes: string;
  /** tenant ids this asset is visible to in the portal */
  sharedWith: string[];
};

const seedAssets: Asset[] = [
  {
    id: "as-1",
    kind: "equipment",
    name: "Fridge — main floor",
    type: "Appliance",
    propertyId: "p1",
    unitId: "u1",
    make: "Whirlpool",
    model: "WRF535SWHZ",
    serial: "WHR-4429183",
    purchaseDate: "2022-04-12",
    warrantyExpiry: "2027-04-12",
    notes: "Water line shut-off is behind the pantry.",
    sharedWith: [],
  },
  {
    id: "as-2",
    kind: "equipment",
    name: "Furnace",
    type: "HVAC",
    propertyId: "p2",
    unitId: null,
    make: "Lennox",
    model: "ML196E",
    serial: "LNX-7781203",
    purchaseDate: "2019-11-02",
    warrantyExpiry: "2026-09-30",
    notes: "Filter size 16x25x1. Change every 3 months.",
    sharedWith: [],
  },
  {
    id: "as-3",
    kind: "equipment",
    name: "Hot water tank — Unit A",
    type: "Plumbing",
    propertyId: "p2",
    unitId: "u3",
    make: "Rheem",
    model: "XE50M06ST45U1",
    serial: "RHM-5510884",
    purchaseDate: "2021-03-08",
    warrantyExpiry: "2027-03-08",
    notes: "Replaced element August 2026.",
    sharedWith: [],
  },
  {
    id: "as-4",
    kind: "info",
    name: "Front door code",
    type: "Access code",
    propertyId: "p2",
    unitId: null,
    value: "4821#",
    notes: "Rotates every January.",
    sharedWith: ["t3", "t4"],
  },
  {
    id: "as-5",
    kind: "info",
    name: "Building wifi",
    type: "Wifi",
    propertyId: "p2",
    unitId: null,
    value: "OttawaSt-Guest / maple-2026",
    notes: "Common areas only.",
    sharedWith: ["t3"],
  },
  {
    id: "as-6",
    kind: "info",
    name: "Parking instructions",
    type: "Parking",
    propertyId: "p1",
    unitId: null,
    value: "Spot 2, laneway side. Visitors park on the street after 6pm.",
    notes: "Snow route — move by 7am on plow days.",
    sharedWith: ["t1", "t2"],
  },
];

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

export type AudienceScope = "all-tenants" | "property" | "unit" | "owners";
export type Channel = "email" | "sms" | "portal";
export type DeliveryState = "sent" | "delivered" | "opened" | "failed";

export type Delivery = {
  id: string;
  recipientId: string;
  name: string;
  channel: Channel;
  state: DeliveryState;
  at: string;
  reason?: string | undefined;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  attachmentName: string | null;
  scope: AudienceScope;
  targetIds: string[];
  channels: Channel[];
  status: "draft" | "scheduled" | "sent";
  scheduledFor: string | null;
  sentOn: string | null;
  createdOn: string;
  deliveries: Delivery[];
};

function deliveriesFor(recipients: { id: string; name: string }[], channels: Channel[], at: string): Delivery[] {
  const states: DeliveryState[] = ["opened", "delivered", "sent", "delivered", "opened", "failed"];
  const out: Delivery[] = [];
  recipients.forEach((r, i) => {
    channels.forEach((c, j) => {
      const state: DeliveryState = states[(i + j) % states.length] ?? "sent";
      out.push({
        id: `dl-${r.id}-${c}-${i}-${j}`,
        recipientId: r.id,
        name: r.name,
        channel: c,
        state,
        at,
        reason: state === "failed" ? (c === "sms" ? "No mobile number on file" : "Mailbox rejected the message") : undefined,
      });
    });
  });
  return out;
}

const seedAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    title: "Water shut-off Tuesday 9am–1pm",
    body: "The city is replacing the main valve on Ottawa St. Water will be off from 9am to about 1pm on Tuesday. Please fill a jug the night before.",
    attachmentName: "City notice.pdf",
    scope: "property",
    targetIds: ["p2"],
    channels: ["email", "sms", "portal"],
    status: "sent",
    scheduledFor: null,
    sentOn: "2026-08-10",
    createdOn: "2026-08-09",
    deliveries: deliveriesFor(
      tenants.filter((t) => unitById(t.unitId)?.propertyId === "p2").map((t) => ({ id: t.id, name: t.name })),
      ["email", "sms", "portal"],
      "2026-08-10",
    ),
  },
  {
    id: "ann-2",
    title: "Snow removal starts November 1",
    body: "Our contractor clears walkways by 7am. Please keep steps free of planters so they can salt properly.",
    attachmentName: null,
    scope: "all-tenants",
    targetIds: [],
    channels: ["email", "portal"],
    status: "scheduled",
    scheduledFor: "2026-10-25",
    sentOn: null,
    createdOn: "2026-08-14",
    deliveries: [],
  },
];

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

type Ctx = {
  templates: InspectionTemplate[];
  inspections: Inspection[];
  documents: DocumentRecord[];
  assets: Asset[];
  announcements: Announcement[];
  saveTemplate: (tpl: InspectionTemplate) => void;
  deleteTemplate: (id: string) => void;
  startInspection: (input: { templateId: string; unitId: string; inspector: string }) => Inspection;
  updateResult: (inspectionId: string, itemId: string, patch: Partial<ItemResult>) => void;
  signInspection: (inspectionId: string, sig: Signature) => void;
  completeInspection: (inspectionId: string, pdfFileName: string) => void;
  deleteInspection: (id: string) => void;
  addDocument: (doc: Omit<DocumentRecord, "id" | "versions"> & { versionNote?: string }) => void;
  updateDocument: (id: string, patch: Partial<DocumentRecord>) => void;
  addVersion: (id: string, note: string, size: string) => void;
  deleteDocument: (id: string) => void;
  saveAsset: (asset: Asset) => void;
  deleteAsset: (id: string) => void;
  toggleAssetShare: (assetId: string, tenantId: string) => void;
  saveAnnouncement: (a: Announcement) => void;
  sendAnnouncement: (id: string, on: string) => void;
  deleteAnnouncement: (id: string) => void;
  recipientsFor: (scope: AudienceScope, targetIds: string[]) => { id: string; name: string; email: string }[];
};

const OperationsContext = createContext<Ctx | null>(null);

const today = () => new Date().toISOString().slice(0, 10);

export function OperationsProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<InspectionTemplate[]>(seedTemplates);
  const [inspections, setInspections] = useState<Inspection[]>(seedInspections);
  const [documents, setDocuments] = useState<DocumentRecord[]>(seedDocuments);
  const [assets, setAssets] = useState<Asset[]>(seedAssets);
  const [announcements, setAnnouncements] = useState<Announcement[]>(seedAnnouncements);

  const recipientsFor = useMemo(
    () =>
      (scope: AudienceScope, targetIds: string[]) => {
        if (scope === "owners") {
          return [{ id: "u_owner", name: "Mr. J (owner)", email: "owner@example.ca" }];
        }
        const list = tenants.filter((t) => {
          if (scope === "all-tenants") return true;
          if (scope === "unit") return targetIds.includes(t.unitId);
          const unit = unitById(t.unitId);
          return unit ? targetIds.includes(unit.propertyId) : false;
        });
        return list.map((t) => ({ id: t.id, name: t.name, email: t.email }));
      },
    [],
  );

  const value = useMemo<Ctx>(
    () => ({
      templates,
      inspections,
      documents,
      assets,
      announcements,
      recipientsFor,
      saveTemplate: (tpl) =>
        setTemplates((prev) => (prev.some((t) => t.id === tpl.id) ? prev.map((t) => (t.id === tpl.id ? tpl : t)) : [tpl, ...prev])),
      deleteTemplate: (id) => setTemplates((prev) => prev.filter((t) => t.id !== id)),
      startInspection: ({ templateId, unitId, inspector }) => {
        const tpl = templates.find((t) => t.id === templateId)!;
        const unit = unitById(unitId);
        const created: Inspection = {
          id: `insp-${Date.now()}`,
          templateId,
          kind: tpl.kind,
          name: tpl.name,
          unitId,
          tenantId: unit?.tenantId ?? null,
          inspector,
          status: "in-progress",
          startedOn: today(),
          completedOn: null,
          results: {},
          signatures: [],
        };
        setInspections((prev) => [created, ...prev]);
        return created;
      },
      updateResult: (inspectionId, itemId, patch) =>
        setInspections((prev) =>
          prev.map((i) =>
            i.id === inspectionId
              ? {
                  ...i,
                  results: {
                    ...i.results,
                    [itemId]: { ...(i.results[itemId] ?? { note: "", photos: [] }), ...patch },
                  },
                }
              : i,
          ),
        ),
      signInspection: (inspectionId, sig) =>
        setInspections((prev) =>
          prev.map((i) =>
            i.id === inspectionId
              ? { ...i, signatures: [...i.signatures.filter((s) => s.role !== sig.role), sig] }
              : i,
          ),
        ),
      completeInspection: (inspectionId, pdfFileName) =>
        setInspections((prev) =>
          prev.map((i) =>
            i.id === inspectionId ? { ...i, status: "completed", completedOn: today(), pdfFileName } : i,
          ),
        ),
      deleteInspection: (id) => setInspections((prev) => prev.filter((i) => i.id !== id)),
      addDocument: ({ versionNote, ...doc }) =>
        setDocuments((prev) => [
          {
            ...doc,
            id: `doc-${Date.now()}-${Math.round(Math.random() * 999)}`,
            versions: [
              { version: 1, uploadedOn: doc.uploadedOn, by: "Mr. J", note: versionNote || "Initial upload", size: doc.size },
            ],
          },
          ...prev,
        ]),
      updateDocument: (id, patch) => setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d))),
      addVersion: (id, note, size) =>
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === id
              ? {
                  ...d,
                  size,
                  uploadedOn: today(),
                  versions: [{ version: d.versions.length + 1, uploadedOn: today(), by: "Mr. J", note, size }, ...d.versions],
                }
              : d,
          ),
        ),
      deleteDocument: (id) => setDocuments((prev) => prev.filter((d) => d.id !== id)),
      saveAsset: (asset) =>
        setAssets((prev) => (prev.some((a) => a.id === asset.id) ? prev.map((a) => (a.id === asset.id ? asset : a)) : [asset, ...prev])),
      deleteAsset: (id) => setAssets((prev) => prev.filter((a) => a.id !== id)),
      toggleAssetShare: (assetId, tenantId) =>
        setAssets((prev) =>
          prev.map((a) =>
            a.id === assetId
              ? {
                  ...a,
                  sharedWith: a.sharedWith.includes(tenantId)
                    ? a.sharedWith.filter((t) => t !== tenantId)
                    : [...a.sharedWith, tenantId],
                }
              : a,
          ),
        ),
      saveAnnouncement: (a) =>
        setAnnouncements((prev) => (prev.some((x) => x.id === a.id) ? prev.map((x) => (x.id === a.id ? a : x)) : [a, ...prev])),
      sendAnnouncement: (id, on) =>
        setAnnouncements((prev) =>
          prev.map((a) => {
            if (a.id !== id) return a;
            const recipients = recipientsFor(a.scope, a.targetIds);
            return { ...a, status: "sent", sentOn: on, deliveries: deliveriesFor(recipients, a.channels, on) };
          }),
        ),
      deleteAnnouncement: (id) => setAnnouncements((prev) => prev.filter((a) => a.id !== id)),
    }),
    [templates, inspections, documents, assets, announcements, recipientsFor],
  );

  return <OperationsContext.Provider value={value}>{children}</OperationsContext.Provider>;
}

export function useOperations() {
  const ctx = useContext(OperationsContext);
  if (!ctx) throw new Error("useOperations must be used inside <OperationsProvider>");
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

export function unitLabel(unitId: string | null) {
  if (!unitId) return "Whole property";
  const unit = units.find((u) => u.id === unitId);
  if (!unit) return "—";
  const prop = propertyById(unit.propertyId);
  return `${prop.address} · ${unit.label}`;
}

export function propertyLabel(propertyId: string | null) {
  if (!propertyId) return "—";
  return properties.find((p) => p.id === propertyId)?.address ?? "—";
}

export function tenantName(tenantId: string | null) {
  return tenantById(tenantId)?.name ?? "—";
}

export function daysUntil(iso: string | null | undefined, from = new Date("2026-08-15")) {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - from.getTime()) / 86_400_000);
}

/** Flatten a template so a conducted inspection can walk items in order. */
export function flattenItems(tpl: InspectionTemplate) {
  return tpl.sections.flatMap((s) => s.items.map((i) => ({ section: s, item: i })));
}

export function resultSummary(result: ItemResult | undefined, response: ResponseType) {
  if (!result) return "Not recorded";
  if (response === "condition") return result.condition ? conditionMeta[result.condition].label : "Not recorded";
  if (response === "yes-no") return result.yesNo === undefined ? "Not recorded" : result.yesNo ? "Yes" : "No";
  if (response === "text") return result.text?.trim() || "Not recorded";
  return result.photos.length ? `${result.photos.length} photo${result.photos.length === 1 ? "" : "s"}` : "No photo";
}
