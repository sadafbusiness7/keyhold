/**
 * AUDIT LOG (owner-only) + EMAIL DIGEST preview.
 * The audit log merges the security/money events recorded here with the
 * team access log, so one screen answers "who changed what".
 */
import { useMemo, useState } from "react";
import { ShieldCheck, DownloadSimple, EnvelopeSimple, ArrowRight } from "@phosphor-icons/react";
import { toast } from "sonner";
import { usePermissions } from "@/lib/mock-access";
import { useNotifications } from "@/lib/mock-notifications";
import { useVisibleNotifications } from "./notification-panels";
import { downloadFile, toCsv } from "@/lib/rent-engine";
import {
  AUDIT_AREAS,
  buildDigest,
  clockTime,
  dayLabel,
  filterAudit,
  groupByDay,
  relativeTime,
  type AuditArea,
  type AuditEntry,
} from "@/lib/activity-engine";

const ENTITY_OPTIONS = ["all", "account", "invoice", "lease", "property", "unit", "tenant", "user", "document"] as const;

const AREA_TONE: Record<AuditArea, string> = {
  auth: "bg-muted text-muted-foreground",
  access: "bg-navy-soft text-navy",
  money: "bg-action-soft text-action",
  records: "bg-warning-soft text-warning",
  data: "bg-muted text-muted-foreground",
  billing: "bg-action-soft text-action",
};

export function AuditLogPanel() {
  const perms = usePermissions();
  const { audit } = useNotifications();
  const [actorId, setActorId] = useState("all");
  const [area, setArea] = useState<AuditArea | "all">("all");
  const [entityType, setEntityType] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");

  /** Team permission changes already live in the access log — fold them in. */
  const merged = useMemo<AuditEntry[]>(() => {
    const fromAccess: AuditEntry[] = perms.accessLog.map((l) => ({
      id: `acc_${l.id}`,
      at: l.at,
      actorId: l.actorId,
      actorName: l.actorName,
      area: "access",
      action: `Access ${l.action.replace("-", " ")}`,
      entityType: "user",
      entityId: l.targetUserId,
      detail: l.detail,
    }));
    return [...audit, ...fromAccess];
  }, [audit, perms.accessLog]);

  const rows = filterAudit(merged, { actorId, area, entityType, from, to, q });
  const groups = groupByDay(rows);

  if (!perms.isOwner) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-base font-bold text-navy">The audit log is owner-only</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Only the account holder can read security and money events.
        </p>
      </div>
    );
  }

  const exportCsv = () => {
    const csv = toCsv(
      ["When", "Who", "Area", "Action", "Record type", "Record id", "Detail"],
      rows.map((r) => [r.at, r.actorName, r.area, r.action, r.entityType, r.entityId, r.detail]),
    );
    downloadFile("keyhold-audit-log.csv", csv);
    toast.success(`Exported ${rows.length} audit events.`);
  };

  const field = "min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-navy";

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-navy">
            <ShieldCheck weight="duotone" className="h-5 w-5" aria-hidden="true" />
            Audit log
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign-ins, permission changes, money edits, deletions, notices, exports and subscription changes.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-4 text-sm font-semibold text-primary-foreground hover:bg-navy/90"
        >
          <DownloadSimple weight="duotone" className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </button>
      </header>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs font-semibold text-navy">
          Search
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Action or detail" className={`mt-1 ${field}`} />
        </label>
        <label className="text-xs font-semibold text-navy">
          Person
          <select value={actorId} onChange={(e) => setActorId(e.target.value)} className={`mt-1 ${field}`}>
            <option value="all">Everyone</option>
            {perms.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-navy">
          Area
          <select value={area} onChange={(e) => setArea(e.target.value as AuditArea | "all")} className={`mt-1 ${field}`}>
            <option value="all">All areas</option>
            {AUDIT_AREAS.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-navy">
          Record type
          <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className={`mt-1 ${field}`}>
            {ENTITY_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o === "all" ? "All records" : o}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-navy">
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`mt-1 ${field}`} />
        </label>
        <label className="text-xs font-semibold text-navy">
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`mt-1 ${field}`} />
        </label>
      </div>

      <p className="tnum text-xs text-muted-foreground">{rows.length} events</p>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
          No events match these filters.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.key}>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">{dayLabel(g.key)}</p>
              <ul className="space-y-1.5">
                {g.items.map((r) => (
                  <li key={r.id} className="rounded-xl border border-border p-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${AREA_TONE[r.area]}`}>
                        {AUDIT_AREAS.find((a) => a.key === r.area)?.label ?? r.area}
                      </span>
                      <span className="text-sm font-semibold text-navy">{r.action}</span>
                      <span className="tnum ml-auto text-xs text-muted-foreground">
                        <time dateTime={r.at}>{clockTime(r.at)}</time> · {relativeTime(r.at)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{r.detail}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.actorName} · {r.entityType} {r.entityId}
                      {r.ip ? ` · ${r.ip}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** What the daily/weekly summary email will contain — same data, no guessing. */
export function DigestPreview({ frequency }: { frequency: "daily" | "weekly" }) {
  const rows = useVisibleNotifications();
  const digest = buildDigest(rows, frequency);

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-navy">
        <EnvelopeSimple weight="duotone" className="h-4.5 w-4.5" aria-hidden="true" />
        {frequency === "daily" ? "Daily" : "Weekly"} summary email — preview
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Sent to you covering {digest.windowLabel}. {digest.total} thing{digest.total === 1 ? "" : "s"} happened.
      </p>

      <div className="mt-3 rounded-xl border border-border bg-background p-3.5">
        <p className="font-display text-base font-extrabold text-navy">Your Keyhold summary</p>

        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Needs your attention</p>
        {digest.needsAttention.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">Nothing needs you right now.</p>
        ) : (
          <ul className="mt-1 space-y-1">
            {digest.needsAttention.map((r) => (
              <li key={r.label} className="flex items-center gap-2 text-sm text-navy">
                <ArrowRight weight="bold" className="h-3.5 w-3.5 text-action" aria-hidden="true" />
                <span className="tnum font-bold">{r.count}</span> {r.label}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">What happened</p>
        {digest.happened.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">A quiet {frequency === "daily" ? "day" : "week"}.</p>
        ) : (
          <ul className="mt-1 space-y-1">
            {digest.happened.map((r) => (
              <li key={r.label} className="text-sm text-navy">
                <span className="tnum font-bold">{r.count}</span> {r.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
