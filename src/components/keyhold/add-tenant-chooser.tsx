import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { UserPlus, FilePlus, ArrowRight, X } from "@phosphor-icons/react";
import { useModalA11y } from "@/lib/use-modal-a11y";

/**
 * The two legitimate ways a tenant can enter Keyhold.
 * Presentation only — the routes it links to own the actual creation.
 */
const paths = [
  {
    key: "new",
    to: "/app/leases/wizard" as const,
    Icon: FilePlus,
    title: "New tenancy — create a lease",
    help: "Build the lease step by step. The tenant is created when the lease is signed and activated.",
  },
  {
    key: "existing",
    to: "/app/add-tenant" as const,
    Icon: UserPlus,
    title: "Existing tenant — already renting",
    help: "Short form: property, unit, tenant details, term, rent and deposit. Upload their signed lease and both records are created right away.",
  },
];

export function AddTenantChooser({
  trigger = "solid",
  label = "Add tenant",
}: {
  trigger?: "solid" | "outline";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const closeChooser = useCallback(() => setOpen(false), []);
  const dialogRef = useModalA11y<HTMLDivElement>(closeChooser, open);

  const cls =
    trigger === "solid"
      ? "bg-action text-primary-foreground hover:bg-action/90"
      : "border border-border text-navy hover:bg-navy-soft";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${cls}`}
      >
        <UserPlus weight="duotone" className="h-4 w-4" aria-hidden="true" />
        {label}
      </button>
      {open && mounted
        ? createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 p-0 sm:items-center sm:p-6"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Add a tenant"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-xl rounded-t-2xl border border-border bg-card p-5 shadow-xl sm:rounded-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-extrabold text-navy">How is this tenant joining?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick the one that matches their situation — both end with a tenant and a lease on file.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full border border-border p-2 text-navy hover:bg-navy-soft"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {paths.map((p) => (
                <Link
                  key={p.key}
                  to={p.to}
                  onClick={() => setOpen(false)}
                  className="group flex items-start gap-3 rounded-xl border border-border p-4 text-start hover:border-action hover:bg-action-soft/40"
                >
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-soft text-navy">
                    <p.Icon weight="duotone" className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-sm font-bold text-navy">{p.title}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{p.help}</span>
                  </span>
                  <ArrowRight
                    weight="bold"
                    className="mt-2 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-action rtl:rotate-180"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )
        : null}
    </>
  );
}

export function TenantsHelperLine({ children }: { children?: ReactNode }) {
  return (
    <p className="mb-4 rounded-xl border border-border bg-navy-soft/50 px-4 py-3 text-sm text-muted-foreground">
      {children ?? (
        <>
          Tenants appear here once they have a lease. Start a new tenancy from{" "}
          <Link to="/app/leases" className="font-semibold text-action underline-offset-2 hover:underline">
            Leases
          </Link>
          , or add someone who&rsquo;s already renting.
        </>
      )}
    </p>
  );
}
