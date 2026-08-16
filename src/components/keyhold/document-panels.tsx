/**
 * Documents UI — folders, drag-and-drop upload, metadata, expiry reminders,
 * version history and tenant sharing. Store-backed, no business logic here.
 */
import { useMemo, useRef, useState } from "react";
import {
  Folders,
  UploadSimple,
  FilePdf,
  Trash,
  PencilSimple,
  ShareNetwork,
  ClockCounterClockwise,
  Paperclip,
  Warning,
  Eye,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DataList, type Column } from "@/components/keyhold/data-list";
import { longDate, properties, units, tenants, leases, propertyById } from "@/lib/mock-data";
import {
  DOC_CATEGORIES,
  DOC_FOLDERS,
  daysUntil,
  propertyLabel,
  tenantName,
  unitLabel,
  useOperations,
  type DocCategory,
  type DocumentRecord,
} from "@/lib/mock-operations";

const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors";
const primary = `${btn} bg-action text-primary-foreground hover:bg-action/90`;
const ghost = `${btn} border border-border text-navy hover:bg-navy-soft`;
const field =
  "min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action";

const sizeLabel = (bytes: number) =>
  bytes > 1_000_000 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function docStatus(d: DocumentRecord) {
  const days = daysUntil(d.expiryDate);
  if (days === null) return undefined;
  if (days < 0) return "overdue" as const;
  if (days <= 45) return "due-soon" as const;
  return "approved" as const;
}

export function DocumentsScreen() {
  const { documents, addDocument, updateDocument, deleteDocument } = useOperations();
  const [folder, setFolder] = useState<string>("All");
  const [uploading, setUploading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const shown = folder === "All" ? documents : documents.filter((d) => d.folder === folder);
  const expiring = documents.filter((d) => {
    const days = daysUntil(d.expiryDate);
    return days !== null && days <= 45;
  });
  const open = documents.find((d) => d.id === openId) ?? null;

  const columns: Column<DocumentRecord>[] = [
    {
      key: "name",
      label: "Document",
      locked: true,
      value: (d) => d.name,
      render: (d) => (
        <span className="flex min-w-0 items-center gap-2">
          <FilePdf weight="duotone" className="h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
          <span className="truncate font-semibold text-navy">{d.name}</span>
        </span>
      ),
    },
    { key: "category", label: "Category", value: (d) => d.category },
    { key: "folder", label: "Folder", value: (d) => d.folder, defaultHidden: true },
    {
      key: "linked",
      label: "Filed under",
      value: (d) => (d.unitId ? unitLabel(d.unitId) : propertyLabel(d.propertyId)),
    },
    { key: "tenant", label: "Tenant", value: (d) => tenantName(d.tenantId), defaultHidden: true },
    {
      key: "expiry",
      label: "Expires",
      value: (d) => d.expiryDate ?? "",
      render: (d) => <span className="tnum">{d.expiryDate ? longDate(d.expiryDate) : "—"}</span>,
    },
    {
      key: "visibility",
      label: "Visible to tenant",
      value: (d) => (d.visibility === "shared" ? "Shared" : "Private"),
    },
    {
      key: "updated",
      label: "Updated",
      value: (d) => d.uploadedOn,
      render: (d) => <span className="tnum">{longDate(d.uploadedOn)}</span>,
    },
    { key: "size", label: "Size", align: "right", value: (d) => d.size },
  ];

  return (
    <div className="space-y-4">
      {expiring.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-warning bg-warning-soft p-3 text-sm text-warning">
          <Warning weight="duotone" className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="font-semibold">
            {expiring.length} document{expiring.length === 1 ? "" : "s"} expiring within 45 days
          </span>
          <span className="text-navy">{expiring.map((d) => d.name).join(", ")}</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Folders" className="card-soft h-max p-2">
          <ul className="space-y-1">
            {["All", ...DOC_FOLDERS].map((f) => {
              const count = f === "All" ? documents.length : documents.filter((d) => d.folder === f).length;
              const active = folder === f;
              return (
                <li key={f}>
                  <button
                    type="button"
                    onClick={() => setFolder(f)}
                    aria-current={active ? "true" : undefined}
                    className={`flex min-h-11 w-full items-center gap-2 rounded-full px-3 text-sm font-medium ${
                      active ? "bg-navy text-primary-foreground" : "text-navy hover:bg-navy-soft"
                    }`}
                  >
                    <Folders weight="duotone" className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{f}</span>
                    <span className="ml-auto text-xs tnum">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <DataList
          name="Documents"
          items={shown}
          getId={(d) => d.id}
          columns={columns}
          getStatus={docStatus}
          searchPlaceholder="Search documents, properties, tenants"
          filters={[
            {
              key: "category",
              label: "Category",
              options: DOC_CATEGORIES.map((c) => ({ value: c, label: c })),
              match: (d, v) => d.category === v,
            },
            {
              key: "visibility",
              label: "Visibility",
              options: [
                { value: "private", label: "Private" },
                { value: "shared", label: "Shared with tenant" },
              ],
              match: (d, v) => d.visibility === v,
            },
            {
              key: "expiry",
              label: "Expiry",
              options: [
                { value: "soon", label: "Expiring in 45 days" },
                { value: "expired", label: "Expired" },
              ],
              match: (d, v) => {
                const days = daysUntil(d.expiryDate);
                if (days === null) return false;
                return v === "expired" ? days < 0 : days >= 0 && days <= 45;
              },
            },
          ]}
          dateOf={(d) => d.uploadedOn}
          rowActions={[
            { key: "open", label: "Open details", Icon: Eye, onSelect: (d) => setOpenId(d.id) },
            {
              key: "share",
              label: "Toggle tenant sharing",
              Icon: ShareNetwork,
              onSelect: (d) => {
                updateDocument(d.id, { visibility: d.visibility === "shared" ? "private" : "shared" });
                toast.success(d.visibility === "shared" ? "Hidden from the tenant portal" : "Shared to the tenant portal");
              },
            },
            {
              key: "delete",
              label: "Delete",
              Icon: Trash,
              destructive: true,
              confirm: (d) => `${d.name} and its ${d.versions.length} version(s) are removed for everyone.`,
              onSelect: (d) => {
                deleteDocument(d.id);
                toast.success("Document deleted");
              },
            },
          ]}
          emptyIcon={Folders}
          emptyTitle="No documents in this folder"
          emptyBody="Drag a lease, notice or receipt in and tag it so you can find it later."
          emptyAction={
            <button type="button" className={primary} onClick={() => setUploading(true)}>
              <UploadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" />
              Upload documents
            </button>
          }
          toolbarExtra={
            <button type="button" className={`${primary} px-4 text-xs`} onClick={() => setUploading(true)}>
              <UploadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" />
              Upload
            </button>
          }
        />
      </div>

      {uploading && (
        <UploadDialog
          defaultFolder={folder === "All" ? "Other" : folder}
          onClose={() => setUploading(false)}
          onDone={(docs) => {
            docs.forEach(addDocument);
            setUploading(false);
            toast.success(`${docs.length} document${docs.length === 1 ? "" : "s"} filed`);
          }}
        />
      )}

      <Sheet open={Boolean(open)} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && <DocumentDetail doc={open} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------------ */

type NewDoc = Omit<DocumentRecord, "id" | "versions"> & { versionNote?: string };

function UploadDialog({
  defaultFolder,
  onClose,
  onDone,
}: {
  defaultFolder: string;
  onClose: () => void;
  onDone: (docs: NewDoc[]) => void;
}) {
  const [files, setFiles] = useState<{ name: string; size: string }[]>([]);
  const [dragging, setDragging] = useState(false);
  const [category, setCategory] = useState<DocCategory>("Other");
  const [folder, setFolder] = useState(defaultFolder);
  const [propertyId, setPropertyId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [leaseId, setLeaseId] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [shared, setShared] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const take = (list: FileList | null) => {
    const picked = Array.from(list ?? []).map((f) => ({ name: f.name, size: sizeLabel(f.size) }));
    if (picked.length) setFiles((prev) => [...prev, ...picked]);
  };

  const unitOptions = propertyId ? units.filter((u) => u.propertyId === propertyId) : units;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload documents</DialogTitle>
          <DialogDescription>Drop files in, then tag them once — the tags apply to every file in this batch.</DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            take(e.dataTransfer.files);
          }}
          className={`rounded-2xl border-2 border-dashed p-6 text-center ${dragging ? "border-action bg-action-soft" : "border-border"}`}
        >
          <UploadSimple weight="duotone" className="mx-auto h-8 w-8 text-navy" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-navy">Drag files here</p>
          <p className="text-xs text-muted-foreground">PDF, images, Word — several at a time</p>
          <button type="button" className={`${ghost} mt-3 min-h-11 px-4 text-xs`} onClick={() => inputRef.current?.click()}>
            Choose files
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="sr-only"
            aria-label="Choose documents to upload"
            onChange={(e) => {
              take(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {files.length > 0 && (
          <ul className="space-y-1 text-sm text-navy">
            {files.map((f, idx) => (
              <li key={`${f.name}-${idx}`} className="flex items-center gap-2">
                <Paperclip weight="duotone" className="h-4 w-4" aria-hidden="true" />
                <span className="truncate">{f.name}</span>
                <span className="ml-auto text-xs text-muted-foreground tnum">{f.size}</span>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  className="text-maple"
                  onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <Trash weight="duotone" className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-navy">
            Category
            <select className={`${field} mt-1`} value={category} onChange={(e) => setCategory(e.target.value as DocCategory)}>
              {DOC_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-navy">
            Folder
            <select className={`${field} mt-1`} value={folder} onChange={(e) => setFolder(e.target.value)}>
              {DOC_FOLDERS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-navy">
            Property
            <select
              className={`${field} mt-1`}
              value={propertyId}
              onChange={(e) => {
                setPropertyId(e.target.value);
                setUnitId("");
              }}
            >
              <option value="">Not linked</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-navy">
            Unit
            <select className={`${field} mt-1`} value={unitId} onChange={(e) => setUnitId(e.target.value)}>
              <option value="">Not linked</option>
              {unitOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {propertyById(u.propertyId).address} · {u.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-navy">
            Tenant
            <select className={`${field} mt-1`} value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
              <option value="">Not linked</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-navy">
            Attach to lease
            <select className={`${field} mt-1`} value={leaseId} onChange={(e) => setLeaseId(e.target.value)}>
              <option value="">Not attached</option>
              {leases.map((l) => (
                <option key={l.id} value={l.id}>
                  {unitLabel(l.unitId)} · ends {l.end}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-navy">
            Review date
            <input type="date" className={`${field} mt-1`} value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} />
          </label>
          <label className="text-sm font-semibold text-navy">
            Expiry date
            <input type="date" className={`${field} mt-1`} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </label>
        </div>

        <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-navy">
          <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} />
          Share with the tenant in their portal
        </label>

        <DialogFooter>
          <button type="button" className={ghost} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primary}
            onClick={() => {
              if (!files.length) {
                toast.error("Add at least one file");
                return;
              }
              onDone(
                files.map((f) => ({
                  name: f.name,
                  category,
                  folder,
                  propertyId: propertyId || null,
                  unitId: unitId || null,
                  tenantId: tenantId || null,
                  leaseId: leaseId || null,
                  reviewDate: reviewDate || null,
                  expiryDate: expiryDate || null,
                  visibility: shared ? "shared" : "private",
                  uploadedOn: new Date().toISOString().slice(0, 10),
                  size: f.size,
                })),
              );
            }}
          >
            Upload {files.length ? `${files.length} file${files.length === 1 ? "" : "s"}` : ""}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DocumentDetail({ doc }: { doc: DocumentRecord }) {
  const { updateDocument, addVersion } = useOperations();
  const [note, setNote] = useState("");
  const days = daysUntil(doc.expiryDate);

  return (
    <>
      <SheetHeader>
        <SheetTitle className="truncate">{doc.name}</SheetTitle>
        <SheetDescription>
          {doc.category} · {doc.folder}
        </SheetDescription>
      </SheetHeader>

      <dl className="mt-4 space-y-2 text-sm">
        {[
          ["Property", propertyLabel(doc.propertyId)],
          ["Unit", doc.unitId ? unitLabel(doc.unitId) : "—"],
          ["Tenant", tenantName(doc.tenantId)],
          ["Attached to lease", doc.leaseId ? "Yes" : "No"],
          ["Review date", doc.reviewDate ? longDate(doc.reviewDate) : "—"],
          ["Expires", doc.expiryDate ? longDate(doc.expiryDate) : "—"],
          ["Size", doc.size],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right font-semibold text-navy">{v}</dd>
          </div>
        ))}
      </dl>

      {days !== null && days <= 45 && (
        <p className="mt-3 rounded-xl bg-warning-soft p-3 text-xs font-semibold text-warning">
          {days < 0 ? `Expired ${Math.abs(days)} days ago` : `Expires in ${days} days — a reminder is queued.`}
        </p>
      )}

      <label className="mt-4 flex min-h-11 items-center gap-2 text-sm font-semibold text-navy">
        <input
          type="checkbox"
          checked={doc.visibility === "shared"}
          onChange={(e) => updateDocument(doc.id, { visibility: e.target.checked ? "shared" : "private" })}
        />
        Share with the tenant in their portal
      </label>

      <section className="mt-4">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold text-navy">
          <ClockCounterClockwise weight="duotone" className="h-4 w-4" aria-hidden="true" />
          Version history
        </h3>
        <ul className="mt-2 space-y-2">
          {doc.versions.map((v) => (
            <li key={v.version} className="rounded-xl border border-border p-3 text-sm">
              <p className="font-semibold text-navy">
                v{v.version} · <span className="tnum">{longDate(v.uploadedOn)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {v.by} · {v.note} · {v.size}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className={`${field} min-h-11 flex-1 basis-40`}
            placeholder="What changed?"
            aria-label="Version note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            type="button"
            className={`${ghost} px-4 text-xs`}
            onClick={() => {
              addVersion(doc.id, note.trim() || "New version uploaded", doc.size);
              setNote("");
              toast.success("Version added");
            }}
          >
            <PencilSimple weight="duotone" className="h-4 w-4" aria-hidden="true" />
            Add version
          </button>
        </div>
      </section>
    </>
  );
}
