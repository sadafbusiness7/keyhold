import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/keyhold/marketing-shell";
import { PricingCalculator } from "@/components/keyhold/pricing-calculator";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Keyhold" },
      { name: "description", content: "Simple, flat pricing for Canadian landlords. CA$4.99/mo for up to 12 units. No hidden fees." },
      { property: "og:title", content: "Simple, Flat Pricing for Canadian Landlords" },
      { property: "og:description", content: "CA$4.99/mo for up to 12 units. Pay-as-you-go, no contracts." },
      { name: "twitter:card", content: "summary_large_image" }
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <MarketingShell>
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
    </MarketingShell>
  );
}
