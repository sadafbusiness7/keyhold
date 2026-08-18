import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Key, Buildings } from "@phosphor-icons/react";
import { usePermissions } from "@/lib/mock-access";
import { LeasesProvider } from "@/lib/mock-leases";
import { OperationsProvider } from "@/lib/mock-operations";
import { DemoSwitcher } from "@/components/keyhold/demo-switcher";
import { AccountMenu } from "@/components/keyhold/account-menu";
import { EmptyState } from "@/components/keyhold/empty-state";
import {
  OwnerDashboard,
  OwnerDocuments,
  OwnerProperties,
  OwnerReports,
  OwnerStatements,
  useOwnerTabs,
  type OwnerTab,
} from "@/components/keyhold/owner-portal";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Owner portal — Keyhold" },
      {
        name: "description",
        content: "See your properties, monthly disbursement statements, shared documents and income reports — read-only, controlled by your manager.",
      },
      { property: "og:title", content: "Owner portal — Keyhold" },
      { property: "og:description", content: "Statements, occupancy and shared documents for the properties managed on your behalf." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
      <LeasesProvider>
        <OperationsProvider>
          <OwnerPortal />
        </OperationsProvider>
      </LeasesProvider>
  ),
});

function OwnerPortal() {
  const perms = usePermissions();
  const tabs = useOwnerTabs();
  const [tab, setTab] = useState<OwnerTab>("dashboard");

  const allowed = tabs.some((t) => t.id === tab) ? tab : "dashboard";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-sidebar px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 text-navy">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-primary-foreground">
              <Key weight="duotone" className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-base font-extrabold">Keyhold · Owner</span>
          </Link>
          <AccountMenu />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-5">
        {!perms.isOwnerClient ? (
          <EmptyState
            Icon={Buildings}
            title="This area is for property owners"
            body="Switch to an owner account with the demo switcher, or head back to the management app."
          >
            <Link
              to="/app"
              className="inline-flex min-h-11 items-center rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
            >
              Open the app
            </Link>
          </EmptyState>
        ) : perms.properties.length === 0 ? (
          <EmptyState
            Icon={Buildings}
            title="No properties shared with you yet"
            body="Your manager decides which properties and sections appear in your portal. You'll see them here as soon as access is granted."
          />
        ) : (
          <>
            <h1 className="font-display text-2xl font-extrabold text-navy">Your portfolio</h1>
            <p className="mb-4 text-sm text-muted-foreground">
              Read-only. {perms.properties.length} propert{perms.properties.length === 1 ? "y" : "ies"} managed on your behalf.
            </p>

            <div role="tablist" aria-label="Owner portal sections" className="mb-5 flex flex-wrap gap-2">
              {tabs.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={allowed === id}
                  onClick={() => setTab(id)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
                    allowed === id ? "bg-navy text-primary-foreground" : "border border-border text-navy hover:bg-navy-soft"
                  }`}
                >
                  <Icon weight="duotone" className="h-5 w-5" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>

            {allowed === "dashboard" && <OwnerDashboard />}
            {allowed === "statements" && <OwnerStatements />}
            {allowed === "properties" && <OwnerProperties />}
            {allowed === "documents" && <OwnerDocuments />}
            {allowed === "reports" && <OwnerReports />}
          </>
        )}
      </main>

      <div className="fixed bottom-4 right-4 z-[9997]">
        <DemoSwitcher />
      </div>
    </div>
  );
}
