import { createFileRoute, Link } from "@tanstack/react-router";
import { Buildings, Question } from "@phosphor-icons/react";

export const Route = createFileRoute("/help")({
  component: HelpPage,
});

function HelpPage() {
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

      <main className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-extrabold text-navy">How can we help?</h1>
        <div className="mt-12 grid gap-6 text-left sm:grid-cols-2">
            {[
                { title: "Getting Started", count: 12 },
                { title: "Rent & Payments", count: 8 },
                { title: "Maintenance", count: 5 },
                { title: "Leases & Notices", count: 15 },
            ].map(cat => (
                <div key={cat.title} className="card-soft p-6 flex justify-between items-center group cursor-pointer hover:bg-navy-soft">
                    <span className="font-bold text-navy">{cat.title}</span>
                    <span className="text-xs text-muted-foreground">{cat.count} articles</span>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}
