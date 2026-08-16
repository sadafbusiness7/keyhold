import { useState } from "react";
import { DuplicateWarning } from "@/components/keyhold/duplicate-warning";
import { findTenantDuplicates } from "@/lib/duplicate-detection";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/keyhold/app-shell";
import { RequireFinancials } from "@/components/keyhold/access-guard";
import { field } from "@/components/keyhold/pipeline";
import { useLeasing } from "@/lib/mock-leasing";
import { cad, longDate, units } from "@/lib/mock-data";
import { usePermissions } from "@/lib/mock-access";

export const Route = createFileRoute("/app/add-tenant")({
  head: () => ({
    meta: [
      { title: "Add an existing tenant — Keyhold" },
      { name: "description", content: "Already have a signed lease? Add the tenant, assign their unit and schedule their rent." },
      { property: "og:title", content: "Add an existing tenant — Keyhold" },
      { property: "og:description", content: "Skip the pipeline and bring an existing tenancy into Keyhold." },
    ],
  }),
  component: () => (
    <RequireFinancials title="Add an existing tenant">
      <AddTenantPage />
    </RequireFinancials>
  ),
});

function AddTenantPage() {
  const navigate = useNavigate();
  const { properties } = usePermissions();
  const { addExistingTenant } = useLeasing();
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const options = units.filter((u) => u.propertyId === propertyId);
  const [unitId, setUnitId] = useState(options[0]?.id ?? "");
  const [leaseFile, setLeaseFile] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ackDuplicate, setAckDuplicate] = useState(false);
  const dupes = findTenantDuplicates({ name, email, phone });

  return (
    <>
      <PageHeader title="Add an existing tenant" subtitle="For tenancies that started before Keyhold — the tenant and their lease are created right away." />
      <form
        className="card-soft grid max-w-2xl gap-4 p-5 sm:grid-cols-2 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          if (!unitId) { toast.error("Pick the unit they live in."); return; }
          if (dupes.length && !ackDuplicate) {
            toast.error("This tenant may already exist — choose “Use existing” or confirm “Create anyway”.");
            return;
          }
          const inv = addExistingTenant({
            propertyId,
            unitId,
            name: String(f.get("name") ?? ""),
            email: String(f.get("email") ?? ""),
            phone: String(f.get("phone") ?? ""),
            rent: Number(f.get("rent")) || 0,
            startDate: String(f.get("start") ?? ""),
            endDate: String(f.get("end") ?? ""),
            deposit: Number(f.get("deposit")) || 0,
            leaseFile: leaseFile || "Existing lease.pdf",
          });
          toast.success(`${inv.tenantName} added. First invoice ${cad(inv.amount)} on ${longDate(inv.dueDate)}.`);
          navigate({ to: "/app/tenants" });
        }}
      >
        <div>
          <label className="text-sm font-medium" htmlFor="p">Property</label>
          <select id="p" className={field} value={propertyId} onChange={(e) => { setPropertyId(e.target.value); setUnitId(units.find((u) => u.propertyId === e.target.value)?.id ?? ""); }}>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="u">Unit</label>
          <select id="u" className={field} value={unitId} onChange={(e) => setUnitId(e.target.value)}>
            {options.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>
        <div><label className="text-sm font-medium" htmlFor="name">Tenant name</label><input required id="name" name="name" className={field} value={name} onChange={(e) => { setName(e.target.value); setAckDuplicate(false); }} /></div>
        <div><label className="text-sm font-medium" htmlFor="email">Email</label><input required id="email" name="email" type="email" className={field} value={email} onChange={(e) => { setEmail(e.target.value); setAckDuplicate(false); }} /></div>
        <div><label className="text-sm font-medium" htmlFor="phone">Phone</label><input id="phone" name="phone" className={field} value={phone} onChange={(e) => { setPhone(e.target.value); setAckDuplicate(false); }} /></div>
        {dupes.length > 0 && (
          <div className="sm:col-span-2">
            <DuplicateWarning
              hits={dupes}
              noun="tenant"
              acknowledged={ackDuplicate}
              onUseExisting={(hit) => navigate({ to: "/app/tenants/$id", params: { id: hit.record.id }, search: { tab: "overview" } })}
              onCreateAnyway={() => setAckDuplicate(true)}
            />
          </div>
        )}
        <div><label className="text-sm font-medium" htmlFor="rent">Monthly rent (CAD)</label><input id="rent" name="rent" inputMode="decimal" defaultValue="1800" className={`${field} tnum`} /></div>
        <div><label className="text-sm font-medium" htmlFor="deposit">Deposit held (CAD)</label><input id="deposit" name="deposit" inputMode="decimal" defaultValue="1800" className={`${field} tnum`} /></div>
        <div><label className="text-sm font-medium" htmlFor="start">Lease start</label><input id="start" name="start" type="date" defaultValue="2025-09-01" className={field} /></div>
        <div><label className="text-sm font-medium" htmlFor="end">Lease end</label><input id="end" name="end" type="date" defaultValue="2026-08-31" className={field} /></div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium" htmlFor="file">Upload their signed lease (PDF)</label>
          <input id="file" type="file" accept="application/pdf" className="mt-1 block w-full text-sm" onChange={(e) => setLeaseFile(e.target.files?.[0]?.name ?? "")} />
        </div>
        <button type="submit" className="min-h-11 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground sm:col-span-2">
          Add tenant & schedule rent
        </button>
      </form>
    </>
  );
}
