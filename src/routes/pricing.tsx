import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/keyhold/app-shell";
import { PricingCalculator } from "@/components/keyhold/pricing-calculator";
import { Buildings, CheckCircle, ChatCircleDots, ArrowRight } from "@phosphor-icons/react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Keyhold" },
      { name: "description", content: "Simple, flat pricing for Canadian landlords. CA$4.99/mo for up to 12 units. No hidden fees." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
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

      <main>
        <PricingCalculator />
        
        <section className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h2 className="font-display text-3xl font-extrabold text-navy">Common questions</h2>
          <div className="mt-10 grid gap-6 text-left sm:grid-cols-2">
            {[
              { q: "Is there a contract?", a: "No. Keyhold is pay-as-you-go, month-to-month. Cancel anytime." },
              { q: "What about payment fees?", a: "Stripe charges their standard rate (approx 2.9% + 30¢ for cards). Keyhold takes zero cut." },
              { q: "Can I try it for free?", a: "Yes, fully functional trial. No credit card required to start." },
              { q: "What if I have 50+ units?", a: "Contact us at hello@keyhold.ca for a custom plan." },
            ].map((faq) => (
              <div key={faq.q} className="card-soft p-6">
                <p className="font-bold text-navy">{faq.q}</p>
                <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface-sunk py-12 text-center text-sm text-muted-foreground">
        © 2026 Keyhold. Made in Canada.
      </footer>
    </div>
  );
}
