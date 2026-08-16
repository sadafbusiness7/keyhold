import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/keyhold/marketing-shell";
import { CurrencyDollar, Wrench, FileText, Monitor, ChartBar, ArrowRight } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Keyhold" },
      { name: "description", content: "Everything you need to manage your rentals calmly. Rent tracking, maintenance, leases, and reporting." },
    ],
  }),
  component: FeaturesOverviewPage,
});

const features = [
  { icon: CurrencyDollar, label: "Rent tracking", href: "/features/rent", desc: "Automated receipts and overdue tracking." },
  { icon: Wrench, label: "Maintenance", href: "/features/maintenance", desc: "Tenant portal for repair requests." },
  { icon: FileText, label: "Leases & Forms", href: "/features/leases", desc: "Provincial standard leases and LTB forms." },
  { icon: Monitor, label: "Tenant Portal", href: "/features/portal", desc: "A clean interface for your tenants." },
  { icon: ChartBar, label: "Reporting & T776", href: "/features/reports", desc: "Tax-ready records for your accountant." },
];

function FeaturesOverviewPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h1 className="font-display text-4xl font-extrabold text-navy">Everything you need to stay calm.</h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          We built Keyhold to solve the specific headaches of Canadian self-managing landlords. No bloat, just the tools that matter.
        </p>
        
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(f => (
            <Link key={f.href} to={f.href as any} className="card-soft p-8 group flex flex-col items-start text-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-white group-hover:scale-110 transition-transform">
                <f.icon weight="duotone" className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-bold text-navy text-xl">{f.label}</h3>
              <p className="mt-2 text-muted-foreground flex-1">{f.desc}</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-bold text-action">
                Learn more <ArrowRight weight="bold" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </MarketingShell>
  );
}
