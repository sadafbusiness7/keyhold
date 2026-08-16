import { createFileRoute, Link } from "@tanstack/react-router";
import { Buildings, Plus, Eye, PencilSimple, Copy, Archive, Trash, House, UploadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageHeader } from "@/components/keyhold/app-shell";
import { DataList, notWired, type Column } from "@/components/keyhold/data-list";
import { StatusLabel } from "@/components/keyhold/status";
import { tenantById, cad, longDate, type Unit } from "@/lib/mock-data";
import { usePermissions } from "@/lib/mock-access";
import { ActivityFeed } from "@/components/keyhold/activity-feed";
import { AddTenantChooser } from "@/components/keyhold/add-tenant-chooser";

export const Route = createFileRoute("/app/properties")({
  head: () => ({
    meta: [
      { title: "Properties & units — Keyhold" },
      { name: "description", content: "Every home you own, who lives there, the rent and when the lease ends." },
      { property: "og:title", content: "Properties & units — Keyhold" },
      { property: "og:description", content: "Your duplexes, suites and townhomes in one calm list." },
    ],
  }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const navigate = Route.useNavigate();
  const { properties, units, canSeeFinancials, canSeeTenantSensitive, isOwner } = usePermissions();

  const propName = (id: string) => properties.find((p) => p.id === id)?.name ?? "—";

  const columns: Column<Unit>[] = [
    { key: "label", label: "Unit", locked: true, value: (u) => u.label, render: (u) => (
      <Link to={`/app/units/${u.id}` as any} className="font-display font-bold text-navy hover:underline">{u.label}</Link>
    ) },

    { key: "property", label: "Property", value: (u) => propName(u.propertyId) },
    { key: "kind", label: "Type", value: (u) => u.kind },
    { key: "tenant", label: "Who lives here", value: (u) => {
        const t = tenantById(u.tenantId);
        return t ? (canSeeTenantSensitive(u.propertyId) ? t.name : "Occupied") : "Nobody yet";
      } },
    { key: "rent", label: "Rent", align: "right", value: (u) => (canSeeFinancials(u.propertyId) ? u.rent : 0),
      render: (u) =>
        canSeeFinancials(u.propertyId) ? (
          <span className="money font-extrabold text-navy">{cad(u.rent)}</span>
        ) : (
          <span className="text-muted-foreground">Hidden</span>
        ) },
    { key: "leaseEnd", label: "Lease ends", value: (u) => u.leaseEnd ?? "",
      render: (u) => <span className="tnum text-sm">{u.leaseEnd ? longDate(u.leaseEnd) : "Available now"}</span> },
    { key: "status", label: "Status", sortable: false, value: (u) => (u.tenantId ? "Lived in" : "Empty"),
      render: (u) => <StatusLabel status={u.tenantId ? "occupied" : "vacant"} /> },
    { key: "bedrooms", label: "Bedrooms", defaultHidden: true, align: "right", value: (u) => u.bedrooms },
  ];

  return (
    <>
      <PageHeader
        title="Properties & units"
        subtitle={
          isOwner
            ? "Every unit across your properties, searchable and sortable."
            : "Only the properties you've been given access to."
        }
        action={
          canSeeTenantSensitive() ? (
            <div className="flex flex-wrap gap-2">
            <AddTenantChooser trigger="outline" />
            <Link
              to="/app/import"
              search={{ entity: "properties" as const }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
            >
              <UploadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" />
              Import data
            </Link>
            <Link
              to="/app/leases/new"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
            >
              <Plus weight="duotone" className="h-5 w-5" aria-hidden="true" />
              Add a lease
            </Link>
            </div>
          ) : null
        }
      />

      <DataList
        name="Units"
        items={units}
        getId={(u) => u.id}
        getStatus={(u) => (u.tenantId ? "occupied" : "vacant")}
        columns={columns}
        searchPlaceholder="Search units, tenants, addresses"
        dateOf={(u) => u.leaseEnd}
        filters={[
          {
            key: "occupancy",
            label: "Occupancy",
            options: [
              { value: "occupied", label: "Lived in" },
              { value: "vacant", label: "Empty" },
            ],
            match: (u, v) => (v === "occupied" ? Boolean(u.tenantId) : !u.tenantId),
          },
          {
            key: "property",
            label: "Property",
            options: properties.map((p) => ({ value: p.id, label: p.name })),
            match: (u, v) => u.propertyId === v,
          },
        ]}
        emptyIcon={Buildings}
        emptyTitle="No properties assigned yet"
        emptyBody="Ask the owner to give you access to the properties you look after."
        quickView={(u) => {
          const t = tenantById(u.tenantId);
          return {
            title: u.label,
            subtitle: `${propName(u.propertyId)} · ${u.kind}`,
            status: u.tenantId ? "occupied" : "vacant",
            fields: [
              { label: "Who lives here", value: t ? (canSeeTenantSensitive(u.propertyId) ? t.name : "Occupied") : "Nobody yet" },
              { label: "Bedrooms", value: String(u.bedrooms) },
              { label: "Rent", value: canSeeFinancials(u.propertyId) ? cad(u.rent) : "Hidden" },
              { label: "Lease ends", value: u.leaseEnd ? longDate(u.leaseEnd) : "Available now" },
            ],
            actions: (
              <>
                {!u.tenantId ? <AddTenantChooser label="Add tenant to this unit" /> : null}
                <Link
                  to="/app/leases"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90"
                >
                  View lease
                </Link>
                <button
                  type="button"
                  onClick={() => notWired("Edit unit")}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
                >
                  <PencilSimple weight="duotone" className="h-4 w-4" aria-hidden="true" />
                  Edit unit
                </button>
              </>
            ),
            extra: <ActivityFeed entityType="unit" entityId={u.id} title="Unit activity" />,
          };
        }}
        rowActions={[
          { key: "view", label: "View unit", Icon: Eye, onSelect: (u) => navigate({ to: `/app/units/${u.id}` as any }) },
          { key: "edit", label: "Edit unit", Icon: PencilSimple },
          { key: "duplicate", label: "Duplicate unit", Icon: Copy },
          { key: "listing", label: "Create listing", Icon: House, onSelect: () => toast.success("Opening the listing builder…") },
          { key: "archive", label: "Archive unit", Icon: Archive },
          {
            key: "delete",
            label: "Delete unit",
            Icon: Trash,
            destructive: true,
            confirm: (u) =>
              `Deleting ${u.label} removes its lease, rent history and documents for good. This cannot be undone.`,
          },
        ]}
      />
    </>
  );
}
