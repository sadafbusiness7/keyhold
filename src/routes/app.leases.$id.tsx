import { createFileRoute, useParams, useSearch } from "@tanstack/react-router";
import { DetailBreadcrumbs, DetailHeader, DetailTabs } from "@/components/keyhold/detail-layout";
import { leases, cad } from "@/lib/mock-data";
import { ActivityFeed } from "@/components/keyhold/activity-feed";
import { StatusLabel } from "@/components/keyhold/status";

export const Route = createFileRoute("/app/leases/$id")({
  component: LeaseDetailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search["tab"] as string) || "overview",
  }),
});

function LeaseDetailPage() {
  const { id } = useParams({ from: "/app/leases/$id" });
  const { tab } = useSearch({ from: "/app/leases/$id" });
  const navigate = Route.useNavigate();
  const lease = leases.find(l => l.id === id);

  if (!lease) return <div>Lease not found</div>;

  const tabs = [
    { key: "terms", label: "Terms" },
    { key: "tenants", label: "Tenants" },
    { key: "invoices", label: "Invoices" },
    { key: "activity", label: "Activity" },
  ];

  return (
    <div>
      <DetailBreadcrumbs items={[{ label: "Leases", to: "/app/leases" as any }, { label: `Lease ${lease.id}` }]} />
      
      <DetailHeader 
        title={`Lease ${lease.id}`} 
        subtitle={`${lease.type} · ${lease.start} to ${lease.end}`}
        status={<StatusLabel status="paid" />}
        stats={[
          { label: "Monthly Rent", value: cad(lease.rent) },
          { label: "Deposit Held", value: cad(lease.depositHeld) },
        ]}
      />

      <DetailTabs 
        tabs={tabs} 
        activeTab={tab} 
        onTabChange={(key) => navigate({ search: { tab: key } })} 
      />

      <div className="mt-6">
        {tab === "terms" && <div>Lease terms and clauses</div>}
        {tab === "activity" && <ActivityFeed entityType="lease" entityId={id} />}
      </div>
    </div>
  );
}
