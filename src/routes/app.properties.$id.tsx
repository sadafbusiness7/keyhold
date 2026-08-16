import { createFileRoute, Outlet, useParams, useSearch } from "@tanstack/react-router";
import { DetailBreadcrumbs, DetailHeader, DetailTabs } from "@/components/keyhold/detail-layout";
import { propertyById } from "@/lib/mock-data";
import { ActivityFeed } from "@/components/keyhold/activity-feed";

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

  if (!property) return <div>Property not found</div>;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "units", label: "Units" },
    { key: "financials", label: "Financials" },
    { key: "maintenance", label: "Maintenance" },
    { key: "documents", label: "Documents" },
    { key: "activity", label: "Activity log" },
  ];

  return (
    <div>
      <DetailBreadcrumbs items={[{ label: "Properties", to: "/app/properties" }, { label: property.name }]} />
      
      <DetailHeader 
        title={property.name} 
        subtitle={property.address}
        stats={[
          { label: "Type", value: property.kind },
          { label: "Occupancy", value: "92%" },
          { label: "Monthly Income", value: "CA$14,200" },
        ]}
      />

      <DetailTabs 
        tabs={tabs} 
        activeTab={tab} 
        onTabChange={(key) => navigate({ search: { tab: key } })} 
      />

      <div className="mt-6">
        {tab === "overview" && <div>Overview content</div>}
        {tab === "units" && <div>Units list</div>}
        {tab === "financials" && <div>Financial charts</div>}
        {tab === "maintenance" && <div>Maintenance tickets</div>}
        {tab === "activity" && <ActivityFeed entityType="property" entityId={id} />}
      </div>
    </div>
  );
}
