import { useMemo } from "react";
import { createFileRoute, useParams, useSearch, Link } from "@tanstack/react-router";
import { 
  Building, 
  Users, 
  CurrencyDollar, 
  Wrench, 
  Package, 
  Camera, 
  ClipboardText,
  ClockCounterClockwise,
  PencilSimple,
  Archive,
  ArrowSquareOut,
  Warning
} from "@phosphor-icons/react";
import { DetailBreadcrumbs, DetailHeader, DetailTabs, DetailSection } from "@/components/keyhold/detail-layout";
import { unitById, propertyById, cad, tenants as allTenants, leases as allLeases } from "@/lib/mock-data";
import { ActivityFeed } from "@/components/keyhold/activity-feed";
import { StatusLabel } from "@/components/keyhold/status";
import { DataList } from "@/components/keyhold/data-list";
import { useRent } from "@/lib/mock-rent";
import { useMaintenance } from "@/lib/mock-maintenance";
import { money, invoiceStatus, balanceCents } from "@/lib/rent-engine";

export const Route = createFileRoute("/app/units/$id")({
  component: UnitDetailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search["tab"] as string) || "overview",
  }),
});

function UnitDetailPage() {
  const { id } = useParams({ from: "/app/units/$id" });
  const { tab } = useSearch({ from: "/app/units/$id" });
  const navigate = Route.useNavigate();
  const unit = unitById(id);
  const property = propertyById(unit.propertyId);
  const rent = useRent();
  const maintenance = useMaintenance();

  const unitTenants = useMemo(() => allTenants.filter(t => t.unitId === id), [id]);
  const unitLeases = useMemo(() => allLeases.filter(l => l.unitId === id), [id]);
  const unitInvoices = useMemo(() => rent.invoices.filter(i => i.unitId === id), [rent.invoices, id]);
  const unitRequests = useMemo(() => maintenance.requests.filter(r => r.unitId === id), [maintenance.requests, id]);

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "tenancies", label: "Tenancies" },
    { key: "rent", label: "Rent history" },
    { key: "maintenance", label: "Maintenance" },
    { key: "inspections", label: "Inspections" },
    { key: "assets", label: "Assets" },
    { key: "photos", label: "Photos" },
    { key: "activity", label: "Activity" },
  ];

  const actions = (
    <>
      <button className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
        <PencilSimple weight="duotone" className="h-4 w-4" /> Edit
      </button>
      <button className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
        <Archive weight="duotone" className="h-4 w-4" /> Archive
      </button>
    </>
  );

  return (
    <div className="pb-12">
      <DetailBreadcrumbs 
        items={[
          { label: "Properties", to: "/app/properties" }, 
          { label: property.name, to: `/app/properties/${property.id}` as any }, 
          { label: unit.label }
        ]} 
      />
      
      <DetailHeader 
        title={unit.label} 
        subtitle={`${property.name} · ${unit.kind}`}
        actions={actions}
        status={<StatusLabel status={unit.tenantId ? "occupied" : "vacant"} />}
        stats={[
          { label: "Monthly Rent", value: cad(unit.rent) },
          { label: "Bedrooms", value: String(unit.bedrooms) },
          { label: "Lease End", value: unit.leaseEnd || "Vacant" },
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
            <DetailSection title="Unit Details">
              <div className="card-soft divide-y divide-border overflow-hidden">
                <DetailRow label="Property" value={property.name} />
                <DetailRow label="Unit Label" value={unit.label} />
                <DetailRow label="Type" value={unit.kind} />
                <DetailRow label="Bedrooms" value={unit.bedrooms} />
                <DetailRow label="Market Rent" value={cad(unit.rent)} />
              </div>
            </DetailSection>
            
            <DetailSection title="Current Tenancy">
              {unit.tenantId ? (
                <div className="card-soft p-5 flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-navy">
                      {allTenants.find(t => t.id === unit.tenantId)?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">Moved in {allTenants.find(t => t.id === unit.tenantId)?.movedIn}</p>
                  </div>
                  <Link 
                    to={`/app/tenants/${unit.tenantId}` as any}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-navy hover:bg-navy-soft"
                  >
                    <ArrowSquareOut weight="bold" className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="card-soft p-8 text-center text-muted-foreground border-dashed">
                  <p>Unit is currently vacant</p>
                </div>
              )}
            </DetailSection>
          </div>
        )}

        {tab === "tenancies" && (
          <DetailSection>
            <DataList
              name="Tenancy History"
              items={unitLeases}
              getId={l => l.id}
              columns={[
                { key: "tenant", label: "Tenant", value: l => allTenants.find(t => t.id === l.tenantId)?.name ?? "—", render: l => (
                  <Link to={`/app/tenants/${l.tenantId}` as any} className="font-bold text-navy hover:underline">
                    {allTenants.find(t => t.id === l.tenantId)?.name}
                  </Link>
                )},
                { key: "period", label: "Lease Period", value: l => `${l.start} to ${l.end}` },
                { key: "rent", label: "Rent", align: "right", value: l => l.rent, render: l => cad(l.rent) },
                { key: "type", label: "Lease Type", value: l => l.type },
              ]}
              emptyIcon={Users}
              emptyTitle="No tenancy history"
              emptyBody="Past and current leases for this unit will be listed here."
            />
          </DetailSection>
        )}

        {tab === "rent" && (
          <DetailSection>
            <DataList
              name="Rent History"
              items={unitInvoices.map(i => ({
                invoice: i,
                status: invoiceStatus(i, rent.payments, rent.today),
                balance: balanceCents(i, rent.payments)
              }))}
              getId={r => r.invoice.id}
              columns={[
                { key: "desc", label: "Description", value: r => r.invoice.description },
                { key: "due", label: "Due Date", value: r => r.invoice.dueDate },
                { key: "amount", label: "Amount", align: "right", value: r => r.invoice.amountCents, render: r => money(r.invoice.amountCents) },
                { key: "balance", label: "Balance", align: "right", value: r => r.balance, render: r => <span className={r.balance > 0 ? "text-maple font-bold" : "text-success"}>{money(r.balance)}</span> },
                { key: "status", label: "Status", value: r => r.status, render: r => <StatusLabel status={r.status as any} /> },
              ]}
              emptyIcon={CurrencyDollar}
              emptyTitle="No rent history"
              emptyBody="All invoices and payments for this unit are tracked here."
            />
          </DetailSection>
        )}

        {tab === "maintenance" && (
          <DetailSection>
            <DataList
              name="Maintenance Requests"
              items={unitRequests}
              getId={r => r.id}
              columns={[
                { key: "title", label: "Issue", value: r => r.category },
                { key: "status", label: "Status", value: r => r.status, render: r => <StatusLabel status={r.status} /> },
                { key: "urgency", label: "Urgency", value: r => r.urgency, render: r => <StatusLabel status={r.urgency} /> },
                { key: "opened", label: "Reported", value: r => r.openedOn },
              ]}
              emptyIcon={Wrench}
              emptyTitle="No maintenance requests"
            />
          </DetailSection>
        )}

        {tab === "assets" && (
          <DetailSection title="Unit Assets & Warranties">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AssetCard name="Fridge" brand="Whirlpool" serial="WHP-88214" installed="2023-11-01" />
              <AssetCard name="Stove" brand="Samsung" serial="SAM-99011" installed="2023-11-01" />
              <AssetCard name="Dishwasher" brand="Bosch" serial="BOS-11233" installed="2024-05-15" />
            </div>
          </DetailSection>
        )}

        {tab === "activity" && (
          <DetailSection title="Unit History">
            <ActivityFeed entityType="unit" entityId={id} title="Audit Trail" limit={10} />
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

function AssetCard({ name, brand, serial, installed }: { name: string; brand: string; serial: string; installed: string }) {
  return (
    <div className="card-soft p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-navy-soft grid place-items-center text-navy">
          <Package weight="duotone" className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-bold text-navy">{name}</h4>
          <p className="text-xs text-muted-foreground">{brand}</p>
        </div>
      </div>
      <div className="space-y-1 text-xs">
        <p><span className="text-muted-foreground">Serial:</span> <span className="font-mono">{serial}</span></p>
        <p><span className="text-muted-foreground">Installed:</span> {installed}</p>
      </div>
    </div>
  );
}

