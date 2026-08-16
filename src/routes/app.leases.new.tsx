import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/keyhold/app-shell";
import { tenants, units, unitAddress } from "@/lib/mock-data";

export const Route = createFileRoute("/app/leases/new")({
  head: () => ({
    meta: [
      { title: "New lease or notice — Keyhold" },
      { name: "description", content: "Create a lease renewal or an Ontario LTB notice with plain-language prompts." },
      { property: "og:title", content: "New lease or notice — Keyhold" },
      { property: "og:description", content: "A short, guided form for leases and notices." },
    ],
  }),
  component: LeaseFormPage,
});

const kinds = [
  { id: "lease", label: "New lease (Ontario Standard Lease)" },
  { id: "renewal", label: "Lease renewal" },
  { id: "n1", label: "N1 — rent increase notice (90 days)" },
  { id: "n4", label: "N4 — notice for unpaid rent" },
  { id: "n12", label: "N12 — landlord or family moving in" },
];

const field = "mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm";

function LeaseFormPage() {
  const navigate = useNavigate();
  const [kind, setKind] = useState("lease");
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? "");
  const [start, setStart] = useState("2026-09-01");
  const [rent, setRent] = useState("2350");
  const [notes, setNotes] = useState("");

  return (
    <>
      <PageHeader title="New lease or notice" subtitle="Answer a few plain questions — Keyhold fills in the paperwork." />
      <form
        className="card-soft max-w-2xl space-y-5 p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!rent || Number(rent) <= 0) {
            toast.error("Enter the monthly rent.");
            return;
          }
          toast.success("Draft saved. You'll find it under Documents.");
          navigate({ to: "/app/documents" });
        }}
      >
        <fieldset>
          <legend className="text-sm font-semibold text-navy">What are you creating?</legend>
          <div className="mt-2 space-y-2">
            {kinds.map((k) => (
              <label key={k.id} className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3 text-sm">
                <input
                  type="radio"
                  name="kind"
                  value={k.id}
                  checked={kind === k.id}
                  onChange={() => setKind(k.id)}
                  className="h-4 w-4 accent-[var(--action)]"
                />
                {k.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="unit" className="text-sm font-medium">Which home?</label>
            <select id="unit" value={unitId} onChange={(e) => setUnitId(e.target.value)} className={field}>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{unitAddress(u.id)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tenant" className="text-sm font-medium">Which tenant?</label>
            <select id="tenant" value={tenantId} onChange={(e) => setTenantId(e.target.value)} className={field}>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="start" className="text-sm font-medium">Start date</label>
            <input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className={field} />
          </div>
          <div>
            <label htmlFor="rent" className="text-sm font-medium">Monthly rent (CAD)</label>
            <input id="rent" inputMode="decimal" value={rent} onChange={(e) => setRent(e.target.value)} className={`${field} tnum`} />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="text-sm font-medium">Anything else to include?</label>
          <textarea
            id="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Parking spot #3 included. Snow clearing by landlord."
            className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="min-h-11 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90">
            Save draft
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/app/leases" })}
            className="min-h-11 rounded-full border border-border px-5 text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}
