/**
 * NOTIFICATION CENTRE — bell dropdown + full page list.
 * Everything is scoped through usePermissions so a manager never sees a
 * notification about a property they are not assigned to.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BellRinging,
  CurrencyDollar,
  Wrench,
  FileText,
  Stamp,
  ShieldCheck,
  Folders,
  UsersThree,
  UploadSimple,
  WarningOctagon,
  CheckCircle,
  X,
  Check,
} from "@phosphor-icons/react";
import { usePermissions } from "@/lib/mock-access";
import { useNotifications } from "@/lib/mock-notifications";
import {
  NOTIF_CATEGORIES,
  clockTime,
  filterNotifications,
  groupByDay,
  relativeTime,
  type AppNotification,
  type NotifCategory,
  type NotifKind,
} from "@/lib/activity-engine";
import { EmptyState } from "./empty-state";

const ICONS: Record<NotifKind, typeof Bell> = {
  "rent-received": CheckCircle,
  "rent-overdue": CurrencyDollar,
  "payment-failed": WarningOctagon,
  "maintenance-submitted": Wrench,
  "maintenance-urgent": WarningOctagon,
  "lease-expiring": FileText,
  "notice-served": Stamp,
  "insurance-expiring": ShieldCheck,
  "document-expiring": Folders,
  "team-member-added": UsersThree,
  "import-complete": UploadSimple,
};

const TONE: Record<NotifCategory, string> = {
  rent: "bg-action-soft text-action",
  maintenance: "bg-warning-soft text-warning",
  leases: "bg-navy-soft text-navy",
  system: "bg-muted text-muted-foreground",
};

/** Notifications this signed-in user is allowed to see. */
export function useVisibleNotifications() {
  const { notifications } = useNotifications();
  const perms = usePermissions();
  return useMemo(() => {
    const allowed = new Set(perms.properties.map((p) => p.id));
    const money = perms.canSeeFinancials();
    return notifications.filter((n) => {
      if (n.propertyId && !allowed.has(n.propertyId)) return false;
      if (n.category === "rent" && !money) return false;
      if ((n.kind === "team-member-added" || n.kind === "import-complete") && !perms.isOwner) return false;
      return true;
    });
  }, [notifications, perms]);
}

function Row({
  n,
  onNavigate,
  compact = false,
}: {
  n: AppNotification;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const { markRead, markUnread, dismiss } = useNotifications();
  const navigate = useNavigate();
  const Icon = ICONS[n.kind] ?? Bell;

  return (
    <li className={`group relative flex gap-3 rounded-xl p-2.5 ${n.read ? "" : "bg-navy-soft/50"}`}>
      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${TONE[n.category]}`}>
        <Icon weight="duotone" className="h-4.5 w-4.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => {
            markRead(n.id);
            onNavigate?.();
            navigate({ to: n.to });
          }}
          className="block w-full text-left"
        >
          <span className="flex items-start gap-2">
            {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-action" aria-hidden="true" />}
            <span className="text-sm font-semibold text-navy">{n.title}</span>
          </span>
          <span className={`mt-0.5 block text-xs text-muted-foreground ${compact ? "line-clamp-2" : ""}`}>{n.body}</span>
          <span className="mt-1 block text-xs text-muted-foreground">
            <time dateTime={n.at}>{relativeTime(n.at)}</time> · {clockTime(n.at)}
            <span className="sr-only"> — opens the record</span>
          </span>
        </button>
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <button
          type="button"
          onClick={() => (n.read ? markUnread(n.id) : markRead(n.id))}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-navy-soft hover:text-navy focus-visible:bg-navy-soft"
          aria-label={n.read ? `Mark "${n.title}" unread` : `Mark "${n.title}" read`}
          title={n.read ? "Mark unread" : "Mark read"}
        >
          <Check weight="bold" className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => dismiss(n.id)}
          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-navy-soft hover:text-navy focus-visible:bg-navy-soft"
          aria-label={`Dismiss "${n.title}"`}
          title="Dismiss"
        >
          <X weight="bold" className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

/** Bell + dropdown for the top bar. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const rows = useVisibleNotifications();
  const { markAllRead } = useNotifications();
  const wrap = useRef<HTMLDivElement>(null);
  const unread = rows.filter((n) => !n.read && !n.dismissed).length;
  const live = filterNotifications(rows).slice(0, 6);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative grid h-11 w-11 place-items-center rounded-full border border-border text-navy hover:bg-navy-soft"
      >
        {unread > 0 ? (
          <BellRinging weight="duotone" className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Bell weight="duotone" className="h-5 w-5" aria-hidden="true" />
        )}
        {unread > 0 && (
          <span className="tnum absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-action px-1 text-[11px] font-bold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <p className="text-sm font-bold text-navy">Notifications</p>
            <button
              type="button"
              onClick={markAllRead}
              className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-action hover:bg-action-soft"
            >
              Mark all read
            </button>
          </div>
          {live.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            <ul className="max-h-[24rem] space-y-1 overflow-y-auto p-2">
              {live.map((n) => (
                <Row key={n.id} n={n} compact onNavigate={() => setOpen(false)} />
              ))}
            </ul>
          )}
          <div className="border-t border-border p-2">
            <Link
              to="/app/notifications"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center justify-center rounded-full bg-navy text-sm font-semibold text-primary-foreground hover:bg-navy/90"
            >
              See all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/** Full page list: grouped by day, filterable. */
export function NotificationCentre() {
  const rows = useVisibleNotifications();
  const { markAllRead, clearDismissed } = useNotifications();
  const [category, setCategory] = useState<NotifCategory | "all">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const live = filterNotifications(rows, { category, unreadOnly });
  const groups = groupByDay(live);
  const unread = rows.filter((n) => !n.read && !n.dismissed).length;

  const counts = (key: NotifCategory | "all") => filterNotifications(rows, { category: key }).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Filter notifications" className="flex flex-wrap gap-1.5">
          {(["all", ...NOTIF_CATEGORIES.map((c) => c.key)] as const).map((key) => {
            const label = key === "all" ? "All" : NOTIF_CATEGORIES.find((c) => c.key === key)!.label;
            const active = category === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setCategory(key)}
                className={`min-h-11 rounded-full px-3.5 text-sm font-semibold ${
                  active ? "bg-navy text-primary-foreground" : "border border-border text-navy hover:bg-navy-soft"
                }`}
              >
                {label} <span className="tnum opacity-70">{counts(key)}</span>
              </button>
            );
          })}
        </div>
        <label className="ml-auto flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border px-3.5 text-sm font-semibold text-navy">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="h-4 w-4 accent-action"
          />
          Unread only ({unread})
        </label>
        <button
          type="button"
          onClick={markAllRead}
          className="min-h-11 rounded-full border border-border px-3.5 text-sm font-semibold text-navy hover:bg-navy-soft"
        >
          Mark all read
        </button>
        <button
          type="button"
          onClick={clearDismissed}
          className="min-h-11 rounded-full border border-border px-3.5 text-sm font-semibold text-navy hover:bg-navy-soft"
        >
          Dismiss all
        </button>
      </div>

      {live.length === 0 ? (
        <EmptyState
          Icon={Bell}
          title="Nothing here"
          body="When rent arrives, a repair comes in or a lease nears its end, it shows up here — with a link straight to the record."
        />
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.key} aria-label={g.label}>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{g.label}</h2>
              <ul className="space-y-1 rounded-2xl border border-border bg-card p-2">
                {g.items.map((n) => (
                  <Row key={n.id} n={n} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
