import { useMemo, useState } from "react";
import { createFileRoute, useParams, useSearch, Link } from "@tanstack/react-router";
import { 
  Building, 
  DoorOpen, 
  CurrencyDollar, 
  Wrench, 
  FileText, 
  ClipboardText, 
  Note, 
  ClockCounterClockwise,
  MapPin,
  Users,
  Plus,
  PencilSimple,
  Archive,
  DownloadSimple
} from "@phosphor-icons/react";
import { DetailBreadcrumbs, DetailHeader, DetailTabs, DetailSection } from "@/components/keyhold/detail-layout";
import { propertyById, units as allUnits, tenants as allTenants, cad, type Unit, type UnitStatus } from "@/lib/mock-data";
import { ActivityFeed } from "@/components/keyhold/activity-feed";
import { StatusLabel } from "@/components/keyhold/status";
import { DataList } from "@/components/keyhold/data-list";
import { useRent } from "@/lib/mock-rent";
import { useMaintenance } from "@/lib/mock-maintenance";
import { money, invoiceStatus, balanceCents, paidCents } from "@/lib/rent-engine";
import { TurnoverWorkflow } from "@/components/keyhold/turnover-workflow";


export const Route = createFileRoute("/app/properties/$id")({
  component: PropertyDetailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search["tab"] as string) || "overview",
  }),
});

function PropertyDetailPage() {
  const { id } = useParams({ from: "/app/properties/$id" });
  const { tab } = useSearch({ from: "/app/properties/$id" });
  const navigate = Route.useNavigate();
  const property = propertyById(id);
  const rent = useRent();
  const maintenance = useMaintenance();

  const [turnoverUnit, setTurnoverUnit] = useState<Unit | null>(null);

  const propertyUnits = useMemo(() => allUnits.filter(u => u.propertyId === id), [id]);
  const propertyInvoices = useMemo(() => rent.invoices.filter(i => i.unitId.startsWith(id)), [rent.invoices, id]);
  const propertyRequests = useMemo(() => maintenance.requests.filter(r => r.propertyId === id), [maintenance.requests, id]);


  if (!property) return <div className="p-8 text-center">Property not found</div>;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "units", label: "Units" },
    { key: "financials", label: "Financials" },
    { key: "maintenance", label: "Maintenance" },
    { key: "documents", label: "Documents" },
    { key: "inspections", label: "Inspections" },
    { key: "notes", label: "Notes" },
    { key: "activity", label: "Activity log" },
  ];

  const actions = (
    <>
      <button className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
        <PencilSimple weight="duotone" className="h-4 w-4" /> Edit
      </button>
      <button className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
        <Archive weight="duotone" className="h-4 w-4" /> Archive
      </button>
      <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90">
        <Plus weight="duotone" className="h-4 w-4" /> Add Unit
      </button>
    </>
  );

  return (
    <div className="pb-12">
      <DetailBreadcrumbs items={[{ label: "Properties", to: "/app/properties" }, { label: property.name }]} />
      
      <DetailHeader 
        title={property.name} 
        subtitle={property.address}
        actions={actions}
        stats={[
          { label: "Type", value: property.kind },
          { label: "Province", value: property.province },
          { label: "Occupancy", value: `${Math.round((propertyUnits.filter(u => u.tenantId).length / propertyUnits.length) * 100)}%` },
          { label: "Monthly Income", value: cad(propertyUnits.reduce((s, u) => s + u.rent, 0)) },
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
            <DetailSection title="Details">
              <div className="card-soft divide-y divide-border overflow-hidden">
                <DetailRow label="Address" value={property.address} />
                <DetailRow label="City" value={property.city} />
                <DetailRow label="Postal Code" value={property.postalCode} />
                <DetailRow label="Property Type" value={property.kind} />
                <DetailRow label="Owner" value="Mr. J (you)" />
              </div>
            </DetailSection>
            <DetailSection title="Map">
              <div className="aspect-video rounded-2xl bg-muted grid place-items-center border border-border">
                <div className="text-center">
                  <MapPin weight="duotone" className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Interactive map integration</p>
                </div>
              </div>
            </DetailSection>
          </div>
        )}

        {tab === "units" && (
          <DetailSection>
            <DataList
              name="Units"
              items={propertyUnits}
              getId={(u) => u.id}
              columns={[
                { key: "label", label: "Unit", locked: true, value: u => u.label, render: u => (
                  <Link to={`/app/units/${u.id}` as any} className="font-display font-bold text-navy hover:underline">{u.label}</Link>

                )},
                { key: "kind", label: "Type", value: u => u.kind },
                { key: "tenant", label: "Tenant", value: u => allTenants.find(t => t.id === u.tenantId)?.name ?? "Vacant", render: u => {
                  const t = allTenants.find(t => t.id === u.tenantId);
                  return t ? (
                    <Link to={`/app/tenants/${t.id}` as any} className="text-navy hover:underline">{t.name}</Link>

                  ) : <span className="text-muted-foreground italic">Vacant</span>;
                }},
                { key: "rent", label: "Rent", align: "right", value: u => u.rent, render: u => <span className="money font-bold text-navy">{cad(u.rent)}</span> },
                { key: "leaseEnd", label: "Lease End", value: u => u.leaseEnd ?? "—" },
                { key: "status", label: "Status", sortable: false, value: u => u.tenantId ? "occupied" : "vacant", render: u => (
                  <StatusLabel status={u.tenantId ? "occupied" : "vacant"} />
                )},
              ]}
              emptyIcon={DoorOpen}
              emptyTitle="No units in this property"
              emptyBody="Add units to start managing tenancies and rent collection."
            />
          </DetailSection>
        )}

        {tab === "financials" && (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="card-soft p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Owed this month</p>
                <p className="mt-1 text-2xl font-extrabold text-navy">
                  {money(propertyInvoices.filter(i => i.period === propertyInvoices[0]?.period).reduce((s, i) => s + balanceCents(i, rent.payments), 0))}
                </p>
              </div>
              <div className="card-soft p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Collected YTD</p>
                <p className="mt-1 text-2xl font-extrabold text-success">{money(14200000)}</p>
              </div>
              <div className="card-soft p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Expenses YTD</p>
                <p className="mt-1 text-2xl font-extrabold text-maple">{money(245000)}</p>
              </div>
            </div>
            
            <DetailSection title="Recent Invoices">
              <DataList
                name="Invoices"
                items={propertyInvoices.map(i => ({
                  invoice: i,
                  tenant: allTenants.find(t => t.id === i.tenantId)?.name ?? "—",
                  status: invoiceStatus(i, rent.payments, rent.today),
                  balance: balanceCents(i, rent.payments)
                }))}
                getId={r => r.invoice.id}
                columns={[
                  { key: "tenant", label: "Tenant", value: r => r.tenant },
                  { key: "desc", label: "Description", value: r => r.invoice.description },
                  { key: "amount", label: "Amount", align: "right", value: r => r.invoice.amountCents, render: r => <span className="money font-bold">{money(r.invoice.amountCents)}</span> },
                  { key: "balance", label: "Balance", align: "right", value: r => r.balance, render: r => <span className={`money font-bold ${r.balance > 0 ? "text-maple" : "text-success"}`}>{money(r.balance)}</span> },
                  { key: "status", label: "Status", value: r => r.status, render: r => <StatusLabel status={r.status as any} /> },
                ]}
              />
            </DetailSection>
          </div>
        )}

        {tab === "maintenance" && (
          <DetailSection>
            <DataList
              name="Maintenance"
              items={propertyRequests}
              getId={r => r.id}
              columns={[
                { key: "category", label: "Category", value: r => r.category },
                { key: "urgency", label: "Urgency", value: r => r.urgency, render: r => <StatusLabel status={r.urgency} /> },
                { key: "desc", label: "Description", value: r => r.description },
                { key: "opened", label: "Opened", value: r => r.openedOn },
                { key: "status", label: "Status", value: r => r.status, render: r => <StatusLabel status={r.status} /> },
              ]}
              emptyIcon={Wrench}
              emptyTitle="No open maintenance"
              emptyBody="Maintenance requests and work orders for this property will appear here."
            />
          </DetailSection>
        )}

        {tab === "activity" && (
          <DetailSection title="Property History">
            <ActivityFeed entityType="property" entityId={id} title="Full audit trail" limit={20} />
          </DetailSection>
        )}
      </div>
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

