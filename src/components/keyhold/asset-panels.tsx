/**
 * Assets UI — appliances and equipment per unit with warranty and linked
 * maintenance history, plus shared info assets (door codes, wifi, parking)
 * that can be shared to specific tenants' portals.
 */
import { useMemo, useState } from "react";
import {
  Toolbox,
  Plus,
  PencilSimple,
  Trash,
  Wrench,
  Key,
  WifiHigh,
  Car,
  Warning,
  MagnifyingGlass,
  EyeSlash,
  Eye,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/keyhold/empty-state";
import { StatusLabel } from "@/components/keyhold/status";
import { longDate, properties, units, tenants, tickets, propertyById } from "@/lib/mock-data";
import { daysUntil, propertyLabel, unitLabel, useOperations, type Asset, type AssetKind } from "@/lib/mock-operations";

const btn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors";
const primary = `${btn} bg-action text-primary-foreground hover:bg-action/90`;
const ghost = `${btn} border border-border text-navy hover:bg-navy-soft`;
const field =
  "min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action";

const infoIcon = (type: string) =>
  type === "Wifi" ? WifiHigh : type === "Parking" ? Car : Key;

export function AssetsScreen() {
  const { assets, saveAsset, deleteAsset, toggleAssetShare } = useOperations();
  const [kind, setKind] = useState<AssetKind>("equipment");
  const [query, setQuery] = useState("");
  const [propertyId, setPropertyId] = useState("all");
  const [editing, setEditing] = useState<Asset | null>(null);

  const shown = useMemo(
    () =>
      assets.filter((a) => {
        if (a.kind !== kind) return false;
        if (propertyId !== "all" && a.propertyId !== propertyId) return false;
        const hay = `${a.name} ${a.type} ${a.make ?? ""} ${a.model ?? ""} ${a.serial ?? ""} ${unitLabel(a.unitId)}`.toLowerCase();
        return hay.includes(query.trim().toLowerCase());
      }),
    [assets, kind, propertyId, query],
  );

  const expiringWarranties = assets.filter((a) => {
    const d = daysUntil(a.warrantyExpiry);
    return a.kind === "equipment" && d !== null && d <= 60;
  });

  return (
    <div className="space-y-4">
      {expiringWarranties.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-warning bg-warning-soft p-3 text-sm text-warning">
          <Warning weight="duotone" className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="font-semibold">{expiringWarranties.length} warranty expiring within 60 days</span>
          <span className="text-navy">{expiringWarranties.map((a) => a.name).join(", ")}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Asset type" className="flex gap-2">
          {(
            [
              ["equipment", "Equipment & appliances"],
              ["info", "Shared info"],
            ] as [AssetKind, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
              className={`${btn} min-h-9 px-4 text-xs ${
                kind === k ? "bg-navy text-primary-foreground" : "border border-border text-navy hover:bg-navy-soft"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="relative flex-1 basis-52">
          <span className="sr-only">Search assets</span>
          <MagnifyingGlass
            weight="duotone"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            className={`${field} pl-9`}
            placeholder="Search make, model, serial, unit"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="basis-48">
          <span className="sr-only">Filter by property</span>
          <select className={field} value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            <option value="all">All properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={`${primary} min-h-11 px-4 text-xs`}
          onClick={() =>
            setEditing({
              id: `as-${Date.now()}`,
              kind,
              name: "",
              type: kind === "equipment" ? "Appliance" : "Access code",
              propertyId: properties[0]?.id ?? "",
              unitId: null,
              make: "",
              model: "",
              serial: "",
              purchaseDate: null,
              warrantyExpiry: null,
              value: "",
              notes: "",
              sharedWith: [],
            })
          }
        >
          <Plus weight="bold" className="h-4 w-4" aria-hidden="true" />
          {kind === "equipment" ? "Add equipment" : "Add shared info"}
        </button>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          Icon={Toolbox}
          title={kind === "equipment" ? "No equipment tracked yet" : "No shared info yet"}
          body={
            kind === "equipment"
              ? "Add the fridge, furnace and hot water tank so warranty dates and repairs live in one place."
              : "Door codes, wifi and parking instructions — added once, shared to the tenants who need them."
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((a) =>
            a.kind === "equipment" ? (
              <EquipmentCard key={a.id} asset={a} onEdit={() => setEditing(structuredClone(a))} onDelete={() => deleteAsset(a.id)} />
            ) : (
              <InfoCard
                key={a.id}
                asset={a}
                onEdit={() => setEditing(structuredClone(a))}
                onDelete={() => deleteAsset(a.id)}
                onToggleShare={(tenantId) => toggleAssetShare(a.id, tenantId)}
              />
            ),
          )}
        </ul>
      )}

      {editing && (
        <AssetEditor
          draft={editing}
          onClose={() => setEditing(null)}
          onSave={(a) => {
            saveAsset(a);
            setEditing(null);
            toast.success("Asset saved");
          }}
        />
      )}
    </div>
  );
}

function EquipmentCard({ asset, onEdit, onDelete }: { asset: Asset; onEdit: () => void; onDelete: () => void }) {
  const history = tickets.filter((t) => asset.unitId && t.unitId === asset.unitId);
  const days = daysUntil(asset.warrantyExpiry);

  return (
    <li className="card-soft p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-base font-bold text-navy">{asset.name}</p>
          <p className="text-xs text-muted-foreground">
            {asset.type} · {asset.unitId ? unitLabel(asset.unitId) : propertyLabel(asset.propertyId)}
          </p>
        </div>
        {days !== null && (
          <span
            className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
              days < 0 ? "bg-maple-soft text-maple" : days <= 60 ? "bg-warning-soft text-warning" : "bg-success-soft text-success"
            }`}
          >
            {days < 0 ? "Warranty expired" : `Warranty ${days}d`}
          </span>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {[
          ["Make", asset.make || "—"],
          ["Model", asset.model || "—"],
          ["Serial", asset.serial || "—"],
          ["Purchased", asset.purchaseDate ? longDate(asset.purchaseDate) : "—"],
          ["Warranty ends", asset.warrantyExpiry ? longDate(asset.warrantyExpiry) : "—"],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="truncate font-semibold text-navy tnum">{v}</dd>
          </div>
        ))}
      </dl>

      {asset.notes && <p className="mt-2 text-xs text-muted-foreground">{asset.notes}</p>}

      <section className="mt-3">
        <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <Wrench weight="duotone" className="h-4 w-4" aria-hidden="true" />
          Maintenance history
        </h4>
        {history.length ? (
          <ul className="mt-1 space-y-1">
            {history.slice(0, 3).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-navy">{t.title}</span>
                <StatusLabel status={t.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">No repairs logged on this unit.</p>
        )}
      </section>

      <div className="mt-3 flex gap-2">
        <button type="button" className={`${ghost} min-h-9 px-3 text-xs`} onClick={onEdit}>
          <PencilSimple weight="duotone" className="h-4 w-4" aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          className={`${ghost} min-h-9 px-3 text-xs text-maple`}
          onClick={() => {
            onDelete();
            toast.success("Asset removed");
          }}
        >
          <Trash weight="duotone" className="h-4 w-4" aria-hidden="true" />
          Remove
        </button>
      </div>
    </li>
  );
}

function InfoCard({
  asset,
  onEdit,
  onDelete,
  onToggleShare,
}: {
  asset: Asset;
  onEdit: () => void;
  onDelete: () => void;
  onToggleShare: (tenantId: string) => void;
}) {
  const [reveal, setReveal] = useState(false);
  const Icon = infoIcon(asset.type);
  const scopeTenants = tenants.filter((t) => {
    const unit = units.find((u) => u.id === t.unitId);
    if (!unit) return false;
    if (asset.unitId) return t.unitId === asset.unitId;
    return unit.propertyId === asset.propertyId;
  });

  return (
    <li className="card-soft p-4">
      <div className="flex items-start gap-2">
        <Icon weight="duotone" className="h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold text-navy">{asset.name}</p>
          <p className="text-xs text-muted-foreground">
            {asset.type} · {asset.unitId ? unitLabel(asset.unitId) : propertyLabel(asset.propertyId)}
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 rounded-xl bg-navy-soft px-3 py-2">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">
          {reveal ? asset.value || "—" : "••••••••"}
        </span>
        <button
          type="button"
          className="text-navy"
          aria-label={reveal ? "Hide value" : "Reveal value"}
          onClick={() => setReveal((r) => !r)}
        >
          {reveal ? <EyeSlash weight="duotone" className="h-4 w-4" /> : <Eye weight="duotone" className="h-4 w-4" />}
        </button>
      </div>

      {asset.notes && <p className="mt-2 text-xs text-muted-foreground">{asset.notes}</p>}

      <fieldset className="mt-3">
        <legend className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Shared with</legend>
        <ul className="mt-1 space-y-1">
          {scopeTenants.length ? (
            scopeTenants.map((t) => (
              <li key={t.id}>
                <label className="flex min-h-9 items-center gap-2 text-xs text-navy">
                  <input type="checkbox" checked={asset.sharedWith.includes(t.id)} onChange={() => onToggleShare(t.id)} />
                  {t.name}
                  <span className="text-muted-foreground">{units.find((u) => u.id === t.unitId)?.label}</span>
                </label>
              </li>
            ))
          ) : (
            <li className="text-xs text-muted-foreground">No tenants at this property yet.</li>
          )}
        </ul>
      </fieldset>

      <div className="mt-3 flex gap-2">
        <button type="button" className={`${ghost} min-h-9 px-3 text-xs`} onClick={onEdit}>
          <PencilSimple weight="duotone" className="h-4 w-4" aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          className={`${ghost} min-h-9 px-3 text-xs text-maple`}
          onClick={() => {
            onDelete();
            toast.success("Removed");
          }}
        >
          <Trash weight="duotone" className="h-4 w-4" aria-hidden="true" />
          Remove
        </button>
      </div>
    </li>
  );
}

function AssetEditor({ draft, onClose, onSave }: { draft: Asset; onClose: () => void; onSave: (a: Asset) => void }) {
  const [a, setA] = useState<Asset>(draft);
  const unitOptions = units.filter((u) => u.propertyId === a.propertyId);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.name ? "Edit asset" : a.kind === "equipment" ? "Add equipment" : "Add shared info"}</DialogTitle>
          <DialogDescription>
            {a.kind === "equipment"
              ? "Serial numbers and warranty dates save you a phone call later."
              : "Codes and instructions you can share to a tenant's portal."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-navy sm:col-span-2">
            Name
            <input className={`${field} mt-1`} value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} />
          </label>
          <label className="text-sm font-semibold text-navy">
            Type
            <select className={`${field} mt-1`} value={a.type} onChange={(e) => setA({ ...a, type: e.target.value })}>
              {(a.kind === "equipment"
                ? ["Appliance", "HVAC", "Plumbing", "Electrical", "Safety", "Other"]
                : ["Access code", "Wifi", "Parking", "Waste & recycling", "Other"]
              ).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-navy">
            Property
            <select
              className={`${field} mt-1`}
              value={a.propertyId}
              onChange={(e) => setA({ ...a, propertyId: e.target.value, unitId: null })}
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-navy sm:col-span-2">
            Unit
            <select className={`${field} mt-1`} value={a.unitId ?? ""} onChange={(e) => setA({ ...a, unitId: e.target.value || null })}>
              <option value="">Whole property</option>
              {unitOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {propertyById(u.propertyId).address} · {u.label}
                </option>
              ))}
            </select>
          </label>

          {a.kind === "equipment" ? (
            <>
              <label className="text-sm font-semibold text-navy">
                Make
                <input className={`${field} mt-1`} value={a.make ?? ""} onChange={(e) => setA({ ...a, make: e.target.value })} />
              </label>
              <label className="text-sm font-semibold text-navy">
                Model
                <input className={`${field} mt-1`} value={a.model ?? ""} onChange={(e) => setA({ ...a, model: e.target.value })} />
              </label>
              <label className="text-sm font-semibold text-navy">
                Serial number
                <input className={`${field} mt-1`} value={a.serial ?? ""} onChange={(e) => setA({ ...a, serial: e.target.value })} />
              </label>
              <label className="text-sm font-semibold text-navy">
                Purchase date
                <input
                  type="date"
                  className={`${field} mt-1`}
                  value={a.purchaseDate ?? ""}
                  onChange={(e) => setA({ ...a, purchaseDate: e.target.value || null })}
                />
              </label>
              <label className="text-sm font-semibold text-navy">
                Warranty expiry
                <input
                  type="date"
                  className={`${field} mt-1`}
                  value={a.warrantyExpiry ?? ""}
                  onChange={(e) => setA({ ...a, warrantyExpiry: e.target.value || null })}
                />
              </label>
            </>
          ) : (
            <label className="text-sm font-semibold text-navy sm:col-span-2">
              Code / details
              <input className={`${field} mt-1`} value={a.value ?? ""} onChange={(e) => setA({ ...a, value: e.target.value })} />
            </label>
          )}

          <label className="text-sm font-semibold text-navy sm:col-span-2">
            Notes
            <textarea
              rows={2}
              className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
              value={a.notes}
              onChange={(e) => setA({ ...a, notes: e.target.value })}
            />
          </label>
        </div>

        <DialogFooter>
          <button type="button" className={ghost} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primary}
            onClick={() => {
              if (!a.name.trim()) {
                toast.error("Give the asset a name");
                return;
              }
              onSave(a);
            }}
          >
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
