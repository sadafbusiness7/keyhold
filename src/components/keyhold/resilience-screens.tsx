import { Link } from "@tanstack/react-router";
import { Warning, ArrowLeft } from "@phosphor-icons/react";

export function Error500({ error }: { error?: Error }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="texture-dots absolute inset-0 opacity-20" aria-hidden="true" />
      <div className="relative z-10 card-soft max-w-md p-8 shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-maple-soft text-maple">
          <Warning weight="duotone" className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-extrabold text-navy">System hiccup</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. We've been notified and are looking into it.
        </p>
        {error && (
          <div className="mt-4 rounded-lg bg-surface-sunk p-3 text-left">
            <code className="text-[10px] text-muted-foreground break-all">{error.message}</code>
          </div>
        )}
        <div className="mt-8 flex flex-col gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-navy text-sm font-semibold text-primary-foreground hover:bg-navy/90"
          >
            Try reloading
          </button>
          <Link 
            to="/"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            <ArrowLeft weight="bold" className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
