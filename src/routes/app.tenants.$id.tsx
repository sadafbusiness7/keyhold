import { createFileRoute, useParams, useSearch } from "@tanstack/react-router";
import { DetailBreadcrumbs, DetailHeader, DetailTabs } from "@/components/keyhold/detail-layout";
import { tenants } from "@/lib/mock-data";
import { ActivityFeed } from "@/components/keyhold/activity-feed";

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
  const tenant = tenants.find(t => t.id === id);

  if (!tenant) return <div>Tenant not found</div>;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "lease", label: "Lease" },
    { key: "ledger", label: "Ledger" },
    { key: "maintenance", label: "Maintenance" },
    { key: "messages", label: "Messages" },
    { key: "activity", label: "Activity" },
  ];

  return (
    <div>
      <DetailBreadcrumbs items={[{ label: "Tenants", to: "/app/tenants" }, { label: tenant.name }]} />
      
      <DetailHeader 
        title={tenant.name} 
        subtitle={tenant.email}
        stats={[
          { label: "Phone", value: tenant.phone },
          { label: "Moved In", value: tenant.movedIn },
        ]}
      />

      <DetailTabs 
        tabs={tabs} 
        activeTab={tab} 
        onTabChange={(key) => navigate({ search: { tab: key } })} 
      />

      <div className="mt-6">
        {tab === "overview" && <div>Tenant contact info</div>}
        {tab === "activity" && <ActivityFeed entityType="tenant" entityId={id} />}
      </div>
    </div>
  );
}
