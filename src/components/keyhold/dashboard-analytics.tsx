/**
 * DASHBOARD ANALYTICS — the modern money-and-portfolio surface.
 * Every figure is derived from the same invoices, payments, bills and leases
 * the tables use; nothing here invents a number. Charts are lazy so the
 * dashboard stays fast, and the filters only reshape existing data.
 */
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CurrencyDollar,
  House,
  Minus,
  Warning,
  Wrench,
} from "@phosphor-icons/react";
import { usePermissions } from "@/lib/mock-access";
import { useRent } from "@/lib/mock-rent";
import { useMaintenance } from "@/lib/mock-maintenance";
import { units as allUnits, leases as allLeases } from "@/lib/mock-data";
import { money } from "@/lib/rent-engine";
import {
  expenseByCategory,
  incomeExpenseByMonth,
  occupancyByMonth,
  periodLabel,
  rentByMonth,
} from "@/lib/chart-data";
import {
  IncomeExpenseChart,
  LeaseExpiryChart,
  MaintenanceDonut,
  OccupancyChart,
  RentBarChart,
} from "./lazy-charts";
import { EmptyState } from "./empty-state";

type View = "rent" | "cashflow" | "occupancy" | "spend" | "expiry";

const VIEWS: { id: View; label: string; hint: string }[] = [
  { id: "rent", label: "Rent collected", hint: "Collected against expected, month by month." },
  { id: "cashflow", label: "Income vs expenses", hint: "Money in against approved bills." },
  { id: "occupancy", label: "Occupancy", hint: "Share of homes with a lease running." },
  { id: "spend", label: "Where money goes", hint: "Approved repair spend by category." },
  { id: "expiry", label: "Lease expiries", hint: "Leases ending in each month ahead." },
];

const RANGES = [3, 6, 12] as const;

function DeltaChip({ pct }: { pct: number | null }) {
  if (pct === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunk px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
        <Minus weight="bold" className="h-3 w-3" aria-hidden="true" /> no prior month
      </span>
    );
  }
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tnum ${
        up ? "bg-success-soft text-success" : "bg-maple-soft text-maple"
      }`}
    >
      {up ? (
        <ArrowUp weight="bold" className="h-3 w-3" aria-hidden="true" />
      ) : (
        <ArrowDown weight="bold" className="h-3 w-3" aria-hidden="true" />
      )}
      {Math.abs(pct)}% vs last month
    </span>
  );
}

function Sparkline({ values, tone }: { values: number[]; tone: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="mt-3 flex h-8 items-end gap-1" aria-hidden="true">
      {values.map((v, i) => (
        <span
          key={i}
          className={`flex-1 rounded-sm ${tone} ${i === values.length - 1 ? "opacity-100" : "opacity-45"}`}
          style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function KpiCard({
  Icon,
  label,
  value,
  sub,
  delta,
  spark,
  tone,
  to,
}: {
  Icon: typeof House;
  label: string;
  value: string;
  sub: string;
  delta?: number | null;
  spark?: number[];
  tone: "success" | "warning" | "action" | "maple";
  to: string;
}) {
  const chip = {
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    action: "bg-action-soft text-action",
    maple: "bg-maple-soft text-maple",
  }[tone];
  const bar = { success: "bg-success", warning: "bg-warning", action: "bg-action", maple: "bg-maple" }[tone];
  return (
    <Link to={to} className="card-soft kh-enter block p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${chip}`}>
          <Icon weight="duotone" className="h-5 w-5" aria-hidden="true" />
        </span>
        {delta !== undefined && <DeltaChip pct={delta} />}
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="money mt-0.5 text-2xl font-extrabold text-navy">{value}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>
      {spark && spark.length > 1 && <Sparkline values={spark} tone={bar} />}
    </Link>
  );
}

export function DashboardAnalytics() {
  const perms = usePermissions();
  const rent = useRent();
  const maintenance = useMaintenance();

  const [view, setView] = useState<View>("rent");
  const [months, setMonths] = useState<(typeof RANGES)[number]>(6);
  const [propertyId, setPropertyId] = useState("all");

  const properties = perms.properties.filter((p) => perms.canSeeFinancials(p.id));
  const scoped = propertyId === "all" ? properties : properties.filter((p) => p.id === propertyId);
  const propertyIds = new Set(scoped.map((p) => p.id));
  const units = allUnits.filter((u) => propertyIds.has(u.propertyId));
  const unitIds = new Set(units.map((u) => u.id));

  const invoices = rent.invoices.filter((i) => unitIds.has(i.unitId));
  const invoiceIds = new Set(invoices.map((i) => i.id));
  const payments = rent.payments.filter((p) => invoiceIds.has(p.invoiceId));
  const bills = maintenance.bills.filter((b) => propertyIds.has(b.propertyId));
  const requests = maintenance.requests.filter((r) => propertyIds.has(r.propertyId));
  const workOrders = maintenance.workOrders.filter((w) => propertyIds.has(w.propertyId));
  const leases = allLeases.filter((l) => unitIds.has(l.unitId));
  const today = rent.today;

  const rentSeries = useMemo(
    () => rentByMonth({ invoices, payments, today, months }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rent.invoices, rent.payments, today, months, propertyId],
  );
  const cashflow = useMemo(
    () => incomeExpenseByMonth({ invoices, payments, bills, today, months }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rent.invoices, rent.payments, maintenance.bills, today, months, propertyId],
  );
  const occupancy = useMemo(
    () => occupancyByMonth({ leases, units, today, months }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, months, propertyId],
  );
  const spend = useMemo(
    () => expenseByCategory({ bills, workOrders, requests }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maintenance.bills, maintenance.workOrders, maintenance.requests, propertyId],
  );
  const expiry = useMemo(() => {
    const start = Number(today.slice(0, 4)) * 12 + Number(today.slice(5, 7)) - 1;
    const buckets: string[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(Date.UTC(Math.floor((start + i) / 12), (start + i) % 12, 1));
      buckets.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
    }
    return buckets.map((period) => ({
      label: periodLabel(period),
      leases: leases.filter((l) => l.end.slice(0, 7) === period).length,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, propertyId]);

  const current = rentSeries[rentSeries.length - 1];
  const prior = rentSeries[rentSeries.length - 2];
  const collected = current?.collectedCents ?? 0;
  const expected = current?.expectedCents ?? 0;
  const outstanding = Math.max(0, expected - collected);
  const collectedDelta =
    prior && prior.collectedCents > 0
      ? Math.round(((collected - prior.collectedCents) / prior.collectedCents) * 100)
      : null;

  const occupied = units.filter((u) => u.tenantId).length;
  const occNow = units.length > 0 ? Math.round((occupied / units.length) * 100) : 0;
  const openRepairs = requests.filter((r) => r.status !== "resolved" && r.status !== "cancelled").length;

  if (properties.length === 0) {
    return (
      <EmptyState
        Icon={House}
        title="No properties in view"
        body="Once a property is assigned to you, its money and occupancy charts appear here."
      />
    );
  }

  return (
    <section aria-labelledby="analytics-heading" className="mb-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="analytics-heading" className="font-display text-lg font-bold">
          Your money at a glance
        </h2>
        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="sr-only sm:not-sr-only">Property</span>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="min-h-11 rounded-full border border-border bg-card px-3 text-sm font-semibold text-navy"
          >
            <option value="all">All properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          Icon={CurrencyDollar}
          label="Collected this month"
          value={money(collected)}
          sub={`of ${money(expected)} expected · ${expected > 0 ? Math.round((collected / expected) * 100) : 0}%`}
          delta={collectedDelta}
          spark={rentSeries.map((r) => r.collectedCents)}
          tone="success"
          to="/app/rent"
        />
        <KpiCard
          Icon={Warning}
          label="Still owed"
          value={money(outstanding)}
          sub={outstanding === 0 ? "Everyone is paid up" : "Chase before the month closes"}
          spark={rentSeries.map((r) => Math.max(0, r.expectedCents - r.collectedCents))}
          tone="maple"
          to="/app/rent"
        />
        <KpiCard
          Icon={House}
          label="Occupancy"
          value={`${occNow}%`}
          sub={`${occupied} of ${units.length} homes lived in`}
          spark={occupancy.map((o) => o.ratePct)}
          tone="action"
          to="/app/properties"
        />
        <KpiCard
          Icon={Wrench}
          label="Open repairs"
          value={String(openRepairs)}
          sub={openRepairs === 0 ? "Nothing outstanding" : "Waiting on you or a vendor"}
          tone="warning"
          to="/app/maintenance"
        />
      </div>

      <div className="card-soft mt-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Choose a chart"
            className="flex flex-wrap gap-1.5 rounded-full bg-surface-sunk p-1"
          >
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={view === v.id}
                onClick={() => setView(v.id)}
                className={`min-h-11 rounded-full px-3.5 text-sm font-semibold transition-colors ${
                  view === v.id ? "bg-navy text-primary-foreground" : "text-navy hover:bg-navy-soft"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          {view !== "spend" && view !== "expiry" && (
            <div className="flex gap-1.5 rounded-full bg-surface-sunk p-1">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setMonths(r)}
                  aria-pressed={months === r}
                  className={`min-h-11 rounded-full px-3 text-sm font-semibold tnum transition-colors ${
                    months === r ? "bg-navy text-primary-foreground" : "text-navy hover:bg-navy-soft"
                  }`}
                >
                  {r}m
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="mt-2 text-xs text-muted-foreground">{VIEWS.find((v) => v.id === view)!.hint}</p>

        <div className="mt-3">
          {view === "rent" && <RentBarChart data={rentSeries} />}
          {view === "cashflow" && <IncomeExpenseChart data={cashflow} />}
          {view === "occupancy" && <OccupancyChart data={occupancy} />}
          {view === "spend" &&
            (spend.length === 0 ? (
              <EmptyState
                Icon={Wrench}
                title="No approved repair spend yet"
                body="Approved bills appear here grouped by the kind of work."
              />
            ) : (
              <MaintenanceDonut data={spend} />
            ))}
          {view === "expiry" && <LeaseExpiryChart data={expiry} />}
        </div>

        <Link
          to="/app/insights"
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-action"
        >
          Open full insights <ArrowRight weight="duotone" className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
