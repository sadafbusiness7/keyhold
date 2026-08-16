import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FileText, Plus, Signature, Eye, ArrowsClockwise, Stamp, Trash, DoorOpen, Hourglass } from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageHeader } from "@/components/keyhold/app-shell";
import { LegalDisclaimer } from "@/components/keyhold/legal-ui";
import { DataList, type Column } from "@/components/keyhold/data-list";
import type { StatusKey } from "@/components/keyhold/status";
import { LeaseStatusTag } from "@/components/keyhold/lease-panels";
import { usePermissions } from "@/lib/mock-access";
import { displayStatus, monthlyTotal, statusLabel, useLeases, daysUntil, type LeaseRecord, type DisplayStatus } from "@/lib/mock-leases";
import { cad, longDate, unitAddress } from "@/lib/mock-data";

export const Route = createFileRoute("/app/leases/")({
  head: () => ({
    meta: [
      { title: "Leases — Keyhold" },
      { name: "description", content: "Every lease with its status, term, rent and end date. Filter to what expires in the next 90 days." },
      { property: "og:title", content: "Leases — Keyhold" },
      { property: "og:description", content: "Draft, out for signature, active, expiring soon or ended — the whole lease lifecycle." },
    ],
  }),
  component: LeasesPage,
});

const statusKey: Record<DisplayStatus, StatusKey> = {
  draft: "draft",
  "out-for-signature": "awaiting-approval",
  active: "occupied",
  expiring: "due-soon",
  ended: "cancelled",
};

function LeasesPage() {
  const navigate = useNavigate();
  const { leases: allLeases, renew, remove } = useLeases();
  const { units } = usePermissions();
  const [only90, setOnly90] = useState(false);

  const visible = useMemo(() => {
    const ids = new Set(units.map((u) => u.id));
    const scoped = allLeases.filter((l) => ids.has(l.unitId));
    return only90 ? scoped.filter((l) => displayStatus(l) === "expiring") : scoped;
  }, [allLeases, units, only90]);

  const expiringCount = useMemo(
    () => allLeases.filter((l) => displayStatus(l) === "expiring").length,
    [allLeases],
  );

  const open = (l: LeaseRecord) => navigate({ to: "/app/leases/$leaseId", params: { leaseId: l.id } });

  const columns: Column<LeaseRecord>[] = [
    {
      key: "tenant",
      label: "Tenant",
      locked: true,
      value: (l) => l.tenants.map((t) => t.name).filter(Boolean).join(", ") || "Unnamed",
      render: (l) => (
        <span className="flex min-w-0 items-center gap-2">
          <FileText weight="duotone" className="h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
          <span className="truncate font-display font-bold text-navy">
            {l.tenants.map((t) => t.name).filter(Boolean).join(", ") || "Unnamed draft"}
          </span>
        </span>
      ),
    },
    { key: "unit", label: "Home", value: (l) => unitAddress(l.unitId) },
    { key: "term", label: "Term", value: (l) => l.termType },
    { key: "start", label: "Starts", defaultHidden: true, value: (l) => l.startDate, render: (l) => <span className="tnum">{longDate(l.startDate)}</span> },
    { key: "end", label: "Ends", value: (l) => l.endDate, render: (l) => <span className="tnum">{longDate(l.endDate)}</span> },
    { key: "rent", label: "Rent", align: "right", value: (l) => monthlyTotal(l), render: (l) => <span className="money font-extrabold text-navy">{cad(monthlyTotal(l))}</span> },
    { key: "deposit", label: "Deposit held", align: "right", defaultHidden: true, value: (l) => l.deposit, render: (l) => <span className="money">{cad(l.deposit)}</span> },
    {
      key: "status",
      label: "Status",
      sortable: false,
      value: (l) => statusLabel[displayStatus(l)],
      render: (l) => <LeaseStatusTag status={displayStatus(l)} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Leases"
        subtitle="Creation, signature, renewal and move-out — the whole lifecycle in one list."
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/app/leases/sign" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-navy hover:bg-navy-soft">
              <Signature weight="duotone" className="h-5 w-5" aria-hidden="true" />
              Sign a document
            </Link>
            <Link to="/app/leases/wizard" search={{ leaseId: undefined }} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90">
              <Plus weight="duotone" className="h-5 w-5" aria-hidden="true" />
              New lease
            </Link>
          </div>
        }
      />

      <LegalDisclaimer
        className="mb-4"
        source={{ label: "Ontario Standard Lease (Form 2229E)", url: "https://www.ontario.ca/page/guide-ontarios-standard-lease", version: "2229E", effectiveDate: "2024-12-01" }}
      >
        Keyhold builds the lease from your records and keeps a signed copy with an audit trail. Confirm the current form
        and the rules for your province before you sign.
      </LegalDisclaimer>

      <DataList
        name="Leases"
        items={visible}
        getId={(l) => l.id}
        getStatus={(l) => statusKey[displayStatus(l)]}
        columns={columns}
        searchPlaceholder="Search leases by tenant, home or status"
        dateOf={(l) => l.endDate}
        toolbarExtra={
          <button
            type="button"
            onClick={() => setOnly90((v) => !v)}
            aria-pressed={only90}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold ${
              only90 ? "border-warning bg-warning-soft text-warning" : "border-border text-navy hover:bg-navy-soft"
            }`}
          >
            <Hourglass weight="duotone" className="h-4 w-4" aria-hidden="true" />
            Expiring in 90 days ({expiringCount})
          </button>
        }
        filters={[
          {
            key: "state",
            label: "Lease status",
            options: (["draft", "out-for-signature", "active", "expiring", "ended"] as DisplayStatus[]).map((s) => ({
              value: s,
              label: statusLabel[s],
            })),
            match: (l, v) => displayStatus(l) === v,
          },
          {
            key: "type",
            label: "Term",
            options: [
              { value: "Fixed term", label: "Fixed term" },
              { value: "Month-to-month", label: "Month-to-month" },
            ],
            match: (l, v) => l.termType === v,
          },
        ]}
        emptyIcon={FileText}
        emptyTitle="No leases yet"
        emptyBody="Start a guided lease and it will appear here as a draft."
        emptyAction={
          <Link to="/app/leases/wizard" search={{ leaseId: undefined }} className="inline-flex min-h-11 items-center rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90">
            Start a lease
          </Link>
        }
        rowActions={[
          { key: "view", label: "Open lease", Icon: Eye, onSelect: open },
          {
            key: "renew",
            label: "Renew",
            Icon: ArrowsClockwise,
            onSelect: (l) => {
              const created = renew(l.id, 12, l.rent);
              toast.success("Renewal drafted with the next term pre-filled.");
              navigate({ to: "/app/leases/wizard", search: { leaseId: created.id } });
            },
          },
          { key: "end", label: "End tenancy", Icon: DoorOpen, onSelect: open },
          { key: "notice", label: "Serve a notice", Icon: Stamp, onSelect: () => navigate({ to: "/app/notices" }) },
          {
            key: "delete",
            label: "Delete lease",
            Icon: Trash,
            destructive: true,
            confirm: (l) =>
              `Deleting this lease removes the signed terms, signature trail and deposit record for ${l.tenants[0]?.name ?? "this tenant"} for good. This cannot be undone.`,
            onSelect: (l) => {
              remove(l.id);
              toast.success("Lease deleted.");
            },
          },
        ]}
        quickView={(l) => ({
          title: l.tenants.map((t) => t.name).filter(Boolean).join(", ") || "Unnamed draft",
          subtitle: unitAddress(l.unitId),
          status: statusKey[displayStatus(l)],
          fields: [
            { label: "Status", value: statusLabel[displayStatus(l)] },
            { label: "Term", value: `${longDate(l.startDate)} – ${longDate(l.endDate)}` },
            { label: "Type", value: l.termType },
            { label: "Monthly total", value: <span className="money">{cad(monthlyTotal(l))}</span> },
            { label: "Deposit held", value: <span className="money">{cad(l.deposit)}</span> },
            { label: "Days to end", value: <span className="tnum">{daysUntil(l.endDate)}</span> },
          ],
          actions: (
            <Link
              to="/app/leases/$leaseId"
              params={{ leaseId: l.id }}
              className="inline-flex min-h-11 items-center rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90"
            >
              Open lease
            </Link>
          ),
        })}
      />
    </>
  );
}
