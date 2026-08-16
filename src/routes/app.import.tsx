import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { ShieldCheck } from "@phosphor-icons/react";
import { PageHeader } from "@/components/keyhold/app-shell";
import { EmptyState } from "@/components/keyhold/empty-state";
import { ImportWizard } from "@/components/keyhold/import-wizard";
import { usePermissions } from "@/lib/mock-access";
import { ENTITY_ORDER, type EntityKey } from "@/lib/import-engine";

type Search = { entity?: EntityKey };

export const Route = createFileRoute("/app/import")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const e = search["entity"];
    return typeof e === "string" && (ENTITY_ORDER as string[]).includes(e) ? { entity: e as EntityKey } : {};
  },
  head: () => ({
    meta: [
      { title: "Import your data — Keyhold" },
      { name: "description", content: "Bring your properties, units, tenants, leases and rent history over from a spreadsheet in a few guided steps." },
      { property: "og:title", content: "Import your data — Keyhold" },
      { property: "og:description", content: "Upload a CSV or Excel file, map your columns, fix any rows, and you're moved in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImportPage,
});

function ImportPage() {
  const { canSeeTenantSensitive, isOwner } = usePermissions();
  const search = useSearch({ from: "/app/import" });

  if (!isOwner && !canSeeTenantSensitive()) {
    return (
      <>
        <PageHeader title="Import data" />
        <EmptyState
          Icon={ShieldCheck}
          title="Importing is owner-only"
          body="Ask the owner of this account to bring the data over."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Import your data"
        subtitle="Bring your spreadsheet over. We'll check every row before anything is created — and you can undo it."
        action={
          <Link
            to="/app/onboarding"
            className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            Guided setup instead
          </Link>
        }
      />
      <ImportWizard initialEntity={search.entity ?? "properties"} />
    </>
  );
}
