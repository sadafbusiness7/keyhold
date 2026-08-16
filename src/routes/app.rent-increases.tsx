import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TrendUp, Warning, Scales, FileText, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { RequireFinancials } from "@/components/keyhold/access-guard";
import { PageHeader } from "@/components/keyhold/app-shell";
import { EmptyState } from "@/components/keyhold/empty-state";
import { usePermissions } from "@/lib/mock-access";
import { useCanada } from "@/lib/mock-canada";
import { useNotices } from "@/lib/mock-notices";
import { cad, leases as allLeases, tenants, unitById, unitAddress, longDate } from "@/lib/mock-data";
import { NOTICE_RULES, NOTICE_SOURCES, calcN1, fullDate, n1Pdf } from "@/lib/notices-engine";
import { buildPdf, downloadPdf } from "@/lib/pdf-writer";

export const Route = createFileRoute("/app/rent-increases")({
  head: () => ({
    meta: [
      { title: "Rent increases (Ontario guideline) — Keyhold" },
      {
        name: "description",
        content: "Calculate a guideline rent increase, check the earliest legal effective date, generate the N1 and schedule the new rent.",
      },
      { property: "og:title", content: "Rent increases (Ontario guideline) — Keyhold" },
      { property: "og:description", content: "Guideline percentage, notice period and N1 generation in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireFinancials title="Rent increases">
      <RentIncreasePage />
    </RequireFinancials>
  ),
});

const inputCls = "min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm tabular-nums";
const btn = "inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft";
const btnPrimary = "inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90 disabled:opacity-50";

function RentIncreasePage() {
  const perms = usePermissions();
  const canada = useCanada();
  const notices = useNotices();

  const today = canada.today;
  const currentYear = Number(today.slice(0, 4));
  const guideline = canada.guidelineFor(currentYear + 1) ?? canada.guidelineFor(currentYear);

  const visiblePropertyIds = new Set(perms.properties.map((p) => p.id));
  const rows = useMemo(
    () =>
      allLeases
        .map((l) => ({ lease: l, unit: unitById(l.unitId), tenant: tenants.find((t) => t.id === l.tenantId) }))
        .filter((r) => r.tenant && visiblePropertyIds.has(r.unit.propertyId)),
    [perms.properties],
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [percent, setPercent] = useState(String(guideline?.pct ?? 2.5));
  const [effective, setEffective] = useState("");
  const [editGuideline, setEditGuideline] = useState(false);

  const pct = Number(percent) || 0;
  const preview = rows
    .filter((r) => selected.includes(r.lease.id))
    .map((r) => ({
      row: r,
      calc: calcN1({ today, currentRent: r.lease.rent, percent: pct, effectiveDate: effective || undefined }),
    }));

  const anyAbove = preview.some((p) => p.calc.aboveGuideline);
  const anyShort = preview.some((p) => !p.calc.noticeOk);

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const apply = () => {
    if (!preview.length) return;
    const created = notices.addNotices(
      preview.map(({ row, calc }) => ({
        type: "N1" as const,
        tenantId: row.tenant!.id,
        unitId: row.lease.unitId,
        propertyId: row.unit.propertyId,
        province: "ON",
        createdOn: today,
        createdBy: "Mr. J",
        currentRent: calc.currentRent,
        newRent: calc.newRent,
        percent: calc.proposedPct,
        effectiveDate: calc.effectiveDate,
        rentApplied: false,
        fileName: `N1-${row.tenant!.name.split(" ")[0]}-${calc.effectiveDate}.pdf`,
      })),
    );

    preview.forEach(({ row, calc }, i) => {
      const property = perms.properties.find((p) => p.id === row.unit.propertyId)!;
      const party = {
        tenantName: row.tenant!.name,
        landlordName: "Mr. J",
        address: property.address,
        unitLabel: row.unit.label,
        city: property.city,
        province: property.province,
        postalCode: property.postalCode,
      };
      canada.scheduleIncrease({
        tenantId: row.tenant!.id,
        unitId: row.lease.unitId,
        currentRent: calc.currentRent,
        newRent: calc.newRent,
        percent: calc.proposedPct,
        effectiveDate: calc.effectiveDate,
        noticeGivenOn: today,
        noticeId: created[i]?.id ?? null,
        aboveGuideline: calc.aboveGuideline,
      });
      downloadPdf(buildPdf(n1Pdf(party, calc, today)), `N1-${row.tenant!.name.split(" ")[0]}-${calc.effectiveDate}.pdf`);
    });

    toast.success(`${preview.length} N1 notice${preview.length === 1 ? "" : "s"} generated and the new rent scheduled.`);
    setSelected([]);
  };

  if (!rows.length) {
    return (
      <>
        <PageHeader title="Rent increases" />
        <EmptyState Icon={TrendUp} title="No leases in your view" body="Rent increases appear once you have an active lease." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Rent increases"
        subtitle="Guideline maths, the earliest legal date, and the N1 — for one tenant or the whole portfolio."
      />

      <section className="card-soft mb-5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-navy">
              Ontario guideline — {guideline?.year ?? currentYear + 1}: {guideline?.pct ?? 2.5}%
            </h2>
            <p className="text-xs text-muted-foreground">
              {guideline?.sourceName ?? "Ontario rent increase guideline"} · published {longDate(guideline?.sourceDate ?? today)} ·{" "}
              <a className="font-semibold underline" href={guideline?.sourceUrl ?? NOTICE_SOURCES.N1.url} target="_blank" rel="noreferrer">
                official source
              </a>
            </p>
          </div>
          <button type="button" className={btn} onClick={() => setEditGuideline((v) => !v)}>
            {editGuideline ? "Done" : "Edit guideline"}
          </button>
        </div>

        {editGuideline && guideline && (
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <label className="text-xs font-semibold text-navy">
              Effective year
              <input
                type="number"
                className={`mt-1 ${inputCls}`}
                value={guideline.year}
                onChange={(e) => canada.upsertGuideline({ ...guideline, year: Number(e.target.value) || guideline.year })}
              />
            </label>
            <label className="text-xs font-semibold text-navy">
              Guideline %
              <input
                type="number"
                step="0.1"
                className={`mt-1 ${inputCls}`}
                value={guideline.pct}
                onChange={(e) => canada.upsertGuideline({ ...guideline, pct: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="text-xs font-semibold text-navy sm:col-span-2">
              Source URL
              <input
                className={`mt-1 ${inputCls}`}
                value={guideline.sourceUrl}
                onChange={(e) => canada.upsertGuideline({ ...guideline, sourceUrl: e.target.value })}
              />
            </label>
          </div>
        )}
      </section>

      <section className="card-soft mb-5 p-4">
        <h2 className="font-display text-base font-bold text-navy">Calculate an increase</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold text-navy">
            Increase %
            <input type="number" step="0.1" className={`mt-1 ${inputCls}`} value={percent} onChange={(e) => setPercent(e.target.value)} />
          </label>
          <label className="text-xs font-semibold text-navy">
            Effective date (blank = earliest legal)
            <input type="date" className={`mt-1 ${inputCls}`} value={effective} onChange={(e) => setEffective(e.target.value)} />
          </label>
          <p className="self-end text-xs text-muted-foreground">
            {NOTICE_RULES.N1.noticeDays} days' written notice is required before the new rent starts.
          </p>
        </div>

        <ul className="mt-4 space-y-2">
          {rows.map((r) => {
            const calc = calcN1({ today, currentRent: r.lease.rent, percent: pct, effectiveDate: effective || undefined });
            const checked = selected.includes(r.lease.id);
            return (
              <li key={r.lease.id} className={`rounded-xl border p-3 ${checked ? "border-navy" : "border-border"}`}>
                <label className="flex flex-wrap items-center gap-3">
                  <input type="checkbox" checked={checked} onChange={() => toggle(r.lease.id)} className="h-5 w-5" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-navy">{r.tenant!.name}</span>
                    <span className="block text-xs text-muted-foreground">{unitAddress(r.lease.unitId)}</span>
                  </span>
                  <span className="text-sm tabular-nums">
                    {cad(calc.currentRent)} → <strong className="text-navy">{cad(calc.newRent)}</strong>{" "}
                    <span className="text-muted-foreground">(+{cad(calc.increase)} · {calc.proposedPct}%)</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Effective {fullDate(calc.effectiveDate)} · {calc.noticeDaysGiven} days' notice
                  </span>
                </label>
                {(calc.aboveGuideline || !calc.noticeOk) && (
                  <p className="mt-2 flex items-start gap-2 rounded-lg bg-warning-soft p-2 text-xs font-semibold text-navy">
                    <Warning weight="duotone" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      {calc.aboveGuideline
                        ? `${calc.proposedPct}% is above the ${calc.guidelinePct}% guideline. Above-guideline increases need an LTB order (AGI) before you can charge them. `
                        : ""}
                      {!calc.noticeOk
                        ? `Only ${calc.noticeDaysGiven} days' notice — the N1 needs ${NOTICE_RULES.N1.noticeDays}. Earliest legal date is ${fullDate(calc.earliestEffective)}.`
                        : ""}
                    </span>
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        {(anyAbove || anyShort) && selected.length > 0 && (
          <p className="mt-3 rounded-xl border border-maple/40 bg-maple-soft p-3 text-sm font-semibold text-navy">
            Fix the flagged rows before generating. Keyhold won't schedule an increase that breaks the guideline or the notice period.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" className={btnPrimary} disabled={!selected.length || anyAbove || anyShort} onClick={apply}>
            <FileText weight="duotone" className="h-5 w-5" aria-hidden="true" /> Generate N1 and schedule ({selected.length})
          </button>
          <button type="button" className={btn} onClick={() => setEffective("")}>
            Use earliest legal date
          </button>
        </div>
      </section>

      <section className="card-soft mb-5 p-4">
        <h2 className="font-display text-base font-bold text-navy">Scheduled increases</h2>
        {canada.increases.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing scheduled yet. Generated increases appear here and on the tenant's history.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {canada.increases.map((r) => {
              const tenant = tenants.find((t) => t.id === r.tenantId);
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
                  <span className="text-sm">
                    <strong className="text-navy">{tenant?.name}</strong>{" "}
                    <span className="tabular-nums">
                      {cad(r.currentRent)} → {cad(r.newRent)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Applies {fullDate(r.effectiveDate)} · notice given {fullDate(r.noticeGivenOn)} · {r.status}
                    </span>
                  </span>
                  {r.status === "scheduled" ? (
                    <button type="button" className={btn} onClick={() => canada.cancelIncrease(r.id)}>
                      Cancel
                    </button>
                  ) : (
                    <CheckCircle weight="duotone" className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="flex items-start gap-2 rounded-2xl border border-border bg-navy-soft p-4 text-sm text-navy">
        <Scales weight="duotone" className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <span>
          General information, not legal advice.{" "}
          <a className="font-semibold underline" href={NOTICE_SOURCES.N1.url} target="_blank" rel="noreferrer">
            {NOTICE_SOURCES.N1.formName}
          </a>{" "}
          · guideline published {longDate(guideline?.sourceDate ?? today)}.
        </span>
      </p>
    </>
  );
}
