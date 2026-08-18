import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Wrench,
  CurrencyDollar,
  ArrowsClockwise,
  ClipboardText,
  CheckCircle,
  ArrowRight,
} from "@phosphor-icons/react";
import { StatusLabel } from "./status";
import { EmptyState } from "./empty-state";
import { usePermissions } from "@/lib/mock-access";
import { cad, tenantById, unitAddress, longDate } from "@/lib/mock-data";

type QueueKind = "repair" | "rent" | "renewal" | "inspection";

type QueueItem = {
  id: string;
  kind: QueueKind;
  urgency: number; // lower sorts first
  title: string;
  context: string;
  meta?: string;
  status?: string;
  to: string;
};

const KIND: Record<QueueKind, { label: string; Icon: typeof Wrench }> = {
  repair: { label: "Repair", Icon: Wrench },
  rent: { label: "Rent", Icon: CurrencyDollar },
  renewal: { label: "Renewal", Icon: ArrowsClockwise },
  inspection: { label: "Inspection", Icon: ClipboardText },
};

const FILTERS: { id: "all" | QueueKind; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "repair", label: "Open repairs" },
  { id: "rent", label: "Overdue rent" },
  { id: "renewal", label: "Expiring leases" },
];

/**
 * Manager landing screen: one urgency-sorted work queue with bulk actions and
 * keyboard shortcuts. Throughput first — no portfolio storytelling.
 */
export function WorkQueue() {
  const { tickets, rentRows, leases, properties, canSeeFinancials } = usePermissions();
  const money = canSeeFinancials();
  const [filter, setFilter] = useState<"all" | QueueKind>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const items = useMemo<QueueItem[]>(() => {
    const rows: QueueItem[] = [];
    for (const t of tickets) {
      if (t.status === "resolved") continue;
      rows.push({
        id: t.id,
        kind: "repair",
        urgency: t.status === "emergency" ? 0 : 2,
        title: t.title,
        context: `${unitAddress(t.unitId)} · ${tenantById(t.tenantId)?.name ?? "No tenant"}`,
        status: t.status,
        to: "/app/maintenance",
      });
    }
    if (money) {
      for (const r of rentRows) {
        if (r.balance <= 0) continue;
        rows.push({
          id: r.id,
          kind: "rent",
          urgency: r.status === "overdue" ? 1 : 3,
          title: `${tenantById(r.tenantId)?.name ?? "Tenant"} owes ${cad(r.balance)}`,
          context: `${unitAddress(r.unitId)} · due ${longDate(r.dueDate)}`,
          status: r.status,
          to: "/app/rent",
        });
      }
      for (const l of leases) {
        if (new Date(l.end) > new Date("2026-10-01")) continue;
        rows.push({
          id: l.id,
          kind: "renewal",
          urgency: 4,
          title: `${tenantById(l.tenantId)?.name ?? "Tenant"} lease ends ${longDate(l.end)}`,
          context: unitAddress(l.unitId),
          to: "/app/renewals",
        });
      }
    }
    return rows.sort((a, b) => a.urgency - b.urgency || a.title.localeCompare(b.title));
  }, [tickets, rentRows, leases, money]);

  const visible = filter === "all" ? items : items.filter((i) => i.kind === filter);
  const allSelected = visible.length > 0 && visible.every((i) => selected.has(i.id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => (allSelected ? new Set() : new Set([...prev, ...visible.map((i) => i.id)])));

  const bulk = (what: string) => {
    toast.success(`${what} for ${selected.size} ${selected.size === 1 ? "item" : "items"} (demo — nothing sent).`);
    setSelected(new Set());
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const rows = listRef.current?.querySelectorAll<HTMLLIElement>("li[data-row]");
    if (!rows?.length) return;
    const focusRow = (index: number) => {
      const clamped = Math.max(0, Math.min(rows.length - 1, index));
      setCursor(clamped);
      rows[clamped]?.focus();
    };
    if (e.key === "j" || e.key === "ArrowDown") {
      e.preventDefault();
      focusRow(cursor + 1);
    } else if (e.key === "k" || e.key === "ArrowUp") {
      e.preventDefault();
      focusRow(cursor - 1);
    } else if (e.key === "x") {
      e.preventDefault();
      const item = visible[cursor];
      if (item) toggle(item.id);
    } else if (e.key === "a") {
      e.preventDefault();
      toggleAll();
    }
  };

  return (
    <section aria-labelledby="queue-heading" className="mb-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="queue-heading" className="font-display text-lg font-bold">
          Your work queue
        </h2>
        <p className="text-xs text-muted-foreground">
          {properties.length} assigned {properties.length === 1 ? "property" : "properties"} · j/k to move, x to select, a for all
        </p>
      </div>

      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filter the queue">
        {FILTERS.filter((f) => money || f.id === "all" || f.id === "repair").map((f) => {
          const count = f.id === "all" ? items.length : items.filter((i) => i.kind === f.id).length;
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${
                active ? "border-navy bg-navy text-primary-foreground" : "border-border text-navy hover:bg-navy-soft"
              }`}
            >
              {f.label}
              <span className="tnum text-xs opacity-80">{count}</span>
            </button>
          );
        })}
      </div>

      {selected.size > 0 && (
        <div
          role="status"
          className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface-sunk p-3"
        >
          <span className="tnum text-sm font-semibold text-navy">{selected.size} selected</span>
          <button
            type="button"
            onClick={() => bulk("Reminder sent")}
            className="min-h-11 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90"
          >
            Send a reminder
          </button>
          <button
            type="button"
            onClick={() => bulk("Marked as handled")}
            className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            Mark as handled
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="min-h-11 rounded-full px-4 text-sm font-semibold text-muted-foreground hover:bg-navy-soft"
          >
            Clear selection
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          Icon={CheckCircle}
          title="Your queue is clear"
          body="No open repairs or chases on your assigned properties. New work lands here first, sorted by urgency."
        />
      ) : (
        <>
          <div className="mb-2 flex items-center gap-2">
            <input
              id="queue-select-all"
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="queue-select-all" className="text-sm text-muted-foreground">
              Select everything showing
            </label>
          </div>
          <ul
            ref={listRef}
            onKeyDown={onKeyDown}
            className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card"
          >
            {visible.map((item, index) => {
              const { Icon, label } = KIND[item.kind];
              return (
                <li
                  key={item.kind + item.id}
                  data-row
                  tabIndex={index === cursor ? 0 : -1}
                  onFocus={() => setCursor(index)}
                  className="flex items-start gap-3 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-action"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggle(item.id)}
                    aria-label={`Select ${item.title}`}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-input"
                  />
                  <Icon weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-action" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.status ? <StatusLabel status={item.status as never} /> : null}
                      <p className="font-display font-bold text-navy">{item.title}</p>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {label} · {item.context}
                    </p>
                  </div>
                  <Link
                    to={item.to}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
                  >
                    Open <ArrowRight weight="duotone" className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
