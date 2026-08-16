import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "sonner";
import { useRouterState } from "@tanstack/react-router";
import { Warning, ArrowLeft } from "@phosphor-icons/react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LeasingProvider } from "../lib/mock-leasing";
import { AccessProvider } from "../lib/mock-access";
import { RentProvider } from "../lib/mock-rent";
import { NoticesProvider } from "../lib/mock-notices";
import { MaintenanceProvider } from "../lib/mock-maintenance";
import { OwnersProvider } from "../lib/mock-owners";
import { CanadaProvider } from "../lib/mock-canada";
import { ConsentProvider } from "../lib/mock-consent";
import { ThemeProvider, themeBootScript } from "../lib/theme";
import { I18nProvider } from "../lib/i18n";
import { DemoBanner } from "../components/keyhold/demo-banner";


function NotFoundComponent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-surface">
      <div className="texture-dots absolute inset-0 opacity-20" aria-hidden="true" />
      <div className="relative z-10 card-soft max-w-md p-10">
        <h1 className="font-display text-6xl font-extrabold text-navy">404</h1>
        <h2 className="mt-4 font-display text-2xl font-extrabold text-navy">Page not found</h2>
        <p className="mt-2 text-muted-foreground">
          The property you're looking for doesn't seem to be in our records.
        </p>
        <div className="mt-10 flex flex-col gap-3">
          <Link 
            to="/" 
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-navy px-8 text-sm font-semibold text-primary-foreground hover:bg-navy/90"
          >
            Back to home
          </Link>
          <Link 
            to="/help" 
            className="text-sm font-semibold text-navy hover:underline"
          >
            Visit help centre
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-surface">
      <div className="card-soft max-w-md p-8 shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-maple-soft text-maple">
          <Warning weight="duotone" className="h-8 w-8" />
        </div>
        <h2 className="mt-6 font-display text-2xl font-extrabold text-navy">Something went wrong</h2>
        <p className="mt-2 text-muted-foreground">We've hit a small snag. Try reloading or heading back home.</p>
        <div className="mt-8 flex flex-col gap-3">
          <button 
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-navy text-sm font-semibold text-primary-foreground hover:bg-navy/90"
          >
            Reload page
          </button>
          <Link to="/" className="text-sm font-semibold text-navy hover:underline">Back to homepage</Link>
        </div>
        {process.env.NODE_ENV === "development" && (
          <pre className="mt-8 text-left text-[10px] overflow-auto max-h-40 p-4 bg-surface-sunk rounded-xl">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Keyhold — Rental management built for Canadian landlords" },
      {
        name: "description",
        content:
          "Keyhold is calm rental software for Canadian landlords with 2–20 units. See who paid, what's overdue and what needs repair. CA$4.99/month.",
      },
      { name: "author", content: "Keyhold" },
      { property: "og:title", content: "Keyhold — Rental management built for Canadian landlords" },
      {
        property: "og:description",
        content: "Keyhold is calm rental software for Canadian landlords with 2–20 units. See who paid, what's overdue and what needs repair. CA$4.99/month.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Keyhold — Rental management built for Canadian landlords" },
      { name: "twitter:description", content: "Keyhold is calm rental software for Canadian landlords with 2–20 units. See who paid, what's overdue and what needs repair. CA$4.99/month." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3f7f83640cb20b13d94168d7b89ab541/id-preview-b4b50835--c6901b4e-151f-484a-bdea-d64299045201.lovable.app-1786543108853.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3f7f83640cb20b13d94168d7b89ab541/id-preview-b4b50835--c6901b4e-151f-484a-bdea-d64299045201.lovable.app-1786543108853.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <a href="#main-content" className="skip-link sr-only focus:not-sr-only">Skip to content</a>
        {children}

        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <I18nProvider>
      <LeasingProvider>
        <AccessProvider>
          <RentProvider>
            <NoticesProvider>
              <MaintenanceProvider>
                <OwnersProvider>
                  <CanadaProvider>
                    <ConsentProvider>
                      <DemoGate />
                      <Outlet />
                      <Toaster richColors position="top-center" />
                    </ConsentProvider>
                  </CanadaProvider>
                </OwnersProvider>
              </MaintenanceProvider>
            </NoticesProvider>
          </RentProvider>
        </AccessProvider>
      </LeasingProvider>
      </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function DemoGate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDemo = pathname.startsWith("/app") || pathname.startsWith("/portal") || pathname.startsWith("/owner");
  if (!isDemo) return null;
  return <DemoBanner />;
}
