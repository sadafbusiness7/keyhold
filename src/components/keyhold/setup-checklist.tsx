/**
 * Persistent setup checklist. Hidden once every step is done (or dismissed).
 * Renders nothing until the store has hydrated, so SSR markup stays stable.
 */
import { Link } from "@tanstack/react-router";
import { CheckCircle, Circle, X, ListChecks } from "@phosphor-icons/react";
import { checklistItems, useOptionalSetup } from "@/lib/mock-onboarding";
import { usePermissions } from "@/lib/mock-access";

export function SetupChecklist({ onNavigate }: { onNavigate?: () => void }) {
  const store = useOptionalSetup();
  const { isOwner } = usePermissions();
  if (!store || !store.hydrated || !isOwner) return null;

  const { setup, dismissChecklist } = store;
  const items = checklistItems(setup);
  const done = items.filter((i) => i.done).length;
  if (setup.dismissedChecklist || done === items.length) return null;

  return (
    <div className="mx-3 mb-2 rounded-xl border border-sidebar-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-navy">
          <ListChecks weight="duotone" className="h-4 w-4" aria-hidden="true" />
          Finish setting up
        </p>
        <button
          type="button"
          onClick={dismissChecklist}
          className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-navy-soft"
          aria-label="Hide the setup checklist"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={items.length}
        aria-valuenow={done}
        aria-label={`${done} of ${items.length} setup steps done`}
      >
        <div
          className="h-full rounded-full bg-action transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${(done / items.length) * 100}%` }}
        />
      </div>
      <p className="tnum mt-1 text-xs text-muted-foreground">
        {done} of {items.length} done
      </p>

      <ul className="mt-2 space-y-0.5">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              to={item.to}
              onClick={onNavigate}
              className="flex min-h-9 items-center gap-2 rounded-lg px-1.5 py-1 text-xs hover:bg-navy-soft"
            >
              {item.done ? (
                <CheckCircle weight="fill" className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <span className={item.done ? "text-muted-foreground line-through" : "font-medium text-navy"}>
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
