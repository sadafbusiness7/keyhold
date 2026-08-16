import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Buildings, DownloadSimple, ShareNetwork, Eye, Percent } from "@phosphor-icons/react";
import { toast } from "sonner";
import { RequireFinancials } from "@/components/keyhold/access-guard";
import { PageHeader } from "@/components/keyhold/app-shell";
import { EmptyState } from "@/components/keyhold/empty-state";
import { usePermissions } from "@/lib/mock-access";
import { useOwners } from "@/lib/mock-owners";
import { useRent } from "@/lib/mock-rent";
import { useMaintenance } from "@/lib/mock-maintenance";
import { units, tenants, longDate } from "@/lib/mock-data";
import { money, periodLabel, periodOf, addMonths, downloadFile } from "@/lib/rent-engine";
import {
  FEE_MODELS,
  disbursementStatement,
  downloadTablesPdf,
  monthRange,
  tableToCsv,
  type FeeModel,
} from "@/lib/finance-engine";

export const Route = createFileRoute("/app/disbursements")({
  head: () => ({
    meta: [
      { title: "Owner disbursements — Keyhold" },
      { name: "description", content: "Statements for properties you manage on an owner's behalf: rent received, expenses, your fee and the net payable." },
      { property: "og:title", content: "Owner disbursements — Keyhold" },
      { property: "og:description", content: "Rent in, expenses out, management fee, net payable — one clean statement per owner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireFinancials title="Owner disbursements">
      <DisbursementsPage />
    </RequireFinancials>
  ),
});

function DisbursementsPage() {
  const perms = usePermissions();
  const owners = useOwners();
  const rent = useRent();
  const maintenance = useMaintenance();

  const visible = perms.properties.filter((p) => perms.canSeeFinancials(p.id));
  const firstManaged = visible.find((p) => owners.configFor(p.id).managed) ?? visible[0];
  const [propertyId, setPropertyId] = useState(firstManaged?.id ?? "");
  const [period, setPeriod] = useState(periodOf(rent.today));
  const [ownerView, setOwnerView] = useState(false);

  const property = visible.find((p) => p.id === propertyId) ?? visible[0] ?? null;
  const config = property ? owners.configFor(property.id) : null;
  const range = useMemo(() => monthRange(period), [period]);

  const statement = useMemo(() => {
    if (!property || !config) return null;
    return disbursementStatement({
      property,
      config,
      units,
      tenants,
      invoices: rent.invoices,
      payments: rent.payments,
      bills: maintenance.bills,
      range,
    });
  }, [property, config, rent.invoices, rent.payments, maintenance.bills, range]);

  const periods = useMemo(
    () => [0, -1, -2, -3, -4, -5].map((n) => addMonths(periodOf(rent.today), n)),
    [rent.today],
  );

  if (!property || !config || !statement) {
    return (
      <>
        <PageHeader title="Owner disbursements" />
        <EmptyState Icon={Buildings} title="No properties in your view" body="Owner statements appear once you manage a property." />
      </>
    );
  }

  const tables = [
    {
      title: `Rent and other income — ${periodLabel(period)}`,
      headers: ["Tenant", "Detail", "Amount"],
      rows: statement.incomeLines.map((l) => [l.label, l.detail, money(l.amountCents)]),
    },
    {
      title: "Expenses (approved bills)",
      headers: ["Bill", "Detail", "Amount"],
      rows: statement.expenses.map((l) => [l.label, l.detail, money(l.amountCents)]),
    },
    {
      title: "Summary",
      headers: ["Line", "Detail", "Amount"],
      rows: [
        ["Rent received", "Payments that cleared this period", money(statement.rentReceivedCents)],
        ["Other income", "Utilities, damage and one-off charges", money(statement.otherIncomeCents)],
        ["Expenses", `${statement.expenses.length} approved bills`, `-${money(statement.expenseTotalCents)}`],
        ["Management fee", feeLabel(config.feeModel, config.feeValue, statement.feeBaseCents), `-${money(statement.feeCents)}`],
        ["Tax on fee", `${config.feeTaxPct}%`, `-${money(statement.feeTaxCents)}`],
        ["Net payable to owner", `${longDate(range.from)} – ${longDate(range.to)}`, money(statement.netPayableCents)],
      ] as (string | number)[][],
    },
  ];

  const exportPdf = () => {
    downloadTablesPdf(`owner-statement-${property.id}-${period}.pdf`, {
      title: `Owner statement — ${property.name}`,
      subtitle: `${periodLabel(period)} · prepared for ${config.ownerName || "the owner"} · all amounts in Canadian dollars`,
      tables,
    });
    toast.success("Statement PDF downloaded.");
  };

  const exportCsv = () => {
    downloadFile(`owner-statement-${property.id}-${period}.csv`, tableToCsv(tables[2]!));
    toast.success("Summary exported.");
  };

  return (
    <>
      <PageHeader
        title="Owner disbursements"
        subtitle="For properties you manage on someone else's behalf. Rent in, costs out, your fee, and what you owe the owner."
        action={
          <div className="col-span-full flex flex-wrap gap-2 sm:col-auto">
            <button
              type="button"
              onClick={() => setOwnerView((v) => !v)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
            >
              <Eye weight="duotone" className="h-5 w-5" aria-hidden="true" /> {ownerView ? "Back to manager view" : "Owner portal view"}
            </button>
            <button
              type="button"
              onClick={exportPdf}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
            >
              <DownloadSimple weight="duotone" className="h-5 w-5" aria-hidden="true" /> Statement PDF
            </button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-navy">Property</span>
          <select
            value={property.id}
            onChange={(e) => setPropertyId(e.target.value)}
            className="min-h-11 rounded-full border border-input bg-background px-4 text-sm"
          >
            {visible.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-navy">Period</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="min-h-11 rounded-full border border-input bg-background px-4 text-sm"
          >
            {periods.map((p) => (
              <option key={p} value={p}>{periodLabel(p)}</option>
            ))}
          </select>
        </label>
      </div>

      {!ownerView && (
        <section className="card-soft mb-6 p-5">
          <h2 className="font-display text-lg font-bold text-navy">Management arrangement</h2>
          <label className="mt-3 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.managed}
              onChange={(e) => owners.setManaged(property.id, e.target.checked)}
              className="h-5 w-5 rounded border-input"
            />
            This property is managed for an owner
          </label>

          {config.managed && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-navy">Owner name</span>
                <input
                  value={config.ownerName}
                  onChange={(e) => owners.updateConfig(property.id, { ownerName: e.target.value })}
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  placeholder="Who receives the money"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-navy">Owner email</span>
                <input
                  type="email"
                  value={config.ownerEmail}
                  onChange={(e) => owners.updateConfig(property.id, { ownerEmail: e.target.value })}
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  placeholder="owner@example.ca"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-navy">Management fee</span>
                <select
                  value={config.feeModel}
                  onChange={(e) => owners.setFee(property.id, e.target.value as FeeModel, config.feeValue, config.feeTaxPct)}
                  className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {FEE_MODELS.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {FEE_MODELS.find((f) => f.id === config.feeModel)?.help}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="mb-1 block font-semibold text-navy">
                    {config.feeModel === "flat" ? "Amount per month" : "Percent"}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={config.feeValue}
                    onChange={(e) => owners.setFee(property.id, config.feeModel, Number(e.target.value), config.feeTaxPct)}
                    className="tnum min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-semibold text-navy">Tax on fee %</span>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={config.feeTaxPct}
                    onChange={(e) => owners.setFee(property.id, config.feeModel, config.feeValue, Number(e.target.value))}
                    className="tnum min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  />
                </label>
              </div>
            </div>
          )}
        </section>
      )}

      {!config.managed ? (
        <EmptyState
          Icon={Percent}
          title="Not managed for an owner"
          body="Turn on “managed for an owner” above to produce disbursement statements for this property."
        />
      ) : (
        <>
          <section className="card-soft mb-6 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-navy">
                  Statement — {periodLabel(period)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {property.name} · prepared for {config.ownerName || "the owner"}
                  {config.ownerEmail ? ` (${config.ownerEmail})` : ""}
                </p>
              </div>
              <p className="text-right">
                <span className="block text-xs text-muted-foreground">Net payable to owner</span>
                <span className={`money text-3xl font-extrabold ${statement.netPayableCents >= 0 ? "text-success" : "text-maple"}`}>
                  {money(statement.netPayableCents)}
                </span>
              </p>
            </div>

            <dl className="mt-5 divide-y divide-border">
              <Row label="Rent received" detail="Payments that cleared this period" amount={statement.rentReceivedCents} />
              <Row label="Other income" detail="Utilities, damage and one-off charges" amount={statement.otherIncomeCents} />
              <Row label="Expenses" detail={`${statement.expenses.length} approved bills`} amount={-statement.expenseTotalCents} />
              <Row
                label="Management fee"
                detail={feeLabel(config.feeModel, config.feeValue, statement.feeBaseCents)}
                amount={-statement.feeCents}
              />
              <Row label="Tax on fee" detail={`${config.feeTaxPct}%`} amount={-statement.feeTaxCents} />
              <Row label="Net payable" detail={`${longDate(range.from)} – ${longDate(range.to)}`} amount={statement.netPayableCents} strong />
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportPdf}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
              >
                <DownloadSimple weight="duotone" className="h-5 w-5" aria-hidden="true" /> PDF
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
              >
                <DownloadSimple weight="duotone" className="h-5 w-5" aria-hidden="true" /> CSV
              </button>
              {!ownerView && (
                <button
                  type="button"
                  onClick={() => {
                    owners.shareToPortal(property.id, !config.sharedToPortal);
                    toast.success(
                      config.sharedToPortal
                        ? "Statement hidden from the owner's portal."
                        : `Statement shared to ${config.ownerName || "the owner"}'s portal view.`,
                    );
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90"
                >
                  <ShareNetwork weight="duotone" className="h-5 w-5" aria-hidden="true" />
                  {config.sharedToPortal ? "Shared to owner portal" : "Share to owner portal"}
                </button>
              )}
            </div>
            {ownerView && (
              <p className="mt-4 rounded-xl bg-surface-sunk p-3 text-xs text-muted-foreground">
                This is exactly what {config.ownerName || "the owner"} sees in their portal: read-only, no tenant contact details,
                no other properties.
              </p>
            )}
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Detail title="Rent and other income" lines={statement.incomeLines} empty="No payments received in this period." />
            <Detail title="Expenses" lines={statement.expenses} empty="No approved bills in this period." negative />
          </div>
        </>
      )}
    </>
  );
}

function feeLabel(model: FeeModel, value: number, baseCents: number) {
  if (model === "flat") return "Flat monthly fee";
  return `${value}% of ${model === "pct-collected" ? "rent collected" : "rent invoiced"} (${money(baseCents)})`;
}

function Row({ label, detail, amount, strong = false }: { label: string; detail: string; amount: number; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className={strong ? "font-display font-bold text-navy" : "text-sm text-navy"}>
        {label}
        <span className="block text-xs font-normal text-muted-foreground">{detail}</span>
      </dt>
      <dd className={`money shrink-0 font-bold ${strong ? "text-xl text-navy" : amount < 0 ? "text-maple" : "text-success"}`}>
        {money(amount)}
      </dd>
    </div>
  );
}

function Detail({
  title,
  lines,
  empty,
  negative = false,
}: {
  title: string;
  lines: { label: string; detail: string; amountCents: number }[];
  empty: string;
  negative?: boolean;
}) {
  return (
    <section className="card-soft p-5">
      <h3 className="font-display text-base font-bold text-navy">{title}</h3>
      {lines.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {lines.map((l, i) => (
            <li key={`${l.label}-${i}`} className="flex items-start justify-between gap-3 border-b border-border pb-2 text-sm last:border-0">
              <span className="min-w-0">
                <span className="block font-semibold text-navy">{l.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{l.detail}</span>
              </span>
              <span className={`money shrink-0 font-bold ${negative ? "text-maple" : "text-success"}`}>
                {negative ? "−" : ""}{money(l.amountCents)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
