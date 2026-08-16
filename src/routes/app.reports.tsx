import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookmarkSimple, DownloadSimple, FilePdf, Trash, ChartLineUp } from "@phosphor-icons/react";
import { toast } from "sonner";
import { RequireFinancials } from "@/components/keyhold/access-guard";
import { PageHeader } from "@/components/keyhold/app-shell";
import { usePermissions } from "@/lib/mock-access";
import { useRent } from "@/lib/mock-rent";
import { useMaintenance } from "@/lib/mock-maintenance";
import { useOwners } from "@/lib/mock-owners";
import { units as allUnits, tenants, leases, longDate } from "@/lib/mock-data";
import {
  CollectionRateChart,
  IncomeExpenseChart,
  LeaseExpiryChart,
  MaintenanceDonut,
  NoiByPropertyChart,
  OccupancyChart,
} from "@/components/keyhold/lazy-charts";
import { expenseByCategory, incomeExpenseByMonth, occupancyByMonth, rentByMonth } from "@/lib/chart-data";
import { money, downloadFile } from "@/lib/rent-engine";
import {
  agedReceivables,
  disbursementStatement,
  downloadTablesPdf,
  incomeVsExpense,
  latePayers,
  occupancy,
  outstanding,
  rentRoll,
  tableToCsv,
  yearToDate,
  type ExportTable,
} from "@/lib/finance-engine";
import {
  depositLedger,
  expiriesByMonth,
  leaseExpirySchedule,
  loadSavedViews,
  maintenanceByCategory,
  maintenanceSummary,
  noiByProperty,
  storeSavedViews,
  vacancyDetail,
  vendorSpend,
  type SavedView,
} from "@/lib/report-engine";

export const Route = createFileRoute("/app/reports")({
  head: () => ({
    meta: [
      { title: "Report library — Keyhold" },
      {
        name: "description",
        content:
          "Rent roll, income vs expense, aged receivables, arrears, late payers, occupancy, maintenance, vendor spend, lease expiry, owner statements and deposits — filterable and exportable.",
      },
      { property: "og:title", content: "Report library — Keyhold" },
      { property: "og:description", content: "Eleven deterministic reports for your portfolio, exportable to CSV or PDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireFinancials title="Reports">
      <ReportsPage />
    </RequireFinancials>
  ),
});

type ReportKey =
  | "rent-roll"
  | "income-expense"
  | "aged"
  | "outstanding"
  | "late"
  | "occupancy"
  | "maintenance"
  | "vendor-spend"
  | "lease-expiry"
  | "disbursements"
  | "deposits";

const REPORTS: { key: ReportKey; label: string; blurb: string }[] = [
  { key: "rent-roll", label: "Rent roll", blurb: "Every home, who lives there, what they pay and when the lease ends." },
  { key: "income-expense", label: "Income vs expenses", blurb: "Money in against approved bills, per property and consolidated." },
  { key: "aged", label: "Aged receivables", blurb: "Unpaid balances split into 30 / 60 / 90+ day buckets." },
  { key: "outstanding", label: "Outstanding rent", blurb: "Every invoice still owing, oldest first." },
  { key: "late", label: "Habitual late payers", blurb: "How often each tenant pays after the due date." },
  { key: "occupancy", label: "Occupancy & vacancy", blurb: "Filled homes, days empty and the rent that empty time costs." },
  { key: "maintenance", label: "Maintenance summary", blurb: "Job volume, average time to resolve and cost per property." },
  { key: "vendor-spend", label: "Vendor spend", blurb: "What each trade was paid, and what's still awaiting approval." },
  { key: "lease-expiry", label: "Lease expiry schedule", blurb: "Every tenancy ending in the next twelve months." },
  { key: "disbursements", label: "Owner disbursements", blurb: "Statement and net payable for each managed property." },
  { key: "deposits", label: "Security deposit ledger", blurb: "Deposits held, applied and returned." },
];

function ReportsPage() {
  const perms = usePermissions();
  const rent = useRent();
  const maintenance = useMaintenance();
  const owners = useOwners();

  const [report, setReport] = useState<ReportKey>("rent-roll");
  const [propertyId, setPropertyId] = useState<string>("all");
  const ytd = yearToDate(rent.today);
  const [from, setFrom] = useState(ytd.from);
  const [to, setTo] = useState(ytd.to);

  const [views, setViews] = useState<SavedView[]>([]);
  useEffect(() => setViews(loadSavedViews()), []);
  const persist = (next: SavedView[]) => {
    setViews(next);
    storeSavedViews(next);
  };

  const properties = perms.properties.filter((p) => perms.canSeeFinancials(p.id));
  const scopedProperties = propertyId === "all" ? properties : properties.filter((p) => p.id === propertyId);
  const propertyIds = new Set(scopedProperties.map((p) => p.id));
  const units = allUnits.filter((u) => propertyIds.has(u.propertyId));
  const unitIds = new Set(units.map((u) => u.id));
  const range = { from, to };
  const today = rent.today;

  const invoices = useMemo(
    () => rent.invoices.filter((i) => unitIds.has(i.unitId)),
    [rent.invoices, propertyId, properties.length],
  );
  const invoiceIds = new Set(invoices.map((i) => i.id));
  const payments = rent.payments.filter((p) => invoiceIds.has(p.invoiceId));
  const bills = maintenance.bills.filter((b) => propertyIds.has(b.propertyId));
  const requests = maintenance.requests.filter((r) => propertyIds.has(r.propertyId));
  const workOrders = maintenance.workOrders.filter((w) => propertyIds.has(w.propertyId));
  const scopedLeases = leases.filter((l) => unitIds.has(l.unitId));

  const trend = rentByMonth({ invoices, payments, today, months: 6 });
  const incomeExpense = incomeExpenseByMonth({ invoices, payments, bills, today, months: 6 });
  const categorySpend = expenseByCategory({ bills, workOrders, requests });
  const occupancyTrend = occupancyByMonth({ leases: scopedLeases, units, today, months: 6 });
  const noiRows = noiByProperty({ properties: scopedProperties, units, invoices, payments, bills, range });
  const expiryRows = leaseExpirySchedule({ leases: scopedLeases, units, properties: scopedProperties, tenants, today });
  const expiryMonths = expiriesByMonth(expiryRows, today);

  const statements = useMemo(
    () =>
      scopedProperties
        .map((property) => ({ property, config: owners.configFor(property.id) }))
        .filter((x) => x.config.managed)
        .map((x) =>
          disbursementStatement({
            property: x.property,
            config: x.config,
            units: allUnits,
            tenants,
            invoices,
            payments,
            bills,
            range,
          }),
        ),
    [scopedProperties.length, propertyId, owners.configs, invoices, payments, bills, from, to],
  );

  const table: ExportTable = useMemo(() => {
    if (report === "rent-roll") {
      const rows = rentRoll({ properties: scopedProperties, units, leases: scopedLeases, tenants });
      return {
        title: "Rent roll",
        headers: ["Home", "Property", "Tenant", "Monthly rent", "Lease start", "Lease end", "Occupancy"],
        rows: rows.map((r) => [
          r.unit,
          r.property,
          r.tenant,
          money(r.rentCents),
          r.leaseStart,
          r.leaseEnd,
          r.occupied ? "Lived in" : "Empty",
        ]),
      };
    }
    if (report === "income-expense") {
      const rows = incomeVsExpense({ properties: scopedProperties, units, invoices, payments, bills, range });
      const totals = rows.reduce(
        (a, r) => ({
          rent: a.rent + r.rentCents,
          other: a.other + r.otherIncomeCents,
          expense: a.expense + r.expenseCents,
          net: a.net + r.netCents,
        }),
        { rent: 0, other: 0, expense: 0, net: 0 },
      );
      return {
        title: "Income vs expenses",
        headers: ["Property", "Rent received", "Other income", "Expenses", "Net"],
        rows: [
          ...rows.map((r) => [r.property, money(r.rentCents), money(r.otherIncomeCents), money(r.expenseCents), money(r.netCents)]),
          ["Consolidated", money(totals.rent), money(totals.other), money(totals.expense), money(totals.net)],
        ],
      };
    }
    if (report === "aged") {
      const rows = agedReceivables(
        outstanding({ invoices, payments, units, properties: scopedProperties, tenants, today }),
      );
      return {
        title: "Aged receivables",
        headers: ["Age", "Amount owing"],
        rows: rows.map((r) => [r.bucket, money(r.totalCents)]),
      };
    }
    if (report === "outstanding") {
      const rows = outstanding({ invoices, payments, units, properties: scopedProperties, tenants, today });
      return {
        title: "Outstanding rent",
        headers: ["Tenant", "Property", "Home", "For", "Due", "Owing", "Days late"],
        rows: rows.map((r) => [r.tenant, r.property, r.unit, r.description, r.dueDate, money(r.balanceCents), r.daysLate]),
      };
    }
    if (report === "late") {
      const rows = latePayers({ invoices, payments, units, properties: scopedProperties, tenants, range, today });
      return {
        title: "Habitual late payers",
        headers: ["Tenant", "Property", "Payments", "Late payments", "Average days late", "Still owing"],
        rows: rows.map((r) => [r.tenant, r.property, r.paymentsCounted, r.lateCount, r.avgDaysLate, money(r.stillOwingCents)]),
      };
    }
    if (report === "occupancy") {
      const summary = occupancy(scopedProperties, units);
      const detail = vacancyDetail({ properties: scopedProperties, units, today });
      return {
        title: "Occupancy & vacancy",
        headers: ["Home", "Property", "Status", "Days empty", "Asking rent", "Lost rent"],
        rows: [
          ...detail.map((r) => [r.unit, r.property, r.status, r.daysVacant, money(r.askingRentCents), money(r.lostRentCents)]),
          ...summary.map((s) => [`${s.property} — occupancy`, `${s.filled} of ${s.total} lived in`, `${s.ratePct}%`, "", "", ""]),
        ],
      };
    }
    if (report === "maintenance") {
      const rows = maintenanceSummary({ properties: scopedProperties, units, requests, workOrders, bills, range });
      const categories = maintenanceByCategory({ requests, workOrders, bills });
      return {
        title: "Maintenance summary",
        headers: ["Property", "Jobs opened", "Resolved", "Still open", "Average days to resolve", "Cost", "Cost per home"],
        rows: [
          ...rows.map((r) => [r.property, r.opened, r.resolved, r.openNow, r.avgResolutionDays, money(r.costCents), money(r.costPerUnitCents)]),
          ...categories.map((c) => [`Category — ${c.category}`, c.jobs, "", "", "", money(c.costCents), ""]),
        ],
      };
    }
    if (report === "vendor-spend") {
      const rows = vendorSpend({ vendors: maintenance.vendors, workOrders, bills, range });
      return {
        title: "Vendor spend",
        headers: ["Vendor", "Trade", "Jobs", "Bills approved", "Spent", "Awaiting approval", "Average bill", "Last job"],
        rows: rows.map((r) => [r.vendor, r.trade, r.jobs, r.billsApproved, money(r.spentCents), money(r.awaitingCents), money(r.avgBillCents), r.lastJob]),
      };
    }
    if (report === "lease-expiry") {
      return {
        title: "Lease expiry schedule",
        headers: ["Tenant", "Property", "Home", "Term", "Ends", "Days away", "Monthly rent"],
        rows: expiryRows.map((r) => [r.tenant, r.property, r.unit, r.termType, longDate(r.endDate), r.daysToEnd, money(r.rentCents)]),
      };
    }
    if (report === "disbursements") {
      return {
        title: "Owner disbursement statements",
        headers: ["Property", "Rent received", "Other income", "Expenses", "Management fee", "Fee tax", "Net payable"],
        rows: statements.map((s) => [
          s.property,
          money(s.rentReceivedCents),
          money(s.otherIncomeCents),
          money(s.expenseTotalCents),
          money(s.feeCents),
          money(s.feeTaxCents),
          money(s.netPayableCents),
        ]),
      };
    }
    const rows = depositLedger({ leases: scopedLeases, units, properties: scopedProperties, tenants, invoices, payments, today });
    return {
      title: "Security deposit ledger",
      headers: ["Tenant", "Property", "Home", "State", "Held", "Applied", "Returned", "Since"],
      rows: rows.map((r) => [r.tenant, r.property, r.unit, r.state, money(r.heldCents), money(r.appliedCents), money(r.returnedCents), r.since]),
    };
  }, [report, propertyId, from, to, invoices, payments, bills, requests.length, workOrders.length, today, properties.length, statements]);

  const subtitle = `${propertyId === "all" ? "All properties" : scopedProperties[0]?.name ?? ""} · ${longDate(from)} – ${longDate(to)}`;

  const totalsRow = useMemo(() => {
    if (report !== "income-expense") return null;
    const rows = incomeVsExpense({ properties: scopedProperties, units, invoices, payments, bills, range });
    return {
      rent: rows.reduce((s, r) => s + r.rentCents, 0),
      other: rows.reduce((s, r) => s + r.otherIncomeCents, 0),
      expense: rows.reduce((s, r) => s + r.expenseCents, 0),
      net: rows.reduce((s, r) => s + r.netCents, 0),
    };
  }, [report, table]);

  const saveView = () => {
    const name = window.prompt("Name this view", `${REPORTS.find((r) => r.key === report)?.label} · ${subtitle}`);
    if (!name) return;
    persist([...views, { id: `view-${Date.now()}`, name, report, propertyId, from, to }]);
    toast.success("View saved.");
  };

  const applyView = (view: SavedView) => {
    setReport(view.report as ReportKey);
    setPropertyId(view.propertyId);
    setFrom(view.from);
    setTo(view.to);
    toast.success(`Showing “${view.name}”.`);
  };

  return (
    <>
      <PageHeader
        title="Report library"
        subtitle="Eleven reports, every figure computed from your own records. All amounts in Canadian dollars."
        action={
          <div className="col-span-full flex flex-wrap gap-2 sm:col-auto">
            <Link
              to="/app/insights"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
            >
              <ChartLineUp weight="duotone" className="h-5 w-5" aria-hidden="true" /> Insights
            </Link>
            <button
              type="button"
              onClick={saveView}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
            >
              <BookmarkSimple weight="duotone" className="h-5 w-5" aria-hidden="true" /> Save view
            </button>
            <button
              type="button"
              onClick={() => {
                downloadFile(`${report}-${from}-to-${to}.csv`, tableToCsv(table));
                toast.success("CSV downloaded.");
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
            >
              <DownloadSimple weight="duotone" className="h-5 w-5" aria-hidden="true" /> CSV
            </button>
            <button
              type="button"
              onClick={() => {
                downloadTablesPdf(`${report}-${from}-to-${to}.pdf`, { title: table.title, subtitle, tables: [table] });
                toast.success("PDF downloaded.");
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
            >
              <FilePdf weight="duotone" className="h-5 w-5" aria-hidden="true" /> PDF
            </button>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Reports">
        {REPORTS.map((r) => (
          <button
            key={r.key}
            type="button"
            role="tab"
            aria-selected={report === r.key}
            onClick={() => setReport(r.key)}
            className={`min-h-11 rounded-full px-4 text-sm font-semibold ${
              report === r.key ? "bg-navy text-primary-foreground" : "border border-border text-navy hover:bg-navy-soft"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

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
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-navy">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="tnum min-h-11 rounded-full border border-input bg-background px-4 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-navy">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="tnum min-h-11 rounded-full border border-input bg-background px-4 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setFrom(ytd.from);
            setTo(ytd.to);
          }}
          className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
        >
          Year to date
        </button>
      </div>

      {views.length > 0 && (
        <section className="mb-5" aria-label="Saved views">
          <h2 className="mb-2 text-sm font-semibold text-navy">Saved views</h2>
          <ul className="flex flex-wrap gap-2">
            {views.map((view) => (
              <li key={view.id} className="flex items-center gap-1 rounded-full border border-border pr-1">
                <button
                  type="button"
                  onClick={() => applyView(view)}
                  className="min-h-11 rounded-full px-4 text-sm font-medium text-navy hover:bg-navy-soft"
                >
                  {view.name}
                </button>
                <button
                  type="button"
                  onClick={() => persist(views.filter((v) => v.id !== view.id))}
                  aria-label={`Delete saved view ${view.name}`}
                  className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-navy-soft hover:text-maple"
                >
                  <Trash weight="duotone" className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {totalsRow && (
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <Metric label="Rent received" value={money(totalsRow.rent)} tone="text-success" rail="bg-success" />
          <Metric label="Other income" value={money(totalsRow.other)} tone="text-navy" rail="bg-navy" />
          <Metric label="Expenses" value={money(totalsRow.expense)} tone="text-maple" rail="bg-maple" />
          <Metric label="Net" value={money(totalsRow.net)} tone="text-navy" rail="bg-action" />
        </div>
      )}

      <div className="mb-5 grid gap-3 lg:grid-cols-2">
        {(report === "income-expense" || report === "disbursements") && <IncomeExpenseChart data={incomeExpense} />}
        {(report === "income-expense" || report === "disbursements") && <NoiByPropertyChart data={noiRows} />}
        {(report === "aged" || report === "outstanding" || report === "late" || report === "rent-roll") && (
          <CollectionRateChart data={trend} />
        )}
        {(report === "occupancy" || report === "rent-roll") && <OccupancyChart data={occupancyTrend} />}
        {(report === "maintenance" || report === "vendor-spend") && <MaintenanceDonut data={categorySpend} />}
        {(report === "lease-expiry" || report === "deposits") && <LeaseExpiryChart data={expiryMonths} />}
      </div>

      <section className="card-soft overflow-hidden p-0">
        <header className="border-b border-border p-4">
          <h2 className="font-display text-lg font-bold text-navy">{table.title}</h2>
          <p className="text-sm text-muted-foreground">{REPORTS.find((r) => r.key === report)?.blurb} · {subtitle}</p>
        </header>
        {table.rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nothing to show for this property and date range.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="bg-surface-sunk text-left">
                <tr>
                  {table.headers.map((h, i) => (
                    <th key={h} scope="col" className={`px-4 py-3 font-semibold text-navy ${i === 0 ? "" : "text-right"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={ri} className="border-t border-border">
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`px-4 py-3 ${ci === 0 ? "font-semibold text-navy" : "tnum text-right text-muted-foreground"}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-4 text-xs text-muted-foreground">
        Summary reporting only — Keyhold does not keep journals, a trial balance or a bank reconciliation. Every figure above is
        calculated from your own invoices, payments, bills and leases.
      </p>
    </>
  );
}

function Metric({ label, value, tone, rail }: { label: string; value: string; tone: string; rail: string }) {
  return (
    <div className="relative overflow-hidden card-soft p-4 pl-5">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${rail}`} />
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`money mt-1 text-2xl font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}
