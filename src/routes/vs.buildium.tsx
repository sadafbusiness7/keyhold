import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/keyhold/marketing-shell";
import { Check, X, WarningCircle } from "@phosphor-icons/react";

export const Route = createFileRoute("/vs/buildium")({
  head: () => ({
    meta: [
      { title: "Keyhold vs Buildium — Which is right for you?" },
      { name: "description", content: "A fair comparison of Keyhold and Buildium for Canadian landlords. Simple vs Comprehensive." },
    ],
  }),
  component: VsBuildiumPage,
});

function VsBuildiumPage() {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-4xl px-4 py-20">
        <h1 className="font-display text-4xl font-extrabold text-navy text-center">Keyhold vs Buildium</h1>
        <p className="mt-6 text-xl text-muted-foreground leading-relaxed text-center max-w-2xl mx-auto">
          Buildium is a powerhouse for large-scale property management. But for self-managing Canadian landlords, it's often more than you need.
        </p>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
            <div className="card-soft p-10 bg-white border-2 border-success/10">
                <h3 className="font-display text-2xl font-extrabold text-success flex items-center gap-2"><Check /> Where Buildium wins</h3>
                <p className="mt-4 text-sm text-muted-foreground">Choose Buildium if you manage 100+ units or require:</p>
                <ul className="mt-6 space-y-4 text-sm font-medium text-navy">
                    <li className="flex items-start gap-3"><Check className="text-success shrink-0" /> Multi-entity trust accounting</li>
                    <li className="flex items-start gap-3"><Check className="text-success shrink-0" /> Integrated vendor marketplace</li>
                    <li className="flex items-start gap-3"><Check className="text-success shrink-0" /> Built-in commercial management</li>
                    <li className="flex items-start gap-3"><Check className="text-success shrink-0" /> Community association features</li>
                </ul>
            </div>
            <div className="card-soft p-10 bg-white border-2 border-action/10">
                <h3 className="font-display text-2xl font-extrabold text-action flex items-center gap-2"><Check /> Where Keyhold wins</h3>
                <p className="mt-4 text-sm text-muted-foreground">Choose Keyhold if you manage 2–20 units and value:</p>
                <ul className="mt-6 space-y-4 text-sm font-medium text-navy">
                    <li className="flex items-start gap-3"><Check className="text-action shrink-0" /> Native Ontario LTB Compliance</li>
                    <li className="flex items-start gap-3"><Check className="text-action shrink-0" /> CA$4.99/mo flat price (No minimums)</li>
                    <li className="flex items-start gap-3"><Check className="text-action shrink-0" /> Simple, mobile-friendly interface</li>
                    <li className="flex items-start gap-3"><Check className="text-action shrink-0" /> AI-powered maintenance triage</li>
                </ul>
            </div>
        </div>

        <div className="mt-20 p-8 rounded-3xl bg-surface-sunk text-center border border-border">
            <WarningCircle className="mx-auto h-8 w-8 text-muted-foreground" weight="duotone" />
            <h4 className="mt-4 font-bold text-navy">Honest Assessment</h4>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
                Buildium is a enterprise-grade tool with a price tag to match. Keyhold is a focused tool built specifically 
                to handle the unique regulations of the Canadian rental market.
            </p>
        </div>
      </main>
    </MarketingShell>
  );
}
