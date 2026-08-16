import { createFileRoute, Link } from "@tanstack/react-router";
import { Buildings, EnvelopeSimple } from "@phosphor-icons/react";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
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
      
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-extrabold text-navy">Get in touch</h1>
        <p className="mt-4 text-muted-foreground">Need help or want to talk about a custom plan?</p>
        <div className="mt-10 card-soft p-8">
            <EnvelopeSimple weight="duotone" className="mx-auto h-12 w-12 text-action" />
            <a href="mailto:hello@keyhold.ca" className="mt-4 block text-2xl font-bold text-navy hover:text-action">hello@keyhold.ca</a>
        </div>
      </main>
    </div>
  );
}
