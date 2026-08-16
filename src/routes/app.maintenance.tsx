import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowsClockwise,
  Plus,
  Receipt,
  Storefront,
  Wrench,
  ClipboardText,
  CalendarCheck,
  Eye,
  Copy,
  Archive,
  Trash,
  PencilSimple,
  EnvelopeSimple,
  UserPlus,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageHeader } from "@/components/keyhold/app-shell";
import { RailCard, StatusLabel } from "@/components/keyhold/status";
import { DataList } from "@/components/keyhold/data-list";
import { BillForm, BillSheet, RequestSheet, VendorForm, VendorSheet, WorkOrderSheet } from "@/components/keyhold/maintenance-panels";
import { longDate, tenantById, unitAddress } from "@/lib/mock-data";
import { usePermissions } from "@/lib/mock-access";
import { useMaintenance } from "@/lib/mock-maintenance";
import {
  billTotalCents,
  isDue,
  propertyName,
  REQUEST_RANK,
  URGENCY_RANK,
  CATEGORIES,
  CADENCE_MONTHS,
  type Cadence,
} from "@/lib/maintenance-engine";
import { money } from "@/lib/rent-engine";
import { Tag } from "@/components/keyhold/pipeline";
import { expiryStatus, vendorStats } from "@/lib/leasing-engine";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

export const Route = createFileRoute("/app/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance — Keyhold" },
      { name: "description", content: "Repair requests, work orders, vendors and bills — one chain from a tenant's report to an approved expense." },
      { property: "og:title", content: "Maintenance — Keyhold" },
      { property: "og:description", content: "Track repairs from reported to paid, with a full action log." },
    ],
  }),
  component: MaintenancePage,
});

type Tab = "requests" | "work-orders" | "vendors" | "bills" | "recurring";
const field = "mt-1 min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm";
const btnGhost = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft";
const btnPrimary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90";

function MaintenancePage() {
  const m = useMaintenance();
  const perms = usePermissions();
  const [tab, setTab] = useState<Tab>("requests");
  const money$ = perms.canSeeFinancials();

  const tabs: { id: Tab; label: string; Icon: typeof Wrench; count: number; gated?: boolean }[] = [
    { id: "requests", label: "Requests", Icon: ClipboardText, count: m.requests.filter((r) => r.status !== "resolved").length },
    { id: "work-orders", label: "Work orders", Icon: Wrench, count: m.workOrders.filter((w) => w.status !== "completed").length },
    { id: "vendors", label: "Vendors", Icon: Storefront, count: m.vendors.length },
    { id: "bills", label: "Bills", Icon: Receipt, count: m.bills.filter((b) => b.status === "awaiting-approval").length, gated: !money$ },
    { id: "recurring", label: "Recurring", Icon: ArrowsClockwise, count: m.rules.filter((r) => isDue(r, m.today)).length },
  ];

  return (
    <>
      <PageHeader title="Maintenance" subtitle="From a tenant's request to an approved bill — one chain, one history." />

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Maintenance sections">
        {tabs.filter((t) => !t.gated).map(({ id, label, Icon, count }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`min-h-11 rounded-full px-4 text-sm font-semibold ${
              tab === id ? "bg-navy text-primary-foreground" : "border border-border text-navy hover:bg-navy-soft"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <Icon weight="duotone" className="h-4 w-4" aria-hidden="true" />
              {label}
              {count > 0 && (
                <span className={`tnum rounded-full px-2 py-0.5 text-xs ${tab === id ? "bg-white/20" : "bg-navy-soft"}`}>{count}</span>
              )}
            </span>
          </button>
        ))}
      </div>

      {tab === "requests" && <RequestsTab />}
      {tab === "work-orders" && <WorkOrdersTab />}
      {tab === "vendors" && <VendorsTab />}
      {tab === "bills" && money$ && <BillsTab />}
      {tab === "recurring" && <RecurringTab />}
    </>
  );
}

/* ————————————————————————— requests ————————————————————————— */
function RequestsTab() {
  const m = useMaintenance();
  const perms = usePermissions();
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      m.requests
        .filter((r) => perms.canSee(r.propertyId))
        .sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || REQUEST_RANK[a.status] - REQUEST_RANK[b.status]),
    [m.requests, perms.canSee, perms.properties],
  );

  const current = m.requests.find((r) => r.id === openId) ?? null;

  return (
    <>
      <DataList
        name="Repair requests"
        items={visible}
        getId={(r) => r.id}
        getStatus={(r) => r.status}
        searchPlaceholder="Search repair, home or tenant"
        dateOf={(r) => r.openedOn}
        columns={[
          {
            key: "repair",
            label: "Repair",
            locked: true,
            value: (r) => `${r.subcategory} ${r.description}`,
            render: (r) => (
              <div className="min-w-0">
                <p className="font-display font-bold text-navy">{r.subcategory}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{r.description}</p>
              </div>
            ),
          },
          { key: "home", label: "Home", value: (r) => unitAddress(r.unitId) },
          { key: "tenant", label: "Tenant", value: (r) => tenantById(r.tenantId)?.name ?? "Routine work" },
          { key: "urgency", label: "Urgency", sortable: false, value: (r) => r.urgency, render: (r) => <StatusLabel status={r.urgency} /> },
          { key: "status", label: "Status", sortable: false, value: (r) => r.status, render: (r) => <StatusLabel status={r.status} /> },
          { key: "opened", label: "Reported", value: (r) => r.openedOn, render: (r) => <span className="tnum">{longDate(r.openedOn)}</span> },
          { key: "log", label: "Log", align: "right", defaultHidden: true, value: (r) => r.log.length },
        ]}
        filters={[
          {
            key: "state",
            label: "Status",
            options: [
              { value: "open", label: "Still to do" },
              { value: "resolved", label: "Finished" },
            ],
            match: (r, v) => (v === "resolved" ? r.status === "resolved" : r.status !== "resolved"),
          },
          {
            key: "urgency",
            label: "Urgency",
            options: [
              { value: "emergency", label: "Emergency" },
              { value: "urgent", label: "Urgent" },
              { value: "normal", label: "Normal" },
            ],
            match: (r, v) => r.urgency === v,
          },
          {
            key: "property",
            label: "Property",
            options: perms.properties.map((pr) => ({ value: pr.id, label: pr.name })),
            match: (r, v) => r.propertyId === v,
          },
        ]}
        emptyIcon={ClipboardText}
        emptyTitle="Nothing here right now"
        emptyBody="When a tenant reports a repair, it lands here and the assigned manager is notified straight away."
        rowActions={[
          { key: "view", label: "View request", Icon: Eye, onSelect: (r) => setOpenId(r.id) },
          { key: "assign", label: "Assign manager", Icon: UserPlus },
          { key: "wo", label: "Create work order", Icon: Wrench, onSelect: (r) => setOpenId(r.id) },
          { key: "archive", label: "Archive", Icon: Archive },
          {
            key: "delete",
            label: "Delete request",
            Icon: Trash,
            destructive: true,
            confirm: (r) => `Deleting removes "${r.subcategory}" and its ${r.log.length} log entries. That history can't be recovered as evidence later.`,
          },
        ]}
        bulkActions={[
          { key: "email", label: "Email tenants", Icon: EnvelopeSimple },
          { key: "assign", label: "Assign manager", Icon: UserPlus },
          { key: "resolve", label: "Mark resolved", Icon: CalendarCheck },
          {
            key: "delete",
            label: "Delete requests",
            Icon: Trash,
            destructive: true,
            confirm: (sel) => `${sel.length} requests and their full action logs will be deleted.`,
          },
        ]}
        quickView={(r) => ({
          title: r.subcategory,
          subtitle: `${unitAddress(r.unitId)} · ${tenantById(r.tenantId)?.name ?? "Routine work"}`,
          status: r.status,
          fields: [
            { label: "Urgency", value: <StatusLabel status={r.urgency} /> },
            { label: "Category", value: r.category },
            { label: "Reported", value: longDate(r.openedOn) },
            { label: "Log entries", value: String(r.log.length) },
            { label: "Description", value: r.description },
          ],
          actions: (
            <button type="button" onClick={() => setOpenId(r.id)} className={btnPrimary}>
              Open full request
            </button>
          ),
        })}
      />
      {current && <RequestSheet request={current} onClose={() => setOpenId(null)} />}
    </>
  );
}

/* ————————————————————————— work orders ————————————————————————— */
function WorkOrdersTab() {
  const m = useMaintenance();
  const perms = usePermissions();
  const [openId, setOpenId] = useState<string | null>(null);
  const shown = useMemo(() => m.workOrders.filter((w) => perms.canSee(w.propertyId)), [m.workOrders, perms]);
  const current = m.workOrders.find((w) => w.id === openId) ?? null;

  return (
    <>
      <DataList
        name="Work orders"
        items={shown}
        getId={(w) => w.id}
        getStatus={(w) => w.status}
        searchPlaceholder="Search work order, home or vendor"
        dateOf={(w) => w.scheduledFor ?? w.createdOn}
        columns={[
          {
            key: "title",
            label: "Work order",
            locked: true,
            value: (w) => `${w.id} ${w.title}`,
            render: (w) => (
              <div className="min-w-0">
                <p className="font-display font-bold text-navy">{w.title}</p>
                <p className="tnum text-xs text-muted-foreground">{w.id}</p>
              </div>
            ),
          },
          { key: "home", label: "Home", value: (w) => unitAddress(w.unitId) },
          { key: "vendor", label: "Vendor", value: (w) => m.vendorById(w.vendorId)?.name ?? "No vendor yet" },
          { key: "status", label: "Status", sortable: false, value: (w) => w.status, render: (w) => <StatusLabel status={w.status} /> },
          {
            key: "when",
            label: "Scheduled",
            value: (w) => w.scheduledFor ?? w.createdOn,
            render: (w) => <span className="tnum">{w.scheduledFor ? longDate(w.scheduledFor) : `created ${longDate(w.createdOn)}`}</span>,
          },
        ]}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "open", label: "Open" },
              { value: "completed", label: "Completed" },
            ],
            match: (w, v) => (v === "completed" ? w.status === "completed" : w.status !== "completed"),
          },
          {
            key: "vendor",
            label: "Vendor",
            options: m.vendors.map((v) => ({ value: v.id, label: v.name })),
            match: (w, v) => w.vendorId === v,
          },
        ]}
        emptyIcon={Wrench}
        emptyTitle="No work orders yet"
        emptyBody="Open a request and create a work order — the description, photos, tenant details and access instructions carry over."
        rowActions={[
          { key: "view", label: "View work order", Icon: Eye, onSelect: (w) => setOpenId(w.id) },
          { key: "vendor", label: "Assign vendor", Icon: Storefront, onSelect: (w) => setOpenId(w.id) },
          { key: "duplicate", label: "Duplicate", Icon: Copy },
          { key: "archive", label: "Archive", Icon: Archive },
          {
            key: "delete",
            label: "Delete work order",
            Icon: Trash,
            destructive: true,
            confirm: (w) => `${w.id} will be deleted. Any bill created from it keeps its own record, but the job history disappears.`,
          },
        ]}
        bulkActions={[
          { key: "notify", label: "Notify vendors", Icon: EnvelopeSimple },
          { key: "complete", label: "Mark completed", Icon: CalendarCheck },
          {
            key: "delete",
            label: "Delete work orders",
            Icon: Trash,
            destructive: true,
            confirm: (sel) => `${sel.length} work orders will be deleted along with their scheduling history.`,
          },
        ]}
        quickView={(w) => ({
          title: w.title,
          subtitle: `${w.id} · ${unitAddress(w.unitId)}`,
          status: w.status,
          fields: [
            { label: "Vendor", value: m.vendorById(w.vendorId)?.name ?? "No vendor yet" },
            { label: "Created", value: longDate(w.createdOn) },
            { label: "Scheduled", value: w.scheduledFor ? longDate(w.scheduledFor) : "Not scheduled" },
          ],
          actions: (
            <button type="button" onClick={() => setOpenId(w.id)} className={btnPrimary}>
              Open full work order
            </button>
          ),
        })}
      />
      {current && <WorkOrderSheet workOrder={current} onClose={() => setOpenId(null)} />}
    </>
  );
}

/* ————————————————————————— vendors ————————————————————————— */
function VendorsTab() {
  const m = useMaintenance();
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const current = m.vendors.find((v) => v.id === openId) ?? null;

  return (
    <>
      {adding && (
        <div className="mb-4">
          <VendorForm onDone={() => setAdding(false)} />
        </div>
      )}
      <DataList
        name="Vendors"
        items={m.vendors}
        getId={(v) => v.id}
        getStatus={(v) => (v.preferred ? "approved" : "assigned")}
        searchPlaceholder="Search vendor, trade or contact"
        toolbarExtra={
          <button type="button" className={btnGhost} onClick={() => setAdding((v) => !v)}>
            <Plus weight="duotone" className="h-4 w-4" aria-hidden="true" /> Add vendor
          </button>
        }
        columns={[
          {
            key: "name",
            label: "Vendor",
            locked: true,
            value: (v) => v.name,
            render: (v) => <span className="font-display font-bold text-navy">{v.name}</span>,
          },
          { key: "trade", label: "Trade", value: (v) => v.trade },
          { key: "contact", label: "Contact", value: (v) => v.contactName || "No contact" },
          { key: "phone", label: "Phone", defaultHidden: true, value: (v) => v.phone ?? "—" },
          { key: "area", label: "Service area", defaultHidden: true, value: (v) => v.serviceArea || "—" },
          { key: "jobs", label: "Jobs", align: "right", value: (v) => vendorStats(v.id, m.workOrders, m.bills).jobs },
          { key: "open", label: "Open", align: "right", value: (v) => vendorStats(v.id, m.workOrders, m.bills).openJobs },
          {
            key: "spend",
            label: "Spend",
            align: "right",
            value: (v) => vendorStats(v.id, m.workOrders, m.bills).spendCents,
            render: (v) => <span className="money">{money(vendorStats(v.id, m.workOrders, m.bills).spendCents)}</span>,
          },
          {
            key: "insurance",
            label: "Insurance",
            value: (v) => expiryStatus(v.insuranceExpiry, TODAY_ISO)?.label ?? "Not on file",
            render: (v) => {
              const e = expiryStatus(v.insuranceExpiry, TODAY_ISO);
              return e ? <Tag tone={e.tone}>{e.label}</Tag> : <Tag tone="warning">Not on file</Tag>;
            },
          },
          {
            key: "preferred",
            label: "Standing",
            sortable: false,
            value: (v) => (v.preferred ? "Preferred" : "Approved"),
            render: (v) => <StatusLabel status={v.preferred ? "approved" : "assigned"} />,
          },
        ]}
        filters={[
          {
            key: "preferred",
            label: "Standing",
            options: [
              { value: "yes", label: "Preferred" },
              { value: "no", label: "Everyone else" },
            ],
            match: (v, val) => (val === "yes" ? !!v.preferred : !v.preferred),
          },
          {
            key: "insurance",
            label: "Insurance",
            options: [
              { value: "expiring", label: "Expiring or expired" },
              { value: "missing", label: "Not on file" },
            ],
            match: (v, val) => {
              const e = expiryStatus(v.insuranceExpiry, TODAY_ISO);
              return val === "missing" ? !e : !!e && (e.expired || e.expiringSoon);
            },
          },
          {
            key: "trade",
            label: "Trade",
            options: Array.from(new Set(m.vendors.map((v) => v.trade))).map((t) => ({ value: t, label: t })),
            match: (v, val) => v.trade === val,
          },
        ]}
        emptyIcon={Storefront}
        emptyTitle="No vendors yet"
        emptyBody="Add the trades you rely on and Keyhold tracks every job and bill against them."
        rowActions={[
          { key: "view", label: "View vendor", Icon: Eye, onSelect: (v) => setOpenId(v.id) },
          { key: "edit", label: "Edit details", Icon: PencilSimple, onSelect: (v) => setOpenId(v.id) },
          { key: "wo", label: "New work order", Icon: Wrench },
          { key: "archive", label: "Archive", Icon: Archive },
          {
            key: "delete",
            label: "Delete vendor",
            Icon: Trash,
            destructive: true,
            confirm: (v) => `${v.name} will be removed. Past work orders and bills stay, but they'll no longer show a vendor.`,
          },
        ]}
        bulkActions={[
          { key: "email", label: "Email vendors", Icon: EnvelopeSimple },
          {
            key: "delete",
            label: "Delete vendors",
            Icon: Trash,
            destructive: true,
            confirm: (sel) => `${sel.length} vendors will be removed from your list.`,
          },
        ]}
        quickView={(v) => ({
          title: v.name,
          subtitle: v.trade,
          status: v.preferred ? "approved" : "assigned",
          fields: [
            { label: "Contact", value: v.contactName || "No contact" },
            { label: "Phone", value: v.phone ?? "—" },
            { label: "Email", value: v.email ?? "—" },
            { label: "Jobs", value: String(m.historyForVendor(v.id).workOrders.length) },
            { label: "Bills", value: String(m.historyForVendor(v.id).bills.length) },
          ],
          actions: (
            <button type="button" onClick={() => setOpenId(v.id)} className={btnPrimary}>
              Open vendor record
            </button>
          ),
        })}
      />
      {current && <VendorSheet vendor={current} onClose={() => setOpenId(null)} />}
    </>
  );
}

/* ————————————————————————— bills ————————————————————————— */
function BillsTab() {
  const m = useMaintenance();
  const perms = usePermissions();
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const shown = useMemo(() => m.bills.filter((b) => perms.canSeeFinancials(b.propertyId)), [m.bills, perms]);
  const current = m.bills.find((b) => b.id === openId) ?? null;
  const awaiting = shown.filter((b) => b.status === "awaiting-approval");

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Waiting on approval" value={money(awaiting.reduce((s, b) => s + billTotalCents(b), 0))} status="awaiting-approval" />
        <SummaryCard label="Approved this month" value={money(shown.filter((b) => b.status === "approved").reduce((s, b) => s + billTotalCents(b), 0))} status="approved" />
        <SummaryCard label="Drafts" value={String(shown.filter((b) => b.status === "draft").length)} status="draft" />
      </div>

      {adding && (
        <div className="mb-4">
          <BillForm workOrder={null} onDone={() => setAdding(false)} />
        </div>
      )}

      <DataList
        name="Bills"
        items={shown}
        getId={(b) => b.id}
        getStatus={(b) => b.status}
        searchPlaceholder="Search bill, vendor or home"
        dateOf={(b) => b.dueDate}
        toolbarExtra={
          <button type="button" className={btnGhost} onClick={() => setAdding((v) => !v)}>
            <Plus weight="duotone" className="h-4 w-4" aria-hidden="true" /> New bill
          </button>
        }
        columns={[
          {
            key: "bill",
            label: "Bill",
            locked: true,
            value: (b) => b.id,
            render: (b) => (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display font-bold text-navy">{b.id}</span>
                {b.recurring && <span className="rounded-full bg-navy-soft px-2.5 py-1 text-xs font-semibold text-navy">Recurring</span>}
              </div>
            ),
          },
          { key: "vendor", label: "Vendor", value: (b) => m.vendorById(b.vendorId)?.name ?? "No vendor" },
          { key: "where", label: "Where", value: (b) => (b.unitId ? unitAddress(b.unitId) : propertyName(b.propertyId)) },
          { key: "due", label: "Due", value: (b) => b.dueDate, render: (b) => <span className="tnum">{longDate(b.dueDate)}</span> },
          { key: "status", label: "Status", sortable: false, value: (b) => b.status, render: (b) => <StatusLabel status={b.status} /> },
          {
            key: "total",
            label: "Total",
            align: "right",
            value: (b) => billTotalCents(b),
            render: (b) => <span className="money font-bold text-navy">{money(billTotalCents(b))}</span>,
          },
        ]}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "draft", label: "Draft" },
              { value: "awaiting-approval", label: "Awaiting approval" },
              { value: "approved", label: "Approved" },
            ],
            match: (b, v) => b.status === v,
          },
          {
            key: "recurring",
            label: "Recurring",
            options: [{ value: "yes", label: "Recurring only" }],
            match: (b) => !!b.recurring,
          },
        ]}
        emptyIcon={Receipt}
        emptyTitle="No bills yet"
        emptyBody="Complete a work order and bill it — the property, unit and vendor come across automatically."
        rowActions={[
          { key: "view", label: "View bill", Icon: Eye, onSelect: (b) => setOpenId(b.id) },
          { key: "approve", label: "Send for approval", Icon: CalendarCheck, onSelect: (b) => setOpenId(b.id) },
          { key: "duplicate", label: "Duplicate for next month", Icon: Copy },
          { key: "archive", label: "Archive", Icon: Archive },
          {
            key: "delete",
            label: "Delete bill",
            Icon: Trash,
            destructive: true,
            confirm: (b) => `${b.id} for ${money(billTotalCents(b))} will be deleted, including its line items and attachments.`,
          },
        ]}
        bulkActions={[
          { key: "approve", label: "Send for approval", Icon: CalendarCheck },
          { key: "email", label: "Email vendors", Icon: EnvelopeSimple },
          {
            key: "delete",
            label: "Delete bills",
            Icon: Trash,
            destructive: true,
            confirm: (sel) => `${sel.length} bills will be deleted along with their attachments.`,
          },
        ]}
        quickView={(b) => ({
          title: b.id,
          subtitle: `${m.vendorById(b.vendorId)?.name ?? "No vendor"} · ${b.unitId ? unitAddress(b.unitId) : propertyName(b.propertyId)}`,
          status: b.status,
          fields: [
            { label: "Total", value: <span className="money">{money(billTotalCents(b))}</span> },
            { label: "Due", value: longDate(b.dueDate) },
            { label: "Line items", value: String(b.lines.length) },
            { label: "Recurring", value: b.recurring ? "Yes" : "No" },
          ],
          actions: (
            <button type="button" onClick={() => setOpenId(b.id)} className={btnPrimary}>
              Open full bill
            </button>
          ),
        })}
      />
      {current && <BillSheet bill={current} onClose={() => setOpenId(null)} />}
    </>
  );
}

function SummaryCard({ label, value, status }: { label: string; value: string; status: "awaiting-approval" | "approved" | "draft" }) {
  return (
    <RailCard status={status} className="p-4">
      <StatusLabel status={status} />
      <p className="money mt-2 text-2xl font-extrabold text-navy">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </RailCard>
  );
}

/* ————————————————————————— recurring ————————————————————————— */
function RecurringTab() {
  const m = useMaintenance();
  const perms = usePermissions();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: CATEGORIES[0]!.name,
    subcategory: CATEGORIES[0]!.subs[0]!,
    propertyId: perms.properties[0]?.id ?? "",
    vendorId: "",
    cadence: "annual" as Cadence,
    nextDue: "",
    notes: "",
  });
  const subs = CATEGORIES.find((c) => c.name === form.category)?.subs ?? [];

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        Seasonal and routine work. When one is due, run it and Keyhold opens a real request — assigned, logged and ready to become a work order.
      </p>
      <div className="mb-4">
        <button type="button" className={btnPrimary} onClick={() => setAdding((v) => !v)}>
          <Plus weight="duotone" className="h-4 w-4" aria-hidden="true" /> Add routine job
        </button>
      </div>

      {adding && (
        <form
          className="mb-4 space-y-3 rounded-2xl border border-border bg-surface-sunk p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title.trim() || !form.nextDue) {
              toast.error("Give it a name and a first due date.");
              return;
            }
            m.addRule({
              title: form.title.trim(),
              category: form.category,
              subcategory: form.subcategory,
              propertyId: form.propertyId,
              unitId: null,
              vendorId: form.vendorId || null,
              cadence: form.cadence,
              nextDue: form.nextDue,
              notes: form.notes,
            });
            toast.success(`"${form.title}" added to your routine work.`);
            setAdding(false);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="rr-title" className="text-sm font-medium">What is it?</label>
              <input id="rr-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Furnace check before heating season" className={field} />
            </div>
            <div>
              <label htmlFor="rr-cat" className="text-sm font-medium">Category</label>
              <select
                id="rr-cat"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value, subcategory: CATEGORIES.find((c) => c.name === e.target.value)!.subs[0]! })}
                className={field}
              >
                {CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="rr-sub" className="text-sm font-medium">Type</label>
              <select id="rr-sub" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} className={field}>
                {subs.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="rr-prop" className="text-sm font-medium">Property</label>
              <select id="rr-prop" value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })} className={field}>
                {perms.properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="rr-vendor" className="text-sm font-medium">Usual vendor</label>
              <select id="rr-vendor" value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} className={field}>
                <option value="">Decide each time</option>
                {m.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="rr-cad" className="text-sm font-medium">How often</label>
              <select id="rr-cad" value={form.cadence} onChange={(e) => setForm({ ...form, cadence: e.target.value as Cadence })} className={field}>
                {(Object.keys(CADENCE_MONTHS) as Cadence[]).map((c) => <option key={c} value={c}>{c.replace("-", " ")}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="rr-due" className="text-sm font-medium">First due</label>
              <input id="rr-due" type="date" value={form.nextDue} onChange={(e) => setForm({ ...form, nextDue: e.target.value })} className={field} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="rr-notes" className="text-sm font-medium">Notes</label>
              <input id="rr-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={field} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={btnPrimary}>Save routine job</button>
            <button type="button" className={btnGhost} onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </form>
      )}

      <ul className="space-y-3">
        {m.rules.map((r) => {
          const due = isDue(r, m.today);
          return (
            <RailCard as="li" key={r.id} status={!r.active ? "cancelled" : due ? "urgent" : "scheduled"} className="p-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusLabel status={!r.active ? "cancelled" : due ? "urgent" : "scheduled"} />
                    <p className="font-display font-bold text-navy">{r.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {propertyName(r.propertyId)} · {r.cadence.replace("-", " ")} · {m.vendorById(r.vendorId)?.name ?? "No usual vendor"}
                  </p>
                  <p className="tnum mt-1 inline-flex items-center gap-1.5 text-sm">
                    <CalendarCheck weight="duotone" className="h-4 w-4 text-action" aria-hidden="true" />
                    {due ? "Due now" : `Next ${longDate(r.nextDue)}`}
                    {r.lastRun ? ` · last done ${longDate(r.lastRun)}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() => {
                      const made = m.runRule(r.id, perms.user.name);
                      if (!made) {
                        toast.error("No unit found for that property.");
                        return;
                      }
                      toast.success(`Request opened and ${made.manager.name} notified by ${made.channel}.`);
                    }}
                  >
                    <ArrowsClockwise weight="duotone" className="h-4 w-4" aria-hidden="true" /> Run now
                  </button>
                  <button type="button" className={btnGhost} onClick={() => m.toggleRule(r.id)}>
                    {r.active ? "Pause" : "Resume"}
                  </button>
                </div>
              </div>
            </RailCard>
          );
        })}
      </ul>
    </>
  );
}
