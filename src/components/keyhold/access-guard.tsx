import type { ReactNode } from "react";
import { ShieldCheck } from "@phosphor-icons/react";
import { EmptyState } from "./empty-state";
import { PageHeader } from "./app-shell";
import { usePermissions } from "@/lib/mock-access";

/** Single gate for screens that need money / tenant-sensitive access. */
export function RequireFinancials({ title, children }: { title: string; children: ReactNode }) {
  const { canSeeFinancials } = usePermissions();
  if (canSeeFinancials()) return <>{children}</>;
  return (
    <>
      <PageHeader title={title} />
      <EmptyState
        Icon={ShieldCheck}
        title="Not part of your access"
        body="Your access level covers day-to-day work only. Ask the owner if you need rent, reports or tenant details."
      />
    </>
  );
}
