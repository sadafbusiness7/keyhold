import { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Buildings, CaretRight, Key } from "@phosphor-icons/react";
import { ThemeToggleButton } from "@/components/keyhold/appearance-menu";

interface MarketingShellProps {
  children: ReactNode;
}

export function MarketingShell({ children }: MarketingShellProps) {
  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur-md">
        <nav className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-white">
              <Key weight="duotone" className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-extrabold text-navy">Keyhold</span>
          </Link>
          <ul className="hidden items-center justify-center gap-8 lg:flex">
             <li><Link to="/features" className="text-sm font-medium text-muted-foreground hover:text-navy">Features</Link></li>
             <li><Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-navy">Pricing</Link></li>
             <li><Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-navy">About</Link></li>
             <li><Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-navy">Resources</Link></li>
          </ul>
          <div className="flex items-center gap-2 justify-self-end">
            <ThemeToggleButton />
            <Link to="/signin" className="hidden min-h-11 items-center rounded-full px-4 text-sm font-semibold text-navy hover:bg-navy-soft sm:inline-flex">Sign in</Link>
            <Link to="/signup" className="inline-flex min-h-11 items-center rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90">Start free</Link>
          </div>
        </nav>
      </header>

      {pathParts.length > 0 && (
        <nav className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <li><Link to="/" className="hover:text-navy">Home</Link></li>
            {pathParts.map((part, index) => {
              const href = `/${pathParts.slice(0, index + 1).join("/")}`;
              const isLast = index === pathParts.length - 1;
              return (
                <li key={href} className="flex items-center gap-2">
                  <CaretRight weight="bold" className="h-2 w-2" />
                  {isLast ? (
                    <span className="text-navy">{part.replace(/-/g, " ")}</span>
                  ) : (
                    <Link to={href as any} className="hover:text-navy">{part.replace(/-/g, " ")}</Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <main className="flex-1">{children}</main>

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="card-soft bg-navy p-10 text-center text-primary-foreground">
            <h2 className="font-display text-3xl font-extrabold">Ready for a calmer rent month?</h2>
            <p className="mt-4 text-primary-foreground/70">Join hundreds of Canadian landlords who stopped using spreadsheets.</p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                <Link to="/signup" className="inline-flex min-h-12 items-center justify-center rounded-full bg-action px-8 text-base font-bold text-primary-foreground hover:bg-action/90">Get started for free</Link>
                <Link to="/pricing" className="inline-flex min-h-12 items-center justify-center rounded-full border border-primary-foreground/20 px-8 text-base font-bold text-primary-foreground hover:bg-white/10">View pricing</Link>
            </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface-sunk py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-4 text-sm">
            <div className="col-span-2">
                <div className="flex items-center gap-2 text-navy">
                    <Key weight="duotone" className="h-6 w-6" />
                    <span className="font-display text-lg font-extrabold">Keyhold</span>
                </div>
                <p className="mt-4 max-w-xs text-muted-foreground leading-relaxed">
                    Calm rental management software built in Hamilton, ON for Canadian landlords with 2–20 units.
                </p>
            </div>
            <div>
                <h4 className="font-bold text-navy uppercase tracking-widest text-xs">Product</h4>
                <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li><Link to="/features" className="hover:text-navy">Features</Link></li>
                    <li><Link to="/pricing" className="hover:text-navy">Pricing</Link></li>
                    <li><Link to="/roadmap" className="hover:text-navy">Roadmap</Link></li>
                    <li><Link to="/help" className="hover:text-navy">Help centre</Link></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-navy uppercase tracking-widest text-xs">Comparisons</h4>
                <ul className="mt-4 space-y-2 text-muted-foreground">
                    <li><Link to="/vs/buildium" className="hover:text-navy">vs Buildium</Link></li>
                    <li><Link to="/vs/doorloop" className="hover:text-navy">vs DoorLoop</Link></li>
                    <li><Link to="/vs/spreadsheets" className="hover:text-navy">vs Spreadsheets</Link></li>
                </ul>
            </div>
        </div>
        <div className="mt-12 border-t border-border pt-8 text-center text-xs text-muted-foreground">
            © 2026 Keyhold. Made in Canada.
        </div>
      </footer>
    </div>
  );
}
