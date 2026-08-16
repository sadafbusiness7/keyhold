import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Key,
  House,
  CurrencyDollar,
  Wrench,
  FileText,
  ChatCircleDots,
  UserCircle,
  ShieldWarning,
} from "@phosphor-icons/react";
import { AskKeyhold } from "@/components/keyhold/ask-keyhold";
import { AccountMenu } from "@/components/keyhold/account-menu";
import {
  PortalHome,
  PortalRent,
  PortalRepairs,
  PortalDocs,
  PortalMessages,
  PortalProfile,
  PortalSos,
  usePortalScope,
  type PortalTab,
} from "@/components/keyhold/portal-screens";
import { DemoSwitcher } from "@/components/keyhold/demo-switcher";


export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Your home — Keyhold tenant portal" },
      { name: "description", content: "Pay rent, download receipts, report a repair with photos, read your lease and message your landlord." },
      { property: "og:title", content: "Your home — Keyhold tenant portal" },
      { property: "og:description", content: "Rent, repairs, lease and messages for your home — in one simple place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Portal,
});

const TABS: { id: PortalTab; label: string; Icon: typeof House }[] = [
  { id: "home", label: "Home", Icon: House },
  { id: "rent", label: "Rent", Icon: CurrencyDollar },
  { id: "repairs", label: "Repairs", Icon: Wrench },
  { id: "docs", label: "Lease", Icon: FileText },
  { id: "messages", label: "Messages", Icon: ChatCircleDots },
];

function Portal() {
  const scope = usePortalScope();
  const [tab, setTab] = useState<PortalTab>("home");
  const [sos, setSos] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-[calc(72px+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 border-b border-border bg-sidebar px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 text-navy">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-primary-foreground">
              <Key weight="duotone" className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-base font-extrabold">Keyhold</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSos(true)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-maple px-3 text-sm font-bold text-primary-foreground"
            >
              <ShieldWarning weight="duotone" className="h-5 w-5" aria-hidden="true" />
              Urgent
            </button>
            <button
              type="button"
              onClick={() => setTab("profile")}
              aria-label="Your profile"
              className={`grid min-h-11 min-w-11 place-items-center rounded-full border ${
                tab === "profile" ? "border-action text-action" : "border-border text-navy"
              }`}
            >
              <UserCircle weight="duotone" className="h-6 w-6" aria-hidden="true" />
            </button>
            <DemoSwitcher compact position="static" />
            <AccountMenu />

          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {tab === "home" && <PortalHome scope={scope} go={setTab} />}
        {tab === "rent" && <PortalRent scope={scope} />}
        {tab === "repairs" && <PortalRepairs scope={scope} />}
        {tab === "docs" && <PortalDocs scope={scope} />}
        {tab === "messages" && <PortalMessages scope={scope} />}
        {tab === "profile" && <PortalProfile scope={scope} />}
      </main>

      <nav
        aria-label="Portal sections"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-sidebar pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto flex max-w-2xl">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <li key={id} className="flex-1">
                <button
                  type="button"
                  onClick={() => setTab(id)}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-[68px] w-full flex-col items-center justify-center gap-1 px-1 text-xs font-semibold ${
                    active ? "text-action" : "text-muted-foreground"
                  }`}
                >
                  <Icon weight="duotone" className="h-6 w-6" aria-hidden="true" />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {sos && <PortalSos scope={scope} onClose={() => setSos(false)} />}
      <AskKeyhold bottomClass="bottom-[calc(84px+env(safe-area-inset-bottom))] sm:bottom-[calc(84px+env(safe-area-inset-bottom))]" />
    </div>
  );
}
