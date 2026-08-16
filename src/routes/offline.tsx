import { createFileRoute, Link } from "@tanstack/react-router";
import { CloudSlash, ArrowClockwise } from "@phosphor-icons/react";

export const Route = createFileRoute("/offline")({
  head: () => ({
    meta: [
      { title: "You're offline — Keyhold" },
      { name: "description", content: "Keyhold can't reach the network right now. Your saved pages still open, and everything syncs once you're back online." },
      { property: "og:title", content: "You're offline — Keyhold" },
      { property: "og:description", content: "A calm offline page: what still works, and what waits for the network." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OfflinePage,
});

function OfflinePage() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-center">
      <div className="card-soft max-w-md p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-soft text-navy">
          <CloudSlash weight="duotone" className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-extrabold text-navy">You're offline</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Keyhold can't reach the network right now. Pages you've already opened still work, and anything you type will
          be waiting for you once the connection returns.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-navy text-sm font-semibold text-primary-foreground hover:bg-navy/90"
          >
            <ArrowClockwise weight="bold" className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
          <Link to="/" className="text-sm font-semibold text-navy hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}