import type { ReactNode } from "react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { useTx } from "@/lib/i18n";

/**
 * Branded empty state: warm dot-grid texture so blank areas feel designed.
 * Styling only — no data or behaviour.
 */
export function EmptyState({
  Icon,
  title,
  body,
  children,
  className = "",
}: {
  Icon: PhosphorIcon;
  title: string;
  body?: string;
  children?: ReactNode;
  className?: string;
}) {
  const tx = useTx();
  return (
    <div
      className={`texture-panel flex flex-col items-center rounded-2xl border border-border px-6 py-10 text-center ${className}`}
    >
      <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-card text-navy shadow-sm">
        <Icon weight="duotone" className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="relative mt-3 font-display text-base font-bold text-navy">{tx(title)}</p>
      {body ? <p className="relative mt-1 max-w-sm text-sm text-muted-foreground">{tx(body)}</p> : null}
      {children ? <div className="relative mt-4">{children}</div> : null}
    </div>
  );
}
