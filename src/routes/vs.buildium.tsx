import { createFileRoute, Link } from "@tanstack/react-router";
import { Buildings, Check, X } from "@phosphor-icons/react";

export const Route = createFileRoute("/vs/buildium")({
  component: VsBuildiumPage,
});

function VsBuildiumPage() {
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
        <h1 className="font-display text-4xl font-extrabold">Keyhold vs Buildium</h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          Buildium is a powerhouse for large-scale property management. If you manage 500 units, you probably need it. 
          But for Canadian landlords with 2–20 units, it's often more than you need at a higher price than you'd like.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <div className="card-soft p-8 bg-success-soft/30 border-success/20">
                <h3 className="font-bold text-lg text-success flex items-center gap-2"><Check /> Where Buildium wins</h3>
                <ul className="mt-4 space-y-3 text-sm">
                    <li>Comprehensive trust accounting</li>
                    <li>Integrated vendor marketplace</li>
                    <li>Built-in commercial management</li>
                </ul>
            </div>
            <div className="card-soft p-8 bg-action-soft/30 border-action/20">
                <h3 className="font-bold text-lg text-action flex items-center gap-2"><Check /> Where Keyhold wins</h3>
                <ul className="mt-4 space-y-3 text-sm">
                    <li>Flat CA$4.99/mo pricing for small portfolios</li>
                    <li>Native Ontario Standard Lease & LTB forms</li>
                    <li>AI-assisted maintenance workflows</li>
                </ul>
            </div>
        </div>
      </main>
    </div>
  );
}
