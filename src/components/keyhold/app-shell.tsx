import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowsClockwise,
  ClipboardText,
  Toolbox,
  Megaphone,
  House,
  Buildings,
  CurrencyDollar,
  Users,
  Wrench,
  FileText,
  CalendarBlank,
  Folders,
  ChatCircleDots,
  ChartBar,
  HandCoins,
  Gear,
  Question,
  List,
  X,
  CaretLeft,
  CaretRight,
  Key,
  UsersThree,
  Storefront,
  UserFocus,
  Stamp,
  PaperPlaneTilt,
  UploadSimple,
  Receipt,
  ChartLineUp,
  TrendUp,
  Bell,
  Scales,
  Keyboard,

} from "@phosphor-icons/react";
import { AskKeyhold } from "./ask-keyhold";
import { ThemeToggleButton } from "./appearance-menu";
import { useT, useTx } from "@/lib/i18n";
import { AccountMenu } from "./account-menu";
import { DemoSwitcher } from "./demo-switcher";
import { usePermissions } from "@/lib/mock-access";
import { GlobalSearch, CommandPalette, ShortcutsSheet } from "./global-search";
import { ModuleBoundary, OfflineBanner } from "./module-boundary";
import { ShortcutsProvider, useShortcuts } from "@/lib/shortcuts";
import { NotificationBell } from "./notification-panels";
import { SetupChecklist } from "./setup-checklist";
import { useOptionalMessages } from "@/lib/mock-messages";
import { useOptionalNotifications } from "@/lib/mock-notifications";
import { useOptionalSettings } from "@/lib/mock-settings";
import { monthlyCents, planFor } from "@/lib/plan-engine";
import { money } from "@/lib/rent-engine";


const nav = [
  { to: "/app", tKey: "nav.dashboard", label: "Dashboard", Icon: House, exact: true, need: "any" },
  { to: "/app/properties", tKey: "nav.properties", label: "Properties & units", Icon: Buildings, need: "any" },
  { to: "/app/listings", tKey: "nav.listings", label: "Listings", Icon: Storefront, need: "any" },
  { to: "/app/prospects", tKey: "nav.prospects", label: "Prospects", Icon: UserFocus, need: "sensitive" },
  { to: "/app/rent", tKey: "nav.rent", label: "Rent", Icon: CurrencyDollar, need: "money" },
  { to: "/app/tenants", tKey: "nav.tenants", label: "Tenants", Icon: Users, need: "sensitive" },
  { to: "/app/maintenance", tKey: "nav.maintenance", label: "Maintenance", Icon: Wrench, need: "any" },
  { to: "/app/leases", tKey: "nav.leases", label: "Leases & notices", Icon: FileText, need: "sensitive" },
  { to: "/app/renewals", tKey: "nav.renewals", label: "Renewals", Icon: ArrowsClockwise, need: "sensitive" },
  { to: "/app/notices", tKey: "nav.notices", label: "Provincial notices", Icon: Stamp, need: "sensitive" },
  { to: "/app/forms", tKey: "nav.forms", label: "Forms", Icon: FileText, need: "sensitive" },
  { to: "/app/bulk", tKey: "nav.bulk", label: "Bulk actions", Icon: PaperPlaneTilt, need: "sensitive" },
  { to: "/app/inspections", tKey: "nav.inspections", label: "Inspections", Icon: ClipboardText, need: "any" },
  { to: "/app/assets", tKey: "nav.assets", label: "Assets", Icon: Toolbox, need: "any" },
  { to: "/app/announcements", tKey: "nav.announcements", label: "Announcements", Icon: Megaphone, need: "any" },
  { to: "/app/calendar", tKey: "nav.calendar", label: "Calendar", Icon: CalendarBlank, need: "any" },
  { to: "/app/documents", tKey: "nav.documents", label: "Documents", Icon: Folders, need: "any" },
  { to: "/app/messages", tKey: "nav.messages", label: "Messages", Icon: ChatCircleDots, need: "any" },
  { to: "/app/notifications", tKey: "nav.notifications", label: "Notifications", Icon: Bell, need: "any" },
  { to: "/app/disbursements", tKey: "nav.disbursements", label: "Owner payouts", Icon: HandCoins, need: "money" },
  { to: "/app/tax", tKey: "nav.tax", label: "Tax package", Icon: Receipt, need: "money" },
  { to: "/app/credit-reporting", tKey: "nav.creditReporting", label: "Rent reporting", Icon: ChartLineUp, need: "sensitive" },
  { to: "/app/rent-increases", tKey: "nav.rentIncreases", label: "Rent increases", Icon: TrendUp, need: "money" },
  { to: "/app/reports", tKey: "nav.reports", label: "Reports", Icon: ChartBar, need: "reports" },
  { to: "/app/insights", tKey: "nav.insights", label: "Insights", Icon: ChartLineUp, need: "reports" },
  { to: "/app/team", tKey: "nav.team", label: "Team & access", Icon: UsersThree, need: "owner" },
  { to: "/app/import", tKey: "nav.import", label: "Import data", Icon: UploadSimple, need: "owner" },
  { to: "/app/settings", tKey: "nav.settings", label: "Settings", Icon: Gear, need: "owner" },
  { to: "/app/legal", tKey: "nav.legal", label: "Legal & privacy", Icon: Scales, need: "any" },
  { to: "/app/support", tKey: "nav.support", label: "Support centre", Icon: Question, need: "any" },
] as const;

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const t = useT();
  const perms = usePermissions();
  const messages = useOptionalMessages();
  const unread = messages?.unreadCount ?? 0;
  const notifs = useOptionalNotifications();
  const unreadNotifs = notifs?.unreadCount ?? 0;
  const allowed = nav.filter(({ need }) =>
    need === "owner"
      ? perms.isOwner
      : need === "money" || need === "sensitive"
        ? perms.canSeeFinancials()
        : need === "reports"
          ? perms.canSeeReports
          : true,
  );
  return (
    <ul className="space-y-1 px-3">
      {allowed.map(({ to, tKey, label, Icon, ...rest }) => {
        const text = t(tKey) || label;
        const exact = "exact" in rest && rest.exact;
        const active = exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
        return (
          <li key={to}>
            <Link
              to={to}
              onClick={onNavigate}
              title={collapsed ? text : undefined}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-full px-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-navy text-primary-foreground"
                  : "text-navy hover:bg-navy-soft"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon weight="duotone" className="h-5 w-5 shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">{text}</span>}
              {collapsed && <span className="sr-only">{text}</span>}
              {((to === "/app/messages" && unread > 0) || (to === "/app/notifications" && unreadNotifs > 0)) && (
                <span
                  className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold ${
                    active ? "bg-primary-foreground text-navy" : "bg-action text-primary-foreground"
                  } ${collapsed ? "absolute" : "ml-auto"}`}
                >
                  {to === "/app/messages" ? unread : unreadNotifs}
                  <span className="sr-only">{t("ui.unread")}</span>
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 text-navy">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy text-primary-foreground">
        <Key weight="duotone" className="h-5 w-5" aria-hidden="true" />
      </span>
      {!compact && <span className="font-display text-lg font-extrabold tracking-tight">Keyhold</span>}
    </Link>
  );
}


/** Live plan-limit counter. Owners only; never blocks anything. */
function UnitCounter() {
  const perms = usePermissions();
  const settings = useOptionalSettings();
  if (!perms.isOwner || !settings) return null;
  const used = perms.units.length;
  const included = settings.subscription.includedUnits;
  const over = used > included;
  const next = planFor(used);
  return (
    <div className="px-3 pb-2">
      <Link
        to="/app/settings"
        className={`block rounded-xl border p-2.5 ${over ? "border-warning bg-warning-soft/50" : "border-sidebar-border"}`}
      >
        <span className="tnum block text-xs font-semibold text-navy">
          {used} of {included} homes
        </span>
        <span className="block text-xs text-muted-foreground">
          {over
            ? `You've outgrown this plan — ${next.name} covers ${used} homes for ${money(monthlyCents(used))}/mo.`
            : `Your plan covers up to ${included}.`}
        </span>
      </Link>
    </div>
  );
}

/** Small, discoverable entry point to the shortcut cheat sheet. */
function ShortcutsButton() {
  const { setCheatOpen } = useShortcuts();
  return (
    <button
      type="button"
      onClick={() => setCheatOpen(true)}
      title="Keyboard shortcuts (?)"
      className="hidden h-11 w-11 place-items-center rounded-full border border-border text-navy transition-colors hover:bg-navy-soft lg:grid"
    >
      <Keyboard weight="duotone" className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">Keyboard shortcuts</span>
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ShortcutsProvider>
      <AppShellInner>{children}</AppShellInner>
    </ShortcutsProvider>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="min-h-screen w-full">
      <OfflineBanner />
      {/* Desktop sidebar */}

      <aside
        className={`fixed inset-y-0 start-0 z-30 hidden flex-col border-e border-sidebar-border bg-sidebar py-4 lg:flex ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className={`flex items-center px-5 pb-4 ${collapsed ? "justify-center px-0" : "justify-between"}`}>
          <Brand compact={collapsed} />
        </div>
        <nav aria-label="Main" className="flex-1 overflow-y-auto">
          <NavList collapsed={collapsed} />
        </nav>
        <div className="pt-3">
          {!collapsed && <SetupChecklist />}
          {!collapsed && <UnitCounter />}
          <DemoSwitcher compact={collapsed} position="static" />
        </div>
        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-sidebar-border text-sm font-medium text-navy hover:bg-navy-soft"
          >
            {collapsed ? <CaretRight weight="duotone" className="h-4 w-4" /> : <CaretLeft weight="duotone" className="h-4 w-4" />}
            {!collapsed && "Collapse menu"}
            {collapsed && <span className="sr-only">Expand menu</span>}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-sidebar px-4 py-3 lg:hidden">
        <Brand />
        <GlobalSearch />
        <NotificationBell />
        <AccountMenu />
        <button
          type="button"
          onClick={() => setDrawer(true)}
          className="grid h-11 w-11 place-items-center rounded-full border border-border text-navy"
          aria-label="Open menu"
        >
          <List weight="duotone" className="h-5 w-5" />
        </button>
      </header>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-navy/40"
            aria-label="Close menu"
            onClick={() => setDrawer(false)}
          />
          <div className="absolute inset-y-0 start-0 flex w-72 flex-col bg-sidebar py-4 shadow-xl">
            <div className="flex items-center justify-between px-5 pb-4">
              <Brand />
              <button
                type="button"
                onClick={() => setDrawer(false)}
                className="grid h-11 w-11 place-items-center rounded-full border border-border text-navy"
                aria-label="Close menu"
              >
                <X weight="duotone" className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Main" className="flex-1 overflow-y-auto">
              <NavList collapsed={false} onNavigate={() => setDrawer(false)} />
            </nav>
            <div className="pt-3">
              <SetupChecklist onNavigate={() => setDrawer(false)} />
              <UnitCounter />
              <DemoSwitcher position="static" />
            </div>
          </div>
        </div>
      )}

      <div className={`${collapsed ? "lg:ps-20" : "lg:ps-64"}`}>
        {/* Desktop top bar with global search */}
        <header className="sticky top-0 z-20 hidden border-b border-border bg-sidebar/90 backdrop-blur lg:block">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-end gap-3 px-6 py-3">
            <GlobalSearch />
            <ShortcutsButton />
            <ThemeToggleButton />
            <NotificationBell />
            <AccountMenu />
          </div>
        </header>
        <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:px-6 lg:py-10" tabIndex={-1}>
          <ModuleBoundary name={tx(title) || "This screen"}>{children}</ModuleBoundary>
        </main>
      </div>

      <AskKeyhold />
      <CommandPalette />
      <ShortcutsSheet />
    </div>
  );
}


export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const tx = useTx();
  return (
    <header className="texture-bloom mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0 border-l-4 border-navy pl-4">
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{tx(title)}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{tx(subtitle)}</p>}
      </div>
      {action}
    </header>
  );
}
