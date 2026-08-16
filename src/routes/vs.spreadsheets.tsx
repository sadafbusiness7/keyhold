import { createFileRoute, Link } from "@tanstack/react-router";
import { Buildings, Check, X } from "@phosphor-icons/react";

export const Route = createFileRoute("/vs/spreadsheets")({
  component: VsSpreadsheetsPage,
});

function VsSpreadsheetsPage() {
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

      <main className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="font-display text-4xl font-extrabold">Keyhold vs Spreadsheets</h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed mx-auto max-w-2xl">
          We love spreadsheets. They're flexible and free. But they don't send rent reminders, they don't store photos of leaky sinks, 
          and they definitely don't know when the LTB updates a form.
        </p>

        <div className="mt-12 grid gap-8 text-left sm:grid-cols-2">
            <div className="card-soft p-8">
                <h3 className="font-bold text-lg text-navy">Spreadsheets</h3>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <li><X className="inline mr-2 text-warning" /> No automatic rent tracking</li>
                    <li><X className="inline mr-2 text-warning" /> Manual calculation errors</li>
                    <li><X className="inline mr-2 text-warning" /> No tenant communication logs</li>
                    <li><Check className="inline mr-2 text-success" /> Free (if you value time at $0)</li>
                </ul>
            </div>
            <div className="card-soft p-8 bg-navy text-primary-foreground">
                <h3 className="font-bold text-lg">Keyhold</h3>
                <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
                    <li><Check className="inline mr-2 text-success" /> Auto-reminders & receipts</li>
                    <li><Check className="inline mr-2 text-success" /> LTB-ready forms & leases</li>
                    <li><Check className="inline mr-2 text-success" /> Central maintenance portal</li>
                    <li><Check className="inline mr-2 text-success" /> CA$4.99/mo — less than a coffee</li>
                </ul>
            </div>
        </div>
      </main>
    </div>
  );
}
