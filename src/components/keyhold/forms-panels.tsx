import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowSquareOut,
  CheckCircle,
  DownloadSimple,
  FloppyDisk,
  Info,
  MagnifyingGlass,
  Signature,
  User,
  Buildings,
  FileText,
  Warning,
} from "@phosphor-icons/react";
import {
  allFields,
  completion,
  firstMissing,
  formCategories,
  formatForPreview,
  formDefinitions,
  isOutdated,
  provinceNames,
  readPath,
  validateField,
  type FormDefinition,
  type FormFieldDef,
} from "@/lib/form-schemas";
import { useForms, signerStatusLabel, type FormDraft, type SignerStatus } from "@/lib/mock-forms";
import { field as fieldCls } from "@/components/keyhold/pipeline";
import { buildPdf, downloadPdf } from "@/lib/pdf-writer";
import { cad, leases, longDate, properties, propertyById, tenants, unitAddress, unitById, rentRows } from "@/lib/mock-data";

/* ------------------------------------------------------------------ guardrails */

export function NotLegalAdvice() {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-border bg-navy-soft/50 px-3 py-2 text-xs text-muted-foreground">
      <Info weight="duotone" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      General information, not legal advice. Keyhold can pre-fill and explain fields — a person must review and confirm
      before anything is generated or served.
    </p>
  );
}

function SourceStrip({ def }: { def: FormDefinition }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span>
        Version <span className="font-semibold text-navy">{def.version}</span>
      </span>
      <span>Effective {longDate(def.effectiveDate)}</span>
      <a
        href={def.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 font-semibold text-action hover:underline"
      >
        Official source <ArrowSquareOut className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </div>
  );
}

function OutdatedBanner({ def }: { def: FormDefinition }) {
  if (!isOutdated(def)) return null;
  return (
    <p className="flex items-start gap-2 rounded-xl border border-maple/40 bg-maple-soft px-3 py-2 text-xs font-semibold text-maple">
      <Warning weight="duotone" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      This copy is version {def.version}. The province has published {def.latestVersion}. Check the official source
      before serving it.
    </p>
  );
}

/* ------------------------------------------------------------------ selection */

type Subject = {
  kind: "tenant" | "lease" | "property";
  id: string;
  label: string;
  province: string;
  prefill: Record<string, unknown>;
};

const landlord = { name: "Keyhold Property Co." };

function buildSubjects(): Subject[] {
  const tenantSubjects: Subject[] = tenants.map((t) => {
    const unit = unitById(t.unitId);
    const property = propertyById(unit.propertyId);
    const lease = leases.find((l) => l.unitId === unit.id);
    const rent = rentRows.find((r) => r.tenantId === t.id);
    return {
      kind: "tenant",
      id: t.id,
      label: `${t.name} — ${unitAddress(t.unitId)}`,
      province: property.province,
      prefill: {
        landlord,
        tenant: t,
        unit: { ...unit, address: unitAddress(unit.id) },
        property,
        lease: lease ? { ...lease, deposit: lease.depositHeld } : { rent: unit.rent },
        rent: rent ?? {},
      },
    };
  });

  const leaseSubjects: Subject[] = leases.map((l) => {
    const unit = unitById(l.unitId);
    const property = propertyById(unit.propertyId);
    const tenant = tenants.find((t) => t.id === l.tenantId);
    return {
      kind: "lease",
      id: l.id,
      label: `${tenant?.name ?? "Tenancy"} — ${unitAddress(l.unitId)} (${l.type})`,
      province: property.province,
      prefill: {
        landlord,
        tenant: tenant ?? {},
        unit: { ...unit, address: unitAddress(unit.id) },
        property,
        lease: { ...l, deposit: l.depositHeld },
        rent: rentRows.find((r) => r.tenantId === l.tenantId) ?? {},
      },
    };
  });

  const propertySubjects: Subject[] = properties.map((p) => ({
    kind: "property",
    id: p.id,
    label: `${p.name} — ${p.address}, ${p.city}`,
    province: p.province,
    prefill: { landlord, property: p, unit: { address: p.address }, lease: {}, tenant: {}, rent: {} },
  }));

  return [...tenantSubjects, ...leaseSubjects, ...propertySubjects];
}

const kindMeta = {
  tenant: { label: "A tenant", Icon: User, help: "Notices and letters aimed at one person." },
  lease: { label: "A lease", Icon: FileText, help: "Anything tied to an existing tenancy agreement." },
  property: { label: "A property", Icon: Buildings, help: "Building-level forms and inspections." },
} as const;

export function FormsPicker({ onOpen }: { onOpen: (def: FormDefinition, subject: Subject) => void }) {
  const subjects = useMemo(buildSubjects, []);
  const [kind, setKind] = useState<Subject["kind"]>("tenant");
  const options = subjects.filter((s) => s.kind === kind);
  const [subjectId, setSubjectId] = useState(options[0]?.id ?? "");
  const subject = options.find((s) => s.id === subjectId) ?? options[0];
  const [override, setOverride] = useState<string | null>(null);
  const province = override ?? subject?.province ?? "ON";
  const [query, setQuery] = useState("");

  const list = formDefinitions
    .filter((d) => d.province === province)
    .filter((d) =>
      query.trim()
        ? `${d.formCode} ${d.title} ${d.description}`.toLowerCase().includes(query.trim().toLowerCase())
        : true,
    );

  return (
    <div className="grid gap-4">
      <div className="card-soft grid gap-4 p-4 sm:p-5">
        <div>
          <p className="font-display text-sm font-bold text-navy">1 · Start from a record</p>
          <p className="text-xs text-muted-foreground">The province is read from the record — you never type it.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(kindMeta) as Subject["kind"][]).map((k) => {
            const meta = kindMeta[k];
            const active = kind === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setKind(k);
                  setSubjectId(subjects.find((s) => s.kind === k)?.id ?? "");
                  setOverride(null);
                }}
                className={`rounded-xl border p-3 text-start ${active ? "border-action bg-action-soft/50" : "border-border hover:bg-navy-soft"}`}
              >
                <span className="flex items-center gap-2 font-display text-sm font-bold text-navy">
                  <meta.Icon weight="duotone" className="h-4 w-4" aria-hidden="true" />
                  {meta.label}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{meta.help}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium" htmlFor="subject">
              Record
            </label>
            <select
              id="subject"
              className={fieldCls}
              value={subject?.id ?? ""}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setOverride(null);
              }}
            >
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="province">
              Province (override)
            </label>
            <select
              id="province"
              className={fieldCls}
              value={province}
              onChange={(e) => setOverride(e.target.value)}
            >
              {Object.keys(provinceNames).map((code) => (
                <option key={code} value={code}>
                  {provinceNames[code]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="inline-flex w-fit items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
          <CheckCircle weight="fill" className="h-3.5 w-3.5" aria-hidden="true" />
          {provinceNames[province] ?? province} — showing {provinceNames[province] ?? province} forms
          {override ? " (overridden)" : ""}
        </p>
      </div>

      <div className="card-soft grid gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-sm font-bold text-navy">2 · Choose the form</p>
            <p className="text-xs text-muted-foreground">Grouped by what you are trying to do.</p>
          </div>
          <label className="relative w-full sm:w-64">
            <span className="sr-only">Search forms</span>
            <MagnifyingGlass
              className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              className={`${fieldCls} ps-9`}
              placeholder="Search by code or name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>

        {list.length === 0 ? (
          <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
            No {provinceNames[province] ?? province} forms are loaded yet. The backend supplies definitions per
            province.
          </p>
        ) : (
          formCategories
            .filter((c) => list.some((d) => d.category === c))
            .map((category) => (
              <section key={category} className="grid gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{category}</h3>
                {list
                  .filter((d) => d.category === category)
                  .map((def) => (
                    <button
                      key={def.formCode}
                      type="button"
                      disabled={!subject}
                      onClick={() => subject && onOpen(def, { ...subject, province })}
                      className="group grid gap-1 rounded-xl border border-border p-3 text-start hover:border-action hover:bg-action-soft/30 disabled:opacity-50"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="kh-tag bg-navy-soft text-navy">{def.formCode}</span>
                        <span className="font-display text-sm font-bold text-navy">{def.title}</span>
                        {isOutdated(def) ? (
                          <span className="kh-tag bg-maple-soft text-maple">Newer version exists</span>
                        ) : null}
                      </span>
                      <span className="text-sm text-muted-foreground">{def.description}</span>
                      <SourceStrip def={def} />
                    </button>
                  ))}
              </section>
            ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ live fill */

function PreviewLine({
  f,
  value,
  focused,
}: {
  f: FormFieldDef;
  value: string;
  focused: boolean;
}) {
  return (
    <div
      id={`pv-${f.id}`}
      className={`grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-3 rounded-md px-2 py-1.5 transition-colors ${
        focused ? "bg-action-soft ring-1 ring-action" : ""
      }`}
    >
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</span>
      <span
        className={`min-h-5 border-b border-dashed border-border text-sm ${
          value ? "font-semibold text-navy" : "text-muted-foreground"
        }`}
      >
        {value ? formatForPreview(f, value) : f.required ? "— required —" : "—"}
      </span>
    </div>
  );
}

export function FormFiller({
  def,
  subject,
  draft,
  onClose,
}: {
  def: FormDefinition;
  subject: Subject;
  draft: FormDraft;
  onClose: () => void;
}) {
  const { saveDraft, updateSigner, recordCertificate, completeDraft } = useForms();
  const [values, setValues] = useState<Record<string, string>>(draft.values);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [focus, setFocus] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [certMethod, setCertMethod] = useState("Handed to the tenant");
  const [certDate, setCertDate] = useState(new Date().toISOString().slice(0, 10));

  const fields = allFields(def);
  const { done, total } = completion(def, values);
  const missing = firstMissing(def, values);
  const errors = Object.fromEntries(
    fields.map((f) => [f.id, touched[f.id] || (values[f.id] ?? "") ? validateField(f, values[f.id] ?? "") : null]),
  );
  const blocking = fields.some((f) => validateField(f, values[f.id] ?? "") !== null);
  const signedAll = draft.signers.every((s) => s.status === "signed");

  const set = (id: string, v: string) => setValues((prev) => ({ ...prev, [id]: v }));

  const jumpToMissing = () => {
    if (!missing) return;
    setFocus(missing.id);
    document.getElementById(`fld-${missing.id}`)?.focus();
    document.getElementById(`pv-${missing.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    if (!focus) return;
    document.getElementById(`pv-${focus}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [focus]);

  const generate = () => {
    completeDraft(draft.id, "You");
    const blob = buildPdf([
      { t: "title", text: `${def.formCode} — ${def.title}` },
      { t: "small", text: `${provinceNames[def.province] ?? def.province} · version ${def.version} · effective ${def.effectiveDate}` },
      { t: "small", text: subject.label },
      { t: "space" },
      ...def.sections.flatMap((s) => [
        { t: "h" as const, text: s.title },
        ...s.fields.map((f) => ({
          t: "field" as const,
          label: f.label,
          value: formatForPreview(f, values[f.id] ?? "") || "—",
        })),
        { t: "space" as const },
      ]),
      { t: "h", text: "Signatures" },
      ...draft.signers.map((s) => ({
        t: "field" as const,
        label: s.role,
        value: s.status === "signed" ? `${s.name || s.signature} · signed` : signerStatusLabel[s.status],
      })),
      ...(def.serviceRequired
        ? [
            { t: "space" as const },
            { t: "h" as const, text: "Certificate of service" },
            { t: "field" as const, label: "Method", value: certMethod },
            { t: "field" as const, label: "Date", value: certDate },
          ]
        : []),
      { t: "rule" },
      { t: "small", text: "General information, not legal advice." },
    ]);
    downloadPdf(blob, `${def.formCode}-${subject.id}.pdf`);
    if (def.serviceRequired) recordCertificate(draft.id, { method: certMethod, date: certDate }, "You");
    toast.success("PDF generated and saved to the tenant and property record.");
  };

  return (
    <div className="grid gap-4">
      <div className="card-soft grid gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2">
              <span className="kh-tag bg-navy-soft text-navy">{def.formCode}</span>
              <span className="font-display text-base font-extrabold text-navy">{def.title}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{subject.label}</p>
            <div className="mt-1">
              <SourceStrip def={def} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            Choose another form
          </button>
        </div>
        <OutdatedBanner def={def} />
        <NotLegalAdvice />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <span className="text-sm font-semibold text-navy tnum">
          {done} of {total} required fields complete
        </span>
        <span className="h-2 min-w-32 flex-1 overflow-hidden rounded-full bg-navy-soft">
          <span
            className="block h-full rounded-full bg-action transition-[width]"
            style={{ width: `${total ? (done / total) * 100 : 100}%` }}
          />
        </span>
        <button
          type="button"
          onClick={jumpToMissing}
          disabled={!missing}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft disabled:opacity-50"
        >
          Jump to next missing <ArrowRight weight="bold" className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => {
            saveDraft(draft.id, values, "You");
            toast.success("Draft saved — you can resume it any time.");
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
        >
          <FloppyDisk weight="duotone" className="h-4 w-4" aria-hidden="true" /> Save draft
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* LEFT — fields */}
        <div className="grid gap-4">
          {def.sections.map((section) => (
            <section key={section.id} className="card-soft grid gap-3 p-4 sm:p-5">
              <h3 className="font-display text-sm font-bold text-navy">{section.title}</h3>
              {section.fields.map((f) => {
                const value = values[f.id] ?? "";
                const err = touched[f.id] ? errors[f.id] : null;
                const isPrefilled = draft.prefilled.includes(f.id) && value === draft.values[f.id];
                const flagged = f.required && !value.trim();
                return (
                  <div key={f.id} className="grid gap-1">
                    <label
                      htmlFor={`fld-${f.id}`}
                      className="flex flex-wrap items-center gap-2 text-sm font-medium text-navy"
                    >
                      {f.label}
                      {f.required ? <span className="text-maple">*</span> : null}
                      {isPrefilled ? (
                        <span className="kh-tag bg-action-soft text-action">from your records</span>
                      ) : null}
                      {flagged ? <span className="kh-tag bg-maple-soft text-maple">Needed</span> : null}
                    </label>
                    {f.type === "textarea" ? (
                      <textarea
                        id={`fld-${f.id}`}
                        rows={3}
                        className={fieldCls}
                        value={value}
                        onFocus={() => setFocus(f.id)}
                        onBlur={() => setTouched((p) => ({ ...p, [f.id]: true }))}
                        onChange={(e) => set(f.id, e.target.value)}
                      />
                    ) : f.type === "select" ? (
                      <select
                        id={`fld-${f.id}`}
                        className={fieldCls}
                        value={value}
                        onFocus={() => setFocus(f.id)}
                        onBlur={() => setTouched((p) => ({ ...p, [f.id]: true }))}
                        onChange={(e) => set(f.id, e.target.value)}
                      >
                        <option value="">Choose…</option>
                        {(f.options ?? []).map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`fld-${f.id}`}
                        type={f.type === "date" ? "date" : "text"}
                        inputMode={f.type === "currency" || f.type === "number" ? "decimal" : undefined}
                        className={`${fieldCls} ${f.type === "currency" ? "tnum" : ""} ${err ? "border-maple" : ""}`}
                        value={value}
                        onFocus={() => setFocus(f.id)}
                        onBlur={() => setTouched((p) => ({ ...p, [f.id]: true }))}
                        onChange={(e) => set(f.id, e.target.value)}
                      />
                    )}
                    <p className="text-xs text-muted-foreground">{f.helpText}</p>
                    {err ? <p className="text-xs font-semibold text-maple">{err}</p> : null}
                  </div>
                );
              })}
            </section>
          ))}
        </div>

        {/* RIGHT — live preview */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="card-soft grid gap-3 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-sm font-bold text-navy">Live preview</h3>
              <span className="text-xs text-muted-foreground">Updates as you type</span>
            </div>
            <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-card p-4">
              <p className="font-display text-sm font-extrabold text-navy">
                {def.formCode} · {def.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {provinceNames[def.province] ?? def.province} · version {def.version}
              </p>
              <div className="mt-3 grid gap-3">
                {def.sections.map((s) => (
                  <div key={s.id} className="grid gap-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{s.title}</p>
                    {s.fields.map((f) => (
                      <PreviewLine key={f.id} f={f} value={values[f.id] ?? ""} focused={focus === f.id} />
                    ))}
                  </div>
                ))}
              </div>
              <p className="mt-4 border-t border-border pt-2 text-[11px] text-muted-foreground">
                General information, not legal advice.
              </p>
            </div>
          </div>
        </div>
      </div>

      <SignAndFinish
        draft={draft}
        def={def}
        onSign={(signerId, patch) => updateSigner(draft.id, signerId, patch, "You")}
      />

      <div className="card-soft grid gap-3 p-4 sm:p-5">
        <h3 className="font-display text-sm font-bold text-navy">Finish</h3>
        {def.serviceRequired ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium" htmlFor="cert-method">
                Certificate of service — method
              </label>
              <select id="cert-method" className={fieldCls} value={certMethod} onChange={(e) => setCertMethod(e.target.value)}>
                {["Handed to the tenant", "Mail", "Placed in mailbox", "Under the door", "Email (consented)"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="cert-date">
                Date served
              </label>
              <input id="cert-date" type="date" className={fieldCls} value={certDate} onChange={(e) => setCertDate(e.target.value)} />
            </div>
          </div>
        ) : null}
        <label className="flex items-start gap-2 text-sm text-navy">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I have reviewed every field and confirm this form is correct. Keyhold does not decide to serve a notice.
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!confirmed || blocking || done < total || !signedAll}
            onClick={generate}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90 disabled:opacity-50"
          >
            <DownloadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> Generate PDF & save a copy
          </button>
          {!signedAll ? (
            <span className="self-center text-xs text-muted-foreground">Every signer must sign first.</span>
          ) : null}
        </div>
      </div>

      <HistoryPanel draft={draft} />
    </div>
  );
}

/* ------------------------------------------------------------------ signing */

const statusTone: Record<SignerStatus, string> = {
  "not-sent": "bg-navy-soft text-navy",
  sent: "bg-action-soft text-action",
  viewed: "bg-warning-soft text-warning",
  signed: "bg-success-soft text-success",
};

function SignaturePad({ onDone }: { onDone: (dataUrl: string) => void }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  return (
    <div className="grid gap-2">
      <canvas
        ref={ref}
        width={480}
        height={140}
        className="w-full touch-none rounded-xl border border-dashed border-border bg-card"
        onPointerDown={(e) => {
          drawing.current = true;
          const ctx = ref.current?.getContext("2d");
          if (!ctx) return;
          const { x, y } = pos(e);
          ctx.beginPath();
          ctx.moveTo(x, y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = ref.current?.getContext("2d");
          if (!ctx) return;
          const { x, y } = pos(e);
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#1e3a5f";
          ctx.lineTo(x, y);
          ctx.stroke();
        }}
        onPointerUp={() => {
          drawing.current = false;
        }}
        onPointerLeave={() => {
          drawing.current = false;
        }}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            const c = ref.current;
            const ctx = c?.getContext("2d");
            if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
          }}
          className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => ref.current && onDone(ref.current.toDataURL())}
          className="min-h-11 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90"
        >
          Use this signature
        </button>
      </div>
    </div>
  );
}

function SignAndFinish({
  draft,
  def,
  onSign,
}: {
  draft: FormDraft;
  def: FormDefinition;
  onSign: (signerId: string, patch: Partial<FormDraft["signers"][number]>) => void;
}) {
  const [openPad, setOpenPad] = useState<string | null>(null);
  const [typed, setTyped] = useState<Record<string, string>>({});

  return (
    <div className="card-soft grid gap-3 p-4 sm:p-5">
      <h3 className="font-display text-sm font-bold text-navy">Sign</h3>
      <p className="text-xs text-muted-foreground">
        {def.signers.length > 1 ? "Every party signs in turn." : "One signature is required on this form."} Type a name
        or draw it.
      </p>
      {draft.signers.map((s) => (
        <div key={s.id} className="grid gap-2 rounded-xl border border-border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-display text-sm font-bold text-navy">
              <Signature weight="duotone" className="h-4 w-4" aria-hidden="true" />
              {s.label}
            </span>
            <span className={`kh-tag ${statusTone[s.status]}`}>{signerStatusLabel[s.status]}</span>
          </div>
          {s.status === "signed" ? (
            <p className="text-xs text-muted-foreground">
              {s.mode === "drawn" ? "Drawn signature" : `Typed as “${s.signature}”`} ·{" "}
              {s.signedAt ? new Date(s.signedAt).toLocaleString("en-CA") : ""}
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <input
                className={fieldCls}
                placeholder="Type full name to sign"
                value={typed[s.id] ?? ""}
                onChange={(e) => setTyped((p) => ({ ...p, [s.id]: e.target.value }))}
              />
              <button
                type="button"
                disabled={!(typed[s.id] ?? "").trim()}
                onClick={() =>
                  onSign(s.id, {
                    name: typed[s.id] ?? "",
                    signature: typed[s.id] ?? "",
                    mode: "typed",
                    status: "signed",
                    signedAt: new Date().toISOString(),
                  })
                }
                className="min-h-11 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90 disabled:opacity-50"
              >
                Sign
              </button>
              <button
                type="button"
                onClick={() => setOpenPad(openPad === s.id ? null : s.id)}
                className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
              >
                {openPad === s.id ? "Hide pad" : "Draw instead"}
              </button>
            </div>
          )}
          {openPad === s.id && s.status !== "signed" ? (
            <SignaturePad
              onDone={(dataUrl) => {
                onSign(s.id, {
                  name: s.role,
                  signature: dataUrl,
                  mode: "drawn",
                  status: "signed",
                  signedAt: new Date().toISOString(),
                });
                setOpenPad(null);
              }}
            />
          ) : null}
          {s.status === "not-sent" ? (
            <button
              type="button"
              onClick={() => onSign(s.id, { status: "sent" })}
              className="w-fit text-xs font-semibold text-action hover:underline"
            >
              Send for signature instead
            </button>
          ) : null}
          {s.status === "sent" ? (
            <button
              type="button"
              onClick={() => onSign(s.id, { status: "viewed" })}
              className="w-fit text-xs font-semibold text-action hover:underline"
            >
              Mark as viewed
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ history */

export function HistoryPanel({ draft }: { draft: FormDraft }) {
  return (
    <div className="card-soft grid gap-2 p-4 sm:p-5">
      <h3 className="font-display text-sm font-bold text-navy">History</h3>
      <ol className="grid gap-2">
        {draft.history.map((h) => (
          <li key={h.id} className="grid gap-0.5 border-s-2 border-border ps-3 text-sm">
            <span className="text-navy">{h.what}</span>
            <span className="text-xs text-muted-foreground">
              {h.who} · {new Date(h.at).toLocaleString("en-CA")}
            </span>
          </li>
        ))}
      </ol>
      {draft.certificate ? (
        <p className="text-xs text-muted-foreground">
          Certificate of service: {draft.certificate.method} on {longDate(draft.certificate.date)}
        </p>
      ) : null}
    </div>
  );
}

export function DraftsTable({ onResume }: { onResume: (draft: FormDraft) => void }) {
  const { drafts } = useForms();
  if (drafts.length === 0) return null;
  return (
    <div className="card-soft grid gap-2 p-4 sm:p-5">
      <h3 className="font-display text-sm font-bold text-navy">Saved drafts & completed forms</h3>
      <ul className="grid gap-2">
        {drafts.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3">
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span className="kh-tag bg-navy-soft text-navy">{d.formCode}</span>
                <span className="font-display text-sm font-bold text-navy">{d.title}</span>
                <span className={`kh-tag ${d.status === "completed" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
                  {d.status === "completed" ? "Completed" : "Draft"}
                </span>
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {d.subjectLabel} · version {d.version} · updated {new Date(d.updatedAt).toLocaleString("en-CA")}
              </span>
            </span>
            <button
              type="button"
              onClick={() => onResume(d)}
              className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
            >
              {d.status === "completed" ? "View history" : "Resume"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* helpers exported for the route */
export type { Subject };
export function prefillFor(def: FormDefinition, subject: Subject) {
  const values: Record<string, string> = {};
  const prefilled: string[] = [];
  for (const f of allFields(def)) {
    const v = readPath(subject.prefill, f.prefillPath);
    if (v) {
      values[f.id] = f.type === "currency" ? String(Number(v)) : v;
      prefilled.push(f.id);
    }
  }
  return { values, prefilled };
}

export const cadHint = cad;
