import { useMemo, useState } from "react";
import { createFileRoute, useParams, useSearch, Link } from "@tanstack/react-router";
import { 
  User, 
  FileText, 
  CurrencyDollar, 
  Wrench, 
  ChatCircleDots, 
  Files, 
  Warning, 
  HandWaving, 
  ShieldCheck,
  Note,
  ClockCounterClockwise,
  PencilSimple,
  Archive,
  EnvelopeSimple,
  Phone,
  DeviceMobile,
  CheckCircle,
  XCircle,
  ArrowSquareOut
} from "@phosphor-icons/react";
import { DetailBreadcrumbs, DetailHeader, DetailTabs, DetailSection } from "@/components/keyhold/detail-layout";
import { tenants as allTenants, units as allUnits, propertyById, leases as allLeases, cad } from "@/lib/mock-data";
import { ActivityFeed } from "@/components/keyhold/activity-feed";
import { StatusLabel } from "@/components/keyhold/status";
import { DataList } from "@/components/keyhold/data-list";
import { useRent } from "@/lib/mock-rent";
import { useMaintenance } from "@/lib/mock-maintenance";
import { useMessages } from "@/lib/mock-messages";
import { money, invoiceStatus, balanceCents, paidCents, type LedgerEntry } from "@/lib/rent-engine";
import { TenantStatementSheet, RecurringChargesSheet, AdjustmentSheet } from "@/components/keyhold/rent-panels";



export const Route = createFileRoute("/app/tenants/$id")({
  component: TenantDetailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search["tab"] as string) || "overview",
  }),
});

function TenantDetailPage() {
  const { id } = useParams({ from: "/app/tenants/$id" });
  const { tab } = useSearch({ from: "/app/tenants/$id" });
  const navigate = Route.useNavigate();
  const rent = useRent();
  const maintenance = useMaintenance();
  const messages = useMessages();
  const [showStatement, setShowStatement] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [showAdjustment, setShowAdjustment] = useState(false);


  const tenant = useMemo(() => allTenants.find(t => t.id === id), [id]);
  const unit = useMemo(() => tenant ? allUnits.find(u => u.id === tenant.unitId) : null, [tenant]);
  const property = useMemo(() => unit ? propertyById(unit.propertyId) : null, [unit]);
  
  const tenantLeases = useMemo(() => allLeases.filter(l => l.tenantId === id), [id]);
  const tenantInvoices = useMemo(() => rent.invoices.filter(i => i.tenantId === id), [rent.invoices, id]);
  const tenantRequests = useMemo(() => maintenance.requests.filter(r => r.tenantId === id), [maintenance.requests, id]);
  const tenantThread = useMemo(() => messages.conversations.find(c => c.participantIds.includes(id)), [messages.conversations, id]);


  if (!tenant) return <div className="p-8 text-center">Tenant not found</div>;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "leases", label: "Leases" },
    { key: "ledger", label: "Ledger" },
    { key: "maintenance", label: "Maintenance" },
    { key: "messages", label: "Messages" },
    { key: "documents", label: "Documents" },
    { key: "activity", label: "Activity" },
  ];

  const actions = (
    <>
      <button className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
        <PencilSimple weight="duotone" className="h-4 w-4" /> Edit
      </button>
      <button className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
        <Archive weight="duotone" className="h-4 w-4" /> Move-out
      </button>
      <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90">
        <ChatCircleDots weight="duotone" className="h-4 w-4" /> Message
      </button>
    </>
  );

  return (
    <div className="pb-12">
      <DetailBreadcrumbs items={[{ label: "Tenants", to: "/app/tenants" }, { label: tenant.name }]} />
      
      <DetailHeader 
        title={tenant.name} 
        subtitle={tenant.email}
        actions={actions}
        status={<StatusLabel status="active" />}
        stats={[
          { label: "Unit", value: unit ? (
            <Link to={`/app/units/${unit.id}` as any} className="hover:underline">{unit.label}</Link>
          ) : "None" },
          { label: "Property", value: property?.name || "None" },
          { label: "Phone", value: tenant.phone },
          { label: "Moved In", value: tenant.movedIn },
        ]}
      />

      <DetailTabs 
        tabs={tabs} 
        activeTab={tab} 
        onTabChange={(key) => navigate({ search: { tab: key } })} 
      />

      <div className="mt-8 space-y-12">
        {tab === "overview" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <DetailSection title="Contact Information">
              <div className="card-soft divide-y divide-border overflow-hidden">
                <DetailRow label="Full Name" value={tenant.name} />
                <DetailRow label="Email" value={tenant.email} />
                <DetailRow label="Phone" value={tenant.phone} />
                <DetailRow label="Secondary Phone" value="—" />
                <DetailRow label="Emergency Contact" value="John Tremblay (416-555-0101)" />
              </div>
            </DetailSection>

            <DetailSection title="Tenancy Status">
              <div className="grid gap-4">
                <div className="card-soft p-5 border-l-4 border-success">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Insurance Status</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-success font-bold">
                      <ShieldCheck weight="duotone" className="h-5 w-5" /> Active
                    </div>
                    <span className="text-xs text-muted-foreground">Exp Sept 2026</span>
                  </div>
                </div>
                <div className="card-soft p-5 border-l-4 border-success">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Consents</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy bg-navy-soft px-2 py-1 rounded-md">
                      <CheckCircle weight="fill" className="h-3 w-3 text-success" /> Email notices
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy bg-navy-soft px-2 py-1 rounded-md">
                      <CheckCircle weight="fill" className="h-3 w-3 text-success" /> SMS reminders
                    </span>
                  </div>
                </div>
              </div>
            </DetailSection>
            <DetailSection title="Financial Recovery">
              {rent.paymentPlanForTenant(id) ? (
                <div className="card-soft p-5 border-l-4 border-success">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Payment Plan</p>
                      <p className="mt-1 text-sm font-bold text-navy">
                        {money(rent.paymentPlanForTenant(id)!.totalOwedCents)} total · {rent.paymentPlanForTenant(id)!.status === "on-track" ? "On track" : "Behind"}
                      </p>
                    </div>
                    <StatusLabel status={rent.paymentPlanForTenant(id)!.status === "on-track" ? "paid" : "overdue"} />
                  </div>
                  <div className="mt-4 h-1.5 w-full bg-navy-soft rounded-full overflow-hidden">
                    <div className="h-full bg-success w-[65%]" />
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground font-bold uppercase">65% of agreed schedule paid</p>
                </div>
              ) : (
                <div className="card-soft p-5 opacity-60">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Payment Plan</p>
                  <p className="mt-1 text-sm text-muted-foreground italic">No recovery plan active.</p>
                </div>
              )}
            </DetailSection>
          </div>
        )}


        {tab === "leases" && (
          <DetailSection>
            <DataList
              name="Lease History"
              items={tenantLeases}
              getId={l => l.id}
              columns={[
                { key: "unit", label: "Unit", value: l => allUnits.find(u => u.id === l.unitId)?.label ?? "—" },
                { key: "term", label: "Term", value: l => `${l.start} to ${l.end}` },
                { key: "rent", label: "Rent", align: "right", value: l => l.rent, render: l => cad(l.rent) },
                { key: "status", label: "Status", value: l => "Active", render: () => <StatusLabel status="active" /> },
                { key: "view", label: "", sortable: false, value: () => "", render: l => (
                  <Link to={`/app/leases/${l.id}` as any} className="text-action hover:underline text-xs font-bold uppercase">View Lease</Link>
                )},
              ]}
            />
          </DetailSection>
        )}

        {tab === "ledger" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="card-soft p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Outstanding Balance</p>
                <p className="mt-1 text-2xl font-extrabold text-maple">{money(rent.creditFor(id) < 0 ? Math.abs(rent.creditFor(id)) : 0)}</p>
              </div>
              <div className="card-soft p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Credit on File</p>
                <p className="mt-1 text-2xl font-extrabold text-success">{money(Math.max(0, rent.creditFor(id)))}</p>
              </div>
              <div className="card-soft p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Deposits Held</p>
                <p className="mt-1 text-2xl font-extrabold text-navy">
                  {money(rent.depositsForTenant(id).reduce((s, d) => s + d.amountCents, 0))}
                </p>
              </div>
            </div>

            <DetailSection 
              title="Full Financial Statement"
              actions={
                <div className="flex gap-2">
                  <button onClick={() => setShowAdjustment(true)} className="text-xs font-bold text-action uppercase hover:underline">One-off adjustment</button>
                  <button onClick={() => setShowStatement(true)} className="text-xs font-bold text-action uppercase hover:underline">View statement</button>
                </div>
              }
            >
              <DataList
                name="Ledger"
                items={rent.getLedger(id).slice(-5).reverse()}
                getId={(e: LedgerEntry) => e.id}
                columns={[
                  { key: "date", label: "Date", value: e => e.date },
                  { key: "desc", label: "Description", value: e => e.description },
                  { key: "amount", label: "Amount", align: "right", value: e => e.amountCents, render: e => (
                    <span className={e.amountCents > 0 ? "text-maple" : "text-success"}>{money(Math.abs(e.amountCents))}</span>
                  )},
                  { key: "balance", label: "Balance", align: "right", value: e => e.balanceCents, render: e => money(e.balanceCents) },
                ]}
              />
            </DetailSection>

            {tenantLeases.length > 0 && (
              <DetailSection 
                title="Recurring Charges"
                actions={
                  <button onClick={() => setShowRecurring(true)} className="text-xs font-bold text-action uppercase hover:underline">Manage recurring</button>
                }
              >
                <div className="card-soft divide-y divide-border overflow-hidden">
                  {rent.recurringForTenant(id).map(c => (
                    <div key={c.id} className="flex items-center justify-between p-4 text-sm">
                      <div>
                        <p className="font-bold text-navy">{c.description}</p>
                        <p className="text-xs text-muted-foreground">{c.frequency}</p>
                      </div>
                      <p className="font-extrabold text-navy">{money(c.amountCents)}</p>
                    </div>
                  ))}
                  {rent.recurringForTenant(id).length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground italic">No active recurring charges.</p>
                  )}
                </div>
              </DetailSection>
            )}

          </div>
        )}

        {tab === "maintenance" && (
          <DetailSection>
            <DataList
              name="Maintenance Requests"
              items={tenantRequests}
              getId={r => r.id}
              columns={[
                { key: "category", label: "Issue", value: r => r.category },
                { key: "status", label: "Status", value: r => r.status, render: r => <StatusLabel status={r.status} /> },
                { key: "opened", label: "Date", value: r => r.openedOn },
                { key: "desc", label: "Notes", value: r => r.description },
              ]}
              emptyIcon={Wrench}
              emptyTitle="No maintenance requests"
            />
          </DetailSection>
        )}

        {tab === "activity" && (
          <DetailSection title="Tenant Activity">
            <ActivityFeed entityType="tenant" entityId={id} title="Event Log" limit={15} />
          </DetailSection>
        )}
      </div>

      {showStatement && <TenantStatementSheet tenantId={id} onClose={() => setShowStatement(false)} />}
      {showRecurring && tenantLeases[0] && (
        <RecurringChargesSheet leaseId={tenantLeases[0].id} tenantId={id} onClose={() => setShowRecurring(false)} />
      )}
      {showAdjustment && <AdjustmentSheet tenantId={id} onClose={() => setShowAdjustment(false)} />}
    </div>

  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between p-4 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="font-bold text-navy">{value}</span>
    </div>
  );
}

