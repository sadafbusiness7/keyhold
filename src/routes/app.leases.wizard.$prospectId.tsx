import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle, PaperPlaneTilt, FilePlus } from "@phosphor-icons/react";
import { PageHeader } from "@/components/keyhold/app-shell";
import { RequireFinancials } from "@/components/keyhold/access-guard";
import { EmptyState } from "@/components/keyhold/empty-state";
import { Tag, field } from "@/components/keyhold/pipeline";
import { useLeasing, type LeaseDraft } from "@/lib/mock-leasing";
import { cad, longDate, unitAddress, propertyById, unitById } from "@/lib/mock-data";

export const Route = createFileRoute("/app/leases/wizard/$prospectId")({
  head: () => ({
    meta: [
      { title: "Lease wizard — Keyhold" },
      { name: "description", content: "A step-by-step lease, pre-filled from the application, property and unit. Nothing re-typed." },
      { property: "og:title", content: "Lease wizard — Keyhold" },
      { property: "og:description", content: "Confirm the unit, tenants, term, rent and standard-lease answers, then send for signature." },
    ],
  }),
  component: () => (
    <RequireFinancials title="Lease wizard">
      <WizardPage />
    </RequireFinancials>
  ),
});

const steps = [
  "Confirm unit",
  "Tenants & occupants",
  "Term & first invoice",
  "Rent & deposits",
  "Standard lease",
  "Clauses & addenda",
  "Review & send",
] as const;

function WizardPage() {
  const { prospectId } = Route.useParams();
  const navigate = useNavigate();
  const { prospects, applications, drafts, draftFromProspect, saveDraft, sendForSignature, markSigned, activate } = useLeasing();

  const prospect = prospects.find((p) => p.id === prospectId);
  const [draft, setDraft] = useState<LeaseDraft | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (prospect) setDraft((d) => d ?? draftFromProspect(prospect.id));
  }, [prospect, draftFromProspect]);

  const live = draft ? drafts.find((d) => d.id === draft.id) ?? draft : null;

  if (!prospect || !live) {
    return (
      <>
        <PageHeader title="Lease wizard" />
        <EmptyState Icon={FilePlus} title="Nothing to draft" body="Approve a prospect first — the lease then fills itself in." />
      </>
    );
  }
  const app = applications.find((a) => a.id === prospect.applicationId)!;
  const property = propertyById(live.propertyId);
  const unit = unitById(live.unitId);
  const update = (patch: Partial<LeaseDraft>) => {
    const next = { ...live, ...patch };
    setDraft(next);
    saveDraft(next);
  };

  const total = live.rent + live.parkingFee + live.storageFee;

  return (
    <>
      <PageHeader
        title="Create lease"
        subtitle={`Pre-filled from ${app.fullName}'s application — check, don't re-type.`}
        action={<Tag tone="action">{live.status === "draft" ? "Draft" : live.status === "sent" ? "Sent for signature" : live.status === "signed" ? "Signed" : "Active"}</Tag>}
      />

      <ol className="mb-6 flex flex-wrap gap-2">
        {steps.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`min-h-9 rounded-full border px-3 text-xs font-semibold ${
                i === step ? "border-navy bg-navy text-primary-foreground" : i < step ? "border-success text-success" : "border-border text-muted-foreground"
              }`}
            >
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>

      <div className="card-soft max-w-3xl space-y-5 p-5 sm:p-6">
        {step === 0 && (
          <section className="space-y-3">
            <h2 className="font-display text-lg font-bold text-navy">Confirm the home</h2>
            <p className="text-sm text-muted-foreground">Carried over from the listing the applicant applied to.</p>
            <div className="rounded-xl border border-border bg-navy-soft p-4 text-sm text-navy">
              <p className="font-display font-bold">{property.name}</p>
              <p>{property.address}, {property.city} {property.province} {property.postalCode}</p>
              <p className="mt-1">{unit.label} · {unit.kind}</p>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4">
            <h2 className="font-display text-lg font-bold text-navy">Tenants & occupants</h2>
            {live.tenants.map((t, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-sm font-medium" htmlFor={`tn${i}`}>Name</label>
                  <input id={`tn${i}`} className={field} value={t.name} onChange={(e) => update({ tenants: live.tenants.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor={`te${i}`}>Email</label>
                  <input id={`te${i}`} className={field} value={t.email} onChange={(e) => update({ tenants: live.tenants.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)) })} />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor={`tp${i}`}>Phone</label>
                  <input id={`tp${i}`} className={field} value={t.phone} onChange={(e) => update({ tenants: live.tenants.map((x, j) => (j === i ? { ...x, phone: e.target.value } : x)) })} />
                </div>
              </div>
            ))}
            <button type="button" onClick={() => update({ tenants: [...live.tenants, { name: "", email: "", phone: "" }] })} className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
              Add another tenant
            </button>
            <div>
              <label className="text-sm font-medium" htmlFor="occ">Other occupants</label>
              <input id="occ" className={field} value={live.occupants} onChange={(e) => update({ occupants: e.target.value })} />
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="grid gap-4 sm:grid-cols-2">
            <h2 className="font-display text-lg font-bold text-navy sm:col-span-2">Term & first invoice</h2>
            <div>
              <label className="text-sm font-medium" htmlFor="start">Start date</label>
              <input id="start" type="date" className={field} value={live.startDate} onChange={(e) => update({ startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="end">End date</label>
              <input id="end" type="date" className={field} value={live.endDate} onChange={(e) => update({ endDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="term">Term type</label>
              <select id="term" className={field} value={live.termType} onChange={(e) => update({ termType: e.target.value as LeaseDraft["termType"] })}>
                <option>Fixed term</option>
                <option>Month-to-month</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="first">First rent invoice</label>
              <input id="first" type="date" className={field} value={live.firstInvoiceDate} onChange={(e) => update({ firstInvoiceDate: e.target.value })} />
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="grid gap-4 sm:grid-cols-2">
            <h2 className="font-display text-lg font-bold text-navy sm:col-span-2">Rent, parking, storage & deposits</h2>
            {([
              ["rent", "Monthly rent"],
              ["parkingFee", "Parking"],
              ["storageFee", "Storage"],
              ["deposit", "Last month's rent deposit"],
              ["keyDeposit", "Key deposit"],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="text-sm font-medium" htmlFor={key}>{label} (CAD)</label>
                <input id={key} inputMode="decimal" className={`${field} tnum`} value={String(live[key])} onChange={(e) => update({ [key]: Number(e.target.value) || 0 } as Partial<LeaseDraft>)} />
              </div>
            ))}
            <p className="tnum sm:col-span-2 rounded-xl bg-success-soft p-3 font-display text-lg font-extrabold text-success">
              Monthly total {cad(total)}
            </p>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-4">
            <h2 className="font-display text-lg font-bold text-navy">
              {live.province === "ON" ? "Ontario Standard Lease questions" : `${live.province} standard lease questions`}
            </h2>
            {Object.entries(live.standardAnswers).map(([k, v]) => (
              <div key={k}>
                <label className="text-sm font-medium capitalize" htmlFor={`sa-${k}`}>{k}</label>
                <input id={`sa-${k}`} className={field} value={v} onChange={(e) => update({ standardAnswers: { ...live.standardAnswers, [k]: e.target.value } })} />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              {live.province === "ON"
                ? "Ontario requires the government Standard Lease (Form 2229E) for most residential tenancies."
                : "Answers follow the standard residential tenancy rules for this province."}
            </p>
          </section>
        )}

        {step === 5 && (
          <section className="space-y-4">
            <h2 className="font-display text-lg font-bold text-navy">Custom clauses & addenda</h2>
            <textarea
              rows={5}
              value={live.clauses}
              onChange={(e) => update({ clauses: e.target.value })}
              placeholder="Snow clearing by landlord. Bicycle storage in the rear shed."
              className="w-full rounded-xl border border-input bg-background p-3 text-sm"
            />
            <div>
              <label className="text-sm font-medium" htmlFor="addenda">Upload addenda (PDF)</label>
              <input
                id="addenda"
                type="file"
                accept="application/pdf"
                multiple
                className="mt-1 block w-full text-sm"
                onChange={(e) => update({ addenda: [...live.addenda, ...Array.from(e.target.files ?? []).map((f) => f.name)] })}
              />
            </div>
            {live.addenda.length > 0 && (
              <ul className="space-y-1 text-sm text-navy">
                {live.addenda.map((a) => <li key={a}>• {a}</li>)}
              </ul>
            )}
          </section>
        )}

        {step === 6 && (
          <section className="space-y-4">
            <h2 className="font-display text-lg font-bold text-navy">Review</h2>
            <dl className="rounded-xl border border-border p-4 text-sm">
              {[
                ["Home", unitAddress(live.unitId)],
                ["Tenants", live.tenants.map((t) => t.name).join(", ")],
                ["Occupants", live.occupants],
                ["Term", `${live.termType} · ${longDate(live.startDate)} → ${longDate(live.endDate)}`],
                ["Monthly total", cad(total)],
                ["Deposits", `${cad(live.deposit)} + ${cad(live.keyDeposit)} keys`],
                ["First invoice", longDate(live.firstInvoiceDate)],
                ["Addenda", live.addenda.join(", ") || "None"],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-wrap justify-between gap-2 border-b border-border py-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium text-navy">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-wrap gap-3">
              {live.status === "draft" && (
                <button
                  type="button"
                  onClick={() => { sendForSignature(live.id); toast.success("Sent for signature."); }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
                >
                  <PaperPlaneTilt weight="duotone" className="h-5 w-5" aria-hidden="true" /> Send for signature
                </button>
              )}
              {live.status === "sent" && (
                <button
                  type="button"
                  onClick={() => { markSigned(live.id); toast.success("Signature received."); }}
                  className="min-h-11 rounded-full border border-border px-5 text-sm font-semibold text-navy hover:bg-navy-soft"
                >
                  Mark as signed (demo)
                </button>
              )}
              {live.status === "signed" && (
                <button
                  type="button"
                  onClick={() => {
                    const inv = activate(live.id);
                    toast.success(`${inv.tenantName} is active. First invoice ${cad(inv.amount)} on ${longDate(inv.dueDate)}.`);
                    navigate({ to: "/app/rent" });
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-success px-5 text-sm font-semibold text-primary-foreground hover:bg-success/90"
                >
                  <CheckCircle weight="duotone" className="h-5 w-5" aria-hidden="true" />
                  Activate tenant & schedule first rent
                </button>
              )}
              {live.status === "active" && (
                <Link to="/app/rent" className="min-h-11 rounded-full bg-success px-5 text-sm font-semibold leading-[2.75rem] text-primary-foreground">
                  Tenant active — view rent
                </Link>
              )}
            </div>
          </section>
        )}

        <div className="flex justify-between gap-3 border-t border-border pt-4">
          <button type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="min-h-11 rounded-full border border-border px-5 text-sm font-semibold text-navy disabled:opacity-40">
            Back
          </button>
          <button type="button" disabled={step === steps.length - 1} onClick={() => setStep((s) => s + 1)} className="min-h-11 rounded-full bg-navy px-5 text-sm font-semibold text-primary-foreground disabled:opacity-40">
            Next
          </button>
        </div>
      </div>
    </>
  );
}
