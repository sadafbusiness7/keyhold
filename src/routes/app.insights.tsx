import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, ArrowUp, ChartBar, Info } from "@phosphor-icons/react";
import { RequireFinancials } from "@/components/keyhold/access-guard";
import { PageHeader } from "@/components/keyhold/app-shell";
import { EmptyState } from "@/components/keyhold/empty-state";
import { usePermissions } from "@/lib/mock-access";
import { useRent } from "@/lib/mock-rent";
import { useMaintenance } from "@/lib/mock-maintenance";
import { units as allUnits, tenants, leases, longDate } from "@/lib/mock-data";
import { money } from "@/lib/rent-engine";
import { occupancyByMonth } from "@/lib/chart-data";
import {
  CollectionRateChart,
  ComparisonChart,
  ExpenseTrendChart,
  NoiByPropertyChart,
  OccupancyChart,
} from "@/components/keyhold/lazy-charts";
import {
  buildKpis,
  collectionByMonth,
  expenseTrend,
  kpiDelta,
  kpiTone,
  monthLabel,
  monthYearLabel,
  noiByProperty,
  paymentPatterns,
  periodRange,
  periodsEnding,
  repeatedIssueUnits,
  shiftPeriod,
  type Kpi,
} from "@/lib/report-engine";

export const Route = createFileRoute("/app/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Keyhold" },
      {
        name: "description",
        content:
          "Trends for rent collection, occupancy, expenses and net operating income, with month-over-month and year-over-year comparisons.",
      },
      { property: "og:title", content: "Insights — Keyhold" },
      { property: "og:description", content: "Top-line KPIs, trend charts and portfolio health signals for your rentals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireFinancials title="Insights">
      <InsightsPage />
    </RequireFinancials>
  ),
});

type Compare = "month" | "year";

function InsightsPage() {
  const perms = usePermissions();
  const rent = useRent();
  const maintenance = useMaintenance();

  const [propertyId, setPropertyId] = useState("all");
  const [compare, setCompare] = useState<Compare>("month");

  const today = rent.today;
  const thisPeriod = today.slice(0, 7);
  const priorPeriod = compare === "month" ? shiftPeriod(thisPeriod, -1) : shiftPeriod(thisPeriod, -12);

  const properties = perms.properties.filter((p) => perms.canSeeFinancials(p.id));
  const scopedProperties = propertyId === "all" ? properties : properties.filter((p) => p.id === propertyId);
  const propertyIds = new Set(scopedProperties.map((p) => p.id));
  const units = allUnits.filter((u) => propertyIds.has(u.propertyId));
  const unitIds = new Set(units.map((u) => u.id));

  const invoices = rent.invoices.filter((i) => unitIds.has(i.unitId));
  const invoiceIds = new Set(invoices.map((i) => i.id));
  const payments = rent.payments.filter((p) => invoiceIds.has(p.invoiceId));
  const bills = maintenance.bills.filter((b) => propertyIds.has(b.propertyId));
  const requests = maintenance.requests.filter((r) => propertyIds.has(r.propertyId));
  const workOrders = maintenance.workOrders.filter((w) => propertyIds.has(w.propertyId));
  const scopedLeases = leases.filter((l) => unitIds.has(l.unitId));

  const range = periodRange(thisPeriod);
  const previous = periodRange(priorPeriod);

  const kpis = useMemo(
    () => buildKpis({ invoices, payments, bills, leases: scopedLeases, units, range, previous }),
    [propertyId, compare, rent.invoices, rent.payments, maintenance.bills],
  );

  const collection = collectionByMonth({ invoices, payments, today, months: 12 });
  const trend = expenseTrend({ invoices, payments, bills, today, months: 12 });
  const occupancyTrend = occupancyByMonth({ leases: scopedLeases, units, today, months: 12 });
  const noiNow = noiByProperty({ properties: scopedProperties, units, invoices, payments, bills, range });
  const noiBefore = noiByProperty({ properties: scopedProperties, units, invoices, payments, bills, range: previous });

  const propertyCompare = noiNow.map((row) => ({
    label: row.property,
    a: noiBefore.find((r) => r.propertyId === row.propertyId)?.noiCents ?? 0,
    b: row.noiCents,
  }));

  const periodCompare = useMemo(() => {
    const periods = periodsEnding(today, 6);
    return periods.map((period) => {
      const now = collection.find((c) => c.period === period);
      const before = collection.find((c) => c.period === shiftPeriod(period, compare === "month" ? -1 : -12));
      return { label: monthLabel(period), a: before?.ratePct ?? 0, b: now?.ratePct ?? 0 };
    });
  }, [collection, compare, today]);

  const repeats = repeatedIssueUnits({ requests, workOrders, bills, units, properties: scopedProperties, range: { from: shiftPeriod(thisPeriod, -11) + "-01", to: today } });
  const patterns = paymentPatterns({ invoices, payments, units, properties: scopedProperties, tenants, today, months: 6 });

  return (
    <>
      <PageHeader
        title="Insights"
        subtitle={`Trends and comparisons across your portfolio, as at ${longDate(today)}. Every figure is calculated from your own records.`}
        action={
          <Link
            to="/app/reports"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            <ChartBar weight="duotone" className="h-5 w-5" aria-hidden="true" /> Report library
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-navy">Property</span>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="min-h-11 rounded-full border border-input bg-background px-4 text-sm"
          >
            <option value="all">All properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <div className="inline-flex rounded-full border border-border p-1" role="tablist" aria-label="Comparison period">
          {([
            { key: "month", label: "This month vs last" },
            { key: "year", label: "Year over year" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={compare === key}
              onClick={() => setCompare(key)}
              className={`min-h-11 rounded-full px-4 text-sm font-semibold ${
                compare === key ? "bg-navy text-primary-foreground" : "text-navy hover:bg-navy-soft"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Comparing <span className="font-semibold text-navy">{monthYearLabel(thisPeriod)}</span> against{" "}
          <span className="font-semibold text-navy">{monthYearLabel(priorPeriod)}</span>.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} priorLabel={monthYearLabel(priorPeriod)} />
        ))}
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-2">
        <CollectionRateChart data={collection} />
        <OccupancyChart data={occupancyTrend} />
        <ExpenseTrendChart data={trend} />
        <NoiByPropertyChart data={noiNow} />
        <ComparisonChart
          title="Property vs property"
          hint={`Net operating income, ${monthYearLabel(priorPeriod)} against ${monthYearLabel(thisPeriod)}.`}
          data={propertyCompare}
          seriesA={monthLabel(priorPeriod)}
          seriesB={monthLabel(thisPeriod)}
        />
        <ComparisonChart
          title="Period vs period"
          hint={compare === "month" ? "Each month's collection rate against the month before." : "Each month's collection rate against the same month last year."}
          data={periodCompare}
          seriesA={compare === "month" ? "Month before" : "Same month last year"}
          seriesB="This period"
          money={false}
        />
      </div>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="card-soft p-4">
          <header className="mb-3">
            <h2 className="font-display text-base font-bold text-navy">Homes with repeated maintenance</h2>
            <p className="text-xs text-muted-foreground">Two or more requests in the last twelve months. A count of jobs, nothing more.</p>
          </header>
          {repeats.length === 0 ? (
            <EmptyState Icon={Info} title="No repeat callouts" body="No home has needed more than one visit in the last year." />
          ) : (
            <ul className="divide-y divide-border">
              {repeats.map((row) => (
                <li key={row.unitId} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-navy">{row.unit} · {row.property}</span>
                    <span className="block text-xs text-muted-foreground">{row.categories.join(", ")}</span>
                  </span>
                  <span className="tnum text-sm font-semibold text-navy">
                    {row.requests} requests · {money(row.costCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card-soft p-4">
          <header className="mb-3">
            <h2 className="font-display text-base font-bold text-navy">Payment patterns</h2>
            <p className="text-xs text-muted-foreground">
              Average days between due date and payment, recent months against earlier ones. Descriptive only — Keyhold never
              scores or ranks a tenant.
            </p>
          </header>
          {patterns.length === 0 ? (
            <EmptyState Icon={Info} title="Not enough history" body="Patterns appear once there are payments in both halves of the window." />
          ) : (
            <ul className="divide-y divide-border">
              {patterns.map((row) => (
                <li key={row.tenantId} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-navy">{row.tenant}</span>
                    <span className="block text-xs text-muted-foreground">
                      {row.property} · {row.paymentsCounted} payments counted
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="tnum block text-sm font-semibold text-navy">
                      {row.earlierAvgDaysLate} → {row.recentAvgDaysLate} days
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {row.direction === "later"
                        ? `Paying ${Math.abs(row.changeDays)} days later than before`
                        : row.direction === "earlier"
                          ? `Paying ${Math.abs(row.changeDays)} days sooner than before`
                          : "About the same as before"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <p className="mt-4 text-xs text-muted-foreground">
        Insights describe what has already happened. They are not predictions, credit assessments or advice, and no figure here is
        estimated or generated.
      </p>
    </>
  );
}

function formatKpi(kpi: Kpi, value: number) {
  if (kpi.format === "money") return money(Math.round(value));
  if (kpi.format === "pct") return `${value}%`;
  if (kpi.format === "days") return `${value} days`;
  return String(value);
}

function KpiCard({ kpi, priorLabel }: { kpi: Kpi; priorLabel: string }) {
  const delta = kpiDelta(kpi);
  const tone = kpiTone(kpi);
  const Icon = delta === 0 ? ArrowRight : delta > 0 ? ArrowUp : ArrowDown;
  const toneClass = tone === "good" ? "text-success" : tone === "bad" ? "text-maple" : "text-muted-foreground";
  const railClass = tone === "good" ? "bg-success" : tone === "bad" ? "bg-maple" : "bg-border";
  const wording = tone === "good" ? "better" : tone === "bad" ? "worse" : "unchanged";
  return (
    <div className="relative overflow-hidden card-soft p-4 pl-5">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${railClass}`} />
      <p className="text-sm text-muted-foreground">{kpi.label}</p>
      <p className="money mt-1 text-2xl font-extrabold text-navy">{formatKpi(kpi, kpi.value)}</p>
      <p className={`mt-1 flex items-center gap-1 text-xs font-semibold ${toneClass}`}>
        <Icon weight="bold" className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="tnum">
          {delta === 0 ? "No change" : `${delta > 0 ? "+" : ""}${formatKpi(kpi, Math.abs(delta))}`} — {wording}
        </span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {priorLabel}: <span className="tnum">{formatKpi(kpi, kpi.previous)}</span>. {kpi.help}
      </p>
    </div>
  );
}
