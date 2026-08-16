import { createFileRoute, Link } from "@tanstack/react-router";
import { Buildings, BookOpen } from "@phosphor-icons/react";

export const Route = createFileRoute("/blog")({
  component: BlogPage,
});

function BlogPage() {
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
        <h1 className="font-display text-3xl font-extrabold text-navy">Resources for Canadian Landlords</h1>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
                { title: "Guide: The Ontario Standard Lease", date: "Aug 12, 2026" },
                { title: "How to handle rent increases in 2026", date: "Aug 05, 2026" },
                { title: "LTB filing guide for beginners", date: "Jul 28, 2026" },
            ].map(post => (
                <div key={post.title} className="group cursor-pointer">
                    <div className="aspect-[16/9] w-full rounded-2xl bg-navy-soft transition-transform group-hover:scale-[1.02]" />
                    <p className="mt-4 text-xs font-bold text-action uppercase tracking-widest">{post.date}</p>
                    <h3 className="mt-2 text-xl font-bold text-navy group-hover:underline">{post.title}</h3>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}
