import { createFileRoute, useParams, useSearch } from "@tanstack/react-router";
import { DetailBreadcrumbs, DetailHeader, DetailTabs } from "@/components/keyhold/detail-layout";
import { unitById, propertyById, cad } from "@/lib/mock-data";
import { ActivityFeed } from "@/components/keyhold/activity-feed";
import { StatusLabel } from "@/components/keyhold/status";

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

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "tenancies", label: "Tenancies" },
    { key: "rent", label: "Rent history" },
    { key: "maintenance", label: "Maintenance" },
    { key: "assets", label: "Assets" },
    { key: "activity", label: "Activity" },
  ];

  return (
    <div>
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
        status={<StatusLabel status={unit.tenantId ? "occupied" : "vacant"} />}
        stats={[
          { label: "Monthly Rent", value: cad(unit.rent) },
          { label: "Bedrooms", value: String(unit.bedrooms) },
        ]}
      />

      <DetailTabs 
        tabs={tabs} 
        activeTab={tab} 
        onTabChange={(key) => navigate({ search: { tab: key } })} 
      />

      <div className="mt-6">
        {tab === "overview" && <div>Unit overview</div>}
        {tab === "activity" && <ActivityFeed entityType="unit" entityId={id} />}
      </div>
    </div>
  );
}
