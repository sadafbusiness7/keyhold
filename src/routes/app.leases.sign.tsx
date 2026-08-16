import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Check,
  Warning,
  Info,
  FileText,
  PencilSimple,
  Signature,
  UserPlus,
  PaperPlaneTilt,
  DownloadSimple,
  Eye,
  Trash,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/keyhold/app-shell";
import { leases, tenantById, unitAddress, propertyById, unitById, cad, longDate } from "@/lib/mock-data";

export const Route = createFileRoute("/app/leases/sign")({
  head: () => ({
    meta: [
      { title: "Sign a lease or notice — Keyhold" },
      {
        name: "description",
        content:
          "A calm step-by-step e-signature flow for Ontario leases and LTB notices. Review, add signers, place signatures, send and track.",
      },
      { property: "og:title", content: "Sign a lease or notice — Keyhold" },
      { property: "og:description", content: "Guided e-signing for Canadian leases and notices. Nothing is final until everyone confirms." },
    ],
  }),
  component: SignWizard,
});

/* ---------------------------------- data --------------------------------- */

const steps = [
  "Choose document",
  "Review & fill",
  "Add signers",
  "Place signatures",
  "Send & track",
  "Done",
] as const;

const docTypes = [
  {
    id: "osl",
    name: "Ontario Standard Lease",
    code: "Form 2229E",
    blurb: "The required residential tenancy agreement for most Ontario rentals.",
    source: "Ontario Ministry of Municipal Affairs and Housing",
    updated: "2026-02-01",
  },
  {
    id: "n1",
    name: "Notice of Rent Increase",
    code: "LTB Form N1",
    blurb: "Ninety days' written notice before a rent increase takes effect.",
    source: "Landlord and Tenant Board",
    updated: "2025-11-14",
  },
  {
    id: "n4",
    name: "Notice to End Tenancy — Non-payment",
    code: "LTB Form N4",
    blurb: "Served when rent is unpaid. Filing an application is a separate step you control.",
    source: "Landlord and Tenant Board",
    updated: "2025-09-02",
  },
  {
    id: "renewal",
    name: "Lease renewal letter",
    code: "Keyhold template",
    blurb: "A plain-language renewal offer. Not an official form.",
    source: "Keyhold",
    updated: "2026-05-20",
  },
];

type FieldKind = "prefilled" | "draft" | "missing";

const fields: { label: string; value: string; kind: FieldKind; plain: string }[] = [
  { label: "Rental unit", value: "412 Lansdowne Ave · Main floor, Toronto ON", kind: "prefilled", plain: "The address on the tenancy agreement." },
  { label: "Landlord (legal name)", value: "Sandra Whitlock", kind: "prefilled", plain: "The person or company the tenant pays rent to." },
  { label: "Tenant", value: "Marie Tremblay", kind: "prefilled", plain: "Every adult tenant on the agreement signs." },
  { label: "Current lawful rent", value: "CA$2,350.00 per month", kind: "prefilled", plain: "What the tenant pays today, before any change." },
  { label: "New rent", value: "CA$2,405.00 per month", kind: "prefilled", plain: "The 2026 Ontario guideline increase is 2.3%. Keyhold applied it — check it before you send." },
  { label: "First day of new rent", value: "1 December 2026", kind: "prefilled", plain: "At least 90 days after the tenant receives this notice." },
  { label: "Reason / note to tenant", value: "This is the annual guideline increase. Your lease terms are unchanged.", kind: "draft", plain: "Written by Keyhold's assistant. Read it and edit it in your own words." },
  { label: "Landlord phone number", value: "", kind: "missing", plain: "Required on the form so the tenant can reach you." },
];

type Signer = { id: string; name: string; email: string; role: "Landlord" | "Tenant" };

const initialSigners: Signer[] = [
  { id: "s1", name: "Sandra Whitlock", email: "sandra@keyhold.ca", role: "Landlord" },
  { id: "s2", name: "Marie Tremblay", email: "marie.tremblay@example.com", role: "Tenant" },
];

const placements = [
  { id: "p1", label: "Landlord signature", who: "Sandra Whitlock", top: "58%", left: "8%" },
  { id: "p2", label: "Date signed", who: "Sandra Whitlock", top: "58%", left: "56%" },
  { id: "p3", label: "Tenant signature", who: "Marie Tremblay", top: "76%", left: "8%" },
  { id: "p4", label: "Initials", who: "Marie Tremblay", top: "76%", left: "56%" },
];

const timeline = [
  { state: "Sent", detail: "Emailed to marie.tremblay@example.com", when: "9 Aug 2026, 9:04 a.m. EDT", ip: "142.113.20.7", done: true },
  { state: "Viewed", detail: "Opened the signing link on a mobile device", when: "9 Aug 2026, 9:21 a.m. EDT", ip: "99.245.18.132", done: true },
  { state: "Signed", detail: "Waiting on Marie Tremblay", when: "Not yet", ip: "—", done: false },
  { state: "Completed", detail: "All parties confirmed", when: "Not yet", ip: "—", done: false },
];

/* -------------------------------- fragments ------------------------------- */

function Stepper({ current }: { current: number }) {
  return (
    <ol className="card-soft flex min-w-0 gap-2 overflow-x-auto p-3">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="min-w-0 flex-1">
            <div
              className={`flex min-w-0 items-center gap-2 rounded-xl px-3 py-2 ${
                active ? "bg-navy text-primary-foreground" : done ? "bg-success-soft text-success" : "text-muted-foreground"
              }`}
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-extrabold tnum ${
                  active ? "bg-primary-foreground/20" : done ? "bg-success/15" : "bg-surface-sunk"
                }`}
              >
                {done ? <Check weight="bold" className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
              </span>
              <span className="hidden truncate text-xs font-semibold lg:block">{label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Disclaimer({ doc }: { doc: (typeof docTypes)[number] }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-action-soft p-4 text-sm text-navy">
      <Info weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-action" aria-hidden="true" />
      <p className="min-w-0 leading-relaxed">
        General information, not legal advice. Keyhold prepares this document for your review — you decide what is sent.{" "}
        <a
          href="https://tribunalsontario.ca/ltb/forms/"
          target="_blank"
          rel="noreferrer noopener"
          className="font-semibold text-action underline underline-offset-2"
        >
          {doc.source} — official forms
        </a>{" "}
        <span className="text-muted-foreground">(version dated {longDate(doc.updated)})</span>
      </p>
    </div>
  );
}

function SignaturePad({ onAdopt }: { onAdopt: (v: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [mode, setMode] = useState<"type" | "draw">("type");
  const [typed, setTyped] = useState("Sandra Whitlock");

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.strokeStyle = "#15324A";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const end = () => {
    drawing.current = false;
  };
  const clear = () => {
    const c = canvasRef.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  };

  return (
    <div className="card-soft p-5">
      <p className="font-display text-sm font-bold text-navy">Adopt your signature</p>
      <div className="mt-3 flex gap-2">
        {(["type", "draw"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`min-h-11 rounded-full px-4 text-sm font-semibold ${
              mode === m ? "bg-navy text-primary-foreground" : "border border-border text-navy hover:bg-navy-soft"
            }`}
          >
            {m === "type" ? "Type it" : "Draw it"}
          </button>
        ))}
      </div>

      {mode === "type" ? (
        <div className="mt-4">
          <label htmlFor="sig-name" className="text-xs font-medium text-muted-foreground">
            Your full name
          </label>
          <input
            id="sig-name"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-card px-3 text-base text-navy"
          />
          <p className="mt-4 rounded-xl bg-surface-sunk px-4 py-6 text-center font-display text-2xl italic text-navy">
            {typed || "Your name"}
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <canvas
            ref={canvasRef}
            width={520}
            height={160}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
            className="h-40 w-full touch-none rounded-xl border border-dashed border-border bg-surface-sunk"
            aria-label="Draw your signature"
          />
          <button type="button" onClick={clear} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-action">
            <Trash weight="duotone" className="h-4 w-4" aria-hidden="true" /> Clear
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => onAdopt(mode === "type" ? typed : "Drawn signature")}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90 sm:w-auto"
      >
        <Signature weight="duotone" className="h-5 w-5" aria-hidden="true" /> Adopt and continue
      </button>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Adopting a signature does not send anything. Nothing is final until every party confirms on their own device.
      </p>
    </div>
  );
}

function DocPreview({ doc, showFields }: { doc: (typeof docTypes)[number]; showFields?: boolean }) {
  return (
    <div className="card-soft min-w-0 overflow-hidden p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <p className="truncate font-display text-sm font-bold text-navy">{doc.name}</p>
        <span className="shrink-0 rounded-full bg-navy-soft px-2.5 py-1 text-[11px] font-semibold text-navy">{doc.code}</span>
      </div>
      <div className="relative mt-4 aspect-[3/4] w-full rounded-xl bg-surface-sunk p-5">
        <div className="space-y-2.5">
          <div className="h-3 w-2/5 rounded bg-navy/15" />
          <div className="h-2 w-full rounded bg-navy/10" />
          <div className="h-2 w-11/12 rounded bg-navy/10" />
          <div className="h-2 w-3/4 rounded bg-navy/10" />
          <div className="mt-5 h-2 w-full rounded bg-navy/10" />
          <div className="h-2 w-5/6 rounded bg-navy/10" />
          <div className="h-2 w-2/3 rounded bg-navy/10" />
        </div>
        {showFields
          ? placements.map((p) => (
              <div
                key={p.id}
                style={{ top: p.top, left: p.left }}
                className="absolute w-[36%] rounded-lg border-2 border-dashed border-action bg-action-soft px-2 py-2"
              >
                <p className="truncate text-[10px] font-bold uppercase tracking-wide text-action">{p.label}</p>
                <p className="truncate text-[10px] text-muted-foreground">{p.who}</p>
              </div>
            ))
          : null}
      </div>
    </div>
  );
}

/* --------------------------------- wizard --------------------------------- */

function SignWizard() {
  const [step, setStep] = useState(0);
  const [docId, setDocId] = useState("n1");
  const [signers, setSigners] = useState<Signer[]>(initialSigners);
  const [adopted, setAdopted] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const doc = docTypes.find((d) => d.id === docId)!;
  const lease = leases[0]!;
  const unit = unitById(lease.unitId);
  const province = propertyById(unit.propertyId).province;
  const missing = fields.filter((f) => f.kind === "missing").length;

  const move = (dir: 1 | -1) => setStep((s) => Math.min(steps.length - 1, Math.max(0, s + dir)));

  const moveSigner = (i: number, dir: 1 | -1) =>
    setSigners((list) => {
      const next = [...list];
      const j = i + dir;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  return (
    <>
      <PageHeader
        title="Sign a lease or notice"
        subtitle="Six calm steps. Nothing is sent or final until you say so."
        action={
          <Link
            to="/app/leases"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            <ArrowLeft weight="duotone" className="h-5 w-5" aria-hidden="true" /> Back to leases
          </Link>
        }
      />

      <Stepper current={step} />

      <div className="mt-6 space-y-6">
        {/* Step 1 */}
        {step === 0 ? (
          <section className="space-y-4">
            <div className="card-soft p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-extrabold text-navy">Choose the document</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {unitAddress(lease.unitId)} · tenant {tenantById(lease.tenantId)?.name}
                  </p>
                </div>
                <span className="justify-self-start rounded-full bg-success-soft px-3 py-1.5 text-xs font-semibold text-success sm:justify-self-end">
                  Province set from the property: {province}
                </span>
              </div>
              <ul className="mt-5 grid gap-3 md:grid-cols-2">
                {docTypes.map((d) => {
                  const on = d.id === docId;
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => setDocId(d.id)}
                        aria-pressed={on}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          on ? "border-action bg-action-soft" : "border-border bg-card hover:bg-navy-soft/40"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <FileText weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
                          <div className="min-w-0">
                            <p className="font-display text-sm font-bold text-navy">{d.name}</p>
                            <p className="text-xs text-muted-foreground">{d.code}</p>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.blurb}</p>
                          </div>
                          {on ? <CheckCircle weight="duotone" className="ml-auto h-5 w-5 shrink-0 text-action" aria-hidden="true" /> : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <Disclaimer doc={doc} />
          </section>
        ) : null}

        {/* Step 2 */}
        {step === 1 ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-4">
              <div className="card-soft p-5 sm:p-6">
                <h2 className="font-display text-xl font-extrabold text-navy">Review and fill</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keyhold filled what it could from your records. Read every line — you are the one signing it.
                </p>
                {missing > 0 ? (
                  <p className="mt-4 flex items-center gap-2 rounded-xl bg-warning-soft px-3 py-2.5 text-sm font-semibold text-warning">
                    <Warning weight="duotone" className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {missing} required item still needs you.
                  </p>
                ) : null}
                <ul className="mt-5 space-y-3">
                  {fields.map((f) => (
                    <li
                      key={f.label}
                      className={`relative overflow-hidden rounded-xl border border-border bg-card p-4 pl-5 ${
                        f.kind === "missing" ? "bg-warning-soft/40" : ""
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute inset-y-0 left-0 w-1 ${
                          f.kind === "missing" ? "bg-warning" : f.kind === "draft" ? "bg-action" : "bg-success"
                        }`}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-navy">{f.label}</p>
                        {f.kind === "draft" ? (
                          <span className="rounded-full bg-action-soft px-2 py-0.5 text-[11px] font-semibold text-action">
                            Draft — review wording
                          </span>
                        ) : null}
                        {f.kind === "missing" ? (
                          <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning">Required</span>
                        ) : null}
                      </div>
                      <p className={`mt-1.5 text-base ${f.value ? "text-foreground" : "text-muted-foreground"}`}>
                        {f.value || "Not filled in yet"}
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.plain}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <Disclaimer doc={doc} />
            </div>
            <DocPreview doc={doc} />
          </section>
        ) : null}

        {/* Step 3 */}
        {step === 2 ? (
          <section className="card-soft p-5 sm:p-6">
            <h2 className="font-display text-xl font-extrabold text-navy">Who signs</h2>
            <p className="mt-1 text-sm text-muted-foreground">Signing happens in the order below. Each person signs on their own device.</p>
            <ol className="mt-5 space-y-3">
              {signers.map((s, i) => (
                <li key={s.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy-soft font-display text-sm font-extrabold text-navy tnum">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <label className="text-xs text-muted-foreground" htmlFor={`name-${s.id}`}>
                        {s.role} name
                      </label>
                      <input
                        id={`name-${s.id}`}
                        value={s.name}
                        onChange={(e) =>
                          setSigners((l) => l.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))
                        }
                        className="mt-1 min-h-11 w-full rounded-xl border border-border bg-card px-3 text-base text-navy"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="text-xs text-muted-foreground" htmlFor={`email-${s.id}`}>
                        Email
                      </label>
                      <input
                        id={`email-${s.id}`}
                        type="email"
                        value={s.email}
                        onChange={(e) =>
                          setSigners((l) => l.map((x) => (x.id === s.id ? { ...x, email: e.target.value } : x)))
                        }
                        className="mt-1 min-h-11 w-full rounded-xl border border-border bg-card px-3 text-base text-navy"
                      />
                    </div>
                    <div className="flex gap-2 sm:flex-col">
                      <button
                        type="button"
                        onClick={() => moveSigner(i, -1)}
                        disabled={i === 0}
                        className="min-h-11 rounded-full border border-border px-3 text-xs font-semibold text-navy disabled:opacity-40"
                      >
                        Move up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSigner(i, 1)}
                        disabled={i === signers.length - 1}
                        className="min-h-11 rounded-full border border-border px-3 text-xs font-semibold text-navy disabled:opacity-40"
                      >
                        Move down
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() =>
                setSigners((l) => [...l, { id: `s${l.length + 1}`, name: "", email: "", role: "Tenant" }])
              }
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-navy hover:bg-navy-soft"
            >
              <UserPlus weight="duotone" className="h-5 w-5" aria-hidden="true" /> Add another tenant
            </button>
          </section>
        ) : null}

        {/* Step 4 */}
        {step === 3 ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <DocPreview doc={doc} showFields />
            <div className="min-w-0 space-y-4">
              <div className="card-soft p-5 sm:p-6">
                <h2 className="font-display text-xl font-extrabold text-navy">Where people sign</h2>
                <p className="mt-1 text-sm text-muted-foreground">These fields are placed on the form. Each signer only sees their own.</p>
                <ul className="mt-4 space-y-2">
                  {placements.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 rounded-xl bg-surface-sunk px-3 py-2.5">
                      <PencilSimple weight="duotone" className="h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-navy">{p.label}</span>
                        <span className="block truncate text-xs text-muted-foreground">{p.who}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {adopted ? (
                <div className="card-soft flex items-center gap-3 p-5">
                  <CheckCircle weight="duotone" className="h-6 w-6 shrink-0 text-success" aria-hidden="true" />
                  <p className="min-w-0 text-sm text-navy">
                    Signature adopted as <span className="font-semibold">{adopted}</span>. It is applied only when you confirm.
                  </p>
                </div>
              ) : (
                <SignaturePad onAdopt={setAdopted} />
              )}
            </div>
          </section>
        ) : null}

        {/* Step 5 */}
        {step === 4 ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="card-soft p-5 sm:p-6">
              <h2 className="font-display text-xl font-extrabold text-navy">Send for signature</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Each signer gets an email with a private link. They sign on their phone — no account needed.
              </p>
              <ul className="mt-5 space-y-2">
                {signers.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-3 rounded-xl bg-surface-sunk px-3 py-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-card text-xs font-extrabold text-navy tnum">
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-navy">{s.name || "Unnamed signer"}</span>
                      <span className="block truncate text-xs text-muted-foreground">{s.email}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setSent(true)}
                disabled={sent}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-action px-6 text-base font-semibold text-primary-foreground hover:bg-action/90 disabled:opacity-60"
              >
                <PaperPlaneTilt weight="duotone" className="h-5 w-5" aria-hidden="true" />
                {sent ? "Sent — waiting on signers" : "Send for signature"}
              </button>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Nothing is legally final until every party confirms. Keyhold never signs on anyone's behalf.
              </p>
            </div>

            <div className="card-soft p-5 sm:p-6">
              <h3 className="font-display text-sm font-bold text-navy">Status and audit trail</h3>
              <ol className="mt-4 space-y-4">
                {timeline.map((t) => (
                  <li key={t.state} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                    <span
                      className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                        t.done ? "bg-success-soft text-success" : "bg-surface-sunk text-muted-foreground"
                      }`}
                    >
                      {t.done ? <Check weight="bold" className="h-4 w-4" aria-hidden="true" /> : <Eye weight="duotone" className="h-4 w-4" aria-hidden="true" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy">{t.state}</p>
                      <p className="text-xs text-muted-foreground">{t.detail}</p>
                      <p className="mt-1 text-xs text-muted-foreground tnum">
                        {t.when} · IP {t.ip}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 rounded-xl bg-surface-sunk p-3 text-xs leading-relaxed text-muted-foreground">
                Every event is recorded with the time, the signer and their IP address, and the record is sealed once the document
                completes.
              </p>
            </div>
          </section>
        ) : null}

        {/* Step 6 */}
        {step === 5 ? (
          <section className="card-soft p-6 text-center sm:p-10">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success-soft">
              <CheckCircle weight="duotone" className="h-8 w-8 text-success" aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-2xl font-extrabold text-navy sm:text-3xl">Signed and stored.</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
              {doc.name} for {unitAddress(lease.unitId)} is complete. A copy is in Documents, and every signer received one by email.
            </p>
            <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground tnum">
              <span className="rounded-full bg-surface-sunk px-3 py-1">Rent on file {cad(lease.rent)}</span>
              <span className="rounded-full bg-surface-sunk px-3 py-1">Completed {longDate("2026-08-09")}</span>
            </div>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-action px-6 text-base font-semibold text-primary-foreground hover:bg-action/90"
              >
                <DownloadSimple weight="duotone" className="h-5 w-5" aria-hidden="true" /> Download PDF
              </button>
              <Link
                to="/app/documents"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-card px-6 text-base font-semibold text-navy hover:bg-navy-soft"
              >
                Open Documents
              </Link>
            </div>
          </section>
        ) : null}

        {/* Wizard controls */}
        {step < steps.length - 1 ? (
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => move(-1)}
              disabled={step === 0}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-card px-6 text-base font-semibold text-navy hover:bg-navy-soft disabled:opacity-40"
            >
              <ArrowLeft weight="duotone" className="h-5 w-5" aria-hidden="true" /> Back
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-action px-6 text-base font-semibold text-primary-foreground hover:bg-action/90"
            >
              {step === 4 ? "Finish" : "Continue"} <ArrowRight weight="duotone" className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
