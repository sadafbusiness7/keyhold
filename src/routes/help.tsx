import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/keyhold/marketing-shell";
import { MagnifyingGlass, Book, CurrencyCircleDollar, Wrench, FileText } from "@phosphor-icons/react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Centre — Keyhold" },
      { name: "description", content: "Guides and documentation to help you get the most out of Keyhold property management." },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="text-center">
            <h1 className="font-display text-4xl font-extrabold text-navy">Help Centre</h1>
            <p className="mt-4 text-lg text-muted-foreground">Search our documentation or browse by category.</p>
            
            <div className="mt-10 mx-auto max-w-2xl relative">
                <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input type="text" className="w-full rounded-2xl border border-border bg-white pl-12 pr-4 py-4 text-lg shadow-sm focus:border-action focus:ring-2 focus:ring-action/10" placeholder="Search for 'rent payments', 'LTB forms'..." />
            </div>
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
                { icon: Book, title: "Getting Started", count: 12 },
                { icon: CurrencyCircleDollar, title: "Rent & Payments", count: 8 },
                { icon: Wrench, title: "Maintenance", count: 5 },
                { icon: FileText, title: "Leases & Notices", count: 15 },
            ].map(cat => (
                <div key={cat.title} className="card-soft p-8 text-center cursor-pointer hover:bg-navy-soft transition-colors group">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-soft text-navy group-hover:bg-navy group-hover:text-white transition-colors">
                        <cat.icon weight="duotone" className="h-6 w-6" />
                    </div>
                    <h3 className="mt-6 font-bold text-navy">{cat.title}</h3>
                    <p className="mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">{cat.count} articles</p>
                </div>
            ))}
        </div>
      </div>
    </MarketingShell>
  );
}
