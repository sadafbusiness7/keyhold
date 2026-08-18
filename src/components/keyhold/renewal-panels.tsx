/**
 * RENEWALS PIPELINE UI — presentation only.
 * All state lives in mock-renewals.tsx / mock-leases.tsx; guideline maths comes
 * from notices-engine.ts so Ontario increases follow the same rules as the N1.
 */
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarX,
  CheckCircle,
  Clock,
  DoorOpen,
  FileText,
  PaperPlaneTilt,
  Scales,
  Warning,
  X,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { cad, longDate, tenants as allTenants, unitById, propertyById } from "@/lib/mock-data";
import { daysUntil, monthlyTotal, type LeaseRecord } from "@/lib/mock-leases";
import {
  MOVE_OUT_STEPS,
  renewalStatusLabel,
  type MoveOutStepKey,
  type RenewalRecord,
  type RenewalStatus,
} from "@/lib/mock-renewals";
import { calcN1, NOTICE_RULES } from "@/lib/notices-engine";
import { useModalA11y } from "@/lib/use-modal-a11y";

export const inputCls =
  "min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm tabular-nums";
export const btn =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft";
export const btnPrimary =
  "inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90 disabled:opacity-50";

const statusTone: Record<RenewalStatus, string> = {
  "not-started": "bg-surface-sunk text-navy",
  "offer-sent": "bg-action-soft text-action",
  accepted: "bg-success-soft text-success",
  declined: "bg-maple-soft text-maple",
  renewed: "bg-success-soft text-success",
  ending: "bg-warning-soft text-warning",
};

export function RenewalStatusPill({ status }: { status: RenewalStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusTone[status]}`}>
      {renewalStatusLabel[status]}
    </span>
  );
}

export function leaseParty(lease: LeaseRecord) {
  const unit = unitById(lease.unitId);
  const property = propertyById(unit.propertyId);
  const tenant = allTenants.find((t) => t.id === lease.tenantId);
  return {
    unit,
    property,
    tenantName: tenant?.name ?? lease.tenants[0]?.name ?? "Tenant",
    tenantEmail: tenant?.email ?? lease.tenants[0]?.email ?? "",
  };
}

/* ————————————————— pipeline row ————————————————— */

export function RenewalRow({
  lease,
  status,
  onOpen,
}: {
  lease: LeaseRecord;
  status: RenewalStatus;
  onOpen: () => void;
}) {
  const { unit, property, tenantName } = leaseParty(lease);
  const left = daysUntil(lease.endDate);
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="card-soft grid w-full grid-cols-1 gap-2 p-4 text-left transition-colors hover:bg-navy-soft sm:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_auto_auto] sm:items-center"
      >
        <span className="min-w-0">
          <span className="block truncate font-display text-base font-bold text-navy">{tenantName}</span>
          <span className="block truncate text-sm text-muted-foreground">
            {property.name} · {unit.label}
          </span>
        </span>
        <span className="text-sm text-muted-foreground">
          <span className="tnum block font-semibold text-navy">Ends {longDate(lease.endDate)}</span>
          <span className="tnum block">
            {left < 0 ? `${Math.abs(left)} days ago` : `${left} days left`} · {cad(monthlyTotal(lease))}/mo
          </span>
        </span>
        <RenewalStatusPill status={status} />
        <ArrowRight weight="duotone" className="hidden h-5 w-5 text-navy sm:block" aria-hidden="true" />
      </button>
    </li>
  );
}

/* ————————————————— drawer ————————————————— */

type DrawerProps = {
  lease: LeaseRecord;
  record: RenewalRecord | undefined;
  today: string;
  guidelinePct: number;
  guidelineUrl: string;
  defaultTermMonths: number;
  onClose: () => void;
  onStart: (offer: {
    termMonths: number;
    newRent: number;
    currentRent: number;
    percent: number;
    aboveGuideline: boolean;
    effectiveDate: string;
    note: string;
  }) => void;
  onSend: () => void;
  onRespond: (accepted: boolean) => void;
  onComplete: () => void;
  onEnd: (moveOut: string, reason: string) => void;
  onToggleStep: (key: MoveOutStepKey) => void;
  onForwarding: (value: string) => void;
};

export function RenewalDrawer(props: DrawerProps) {
  const {
    lease,
    record,
    today,
    guidelinePct,
    guidelineUrl,
    defaultTermMonths,
    onClose,
    onStart,
    onSend,
    onRespond,
    onComplete,
    onEnd,
    onToggleStep,
    onForwarding,
  } = props;

  const { unit, property, tenantName, tenantEmail } = leaseParty(lease);
  const isOntario = property.province === "ON";
  const status: RenewalStatus = record?.status ?? "not-started";

  const [mode, setMode] = useState<"renew" | "end">(status === "ending" ? "end" : "renew");
  const [rentChoice, setRentChoice] = useState<"same" | "increase">("same");
  const [percent, setPercent] = useState(String(guidelinePct));
  const [termMonths, setTermMonths] = useState(String(defaultTermMonths));
  const [note, setNote] = useState("");
  const [moveOut, setMoveOut] = useState(lease.endDate);
  const [reason, setReason] = useState("Tenant is not renewing");

  const dayAfterEnd = useMemo(() => {
    const d = new Date(lease.endDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, [lease.endDate]);

  const pct = rentChoice === "same" ? 0 : Number(percent) || 0;
  const baseCalc = useMemo(
    () => calcN1({ today, currentRent: lease.rent, percent: pct, effectiveDate: dayAfterEnd }),
    [today, lease.rent, pct, dayAfterEnd],
  );
  /** An Ontario increase can't start before 90 days' notice have run. */
  const rentStartDate =
    rentChoice === "increase" && isOntario && dayAfterEnd < baseCalc.earliestEffective
      ? baseCalc.earliestEffective
      : dayAfterEnd;
  const calc = useMemo(
    () => calcN1({ today, currentRent: lease.rent, percent: pct, effectiveDate: rentStartDate }),
    [today, lease.rent, pct, rentStartDate],
  );

  const aboveGuideline = pct > guidelinePct + 0.001;
  const deferredStart = rentStartDate !== dayAfterEnd;

  const startOffer = () => {
    onStart({
      termMonths: Number(termMonths) || defaultTermMonths,
      newRent: rentChoice === "same" ? lease.rent : calc.newRent,
      currentRent: lease.rent,
      percent: pct,
      aboveGuideline,
      effectiveDate: rentStartDate,
      note,
    });
    toast.success("Renewal offer drafted.");
  };

  const dialogRef = useModalA11y<HTMLDivElement>(onClose);

  return (
    <div ref={dialogRef} tabIndex={-1} className="fixed inset-0 z-50 flex justify-end bg-navy/40" role="dialog" aria-modal="true" aria-label={`Renewal for ${tenantName}`}>
      <button type="button" className="flex-1" aria-label="Close" onClick={onClose} />
      <div className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-background p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-extrabold text-navy">{tenantName}</h2>
            <p className="truncate text-sm text-muted-foreground">
              {property.name} · {unit.label} · ends {longDate(lease.endDate)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-full border border-border text-navy" aria-label="Close renewal panel">
            <X weight="duotone" className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <RenewalStatusPill status={status} />
          <span className="tnum text-xs text-muted-foreground">
            {daysUntil(lease.endDate)} days to the end of the term · current rent {cad(lease.rent)}/mo
          </span>
        </div>

        {status === "not-started" && (
          <div role="tablist" aria-label="Renewal or move-out" className="mb-5 flex gap-2">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "renew"}
              onClick={() => setMode("renew")}
              className={mode === "renew" ? btnPrimary : btn}
            >
              <CheckCircle weight="duotone" className="h-5 w-5" aria-hidden="true" /> Start renewal
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "end"}
              onClick={() => setMode("end")}
              className={mode === "end" ? btnPrimary : btn}
            >
              <DoorOpen weight="duotone" className="h-5 w-5" aria-hidden="true" /> End tenancy
            </button>
          </div>
        )}

        {/* ————— renewal offer builder ————— */}
        {status === "not-started" && mode === "renew" && (
          <section className="card-soft mb-5 p-4">
            <h3 className="font-display text-base font-bold text-navy">The offer</h3>

            <fieldset className="mt-3">
              <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rent for the new term</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {(["same", "increase"] as const).map((k) => (
                  <label
                    key={k}
                    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm font-semibold ${
                      rentChoice === k ? "border-action bg-action-soft text-action" : "border-border text-navy"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rent-choice"
                      className="h-4 w-4"
                      checked={rentChoice === k}
                      onChange={() => setRentChoice(k)}
                    />
                    {k === "same" ? `Same rent — ${cad(lease.rent)}` : "Increase the rent"}
                  </label>
                ))}
              </div>
            </fieldset>

            {rentChoice === "increase" && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-navy">
                  Increase %
                  <input
                    type="number"
                    step="0.1"
                    className={`mt-1 ${inputCls}`}
                    value={percent}
                    onChange={(e) => setPercent(e.target.value)}
                  />
                </label>
                <div className="rounded-xl bg-surface-sunk p-3 text-sm">
                  <p className="tnum font-display text-lg font-extrabold text-navy">{cad(calc.newRent)}/mo</p>
                  <p className="tnum text-xs text-muted-foreground">
                    from {longDate(rentStartDate)} · +{cad(calc.newRent - lease.rent)}/mo
                  </p>
                </div>
              </div>
            )}

            {isOntario && rentChoice === "increase" && (
              <div className="mt-3 rounded-xl border border-border p-3 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5 font-semibold text-navy">
                  <Scales weight="duotone" className="h-4 w-4" aria-hidden="true" /> Ontario guideline {guidelinePct}%
                </p>
                <p className="tnum mt-1">
                  Earliest legal effective date with {NOTICE_RULES.N1.noticeDays} days' notice: {longDate(calc.earliestEffective)}
                </p>
                <a className="font-semibold underline" href={guidelineUrl} target="_blank" rel="noreferrer">
                  Official source
                </a>
              </div>
            )}

            {aboveGuideline && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-warning-soft p-3 text-xs font-semibold text-warning">
                <Warning weight="duotone" className="h-4 w-4 shrink-0" aria-hidden="true" />
                {percent}% is above the {guidelinePct}% guideline. In Ontario that needs an LTB above-guideline order (AGI) — Keyhold will not send this as a plain renewal.
              </p>
            )}
            {deferredStart && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-warning-soft p-3 text-xs font-semibold text-warning">
                <Warning weight="duotone" className="h-4 w-4 shrink-0" aria-hidden="true" />
                90 days' notice hasn't run yet, so the new rent starts {longDate(rentStartDate)}. Rent stays at {cad(lease.rent)} until then.
              </p>
            )}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-navy">
                New term (months)
                <input type="number" className={`mt-1 ${inputCls}`} value={termMonths} onChange={(e) => setTermMonths(e.target.value)} />
              </label>
              <label className="text-xs font-semibold text-navy">
                Note to the tenant (optional)
                <input className={`mt-1 ${inputCls}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="We'd love to have you stay." />
              </label>
            </div>

            <p className="tnum mt-3 text-xs text-muted-foreground">
              New term would run {longDate(dayAfterEnd)} → {longDate(addMonths(dayAfterEnd, Number(termMonths) || defaultTermMonths))}
            </p>

            <button type="button" className={`mt-4 ${btnPrimary}`} onClick={startOffer} disabled={aboveGuideline}>
              <FileText weight="duotone" className="h-5 w-5" aria-hidden="true" /> Generate renewal offer
            </button>
          </section>
        )}

        {/* ————— offer tracking ————— */}
        {record?.offer && status !== "ending" && (
          <section className="card-soft mb-5 p-4">
            <h3 className="font-display text-base font-bold text-navy">Renewal offer</h3>
            <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
              <Detail label="New rent" value={`${cad(record.offer.newRent)}/mo`} />
              <Detail label="Change" value={record.offer.percent ? `+${record.offer.percent}%` : "No change"} />
              <Detail label="Term" value={`${record.offer.termMonths} months`} />
              <Detail label="Starts" value={longDate(record.offer.effectiveDate)} />
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              {status === "not-started" && (
                <button type="button" className={btnPrimary} onClick={onSend}>
                  <PaperPlaneTilt weight="duotone" className="h-5 w-5" aria-hidden="true" /> Send to {tenantEmail || "tenant"}
                </button>
              )}
              {status === "offer-sent" && (
                <>
                  <button type="button" className={btnPrimary} onClick={() => onRespond(true)}>
                    <CheckCircle weight="duotone" className="h-5 w-5" aria-hidden="true" /> Tenant accepted
                  </button>
                  <button type="button" className={btn} onClick={() => onRespond(false)}>
                    <CalendarX weight="duotone" className="h-5 w-5" aria-hidden="true" /> Tenant declined
                  </button>
                </>
              )}
              {status === "accepted" && (
                <button type="button" className={btnPrimary} onClick={onComplete}>
                  <CheckCircle weight="duotone" className="h-5 w-5" aria-hidden="true" /> Create the new term & schedule invoicing
                </button>
              )}
              {status === "declined" && (
                <button type="button" className={btn} onClick={() => onEnd(lease.endDate, "Renewal declined")}>
                  <DoorOpen weight="duotone" className="h-5 w-5" aria-hidden="true" /> Start move-out
                </button>
              )}
            </div>

            {status === "renewed" && record.newLeaseId && (
              <p className="mt-3 rounded-xl bg-success-soft p-3 text-xs font-semibold text-success">
                New term created. Invoicing scheduled from {longDate(record.invoicingScheduledFrom ?? record.offer.effectiveDate)}.{" "}
                <Link to="/app/leases/$leaseId" params={{ leaseId: record.newLeaseId }} className="underline">
                  Open the new lease
                </Link>
              </p>
            )}
          </section>
        )}

        {/* ————— move-out ————— */}
        {(mode === "end" || status === "ending") && status !== "renewed" && (
          <section className="card-soft mb-5 p-4">
            <h3 className="font-display text-base font-bold text-navy">Move-out</h3>
            {status !== "ending" ? (
              <>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-navy">
                    Move-out date (keys returned)
                    <input type="date" className={`mt-1 ${inputCls}`} value={moveOut} onChange={(e) => setMoveOut(e.target.value)} />
                  </label>
                  <label className="text-xs font-semibold text-navy">
                    Reason
                    <input className={`mt-1 ${inputCls}`} value={reason} onChange={(e) => setReason(e.target.value)} />
                  </label>
                </div>
                <button type="button" className={`mt-4 ${btnPrimary}`} onClick={() => onEnd(moveOut, reason)}>
                  <DoorOpen weight="duotone" className="h-5 w-5" aria-hidden="true" /> Start the move-out checklist
                </button>
              </>
            ) : (
              <>
                <p className="tnum mt-1 text-sm text-muted-foreground">
                  Keys due {longDate(record?.moveOutDate ?? lease.endDate)}
                  {record?.moveOutReason ? ` · ${record.moveOutReason}` : ""}
                </p>
                <ul className="mt-3 space-y-2">
                  {MOVE_OUT_STEPS.map((step) => {
                    const done = !!record?.checklist[step.key];
                    return (
                      <li key={step.key}>
                        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm">
                          <input
                            type="checkbox"
                            className="mt-0.5 h-5 w-5"
                            checked={done}
                            onChange={() => onToggleStep(step.key)}
                          />
                          <span>
                            <span className={`block font-semibold ${done ? "text-success" : "text-navy"}`}>{step.label}</span>
                            <span className="block text-xs text-muted-foreground">{step.help}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                <label className="mt-3 block text-xs font-semibold text-navy">
                  Forwarding address
                  <input
                    className={`mt-1 ${inputCls}`}
                    value={record?.forwardingAddress ?? ""}
                    onChange={(e) => onForwarding(e.target.value)}
                    placeholder="Where the deposit and any mail should go"
                  />
                </label>
              </>
            )}
          </section>
        )}

        {record && record.history.length > 0 && (
          <section className="card-soft p-4">
            <h3 className="font-display text-base font-bold text-navy">History</h3>
            <ol className="mt-2 space-y-2 text-sm">
              {record.history.map((h) => (
                <li key={h.id} className="flex items-start gap-2">
                  <Clock weight="duotone" className="mt-0.5 h-4 w-4 shrink-0 text-navy" aria-hidden="true" />
                  <span>
                    <span className="block text-navy">{h.what}</span>
                    <span className="tnum block text-xs text-muted-foreground">{new Date(h.at).toLocaleString("en-CA")}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <p className="mt-5 text-xs text-muted-foreground">
          General information, not legal advice. Always check the current rules for your province before serving a notice.
        </p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="tnum font-semibold text-navy">{value}</dd>
    </div>
  );
}

function addMonths(iso: string, months: number) {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}
