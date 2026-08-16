import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle } from "@phosphor-icons/react";
import { Brand } from "@/components/keyhold/app-shell";
import { field, ScreeningNotice } from "@/components/keyhold/pipeline";
import { useLeasing } from "@/lib/mock-leasing";
import { cad, propertyById } from "@/lib/mock-data";

export const Route = createFileRoute("/apply/$slug")({
  head: () => ({
    meta: [
      { title: "Rental application — Keyhold" },
      { name: "description", content: "Apply for this Canadian rental home online: contact, employment, references and documents in one short form." },
      { property: "og:title", content: "Rental application — Keyhold" },
      { property: "og:description", content: "One short, private application form with clear credit-check consent." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ApplyPage,
});

function ApplyPage() {
  const { slug } = Route.useParams();
  const { listings, submitApplication } = useLeasing();
  const listing = listings.find((l) => l.slug === slug);
  const [done, setDone] = useState(false);
  const [consent, setConsent] = useState(false);
  const [docs, setDocs] = useState<string[]>([]);
  const [guarantor, setGuarantor] = useState(false);

  if (!listing) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold text-navy">This home is no longer listed</h1>
      </main>
    );
  }
  const property = propertyById(listing.propertyId);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 py-4"><Brand /></header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        {done ? (
          <div className="card-soft p-8 text-center">
            <CheckCircle weight="duotone" className="mx-auto h-12 w-12 text-success" aria-hidden="true" />
            <h1 className="mt-3 font-display text-2xl font-extrabold text-navy">Application received</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The landlord will be in touch. You'll only be screened after you've given consent — which you can withdraw any time.
            </p>
            <Link to="/listing/$slug" params={{ slug }} className="mt-5 inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold text-navy">
              Back to the listing
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-extrabold text-navy">Apply — {listing.headline}</h1>
            <p className="tnum mt-1 text-sm text-muted-foreground">
              {property.city}, {property.province} · {cad(listing.rent)}/month
            </p>

            <form
              className="card-soft mt-5 space-y-5 p-5 sm:p-6"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                if (!consent) { toast.error("Please give consent before submitting."); return; }
                submitApplication({
                  listingId: listing.id,
                  fullName: String(f.get("fullName") ?? ""),
                  email: String(f.get("email") ?? ""),
                  phone: String(f.get("phone") ?? ""),
                  employer: String(f.get("employer") ?? ""),
                  jobTitle: String(f.get("jobTitle") ?? ""),
                  monthlyIncome: Number(f.get("income")) || 0,
                  moveIn: String(f.get("moveIn") ?? listing.availableFrom),
                  occupants: String(f.get("occupants") ?? ""),
                  referenceName: String(f.get("refName") ?? ""),
                  referencePhone: String(f.get("refPhone") ?? ""),
                  ...(guarantor
                    ? { guarantorName: String(f.get("gName") ?? ""), guarantorPhone: String(f.get("gPhone") ?? "") }
                    : {}),
                  documents: docs,
                  creditConsent: true,
                });
                setDone(true);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className="text-sm font-medium" htmlFor="fullName">Full name</label><input required id="fullName" name="fullName" className={field} /></div>
                <div><label className="text-sm font-medium" htmlFor="email">Email</label><input required id="email" name="email" type="email" className={field} /></div>
                <div><label className="text-sm font-medium" htmlFor="phone">Phone</label><input required id="phone" name="phone" className={field} /></div>
                <div><label className="text-sm font-medium" htmlFor="moveIn">Preferred move-in</label><input id="moveIn" name="moveIn" type="date" defaultValue={listing.availableFrom} className={field} /></div>
                <div><label className="text-sm font-medium" htmlFor="employer">Employer</label><input id="employer" name="employer" className={field} /></div>
                <div><label className="text-sm font-medium" htmlFor="jobTitle">Job title</label><input id="jobTitle" name="jobTitle" className={field} /></div>
                <div><label className="text-sm font-medium" htmlFor="income">Monthly income (CAD)</label><input id="income" name="income" inputMode="decimal" className={`${field} tnum`} /></div>
                <div><label className="text-sm font-medium" htmlFor="occupants">Who will live here?</label><input id="occupants" name="occupants" className={field} /></div>
                <div><label className="text-sm font-medium" htmlFor="refName">Reference name</label><input id="refName" name="refName" className={field} /></div>
                <div><label className="text-sm font-medium" htmlFor="refPhone">Reference phone</label><input id="refPhone" name="refPhone" className={field} /></div>
              </div>

              <div>
                <label className="text-sm font-medium" htmlFor="docs">Upload documents (ID, pay stubs)</label>
                <input id="docs" type="file" multiple className="mt-1 block w-full text-sm" onChange={(e) => setDocs(Array.from(e.target.files ?? []).map((x) => x.name))} />
                {docs.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{docs.join(", ")}</p>}
              </div>

              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input type="checkbox" checked={guarantor} onChange={(e) => setGuarantor(e.target.checked)} className="h-4 w-4 accent-[var(--action)]" />
                I'd like to add a guarantor (optional)
              </label>
              {guarantor && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="text-sm font-medium" htmlFor="gName">Guarantor name</label><input id="gName" name="gName" className={field} /></div>
                  <div><label className="text-sm font-medium" htmlFor="gPhone">Guarantor phone</label><input id="gPhone" name="gPhone" className={field} /></div>
                </div>
              )}

              <div className="space-y-3 rounded-xl border border-border p-4">
                <label className="flex items-start gap-3 text-sm">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--action)]" />
                  <span>
                    <strong>Credit check consent.</strong> I consent to the landlord requesting a credit and background
                    report about me for the purpose of this tenancy application only.
                  </span>
                </label>
                <ScreeningNotice />
              </div>

              <button type="submit" className="min-h-11 w-full rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90">
                Submit application
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
