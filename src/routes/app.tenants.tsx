import { RequireFinancials } from "@/components/keyhold/access-guard";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, EnvelopeSimple, Phone, Stamp, Eye, PencilSimple, Archive, SignOut, Trash, PaperPlaneTilt, DownloadSimple, UploadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageHeader } from "@/components/keyhold/app-shell";
import { DataList, notWired, type Column } from "@/components/keyhold/data-list";
import { ActivityFeed } from "@/components/keyhold/activity-feed";
import { StatusLabel } from "@/components/keyhold/status";
import { tenants, unitAddress, rentRows, cad, longDate, type Tenant } from "@/lib/mock-data";
import { useNotices } from "@/lib/mock-notices";
import { AddTenantChooser, TenantsHelperLine } from "@/components/keyhold/add-tenant-chooser";

export const Route = createFileRoute("/app/tenants")({
  head: () => ({
    meta: [
      { title: "Tenants — Keyhold" },
      { name: "description", content: "Everyone living in your homes, with rent status and contact details." },
      { property: "og:title", content: "Tenants — Keyhold" },
      { property: "og:description", content: "Contact details and rent status for every tenant." },
    ],
  }),
  component: TenantsPage,
});

function TenantsPage() {
  return (
    <RequireFinancials title="Tenants">
      <TenantsPageInner />
    </RequireFinancials>
  );
}

const rentOf = (t: Tenant) => rentRows.find((r) => r.tenantId === t.id);

function TenantsPageInner() {
  const { noticesForTenant } = useNotices();

  const columns: Column<Tenant>[] = [
    { key: "name", label: "Tenant", locked: true, value: (t) => t.name,
      render: (t) => <span className="font-display font-bold text-navy">{t.name}</span> },
    { key: "unit", label: "Home", value: (t) => unitAddress(t.unitId) },
    { key: "rent", label: "Rent", align: "right", value: (t) => rentOf(t)?.rent ?? 0,
      render: (t) => <span className="money font-extrabold text-navy">{cad(rentOf(t)?.rent ?? 0)}</span> },
    { key: "status", label: "Rent status", sortable: false, value: (t) => rentOf(t)?.status ?? "paid",
      render: (t) => <StatusLabel status={rentOf(t)?.status ?? "paid"} /> },
    { key: "movedIn", label: "Moved in", value: (t) => t.movedIn, render: (t) => <span className="tnum">{longDate(t.movedIn)}</span> },
    { key: "email", label: "Email", defaultHidden: true, value: (t) => t.email },
    { key: "phone", label: "Phone", defaultHidden: true, value: (t) => t.phone },
  ];

  return (
    <>
      <PageHeader
        title="Tenants"
        subtitle="The people living in your homes."
        action={
          <div className="flex flex-wrap items-center gap-2">
          <AddTenantChooser />
          <Link
            to="/app/import"
            search={{ entity: "tenants" as const }}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            <UploadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" />
            Import tenants
          </Link>
          </div>
        }
      />
      <TenantsHelperLine />
      <DataList
        name="Tenants"
        items={tenants}
        getId={(t) => t.id}
        getStatus={(t) => rentOf(t)?.status}
        columns={columns}
        searchPlaceholder="Search by name, home, email"
        dateOf={(t) => t.movedIn}
        filters={[
          {
            key: "status",
            label: "Rent status",
            options: [
              { value: "paid", label: "Paid" },
              { value: "due-soon", label: "Due soon" },
              { value: "partial", label: "Part paid" },
              { value: "overdue", label: "Overdue" },
            ],
            match: (t, v) => rentOf(t)?.status === v,
          },
        ]}
        emptyIcon={Users}
        emptyTitle="No tenants yet"
        emptyBody="Tenants appear here once they have a lease. Start a new tenancy from Leases, or add someone who's already renting."
        emptyAction={<AddTenantChooser />}
        bulkActions={[
          { key: "email", label: "Email", Icon: EnvelopeSimple, onSelect: (rows) => toast.success(`Draft started for ${rows.length} tenants`) },
          { key: "invite", label: "Invite to portal", Icon: PaperPlaneTilt },
          { key: "export", label: "Export", Icon: DownloadSimple },
          {
            key: "end",
            label: "End tenancy",
            Icon: SignOut,
            destructive: true,
            confirm: (rows) => `${rows.length} tenancies will be ended: invoices stop, portal access is switched off, and the units become empty.`,
          },
        ]}
        rowActions={[
          { key: "view", label: "View tenant", Icon: Eye },
          { key: "edit", label: "Edit details", Icon: PencilSimple },
          { key: "notice", label: "Serve a notice", Icon: Stamp, onSelect: () => toast.success("Opening the notice builder…") },
          { key: "archive", label: "Archive", Icon: Archive },
          {
            key: "end",
            label: "End tenancy",
            Icon: SignOut,
            destructive: true,
            confirm: (t) => `Ending ${t.name}'s tenancy stops future invoices and turns off their portal access.`,
          },
          {
            key: "delete",
            label: "Delete tenant",
            Icon: Trash,
            destructive: true,
            confirm: (t) => `${t.name} and their payment history will be permanently removed. This cannot be undone.`,
          },
        ]}
        quickView={(t) => {
          const rent = rentOf(t);
          const history = noticesForTenant(t.id);
          return {
            title: t.name,
            subtitle: unitAddress(t.unitId),
            status: rent?.status,
            fields: [
              { label: "Rent", value: <span className="money">{cad(rent?.rent ?? 0)}</span> },
              { label: "Balance", value: <span className="money">{cad(rent?.balance ?? 0)}</span> },
              { label: "Moved in", value: longDate(t.movedIn) },
              { label: "Email", value: <a className="text-action" href={`mailto:${t.email}`}>{t.email}</a> },
              { label: "Phone", value: <a className="text-action" href={`tel:${t.phone.replace(/[^\d]/g, "")}`}>{t.phone}</a> },
              { label: "Notices on file", value: `${history.length}` },
            ],
            actions: (
              <>
                <Link to="/app/messages" className="inline-flex min-h-11 items-center rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90">
                  Message
                </Link>
                <a href={`mailto:${t.email}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
                  <EnvelopeSimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> Email
                </a>
                <a href={`tel:${t.phone.replace(/[^\d]/g, "")}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
                  <Phone weight="duotone" className="h-4 w-4" aria-hidden="true" /> Call
                </a>
                <Link to="/app/notices" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
                  <Stamp weight="duotone" className="h-4 w-4" aria-hidden="true" /> Notices
                </Link>
                <button type="button" onClick={() => notWired("Edit tenant")} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
                  <PencilSimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> Edit
                </button>
              </>
            ),
            extra: <ActivityFeed entityType="tenant" entityId={t.id} title="Tenant activity" />,
          };
        }}
      />
    </>
  );
}
