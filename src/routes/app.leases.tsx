import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/keyhold/app-shell";
import { DataList } from "@/components/keyhold/data-list";
import { leases, unitById, cad } from "@/lib/mock-data";
import { Eye, PencilSimple, Archive, FileText } from "@phosphor-icons/react";
import { StatusLabel } from "@/components/keyhold/status";

export const Route = createFileRoute("/app/leases")({
  component: LeasesPage,
});

function LeasesPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader 
        title="Leases" 
        subtitle="Manage active tenancies and historical lease records."
      />
      
      <DataList
        name="Leases"
        items={leases}
        getId={(l) => l.id}
        columns={[
          { key: "unit", label: "Unit", value: (l) => unitById(l.unitId).label },
          { key: "type", label: "Type", value: (l) => l.type },
          { key: "start", label: "Start", value: (l) => l.start },
          { key: "end", label: "End", value: (l) => l.end },
          { key: "rent", label: "Rent", align: "right", value: (l) => l.rent, render: (l) => cad(l.rent) },
          { key: "status", label: "Status", value: () => "active", render: () => <StatusLabel status="active" /> },
        ]}
        rowActions={[
          { key: "view", label: "View lease", Icon: Eye, onSelect: (l) => navigate({ to: `/app/leases/${l.id}` as any }) },
          { key: "edit", label: "Edit terms", Icon: PencilSimple },
          { key: "archive", label: "Archive", Icon: Archive },
        ]}
        emptyIcon={FileText}
        emptyTitle="No leases found"
      />
      <Outlet />
    </>
  );
}

