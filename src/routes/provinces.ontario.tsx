import { createFileRoute, Link } from "@tanstack/react-router";
import { Buildings, MapPin, CheckCircle } from "@phosphor-icons/react";

export const Route = createFileRoute("/provinces/ontario")({
  component: OntarioLandingPage,
});

function OntarioLandingPage() {
  return (
    <div className="min-h-screen bg-surface text-navy">
      <header className="border-b border-border bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-white">
              <Buildings weight="duotone" className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-extrabold text-navy">Keyhold</span>
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-20">
        <div className="flex items-center gap-3 text-action">
            <MapPin weight="duotone" className="h-6 w-6" />
            <span className="text-xs font-bold uppercase tracking-widest">Ontario First</span>
        </div>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight">
            Rental software built for the <span className="text-action underline decoration-action/30 underline-offset-8">RTA.</span>
        </h1>
        <p className="mt-8 text-lg text-muted-foreground leading-relaxed">
            Ontario is one of the most regulated rental markets in North America. Keyhold keeps you compliant with the 
            Residential Tenancies Act (RTA) by default.
        </p>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {[
                "Ontario Standard Lease (OSL) prefilled",
                "LTB notice periods calculated (N4, N12, etc.)",
                "Rent increase guideline tracking (2026)",
                "Security deposit interest calculation",
            ].map(item => (
                <div key={item} className="flex items-start gap-3 card-soft p-5">
                    <CheckCircle weight="duotone" className="h-6 w-6 text-success shrink-0" />
                    <span className="text-sm font-semibold">{item}</span>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}
