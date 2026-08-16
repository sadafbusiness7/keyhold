/**
 * ACTIVITY FEED — the defensible record.
 * A per-record timeline: who did what, when, and what changed (before -> after).
 */
import { useState } from "react";
import { ClockCounterClockwise, ArrowRight } from "@phosphor-icons/react";
import { useOptionalNotifications } from "@/lib/mock-notifications";
import { clockTime, dayLabel, groupByDay, relativeTime, type EntityType } from "@/lib/activity-engine";

export function ActivityFeed({
  entityType,
  entityId,
  title = "Activity",
  limit = 5,
}: {
  entityType: EntityType;
  entityId: string;
  title?: string;
  limit?: number;
}) {
  const store = useOptionalNotifications();
  const [expanded, setExpanded] = useState(false);
  if (!store) return null;

  const rows = store.activityFor(entityType, entityId);
  const shown = expanded ? rows : rows.slice(0, limit);
  const groups = groupByDay(shown);

  return (
    <section aria-label={title} className="rounded-2xl border border-border bg-card p-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-navy">
          <ClockCounterClockwise weight="duotone" className="h-4.5 w-4.5" aria-hidden="true" />
          {title}
        </h3>
        {rows.length > limit && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="min-h-11 rounded-full px-2.5 text-xs font-semibold text-action hover:bg-action-soft"
          >
            {expanded ? "Show less" : `Show all ${rows.length}`}
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Nothing recorded yet. Every change made here is logged with who did it and when.
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.key}>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {dayLabel(g.key)}
              </p>
              <ol className="space-y-2.5 border-l border-border pl-3.5">
                {g.items.map((a) => (
                  <li key={a.id} className="relative">
                    <span
                      className="absolute -left-[1.19rem] top-1.5 h-2 w-2 rounded-full bg-navy"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-semibold text-navy">{a.action}</p>
                    {a.detail && <p className="text-xs text-muted-foreground">{a.detail}</p>}
                    {a.field && (
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-semibold text-navy">{a.field}:</span>
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground line-through">
                          {a.before ?? "—"}
                        </span>
                        <ArrowRight weight="bold" className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                        <span className="rounded-md bg-action-soft px-1.5 py-0.5 font-semibold text-action">
                          {a.after ?? "—"}
                        </span>
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {a.actorName} · <time dateTime={a.at}>{clockTime(a.at)}</time> · {relativeTime(a.at)}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
