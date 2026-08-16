import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Receipt, DownloadSimple, Warning, MagicWand, CheckCircle, Buildings } from "@phosphor-icons/react";
import { toast } from "sonner";
import { RequireFinancials } from "@/components/keyhold/access-guard";
import { PageHeader } from "@/components/keyhold/app-shell";
import { LegalDisclaimer } from "@/components/keyhold/legal-ui";
import { EmptyState } from "@/components/keyhold/empty-state";
import { usePermissions } from "@/lib/mock-access";
import { useCanada, TAX_YEARS } from "@/lib/mock-canada";
import { downloadFile, money, toCents } from "@/lib/rent-engine";
import { buildPdf, downloadPdf } from "@/lib/pdf-writer";
import {
  DISCLAIMER,
  T776_LINES,
  buildPackage,
  entriesForYear,
  packageCsv,
  packagePdf,
  suggestLine,
  uncategorized,
  type T776Code,
} from "@/lib/tax-engine";

export const Route = createFileRoute("/app/tax")({
  head: () => ({
    meta: [
      { title: "T776 tax package — Keyhold" },
      {
        name: "description",
        content: "Year-end rental income and expenses mapped to CRA T776 lines, per property and consolidated, ready for your accountant.",
      },
      { property: "og:title", content: "T776 tax package — Keyhold" },
      { property: "og:description", content: "Gross rental income and expenses by T776 line, exportable as accountant-ready PDF or CSV." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireFinancials title="Tax package">
      <TaxPage />
    </RequireFinancials>
  ),
});

const selectCls = "min-h-11 rounded-xl border border-input bg-card px-3 text-sm";
const btn = "inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft";
const btnPrimary = "inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90";

function TaxPage() {
  const perms = usePermissions();
  const canada = useCanada();
  const visible = perms.properties.filter((p) => perms.canSeeFinancials(p.id));

  const [year, setYear] = useState(2025);
  const [selected, setSelected] = useState<string[]>(visible.map((p) => p.id));
  const [showHelper, setShowHelper] = useState(false);

  const chosen = visible.filter((p) => selected.includes(p.id));

  const yearEntries = useMemo(
    () => entriesForYear(canada.entries, year, chosen.map((p) => p.id)),
    [canada.entries, year, chosen],
  );
  const flagged = useMemo(() => uncategorized(yearEntries), [yearEntries]);

  const pkg = useMemo(
    () =>
      buildPackage({
        year,
        entries: canada.entries,
        properties: chosen.map((p) => ({ id: p.id, name: p.name, address: `${p.address}, ${p.city}, ${p.province}` })),
      }),
    [canada.entries, year, chosen],
  );

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const exportPdf = () => {
    const blob = buildPdf(packagePdf({ pkg, cca: canada.cca, preparedFor: "Mr. J", preparedOn: canada.today }));
    downloadPdf(blob, `t776-package-${year}.pdf`);
    toast.success("Accountant-ready PDF downloaded.");
  };

  const exportCsv = () => {
    downloadFile(`t776-package-${year}.csv`, packageCsv(pkg, canada.cca));
    toast.success("CSV exported.");
  };

  if (!visible.length) {
    return (
      <>
        <PageHeader title="Tax package" />
        <EmptyState Icon={Buildings} title="No properties in your view" body="A T776 package appears once you have a property with income or expenses." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="T776 tax package"
        subtitle="Your year's rental income and expenses, mapped to the CRA's T776 lines — per property and all together."
        action={
          <div className="col-span-full flex flex-wrap gap-2 sm:col-auto">
            <button type="button" onClick={exportCsv} className={btn}>
              <DownloadSimple weight="duotone" className="h-5 w-5" aria-hidden="true" /> CSV
            </button>
            <button type="button" onClick={exportPdf} className={btnPrimary}>
              <DownloadSimple weight="duotone" className="h-5 w-5" aria-hidden="true" /> Accountant PDF
            </button>
          </div>
        }
      />

      <LegalDisclaimer
        className="mb-4"
        source={{ label: "CRA — T776 Statement of Real Estate Rentals", url: "https://www.canada.ca/en/revenue-agency/services/forms-publications/forms/t776.html", version: "T776 (2025)", effectiveDate: "2026-01-01" }}
      >
        Keyhold maps your records to the CRA's T776 lines and shows the arithmetic. It is not tax advice — have your
        accountant review the package before you file.
      </LegalDisclaimer>

      <section className="card-soft mb-5 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col text-sm font-semibold text-navy">
            Tax year
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={`mt-1 ${selectCls}`}>
              {TAX_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="min-w-0">
            <legend className="text-sm font-semibold text-navy">Properties</legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {visible.map((p) => (
                <label
                  key={p.id}
                  className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm ${
                    selected.includes(p.id) ? "border-navy bg-navy-soft font-semibold text-navy" : "border-border text-muted-foreground"
                  }`}
                >
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="h-4 w-4" />
                  {p.name}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      {flagged.length > 0 && (
        <section className="mb-5 rounded-2xl border border-warning/40 bg-warning-soft p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-navy">
              <Warning weight="duotone" className="h-5 w-5" aria-hidden="true" />
              {flagged.length} expense{flagged.length === 1 ? "" : "s"} still need a T776 category for {year}.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className={btn}
                onClick={() => {
                  const n = canada.autoCategorize();
                  toast.success(n ? `Suggested a category for ${n} expenses.` : "No confident suggestions — set them by hand.");
                }}
              >
                <MagicWand weight="duotone" className="h-5 w-5" aria-hidden="true" /> Suggest categories
              </button>
              <button type="button" className={btn} onClick={() => setShowHelper((v) => !v)}>
                {showHelper ? "Hide list" : "Fix them"}
              </button>
            </div>
          </div>

          {showHelper && (
            <ul className="mt-3 space-y-2">
              {flagged.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-card p-3">
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="font-semibold text-navy">{e.description}</span>
                    <span className="block text-xs text-muted-foreground">
                      {e.date} · {money(e.amountCents)} · {e.source === "bill" ? "from a bill" : "manual entry"}
                    </span>
                  </span>
                  <label className="sr-only" htmlFor={`cat-${e.id}`}>
                    T776 category for {e.description}
                  </label>
                  <select
                    id={`cat-${e.id}`}
                    className={selectCls}
                    defaultValue={suggestLine(e.description) ?? ""}
                    onChange={(ev) => ev.target.value && canada.categorize(e.id, ev.target.value as T776Code)}
                  >
                    <option value="">Choose a line…</option>
                    {T776_LINES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.line} — {l.label}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {flagged.length === 0 && (
        <p className="mb-5 flex items-center gap-2 rounded-2xl border border-success/40 bg-success-soft p-3 text-sm font-semibold text-navy">
          <CheckCircle weight="duotone" className="h-5 w-5" aria-hidden="true" /> Every {year} expense is categorized.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {pkg.properties.map((p) => (
          <section key={p.propertyId} className="card-soft p-4">
            <h2 className="font-display text-base font-bold text-navy">{p.propertyName}</h2>
            <p className="text-xs text-muted-foreground">{p.address}</p>
            <table className="mt-3 w-full text-sm tabular-nums">
              <caption className="sr-only">T776 lines for {p.propertyName} in {year}</caption>
              <tbody>
                <tr className="border-b border-border">
                  <th scope="row" className="py-1.5 text-left font-semibold text-navy">
                    8141 Gross rental income
                  </th>
                  <td className="py-1.5 text-right font-semibold">{money(p.grossIncomeCents)}</td>
                </tr>
                {p.expenses.map((e) => (
                  <tr key={e.code}>
                    <th scope="row" className="py-1 text-left font-normal text-muted-foreground">
                      {e.line} {e.label}
                    </th>
                    <td className="py-1 text-right">{money(e.amountCents)}</td>
                  </tr>
                ))}
                <tr className="border-t border-border">
                  <th scope="row" className="py-1.5 text-left font-semibold text-navy">
                    Total expenses
                  </th>
                  <td className="py-1.5 text-right font-semibold">{money(p.totalExpensesCents)}</td>
                </tr>
                <tr>
                  <th scope="row" className="py-1.5 text-left font-semibold text-navy">
                    9369 Net income before CCA
                  </th>
                  <td className="py-1.5 text-right font-bold text-navy">{money(p.netIncomeCents)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <section className="card-soft mt-5 p-4">
        <h2 className="font-display text-base font-bold text-navy">All properties — consolidated</h2>
        <table className="mt-3 w-full text-sm tabular-nums">
          <caption className="sr-only">Consolidated T776 totals for {year}</caption>
          <tbody>
            <tr className="border-b border-border">
              <th scope="row" className="py-1.5 text-left font-semibold text-navy">8141 Gross rental income</th>
              <td className="py-1.5 text-right font-semibold">{money(pkg.grossIncomeCents)}</td>
            </tr>
            {pkg.byLine.map((e) => (
              <tr key={e.code}>
                <th scope="row" className="py-1 text-left font-normal text-muted-foreground">
                  {e.line} {e.label}
                </th>
                <td className="py-1 text-right">{money(e.amountCents)}</td>
              </tr>
            ))}
            <tr className="border-t border-border">
              <th scope="row" className="py-1.5 text-left font-semibold text-navy">Total expenses</th>
              <td className="py-1.5 text-right font-semibold">{money(pkg.totalExpensesCents)}</td>
            </tr>
            <tr>
              <th scope="row" className="py-1.5 text-left font-semibold text-navy">9369 Net income before CCA</th>
              <td className="py-1.5 text-right font-bold text-navy">{money(pkg.netIncomeCents)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="card-soft mt-5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-bold text-navy">Capital cost allowance — left for your accountant</h2>
          <button type="button" className={btn} onClick={canada.addCca}>
            Add asset class
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Claiming CCA is a judgement call with consequences when you sell. Keyhold records the figures; your accountant decides the claim.
        </p>
        <ul className="mt-3 space-y-3">
          {canada.cca.map((c, i) => (
            <li key={`${c.className}-${i}`} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[6rem_1fr_9rem_9rem_6rem_auto]">
              <label className="text-xs font-semibold text-navy">
                Class
                <input
                  className={`mt-1 w-full ${selectCls}`}
                  value={c.className}
                  onChange={(e) => canada.updateCca(i, { className: e.target.value })}
                />
              </label>
              <label className="text-xs font-semibold text-navy">
                Description
                <input
                  className={`mt-1 w-full ${selectCls}`}
                  value={c.description}
                  onChange={(e) => canada.updateCca(i, { description: e.target.value })}
                />
              </label>
              <label className="text-xs font-semibold text-navy">
                Opening UCC
                <input
                  type="number"
                  className={`mt-1 w-full tabular-nums ${selectCls}`}
                  value={(c.openingUccCents / 100).toString()}
                  onChange={(e) => canada.updateCca(i, { openingUccCents: toCents(Number(e.target.value) || 0) })}
                />
              </label>
              <label className="text-xs font-semibold text-navy">
                Additions
                <input
                  type="number"
                  className={`mt-1 w-full tabular-nums ${selectCls}`}
                  value={(c.additionsCents / 100).toString()}
                  onChange={(e) => canada.updateCca(i, { additionsCents: toCents(Number(e.target.value) || 0) })}
                />
              </label>
              <label className="text-xs font-semibold text-navy">
                Rate %
                <input
                  type="number"
                  className={`mt-1 w-full tabular-nums ${selectCls}`}
                  value={c.ratePct}
                  onChange={(e) => canada.updateCca(i, { ratePct: Number(e.target.value) || 0 })}
                />
              </label>
              <button type="button" className={`${btn} self-end`} onClick={() => canada.removeCca(i)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-5 flex items-start gap-2 rounded-2xl border border-border bg-navy-soft p-4 text-sm text-navy">
        <Receipt weight="duotone" className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <span>
          {DISCLAIMER}{" "}
          <a
            className="font-semibold underline"
            href="https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4036.html"
            target="_blank"
            rel="noreferrer"
          >
            CRA guide T4036, Rental Income
          </a>
          .
        </span>
      </p>
    </>
  );
}
