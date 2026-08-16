import { useMemo, useState } from "react";
import { useUnsavedGuard } from "@/lib/use-unsaved-guard";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { FloppyDisk, PaperPlaneTilt, Plus, Trash } from "@phosphor-icons/react";
import { PageHeader } from "@/components/keyhold/app-shell";
import { RequireFinancials } from "@/components/keyhold/access-guard";
import { field } from "@/components/keyhold/pipeline";
import {
  WizardProgress,
  StepHelp,
  LeaseGuardrails,
  AiConfirmNote,
  ConfirmDialog,
} from "@/components/keyhold/lease-panels";
import { blankLease, monthlyTotal, useLeases, addMonthsIso, type LeaseRecord } from "@/lib/mock-leases";
import { properties, units, unitAddress, propertyById, cad, longDate } from "@/lib/mock-data";

export const Route = createFileRoute("/app/leases/wizard/")({
  validateSearch: (search: Record<string, unknown>) => ({
    leaseId: typeof search["leaseId"] === "string" ? (search["leaseId"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Guided lease wizard — Keyhold" },
      { name: "description", content: "Seven guided steps to a signed lease: home, tenants, term, money, standard-lease questions, clauses and review." },
      { property: "og:title", content: "Guided lease wizard — Keyhold" },
      { property: "og:description", content: "Plain-language help at every step. You confirm before anything is sent." },
    ],
  }),
  component: () => (
    <RequireFinancials title="Guided lease wizard">
      <WizardPage />
    </RequireFinancials>
  ),
});

const steps = [
  "Property & unit",
  "Tenants & occupants",
  "Term & first invoice",
  "Rent, charges & deposits",
  "Standard lease",
  "Clauses & addenda",
  "Review & send",
] as const;

const help: Record<number, { what: string; why: string }> = {
  0: {
    what: "The exact home this lease covers — the building and the specific unit inside it.",
    why: "The unit sets the province, and the province decides which standard lease and which rules apply.",
  },
  1: {
    what: "Everyone who signs the lease (tenants) and everyone else who will live there (occupants).",
    why: "Only people named as tenants can be held to the lease. Occupants are recorded so the household is on file.",
  },
  2: {
    what: "When the tenancy starts and ends, whether it is a fixed term or month-to-month, and when the first rent invoice goes out.",
    why: "A fixed term usually rolls into month-to-month at the end rather than ending automatically. The first invoice date drives every rent charge after it.",
  },
  3: {
    what: "The base rent plus any separate charges — parking, storage, anything else — and the deposits you hold.",
    why: "Separate charges must be listed separately or they may not be collectable. Deposit limits are set by provincial law.",
  },
  4: {
    what: "The standard-lease questions your province requires — smoking, pets, utilities, services and maintenance.",
    why: "These answers become part of the legal agreement. In Ontario the government Standard Lease is mandatory for most tenancies.",
  },
  5: {
    what: "Extra terms you agree with the tenant, plus any PDFs you attach (building rules, parking agreement).",
    why: "Custom clauses cannot override tenancy law — anything that conflicts is simply void. Attachments keep everything in one record.",
  },
  6: {
    what: "The full lease as it will be sent, and who will be asked to sign it.",
    why: "Nothing is sent until you press Send. Once everyone signs, the lease locks and editing needs an explicit revert.",
  },
};

function WizardPage() {
  const navigate = useNavigate();
  const { leaseId } = Route.useSearch();
  const { leases, create, save, sendForSignature } = useLeases();

  const existing = leaseId ? leases.find((l) => l.id === leaseId) : undefined;
  const [id, setId] = useState<string | null>(existing?.id ?? null);
  const [local, setLocal] = useState<LeaseRecord>(
    existing ?? blankLease(properties[0]!.id, units.find((u) => u.propertyId === properties[0]!.id)!.id, properties[0]!.province),
  );
  const [step, setStep] = useState(0);
  const [confirmSend, setConfirmSend] = useState(false);
  // Un-persisted drafts are the only thing that can be lost: guard those.
  const [dirty, setDirty] = useState(false);
  useUnsavedGuard(dirty, "This lease draft hasn't been saved yet. Leave the wizard and lose it?");

  const live = (id ? leases.find((l) => l.id === id) : null) ?? local;
  const propertyUnits = useMemo(() => units.filter((u) => u.propertyId === live.propertyId), [live.propertyId]);
  const total = monthlyTotal(live);

  const update = (patch: Partial<LeaseRecord>) => {
    const next = { ...live, ...patch } as LeaseRecord;
    setLocal(next);
    if (id) save(id, patch);
    else setDirty(true);
  };

  const persist = (note = "Draft saved") => {
    setDirty(false);
    if (id) {
      save(id, live, note);
      return id;
    }
    const created = create(live);
    setId(created.id);
    return created.id;
  };

  return (
    <>
      <PageHeader
        title="Create a lease"
        subtitle="Seven short steps. Every field explains itself, and you can save as a draft at any point."
        action={
          <button
            type="button"
            onClick={() => {
              persist();
              toast.success("Draft saved. You can come back to it from the lease list.");
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            <FloppyDisk weight="duotone" className="h-5 w-5" aria-hidden="true" />
            Save as draft
          </button>
        }
      />

      <WizardProgress steps={steps} step={step} onJump={setStep} />

      <div className="card-soft max-w-3xl space-y-5 p-5 sm:p-6">
        <StepHelp what={help[step]!.what} why={help[step]!.why} />

        {step === 0 && (
          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium" htmlFor="prop">Property</label>
              <select
                id="prop"
                className={field}
                value={live.propertyId}
                onChange={(e) => {
                  const pid = e.target.value;
                  const first = units.find((u) => u.propertyId === pid);
                  update({ propertyId: pid, unitId: first?.id ?? live.unitId, province: propertyById(pid).province });
                }}
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="unit">Unit</label>
              <select id="unit" className={field} value={live.unitId} onChange={(e) => update({ unitId: e.target.value })}>
                {propertyUnits.map((u) => (
                  <option key={u.id} value={u.id}>{u.label} · {u.kind}</option>
                ))}
              </select>
            </div>
            <p className="sm:col-span-2 rounded-xl border border-border bg-navy-soft p-3 text-sm text-navy">
              Province for this lease: <strong>{live.province}</strong> — the standard lease and rules follow the property.
            </p>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4">
            {live.tenants.map((t, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                {(["name", "email", "phone"] as const).map((k) => (
                  <div key={k}>
                    <label className="text-sm font-medium capitalize" htmlFor={`t-${k}-${i}`}>{k}</label>
                    <input
                      id={`t-${k}-${i}`}
                      className={field}
                      value={t[k]}
                      onChange={(e) => update({ tenants: live.tenants.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)) })}
                    />
                  </div>
                ))}
                {live.tenants.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Remove tenant ${i + 1}`}
                    onClick={() => update({ tenants: live.tenants.filter((_, j) => j !== i) })}
                    className="mt-6 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-maple hover:bg-navy-soft"
                  >
                    <Trash weight="duotone" className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => update({ tenants: [...live.tenants, { name: "", email: "", phone: "" }] })}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
            >
              <Plus weight="duotone" className="h-5 w-5" aria-hidden="true" />
              Add another tenant
            </button>
            <div>
              <label className="text-sm font-medium" htmlFor="occ">Other occupants</label>
              <input id="occ" className={field} value={live.occupants} onChange={(e) => update({ occupants: e.target.value })} placeholder="Two children, ages 6 and 9" />
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium" htmlFor="start">Start date</label>
              <input id="start" type="date" className={field} value={live.startDate}
                onChange={(e) => update({ startDate: e.target.value, endDate: addMonthsIso(e.target.value, 12), firstInvoiceDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="end">End date</label>
              <input id="end" type="date" className={field} value={live.endDate} onChange={(e) => update({ endDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="termtype">Term type</label>
              <select id="termtype" className={field} value={live.termType} onChange={(e) => update({ termType: e.target.value as LeaseRecord["termType"] })}>
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
            {([
              ["rent", "Monthly rent"],
              ["parkingFee", "Parking"],
              ["storageFee", "Storage"],
              ["deposit", "Last month's rent deposit"],
              ["keyDeposit", "Key deposit"],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="text-sm font-medium" htmlFor={key}>{label} (CAD)</label>
                <input
                  id={key}
                  inputMode="decimal"
                  className={`${field} tnum`}
                  value={String(live[key])}
                  onChange={(e) => update({ [key]: Number(e.target.value) || 0 } as Partial<LeaseRecord>)}
                />
              </div>
            ))}
            <div className="sm:col-span-2 space-y-2">
              <p className="text-sm font-medium">Separate charges</p>
              {live.otherCharges.map((c, i) => (
                <div key={i} className="grid gap-3 sm:grid-cols-[1fr_10rem_auto]">
                  <input
                    aria-label={`Charge ${i + 1} name`}
                    className={field}
                    value={c.label}
                    onChange={(e) => update({ otherCharges: live.otherCharges.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                  />
                  <input
                    aria-label={`Charge ${i + 1} amount`}
                    inputMode="decimal"
                    className={`${field} tnum`}
                    value={String(c.amount)}
                    onChange={(e) => update({ otherCharges: live.otherCharges.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) || 0 } : x)) })}
                  />
                  <button
                    type="button"
                    aria-label={`Remove charge ${i + 1}`}
                    onClick={() => update({ otherCharges: live.otherCharges.filter((_, j) => j !== i) })}
                    className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-maple hover:bg-navy-soft"
                  >
                    <Trash weight="duotone" className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => update({ otherCharges: [...live.otherCharges, { label: "Locker", amount: 0 }] })}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
              >
                <Plus weight="duotone" className="h-5 w-5" aria-hidden="true" />
                Add a separate charge
              </button>
            </div>
            <p className="tnum sm:col-span-2 rounded-xl bg-success-soft p-3 font-display text-lg font-extrabold text-success">
              Monthly total {cad(total)}
            </p>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-4">
            <LeaseGuardrails province={live.province} />
            <AiConfirmNote />
            {Object.entries(live.standardAnswers).map(([k, v]) => (
              <div key={k}>
                <label className="text-sm font-medium capitalize" htmlFor={`sa-${k}`}>{k}</label>
                <input
                  id={`sa-${k}`}
                  className={field}
                  value={v}
                  onChange={(e) => update({ standardAnswers: { ...live.standardAnswers, [k]: e.target.value } })}
                />
              </div>
            ))}
          </section>
        )}

        {step === 5 && (
          <section className="space-y-4">
            <label className="text-sm font-medium" htmlFor="clauses">Custom clauses</label>
            <textarea
              id="clauses"
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
                {live.addenda.map((a) => (
                  <li key={a}>• {a}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        {step === 6 && (
          <section className="space-y-4">
            <LeaseGuardrails province={live.province} />
            <dl className="rounded-xl border border-border p-4 text-sm">
              {[
                ["Home", unitAddress(live.unitId)],
                ["Tenants", live.tenants.map((t) => t.name).filter(Boolean).join(", ") || "Not named yet"],
                ["Occupants", live.occupants || "None recorded"],
                ["Term", `${live.termType} · ${longDate(live.startDate)} → ${longDate(live.endDate)}`],
                ["Monthly total", cad(total)],
                ["Deposits", `${cad(live.deposit)} rent deposit + ${cad(live.keyDeposit)} keys`],
                ["First invoice", longDate(live.firstInvoiceDate)],
                ["Clauses", live.clauses || "None"],
                ["Addenda", live.addenda.join(", ") || "None"],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-wrap justify-between gap-2 border-b border-border py-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-navy">{v}</dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              onClick={() => {
                if (!live.tenants.some((t) => t.name)) {
                  toast.error("Name at least one tenant before sending.");
                  return;
                }
                setConfirmSend(true);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
            >
              <PaperPlaneTilt weight="duotone" className="h-5 w-5" aria-hidden="true" />
              Send for signature
            </button>
          </section>
        )}

        <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-4">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="min-h-11 rounded-full border border-border px-5 text-sm font-semibold text-navy hover:bg-navy-soft disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            disabled={step === steps.length - 1}
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            className="min-h-11 rounded-full bg-navy px-5 text-sm font-semibold text-primary-foreground hover:bg-navy/90 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmSend}
        title="Send this lease for signature?"
        body="Each signer gets a secure link by email. Once everyone signs, the lease locks and any change will need the signature reverted first."
        confirmLabel="Send it"
        onConfirm={() => {
          const savedId = persist("Draft confirmed by the owner");
          sendForSignature(savedId);
          toast.success("Sent for signature.");
          navigate({ to: "/app/leases/$leaseId", params: { leaseId: savedId } });
        }}
        onClose={() => setConfirmSend(false)}
      />
    </>
  );
}
