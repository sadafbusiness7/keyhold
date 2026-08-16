import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CaretLeft,
  CaretRight,
  Receipt,
  FileText,
  MagnifyingGlass,
  Wrench,
  SignIn,
  X,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/keyhold/app-shell";
import { EmptyState } from "@/components/keyhold/empty-state";
import { calendarEvents, longDate, type CalendarEvent } from "@/lib/mock-data";
import { TODAY } from "@/lib/mock-rent";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/app/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Keyhold" },
      { name: "description", content: "Rent dates, inspections, repairs and lease endings on a month grid, week view or agenda." },
      { property: "og:title", content: "Calendar — Keyhold" },
      { property: "og:description", content: "What's happening this week and next." },
    ],
  }),
  component: CalendarPage,
});

type EventType = CalendarEvent["type"];

const typeMeta: Record<EventType, { label: string; Icon: typeof Receipt; chip: string; dot: string; to: string; action: string }> = {
  rent: { label: "Rent due", Icon: Receipt, chip: "bg-warning-soft text-warning", dot: "bg-warning", to: "/app/rent", action: "Open rent" },
  "lease-end": { label: "Lease end", Icon: FileText, chip: "bg-navy-soft text-navy", dot: "bg-navy", to: "/app/leases", action: "Open lease" },
  inspection: { label: "Inspection", Icon: MagnifyingGlass, chip: "bg-action-soft text-action", dot: "bg-action", to: "/app/properties", action: "Open property" },
  maintenance: { label: "Maintenance", Icon: Wrench, chip: "bg-maple-soft text-maple", dot: "bg-maple", to: "/app/maintenance", action: "Open repair" },
  "move-in": { label: "Move-in", Icon: SignIn, chip: "bg-success-soft text-success", dot: "bg-success", to: "/app/tenants", action: "Open tenant" },
};

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));
const startOfWeek = (d: Date) => addDays(d, -d.getUTCDay());
const monthLabel = (d: Date) =>
  d.toLocaleDateString("en-CA", { month: "long", year: "numeric", timeZone: "UTC" });

function CalendarPage() {
  const isMobile = useIsMobile();
  const today = new Date(`${TODAY}T00:00:00Z`);
  const [cursor, setCursor] = useState(today);
  const [mode, setMode] = useState<"month" | "week">("month");
  const [open, setOpen] = useState<CalendarEvent | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of calendarEvents) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return map;
  }, []);

  const days = useMemo(() => {
    if (mode === "week") {
      const start = startOfWeek(cursor);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    const first = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1));
    const start = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor, mode]);

  const step = (dir: number) =>
    setCursor((c) =>
      mode === "week" ? addDays(c, dir * 7) : new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + dir, 1)),
    );

  const agenda = [...calendarEvents].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <PageHeader title="Calendar" subtitle="Everything with a date attached, colour-coded by what it is." />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous"
            className="grid h-11 w-11 place-items-center rounded-full border border-border text-navy hover:bg-navy-soft"
          >
            <CaretLeft weight="bold" className="h-4 w-4" aria-hidden="true" />
          </button>
          <p className="min-w-40 text-center font-display text-base font-bold text-navy">{monthLabel(cursor)}</p>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next"
            className="grid h-11 w-11 place-items-center rounded-full border border-border text-navy hover:bg-navy-soft"
          >
            <CaretRight weight="bold" className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(today)}
            className="ml-1 min-h-11 rounded-full border border-border px-3 text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            Today
          </button>
        </div>
        {!isMobile && (
          <div className="flex gap-1.5" role="group" aria-label="Calendar view">
            {(["month", "week"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={`min-h-11 rounded-full px-3.5 text-sm font-semibold capitalize ${
                  mode === m ? "bg-navy text-primary-foreground" : "border border-border text-navy hover:bg-navy-soft"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      <ul className="mb-3 flex flex-wrap gap-1.5" aria-label="Event types">
        {(Object.keys(typeMeta) as EventType[]).map((t) => {
          const { label, Icon, chip } = typeMeta[t];
          return (
            <li key={t} className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-display text-[10.5px] font-extrabold uppercase tracking-[0.07em] ${chip}`}>
              {label}
            </li>
          );
        })}
      </ul>

      {isMobile ? (
        <ol className="space-y-2">
          {agenda.length === 0 ? (
            <li>
              <EmptyState Icon={Receipt} title="Nothing scheduled" body="Rent dates, repairs and lease endings will show here." />
            </li>
          ) : (
            agenda.map((e) => {
              const { Icon, chip, label } = typeMeta[e.type];
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(e)}
                    className="card-soft flex w-full min-h-11 items-start gap-2.5 p-3 text-left"
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${chip}`}>
                      <Icon weight="duotone" className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-sm font-bold text-navy">{e.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{e.detail}</span>
                      <span className="tnum mt-0.5 block text-xs font-semibold text-navy">{longDate(e.date)} · {label}</span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ol>
      ) : (
        <div className="card-soft overflow-hidden p-0">
          <div className="grid grid-cols-7 border-b border-border bg-surface-sunk">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="px-2 py-1.5 text-center text-xs font-semibold text-muted-foreground">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const key = iso(d);
              const list = byDate.get(key) ?? [];
              const otherMonth = mode === "month" && d.getUTCMonth() !== cursor.getUTCMonth();
              const isToday = key === TODAY;
              return (
                <div
                  key={key}
                  className={`min-h-24 border-t border-r border-border p-1.5 last:border-r-0 ${
                    otherMonth ? "bg-surface-sunk/60" : ""
                  } ${mode === "week" ? "min-h-40" : ""}`}
                >
                  <p
                    className={`tnum mb-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold ${
                      isToday ? "bg-navy text-primary-foreground" : otherMonth ? "text-muted-foreground" : "text-navy"
                    }`}
                  >
                    {d.getUTCDate()}
                  </p>
                  <ul className="space-y-1">
                    {list.map((e) => {
                      const { Icon, chip, dot, label } = typeMeta[e.type];
                      return (
                        <li key={e.id}>
                          <button
                            type="button"
                            onClick={() => setOpen(e)}
                            aria-label={`${label}: ${e.title}, ${longDate(e.date)}`}
                            className={`flex w-full items-center gap-1 rounded-lg px-1.5 py-1 text-left text-xs font-semibold ${chip} hover:brightness-95`}
                          >
                            <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
                            <Icon weight="duotone" className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">{e.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {open ? <QuickView event={open} onClose={() => setOpen(null)} /> : null}
    </>
  );
}

/** Quick-view popover: details plus one or two actions, no navigation away. */
function QuickView({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const { label, Icon, chip, to, action } = typeMeta[event.type];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/25 p-3 sm:items-center" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={event.title}
        onClick={(e) => e.stopPropagation()}
        className="card-soft w-full max-w-sm p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-display text-[10.5px] font-extrabold uppercase tracking-[0.07em] ${chip}`}>
            {label}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-11 w-11 place-items-center rounded-full text-navy hover:bg-navy-soft"
          >
            <X weight="bold" className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <h2 className="mt-2 font-display text-base font-bold text-navy">{event.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
        <p className="tnum mt-1 text-sm font-semibold text-navy">{longDate(event.date)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to={to}
            className="inline-flex min-h-11 items-center rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90"
          >
            {action}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
