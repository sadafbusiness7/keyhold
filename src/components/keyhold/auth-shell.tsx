import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Key, CheckCircle } from "@phosphor-icons/react";
import authVideo from "@/assets/auth-loop.mp4.asset.json";

/** Split auth layout: looping video on the left, glass card on the right. */
export function AuthShell({
  title,
  subtitle,
  points,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  points: string[];
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-navy lg:block">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          src={authVideo.url}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/45 to-navy/90"
          aria-hidden="true"
        />
        <div className="relative flex h-full flex-col justify-between p-10 text-primary-foreground">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-foreground/15">
              <Key weight="duotone" className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-extrabold text-primary-foreground">Keyhold</span>
          </Link>
          <div>
            <h2 className="font-display text-4xl font-extrabold leading-tight text-primary-foreground">
              {subtitle}
            </h2>
            <ul className="mt-8 space-y-3 text-primary-foreground/90">
              {points.map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <CheckCircle weight="duotone" className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-primary-foreground/75">
            CA$4.99/month. No setup fees. No contracts.
          </p>
        </div>
      </section>

      <section className="relative flex items-center justify-center overflow-hidden px-4 py-12 sm:px-8">
        <div className="texture-dots pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative w-full max-w-md rounded-[26px] border border-white/50 bg-card/70 p-6 shadow-[0_24px_60px_-30px_rgba(21,50,74,0.45)] backdrop-blur-xl sm:p-8">
          <Link to="/" className="mb-7 inline-flex items-center gap-2.5 text-navy lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-primary-foreground">
              <Key weight="duotone" className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-extrabold">Keyhold</span>
          </Link>
          <h1 className="font-display text-3xl font-extrabold text-navy">{title}</h1>
          {children}
          {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </section>
    </main>
  );
}

export function SocialButtons({ onPick }: { onPick: (provider: "google" | "apple") => void }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => onPick("google")}
        className="flex min-h-12 items-center justify-center gap-2.5 rounded-full border border-border bg-card/80 text-sm font-semibold text-navy hover:bg-navy-soft"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google
      </button>
      <button
        type="button"
        onClick={() => onPick("apple")}
        className="flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-navy text-sm font-semibold text-primary-foreground hover:bg-navy/90"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M17.05 20.28c-.98.95-2.05 1.78-3.19 1.76-1.07-.02-1.42-.64-2.66-.64-1.24 0-1.64.62-2.65.66-1.12.04-2.26-.88-3.26-1.88-2.04-2.06-3.59-5.83-1.52-9.37 1.02-1.76 2.88-2.87 4.59-2.9 1.3-.02 2.53.86 3.32.86.79 0 2.26-1.07 3.82-.9 1.65.07 2.92.65 3.74 1.84-3.3 1.94-2.76 6.06.53 7.39-.81 2.02-1.89 4.02-3.72 5.18z" />
          <path d="M12.03 7.25c-.02-2.23 1.89-4.38 4.02-4.51.19 2.32-1.9 4.61-4.02 4.51z" />
        </svg>
        Apple
      </button>
    </div>

  );
}

export function OrDivider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" /> {label} <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export const authField =
  "mt-1 min-h-12 w-full rounded-xl border border-input bg-card/80 px-3 text-sm";
