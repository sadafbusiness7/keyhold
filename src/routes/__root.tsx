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

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
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
      <body>
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
                      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
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
