/**
 * Duplicate warning strip. Never blocks the form — it offers "use existing"
 * or "create anyway", and records which the user chose.
 */
import { Warning } from "@phosphor-icons/react";
import type { DuplicateHit } from "@/lib/duplicate-detection";

export function DuplicateWarning<T>({
  hits,
  noun,
  onUseExisting,
  onCreateAnyway,
  acknowledged,
  className = "",
}: {
  hits: DuplicateHit<T>[];
  noun: string;
  onUseExisting?: (hit: DuplicateHit<T>) => void;
  onCreateAnyway?: () => void;
  acknowledged?: boolean;
  className?: string;
}) {
  if (!hits.length) return null;
  const exact = hits.some((h) => h.confidence === "exact");

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-2xl border p-4 ${exact ? "border-warning bg-warning-soft" : "border-border bg-surface-sunk"} ${className}`}
    >
      <p className="flex items-center gap-2 font-display text-sm font-extrabold text-navy">
        <Warning weight="duotone" className="h-5 w-5 text-warning" aria-hidden="true" />
        {exact ? `This ${noun} may already exist` : `Similar ${noun} found`}
      </p>
      <ul className="mt-2 space-y-2">
        {hits.slice(0, 4).map((hit, i) => (
          <li key={i} className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{hit.reason}</span>
            {onUseExisting && (
              <button
                type="button"
                onClick={() => onUseExisting(hit)}
                className="inline-flex min-h-9 items-center rounded-full border border-border bg-card px-3 text-xs font-semibold text-navy hover:bg-navy-soft"
              >
                Use existing
              </button>
            )}
          </li>
        ))}
      </ul>
      {onCreateAnyway && (
        <button
          type="button"
          onClick={onCreateAnyway}
          aria-pressed={acknowledged}
          className={`mt-3 inline-flex min-h-9 items-center rounded-full px-3 text-xs font-semibold ${
            acknowledged ? "bg-navy text-primary-foreground" : "border border-border bg-card text-navy hover:bg-navy-soft"
          }`}
        >
          {acknowledged ? "Creating anyway — confirmed" : "Create anyway"}
        </button>
      )}
    </div>
  );
}