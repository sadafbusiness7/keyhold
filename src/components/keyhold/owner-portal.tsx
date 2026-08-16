/**
 * OWNER PORTAL SCREENS — read-only by design.
 * Nothing here mutates operational records. Every property and every section is
 * gated by the owner_property_access rows the manager controls (mock-access).
 */
import { useMemo, useState } from "react";
import { Buildings, DownloadSimple, FileText, ChartBar, Receipt, Lock } from "@phosphor-icons/react";
import { toast } from "sonner";
import { usePermissions, type OwnerSection } from "@/lib/mock-access";
import { useOwners } from "@/lib/mock-owners";
import { useRent } from "@/lib/mock-rent";
import { useMaintenance } from "@/lib/mock-maintenance";
import { useLeases } from "@/lib/mock-leases";
import { useOperations } from "@/lib/mock-operations";
import { units as allUnits, tenants as allTenants, longDate, propertyById } from "@/lib/mock-data";
import { money, periodLabel, periodOf, addMonths } from "@/lib/rent-engine";
import {
  disbursementStatement,
  downloadTablesPdf,
  incomeVsExpense,
  monthRange,
  occupancy,
  type DateRange,
} from "@/lib/finance-engine";

export type OwnerTab = OwnerSection | "dashboard";

const card = "card-soft p-4";
const btn =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft";

function useOwnerScope() {
  const perms = usePermissions();
  const access = perms.myOwnerAccess ?? [];
  const properties = access.map((a) => propertyById(a.propertyId)).filter(Boolean);
  const sections = new Set<OwnerSection>(access.flatMap((a) => a.sections));
  return { perms, access, properties, sections };
}

export function useOwnerTabs(): { id: OwnerTab; label: string; Icon: typeof Buildings }[] {
  const { sections } = useOwnerScope();
  const all: { id: OwnerTab; label: string; Icon: typeof Buildings }[] = [
    { id: "dashboard", label: "Overview", Icon: ChartBar },
    { id: "statements", label: "Statements", Icon: Receipt },
    { id: "properties", label: "Properties", Icon: Buildings },
    { id: "documents", label: "Documents", Icon: FileText },
    { id: "reports", label: "Reports", Icon: ChartBar },
  ];
  return all.filter((t) => t.id === "dashboard" || sections.has(t.id as OwnerSection));
}

function Stat({ label, value, tone = "text-navy" }: { label: string; value: string; tone?: string }) {
  return (
    <div className={card}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`tnum font-display text-2xl font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

function useOwnerStatements(period: string) {
  const { properties } = useOwnerScope();
  const owners = useOwners();
  const rent = useRent();
  const maintenance = useMaintenance();
  const range = useMemo(() => monthRange(period), [period]);

  return useMemo(
    () =>
      properties
        .map((property) => ({
          property,
          config: owners.configFor(property.id),
          statement: disbursementStatement({
            property,
            config: owners.configFor(property.id),
            units: allUnits,
            tenants: allTenants,
            invoices: rent.invoices,
            payments: rent.payments,
            bills: maintenance.bills,
            range,
          }),
        }))
        .filter((s) => s.config.sharedToPortal),
    [properties, owners, rent.invoices, rent.payments, maintenance.bills, range],
  );
}

/* ————————————————— overview ————————————————— */

export function OwnerDashboard() {
  const { properties } = useOwnerScope();
  const rent = useRent();
  const period = periodOf(rent.today);
  const statements = useOwnerStatements(period);

  const income = statements.reduce((s, x) => s + x.statement.rentReceivedCents + x.statement.otherIncomeCents, 0);
  const expenses = statements.reduce((s, x) => s + x.statement.expenseTotalCents + x.statement.feeCents + x.statement.feeTaxCents, 0);
  const net = statements.reduce((s, x) => s + x.statement.netPayableCents, 0);
  const occ = occupancy(properties, allUnits);
  const totals = occ.reduce((s, o) => ({ total: s.total + o.total, filled: s.filled + o.filled }), { total: 0, filled: 0 });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={`Income — ${periodLabel(period)}`} value={money(income)} />
        <Stat label="Expenses & fees" value={money(expenses)} tone="text-maple" />
        <Stat label="Net to you" value={money(net)} tone="text-success" />
        <Stat
          label="Occupancy"
          value={totals.total ? `${Math.round((totals.filled / totals.total) * 100)}%` : "—"}
        />
      </div>

      <section className={card}>
        <h2 className="font-display text-base font-bold text-navy">Your properties</h2>
        <ul className="mt-2 space-y-2">
          {occ.map((o) => (
            <li key={o.propertyId} className="flex items-center justify-between gap-3 rounded-xl bg-surface-sunk p-3 text-sm">
              <span className="font-semibold text-navy">{o.property}</span>
              <span className="tnum text-muted-foreground">
                {o.filled}/{o.total} occupied · {o.ratePct}%
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-muted-foreground">
        This is a read-only view. Your manager controls which properties and sections appear here.
      </p>
    </div>
  );
}

/* ————————————————— statements ————————————————— */

export function OwnerStatements() {
  const rent = useRent();
  const periods = useMemo(() => [0, -1, -2, -3, -4, -5].map((n) => addMonths(periodOf(rent.today), n)), [rent.today]);
  const [period, setPeriod] = useState(periods[0]!);
  const statements = useOwnerStatements(period);

  if (!statements.length) {
    return (
      <p className="card-soft p-4 text-sm text-muted-foreground">
        No statement has been shared for {periodLabel(period)} yet. Your manager publishes statements once the month is reconciled.
      </p>
    );
  }

  const download = (s: (typeof statements)[number]) => {
    downloadTablesPdf(`owner-statement-${s.property.id}-${period}.pdf`, {
      title: `Owner statement — ${s.property.name}`,
      subtitle: `${periodLabel(period)} · all amounts in Canadian dollars`,
      tables: [
        {
          title: "Summary",
          headers: ["Line", "Detail", "Amount"],
          rows: [
            ["Rent received", "Payments that cleared this period", money(s.statement.rentReceivedCents)],
            ["Other income", "Utilities, damage and one-off charges", money(s.statement.otherIncomeCents)],
            ["Expenses", `${s.statement.expenses.length} approved bills`, `-${money(s.statement.expenseTotalCents)}`],
            ["Management fee", "As agreed", `-${money(s.statement.feeCents + s.statement.feeTaxCents)}`],
            ["Net paid to you", periodLabel(period), money(s.statement.netPayableCents)],
          ] as (string | number)[][],
        },
      ],
    });
    toast.success("Statement downloaded.");
  };

  return (
    <div className="space-y-4">
      <label className="block text-xs font-semibold text-navy">
        Statement month
        <select
          className="mt-1 min-h-11 w-full max-w-xs rounded-xl border border-input bg-card px-3 text-sm"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          {periods.map((p) => (
            <option key={p} value={p}>
              {periodLabel(p)}
            </option>
          ))}
        </select>
      </label>

      {statements.map((s) => (
        <section key={s.property.id} className={card}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-navy">{s.property.name}</h2>
              <p className="text-xs text-muted-foreground">{periodLabel(period)}</p>
            </div>
            <button type="button" className={btn} onClick={() => download(s)}>
              <DownloadSimple weight="duotone" className="h-5 w-5" aria-hidden="true" /> PDF
            </button>
          </div>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <Line label="Rent received" value={money(s.statement.rentReceivedCents)} />
            <Line label="Other income" value={money(s.statement.otherIncomeCents)} />
            <Line label="Expenses" value={`-${money(s.statement.expenseTotalCents)}`} />
            <Line label="Management fee" value={`-${money(s.statement.feeCents + s.statement.feeTaxCents)}`} />
          </dl>
          <p className="tnum mt-3 rounded-xl bg-success-soft p-3 font-display text-lg font-extrabold text-success">
            Net paid to you {money(s.statement.netPayableCents)}
          </p>
        </section>
      ))}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-surface-sunk px-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tnum font-semibold text-navy">{value}</dd>
    </div>
  );
}

/* ————————————————— properties & units ————————————————— */

export function OwnerProperties() {
  const { properties } = useOwnerScope();
  const leases = useLeases();

  return (
    <div className="space-y-4">
      {properties.map((p) => {
        const units = allUnits.filter((u) => u.propertyId === p.id);
        return (
          <section key={p.id} className={card}>
            <h2 className="font-display text-base font-bold text-navy">{p.name}</h2>
            <p className="text-xs text-muted-foreground">
              {p.address}, {p.city} {p.province}
            </p>
            <ul className="mt-3 space-y-2">
              {units.map((u) => {
                const lease = leases.leases.find((l) => l.unitId === u.id && l.status === "active");
                const tenant = lease ? allTenants.find((t) => t.id === lease.tenantId) : null;
                return (
                  <li key={u.id} className="rounded-xl bg-surface-sunk p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-navy">{u.label}</span>
                      <span className="text-muted-foreground">{tenant ? tenant.name : "Vacant"}</span>
                    </div>
                    {lease && (
                      <p className="tnum mt-1 text-xs text-muted-foreground">
                        Lease {longDate(lease.startDate)} → {longDate(lease.endDate)}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock weight="duotone" className="h-4 w-4" aria-hidden="true" />
              Tenant contact details and payment history stay with your manager.
            </p>
          </section>
        );
      })}
    </div>
  );
}

/* ————————————————— documents ————————————————— */

export function OwnerDocuments() {
  const { properties } = useOwnerScope();
  const ops = useOperations();
  const ids = new Set(properties.map((p) => p.id));
  const docs = ops.documents.filter((d) => d.visibility === "shared" && d.propertyId && ids.has(d.propertyId));

  if (!docs.length) {
    return <p className="card-soft p-4 text-sm text-muted-foreground">Your manager hasn't shared any documents with you yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {docs.map((d) => (
        <li key={d.id} className={`${card} flex flex-wrap items-center justify-between gap-3`}>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-navy">{d.name}</span>
            <span className="tnum block text-xs text-muted-foreground">
              {d.category} · uploaded {longDate(d.uploadedOn)} · {d.size}
            </span>
          </span>
          <button type="button" className={btn} onClick={() => toast.success("Download started.")}>
            <DownloadSimple weight="duotone" className="h-5 w-5" aria-hidden="true" /> Download
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ————————————————— reports ————————————————— */

export function OwnerReports() {
  const { properties } = useOwnerScope();
  const rent = useRent();
  const maintenance = useMaintenance();
  const today = rent.today;
  const [from, setFrom] = useState(`${today.slice(0, 4)}-01-01`);
  const [to, setTo] = useState(today);
  const range: DateRange = { from, to };

  const rows = useMemo(
    () =>
      incomeVsExpense({
        properties,
        units: allUnits,
        invoices: rent.invoices,
        payments: rent.payments,
        bills: maintenance.bills,
        range,
      }),
    [properties, rent.invoices, rent.payments, maintenance.bills, from, to],
  );
  const occ = occupancy(properties, allUnits);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 sm:max-w-md">
        <label className="text-xs font-semibold text-navy">
          From
          <input type="date" className="mt-1 min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm tabular-nums" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="text-xs font-semibold text-navy">
          To
          <input type="date" className="mt-1 min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm tabular-nums" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      <section className={card}>
        <h2 className="font-display text-base font-bold text-navy">Income vs expense</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2">Property</th>
                <th className="py-2 text-right">Income</th>
                <th className="py-2 text-right">Expenses</th>
                <th className="py-2 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.propertyId} className="border-t border-border">
                  <td className="py-2 font-semibold text-navy">{r.property}</td>
                  <td className="tnum py-2 text-right">{money(r.rentCents + r.otherIncomeCents)}</td>
                  <td className="tnum py-2 text-right">{money(r.expenseCents)}</td>
                  <td className="tnum py-2 text-right font-semibold">{money(r.netCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={card}>
        <h2 className="font-display text-base font-bold text-navy">Occupancy</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {occ.map((o) => (
            <li key={o.propertyId} className="flex items-center justify-between rounded-xl bg-surface-sunk px-3 py-2">
              <span className="font-semibold text-navy">{o.property}</span>
              <span className="tnum text-muted-foreground">
                {o.filled}/{o.total} · {o.ratePct}%
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
