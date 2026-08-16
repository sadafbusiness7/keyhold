import { createFileRoute, Link } from "@tanstack/react-router";
import { Buildings, ListChecks, Rocket } from "@phosphor-icons/react";

export const Route = createFileRoute("/roadmap")({
  component: RoadmapPage,
});

function RoadmapPage() {
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

      <main className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-display text-3xl font-extrabold text-navy">Public Roadmap</h1>
        <div className="mt-10 space-y-12">
          <section>
            <h2 className="flex items-center gap-2 font-bold text-success"><CheckCircle weight="bold" /> Shipped</h2>
            <ul className="mt-4 space-y-4">
              <li className="card-soft p-4">Online rent payments (Stripe/PAD)</li>
              <li className="card-soft p-4">Ontario Standard Lease generator</li>
            </ul>
          </section>
          <section>
            <h2 className="flex items-center gap-2 font-bold text-action"><Rocket weight="bold" /> In Progress</h2>
             <ul className="mt-4 space-y-4">
              <li className="card-soft p-4">BC & Alberta province landing pages</li>
              <li className="card-soft p-4">Bulk document sharing</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

function CheckCircle(props: any) {
    return <ListChecks {...props} />;
}
