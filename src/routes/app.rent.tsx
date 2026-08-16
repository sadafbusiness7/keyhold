import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  DownloadSimple,
  ArrowsClockwise,
  SignOut,
  Receipt,
  Eye,
  Copy,
  Archive,
  Trash,
  PaperPlaneTilt,
  EnvelopeSimple,
  CurrencyDollar,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { RequireFinancials } from "@/components/keyhold/access-guard";
import { PageHeader } from "@/components/keyhold/app-shell";
import { StatusLabel } from "@/components/keyhold/status";
import { DataList } from "@/components/keyhold/data-list";
import { InvoiceSheet, ManualChargeSheet, MoveOutSheet } from "@/components/keyhold/rent-panels";
import { usePermissions } from "@/lib/mock-access";
import { tenantById, unitAddress, longDate } from "@/lib/mock-data";
import { useRent, lastMonthHeldCents } from "@/lib/mock-rent";
import {
  balanceCents,
  invoiceStatus,
  money,
  paidCents,
  periodLabel,
  type Invoice,
} from "@/lib/rent-engine";

export const Route = createFileRoute("/app/rent")({
  head: () => ({
    meta: [
      { title: "Rent — Keyhold" },
      { name: "description", content: "Automatic monthly rent invoices, payments, receipts, credits and move-outs in one calm ledger." },
      { property: "og:title", content: "Rent — Keyhold" },
      { property: "og:description", content: "Auto-invoicing, partial payments, NSF, credits and yearly receipts — all in Canadian dollars." },
    ],
  }),
  component: RentPage,
});




function RentPage() {
  return (
    <RequireFinancials title="Rent">
      <RentPageInner />
    </RequireFinancials>
  );
}

function Metric({ label, value, tone, hint }: { label: string; value: string; tone: "navy" | "success" | "maple"; hint?: string }) {
  const map = { navy: "bg-navy text-navy", success: "bg-success text-success", maple: "bg-maple text-maple" }[tone].split(" ");
  return (
    <div className="relative overflow-hidden card-soft p-5 pl-6">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${map[0]}`} />
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`money mt-1 text-3xl font-extrabold ${map[1]}`}>{value}</p>
      {hint && <p className="tnum mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function RentPageInner() {
  const perms = usePermissions();
  const rent = useRent();

  const [tab, setTab] = useState<"ledger" | "credits" | "movedout">("ledger");
  const [openInvoice, setOpenInvoice] = useState<Invoice | null>(null);
  const [showCharge, setShowCharge] = useState(false);
  const [showMoveOut, setShowMoveOut] = useState(false);

  // Only invoices for units this person is allowed to see money for.
  const visibleUnitIds = useMemo(
    () => new Set(perms.units.filter((u) => perms.canSeeFinancials(u.propertyId)).map((u) => u.id)),
    [perms],
  );
  const scoped = useMemo(
    () => rent.invoices.filter((i) => visibleUnitIds.has(i.unitId)),
    [rent.invoices, visibleUnitIds],
  );

  const periods = useMemo(
    () => Array.from(new Set(scoped.map((i) => i.period))).sort().reverse(),
    [scoped],
  );

  const rows = useMemo(
    () =>
      scoped
        .map((invoice) => ({
          invoice,
          tenant: tenantById(invoice.tenantId)?.name ?? "—",
          home: invoice.unitId ? unitAddress(invoice.unitId) : "—",
          paid: paidCents(invoice, rent.payments) + invoice.creditAppliedCents,
          balance: Math.max(balanceCents(invoice, rent.payments), 0),
          status: invoiceStatus(invoice, rent.payments, rent.today),
        }))
        .sort((a, b) => b.invoice.dueDate.localeCompare(a.invoice.dueDate)),
    [scoped, rent.payments, rent.today],
  );

  const expected = rows.reduce((s, r) => s + r.invoice.amountCents, 0);
  const received = rows.reduce((s, r) => s + r.paid, 0);
  const owed = rows.reduce((s, r) => s + r.balance, 0);


  return (
    <>
      <PageHeader
        title="Rent"
        subtitle="Invoices generate on their own each month. All amounts in Canadian dollars."
        action={
          <div className="col-span-full flex flex-wrap gap-2 sm:col-auto">
            <button
              type="button"
              onClick={() => setShowMoveOut(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
            >
              <SignOut weight="duotone" className="h-5 w-5" aria-hidden="true" /> Move-out
            </button>
            <button
              type="button"
              onClick={() => setShowCharge(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
            >
              <Plus weight="duotone" className="h-5 w-5" aria-hidden="true" /> One-off charge
            </button>
          </div>
        }
      />

      {/* Auto-invoicing */}
      <section className="mb-6 relative overflow-hidden card-soft p-5 pl-6">
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-action" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-bold text-navy">Automatic invoicing is on</h2>
            <p className="tnum mt-1 text-sm text-muted-foreground">
              Next run <span className="font-semibold text-navy">{longDate(rent.nextRun)}</span> · one rent invoice per active
              lease for {rent.nextRunLabel}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const made = rent.runInvoicing(rent.nextRunPeriod);
              toast.success(made ? `${made} invoices generated for ${rent.nextRunLabel}.` : `${rent.nextRunLabel} is already invoiced.`);
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            <ArrowsClockwise weight="duotone" className="h-5 w-5" aria-hidden="true" /> Run now
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={rent.settings.autoApplyCredit}
              onChange={(e) => rent.setSettings({ ...rent.settings, autoApplyCredit: e.target.checked })}
              className="h-5 w-5 rounded border-input"
            />
            Auto-apply tenant credit to future invoices
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={rent.settings.autoApplyLastMonth}
              onChange={(e) => rent.setSettings({ ...rent.settings, autoApplyLastMonth: e.target.checked })}
              className="h-5 w-5 rounded border-input"
            />
            Auto-apply last month's rent to the final invoice
          </label>
        </div>
      </section>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Metric label="Charged" value={money(expected)} tone="navy" hint={`${rows.length} invoices in view`} />
        <Metric label="Settled" value={money(received)} tone="success" hint="Payments + credit applied" />
        <Metric label="Still owed" value={money(owed)} tone="maple" />
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Rent views" className="mb-4 flex flex-wrap gap-2">
        {([
          ["ledger", "Rent ledger"],
          ["credits", "Credits & deposits"],
          ["movedout", `Moved out (${rent.moveOuts.length})`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`min-h-11 rounded-full px-4 text-sm font-semibold ${tab === key ? "bg-navy text-primary-foreground" : "border border-border text-navy hover:bg-navy-soft"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "ledger" && (
        <DataList
          name="Rent invoices"
          items={rows}
          getId={(r) => r.invoice.id}
          getStatus={(r) => r.status as any}
          searchPlaceholder="Search tenant, home or charge"
          dateOf={(r) => r.invoice.dueDate}
          columns={[
            { key: "tenant", label: "Tenant", locked: true, value: (r) => r.tenant,
              render: (r) => <span className="font-display font-bold text-navy">{r.tenant}</span> },
            { key: "home", label: "Home", value: (r) => r.home },
            { key: "charge", label: "For", value: (r) => r.invoice.description },
            { key: "amount", label: "Amount", align: "right", value: (r) => r.invoice.amountCents,
              render: (r) => <span className="money font-bold text-navy">{money(r.invoice.amountCents)}</span> },
            { key: "paid", label: "Paid", align: "right", defaultHidden: true, value: (r) => r.paid,
              render: (r) => <span className="money font-bold text-success">{money(r.paid)}</span> },
            { key: "balance", label: "Balance", align: "right", value: (r) => r.balance,
              render: (r) => <span className={`money font-bold ${r.balance ? "text-maple" : "text-success"}`}>{money(r.balance)}</span> },
            { key: "due", label: "Due", value: (r) => r.invoice.dueDate, render: (r) => <span className="tnum">{longDate(r.invoice.dueDate)}</span> },
            { key: "status", label: "Status", sortable: false, value: (r) => r.status, render: (r) => <StatusLabel status={r.status as any} /> },
          ]}
          filters={[
            {
              key: "status",
              label: "Status",
              options: [
                { value: "overdue", label: "Overdue" },
                { value: "partial", label: "Part paid" },
                { value: "due-soon", label: "Due soon" },
                { value: "paid", label: "Paid" },
              ],
              match: (r, v) => r.status === v,
            },
            {
              key: "period",
              label: "Month",
              options: periods.map((pp) => ({ value: pp, label: periodLabel(pp) })),
              match: (r, v) => r.invoice.period === v,
            },
            {
              key: "kind",
              label: "Charge type",
              options: [
                { value: "rent", label: "Rent only" },
                { value: "other", label: "Other charges" },
              ],
              match: (r, v) => (v === "rent" ? r.invoice.kind === "rent" : r.invoice.kind !== "rent"),
            },
          ]}
          emptyIcon={Receipt}
          emptyTitle="No invoices yet"
          emptyBody="Run auto-invoicing above and this month's rent invoices appear here."
          bulkActions={[
            { key: "remind", label: "Send reminder", Icon: PaperPlaneTilt, onSelect: (sel) => toast.success(`Reminder queued for ${sel.length} tenants`) },
            { key: "receipt", label: "Email receipts", Icon: EnvelopeSimple },
            { key: "export", label: "Export", Icon: DownloadSimple },
            {
              key: "void",
              label: "Void invoices",
              Icon: Trash,
              destructive: true,
              confirm: (sel) => `${sel.length} invoices will be voided. Tenants stop owing these amounts and the ledger records the correction.`,
              onSelect: (sel) => {
                for (const r of sel) rent.voidInvoice(r.invoice.id, "Voided in bulk by the manager");
                toast.success(`${sel.length} invoices voided.`);
              },
            },
          ]}
          rowActions={[
            { key: "open", label: "Open invoice", Icon: Eye, onSelect: (r) => setOpenInvoice(r.invoice) },
            { key: "pay", label: "Record payment", Icon: CurrencyDollar, onSelect: (r) => setOpenInvoice(r.invoice) },
            { key: "remind", label: "Send reminder", Icon: PaperPlaneTilt, onSelect: (r) => toast.success(`Reminder sent to ${r.tenant}`) },
            { key: "duplicate", label: "Duplicate charge", Icon: Copy },
            { key: "archive", label: "Archive", Icon: Archive },
            {
              key: "void",
              label: "Void invoice",
              Icon: Trash,
              destructive: true,
              confirm: (r) => `Voiding this invoice removes ${money(r.invoice.amountCents)} from ${r.tenant}'s balance. The ledger keeps a record of the correction.`,
              onSelect: (r) => {
                rent.voidInvoice(r.invoice.id, "Voided by the manager");
                toast.success("Invoice voided. It no longer counts towards what is owed.");
              },
            },
          ]}
          quickView={(r) => ({
            title: r.tenant,
            subtitle: `${r.home} · ${r.invoice.description}`,
            status: r.status as any,

            fields: [
              { label: "Amount", value: <span className="money">{money(r.invoice.amountCents)}</span> },
              { label: "Paid", value: <span className="money">{money(r.paid)}</span> },
              { label: "Balance", value: <span className="money">{money(r.balance)}</span> },
              { label: "Due", value: longDate(r.invoice.dueDate) },
              { label: "Period", value: periodLabel(r.invoice.period) },
            ],
            actions: (
              <button
                type="button"
                onClick={() => setOpenInvoice(r.invoice)}
                className="inline-flex min-h-11 items-center rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90"
              >
                Open full invoice
              </button>
            ),
          })}
        />
      )}

      {tab === "credits" && <CreditsPanel />}
      {tab === "movedout" && <MovedOutPanel />}

      {openInvoice && <InvoiceSheet invoice={openInvoice} onClose={() => setOpenInvoice(null)} />}
      {showCharge && <ManualChargeSheet onClose={() => setShowCharge(false)} />}
      {showMoveOut && <MoveOutSheet onClose={() => setShowMoveOut(false)} />}
    </>
  );
}

function CreditsPanel() {
  const rent = useRent();
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Overpayments become a tenant credit. Last month's rent stays held until the final invoice.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {rent.leases.map((l) => {
          const credit = rent.creditFor(l.tenantId);
          const held = lastMonthHeldCents(l.tenantId);
          return (
            <li key={l.id} className="relative overflow-hidden card-soft p-4 pl-5">
              <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${credit > 0 ? "bg-success" : "bg-navy"}`} />
              <p className="font-display font-bold text-navy">{tenantById(l.tenantId)?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{unitAddress(l.unitId)}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Credit on file</dt>
                  <dd className="money text-lg font-extrabold text-success">{money(credit)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last month's rent held</dt>
                  <dd className="money text-lg font-extrabold text-navy">{money(held)}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
      <h3 className="font-display text-sm font-bold text-navy">Credit history</h3>
      <ul className="space-y-2">
        {rent.credits.length === 0 && <li className="text-sm text-muted-foreground">No credit movements yet.</li>}
        {rent.credits.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
            <div>
              <p className="font-semibold text-navy">{tenantById(c.tenantId)?.name}</p>
              <p className="tnum text-xs text-muted-foreground">{longDate(c.date)} · {c.reason}</p>
            </div>
            <span className={`money font-bold ${c.amountCents >= 0 ? "text-success" : "text-navy"}`}>
              {c.amountCents >= 0 ? "+" : "−"}{money(Math.abs(c.amountCents))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MovedOutPanel() {
  const rent = useRent();
  if (rent.moveOuts.length === 0) {
    return <p className="card-soft p-6 text-sm text-muted-foreground">No one has moved out. Records stay here when they do.</p>;
  }
  return (
    <ul className="space-y-3">
      {rent.moveOuts.map((m) => (
        <li key={m.tenantId} className="relative overflow-hidden card-soft p-4 pl-5">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-navy" />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display font-bold text-navy">{tenantById(m.tenantId)?.name}</p>
              <p className="text-xs text-muted-foreground">{m.unitId ? unitAddress(m.unitId) : "—"}</p>
              <p className="tnum mt-1 text-xs text-muted-foreground">
                Moved out {longDate(m.movedOutOn)} · {m.reason} · portal access disabled · invoicing stopped
              </p>
            </div>
            <button
              type="button"
              onClick={() => rent.undoMoveOut(m.tenantId)}
              className="min-h-10 rounded-full border border-border px-3 text-xs font-semibold text-navy hover:bg-navy-soft"
            >
              Undo
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
