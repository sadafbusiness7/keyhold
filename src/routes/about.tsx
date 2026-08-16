import { createFileRoute, Link } from "@tanstack/react-router";
import { Buildings, ArrowRight, ShieldCheck, Scales, FileText, Lock, CreditCard, Detective, Calculator, Wheelchair } from "@phosphor-icons/react";
import { PageHeader } from "@/components/keyhold/app-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Keyhold — Rental management for Canadians" },
      { name: "description", content: "Keyhold is built in Canada for landlords who are tired of spreadsheets." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-surface">
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

      <main className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-display text-4xl font-extrabold text-navy">We're building for Canadian landlords.</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Rentals in Canada are complicated. From provincial standard leases to LTB notice periods and regional tax filings, 
          most software gets it wrong because it's built for the US.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Keyhold is our answer: a calm, simple dashboard that respects your time and follows Canadian rules by default.
        </p>
      </main>
    </div>
  );
}
