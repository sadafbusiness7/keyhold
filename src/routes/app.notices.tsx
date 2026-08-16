import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  FileText,
  Plus,
  DownloadSimple,
  SealCheck,
  Stamp,
  Users,
  ArrowLeft,
  CheckCircle,
  Warning,
  ClockCounterClockwise,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageHeader } from "@/components/keyhold/app-shell";
import { RequireFinancials } from "@/components/keyhold/access-guard";
import { RailCard } from "@/components/keyhold/status";
import { Tag } from "@/components/keyhold/pipeline";
import { Sheet } from "@/components/keyhold/rent-panels";
import { LegalNotice, SourceLink, AiPrefillNote } from "@/components/keyhold/notice-ui";
import { usePermissions } from "@/lib/mock-access";
import { useRent } from "@/lib/mock-rent";
import { balanceCents, invoiceStatus } from "@/lib/rent-engine";
import { propertyById, unitById, tenantById, longDate } from "@/lib/mock-data";
import { useNotices, type NoticeRecord } from "@/lib/mock-notices";
import { buildPdf, downloadPdf, type PdfLine } from "@/lib/pdf-writer";
import {
  NOTICE_RULES,
  NOTICE_SOURCES,
  ON_GUIDELINE,
  PROVINCE_STATUS,
  SERVICE_METHODS,
  calcN1,
  calcN4,
  certificatePdf,
  deemedReceived,
  explainField,
  fullDate,
  money,
  n1Pdf,
  n4Pdf,
  type NoticeParty,
  type NoticeType,
  type ServiceMethod,
} from "@/lib/notices-engine";

export const Route = createFileRoute("/app/notices")({
  head: () => ({
    meta: [
      { title: "Provincial notices — Keyhold" },
      {
        name: "description",
        content: "Prepare Ontario LTB N1 and N4 notices from your own records, keep the PDF and record how it was served.",
      },
      { property: "og:title", content: "Provincial notices — Keyhold" },
      { property: "og:description", content: "Ontario N1 and N4 notices, pre-filled, saved to tenant history with a certificate of service." },
    ],
  }),
  component: () => (
    <RequireFinancials title="Provincial notices">
      <NoticesPage />
    </RequireFinancials>
  ),
});

const field = "mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm";
const btn = "inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft";
const btnPrimary = "inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90 disabled:opacity-50";

type Candidate = {
  tenantId: string;
  name: string;
  unitId: string;
  unitLabel: string;
  propertyId: string;
  propertyName: string;
  address: string;
  province: string;
  rent: number;
  owing: number;
};

/** Rebuild the PDF for any stored notice — history stays downloadable forever. */
function linesFor(n: NoticeRecord, party: NoticeParty): PdfLine[] {
  if (n.type === "N1") {
    return n1Pdf(
      party,
      calcN1({ today: n.createdOn, currentRent: n.currentRent ?? 0, percent: n.percent ?? 0, effectiveDate: n.effectiveDate }),
      n.createdOn,
    );
  }
  return n4Pdf(
    party,
    calcN4({ today: n.createdOn, owing: n.owing ?? 0, terminationDate: n.terminationDate }),
    [{ period: longDate(n.createdOn), due: n.owing ?? 0, paid: 0, owing: n.owing ?? 0 }],
    n.createdOn,
  );
}

function partyFor(tenantId: string, unitId: string, landlord: string): NoticeParty {
  const unit = unitById(unitId);
  const property = propertyById(unit.propertyId);
  return {
    landlordName: landlord,
    tenantName: tenantById(tenantId)?.name ?? "Tenant",
    address: property.address,
    unitLabel: unit.label,
    city: property.city,
    province: property.province,
    postalCode: property.postalCode,
  };
}

function NoticesPage() {
  const perms = usePermissions();
  const rent = useRent();
  const store = useNotices();
  const today = rent.today;

  const [wizard, setWizard] = useState<null | { type: NoticeType }>(null);
  const [servicing, setServicing] = useState<NoticeRecord | null>(null);

  // Candidates come from the scoped records — province from the property.
  const candidates = useMemo<Candidate[]>(
    () =>
      perms.tenants
        .filter((t) => !rent.isMovedOut(t.id))
        .map((t) => {
          const unit = unitById(t.unitId);
          const property = propertyById(unit.propertyId);
          const owing =
            rent.invoices
              .filter((i) => i.tenantId === t.id && invoiceStatus(i, rent.payments, today) === "overdue")
              .reduce((s, i) => s + balanceCents(i, rent.payments), 0) / 100;
          return {
            tenantId: t.id,
            name: t.name,
            unitId: unit.id,
            unitLabel: unit.label,
            propertyId: property.id,
            propertyName: property.name,
            address: `${property.address} · ${unit.label}`,
            province: property.province,
            rent: store.rentOverrides[unit.id] ?? unit.rent,
            owing: Math.round(owing * 100) / 100,
          };
        }),
    [perms.tenants, rent, store.rentOverrides, today],
  );

  const scheduled = store.notices.filter((n) => n.type === "N1" && !n.rentApplied && n.status !== "cancelled");

  const download = (n: NoticeRecord) => {
    const party = partyFor(n.tenantId, n.unitId, perms.user.name);
    downloadPdf(buildPdf(linesFor(n, party)), n.fileName);
  };

  const downloadCertificate = (n: NoticeRecord) => {
    if (!n.service) return;
    const party = partyFor(n.tenantId, n.unitId, perms.user.name);
    downloadPdf(
      buildPdf(
        certificatePdf({
          party,
          type: n.type,
          servedOn: n.service.servedOn,
          method: n.service.method,
          servedBy: n.service.servedBy,
          time: n.service.time,
        }),
      ),
      n.service.certificateFileName,
    );
  };

  if (wizard) {
    return (
      <NoticeWizard
        type={wizard.type}
        candidates={candidates}
        today={today}
        landlord={perms.user.name}
        onDone={() => setWizard(null)}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Provincial notices"
        subtitle="Official forms, filled in from your own records and kept as evidence."
        action={
          <div className="flex flex-wrap gap-2">
            <button className={btn} onClick={() => setWizard({ type: "N1" })}>
              <Plus weight="duotone" className="h-4 w-4" /> N1 rent increase
            </button>
            <button className={btnPrimary} onClick={() => setWizard({ type: "N4" })}>
              <Plus weight="duotone" className="h-4 w-4" /> N4 non-payment
            </button>
          </div>
        }
      />

      <div className="space-y-3">
        <LegalNotice />
        <div className="flex flex-wrap gap-2">
          <SourceLink type="N1" />
          <SourceLink type="N4" />
        </div>
      </div>

      {/* Province coverage — the province always comes from the property record. */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(PROVINCE_STATUS).map(([code, p]) => (
          <RailCard key={code} status={p.ready ? "occupied" : "vacant"} className="p-4">
            <p className="font-display font-bold text-navy">{p.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {p.ready ? `Forms ready: ${p.forms.join(", ")}` : "Forms coming — prepare these manually for now"}
            </p>
          </RailCard>
        ))}
      </section>

      {/* Scheduled rent increases — never silent. */}
      {scheduled.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold text-navy">Rent increases waiting to take effect</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nothing changes on a lease until the date on the notice. Keyhold shows you the exact day and asks before it
            updates anything.
          </p>
          <ul className="mt-3 space-y-3">
            {scheduled.map((n) => {
              const due = n.effectiveDate ? n.effectiveDate <= today : false;
              return (
                <RailCard as="li" key={n.id} status={due ? "due-soon" : "occupied"} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display font-bold text-navy">{tenantById(n.tenantId)?.name}</p>
                      <p className="text-xs text-muted-foreground">{`${propertyById(n.propertyId).address} · ${unitById(n.unitId).label}`}</p>
                      <p className="money mt-2 text-xl font-extrabold text-navy tnum">
                        {money(n.currentRent ?? 0)} → {money(n.newRent ?? 0)}
                      </p>
                      <p className="mt-1 text-xs text-navy">
                        Takes effect <strong>{fullDate(n.effectiveDate ?? today)}</strong> · {n.percent?.toFixed(2)}% ·
                        {n.service ? ` served ${longDate(n.service.servedOn)}` : " not served yet"}
                      </p>
                    </div>
                    <button
                      className={due ? btnPrimary : `${btn} opacity-60`}
                      disabled={!due}
                      onClick={() => {
                        store.applyRentIncrease(n.id);
                        toast.success(`Rent updated to ${money(n.newRent ?? 0)} from ${fullDate(n.effectiveDate ?? today)}.`);
                      }}
                    >
                      <CheckCircle weight="duotone" className="h-4 w-4" />
                      {due ? "Update the rent now" : `Locked until ${longDate(n.effectiveDate ?? today)}`}
                    </button>
                  </div>
                </RailCard>
              );
            })}
          </ul>
        </section>
      )}

      {/* History */}
      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-navy">Notice history</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every notice stays here with its PDF and certificate of service, in case you ever need evidence.
        </p>
        {store.notices.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No notices yet. Start an N1 or N4 above — you will review every field before anything generates.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {store.notices.map((n) => (
              <RailCard as="li" key={n.id} status={n.service ? "resolved" : "open"} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag tone={n.type === "N4" ? "maple" : "action"}>{n.type}</Tag>
                      <Tag tone={n.service ? "success" : "warning"}>{n.service ? "Served" : "Awaiting service"}</Tag>
                      {n.batchId && <Tag tone="navy">Bulk</Tag>}
                      {n.rentApplied && <Tag tone="success">Rent updated</Tag>}
                    </div>
                    <p className="mt-2 font-display font-bold text-navy">{tenantById(n.tenantId)?.name}</p>
                    <p className="text-xs text-muted-foreground">{`${propertyById(n.propertyId).address} · ${unitById(n.unitId).label} · ${n.province}`}</p>
                    <p className="mt-1 text-xs text-navy tnum">
                      Prepared {longDate(n.createdOn)} by {n.createdBy}
                      {n.type === "N1"
                        ? ` · ${money(n.currentRent ?? 0)} → ${money(n.newRent ?? 0)} from ${longDate(n.effectiveDate ?? n.createdOn)}`
                        : ` · ${money(n.owing ?? 0)} owing · termination ${longDate(n.terminationDate ?? n.createdOn)}`}
                    </p>
                    {n.service && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {n.service.method} on {longDate(n.service.servedOn)} at {n.service.time} by {n.service.servedBy} ·
                        considered received {longDate(n.service.deemedReceivedOn)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className={btn} onClick={() => download(n)}>
                      <DownloadSimple weight="duotone" className="h-4 w-4" /> PDF
                    </button>
                    {n.service ? (
                      <button className={btn} onClick={() => downloadCertificate(n)}>
                        <SealCheck weight="duotone" className="h-4 w-4" /> Certificate
                      </button>
                    ) : (
                      <button className={btnPrimary} onClick={() => setServicing(n)}>
                        <Stamp weight="duotone" className="h-4 w-4" /> Record service
                      </button>
                    )}
                  </div>
                </div>
              </RailCard>
            ))}
          </ul>
        )}
      </section>

      {servicing && (
        <ServiceSheet
          notice={servicing}
          today={today}
          servedByDefault={perms.user.name}
          onClose={() => setServicing(null)}
        />
      )}
    </>
  );
}

// ——— record a certificate of service ———
function ServiceSheet({
  notice,
  today,
  servedByDefault,
  onClose,
}: {
  notice: NoticeRecord;
  today: string;
  servedByDefault: string;
  onClose: () => void;
}) {
  const store = useNotices();
  const [servedOn, setServedOn] = useState(today);
  const [time, setTime] = useState("5:00 pm");
  const [method, setMethod] = useState<ServiceMethod>(SERVICE_METHODS[0]!);
  const [servedBy, setServedBy] = useState(servedByDefault);

  const received = deemedReceived(servedOn, method);

  const save = () => {
    const certificateFileName = `Certificate of service — ${notice.type} — ${tenantById(notice.tenantId)?.name}.pdf`;
    store.recordService(notice.id, {
      servedOn,
      time,
      method,
      servedBy,
      deemedReceivedOn: received,
      certificateFileName,
    });
    const party = partyFor(notice.tenantId, notice.unitId, servedBy);
    downloadPdf(buildPdf(certificatePdf({ party, type: notice.type, servedOn, method, servedBy, time })), certificateFileName);
    toast.success("Certificate of service saved to this tenant's history.");
    onClose();
  };

  return (
    <Sheet title="Record how it was served" onClose={onClose}>
      <LegalNotice />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-navy">
          Date served
          <input type="date" className={field} value={servedOn} onChange={(e) => setServedOn(e.target.value)} />
        </label>
        <label className="text-sm font-medium text-navy">
          Time
          <input className={field} value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <label className="text-sm font-medium text-navy sm:col-span-2">
          How it was served
          <select className={field} value={method} onChange={(e) => setMethod(e.target.value as ServiceMethod)}>
            {SERVICE_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-navy sm:col-span-2">
          Served by
          <input className={field} value={servedBy} onChange={(e) => setServedBy(e.target.value)} />
        </label>
      </div>
      <p className="rounded-xl border border-border bg-navy-soft p-3 text-xs text-navy">
        Considered received on <strong>{fullDate(received)}</strong>
        {method === "Mailed (add 5 days)" ? " — mail adds five days in Ontario." : "."}
      </p>
      <button className={btnPrimary} onClick={save}>
        <SealCheck weight="duotone" className="h-4 w-4" /> Save certificate of service
      </button>
    </Sheet>
  );
}

// ——— the create wizard (individual or bulk) ———
function NoticeWizard({
  type,
  candidates,
  today,
  landlord,
  onDone,
}: {
  type: NoticeType;
  candidates: Candidate[];
  today: string;
  landlord: string;
  onDone: () => void;
}) {
  const store = useNotices();
  const rules = NOTICE_RULES[type];
  const guideline = ON_GUIDELINE[Number(today.slice(0, 4))] ?? 2.5;

  const eligible = candidates.filter((c) => PROVINCE_STATUS[c.province]?.forms.includes(type));
  const blocked = candidates.filter((c) => !PROVINCE_STATUS[c.province]?.forms.includes(type));
  const suggested = type === "N4" ? eligible.filter((c) => c.owing > 0) : eligible;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<string[]>(type === "N4" ? suggested.map((c) => c.tenantId) : []);
  const [percent, setPercent] = useState(guideline);
  const [effectiveDate, setEffectiveDate] = useState(calcN1({ today, currentRent: 1000, percent: guideline }).earliestEffective);
  const [terminationDate, setTerminationDate] = useState(calcN4({ today, owing: 0 }).earliestTermination);
  const [confirmed, setConfirmed] = useState(false);

  const rows = eligible.filter((c) => selected.includes(c.tenantId));
  const earliestN1 = calcN1({ today, currentRent: 1000, percent }).earliestEffective;
  const earliestN4 = calcN4({ today, owing: 0 }).earliestTermination;
  const n1Preview = rows.map((c) => ({ c, calc: calcN1({ today, currentRent: c.rent, percent, effectiveDate }) }));
  const n4Preview = rows.map((c) => ({ c, calc: calcN4({ today, owing: c.owing, terminationDate }) }));
  const anyProblem =
    type === "N1"
      ? n1Preview.some((r) => !r.calc.noticeOk || r.calc.aboveGuideline)
      : n4Preview.some((r) => !r.calc.noticeOk || r.calc.totalOwing <= 0);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const generate = () => {
    const batchId = rows.length > 1 ? `batch-${Date.now()}` : undefined;
    const created = store.addNotices(
      rows.map((c) => {
        const base = {
          type,
          tenantId: c.tenantId,
          unitId: c.unitId,
          propertyId: c.propertyId,
          province: c.province,
          createdOn: today,
          createdBy: landlord,
          fileName: `${type} — ${c.name} — ${today}.pdf`,
          ...(batchId ? { batchId } : {}),
        };
        if (type === "N1") {
          const calc = calcN1({ today, currentRent: c.rent, percent, effectiveDate });
          return { ...base, currentRent: c.rent, newRent: calc.newRent, percent, effectiveDate, rentApplied: false };
        }
        const calc = calcN4({ today, owing: c.owing, terminationDate });
        return { ...base, owing: calc.totalOwing, terminationDate };
      }),
    );

    // One PDF containing every notice in the batch, plus each saved to history.
    const lines: PdfLine[] = [];
    created.forEach((n, i) => {
      if (i > 0) lines.push({ t: "pagebreak" });
      lines.push(...linesFor(n, partyFor(n.tenantId, n.unitId, landlord)));
    });
    downloadPdf(buildPdf(lines), created.length > 1 ? `${type} notices — ${today}.pdf` : created[0]!.fileName);
    toast.success(
      `${created.length} ${type} notice${created.length > 1 ? "s" : ""} generated and saved to tenant history. Record service next.`,
    );
    onDone();
  };

  return (
    <>
      <PageHeader
        title={rules.title}
        subtitle={rules.plain}
        action={
          <button className={btn} onClick={onDone}>
            <ArrowLeft weight="duotone" className="h-4 w-4" /> Back to notices
          </button>
        }
      />

      <div className="space-y-3">
        <LegalNotice />
        <SourceLink type={type} />
        <AiPrefillNote />
      </div>

      <ol className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
        {["Choose tenants", "Check the details", "Review & confirm"].map((label, i) => (
          <li
            key={label}
            className={`rounded-full px-3 py-1.5 ${step === i + 1 ? "bg-navy text-primary-foreground" : "border border-border text-navy"}`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <section className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button className={btn} onClick={() => setSelected(eligible.map((c) => c.tenantId))}>
              <Users weight="duotone" className="h-4 w-4" /> Select all ({eligible.length})
            </button>
            {type === "N4" && (
              <button className={btn} onClick={() => setSelected(suggested.map((c) => c.tenantId))}>
                Only tenants in arrears ({suggested.length})
              </button>
            )}
            <button className={btn} onClick={() => setSelected([])}>
              Clear
            </button>
          </div>
          <ul className="grid gap-2 lg:grid-cols-2">
            {eligible.map((c) => {
              const checked = selected.includes(c.tenantId);
              return (
                <li key={c.tenantId}>
                  <label
                    className={`flex min-h-16 cursor-pointer items-start gap-3 rounded-2xl border p-3 ${checked ? "border-action bg-action-soft" : "border-border bg-card"}`}
                  >
                    <input type="checkbox" className="mt-1 h-5 w-5" checked={checked} onChange={() => toggle(c.tenantId)} />
                    <span className="min-w-0">
                      <span className="block font-display font-bold text-navy">{c.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{c.address} · {c.province}</span>
                      <span className="mt-1 block text-xs text-navy tnum">
                        Rent {money(c.rent)}
                        {type === "N4" && (c.owing > 0 ? ` · ${money(c.owing)} overdue` : " · nothing overdue")}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          {blocked.length > 0 && (
            <p className="rounded-xl border border-border bg-navy-soft p-3 text-xs text-navy">
              {blocked.length} tenant{blocked.length > 1 ? "s are" : " is"} in a province where this form does not apply
              ({[...new Set(blocked.map((b) => b.province))].join(", ")}). Their notices are not built yet.
            </p>
          )}
          <button className={btnPrimary} disabled={!selected.length} onClick={() => setStep(2)}>
            Continue with {selected.length} tenant{selected.length === 1 ? "" : "s"}
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="mt-5 space-y-4">
          {type === "N1" ? (
            <div className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-navy">
                Increase (%)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={field}
                  value={percent}
                  onChange={(e) => setPercent(Number(e.target.value))}
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  {explainField("N1", "percent")} The {today.slice(0, 4)} guideline is {guideline}%.
                </span>
              </label>
              <label className="text-sm font-medium text-navy">
                First month at the new rent
                <input type="date" className={field} value={effectiveDate} min={earliestN1} onChange={(e) => setEffectiveDate(e.target.value)} />
                <span className="mt-1 block text-xs text-muted-foreground">
                  {explainField("N1", "effectiveDate")} Earliest allowed: {fullDate(earliestN1)}.
                </span>
              </label>
            </div>
          ) : (
            <div className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-navy">
                Termination date
                <input type="date" className={field} value={terminationDate} min={earliestN4} onChange={(e) => setTerminationDate(e.target.value)} />
                <span className="mt-1 block text-xs text-muted-foreground">
                  {explainField("N4", "terminationDate")} Earliest allowed: {fullDate(earliestN4)}.
                </span>
              </label>
              <p className="text-xs text-muted-foreground sm:pt-6">{explainField("N4", "owing")}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button className={btn} onClick={() => setStep(1)}>
              <ArrowLeft weight="duotone" className="h-4 w-4" /> Back
            </button>
            <button className={btnPrimary} onClick={() => setStep(3)}>
              Review {rows.length} notice{rows.length === 1 ? "" : "s"}
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-5 space-y-4">
          <ul className="space-y-3">
            {type === "N1"
              ? n1Preview.map(({ c, calc }) => (
                  <RailCard as="li" key={c.tenantId} status={calc.aboveGuideline || !calc.noticeOk ? "due-soon" : "occupied"} className="p-4">
                    <p className="font-display font-bold text-navy">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.address}</p>
                    <p className="money mt-2 text-2xl font-extrabold text-navy tnum">
                      {money(calc.currentRent)} → {money(calc.newRent)}
                    </p>
                    <p className="text-xs text-navy tnum">
                      +{money(calc.increase)} ({calc.proposedPct.toFixed(2)}%) from {fullDate(calc.effectiveDate)} ·{" "}
                      {calc.noticeDaysGiven} days' notice
                    </p>
                    {calc.aboveGuideline && (
                      <p className="mt-2 flex gap-2 text-xs font-semibold text-maple">
                        <Warning weight="duotone" className="h-4 w-4" /> Above the {calc.guidelinePct}% guideline — you
                        need an LTB order first.
                      </p>
                    )}
                    {!calc.noticeOk && (
                      <p className="mt-2 flex gap-2 text-xs font-semibold text-maple">
                        <Warning weight="duotone" className="h-4 w-4" /> Less than 90 days' notice.
                      </p>
                    )}
                  </RailCard>
                ))
              : n4Preview.map(({ c, calc }) => (
                  <RailCard as="li" key={c.tenantId} status={calc.totalOwing > 0 ? "overdue" : "due-soon"} className="p-4">
                    <p className="font-display font-bold text-navy">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.address}</p>
                    <p className="money mt-2 text-2xl font-extrabold text-navy tnum">{money(calc.totalOwing)} owing</p>
                    <p className="text-xs text-navy tnum">
                      Termination {fullDate(calc.terminationDate)} · {calc.noticeDaysGiven} days' notice
                    </p>
                    {calc.totalOwing <= 0 && (
                      <p className="mt-2 flex gap-2 text-xs font-semibold text-maple">
                        <Warning weight="duotone" className="h-4 w-4" /> Nothing is overdue for this tenant — an N4 would
                        not be valid.
                      </p>
                    )}
                  </RailCard>
                ))}
          </ul>

          <LegalNotice />
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm text-navy">
            <input type="checkbox" className="mt-0.5 h-5 w-5" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <span>
              I have read every field above and confirm the details are correct. I am choosing to generate{" "}
              {rows.length} {NOTICE_SOURCES[type].formName.split("—")[0]!.trim()} notice{rows.length === 1 ? "" : "s"}.
            </span>
          </label>
          {anyProblem && (
            <p className="rounded-xl border border-maple/30 bg-maple-soft p-3 text-xs font-semibold text-maple">
              Some notices above have a warning. Fix them or remove those tenants before generating.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button className={btn} onClick={() => setStep(2)}>
              <ArrowLeft weight="duotone" className="h-4 w-4" /> Back
            </button>
            <button className={btnPrimary} disabled={!confirmed || !rows.length} onClick={generate}>
              <FileText weight="duotone" className="h-4 w-4" /> Generate {rows.length} PDF{rows.length === 1 ? "" : "s"} & save to history
            </button>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ClockCounterClockwise weight="duotone" className="h-4 w-4" /> Each notice is saved to that tenant's history
            with its PDF. Rent only changes on the date shown, after you confirm again.
          </p>
        </section>
      )}
    </>
  );
}
