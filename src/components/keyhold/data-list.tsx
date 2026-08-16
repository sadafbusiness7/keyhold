import { useMemo, useState, type ReactNode } from "react";
import {
  MagnifyingGlass,
  CaretUp,
  CaretDown,
  CaretLeft,
  CaretRight,
  DownloadSimple,
  Columns,
  DotsThree,
  Broom,
  Eye,
  PencilSimple,
  Copy,
  Archive,
  Trash,
  EnvelopeSimple,
  Warning,
  ArrowClockwise,
  Tray,
} from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/keyhold/empty-state";
import { StatusLabel, toneRail, statusMeta, type StatusKey } from "@/components/keyhold/status";

/* ------------------------------------------------------------------ */
/* Toast for controls that exist but aren't wired to logic yet.        */
/* ------------------------------------------------------------------ */
export function notWired(what: string) {
  toast("Not wired yet", {
    description: `${what} — the control is here, the logic lands next.`,
    className: "kh-toast-pending",
  });
}

export type Column<T> = {
  key: string;
  label: string;
  /** plain value used for sorting, searching and CSV export */
  value: (row: T) => string | number;
  render?: (row: T) => ReactNode;
  align?: "left" | "right";
  sortable?: boolean;
  defaultHidden?: boolean;
  /** never hidden by the column chooser */
  locked?: boolean;
};

export type FilterDef<T> = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  match: (row: T, value: string) => boolean;
};

export type RowAction<T> = {
  key: string;
  label: string;
  Icon?: PhosphorIcon;
  destructive?: boolean;
  /** plain-language consequence — shows an "Are you sure?" modal first */
  confirm?: string | ((row: T) => string);
  onSelect?: (row: T) => void;
};

export type BulkAction<T> = {
  key: string;
  label: string;
  Icon?: PhosphorIcon;
  destructive?: boolean;
  confirm?: string | ((rows: T[]) => string);
  onSelect?: (rows: T[]) => void;
};

export type QuickView = {
  title: string;
  subtitle?: string;
  status?: StatusKey | undefined;
  fields: { label: string; value: ReactNode }[];
  actions?: ReactNode;
  /** anything extra under the fields — e.g. a record activity timeline */
  extra?: ReactNode;
};

type Props<T> = {
  items: T[];
  columns: Column<T>[];
  getId: (row: T) => string;
  getStatus?: (row: T) => StatusKey | undefined;
  /** name used for the CSV file and screen-reader labels */
  name: string;
  searchPlaceholder?: string;
  filters?: FilterDef<T>[];
  /** ISO date on the row, enables the date-range chips */
  dateOf?: (row: T) => string | null | undefined;
  quickView?: (row: T) => QuickView;
  rowActions?: RowAction<T>[];
  bulkActions?: BulkAction<T>[];
  pageSize?: number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyIcon?: PhosphorIcon;
  emptyTitle?: string;
  emptyBody?: string;
  emptyAction?: ReactNode;
  toolbarExtra?: ReactNode;
};

const dateRanges = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "This year" },
  { value: "future", label: "Upcoming" },
];

const chipBase =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors";

export function DataList<T>({
  items,
  columns,
  getId,
  getStatus,
  name,
  searchPlaceholder,
  filters = [],
  dateOf,
  quickView,
  rowActions,
  bulkActions,
  pageSize = 12,
  loading = false,
  error = null,
  onRetry,
  emptyIcon = Tray,
  emptyTitle = "Nothing here yet",
  emptyBody = "When there is something to show, it will appear in this list.",
  emptyAction,
  toolbarExtra,
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [active, setActive] = useState<Record<string, string>>({});
  const [range, setRange] = useState<string>("");
  const [hidden, setHidden] = useState<string[]>(columns.filter((c) => c.defaultHidden).map((c) => c.key));
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<T | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; body: string; run: () => void } | null>(null);

  const shown = columns.filter((c) => !hidden.includes(c.key));

  const filtered = useMemo(() => {
    let list = items;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((row) =>
        columns.some((c) => String(c.value(row)).toLowerCase().includes(q)),
      );
    }
    for (const f of filters) {
      const v = active[f.key];
      if (v) list = list.filter((row) => f.match(row, v));
    }
    if (range && dateOf) {
      const now = Date.now();
      list = list.filter((row) => {
        const raw = dateOf(row);
        if (!raw) return false;
        const t = new Date(raw).getTime();
        if (Number.isNaN(t)) return false;
        if (range === "future") return t >= now;
        return t <= now && t >= now - Number(range) * 864e5;
      });
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        list = [...list].sort((a, b) => {
          const av = col.value(a);
          const bv = col.value(b);
          const cmp =
            typeof av === "number" && typeof bv === "number"
              ? av - bv
              : String(av).localeCompare(String(bv), undefined, { numeric: true });
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return list;
  }, [items, columns, filters, query, active, range, sort, dateOf]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * pageSize, current * pageSize + pageSize);
  const visibleIds = visible.map(getId);
  const allChecked = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const selectedRows = items.filter((r) => selected.includes(getId(r)));
  const dirty = Boolean(query || range || Object.values(active).some(Boolean) || sort);

  function toggleSort(key: string) {
    setSort((s) => (s?.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" }));
  }

  function clearFilters() {
    setQuery("");
    setActive({});
    setRange("");
    setSort(null);
    setPage(0);
    toast.success("Filters cleared");
  }

  function exportCsv() {
    const head = shown.map((c) => c.label);
    const rows = (selectedRows.length ? selectedRows : filtered).map((r) =>
      shown.map((c) => String(c.value(r))),
    );
    const csv = [head, ...rows]
      .map((line) => line.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} ${rows.length === 1 ? "row" : "rows"} to CSV`);
  }

  function ask(title: string, body: string, run: () => void) {
    setConfirm({ title, body, run });
  }

  function runRowAction(a: RowAction<T>, row: T) {
    const go = () => (a.onSelect ? a.onSelect(row) : notWired(a.label));
    if (a.confirm) {
      ask(`${a.label}?`, typeof a.confirm === "function" ? a.confirm(row) : a.confirm, go);
    } else go();
  }

  function runBulkAction(a: BulkAction<T>) {
    const rows = selectedRows;
    const go = () => {
      if (a.onSelect) a.onSelect(rows);
      else notWired(`${a.label} for ${rows.length} selected`);
      setSelected([]);
    };
    if (a.confirm) {
      ask(`${a.label}?`, typeof a.confirm === "function" ? a.confirm(rows) : a.confirm, go);
    } else go();
  }

  const defaultRowActions: RowAction<T>[] = rowActions ?? [
    { key: "view", label: "View", Icon: Eye, onSelect: (r) => setOpen(r) },
    { key: "edit", label: "Edit", Icon: PencilSimple },
    { key: "duplicate", label: "Duplicate", Icon: Copy },
    { key: "archive", label: "Archive", Icon: Archive },
    {
      key: "delete",
      label: "Delete",
      Icon: Trash,
      destructive: true,
      confirm: "This permanently removes the record and everything filed under it. It cannot be undone.",
    },
  ];

  const defaultBulkActions: BulkAction<T>[] = bulkActions ?? [
    { key: "email", label: "Email", Icon: EnvelopeSimple },
    { key: "export", label: "Export", Icon: DownloadSimple, onSelect: () => exportCsv() },
    { key: "status", label: "Change status", Icon: ArrowClockwise },
    {
      key: "delete",
      label: "Delete",
      Icon: Trash,
      destructive: true,
      confirm: (rows) => `${rows.length} records will be permanently removed. This cannot be undone.`,
    },
  ];

  /* ----------------------------- states ---------------------------- */
  if (error) {
    return (
      <div className="rounded-2xl border border-maple/40 bg-maple-soft p-6 text-center">
        <Warning weight="duotone" className="mx-auto h-8 w-8 text-maple" aria-hidden="true" />
        <p className="mt-2 font-display font-bold text-navy">We couldn't load {name.toLowerCase()}</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={() => (onRetry ? onRetry() : notWired("Retry"))}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-primary-foreground"
        >
          <ArrowClockwise weight="duotone" className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  return (
    <section aria-label={name} className="space-y-3">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <MagnifyingGlass
            weight="duotone"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor={`search-${name}`} className="sr-only">
            Search {name}
          </label>
          <input
            id={`search-${name}`}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder ?? `Search ${name.toLowerCase()}`}
            className="min-h-11 w-full rounded-full border border-input bg-card pl-9 pr-3 text-sm"
          />
        </div>

        {toolbarExtra}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            <DownloadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" />
            Export
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
              <Columns weight="duotone" className="h-4 w-4" aria-hidden="true" />
              Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Show columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  checked={!hidden.includes(c.key)}
                  disabled={c.locked ?? false}
                  onCheckedChange={(on) =>
                    setHidden((h) => (on ? h.filter((k) => k !== c.key) : [...h, c.key]))
                  }
                >
                  {c.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* filter chips */}
      {(filters.length > 0 || dateOf) && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <DropdownMenu key={f.key}>
              <DropdownMenuTrigger
                className={`${chipBase} ${
                  active[f.key] ? "border-action bg-action-soft text-action" : "border-border bg-card text-navy hover:bg-navy-soft"
                }`}
              >
                {active[f.key]
                  ? f.options.find((o) => o.value === active[f.key])?.label ?? f.label
                  : f.label}
                <CaretDown weight="duotone" className="h-3.5 w-3.5" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={() => setActive((a) => ({ ...a, [f.key]: "" }))}>
                  All
                </DropdownMenuItem>
                {f.options.map((o) => (
                  <DropdownMenuItem
                    key={o.value}
                    onSelect={() => {
                      setActive((a) => ({ ...a, [f.key]: o.value }));
                      setPage(0);
                    }}
                  >
                    {o.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}

          {dateOf && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`${chipBase} ${
                  range ? "border-action bg-action-soft text-action" : "border-border bg-card text-navy hover:bg-navy-soft"
                }`}
              >
                {range ? dateRanges.find((r) => r.value === range)?.label : "Any date"}
                <CaretDown weight="duotone" className="h-3.5 w-3.5" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={() => setRange("")}>Any date</DropdownMenuItem>
                {dateRanges.map((r) => (
                  <DropdownMenuItem key={r.value} onSelect={() => { setRange(r.value); setPage(0); }}>
                    {r.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {dirty && (
            <button type="button" onClick={clearFilters} className={`${chipBase} border-border bg-card text-muted-foreground hover:bg-navy-soft`}>
              <Broom weight="duotone" className="h-4 w-4" aria-hidden="true" />
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* bulk bar */}
      {selected.length > 0 && (
        <div
          role="region"
          aria-label="Bulk actions"
          className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-navy/20 bg-navy px-3 py-2 text-primary-foreground shadow-lg"
        >
          <p className="tnum text-sm font-semibold">{selected.length} selected</p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {defaultBulkActions.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => runBulkAction(a)}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${
                  a.destructive ? "bg-maple text-white hover:bg-maple/90" : "bg-white/15 hover:bg-white/25"
                }`}
              >
                {a.Icon && <a.Icon weight="duotone" className="h-4 w-4" aria-hidden="true" />}
                {a.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelected([])}
              className="inline-flex min-h-9 items-center rounded-full px-3 text-xs font-semibold underline-offset-2 hover:underline"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* loading */}
      {loading ? (
        <ul className="space-y-2" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-surface-sunk" />
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <EmptyState
          Icon={emptyIcon}
          title={items.length === 0 ? emptyTitle : "Nothing matches those filters"}
          body={items.length === 0 ? emptyBody : "Try a different search, or clear the filters to see everything again."}
        >
          {items.length === 0 ? emptyAction : (
            <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-navy hover:bg-navy-soft">
              <Broom weight="duotone" className="h-4 w-4" aria-hidden="true" />
              Clear filters
            </button>
          )}
        </EmptyState>
      ) : (
        <>
          {/* desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">{name}</caption>
              <thead className="bg-surface-sunk text-left">
                <tr>
                  <th scope="col" className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={(e) =>
                        setSelected((s) =>
                          e.target.checked
                            ? [...new Set([...s, ...visibleIds])]
                            : s.filter((id) => !visibleIds.includes(id)),
                        )
                      }
                      aria-label={`Select all ${name.toLowerCase()} on this page`}
                      className="h-4 w-4 rounded border-input accent-[var(--action,#2563EB)]"
                    />
                  </th>
                  {shown.map((c) => (
                    <th key={c.key} scope="col" className={`px-3 py-2 font-semibold text-navy ${c.align === "right" ? "text-right" : ""}`}>
                      {c.sortable === false ? (
                        c.label
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key)}
                          className="inline-flex items-center gap-1 hover:underline"
                          aria-label={`Sort by ${c.label}`}
                        >
                          {c.label}
                          {sort?.key === c.key ? (
                            sort.dir === "asc" ? (
                              <CaretUp weight="duotone" className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <CaretDown weight="duotone" className="h-3.5 w-3.5" aria-hidden="true" />
                            )
                          ) : null}
                        </button>
                      )}
                    </th>
                  ))}
                  <th scope="col" className="w-12 px-3 py-2 text-right">
                    <span className="sr-only">Row actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const id = getId(row);
                  const status = getStatus?.(row);
                  return (
                    <tr
                      key={id}
                      tabIndex={0}
                      onClick={() => quickView && setOpen(row)}
                      onKeyDown={(e) => {
                        if (quickView && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          setOpen(row);
                        }
                      }}
                      className="relative cursor-pointer border-t border-border outline-none hover:bg-navy-soft/60 focus-visible:bg-navy-soft"
                    >
                      <td className="relative px-3 py-2.5">
                        {status && (
                          <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${toneRail(statusMeta[status].tone)}`} />
                        )}
                        <input
                          type="checkbox"
                          checked={selected.includes(id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            setSelected((s) => (e.target.checked ? [...s, id] : s.filter((x) => x !== id)))
                          }
                          aria-label={`Select row ${id}`}
                          className="h-4 w-4 rounded border-input"
                        />
                      </td>
                      {shown.map((c) => (
                        <td key={c.key} className={`px-3 py-2.5 align-middle ${c.align === "right" ? "text-right" : ""}`}>
                          {c.render ? c.render(row) : String(c.value(row))}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <RowMenu actions={defaultRowActions} onPick={(a) => runRowAction(a, row)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <ul className="space-y-2 md:hidden">
            {visible.map((row) => {
              const id = getId(row);
              const status = getStatus?.(row);
              return (
                <li
                  key={id}
                  className="relative overflow-hidden rounded-2xl border border-border bg-card p-3 pl-5"
                >
                  {status && <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${toneRail(statusMeta[status].tone)}`} />}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(id)}
                      onChange={(e) => setSelected((s) => (e.target.checked ? [...s, id] : s.filter((x) => x !== id)))}
                      aria-label={`Select row ${id}`}
                      className="mt-1 h-4 w-4 rounded border-input"
                    />
                    <button
                      type="button"
                      onClick={() => quickView && setOpen(row)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate font-display font-bold text-navy">{String(shown[0]?.value(row) ?? "")}</p>
                      <dl className="mt-1.5 space-y-1">
                        {shown.slice(1, 4).map((c) => (
                          <div key={c.key} className="flex items-baseline justify-between gap-3">
                            <dt className="text-xs text-muted-foreground">{c.label}</dt>
                            <dd className="min-w-0 truncate text-sm">{c.render ? c.render(row) : String(c.value(row))}</dd>
                          </div>
                        ))}
                      </dl>
                      {status && <div className="mt-2"><StatusLabel status={status} /></div>}
                    </button>
                    <RowMenu actions={defaultRowActions} onPick={(a) => runRowAction(a, row)} />
                  </div>
                </li>
              );
            })}
          </ul>

          {/* footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="tnum text-xs text-muted-foreground">
              Showing {visible.length} of {filtered.length}
              {filtered.length !== items.length ? ` (filtered from ${items.length})` : ""}
            </p>
            {pages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={current === 0}
                  className="grid h-9 w-9 place-items-center rounded-full border border-border text-navy disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <CaretLeft weight="duotone" className="h-4 w-4" />
                </button>
                <span className="tnum text-xs text-muted-foreground">
                  Page {current + 1} of {pages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                  disabled={current >= pages - 1}
                  className="grid h-9 w-9 place-items-center rounded-full border border-border text-navy disabled:opacity-40"
                  aria-label="Next page"
                >
                  <CaretRight weight="duotone" className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* quick-view drawer */}
      <Sheet open={Boolean(open)} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {open && quickView && <QuickViewBody view={quickView(open)} />}
        </SheetContent>
      </Sheet>

      {/* destructive confirmation */}
      <AlertDialog open={Boolean(confirm)} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title ?? "Are you sure?"}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-maple text-white hover:bg-maple/90"
              onClick={() => {
                confirm?.run();
                setConfirm(null);
              }}
            >
              Yes, continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function RowMenu<T>({ actions, onPick }: { actions: RowAction<T>[]; onPick: (a: RowAction<T>) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Row actions"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-navy hover:bg-navy-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <DotsThree weight="bold" className="h-5 w-5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.map((a) => (
          <DropdownMenuItem
            key={a.key}
            onSelect={() => onPick(a)}
            className={a.destructive ? "text-maple focus:text-maple" : ""}
          >
            {a.Icon && <a.Icon weight="duotone" className="mr-2 h-4 w-4" aria-hidden="true" />}
            {a.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function QuickViewBody({ view }: { view: QuickView }) {
  return (
    <>
      <SheetHeader className="text-left">
        <SheetTitle className="font-display text-xl font-extrabold text-navy">{view.title}</SheetTitle>
        {view.subtitle && <SheetDescription>{view.subtitle}</SheetDescription>}
      </SheetHeader>
      {view.status && (
        <div className="mt-3">
          <StatusLabel status={view.status} />
        </div>
      )}
      <dl className="mt-5 space-y-3">
        {view.fields.map((f) => (
          <div key={f.label} className="border-b border-border pb-3 last:border-0">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{f.label}</dt>
            <dd className="mt-0.5 text-sm font-medium text-foreground">{f.value}</dd>
          </div>
        ))}
      </dl>
      {view.actions && <div className="mt-5 flex flex-wrap gap-2">{view.actions}</div>}
      {view.extra && <div className="mt-5">{view.extra}</div>}
    </>
  );
}
