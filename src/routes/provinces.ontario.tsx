import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/keyhold/marketing-shell";
import { MapPin, CheckCircle, WarningCircle } from "@phosphor-icons/react";

export const Route = createFileRoute("/provinces/ontario")({
  head: () => ({
    meta: [
      { title: "Ontario Property Management Software — Keyhold" },
      { name: "description", content: "Rental software built specifically for the Ontario Residential Tenancies Act. OSL, LTB forms, and guideline tracking." },
    ],
  }),
  component: OntarioLandingPage,
});

function OntarioLandingPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
                <div className="flex items-center gap-3 text-action">
                    <MapPin weight="duotone" className="h-6 w-6" />
                    <span className="text-xs font-bold uppercase tracking-widest">Ontario Compliance</span>
                </div>
                <h1 className="mt-4 font-display text-5xl font-extrabold leading-tight text-navy">
                    Rental software built for the <span className="text-action underline decoration-action/30 underline-offset-8">RTA.</span>
                </h1>
                <p className="mt-8 text-xl text-muted-foreground leading-relaxed">
                    Ontario is one of the most regulated rental markets in the world. Keyhold keeps you compliant with the 
                    Residential Tenancies Act (RTA) by default, reducing your legal risk.
                </p>
                <div className="mt-10 grid gap-4">
                    {[
                        "Ontario Standard Lease (OSL) prefilled",
                        "LTB notice periods calculated (N4, N12, etc.)",
                        "Rent increase guideline tracking (2.5% for 2026)",
                        "Security deposit interest calculation",
                    ].map(item => (
                        <div key={item} className="flex items-center gap-3 font-semibold text-navy">
                            <CheckCircle weight="fill" className="h-5 w-5 text-success shrink-0" />
                            {item}
                        </div>
                    ))}
                </div>
            </div>
            <div className="card-soft bg-white p-8 border-2 border-action/10 shadow-2xl shadow-navy/5">
                <div className="flex items-center gap-2 text-warning font-bold uppercase tracking-widest text-[10px]">
                    <WarningCircle weight="bold" /> Did you know?
                </div>
                <h3 className="mt-3 text-2xl font-extrabold text-navy">Illegal Clauses are Void</h3>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                    In Ontario, even if a tenant signs a lease saying "no pets" or "post-dated checks only", 
                    those clauses are unenforceable under the RTA. Keyhold's lease generator only uses legal, 
                    standardized terms to protect you.
                </p>
                <div className="mt-8 pt-8 border-t border-border">
                    <p className="text-sm font-bold text-navy italic">"Keyhold saved me from a LTB disaster by flagging that my notice period was one day short."</p>
                    <p className="mt-2 text-xs text-muted-foreground">— Sarah D., Hamilton Landlord</p>
                </div>
            </div>
        </div>
      </div>
    </MarketingShell>
  );
}
