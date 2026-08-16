/**
 * Maintenance side panels: request detail (with the full action log),
 * work-order creation, vendor records and bills with a second-person approval.
 * Every total comes from maintenance-engine.ts — nothing is computed inline.
 */
import { useState } from "react";
import {
  Camera,
  ChatCircleDots,
  ClipboardText,
  CopySimple,
  Envelope,
  Key,
  Paperclip,
  Plus,
  Receipt,
  SealCheck,
  Trash,
  UserCircle,
  Wrench,
  DeviceMobile,
  XCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Sheet } from "@/components/keyhold/rent-panels";
import { Tag } from "@/components/keyhold/pipeline";
import { expiryStatus, vendorStats } from "@/lib/leasing-engine";
import { StatusLabel } from "@/components/keyhold/status";
import { longDate, tenantById, unitAddress } from "@/lib/mock-data";
import { usePermissions } from "@/lib/mock-access";
import { ActivityFeed } from "./activity-feed";
import { useMaintenance } from "@/lib/mock-maintenance";
import {
  billSubtotalCents,
  billTaxCents,
  billTotalCents,
  canApprove,
  TRADES,
  type Bill,
  type BillLine,
  type MaintenanceRequest,
  type Vendor,
  type WorkOrder,
} from "@/lib/maintenance-engine";
import { money, parseAmountToCents } from "@/lib/rent-engine";

const field = "mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm";
const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold";
const btnGhost = `${btn} border border-border text-navy hover:bg-navy-soft`;
const btnPrimary = `${btn} bg-action text-primary-foreground hover:bg-action/90`;

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border/70 py-2 last:border-0 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-navy">{children}</dd>
    </div>
  );
}

function LogTimeline({ log }: { log: { id: string; at: string; actor: string; kind: string; text: string }[] }) {
  return (
    <ol className="space-y-3">
      {log.map((e) => (
        <li key={e.id} className="relative border-l-2 border-navy/15 pl-4">
          <span aria-hidden="true" className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-navy" />
          <p className="text-sm text-navy">{e.text}</p>
          <p className="tnum mt-0.5 text-xs text-muted-foreground">
            {longDate(e.at)} · {e.actor} · {e.kind.replace("-", " ")}
          </p>
        </li>
      ))}
    </ol>
  );
}

/* ————————————————————————— request ————————————————————————— */
export function RequestSheet({ request, onClose }: { request: MaintenanceRequest; onClose: () => void }) {
  const m = useMaintenance();
  const perms = usePermissions();
  const live = m.requestById(request.id) ?? request;
  const [message, setMessage] = useState("");
  const [makeWo, setMakeWo] = useState(false);

  const tenant = tenantById(live.tenantId);
  const linkedWos = m.workOrders.filter((w) => w.requestId === live.id);

  return (
    <Sheet title="Repair request" onClose={onClose}>
      <header className="flex flex-wrap items-center gap-2">
        <StatusLabel status={live.status} />
        <StatusLabel status={live.urgency} />
        <span className="rounded-full bg-navy-soft px-2.5 py-1 text-xs font-semibold text-navy">
          {live.source === "tenant" ? "From tenant" : live.source === "recurring" ? "Routine work" : "Added by manager"}
        </span>
      </header>

      <div>
        <h3 className="font-display text-lg font-bold text-navy">
          {live.category} · {live.subcategory}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{unitAddress(live.unitId)}</p>
        <p className="mt-3 text-sm">{live.description}</p>
      </div>

      <dl>
        <Row label="Tenant">{tenant ? `${tenant.name} · ${tenant.phone}` : "No tenant (routine work)"}</Row>
        <Row label="Reported">{longDate(live.openedOn)}</Row>
        <Row label="Preferred time">{live.preferredTime}</Row>
        <Row label="Permission to enter">
          {live.permissionToEnter ? "Yes — may enter when nobody is home" : "No — tenant wants to be home"}
        </Row>
        <Row label="Access notes">
          <span className="inline-flex items-start gap-1.5">
            <Key weight="duotone" className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden="true" />
            {live.accessInstructions || "None given"}
          </span>
        </Row>
        <Row label="Photos">
          {live.photos.length === 0 ? (
            "None"
          ) : (
            <span className="flex flex-wrap gap-2">
              {live.photos.map((p) => (
                <span key={p} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-sunk px-2 py-1 text-xs">
                  <Camera weight="duotone" className="h-4 w-4 text-action" aria-hidden="true" />
                  {p}
                </span>
              ))}
            </span>
          )}
        </Row>
        <Row label="Assigned to">{perms.users.find((u) => u.id === live.assigneeId)?.name ?? "Nobody yet"}</Row>
      </dl>

      <div className="flex flex-wrap gap-2">
        {live.status !== "resolved" && (
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              m.setRequestStatus(live.id, "resolved", perms.user.name);
              toast.success("Marked resolved. The tenant can see the update.");
            }}
          >
            Mark resolved
          </button>
        )}
        {live.status === "resolved" && (
          <button type="button" className={btnGhost} onClick={() => m.setRequestStatus(live.id, "in-progress", perms.user.name)}>
            Reopen
          </button>
        )}
        <button type="button" className={btnPrimary} onClick={() => setMakeWo((v) => !v)}>
          <Wrench weight="duotone" className="h-4 w-4" aria-hidden="true" /> Create work order
        </button>
      </div>

      <div>
        <label htmlFor="assign" className="text-sm font-medium">Reassign</label>
        <select
          id="assign"
          className={field}
          value={live.assigneeId ?? ""}
          onChange={(e) => {
            const u = perms.users.find((x) => x.id === e.target.value);
            if (u) m.assignRequest(live.id, u.id, u.name, perms.user.name);
          }}
        >
          {perms.users
            .filter((u) => u.accountType !== "tenant")
            .map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
        </select>
      </div>

      {makeWo && <WorkOrderForm request={live} onDone={() => setMakeWo(false)} />}

      {linkedWos.length > 0 && (
        <section>
          <h4 className="font-display text-sm font-bold text-navy">Work orders</h4>
          <ul className="mt-2 space-y-2">
            {linkedWos.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3 text-sm">
                <StatusLabel status={w.status} />
                <span className="font-semibold text-navy">{w.id}</span>
                <span className="text-muted-foreground">{m.vendorById(w.vendorId)?.name ?? "No vendor yet"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h4 className="inline-flex items-center gap-2 font-display text-sm font-bold text-navy">
          <ClipboardText weight="duotone" className="h-4 w-4 text-action" aria-hidden="true" /> Action log
        </h4>
        <p className="mb-3 text-xs text-muted-foreground">Every message, assignment and status change, kept for evidence.</p>
        <LogTimeline log={live.log} />
      </section>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!message.trim()) return;
          m.addMessage(live.id, perms.user.name, message.trim());
          setMessage("");
          toast.success("Message added to the log.");
        }}
      >
        <label htmlFor="note" className="sr-only">Add a note or message</label>
        <input
          id="note"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a note or message"
          className="min-h-11 flex-1 rounded-full border border-input bg-background px-4 text-sm"
        />
        <button type="submit" className={`${btn} bg-navy text-primary-foreground`}>
          <ChatCircleDots weight="duotone" className="h-4 w-4" aria-hidden="true" /> Add
        </button>
      </form>
      <ActivityFeed entityType="maintenance" entityId={live.id} title="Request activity" />
    </Sheet>
  );
}

/* ————————————————————— work order creation ————————————————————— */
function WorkOrderForm({ request, onDone }: { request: MaintenanceRequest; onDone: () => void }) {
  const m = useMaintenance();
  const perms = usePermissions();
  const [vendorId, setVendorId] = useState(m.vendors[0]?.id ?? "");
  const [scheduledFor, setScheduledFor] = useState("");
  const [scope, setScope] = useState(request.description);
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(request.urgency === "emergency" || request.urgency === "urgent");

  return (
    <form
      className="space-y-4 rounded-2xl border border-border bg-surface-sunk p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const wo = m.createWorkOrder({
          requestId: request.id,
          vendorId: vendorId || null,
          scheduledFor: scheduledFor || null,
          notifyEmail: email,
          notifySms: sms,
          actor: perms.user.name,
          scopeOverride: scope,
        });
        if (!wo) return;
        const vendor = m.vendorById(vendorId);
        toast.success(`${wo.id} created. ${vendor?.name ?? "Vendor"} notified by ${[email && "email", sms && "SMS"].filter(Boolean).join(" and ") || "no channel"}.`);
        onDone();
      }}
    >
      <p className="text-sm font-semibold text-navy">New work order</p>
      <p className="text-xs text-muted-foreground">
        Description, photos, tenant details and access instructions carry over — nothing to re-type.
      </p>
      <div>
        <label htmlFor="wo-vendor" className="text-sm font-medium">Vendor</label>
        <select id="wo-vendor" className={field} value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
          <option value="">Decide later</option>
          {m.vendors.map((v) => (
            <option key={v.id} value={v.id}>{v.name} — {v.trade}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="wo-scope" className="text-sm font-medium">Scope of work</label>
        <textarea id="wo-scope" rows={3} value={scope} onChange={(e) => setScope(e.target.value)} className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm" />
      </div>
      <div>
        <label htmlFor="wo-date" className="text-sm font-medium">Scheduled for (optional)</label>
        <input id="wo-date" type="date" className={field} value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
      </div>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="text-sm font-medium">Notify the vendor by</legend>
        <label className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm">
          <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} className="h-4 w-4 accent-[var(--action)]" />
          <Envelope weight="duotone" className="h-4 w-4" aria-hidden="true" /> Email
        </label>
        <label className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm">
          <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} className="h-4 w-4 accent-[var(--action)]" />
          <DeviceMobile weight="duotone" className="h-4 w-4" aria-hidden="true" /> SMS
        </label>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={btnPrimary}>Create & notify</button>
        <button type="button" className={btnGhost} onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}

/* ————————————————————————— work order ————————————————————————— */
export function WorkOrderSheet({ workOrder, onClose }: { workOrder: WorkOrder; onClose: () => void }) {
  const m = useMaintenance();
  const perms = usePermissions();
  const live = m.workOrderById(workOrder.id) ?? workOrder;
  const [note, setNote] = useState("");
  const [billing, setBilling] = useState(false);
  const vendor = m.vendorById(live.vendorId);
  const bills = m.bills.filter((b) => b.workOrderId === live.id);

  return (
    <Sheet title={`Work order ${live.id}`} onClose={onClose}>
      <header className="flex flex-wrap items-center gap-2">
        <StatusLabel status={live.status} />
        {live.scheduledFor && <span className="tnum rounded-full bg-navy-soft px-2.5 py-1 text-xs font-semibold text-navy">{longDate(live.scheduledFor)}</span>}
      </header>

      <div>
        <h3 className="font-display text-lg font-bold text-navy">{live.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{unitAddress(live.unitId)}</p>
        <p className="mt-3 text-sm">{live.scope}</p>
      </div>

      <dl>
        <Row label="Vendor">{vendor ? `${vendor.name} · ${vendor.contactName} · ${vendor.phone}` : "Not assigned"}</Row>
        <Row label="Tenant">{tenantById(live.tenantId)?.name ?? "No tenant"}</Row>
        <Row label="Access">
          <span className="inline-flex items-start gap-1.5">
            <Key weight="duotone" className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden="true" />
            {live.accessInstructions}
          </span>
        </Row>
        <Row label="Photos">{live.photos.length ? live.photos.join(", ") : "None"}</Row>
        <Row label="Created">{longDate(live.createdOn)}</Row>
        {live.completedOn && <Row label="Completed">{longDate(live.completedOn)}</Row>}
      </dl>

      {live.status !== "completed" && (
        <div className="space-y-3 rounded-2xl border border-border bg-surface-sunk p-4">
          <label htmlFor="wo-note" className="text-sm font-medium">Completion note</label>
          <input id="wo-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was done" className={field} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnPrimary}
              onClick={() => {
                m.setWorkOrderStatus(live.id, "completed", perms.user.name, note);
                toast.success(`${live.id} completed. You can bill it now.`);
              }}
            >
              Mark completed
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                const { vendor: v, channels } = m.notifyVendor(live.id, perms.user.name);
                toast.success(`${v?.name ?? "Vendor"} notified again by ${channels}.`);
              }}
            >
              <Envelope weight="duotone" className="h-4 w-4" aria-hidden="true" /> Notify vendor again
            </button>
          </div>
        </div>
      )}

      {live.status === "completed" && perms.canSeeFinancials(live.propertyId) && (
        <button type="button" className={btnPrimary} onClick={() => setBilling((v) => !v)}>
          <Receipt weight="duotone" className="h-4 w-4" aria-hidden="true" /> Create bill from this work order
        </button>
      )}

      {billing && <BillForm workOrder={live} onDone={() => setBilling(false)} />}

      {bills.length > 0 && (
        <section>
          <h4 className="font-display text-sm font-bold text-navy">Bills</h4>
          <ul className="mt-2 space-y-2">
            {bills.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3 text-sm">
                <StatusLabel status={b.status} />
                <span className="font-semibold text-navy">{b.id}</span>
                <span className="money ml-auto font-extrabold text-navy">{money(billTotalCents(b))}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h4 className="inline-flex items-center gap-2 font-display text-sm font-bold text-navy">
          <ClipboardText weight="duotone" className="h-4 w-4 text-action" aria-hidden="true" /> Action log
        </h4>
        <div className="mt-3">
          <LogTimeline log={live.log} />
        </div>
      </section>
    </Sheet>
  );
}

/* ————————————————————————— bill form ————————————————————————— */
export function BillForm({ workOrder, onDone }: { workOrder: WorkOrder | null; onDone: () => void }) {
  const m = useMaintenance();
  const perms = usePermissions();
  const [lines, setLines] = useState<{ id: string; description: string; amount: string }[]>([
    { id: "l1", description: "Labour", amount: "" },
  ]);
  const [taxRate, setTaxRate] = useState("13");
  const [reference, setReference] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [propertyId, setPropertyId] = useState(workOrder?.propertyId ?? perms.properties[0]?.id ?? "");
  const [vendorId, setVendorId] = useState(workOrder?.vendorId ?? "");
  const [recurring, setRecurring] = useState(false);

  const parsed: BillLine[] = lines
    .filter((l) => l.description.trim() && parseAmountToCents(l.amount) !== null)
    .map((l) => ({ id: l.id, description: l.description.trim(), amountCents: parseAmountToCents(l.amount)! }));
  const rate = Number(taxRate) || 0;
  const subtotal = billSubtotalCents(parsed);
  const tax = billTaxCents(parsed, rate);

  const submit = (send: boolean) => {
    if (parsed.length === 0) {
      toast.error("Add at least one line item with an amount.");
      return;
    }
    const bill = m.createBill({
      workOrderId: workOrder?.id ?? null,
      propertyId,
      unitId: workOrder?.unitId ?? null,
      vendorId: vendorId || null,
      reference: reference.trim() || "—",
      dueDate: dueDate || m.today,
      lines: parsed,
      taxRatePct: rate,
      attachments,
      submit: send,
      actor: perms.user.name,
      actorId: perms.user.id,
      recurring,
    });
    toast.success(send ? `${bill.id} submitted for approval.` : `${bill.id} saved as a draft.`);
    onDone();
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface-sunk p-4">
      <p className="text-sm font-semibold text-navy">New bill</p>
      <p className="text-xs text-muted-foreground">
        Pre-associated with {workOrder ? unitAddress(workOrder.unitId) : "the property you choose"}.
      </p>

      {!workOrder && (
        <div>
          <label htmlFor="b-prop" className="text-sm font-medium">Property</label>
          <select id="b-prop" className={field} value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            {perms.properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="b-vendor" className="text-sm font-medium">Vendor</label>
        <select id="b-vendor" className={field} value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
          <option value="">No vendor</option>
          {m.vendors.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Line items</legend>
        {lines.map((l, i) => (
          <div key={l.id} className="flex gap-2">
            <label className="sr-only" htmlFor={`ld-${l.id}`}>Description</label>
            <input
              id={`ld-${l.id}`}
              value={l.description}
              placeholder="What it was for"
              onChange={(e) => setLines((prev) => prev.map((x) => (x.id === l.id ? { ...x, description: e.target.value } : x)))}
              className="min-h-11 flex-1 rounded-xl border border-input bg-background px-3 text-sm"
            />
            <label className="sr-only" htmlFor={`la-${l.id}`}>Amount</label>
            <input
              id={`la-${l.id}`}
              inputMode="decimal"
              value={l.amount}
              placeholder="0.00"
              onChange={(e) => setLines((prev) => prev.map((x) => (x.id === l.id ? { ...x, amount: e.target.value } : x)))}
              className="tnum min-h-11 w-28 rounded-xl border border-input bg-background px-3 text-sm"
            />
            {lines.length > 1 && (
              <button
                type="button"
                aria-label={`Remove line ${i + 1}`}
                onClick={() => setLines((prev) => prev.filter((x) => x.id !== l.id))}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border text-navy hover:bg-navy-soft"
              >
                <Trash weight="duotone" className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className={btnGhost}
          onClick={() => setLines((prev) => [...prev, { id: `l${prev.length + 1}-${Math.random().toString(36).slice(2, 6)}`, description: "", amount: "" }])}
        >
          <Plus weight="duotone" className="h-4 w-4" aria-hidden="true" /> Add line
        </button>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="b-tax" className="text-sm font-medium">Tax rate (%)</label>
          <input id="b-tax" inputMode="decimal" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={`${field} tnum`} />
        </div>
        <div>
          <label htmlFor="b-due" className="text-sm font-medium">Due date</label>
          <input id="b-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="b-ref" className="text-sm font-medium">Vendor invoice number</label>
          <input id="b-ref" value={reference} onChange={(e) => setReference(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="b-files" className="text-sm font-medium">Receipt or photo</label>
          <input
            id="b-files"
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={(e) => setAttachments(Array.from(e.target.files ?? []).map((f) => f.name))}
            className="mt-1 block w-full text-sm file:mr-3 file:min-h-11 file:rounded-full file:border-0 file:bg-navy-soft file:px-4 file:text-sm file:font-semibold file:text-navy"
          />
        </div>
      </div>
      {attachments.length > 0 && (
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Paperclip weight="duotone" className="h-4 w-4" aria-hidden="true" /> {attachments.join(", ")}
        </p>
      )}

      <label className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-card px-3 text-sm">
        <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="h-4 w-4 accent-[var(--action)]" />
        This is a recurring monthly expense
      </label>

      <dl className="tnum rounded-xl bg-card p-3 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="money font-semibold">{money(subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Tax ({rate}%)</dt><dd className="money font-semibold">{money(tax)}</dd></div>
        <div className="mt-2 flex justify-between border-t border-border pt-2"><dt className="font-semibold text-navy">Total</dt><dd className="money text-lg font-extrabold text-navy">{money(subtotal + tax)}</dd></div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={() => submit(true)}>Submit for approval</button>
        <button type="button" className={btnGhost} onClick={() => submit(false)}>Save as draft</button>
        <button type="button" className={btnGhost} onClick={onDone}>Cancel</button>
      </div>
    </div>
  );
}

/* ————————————————————————— bill detail ————————————————————————— */
export function BillSheet({ bill, onClose }: { bill: Bill; onClose: () => void }) {
  const m = useMaintenance();
  const perms = usePermissions();
  const live = m.billById(bill.id) ?? bill;
  const [note, setNote] = useState("");
  const vendor = m.vendorById(live.vendorId);
  const approvable = canApprove(live, perms.user.id, perms.isOwner);
  const submitter = perms.users.find((u) => u.id === live.submittedById);

  return (
    <Sheet title={`Bill ${live.id}`} onClose={onClose}>
      <header className="flex flex-wrap items-center gap-2">
        <StatusLabel status={live.status} />
        {live.recurring && <span className="rounded-full bg-navy-soft px-2.5 py-1 text-xs font-semibold text-navy">Recurring</span>}
      </header>

      <p className="money text-4xl font-extrabold text-navy">{money(billTotalCents(live))}</p>

      <dl>
        <Row label="Vendor">{vendor?.name ?? "No vendor"}</Row>
        <Row label="Property">{live.unitId ? unitAddress(live.unitId) : perms.properties.find((p) => p.id === live.propertyId)?.name ?? "—"}</Row>
        <Row label="Work order">{live.workOrderId ?? "Not linked"}</Row>
        <Row label="Invoice no.">{live.reference}</Row>
        <Row label="Issued">{longDate(live.issuedOn)}</Row>
        <Row label="Due">{longDate(live.dueDate)}</Row>
        <Row label="Submitted by">{submitter?.name ?? "Not submitted yet"}</Row>
        {live.decidedOn && (
          <Row label={live.status === "approved" ? "Approved by" : "Rejected by"}>
            {perms.users.find((u) => u.id === live.approvedById)?.name} · {longDate(live.decidedOn)}
            {live.decisionNote ? ` · ${live.decisionNote}` : ""}
          </Row>
        )}
      </dl>

      <section>
        <h4 className="font-display text-sm font-bold text-navy">Line items</h4>
        <ul className="tnum mt-2 space-y-1 text-sm">
          {live.lines.map((l) => (
            <li key={l.id} className="flex justify-between gap-3 border-b border-border/70 py-2">
              <span>{l.description}</span>
              <span className="money font-semibold">{money(l.amountCents)}</span>
            </li>
          ))}
        </ul>
        <dl className="tnum mt-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="money">{money(billSubtotalCents(live.lines))}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Tax ({live.taxRatePct}%)</dt><dd className="money">{money(billTaxCents(live.lines, live.taxRatePct))}</dd></div>
          <div className="mt-1 flex justify-between border-t border-border pt-1"><dt className="font-semibold text-navy">Total</dt><dd className="money font-extrabold text-navy">{money(billTotalCents(live))}</dd></div>
        </dl>
      </section>

      {live.attachments.length > 0 && (
        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Paperclip weight="duotone" className="h-4 w-4" aria-hidden="true" /> {live.attachments.join(", ")}
        </p>
      )}

      {live.status === "draft" && (
        <button
          type="button"
          className={btnPrimary}
          onClick={() => {
            m.submitBill(live.id, perms.user.id, perms.user.name);
            toast.success("Sent for approval.");
          }}
        >
          Submit for approval
        </button>
      )}

      {live.status === "awaiting-approval" && (
        <div className="space-y-3 rounded-2xl border border-border bg-surface-sunk p-4">
          <p className="text-sm font-semibold text-navy">Approval</p>
          <p className="text-xs text-muted-foreground">
            A second person must approve before this is payable. {submitter?.name ?? "The submitter"} can't approve their own bill.
          </p>
          <label htmlFor="dec-note" className="text-sm font-medium">Note (optional)</label>
          <input id="dec-note" value={note} onChange={(e) => setNote(e.target.value)} className={field} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!approvable}
              className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={() => {
                m.decideBill(live.id, "approved", perms.user.id, perms.user.name, note);
                toast.success(`${live.id} approved — now payable.`);
              }}
            >
              <SealCheck weight="duotone" className="h-4 w-4" aria-hidden="true" /> Approve
            </button>
            <button
              type="button"
              disabled={!approvable}
              className={`${btnGhost} disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={() => {
                m.decideBill(live.id, "rejected", perms.user.id, perms.user.name, note);
                toast.success(`${live.id} rejected.`);
              }}
            >
              <XCircle weight="duotone" className="h-4 w-4" aria-hidden="true" /> Reject
            </button>
          </div>
          {!approvable && (
            <p className="text-xs text-warning">
              {live.submittedById === perms.user.id
                ? "You submitted this bill, so someone else has to approve it."
                : "Only the account owner can approve bills."}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        className={btnGhost}
        onClick={() => {
          const copy = m.duplicateBill(live.id, perms.user.name);
          if (copy) toast.success(`${copy.id} created as a draft for next month.`);
        }}
      >
        <CopySimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> Duplicate for next month
      </button>

      <section>
        <h4 className="inline-flex items-center gap-2 font-display text-sm font-bold text-navy">
          <ClipboardText weight="duotone" className="h-4 w-4 text-action" aria-hidden="true" /> Action log
        </h4>
        <div className="mt-3">
          <LogTimeline log={live.log} />
        </div>
      </section>
    </Sheet>
  );
}

/* ————————————————————————— vendors ————————————————————————— */
export function VendorSheet({ vendor, onClose }: { vendor: Vendor; onClose: () => void }) {
  const m = useMaintenance();
  const live = m.vendors.find((v) => v.id === vendor.id) ?? vendor;
  const [notes, setNotes] = useState(live.notes);
  const history = m.historyForVendor(live.id);
  const stats = vendorStats(live.id, m.workOrders, m.bills);
  const today = new Date().toISOString().slice(0, 10);
  const insurance = expiryStatus(live.insuranceExpiry, today);

  return (
    <Sheet title={live.name} onClose={onClose}>
      <div className="flex flex-wrap gap-2">
        <Tag tone={live.preferred ? "success" : "navy"}>{live.preferred ? "Preferred vendor" : "Standard vendor"}</Tag>
        <button
          type="button"
          className={btnGhost}
          onClick={() => {
            m.updateVendor(live.id, { preferred: !live.preferred });
            toast.success(live.preferred ? `${live.name} is no longer preferred.` : `${live.name} marked preferred.`);
          }}
        >
          {live.preferred ? "Remove preferred flag" : "Mark as preferred"}
        </button>
      </div>

      <dl>
        <Row label="Trade">{live.trade}</Row>
        <Row label="Service area">{live.serviceArea || "—"}</Row>
        <Row label="Contact">{live.contactName}</Row>
        <Row label="Email"><a className="text-action underline" href={`mailto:${live.email}`}>{live.email}</a></Row>
        <Row label="Phone"><a className="text-action underline" href={`tel:${live.phone.replace(/\D/g, "")}`}>{live.phone}</a></Row>
        <Row label="Hourly rate">{live.hourlyRate ? money(live.hourlyRate) : "—"}</Row>
        <Row label="Call-out fee">{live.calloutFee ? money(live.calloutFee) : "—"}</Row>
        <Row label="GST/HST number">{live.gstNumber || "—"}</Row>
        <Row label="Licence">{live.licenceNumber || "—"}</Row>
        <Row label="Insurance">{insurance ? <Tag tone={insurance.tone}>{insurance.label}</Tag> : "Not on file"}</Row>
      </dl>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Jobs", value: String(stats.jobs) },
          { label: "Open now", value: String(stats.openJobs) },
          { label: "Avg. days", value: stats.avgCompletionDays === null ? "—" : String(stats.avgCompletionDays) },
          { label: "Total spend", value: money(stats.spendCents) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface-sunk p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="money mt-1 text-sm font-extrabold text-navy">{s.value}</p>
          </div>
        ))}
      </section>

      {live.documents.length > 0 && (
        <section>
          <h4 className="font-display text-sm font-bold text-navy">Documents on file</h4>
          <ul className="mt-2 space-y-2">
            {live.documents.map((d) => {
              const e = expiryStatus(d.expiresOn, today);
              return (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm">
                  <span className="font-semibold text-navy">{d.name}</span>
                  {e ? <Tag tone={e.tone}>{e.label}</Tag> : <Tag tone="navy">No expiry</Tag>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div>
        <label htmlFor="v-notes" className="text-sm font-medium">Notes</label>
        <textarea
          id="v-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => m.updateVendor(live.id, { notes })}
          className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm"
        />
      </div>

      <section>
        <h4 className="font-display text-sm font-bold text-navy">Work history</h4>
        {history.workOrders.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No work orders yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {history.workOrders.map((w) => (
              <li key={w.id} className="rounded-xl border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusLabel status={w.status} />
                  <span className="font-semibold text-navy">{w.id}</span>
                </div>
                <p className="mt-1 text-muted-foreground">{w.title} · {unitAddress(w.unitId)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Sheet>
  );
}

export function VendorForm({ onDone }: { onDone: () => void }) {
  const m = useMaintenance();
  const [form, setForm] = useState({
    name: "", trade: TRADES[0]!, contactName: "", email: "", phone: "",
    serviceArea: "", hourlyRate: "", calloutFee: "", gstNumber: "", licenceNumber: "", insuranceExpiry: "", notes: "",
  });
  const [preferred, setPreferred] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <form
      className="space-y-3 rounded-2xl border border-border bg-surface-sunk p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.name.trim()) {
          toast.error("Give the vendor a name.");
          return;
        }
        m.addVendor({
          name: form.name, trade: form.trade, contactName: form.contactName, email: form.email, phone: form.phone,
          serviceArea: form.serviceArea, notes: form.notes, gstNumber: form.gstNumber, licenceNumber: form.licenceNumber,
          insuranceExpiry: form.insuranceExpiry || null,
          hourlyRate: (form.hourlyRate ? parseAmountToCents(form.hourlyRate) : 0) ?? 0,
          calloutFee: (form.calloutFee ? parseAmountToCents(form.calloutFee) : 0) ?? 0,
          preferred,
        });
        toast.success(`${form.name} added to your vendors.`);
        onDone();
      }}
    >
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-navy">
        <UserCircle weight="duotone" className="h-4 w-4 text-action" aria-hidden="true" /> New vendor
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="v-name" className="text-sm font-medium">Business name</label>
          <input id="v-name" value={form.name} onChange={set("name")} className={field} />
        </div>
        <div>
          <label htmlFor="v-trade" className="text-sm font-medium">Trade</label>
          <select id="v-trade" value={form.trade} onChange={set("trade")} className={field}>
            {TRADES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="v-contact" className="text-sm font-medium">Contact person</label>
          <input id="v-contact" value={form.contactName} onChange={set("contactName")} className={field} />
        </div>
        <div>
          <label htmlFor="v-email" className="text-sm font-medium">Email</label>
          <input id="v-email" type="email" value={form.email} onChange={set("email")} className={field} />
        </div>
        <div>
          <label htmlFor="v-phone" className="text-sm font-medium">Phone</label>
          <input id="v-phone" value={form.phone} onChange={set("phone")} className={field} />
        </div>
        <div>
          <label htmlFor="v-area" className="text-sm font-medium">Service area</label>
          <input id="v-area" value={form.serviceArea} onChange={set("serviceArea")} className={field} placeholder="Ottawa & Gatineau" />
        </div>
        <div>
          <label htmlFor="v-rate" className="text-sm font-medium">Hourly rate</label>
          <input id="v-rate" inputMode="decimal" value={form.hourlyRate} onChange={set("hourlyRate")} className={field} placeholder="95.00" />
        </div>
        <div>
          <label htmlFor="v-callout" className="text-sm font-medium">Call-out fee</label>
          <input id="v-callout" inputMode="decimal" value={form.calloutFee} onChange={set("calloutFee")} className={field} placeholder="120.00" />
        </div>
        <div>
          <label htmlFor="v-gst" className="text-sm font-medium">GST/HST number</label>
          <input id="v-gst" value={form.gstNumber} onChange={set("gstNumber")} className={field} placeholder="12345 6789 RT0001" />
        </div>
        <div>
          <label htmlFor="v-lic" className="text-sm font-medium">Licence number</label>
          <input id="v-lic" value={form.licenceNumber} onChange={set("licenceNumber")} className={field} />
        </div>
        <div>
          <label htmlFor="v-ins" className="text-sm font-medium">Insurance expires</label>
          <input id="v-ins" type="date" value={form.insuranceExpiry} onChange={set("insuranceExpiry")} className={field} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="v-note" className="text-sm font-medium">Notes</label>
          <input id="v-note" value={form.notes} onChange={set("notes")} className={field} />
        </div>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm font-medium sm:col-span-2">
          <input type="checkbox" checked={preferred} onChange={(e) => setPreferred(e.target.checked)} className="h-4 w-4" />
          Preferred vendor for this trade
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={btnPrimary}>Save vendor</button>
        <button type="button" className={btnGhost} onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}
