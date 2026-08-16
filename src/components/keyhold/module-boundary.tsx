/**
 * RESILIENCE KIT — one friendly failure treatment for the whole app.
 *
 * - <ModuleBoundary>  a per-module error boundary: never a white screen,
 *                     always a plain-language message plus "Try again".
 * - <OfflineBanner>   tells people the connection dropped, and when it's back.
 * - <SkeletonRows> / <SkeletonCard>  shape-of-the-content loaders, not spinners.
 * - <ErrorRetry>      the standard "this didn't load" block with a retry.
 */
import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from "react";
import { ArrowClockwise, CloudSlash, WarningOctagon } from "@phosphor-icons/react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

/* ------------------------------ error boundary --------------------------- */

type BoundaryProps = { name: string; children: ReactNode };
type BoundaryState = { error: Error | null };

export class ModuleBoundary extends Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    reportLovableError(error, { boundary: `module:${this.props.name}`, componentStack: info.componentStack });
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <ErrorRetry
        title={`${this.props.name} didn't load`}
        body="Something on this screen broke. Nothing you've entered elsewhere is affected — try loading it again."
        detail={this.state.error.message}
        onRetry={() => this.setState({ error: null })}
      />
    );
  }
}

/* --------------------------------- states -------------------------------- */

export function ErrorRetry({
  title = "This didn't load",
  body = "The connection may have dropped. You can try again.",
  detail,
  onRetry,
}: {
  title?: string;
  body?: string;
  detail?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="card-soft flex flex-col items-center px-6 py-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-maple-soft text-maple">
        <WarningOctagon weight="duotone" className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="mt-3 font-display text-base font-bold text-navy">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {detail ? <p className="mt-2 max-w-sm truncate text-xs text-muted-foreground/80">{detail}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-primary-foreground hover:bg-navy/90"
        >
          <ArrowClockwise weight="duotone" className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function SkeletonRows({ rows = 4, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="card-soft flex items-center gap-3 px-4 py-3">
          <span className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-navy-soft" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="block h-3 w-2/5 animate-pulse rounded-full bg-navy-soft" />
            <span className="block h-3 w-3/5 animate-pulse rounded-full bg-navy-soft/70" />
          </span>
          <span className="h-6 w-16 shrink-0 animate-pulse rounded-full bg-navy-soft" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ height = "h-64", className = "" }: { height?: string; className?: string }) {
  return <div aria-hidden="true" className={`card-soft ${height} animate-pulse bg-navy-soft/40 ${className}`} />;
}

/** Announce loading to assistive tech while the skeleton does the visual work. */
export function LoadingRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/* -------------------------------- offline -------------------------------- */

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}

export function OfflineBanner() {
  const online = useOnline();
  const [justBack, setJustBack] = useState(false);

  useEffect(() => {
    if (online) return;
    return () => setJustBack(true);
  }, [online]);

  useEffect(() => {
    if (!justBack) return;
    const t = setTimeout(() => setJustBack(false), 4000);
    return () => clearTimeout(t);
  }, [justBack]);

  if (online && !justBack) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-2 px-4 py-2 text-center text-xs font-semibold no-print ${
        online ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
      }`}
    >
      <CloudSlash weight="duotone" className="h-4 w-4 shrink-0" aria-hidden="true" />
      {online
        ? "Back online — anything you changed while offline has been kept."
        : "You're offline. You can keep reading; changes will be saved when the connection returns."}
    </div>
  );
}
