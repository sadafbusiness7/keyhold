import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/keyhold/marketing-shell";
import { Check, WarningCircle } from "@phosphor-icons/react";

export const Route = createFileRoute("/vs/doorloop")({
  head: () => ({
    meta: [
      { title: "Keyhold vs DoorLoop — A Canadian Comparison" },
      { name: "description", content: "Comparing Keyhold and DoorLoop. See why Canadian landlords choose a local solution for LTB compliance." },
    ],
  }),
  component: VsDoorLoopPage,
});

function VsDoorLoopPage() {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-4xl px-4 py-20">
        <h1 className="font-display text-4xl font-extrabold text-navy text-center">Keyhold vs DoorLoop</h1>
        <p className="mt-6 text-xl text-muted-foreground leading-relaxed text-center max-w-2xl mx-auto">
          DoorLoop is fast and modern property management software. Keyhold is a specialized tool for the Canadian regulatory environment.
        </p>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
            <div className="card-soft p-10 bg-white border-2 border-success/10">
                <h3 className="font-display text-2xl font-extrabold text-success flex items-center gap-2"><Check /> Where DoorLoop wins</h3>
                <p className="mt-4 text-sm text-muted-foreground">DoorLoop is excellent for portfolios requiring:</p>
                <ul className="mt-6 space-y-4 text-sm font-medium text-navy">
                    <li className="flex items-start gap-3"><Check className="text-success shrink-0" /> Global currency and region support</li>
                    <li className="flex items-start gap-3"><Check className="text-success shrink-0" /> Advanced CRM for leasing agents</li>
                    <li className="flex items-start gap-3"><Check className="text-success shrink-0" /> Customizable reporting templates</li>
                    <li className="flex items-start gap-3"><Check className="text-success shrink-0" /> Open API for developers</li>
                </ul>
            </div>
            <div className="card-soft p-10 bg-white border-2 border-action/10">
                <h3 className="font-display text-2xl font-extrabold text-action flex items-center gap-2"><Check /> Where Keyhold wins</h3>
                <p className="mt-4 text-sm text-muted-foreground">Keyhold is superior for Canadian landlords who want:</p>
                <ul className="mt-6 space-y-4 text-sm font-medium text-navy">
                    <li className="flex items-start gap-3"><Check className="text-action shrink-0" /> Prefilled Ontario Standard Leases</li>
                    <li className="flex items-start gap-3"><Check className="text-action shrink-0" /> T776 Tax Export for the CRA</li>
                    <li className="flex items-start gap-3"><Check className="text-action shrink-0" /> Lower price point (CA$ vs USD)</li>
                    <li className="flex items-start gap-3"><Check className="text-action shrink-0" /> Localized support based in Ontario</li>
                </ul>
            </div>
        </div>

        <div className="mt-20 p-8 rounded-3xl bg-surface-sunk text-center border border-border">
            <WarningCircle className="mx-auto h-8 w-8 text-muted-foreground" weight="duotone" />
            <h4 className="mt-4 font-bold text-navy">The Bottom Line</h4>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
                If you are a professional manager with a dedicated leasing team, DoorLoop is a strong contender. 
                If you are an individual landlord in Ontario or BC, Keyhold will save you hours on localized paperwork.
            </p>
        </div>
      </main>
    </MarketingShell>
  );
}
