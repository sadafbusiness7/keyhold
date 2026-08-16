import { createFileRoute, Link } from "@tanstack/react-router";
import { Buildings, Check, X } from "@phosphor-icons/react";

export const Route = createFileRoute("/vs/doorloop")({
  component: VsDoorLoopPage,
});

function VsDoorLoopPage() {
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

      <main className="mx-auto max-w-4xl px-4 py-20">
        <h1 className="font-display text-4xl font-extrabold">Keyhold vs DoorLoop</h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          DoorLoop is incredibly fast and modern. If you want a full-featured CRM for leasing, they're excellent. 
          Keyhold focuses strictly on the Canadian landlord experience — minimizing complexity for those who manage their own properties.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <div className="card-soft p-8 bg-success-soft/30 border-success/20">
                <h3 className="font-bold text-lg text-success flex items-center gap-2"><Check /> Where DoorLoop wins</h3>
                <ul className="mt-4 space-y-3 text-sm">
                    <li>Deep CRM and lead management</li>
                    <li>Global currency support</li>
                    <li>Customizable fields and workflows</li>
                </ul>
            </div>
            <div className="card-soft p-8 bg-action-soft/30 border-action/20">
                <h3 className="font-bold text-lg text-action flex items-center gap-2"><Check /> Where Keyhold wins</h3>
                <ul className="mt-4 space-y-3 text-sm">
                    <li>Simplest interface on the market</li>
                    <li>CA$4.99 flat price vs per-unit minimums</li>
                    <li>Provincial compliance built-in (Canada first)</li>
                </ul>
            </div>
        </div>
      </main>
    </div>
  );
}
