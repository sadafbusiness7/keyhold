/**
 * ACTIVITY / NOTIFICATION ENGINE — pure, deterministic helpers.
 * -------------------------------------------------------------
 * Shapes mirror future tables:
 *   notifications  -> { id, at, category, title, body, entity, to, read, dismissed }
 *   activity_log   -> { id, at, actorName, entityType, entityId, action, field, before, after }
 *   audit_log      -> { id, at, actorId, actorName, action, area, entityType, entityId, detail, ip }
 *
 * No value here is guessed: same inputs always produce the same output, and the
 * "now" used for relative times is a fixed demo clock so server and browser agree.
 */

/** MOCK demo clock. A backend would use the server time. */
export const NOW_ISO = "2026-08-12T13:12:00.000Z";
const NOW_MS = Date.parse(NOW_ISO);

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

/** ISO timestamp `n` milliseconds before the demo clock. */
export const ago = (ms: number) => new Date(NOW_MS - ms).toISOString();

/* ------------------------------- types ---------------------------------- */

export const NOTIF_CATEGORIES = [
  { key: "rent", label: "Rent" },
  { key: "maintenance", label: "Maintenance" },
  { key: "leases", label: "Leases" },
  { key: "system", label: "System" },
] as const;
export type NotifCategory = (typeof NOTIF_CATEGORIES)[number]["key"];

export type NotifKind =
  | "rent-received"
  | "rent-overdue"
  | "payment-failed"
  | "maintenance-submitted"
  | "maintenance-urgent"
  | "lease-expiring"
  | "notice-served"
  | "insurance-expiring"
  | "document-expiring"
  | "team-member-added"
  | "import-complete";

export type EntityType = "property" | "unit" | "tenant" | "lease" | "invoice" | "maintenance" | "document" | "user" | "import";

export type AppNotification = {
  id: string;
  at: string;
  kind: NotifKind;
  category: NotifCategory;
  title: string;
  body: string;
  /** deep link to the record */
  to: string;
  entityType: EntityType;
  entityId: string;
  /** scoping: which unit / property this belongs to, when it belongs to one */
  unitId?: string;
  propertyId?: string;
  read: boolean;
  dismissed: boolean;
};

export type ActivityEntry = {
  id: string;
  at: string;
  actorName: string;
  entityType: EntityType;
  entityId: string;
  /** plain-language summary: "Recorded a payment" */
  action: string;
  detail?: string;
  /** before -> after, when a field changed */
  field?: string;
  before?: string;
  after?: string;
};

export const AUDIT_AREAS = [
  { key: "auth", label: "Sign in" },
  { key: "access", label: "Permissions" },
  { key: "money", label: "Money" },
  { key: "records", label: "Records" },
  { key: "data", label: "Data & exports" },
  { key: "billing", label: "Subscription" },
] as const;
export type AuditArea = (typeof AUDIT_AREAS)[number]["key"];

export type AuditEntry = {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  area: AuditArea;
  action: string;
  entityType: EntityType | "account";
  entityId: string;
  detail: string;
  ip?: string;
};

/* ------------------------------- time ----------------------------------- */

/** "just now" / "12 min ago" / "3 hours ago" / "Aug 6" — against the demo clock. */
export function relativeTime(at: string, now: string = NOW_ISO) {
  const diff = Date.parse(now) - Date.parse(at);
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) {
    const m = Math.round(diff / MINUTE);
    return `${m} min ago`;
  }
  if (diff < DAY) {
    const h = Math.round(diff / HOUR);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  const d = Math.round(diff / DAY);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(at).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export const clockTime = (at: string) =>
  new Date(at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });

export const dayKey = (at: string) => at.slice(0, 10);

/** "Today" / "Yesterday" / "Thursday, August 6, 2026". */
export function dayLabel(key: string, now: string = NOW_ISO) {
  const today = dayKey(now);
  if (key === today) return "Today";
  const yesterday = dayKey(new Date(Date.parse(now) - DAY).toISOString());
  if (key === yesterday) return "Yesterday";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Newest first, grouped into day buckets that are also newest first. */
export function groupByDay<T extends { at: string }>(rows: T[], now: string = NOW_ISO) {
  const sorted = [...rows].sort((a, b) => b.at.localeCompare(a.at));
  const map = new Map<string, T[]>();
  for (const row of sorted) {
    const key = dayKey(row.at);
    const list = map.get(key);
    if (list) list.push(row);
    else map.set(key, [row]);
  }
  return [...map.entries()].map(([key, items]) => ({ key, label: dayLabel(key, now), items }));
}

/* ------------------------------ filtering -------------------------------- */

export function filterNotifications(
  rows: AppNotification[],
  opts: { category?: NotifCategory | "all"; unreadOnly?: boolean } = {},
) {
  const { category = "all", unreadOnly = false } = opts;
  return rows.filter(
    (n) => !n.dismissed && (category === "all" || n.category === category) && (!unreadOnly || !n.read),
  );
}

export function filterAudit(
  rows: AuditEntry[],
  opts: { actorId?: string; area?: AuditArea | "all"; entityType?: string; from?: string; to?: string; q?: string } = {},
) {
  const { actorId, area = "all", entityType = "all", from, to, q } = opts;
  const term = (q ?? "").trim().toLowerCase();
  return rows
    .filter((r) => (!actorId || actorId === "all" ? true : r.actorId === actorId))
    .filter((r) => area === "all" || r.area === area)
    .filter((r) => entityType === "all" || r.entityType === entityType)
    .filter((r) => (from ? dayKey(r.at) >= from : true))
    .filter((r) => (to ? dayKey(r.at) <= to : true))
    .filter((r) => (term ? `${r.actorName} ${r.action} ${r.detail}`.toLowerCase().includes(term) : true))
    .sort((a, b) => b.at.localeCompare(a.at));
}

/* ------------------------------- digest ---------------------------------- */

export type DigestSummary = {
  frequency: "daily" | "weekly";
  windowLabel: string;
  needsAttention: { label: string; count: number; to: string }[];
  happened: { label: string; count: number }[];
  total: number;
};

/**
 * The email digest is a deterministic roll-up of the same notifications the
 * bell shows — never a generated summary.
 */
export function buildDigest(
  rows: AppNotification[],
  frequency: "daily" | "weekly",
  now: string = NOW_ISO,
): DigestSummary {
  const span = frequency === "daily" ? DAY : 7 * DAY;
  const since = new Date(Date.parse(now) - span).toISOString();
  const live = rows.filter((n) => !n.dismissed && n.at >= since);

  const count = (kinds: NotifKind[]) => live.filter((n) => kinds.includes(n.kind)).length;

  const needsAttention = [
    { label: "Overdue rent", count: count(["rent-overdue", "payment-failed"]), to: "/app/rent" },
    { label: "Urgent repairs", count: count(["maintenance-urgent"]), to: "/app/maintenance" },
    { label: "Leases expiring", count: count(["lease-expiring"]), to: "/app/renewals" },
    { label: "Documents & insurance expiring", count: count(["document-expiring", "insurance-expiring"]), to: "/app/documents" },
  ].filter((r) => r.count > 0);

  const happened = [
    { label: "Rent payments received", count: count(["rent-received"]) },
    { label: "Repairs reported", count: count(["maintenance-submitted", "maintenance-urgent"]) },
    { label: "Notices served", count: count(["notice-served"]) },
    { label: "Team & account changes", count: count(["team-member-added", "import-complete"]) },
  ].filter((r) => r.count > 0);

  return {
    frequency,
    windowLabel: frequency === "daily" ? "the last 24 hours" : "the last 7 days",
    needsAttention,
    happened,
    total: live.length,
  };
}
