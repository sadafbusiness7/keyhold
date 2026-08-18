import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { Key } from "@phosphor-icons/react";
import { AppShell } from "@/components/keyhold/app-shell";
import { EmptyState } from "@/components/keyhold/empty-state";
import { usePermissions } from "@/lib/mock-access";
import { MessagesProvider } from "@/lib/mock-messages";
import { LeasesProvider } from "@/lib/mock-leases";
import { SettingsProvider } from "@/lib/mock-settings";
import { SetupProvider } from "@/lib/mock-onboarding";
import { OperationsProvider } from "@/lib/mock-operations";
import { RenewalsProvider } from "@/lib/mock-renewals";
import { NotificationsProvider } from "@/lib/mock-notifications";
import { FormsProvider } from "@/lib/mock-forms";

export const Route = createFileRoute("/app")({
  component: () => (
      <MessagesProvider>
        <LeasesProvider>
          <SettingsProvider>
            <SetupProvider>
              <OperationsProvider>
                <RenewalsProvider>
                <NotificationsProvider>
                <FormsProvider>
                <AppShell>
                  <Gate />
                </AppShell>
                </FormsProvider>
                </NotificationsProvider>
                </RenewalsProvider>
              </OperationsProvider>
            </SetupProvider>
          </SettingsProvider>
        </LeasesProvider>
      </MessagesProvider>
  ),
});

/** Tenants never see the management app — they belong in the portal. */
function Gate() {
  const { isTenant, isOwnerClient } = usePermissions();
  if (isOwnerClient) {
    return (
      <EmptyState
        Icon={Key}
        title="This area is for managers"
        body="Your statements, properties and shared documents live in your owner portal."
      >
        <Link
          to="/owner"
          className="inline-flex min-h-11 items-center rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
        >
          Open my owner portal
        </Link>
      </EmptyState>
    );
  }
  if (isTenant) {
    return (
      <EmptyState
        Icon={Key}
        title="This area is for owners and managers"
        body="Your rent, lease, receipts and repair requests all live in your tenant portal."
      >
        <Link
          to="/portal"
          className="inline-flex min-h-11 items-center rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
        >
          Open my portal
        </Link>
      </EmptyState>
    );
  }
  return <Outlet />;
}
