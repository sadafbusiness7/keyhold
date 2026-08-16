/**
 * COMMAND PALETTE (⌘K / Ctrl+K, or /) + SHORTCUT CHEAT SHEET (?)
 *
 * Searches everything the signed-in person is allowed to see — properties,
 * units, tenants, leases, invoices, maintenance, documents, vendors — and
 * offers quick actions. Results are grouped, badged by type, and fully
 * keyboard navigable. Search input is debounced; long result sets are
 * virtualised.
 */
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  MagnifyingGlass,
  Buildings,
  DoorOpen,
  User,
  Receipt,
  FileText,
  Wrench,
  Folders,
  Toolbox,
  Lightning,
  ClockCounterClockwise,
  Keyboard,
  Trash,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { tenantById, unitAddress, cad } from "@/lib/mock-data";
import { usePermissions } from "@/lib/mock-access";
import { useLeases, statusLabel as leaseStatusLabel, displayStatus } from "@/lib/mock-leases";
import { useMaintenance } from "@/lib/mock-maintenance";
import { useOperations } from "@/lib/mock-operations";
import { JUMPS, useShortcuts } from "@/lib/shortcuts";
import { VirtualList } from "./virtual-list";

type Group =
  | "Actions"
  | "Properties"
  | "Units"
  | "Tenants"
  | "Leases"
  | "Invoices"
  | "Maintenance"
  | "Documents"
  | "Vendors";

type Hit = {
  id: string;
  label: string;
  sub: string;
  to: string;
  group: Group;
  Icon: PhosphorIcon;
};

/** Things you can start from the palette without hunting for a button. */
const ACTIONS: Hit[] = [
  { id: "a-payment", label: "Record a payment", sub: "Rent · mark an invoice paid", to: "/app/rent", group: "Actions", Icon: Lightning },
  { id: "a-property", label: "Add a property", sub: "Properties & units", to: "/app/properties", group: "Actions", Icon: Lightning },
  { id: "a-message", label: "New message", sub: "Messages · tenant, vendor or team", to: "/app/messages", group: "Actions", Icon: Lightning },
  { id: "a-tenant", label: "Add a tenant", sub: "Tenants · with lease details", to: "/app/add-tenant", group: "Actions", Icon: Lightning },
  { id: "a-lease", label: "Start a new lease", sub: "Guided lease wizard", to: "/app/leases/wizard", group: "Actions", Icon: Lightning },
  { id: "a-maintenance", label: "Log a maintenance request", sub: "Maintenance", to: "/app/maintenance", group: "Actions", Icon: Lightning },
  { id: "a-announce", label: "Send an announcement", sub: "Announcements · email, SMS or portal", to: "/app/announcements", group: "Actions", Icon: Lightning },
  { id: "a-import", label: "Import data", sub: "Bring in a spreadsheet", to: "/app/import", group: "Actions", Icon: Lightning },
];

const GROUP_ORDER: Group[] = [
  "Actions",
  "Properties",
  "Units",
  "Tenants",
  "Leases",
  "Invoices",
  "Maintenance",
  "Documents",
  "Vendors",
];

/* --------------------------------- trigger -------------------------------- */

export function GlobalSearch({ className = "" }: { className?: string }) {
  const { openPalette } = useShortcuts();
  return (
    <button
      type="button"
      onClick={() => openPalette("search")}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-muted-foreground transition-colors hover:bg-navy-soft ${className}`}
    >
      <MagnifyingGlass weight="duotone" className="h-4 w-4 text-navy" aria-hidden="true" />
      <span className="hidden sm:inline">Search everything</span>
      <span className="sr-only sm:hidden">Search everything</span>
      <kbd className="ml-2 hidden rounded border border-border px-1.5 text-[10px] font-semibold lg:inline">⌘K</kbd>
    </button>
  );
}

/* --------------------------------- palette -------------------------------- */

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, paletteMode, recent, rememberSearch, clearRecent } = useShortcuts();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Scoped to the signed-in user: unassigned properties never appear.
  const { properties, units, tenants, rentRows, canSeeFinancials } = usePermissions();
  const { leases } = useLeases();
  const { requests, vendors } = useMaintenance();
  const { documents } = useOperations();

  const money = canSeeFinancials();

  // Debounced by rendering: the heavy filter runs on the deferred value only.
  const term = useDeferredValue(q).trim().toLowerCase();

  useEffect(() => {
    if (paletteOpen) {
      setQ("");
      setCursor(0);
    }
  }, [paletteOpen, paletteMode]);

  const corpus = useMemo<Hit[]>(() => {
    const rows: Hit[] = [
      ...properties.map((p) => ({
        id: p.id,
        label: p.name,
        sub: `${p.kind} · ${p.address}, ${p.city}`,
        to: "/app/properties",
        group: "Properties" as const,
        Icon: Buildings as PhosphorIcon,
      })),
      ...units.map((u) => ({
        id: u.id,
        label: u.label,
        sub: `${unitAddress(u.id)}${money ? ` · ${cad(u.rent)}/mo` : ""}`,
        to: "/app/properties",
        group: "Units" as const,
        Icon: DoorOpen as PhosphorIcon,
      })),
      ...tenants.map((t) => ({
        id: t.id,
        label: t.name,
        sub: `${t.email} · ${unitAddress(t.unitId)}`,
        to: "/app/tenants",
        group: "Tenants" as const,
        Icon: User as PhosphorIcon,
      })),
      ...leases.map((l) => ({
        id: l.id,
        label: l.tenants[0]?.name ? `${l.tenants[0].name} — ${unitAddress(l.unitId)}` : unitAddress(l.unitId),
        sub: `${leaseStatusLabel[displayStatus(l)]} · ${l.startDate} to ${l.endDate}`,
        to: "/app/leases",
        group: "Leases" as const,
        Icon: FileText as PhosphorIcon,
      })),
      ...requests.map((r) => ({
        id: r.id,
        label: `${r.subcategory || r.category} — ${unitAddress(r.unitId)}`,
        sub: `${r.status} · opened ${r.openedOn} · ${r.description.slice(0, 60)}`,
        to: "/app/maintenance",
        group: "Maintenance" as const,
        Icon: Wrench as PhosphorIcon,
      })),
      ...documents.map((d) => ({
        id: d.id,
        label: d.name,
        sub: `${d.folder} · ${d.category} · ${d.size}`,
        to: "/app/documents",
        group: "Documents" as const,
        Icon: Folders as PhosphorIcon,
      })),
      ...vendors.map((v) => ({
        id: v.id,
        label: v.name,
        sub: `${v.trade} · ${v.contactName} · ${v.phone}`,
        to: "/app/maintenance",
        group: "Vendors" as const,
        Icon: Toolbox as PhosphorIcon,
      })),
    ];
    if (money) {
      rows.push(
        ...rentRows.map((r) => ({
          id: r.id,
          label: `${cad(r.rent)} · ${tenantById(r.tenantId)?.name ?? "Invoice"}`,
          sub: `Due ${r.dueDate} · ${r.status}`,
          to: "/app/rent",
          group: "Invoices" as const,
          Icon: Receipt as PhosphorIcon,
        })),
      );
    }
    return rows;
  }, [properties, units, tenants, leases, requests, documents, vendors, rentRows, money]);

  const hits = useMemo(() => {
    if (paletteMode === "new" && !term) return ACTIONS;
    if (!term) return [];
    const match = (h: Hit) => `${h.label} ${h.sub} ${h.group}`.toLowerCase().includes(term);
    return [...ACTIONS.filter(match), ...corpus.filter(match)].slice(0, 200);
  }, [term, corpus, paletteMode]);

  // Flatten in group order so arrow keys walk the list exactly as it reads.
  const ordered = useMemo(() => {
    const out: ({ kind: "header"; group: Group } | ({ kind: "hit" } & Hit))[] = [];
    for (const g of GROUP_ORDER) {
      const inGroup = hits.filter((h) => h.group === g);
      if (!inGroup.length) continue;
      out.push({ kind: "header", group: g });
      for (const h of inGroup) out.push({ kind: "hit", ...h });
    }
    return out;
  }, [hits]);

  const selectable = ordered.filter((r) => r.kind === "hit") as ({ kind: "hit" } & Hit)[];

  useEffect(() => setCursor(0), [term, paletteMode]);

  const run = (hit: Hit) => {
    rememberSearch(q);
    setPaletteOpen(false);
    navigate({ to: hit.to });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(selectable.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      const hit = selectable[cursor];
      if (hit) {
        e.preventDefault();
        run(hit);
      }
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const rowIndex = new Map(selectable.map((h, i) => [`${h.group}-${h.id}`, i]));

  return (
    <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
      <DialogContent className="max-w-xl gap-0 p-0">
        <DialogHeader className="border-b border-border px-4 py-3 text-left">
          <DialogTitle className="font-display text-base font-bold">
            {paletteMode === "new" ? "Create something new" : "Search everything"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Properties, units, tenants, leases, invoices, maintenance, documents and vendors — plus quick actions.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4">
          <label htmlFor="global-search" className="sr-only">
            Search everything
          </label>
          <input
            id="global-search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={selectable.length > 0}
            aria-controls="palette-results"
            aria-activedescendant={selectable[cursor] ? `palette-${selectable[cursor].group}-${selectable[cursor].id}` : undefined}
            placeholder="Type to search, or pick an action…"
            className="min-h-11 w-full rounded-full border border-input bg-card px-4 text-sm"
          />

          {/* Recent searches — only when there's nothing typed yet. */}
          {!term && paletteMode === "search" && recent.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between px-1">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <ClockCounterClockwise weight="duotone" className="h-3.5 w-3.5" aria-hidden="true" />
                  Recent searches
                </span>
                <button
                  type="button"
                  onClick={clearRecent}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-navy-soft hover:text-navy"
                >
                  <Trash weight="duotone" className="h-3.5 w-3.5" aria-hidden="true" />
                  Clear
                </button>
              </div>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {recent.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      onClick={() => setQ(r)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy-soft"
                    >
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!term && paletteMode === "search" && (
            <p className="mt-4 px-1 text-xs text-muted-foreground">
              Tip: press <kbd className="rounded border border-border px-1">n</kbd> for create actions,{" "}
              <kbd className="rounded border border-border px-1">g</kbd> then a letter to jump, or{" "}
              <kbd className="rounded border border-border px-1">?</kbd> for all shortcuts.
            </p>
          )}

          {term && selectable.length === 0 && (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">Nothing matches “{q}”.</p>
          )}

          <div id="palette-results" ref={listRef} role="listbox" aria-label="Search results" className="mt-3">
            <VirtualList
              items={ordered}
              rowHeight={52}
              height={340}
              threshold={60}
              renderRow={(row) => {
                if (row.kind === "header") {
                  return (
                    <p
                      key={`h-${row.group}`}
                      role="presentation"
                      className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {row.group}
                    </p>
                  );
                }
                const i = rowIndex.get(`${row.group}-${row.id}`) ?? -1;
                const active = i === cursor;
                return (
                  <button
                    key={`${row.group}-${row.id}`}
                    id={`palette-${row.group}-${row.id}`}
                    role="option"
                    aria-selected={active}
                    data-active={active}
                    type="button"
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => run(row)}
                    className={`flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                      active ? "bg-navy-soft" : "hover:bg-navy-soft"
                    }`}
                  >
                    <row.Icon weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-navy">{row.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{row.sub}</span>
                    </span>
                    <span className="kh-tag shrink-0" style={{ "--tint": "var(--navy)" } as React.CSSProperties}>
                      {row.group === "Actions" ? "Action" : row.group.replace(/ies$/, "y").replace(/s$/, "")}
                    </span>
                  </button>
                );
              }}
            />
          </div>

          <p className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
            <span><kbd className="rounded border border-border px-1">↑</kbd> <kbd className="rounded border border-border px-1">↓</kbd> move</span>
            <span><kbd className="rounded border border-border px-1">↵</kbd> open</span>
            <span><kbd className="rounded border border-border px-1">Esc</kbd> close</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- cheat sheet ------------------------------ */

const GENERAL = [
  { keys: ["⌘", "K"], label: "Open the command palette" },
  { keys: ["/"], label: "Search everything" },
  { keys: ["n"], label: "Create something new" },
  { keys: ["?"], label: "Show this cheat sheet" },
  { keys: ["Esc"], label: "Close a dialog, drawer or panel" },
];

export function ShortcutsSheet() {
  const { cheatOpen, setCheatOpen } = useShortcuts();
  return (
    <Dialog open={cheatOpen} onOpenChange={setCheatOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2 font-display text-base font-bold">
            <Keyboard weight="duotone" className="h-5 w-5 text-navy" aria-hidden="true" />
            Keyboard shortcuts
          </DialogTitle>
          <DialogDescription className="text-xs">
            Shortcuts are ignored while you're typing in a field, so they never get in the way.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">General</h3>
            <ul className="mt-2 space-y-1.5">
              {GENERAL.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-3 text-sm text-navy">
                  <span>{s.label}</span>
                  <span className="flex gap-1">
                    {s.keys.map((k) => (
                      <kbd key={k} className="rounded border border-border bg-card px-1.5 py-0.5 text-xs font-semibold">{k}</kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Jump to a section — press <kbd className="rounded border border-border px-1">g</kbd> then…
            </h3>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {JUMPS.map((j) => (
                <li key={j.keys} className="flex items-center justify-between gap-3 text-sm text-navy">
                  <span className="truncate">{j.label}</span>
                  <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-xs font-semibold">{j.keys}</kbd>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
