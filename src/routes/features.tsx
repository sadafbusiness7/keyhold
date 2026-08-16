import { createFileRoute, Link } from "@tanstack/react-router";
import { Buildings, CurrencyDollar, Wrench, FileText, Monitor, ChartBar } from "@phosphor-icons/react";

export const Route = createFileRoute("/features")({
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

      <main className="mx-auto max-w-6xl px-4 py-20">
        <h1 className="font-display text-4xl font-extrabold text-navy">Everything you need to stay calm.</h1>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(f => (
            <Link key={f.href} to={f.href} className="card-soft p-8 group">
              <f.icon weight="duotone" className="h-10 w-10 text-action group-hover:scale-110 transition-transform" />
              <h3 className="mt-4 font-bold text-navy text-xl">{f.label}</h3>
              <p className="mt-2 text-muted-foreground">{f.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
