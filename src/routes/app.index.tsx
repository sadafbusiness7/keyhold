import { createFileRoute, Link } from "@tanstack/react-router";
import {
  House,
  Wrench,
  FileText,
  Plus,
  CalendarBlank,
  ArrowRight,
  Buildings,
  ChatCircleDots,
  Receipt,
  CheckCircle,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/keyhold/app-shell";
import { RailCard, StatusLabel } from "@/components/keyhold/status";
import { EmptyState } from "@/components/keyhold/empty-state";

import {
  cad,
  tenantById,
  unitAddress,
  longDate,
  calendarEvents,
} from "@/lib/mock-data";
import { usePermissions } from "@/lib/mock-access";
import { DashboardAnalytics } from "@/components/keyhold/dashboard-analytics";
import { DemoTour } from "@/components/keyhold/demo-tour";


export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Your morning view — Keyhold" },
      { name: "description", content: "See who paid, what's overdue and what needs your attention today." },
      { property: "og:title", content: "Your morning view — Keyhold" },
      { property: "og:description", content: "Rent collected, urgent repairs and lease renewals at a glance." },
    ],
  }),
  component: Dashboard,
});

function StatTile({
  Icon,
  value,
  label,
  tone,
  to,
}: {
  Icon: typeof House;
  value: string;
  label: string;
  tone: "success" | "warning" | "action";
  to: string;
}) {
  const chip =
    tone === "success" ? "bg-success-soft text-success" : tone === "warning" ? "bg-warning-soft text-warning" : "bg-action-soft text-action";
  const rail = tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-action";
  return (
    <Link
      to={to}
      className="relative block overflow-hidden card-soft p-4 pl-5 transition-shadow hover:shadow-md"
    >
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${rail}`} />
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${chip}`}>
        <Icon weight="duotone" className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-3 font-display text-2xl font-extrabold tnum text-navy">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </Link>
  );
}

function Dashboard() {
  const { user, isOwner, properties, units, rentRows, tickets, leases, canSeeFinancials, canSeeReports } = usePermissions();

  const expectedRent = rentRows.reduce((s, r) => s + r.rent, 0);
  const receivedRent = rentRows.reduce((s, r) => s + (r.rent - r.balance), 0);
  const owedRent = rentRows.reduce((s, r) => s + r.balance, 0);
  const occupiedUnits = units.filter((u) => u.tenantId).length;
  const needsYou = tickets.filter((t) => t.status !== "resolved").length;
  const leasesEndingSoon = leases.filter((l) => new Date(l.end) <= new Date("2026-10-01")).length;
  const showMoney = canSeeFinancials() && expectedRent > 0;
  const pct = expectedRent > 0 ? receivedRent / expectedRent : 0;
  const emergencies = tickets.filter((t) => t.status === "emergency");
  const unpaid = rentRows.filter((r) => r.balance > 0);
  const upcoming = calendarEvents.slice(0, 3);
  const renewals = leases.filter((l) => new Date(l.end) <= new Date("2026-10-01"));

  return (
    <>
      <PageHeader
        title={`Good morning, ${user.name.split(" ")[0]}`}
        subtitle={
          isOwner
            ? "Sunday, August 9, 2026 · Here's what matters today."
            : `Sunday, August 9, 2026 · ${properties.length} ${properties.length === 1 ? "property" : "properties"} you manage.`
        }
        action={
          canSeeFinancials() ? (
          <Link
            to="/app/rent"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
          >
            <Plus weight="duotone" className="h-5 w-5" aria-hidden="true" />
            Record a payment
          </Link>
          ) : null
        }
      />

      {/* 1. Money and portfolio, visualised */}
      {showMoney ? (
        <DashboardAnalytics />
      ) : (
        <section aria-labelledby="money-heading" className="texture-bloom mb-6">
          <h2 id="money-heading" className="mb-2 font-display text-lg font-bold">
            Your work today
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile Icon={House} value={`${occupiedUnits} of ${units.length}`} label="Homes lived in" tone="success" to="/app/properties" />
            <StatTile Icon={Wrench} value={String(needsYou)} label="Needs you" tone="warning" to="/app/maintenance" />
          </div>
          <p className="mt-3 rounded-2xl bg-surface-sunk p-4 text-xs text-muted-foreground">
            Rent and reports are hidden at your access level.
          </p>
        </section>
      )}

      {/* 2. What could go wrong */}
      <section aria-labelledby="risk-heading" className="mb-6">
        <h2 id="risk-heading" className="mb-2 font-display text-lg font-bold">
          What could go wrong
        </h2>
        <ul className="space-y-2">
          {emergencies.map((t) => (
            <RailCard as="li" key={t.id} status="emergency" className="p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusLabel status="emergency" />
                    <p className="font-display font-bold text-navy">{t.title}</p>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{unitAddress(t.unitId)} · {tenantById(t.tenantId)?.name}</p>
                </div>
                <Link
                  to="/app/maintenance"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-maple px-4 text-sm font-semibold text-primary-foreground hover:bg-maple/90"
                >
                  Handle now <ArrowRight weight="duotone" className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </RailCard>
          ))}
          {unpaid.map((r) => (
            <RailCard as="li" key={r.id} status={r.status} className="p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusLabel status={r.status} />
                    <p className="font-display font-bold text-navy">{tenantById(r.tenantId)?.name}</p>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {unitAddress(r.unitId)} · due {longDate(r.dueDate)}
                  </p>
                </div>
                <p className="money text-right text-xl font-extrabold text-navy">{cad(r.balance)}</p>
              </div>
            </RailCard>
          ))}
          {emergencies.length === 0 && unpaid.length === 0 ? (
            <li>
              <EmptyState
                Icon={CheckCircle}
                title="Nothing needs you right now"
                body="Every home is paid up and no repairs are open. We'll surface anything urgent here."
              />
            </li>
          ) : null}
        </ul>

      </section>

      {/* 3. Time-sensitive */}
      <section aria-labelledby="time-heading" className="mb-6">
        <h2 id="time-heading" className="mb-2 font-display text-lg font-bold">
          Coming up soon
        </h2>
        <div className="grid min-w-0 gap-3 lg:grid-cols-2">
          {canSeeFinancials() ? (
          <div className="card-soft min-w-0 p-4">
            <h3 className="font-display text-base font-bold">Leases ending</h3>
            <ul className="mt-2 space-y-2">
              {renewals.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{tenantById(l.tenantId)?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{unitAddress(l.unitId)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning tnum">
                    Ends {longDate(l.end)}
                  </span>
                </li>
              ))}
            </ul>
            <Link to="/app/leases" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-action">
              See all leases <ArrowRight weight="duotone" className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          ) : null}
          <div className="card-soft min-w-0 p-4">
            <h3 className="font-display text-base font-bold">This week</h3>
            <ul className="mt-2 space-y-2">
              {upcoming.map((e) => (
                <li key={e.id} className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <CalendarBlank weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-action" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{e.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{longDate(e.date)} · {e.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link to="/app/calendar" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-action">
              Open calendar <ArrowRight weight="duotone" className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Portfolio snapshot */}
      <section aria-labelledby="portfolio-heading" className="mb-6">
        <h2 id="portfolio-heading" className="mb-2 font-display text-lg font-bold">
          Your places
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => {
            const own = units.filter((u) => u.propertyId === p.id);
            const filled = own.filter((u) => u.tenantId).length;
            return (
              <RailCard as="li" key={p.id} status={filled === own.length ? "occupied" : "vacant"} className="p-4">
                <div className="flex items-start gap-3">
                  <Buildings weight="duotone" className="h-6 w-6 shrink-0 text-navy" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate font-display font-bold text-navy">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.address}, {p.city} {p.province} {p.postalCode}
                    </p>
                    <p className="mt-2 text-sm text-foreground tnum">
                      {filled} of {own.length} homes lived in
                    </p>
                  </div>
                </div>
              </RailCard>
            );
          })}
        </ul>
      </section>

      {/* 5. Quick actions */}
      <section aria-labelledby="quick-heading">
        <h2 id="quick-heading" className="mb-2 font-display text-lg font-bold">
          Quick things you can do
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: "/app/rent", label: "Record a payment", Icon: Receipt, money: true },
            { to: "/app/leases/new", label: "Start a lease or notice", Icon: FileText, money: true },
            { to: "/app/maintenance", label: "Log a repair", Icon: Wrench, money: false },
            { to: "/app/messages", label: "Message a tenant", Icon: ChatCircleDots, money: false },
            ...(canSeeReports && isOwner
              ? [{ to: "/app/team", label: "Invite a manager", Icon: Receipt, money: false }]
              : []),
          ]
            .filter((q) => !q.money || canSeeFinancials())
            .map(({ to, label, Icon }) => (
            <Link
              key={to + label}
              to={to}
              className="flex min-h-11 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-sm font-semibold text-navy hover:bg-navy-soft"
            >
              <Icon weight="duotone" className="h-5 w-5 shrink-0 text-action" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>
      </section>
      <DemoTour />
    </>
  );
}
