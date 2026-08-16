/**
 * Inspections UI — template builder, mobile-first conducting flow, side-by-side
 * move-in/move-out compare, and signing + PDF export. Reads and writes the
 * mock operations store only; no business logic lives here beyond formatting.
 */
import { useMemo, useRef, useState } from "react";
import {
  ClipboardText,
  Plus,
  Camera,
  Trash,
  CheckCircle,
  PencilSimple,
  ArrowLeft,
  ArrowsLeftRight,
  FilePdf,
  Signature as SignatureIcon,
  Image as ImageIcon,
  Warning,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataList, type Column } from "@/components/keyhold/data-list";
import { EmptyState } from "@/components/keyhold/empty-state";
import { StatusLabel } from "@/components/keyhold/status";
import { buildPdf, downloadPdf, type PdfLine } from "@/lib/pdf-writer";
import { longDate, units, propertyById } from "@/lib/mock-data";
import {
  conditionMeta,
  flattenItems,
  resultSummary,
  tenantName,
  unitLabel,
  useOperations,
  type Condition,
  type Inspection,
  type InspectionTemplate,
  type ItemResult,
  type ResponseType,
  type TemplateSection,
} from "@/lib/mock-operations";

const btn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors";
const primary = `${btn} bg-action text-primary-foreground hover:bg-action/90`;
const ghost = `${btn} border border-border text-navy hover:bg-navy-soft`;
const field =
  "min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action";

const conditions: Condition[] = ["excellent", "good", "fair", "damaged", "na"];

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

type Tab = "inspections" | "templates" | "compare";

export function InspectionsScreen() {
  const [tab, setTab] = useState<Tab>("inspections");
  const [openId, setOpenId] = useState<string | null>(null);
  const { inspections } = useOperations();
  const active = inspections.find((i) => i.id === openId) ?? null;

  if (active) return <ConductInspection inspection={active} onBack={() => setOpenId(null)} />;

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Inspections views" className="flex flex-wrap gap-2">
        {(
          [
            ["inspections", "Inspections"],
            ["templates", "Templates"],
            ["compare", "Compare move-in / move-out"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`${btn} px-4 text-xs ${
              tab === key ? "bg-navy text-primary-foreground" : "border border-border text-navy hover:bg-navy-soft"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "inspections" && <InspectionList onOpen={setOpenId} />}
      {tab === "templates" && <TemplateBuilder />}
      {tab === "compare" && <ComparePanel />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* List + start                                                        */
/* ------------------------------------------------------------------ */

function InspectionList({ onOpen }: { onOpen: (id: string) => void }) {
  const { inspections, templates, startInspection, deleteInspection } = useOperations();
  const [starting, setStarting] = useState(false);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");

  const columns: Column<Inspection>[] = [
    {
      key: "name",
      label: "Inspection",
      locked: true,
      value: (i) => i.name,
      render: (i) => (
        <span className="flex min-w-0 items-center gap-2">
          <ClipboardText weight="duotone" className="h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
          <span className="truncate font-semibold text-navy">{i.name}</span>
        </span>
      ),
    },
    { key: "unit", label: "Unit", value: (i) => unitLabel(i.unitId) },
    { key: "tenant", label: "Tenant", value: (i) => tenantName(i.tenantId) },
    {
      key: "started",
      label: "Started",
      value: (i) => i.startedOn,
      render: (i) => <span className="tnum">{longDate(i.startedOn)}</span>,
    },
    {
      key: "signed",
      label: "Signatures",
      value: (i) => i.signatures.length,
      render: (i) => <span className="tnum">{i.signatures.length} of 2</span>,
    },
  ];

  return (
    <>
      <DataList
        name="Inspections"
        items={inspections}
        getId={(i) => i.id}
        columns={columns}
        getStatus={(i) => i.status}
        searchPlaceholder="Search by unit, tenant or template"
        filters={[
          {
            key: "kind",
            label: "Type",
            options: [
              { value: "move-in", label: "Move-in" },
              { value: "move-out", label: "Move-out" },
              { value: "custom", label: "Custom" },
            ],
            match: (i, v) => i.kind === v,
          },
          {
            key: "status",
            label: "Status",
            options: [
              { value: "in-progress", label: "In progress" },
              { value: "completed", label: "Completed" },
            ],
            match: (i, v) => i.status === v,
          },
        ]}
        dateOf={(i) => i.startedOn}
        rowActions={[
          { key: "open", label: "Open inspection", Icon: PencilSimple, onSelect: (i) => onOpen(i.id) },
          {
            key: "delete",
            label: "Delete",
            Icon: Trash,
            destructive: true,
            confirm: (i) => `Deleting the ${i.name.toLowerCase()} for ${unitLabel(i.unitId)} removes its photos and signatures.`,
            onSelect: (i) => {
              deleteInspection(i.id);
              toast.success("Inspection deleted");
            },
          },
        ]}
        emptyIcon={ClipboardText}
        emptyTitle="No inspections yet"
        emptyBody="Start with a move-in inspection so you have a record before anyone unpacks."
        emptyAction={
          <button type="button" className={primary} onClick={() => setStarting(true)}>
            <Plus weight="bold" className="h-4 w-4" aria-hidden="true" />
            Start an inspection
          </button>
        }
        toolbarExtra={
          <button type="button" className={`${primary} px-4 text-xs`} onClick={() => setStarting(true)}>
            <Plus weight="bold" className="h-4 w-4" aria-hidden="true" />
            New inspection
          </button>
        }
      />

      <Dialog open={starting} onOpenChange={setStarting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start an inspection</DialogTitle>
            <DialogDescription>Pick a template and the unit you're walking through.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-navy">
              Template
              <select className={`${field} mt-1`} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-navy">
              Unit
              <select className={`${field} mt-1`} value={unitId} onChange={(e) => setUnitId(e.target.value)}>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {propertyById(u.propertyId).address} · {u.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <DialogFooter>
            <button type="button" className={ghost} onClick={() => setStarting(false)}>
              Cancel
            </button>
            <button
              type="button"
              className={primary}
              onClick={() => {
                if (!templateId || !unitId) return;
                const created = startInspection({ templateId, unitId, inspector: "Mr. J (you)" });
                setStarting(false);
                onOpen(created.id);
              }}
            >
              Start
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Conduct                                                             */
/* ------------------------------------------------------------------ */

function PhotoStrip({ photos, onRemove }: { photos: string[]; onRemove?: (src: string) => void }) {
  if (!photos.length) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {photos.map((src) => (
        <li key={src} className="relative">
          {src.startsWith("blob:") ? (
            <img src={src} alt="Inspection photo" className="h-20 w-20 rounded-xl border border-border object-cover" />
          ) : (
            <span className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-navy-soft px-1 text-center text-[10px] font-semibold text-navy">
              <ImageIcon weight="duotone" className="h-5 w-5" aria-hidden="true" />
              {src}
            </span>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(src)}
              aria-label="Remove photo"
              className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-maple"
            >
              <Trash weight="bold" className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function ItemRow({
  inspectionId,
  itemId,
  label,
  response,
  photoRequired,
  result,
  readOnly,
}: {
  inspectionId: string;
  itemId: string;
  label: string;
  response: ResponseType;
  photoRequired: boolean;
  result: ItemResult | undefined;
  readOnly: boolean;
}) {
  const { updateResult } = useOperations();
  const fileRef = useRef<HTMLInputElement>(null);
  const photos = result?.photos ?? [];
  const missingPhoto = photoRequired && photos.length === 0;

  return (
    <li className="rounded-2xl border border-border bg-card p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-semibold text-navy">
          {label}
          {photoRequired && <span className="ml-2 text-xs font-medium text-muted-foreground">photo required</span>}
        </p>
        {missingPhoto && (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-1 text-[11px] font-semibold text-warning">
            <Warning weight="duotone" className="h-3.5 w-3.5" aria-hidden="true" />
            Needs a photo
          </span>
        )}
      </div>

      <div className="mt-2">
        {response === "condition" && (
          <div className="flex flex-wrap gap-2" role="group" aria-label={`${label} condition`}>
            {conditions.map((c) => {
              const on = result?.condition === c;
              return (
                <button
                  key={c}
                  type="button"
                  disabled={readOnly}
                  aria-pressed={on}
                  onClick={() => updateResult(inspectionId, itemId, { condition: c })}
                  className={`min-h-9 rounded-full px-3 text-xs font-semibold transition-colors disabled:opacity-60 ${
                    on ? conditionMeta[c].tone : "border border-border text-navy hover:bg-navy-soft"
                  }`}
                >
                  {conditionMeta[c].label}
                </button>
              );
            })}
          </div>
        )}

        {response === "yes-no" && (
          <div className="flex gap-2" role="group" aria-label={label}>
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                disabled={readOnly}
                aria-pressed={result?.yesNo === v}
                onClick={() => updateResult(inspectionId, itemId, { yesNo: v })}
                className={`min-h-9 rounded-full px-4 text-xs font-semibold disabled:opacity-60 ${
                  result?.yesNo === v
                    ? v
                      ? "bg-success-soft text-success"
                      : "bg-maple-soft text-maple"
                    : "border border-border text-navy hover:bg-navy-soft"
                }`}
              >
                {v ? "Yes" : "No"}
              </button>
            ))}
          </div>
        )}

        {response === "text" && (
          <textarea
            rows={2}
            disabled={readOnly}
            value={result?.text ?? ""}
            onChange={(e) => updateResult(inspectionId, itemId, { text: e.target.value })}
            placeholder="Type what you see"
            className="w-full rounded-xl border border-border bg-card p-3 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
          />
        )}
      </div>

      {!readOnly && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" className={`${ghost} min-h-9 px-3 text-xs`} onClick={() => fileRef.current?.click()}>
            <Camera weight="duotone" className="h-4 w-4" aria-hidden="true" />
            Add photo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="sr-only"
            aria-label={`Add a photo for ${label}`}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (!files.length) return;
              updateResult(inspectionId, itemId, {
                photos: [...photos, ...files.map((f) => URL.createObjectURL(f))],
              });
              e.target.value = "";
            }}
          />
          <input
            value={result?.note ?? ""}
            onChange={(e) => updateResult(inspectionId, itemId, { note: e.target.value })}
            placeholder="Note (optional)"
            aria-label={`Note for ${label}`}
            className={`${field} min-h-9 flex-1 basis-48`}
          />
        </div>
      )}

      {readOnly && result?.note ? <p className="mt-2 text-xs text-muted-foreground">{result.note}</p> : null}

      <PhotoStrip
        photos={photos}
        {...(readOnly
          ? {}
          : {
              onRemove: (src: string) =>
                updateResult(inspectionId, itemId, { photos: photos.filter((p) => p !== src) }),
            })}
      />
    </li>
  );
}

function ConductInspection({ inspection, onBack }: { inspection: Inspection; onBack: () => void }) {
  const { templates, signInspection, completeInspection } = useOperations();
  const tpl = templates.find((t) => t.id === inspection.templateId);
  const [signer, setSigner] = useState("");
  const readOnly = inspection.status === "completed";

  const flat = tpl ? flattenItems(tpl) : [];
  const recorded = flat.filter(({ item }) => {
    const r = inspection.results[item.id];
    if (!r) return false;
    if (item.response === "condition") return Boolean(r.condition);
    if (item.response === "yes-no") return r.yesNo !== undefined;
    if (item.response === "text") return Boolean(r.text?.trim());
    return r.photos.length > 0;
  }).length;
  const missingPhotos = flat.filter(({ item }) => item.photoRequired && !(inspection.results[item.id]?.photos.length)).length;

  if (!tpl) {
    return <EmptyState Icon={Warning} title="Template missing" body="This inspection points at a template that no longer exists." />;
  }

  function exportPdf() {
    const lines: PdfLine[] = [
      { t: "title", text: inspection.name },
      { t: "field", label: "Unit", value: unitLabel(inspection.unitId) },
      { t: "field", label: "Tenant", value: tenantName(inspection.tenantId) },
      { t: "field", label: "Inspector", value: inspection.inspector },
      { t: "field", label: "Date", value: longDate(inspection.startedOn) },
      { t: "rule" },
    ];
    tpl!.sections.forEach((s) => {
      lines.push({ t: "h", text: s.name });
      s.items.forEach((i) => {
        const r = inspection.results[i.id];
        lines.push({ t: "field", label: i.label, value: resultSummary(r, i.response) });
        if (r?.note) lines.push({ t: "small", text: `Note: ${r.note}` });
        if (r?.photos.length) lines.push({ t: "small", text: `${r.photos.length} photo(s) attached` });
      });
      lines.push({ t: "space" });
    });
    lines.push({ t: "rule" }, { t: "h", text: "Signatures" });
    inspection.signatures.forEach((s) => lines.push({ t: "field", label: s.role, value: `${s.name} — ${longDate(s.signedOn)}` }));
    if (!inspection.signatures.length) lines.push({ t: "small", text: "Not yet signed." });
    lines.push({ t: "small", text: "General information, not legal advice." });

    const fileName = `${inspection.name} — ${unitLabel(inspection.unitId)} — ${inspection.startedOn}.pdf`;
    downloadPdf(buildPdf(lines), fileName);
    return fileName;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className={`${ghost} min-h-9 px-3 text-xs`} onClick={onBack}>
          <ArrowLeft weight="bold" className="h-4 w-4" aria-hidden="true" />
          All inspections
        </button>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`${ghost} min-h-9 px-3 text-xs`} onClick={() => exportPdf()}>
            <FilePdf weight="duotone" className="h-4 w-4" aria-hidden="true" />
            Export PDF
          </button>
          {!readOnly && (
            <button
              type="button"
              className={`${primary} min-h-9 px-4 text-xs`}
              onClick={() => {
                const fileName = exportPdf();
                completeInspection(inspection.id, fileName);
                toast.success("Inspection completed", { description: "Filed on the unit and the tenant record." });
              }}
            >
              <CheckCircle weight="duotone" className="h-4 w-4" aria-hidden="true" />
              Complete & file
            </button>
          )}
        </div>
      </div>

      <header className="card-soft p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-extrabold text-navy">{inspection.name}</h2>
            <p className="text-sm text-muted-foreground">
              {unitLabel(inspection.unitId)} · {tenantName(inspection.tenantId)} · started {longDate(inspection.startedOn)}
            </p>
          </div>
          <StatusLabel status={inspection.status} />
        </div>
        <p className="mt-3 text-xs font-semibold text-muted-foreground tnum">
          {recorded} of {flat.length} items recorded
          {missingPhotos > 0 && ` · ${missingPhotos} still need a photo`}
        </p>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-navy-soft" role="presentation">
          <span
            className="block h-full rounded-full bg-action transition-all"
            style={{ width: `${flat.length ? (recorded / flat.length) * 100 : 0}%` }}
          />
        </div>
      </header>

      {tpl.sections.map((section) => (
        <section key={section.id} className="space-y-2">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">{section.name}</h3>
          <ul className="space-y-2">
            {section.items.map((i) => (
              <ItemRow
                key={i.id}
                inspectionId={inspection.id}
                itemId={i.id}
                label={i.label}
                response={i.response}
                photoRequired={i.photoRequired}
                result={inspection.results[i.id]}
                readOnly={readOnly}
              />
            ))}
          </ul>
        </section>
      ))}

      <section className="card-soft p-4">
        <h3 className="flex items-center gap-2 font-display text-base font-bold text-navy">
          <SignatureIcon weight="duotone" className="h-5 w-5" aria-hidden="true" />
          Signatures
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-navy">
          {inspection.signatures.map((s) => (
            <li key={s.role} className="flex flex-wrap items-center gap-2">
              <CheckCircle weight="duotone" className="h-4 w-4 text-success" aria-hidden="true" />
              <span className="font-semibold">{s.role}:</span> {s.name}
              <span className="text-muted-foreground tnum">{longDate(s.signedOn)}</span>
            </li>
          ))}
          {!inspection.signatures.length && <li className="text-muted-foreground">Nobody has signed yet.</li>}
        </ul>
        {!readOnly && (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="flex-1 basis-56 text-sm font-semibold text-navy">
              Type a name to sign
              <input value={signer} onChange={(e) => setSigner(e.target.value)} className={`${field} mt-1`} placeholder="Full name" />
            </label>
            {(["Inspector", "Tenant"] as const).map((role) => (
              <button
                key={role}
                type="button"
                className={`${ghost} min-h-11 px-4 text-xs`}
                onClick={() => {
                  if (!signer.trim()) {
                    toast.error("Type a name first");
                    return;
                  }
                  signInspection(inspection.id, {
                    name: signer.trim(),
                    role,
                    signedOn: new Date().toISOString().slice(0, 10),
                  });
                  setSigner("");
                  toast.success(`${role} signed`);
                }}
              >
                Sign as {role.toLowerCase()}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Template builder                                                    */
/* ------------------------------------------------------------------ */

function TemplateBuilder() {
  const { templates, saveTemplate, deleteTemplate } = useOperations();
  const [editing, setEditing] = useState<InspectionTemplate | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          className={`${primary} min-h-9 px-4 text-xs`}
          onClick={() =>
            setEditing({
              id: `tpl-${Date.now()}`,
              name: "",
              kind: "custom",
              description: "",
              sections: [{ id: `sec-${Date.now()}`, name: "Section 1", items: [] }],
            })
          }
        >
          <Plus weight="bold" className="h-4 w-4" aria-hidden="true" />
          New template
        </button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {templates.map((t) => (
          <li key={t.id} className="card-soft p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display text-base font-bold text-navy">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
              <span className="rounded-full bg-navy-soft px-2 py-1 text-[11px] font-semibold uppercase text-navy">{t.kind}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground tnum">
              {t.sections.length} sections · {t.sections.reduce((s, x) => s + x.items.length, 0)} items
            </p>
            <div className="mt-3 flex gap-2">
              <button type="button" className={`${ghost} min-h-9 px-3 text-xs`} onClick={() => setEditing(structuredClone(t))}>
                <PencilSimple weight="duotone" className="h-4 w-4" aria-hidden="true" />
                Edit
              </button>
              {t.kind === "custom" && (
                <button
                  type="button"
                  className={`${ghost} min-h-9 px-3 text-xs text-maple`}
                  onClick={() => {
                    deleteTemplate(t.id);
                    toast.success("Template deleted");
                  }}
                >
                  <Trash weight="duotone" className="h-4 w-4" aria-hidden="true" />
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {editing && <TemplateEditor draft={editing} onClose={() => setEditing(null)} onSave={(t) => { saveTemplate(t); setEditing(null); toast.success("Template saved"); }} />}
    </div>
  );
}

function TemplateEditor({
  draft,
  onClose,
  onSave,
}: {
  draft: InspectionTemplate;
  onClose: () => void;
  onSave: (t: InspectionTemplate) => void;
}) {
  const [tpl, setTpl] = useState<InspectionTemplate>(draft);

  const patchSection = (id: string, patch: Partial<TemplateSection>) =>
    setTpl((t) => ({ ...t, sections: t.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{draft.name ? "Edit template" : "New template"}</DialogTitle>
          <DialogDescription>Sections hold items. Each item has a response type.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-navy">
            Template name
            <input className={`${field} mt-1`} value={tpl.name} onChange={(e) => setTpl({ ...tpl, name: e.target.value })} />
          </label>
          <label className="block text-sm font-semibold text-navy">
            Description
            <input className={`${field} mt-1`} value={tpl.description} onChange={(e) => setTpl({ ...tpl, description: e.target.value })} />
          </label>

          {tpl.sections.map((s) => (
            <section key={s.id} className="rounded-2xl border border-border p-3">
              <div className="flex items-center gap-2">
                <input
                  className={field}
                  value={s.name}
                  aria-label="Section name"
                  onChange={(e) => patchSection(s.id, { name: e.target.value })}
                />
                <button
                  type="button"
                  aria-label={`Remove section ${s.name}`}
                  className={`${ghost} min-h-9 px-3 text-xs text-maple`}
                  onClick={() => setTpl((t) => ({ ...t, sections: t.sections.filter((x) => x.id !== s.id) }))}
                >
                  <Trash weight="duotone" className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <ul className="mt-2 space-y-2">
                {s.items.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-2">
                    <input
                      className={`${field} min-h-9 flex-1 basis-40`}
                      value={i.label}
                      aria-label="Item label"
                      onChange={(e) =>
                        patchSection(s.id, { items: s.items.map((x) => (x.id === i.id ? { ...x, label: e.target.value } : x)) })
                      }
                    />
                    <select
                      className={`${field} min-h-9 w-40`}
                      value={i.response}
                      aria-label="Response type"
                      onChange={(e) =>
                        patchSection(s.id, {
                          items: s.items.map((x) => (x.id === i.id ? { ...x, response: e.target.value as ResponseType } : x)),
                        })
                      }
                    >
                      <option value="condition">Condition rating</option>
                      <option value="yes-no">Yes / no</option>
                      <option value="text">Text</option>
                      <option value="photo">Photo</option>
                    </select>
                    <label className="flex min-h-9 items-center gap-2 text-xs font-semibold text-navy">
                      <input
                        type="checkbox"
                        checked={i.photoRequired}
                        onChange={(e) =>
                          patchSection(s.id, {
                            items: s.items.map((x) => (x.id === i.id ? { ...x, photoRequired: e.target.checked } : x)),
                          })
                        }
                      />
                      Photo required
                    </label>
                    <button
                      type="button"
                      aria-label={`Remove ${i.label}`}
                      className="min-h-9 rounded-full border border-border px-3 text-xs text-maple"
                      onClick={() => patchSection(s.id, { items: s.items.filter((x) => x.id !== i.id) })}
                    >
                      <Trash weight="duotone" className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`${ghost} mt-2 min-h-9 px-3 text-xs`}
                onClick={() =>
                  patchSection(s.id, {
                    items: [
                      ...s.items,
                      { id: `it-${Date.now()}`, label: "New item", response: "condition" as ResponseType, photoRequired: false },
                    ],
                  })
                }
              >
                <Plus weight="bold" className="h-4 w-4" aria-hidden="true" />
                Add item
              </button>
            </section>
          ))}

          <button
            type="button"
            className={`${ghost} min-h-9 px-3 text-xs`}
            onClick={() =>
              setTpl((t) => ({ ...t, sections: [...t.sections, { id: `sec-${Date.now()}`, name: "New section", items: [] }] }))
            }
          >
            <Plus weight="bold" className="h-4 w-4" aria-hidden="true" />
            Add section
          </button>
        </div>

        <DialogFooter>
          <button type="button" className={ghost} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primary}
            onClick={() => {
              if (!tpl.name.trim()) {
                toast.error("Give the template a name");
                return;
              }
              onSave(tpl);
            }}
          >
            Save template
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Compare                                                             */
/* ------------------------------------------------------------------ */

function ComparePanel() {
  const { inspections, templates } = useOperations();
  const unitsWithBoth = useMemo(() => {
    const ids = new Set(
      inspections
        .filter((i) => i.kind === "move-in")
        .map((i) => i.unitId)
        .filter((u) => inspections.some((x) => x.kind === "move-out" && x.unitId === u)),
    );
    return [...ids];
  }, [inspections]);
  const [unitId, setUnitId] = useState(unitsWithBoth[0] ?? "");

  if (!unitsWithBoth.length) {
    return (
      <EmptyState
        Icon={ArrowsLeftRight}
        title="Nothing to compare yet"
        body="Once a unit has both a move-in and a move-out inspection, they line up here item by item."
      />
    );
  }

  const moveIn = inspections.find((i) => i.unitId === unitId && i.kind === "move-in");
  const moveOut = inspections.find((i) => i.unitId === unitId && i.kind === "move-out");
  const tpl = templates.find((t) => t.id === moveIn?.templateId);

  return (
    <div className="space-y-4">
      <label className="block max-w-md text-sm font-semibold text-navy">
        Unit
        <select className={`${field} mt-1`} value={unitId} onChange={(e) => setUnitId(e.target.value)}>
          {unitsWithBoth.map((u) => (
            <option key={u} value={u}>
              {unitLabel(u)}
            </option>
          ))}
        </select>
      </label>

      <p className="rounded-2xl border border-border bg-navy-soft p-3 text-xs text-navy">
        Differences are highlighted. This side-by-side record, with both photos, is what settles a deposit dispute.
      </p>

      {tpl && moveIn && moveOut ? (
        tpl.sections.map((section) => (
          <section key={section.id} className="space-y-2">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">{section.name}</h3>
            <ul className="space-y-2">
              {section.items.map((i) => {
                const a = moveIn.results[i.id];
                const b = moveOut.results[i.id];
                const inRank = a?.condition ? conditionMeta[a.condition].rank : null;
                const outRank = b?.condition ? conditionMeta[b.condition].rank : null;
                const worse = inRank !== null && outRank !== null && outRank < inRank;
                const differs =
                  worse ||
                  (i.response === "yes-no" && a?.yesNo !== undefined && b?.yesNo !== undefined && a.yesNo !== b.yesNo) ||
                  (i.response === "text" && (a?.text ?? "") !== (b?.text ?? "") && Boolean(a?.text || b?.text));
                return (
                  <li
                    key={i.id}
                    className={`rounded-2xl border p-3 ${differs ? "border-maple bg-maple-soft/40" : "border-border bg-card"}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-navy">{i.label}</p>
                      {differs && (
                        <span className="rounded-full bg-maple-soft px-2 py-1 text-[11px] font-semibold text-maple">
                          {worse ? "Condition worsened" : "Changed"}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          ["Move-in", a, moveIn.startedOn],
                          ["Move-out", b, moveOut.startedOn],
                        ] as [string, ItemResult | undefined, string][]
                      ).map(([label, res, date]) => (
                        <div key={label} className="rounded-xl border border-border bg-card p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {label} · <span className="tnum">{longDate(date)}</span>
                          </p>
                          <p className="mt-1 text-sm font-semibold text-navy">{resultSummary(res, i.response)}</p>
                          {res?.note ? <p className="mt-1 text-xs text-muted-foreground">{res.note}</p> : null}
                          <PhotoStrip photos={res?.photos ?? []} />
                        </div>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      ) : (
        <EmptyState Icon={Warning} title="Missing inspection" body="This unit is short one of the two inspections." />
      )}
    </div>
  );
}
