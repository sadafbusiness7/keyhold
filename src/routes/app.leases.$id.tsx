import { useMemo } from "react";
import { createFileRoute, useParams, useSearch, Link } from "@tanstack/react-router";
import { 
  FileText, 
  Users, 
  CurrencyDollar, 
  Warning, 
  ClockCounterClockwise, 
  PencilSimple, 
  Signature, 
  ArrowSquareOut,
  Files,
  Archive,
  DownloadSimple
} from "@phosphor-icons/react";
import { DetailBreadcrumbs, DetailHeader, DetailTabs, DetailSection } from "@/components/keyhold/detail-layout";
import { leases as allLeases, units as allUnits, tenants as allTenants, cad } from "@/lib/mock-data";
import { ActivityFeed } from "@/components/keyhold/activity-feed";
import { StatusLabel } from "@/components/keyhold/status";
import { DataList } from "@/components/keyhold/data-list";
import { useRent } from "@/lib/mock-rent";
import { money, invoiceStatus, balanceCents } from "@/lib/rent-engine";

export const Route = createFileRoute("/app/leases/$id")({
  component: LeaseDetailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search["tab"] as string) || "terms",
  }),
});

function LeaseDetailPage() {
  const { id } = useParams({ from: "/app/leases/$id" });
  const { tab } = useSearch({ from: "/app/leases/$id" });
  const navigate = Route.useNavigate();
  const rent = useRent();

  const lease = useMemo(() => allLeases.find(l => l.id === id), [id]);
  const unit = useMemo(() => lease ? allUnits.find(u => u.id === lease.unitId) : null, [lease]);
  const tenants = useMemo(() => lease ? allTenants.filter(t => t.id === lease.tenantId) : [], [lease]);
  const leaseInvoices = useMemo(() => rent.invoices.filter(i => i.tenantId === lease?.tenantId && i.kind === "rent"), [rent.invoices, lease]);

  if (!lease) return <div className="p-8 text-center">Lease not found</div>;

  const tabs = [
    { key: "terms", label: "Terms" },
    { key: "tenants", label: "Tenants" },
    { key: "document", label: "Document & Signatures" },
    { key: "invoices", label: "Rent Invoices" },
    { key: "notices", label: "Notices" },
    { key: "activity", label: "Activity" },
  ];

  const actions = (
    <>
      <button className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
        <PencilSimple weight="duotone" className="h-4 w-4" /> Edit Terms
      </button>
      <button className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
        <DownloadSimple weight="duotone" className="h-4 w-4" /> Export PDF
      </button>
    </>
  );

  return (
    <div className="pb-12">
      <DetailBreadcrumbs items={[{ label: "Leases", to: "/app/leases" as any }, { label: `Lease ${lease.id}` }]} />
      
      <DetailHeader 
        title={`Lease for ${unit?.label || "Unit"}`} 
        subtitle={`${lease.type} · ${lease.start} to ${lease.end}`}
        actions={actions}
        status={<StatusLabel status="active" />}
        stats={[
          { label: "Monthly Rent", value: cad(lease.rent) },
          { label: "Deposit Held", value: cad(lease.depositHeld) },
          { label: "Remaining", value: "2.5 months" },
        ]}
      />

      <DetailTabs 
        tabs={tabs} 
        activeTab={tab} 
        onTabChange={(key) => navigate({ search: { tab: key } })} 
      />

      <div className="mt-8 space-y-12">
        {tab === "terms" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <DetailSection title="Lease Terms">
              <div className="card-soft divide-y divide-border overflow-hidden">
                <DetailRow label="Term Type" value={lease.type} />
                <DetailRow label="Start Date" value={lease.start} />
                <DetailRow label="End Date" value={lease.end} />
                <DetailRow label="Monthly Rent" value={cad(lease.rent)} />
                <DetailRow label="Last Month Deposit" value={cad(lease.depositHeld)} />
                <DetailRow label="Key Deposit" value="CA$50.00" />
              </div>
            </DetailSection>

            <DetailSection title="Standard Terms (Ontario)">
              <div className="card-soft p-5 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Utilities</p>
                  <p className="mt-1 text-sm font-semibold text-navy">Tenant pays Hydro & Water</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Parking</p>
                  <p className="mt-1 text-sm font-semibold text-navy">One surface spot included</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pets</p>
                  <p className="mt-1 text-sm text-muted-foreground italic">Ontario law applies (no-pet clauses void)</p>
                </div>
              </div>
            </DetailSection>
          </div>
        )}

        {tab === "tenants" && (
          <DetailSection>
            <DataList
              name="Lease Tenants"
              items={tenants}
              getId={t => t.id}
              columns={[
                { key: "name", label: "Name", value: t => t.name, render: t => (
                  <Link to={`/app/tenants/${t.id}` as any} className="font-bold text-navy hover:underline">{t.name}</Link>
                )},
                { key: "email", label: "Email", value: t => t.email },
                { key: "phone", label: "Phone", value: t => t.phone },
              ]}
            />
          </DetailSection>
        )}

        {tab === "document" && (
          <div className="space-y-6">
            <div className="card-soft p-8 text-center border-2 border-dashed border-border">
              <FileText weight="duotone" className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-display font-bold text-navy">Ontario Standard Lease</h3>
              <p className="text-sm text-muted-foreground mb-4">View the signed document and audit trail.</p>
              <button className="inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-primary-foreground">
                Open Viewer
              </button>
            </div>
            
            <DetailSection title="Signature Audit Trail">
              <div className="card-soft p-0 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-navy-soft text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">Signer</th>
                      <th className="px-5 py-3">Action</th>
                      <th className="px-5 py-3">Timestamp</th>
                      <th className="px-5 py-3">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tenants.map(t => (
                      <tr key={t.id}>
                        <td className="px-5 py-4 font-semibold text-navy">{t.name}</td>
                        <td className="px-5 py-4 text-success font-bold flex items-center gap-1.5"><Signature weight="bold" /> Signed</td>
                        <td className="px-5 py-4 text-muted-foreground">{lease.start} 09:12 AM</td>
                        <td className="px-5 py-4 text-muted-foreground font-mono text-[10px]">142.116.24.9</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="px-5 py-4 font-semibold text-navy">Mr. J (Landlord)</td>
                      <td className="px-5 py-4 text-success font-bold flex items-center gap-1.5"><Signature weight="bold" /> Signed</td>
                      <td className="px-5 py-4 text-muted-foreground">{lease.start} 10:45 AM</td>
                      <td className="px-5 py-4 text-muted-foreground font-mono text-[10px]">99.243.17.201</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </DetailSection>
          </div>
        )}

        {tab === "activity" && (
          <DetailSection title="Lease History">
            <ActivityFeed entityType="lease" entityId={id} title="Lease Events" limit={10} />
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

