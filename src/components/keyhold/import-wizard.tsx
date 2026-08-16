/**
 * IMPORT WIZARD — upload → map columns → fix rows → summary.
 * Presentation only: every rule lives in @/lib/import-engine.
 */
import { useMemo, useRef, useState } from "react";
import {
  UploadSimple,
  DownloadSimple,
  CheckCircle,
  WarningCircle,
  Warning,
  ArrowCounterClockwise,
  Paperclip,
  X,
  ArrowRight,
  ArrowLeft,
  Table as TableIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  ENTITIES,
  ENTITY_ORDER,
  acceptedRows,
  autoMap,
  countIssues,
  parseDelimited,
  prepareRows,
  revalidate,
  templateCsv,
  toSheet,
  type EntityKey,
  type Mapping,
  type ParsedSheet,
  type PreparedRow,
} from "@/lib/import-engine";
import { useSetup, type ImportBatch } from "@/lib/mock-onboarding";
import { downloadFile } from "@/lib/rent-engine";

const STEPS = ["Upload", "Map columns", "Check rows", "Summary"] as const;

const pill =
  "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors";
const primary = `${pill} bg-action text-primary-foreground hover:bg-action/90 disabled:opacity-50`;
const ghost = `${pill} border border-border text-navy hover:bg-navy-soft`;

export function ImportWizard({ initialEntity = "properties" }: { initialEntity?: EntityKey }) {
  const { recordImport, undoImport, batches, markDone } = useSetup();
  const [entity, setEntity] = useState<EntityKey>(initialEntity);
  const [step, setStep] = useState(0);
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<Mapping>({});
  const [rows, setRows] = useState<PreparedRow[]>([]);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const def = ENTITIES[entity];
  const supportsDocs = entity === "tenants" || entity === "leases";
  const tally = useMemo(() => countIssues(rows), [rows]);

  const reset = () => {
    setSheet(null);
    setFileName("");
    setRows([]);
    setAttachments([]);
    setBatch(null);
    setError(null);
    setStep(0);
  };

  async function readFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      let matrix: string[][];
      if (/\.(xlsx|xls)$/i.test(file.name)) {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
        const first = wb.SheetNames[0];
        if (!first) throw new Error("That workbook has no sheets in it.");
        const ws = wb.Sheets[first];
        matrix = XLSX.utils.sheet_to_json(ws!, { header: 1, raw: false, defval: "" }) as string[][];
        matrix = matrix.map((r) => r.map((c) => String(c ?? "").trim())).filter((r) => r.some(Boolean));
      } else {
        matrix = parseDelimited(await file.text());
      }
      if (matrix.length < 2) throw new Error("We need a header row plus at least one row of data.");
      const parsed = toSheet(matrix);
      const map = autoMap(parsed.headers, def.fields);
      setSheet(parsed);
      setFileName(file.name);
      setMapping(map);
      setRows(prepareRows(entity, parsed.rows, map));
      setStep(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't read that file.");
    } finally {
      setBusy(false);
    }
  }

  const remap = (fieldKey: string, col: number | null) => {
    const next: Mapping = { ...mapping };
    // one column per field
    for (const k of Object.keys(next)) if (col != null && next[k] === col) next[k] = null;
    next[fieldKey] = col;
    setMapping(next);
    if (sheet) setRows(prepareRows(entity, sheet.rows, next));
  };

  const editCell = (n: number, field: string, value: string) => {
    setRows((rs) =>
      revalidate(entity, rs.map((r) => (r.n === n ? { ...r, values: { ...r.values, [field]: value } } : r))),
    );
  };
  const toggleSkip = (n: number) =>
    setRows((rs) => rs.map((r) => (r.n === n ? { ...r, skipped: !r.skipped } : r)));
  const skipAllBroken = () =>
    setRows((rs) => rs.map((r) => (r.issues.some((i) => i.level === "error") ? { ...r, skipped: true } : r)));

  const runImport = () => {
    const accepted = acceptedRows(rows);
    if (!accepted.length) {
      toast.error("Nothing to import yet — fix or skip the rows with errors.");
      return;
    }
    const b = recordImport({ entity, fileName, rows, accepted, attachments });
    setBatch(b);
    if (entity === "tenants") markDone("tenants");
    if (entity === "properties" || entity === "units") markDone("property");
    setStep(3);
    toast.success(`Imported ${accepted.length} ${accepted.length === 1 ? def.singular : def.label.toLowerCase()}.`);
  };

  const requiredUnmapped = def.fields.filter((fd) => fd.required && mapping[fd.key] == null);

  return (
    <div className="space-y-4">
      <Stepper step={step} />

      {step === 0 && (
        <section className="card-soft rounded-2xl border border-border p-4">
          <h2 className="font-display text-base font-bold text-navy">What are you bringing over?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start with properties, then units, then people. Each one is a separate file.
          </p>

          <div role="radiogroup" aria-label="What to import" className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ENTITY_ORDER.map((k) => {
              const e = ENTITIES[k];
              const on = k === entity;
              return (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    setEntity(k);
                    reset();
                  }}
                  className={`min-h-11 rounded-xl border p-3 text-left ${
                    on ? "border-action bg-action-soft/40" : "border-border hover:bg-navy-soft"
                  }`}
                >
                  <span className="block text-sm font-semibold text-navy">{e.label}</span>
                  <span className="block text-xs text-muted-foreground">{e.blurb}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-sm font-semibold text-navy">Don't have a file ready?</p>
            <p className="text-xs text-muted-foreground">
              Download our template, fill it in, and upload it back. It already has the right headers.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ENTITY_ORDER.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    downloadFile(`keyhold-${k}-template.csv`, templateCsv(k));
                    toast.success(`${ENTITIES[k].label} template downloaded.`);
                  }}
                  className={ghost}
                >
                  <DownloadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" />
                  {ENTITIES[k].label}
                </button>
              ))}
            </div>
          </div>

          <label className="mt-4 block cursor-pointer rounded-2xl border border-dashed border-border p-6 text-center hover:bg-navy-soft/40">
            <input
              ref={fileInput}
              type="file"
              accept=".csv,.tsv,.txt,.xlsx,.xls"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void readFile(file);
                e.target.value = "";
              }}
            />
            <UploadSimple weight="duotone" className="mx-auto h-7 w-7 text-navy" aria-hidden="true" />
            <span className="mt-2 block text-sm font-semibold text-navy">
              {busy ? "Reading your file…" : `Upload your ${def.label.toLowerCase()} file`}
            </span>
            <span className="block text-xs text-muted-foreground">CSV or Excel (.xlsx), up to a few thousand rows.</span>
          </label>

          {error && (
            <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-danger bg-danger-soft/40 p-3 text-sm text-navy">
              <WarningCircle weight="duotone" className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
              {error}
            </p>
          )}

          <ImportHistory batches={batches} onUndo={undoImport} />
        </section>
      )}

      {step === 1 && sheet && (
        <section className="card-soft rounded-2xl border border-border p-4">
          <h2 className="font-display text-base font-bold text-navy">Match your columns to ours</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We guessed from your headers in <span className="font-medium text-navy">{fileName}</span>. Change anything
            that looks off.
          </p>

          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {def.fields.map((fd) => {
              const col = mapping[fd.key] ?? null;
              return (
                <li key={fd.key} className="rounded-xl border border-border p-3">
                  <label className="block text-sm">
                    <span className="font-semibold text-navy">
                      {fd.label}
                      {fd.required && <span className="text-danger"> *</span>}
                    </span>
                    {fd.hint && <span className="block text-xs text-muted-foreground">{fd.hint}</span>}
                    <select
                      value={col == null ? "" : String(col)}
                      onChange={(e) => remap(fd.key, e.target.value === "" ? null : Number(e.target.value))}
                      className="mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Don't import this</option>
                      {sheet.headers.map((h, i) => (
                        <option key={`${h}-${i}`} value={i}>
                          {h || `Column ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>
                  {col != null && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      e.g. {sheet.rows[0]?.[col] || "—"}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          <h3 className="mt-4 flex items-center gap-2 text-sm font-semibold text-navy">
            <TableIcon weight="duotone" className="h-4 w-4" aria-hidden="true" /> First 5 rows, as we'd read them
          </h3>
          <div className="mt-2 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <caption className="sr-only">Preview of the first five rows using your column mapping</caption>
              <thead className="bg-muted/40">
                <tr>
                  {def.fields.map((fd) => (
                    <th key={fd.key} scope="col" className="whitespace-nowrap px-3 py-2 text-left font-semibold text-navy">
                      {fd.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((r) => (
                  <tr key={r.n} className="border-t border-border">
                    {def.fields.map((fd) => (
                      <td key={fd.key} className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {r.values[fd.key] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {requiredUnmapped.length > 0 && (
            <p role="alert" className="mt-3 text-sm text-danger">
              Still needed: {requiredUnmapped.map((x) => x.label).join(", ")}.
            </p>
          )}

          <div className="mt-4 flex flex-wrap justify-between gap-2">
            <button type="button" className={ghost} onClick={reset}>
              <ArrowLeft weight="duotone" className="h-4 w-4" aria-hidden="true" /> Use a different file
            </button>
            <button
              type="button"
              className={primary}
              disabled={requiredUnmapped.length > 0}
              onClick={() => setStep(2)}
            >
              Check {rows.length} rows <ArrowRight weight="duotone" className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="card-soft rounded-2xl border border-border p-4">
          <h2 className="font-display text-base font-bold text-navy">Let's check the rows</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fix anything inline, or skip a row and keep the rest. Nothing is created until you press import.
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Tally tone="ok" label={`${tally.ready} ready`} />
            <Tally tone="danger" label={`${tally.errors} need fixing`} />
            <Tally tone="warn" label={`${tally.warnings} with warnings`} />
            <Tally tone="mute" label={`${tally.skipped} skipped`} />
            {tally.errors > 0 && (
              <button type="button" onClick={skipAllBroken} className="text-sm font-semibold text-action underline">
                Skip all rows with errors
              </button>
            )}
          </div>

          <ul className="mt-3 space-y-2">
            {rows.map((r) => {
              const errs = r.issues.filter((i) => i.level === "error");
              const warns = r.issues.filter((i) => i.level === "warning");
              const tone = r.skipped
                ? "border-border opacity-60"
                : errs.length
                  ? "border-danger bg-danger-soft/20"
                  : warns.length
                    ? "border-warning bg-warning-soft/20"
                    : "border-border";
              return (
                <li key={r.n} className={`rounded-xl border p-3 ${tone}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="tnum text-xs font-semibold text-muted-foreground">Row {r.n}</span>
                    <button
                      type="button"
                      onClick={() => toggleSkip(r.n)}
                      className="min-h-11 text-sm font-semibold text-action underline"
                    >
                      {r.skipped ? "Include this row" : "Skip this row"}
                    </button>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {def.fields.map((fd) => {
                      const issue = r.issues.find((i) => i.field === fd.key);
                      return (
                        <label key={fd.key} className="block text-xs">
                          <span className="text-muted-foreground">{fd.label}</span>
                          <input
                            value={r.values[fd.key] ?? ""}
                            onChange={(e) => editCell(r.n, fd.key, e.target.value)}
                            disabled={r.skipped}
                            aria-invalid={issue?.level === "error"}
                            className={`mt-0.5 min-h-11 w-full rounded-xl border bg-background px-3 text-sm ${
                              issue?.level === "error" ? "border-danger" : "border-input"
                            }`}
                          />
                          {issue && (
                            <span className={issue.level === "error" ? "text-danger" : "text-warning-strong"}>
                              {issue.message}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>

          {supportsDocs && (
            <div className="mt-4 rounded-xl border border-border p-3">
              <p className="text-sm font-semibold text-navy">Bring their current lease PDFs</p>
              <p className="text-xs text-muted-foreground">
                We'll file each PDF against the matching tenant by name, and keep the rest in Documents.
              </p>
              <label className="mt-2 inline-flex cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    const names = Array.from(e.target.files ?? []).map((f) => f.name);
                    if (names.length) setAttachments((a) => [...a, ...names]);
                    e.target.value = "";
                  }}
                />
                <span className={ghost}>
                  <Paperclip weight="duotone" className="h-4 w-4" aria-hidden="true" /> Attach lease PDFs
                </span>
              </label>
              {attachments.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {attachments.map((a, i) => (
                    <li key={`${a}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                      {a}
                      <button
                        type="button"
                        aria-label={`Remove ${a}`}
                        onClick={() => setAttachments((list) => list.filter((_, j) => j !== i))}
                        className="grid h-5 w-5 place-items-center rounded-full hover:bg-navy-soft"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap justify-between gap-2">
            <button type="button" className={ghost} onClick={() => setStep(1)}>
              <ArrowLeft weight="duotone" className="h-4 w-4" aria-hidden="true" /> Back to mapping
            </button>
            <button type="button" className={primary} onClick={runImport} disabled={tally.ready === 0}>
              Import {tally.ready} {tally.ready === 1 ? def.singular : def.label.toLowerCase()}
            </button>
          </div>
        </section>
      )}

      {step === 3 && batch && (
        <section className="card-soft rounded-2xl border border-border p-4">
          <div className="flex items-start gap-3">
            <CheckCircle weight="duotone" className="mt-0.5 h-6 w-6 text-success" aria-hidden="true" />
            <div>
              <h2 className="font-display text-base font-bold text-navy">Import finished</h2>
              <p className="text-sm text-muted-foreground">
                From <span className="font-medium text-navy">{batch.fileName}</span>
              </p>
            </div>
          </div>

          <dl className="mt-3 grid gap-2 sm:grid-cols-3">
            <Stat label={`${ENTITIES[batch.entity].label} created`} value={batch.created} />
            <Stat label="Rows skipped" value={batch.skipped} />
            <Stat label="Rows with errors" value={batch.failed} />
          </dl>
          {batch.attachments.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {batch.attachments.length} lease {batch.attachments.length === 1 ? "PDF" : "PDFs"} filed in Documents.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={primary} onClick={reset}>
              Import something else
            </button>
            <button
              type="button"
              className={ghost}
              disabled={batch.undone}
              onClick={() => {
                undoImport(batch.id);
                setBatch({ ...batch, undone: true });
                toast.success("Import rolled back. Nothing from that file remains.");
              }}
            >
              <ArrowCounterClockwise weight="duotone" className="h-4 w-4" aria-hidden="true" />
              {batch.undone ? "Rolled back" : "Undo this import"}
            </button>
          </div>

          <ImportHistory batches={batches} onUndo={undoImport} />
        </section>
      )}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex flex-wrap gap-2" aria-label="Import steps">
      {STEPS.map((label, i) => (
        <li
          key={label}
          aria-current={i === step ? "step" : undefined}
          className={`tnum rounded-full border px-3 py-1.5 text-xs font-semibold ${
            i === step
              ? "border-action bg-action text-primary-foreground"
              : i < step
                ? "border-success bg-success-soft/40 text-navy"
                : "border-border text-muted-foreground"
          }`}
        >
          {i + 1}. {label}
        </li>
      ))}
    </ol>
  );
}

function Tally({ tone, label }: { tone: "ok" | "danger" | "warn" | "mute"; label: string }) {
  const cls = {
    ok: "border-success text-navy bg-success-soft/30",
    danger: "border-danger text-navy bg-danger-soft/30",
    warn: "border-warning text-navy bg-warning-soft/30",
    mute: "border-border text-muted-foreground",
  }[tone];
  return <span className={`tnum rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="tnum font-display text-xl font-bold text-navy">{value}</dd>
    </div>
  );
}

function ImportHistory({ batches, onUndo }: { batches: ImportBatch[]; onUndo: (id: string) => void }) {
  if (!batches.length) return null;
  return (
    <div className="mt-5 border-t border-border pt-4">
      <h3 className="text-sm font-semibold text-navy">Recent imports</h3>
      <ul className="mt-2 space-y-2">
        {batches.map((b, i) => (
          <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3">
            <span className="text-sm">
              <span className="font-semibold text-navy">{b.fileName}</span>
              <span className="tnum block text-xs text-muted-foreground">
                {b.created} {ENTITIES[b.entity].label.toLowerCase()} · {new Date(b.at).toLocaleString("en-CA")}
                {b.undone && " · rolled back"}
              </span>
            </span>
            {i === 0 && !b.undone ? (
              <button
                type="button"
                onClick={() => {
                  onUndo(b.id);
                  toast.success("Import rolled back.");
                }}
                className="min-h-11 text-sm font-semibold text-action underline"
              >
                Undo
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                {b.undone ? <ArrowCounterClockwise className="h-3.5 w-3.5" aria-hidden="true" /> : <Warning className="h-3.5 w-3.5" aria-hidden="true" />}
                {b.undone ? "Rolled back" : "Only the newest import can be undone"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
