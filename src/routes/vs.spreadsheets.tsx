import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/keyhold/marketing-shell";
import { Check, X, Info } from "@phosphor-icons/react";

export const Route = createFileRoute("/vs/spreadsheets")({
  head: () => ({
    meta: [
      { title: "Keyhold vs Spreadsheets — Why Upgrade?" },
      { name: "description", content: "Stop managing your properties in Excel. See how Keyhold automates rent receipts, maintenance, and LTB compliance." },
    ],
  }),
  component: VsSpreadsheetsPage,
});

function VsSpreadsheetsPage() {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-4xl px-4 py-20">
        <h1 className="font-display text-4xl font-extrabold text-navy text-center">Keyhold vs Spreadsheets</h1>
        <p className="mt-6 text-xl text-muted-foreground leading-relaxed text-center max-w-2xl mx-auto">
            Spreadsheets are the #1 competitor to Keyhold. We love Excel too, but it wasn't built for property management.
        </p>

        <div className="mt-16 grid gap-8 text-left sm:grid-cols-2">
            <div className="card-soft p-10">
                <h3 className="font-display text-2xl font-extrabold text-muted-foreground">Spreadsheets</h3>
                <ul className="mt-8 space-y-5 text-sm font-medium text-muted-foreground">
                    <li className="flex items-start gap-3"><X className="text-warning shrink-0 h-5 w-5" weight="bold" /> Manual rent receipt generation</li>
                    <li className="flex items-start gap-3"><X className="text-warning shrink-0 h-5 w-5" weight="bold" /> No central photo/doc storage</li>
                    <li className="flex items-start gap-3"><X className="text-warning shrink-0 h-5 w-5" weight="bold" /> Easy to break formulas & data entry</li>
                    <li className="flex items-start gap-3"><X className="text-warning shrink-0 h-5 w-5" weight="bold" /> Zero tenant communication history</li>
                    <li className="flex items-start gap-3"><Check className="text-success shrink-0 h-5 w-5" weight="bold" /> Free (Zero dollar cost)</li>
                </ul>
            </div>
            <div className="card-soft p-10 bg-navy text-primary-foreground shadow-2xl shadow-navy/20">
                <h3 className="font-display text-2xl font-extrabold">Keyhold</h3>
                <ul className="mt-8 space-y-5 text-sm font-medium text-primary-foreground/90">
                    <li className="flex items-start gap-3"><Check className="text-success shrink-0 h-5 w-5" weight="bold" /> Auto-reminders & receipts</li>
                    <li className="flex items-start gap-3"><Check className="text-success shrink-0 h-5 w-5" weight="bold" /> Ontario Standard Lease generator</li>
                    <li className="flex items-start gap-3"><Check className="text-success shrink-0 h-5 w-5" weight="bold" /> Integrated tenant portal & chat</li>
                    <li className="flex items-start gap-3"><Check className="text-success shrink-0 h-5 w-5" weight="bold" /> CRA-ready T776 tax exports</li>
                    <li className="flex items-start gap-3"><Check className="text-success shrink-0 h-5 w-5" weight="bold" /> CA$4.99/mo (Less than a coffee)</li>
                </ul>
            </div>
        </div>

        <div className="mt-20 p-10 rounded-3xl bg-action-soft/30 border-2 border-action/10 text-center">
            <Info className="mx-auto h-8 w-8 text-action" weight="duotone" />
            <h4 className="mt-4 font-extrabold text-navy text-xl">The Hidden Cost of "Free"</h4>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                If you spend just 15 minutes a month per unit manually creating receipts and updating your spreadsheet, 
                you're paying yourself less than minimum wage compared to the cost of Keyhold.
            </p>
        </div>
      </main>
    </MarketingShell>
  );
}
