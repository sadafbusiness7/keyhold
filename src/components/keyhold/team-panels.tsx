/**
 * TEAM & ACCESS UI — presentation only.
 * All state lives in the mock access layer (src/lib/mock-access.tsx), which
 * mirrors the future schema: users, propertyAssignments {pmUserId, propertyId, level}.
 */
import { useMemo, useState } from "react";
import {
  Buildings,
  CheckCircle,
  ClipboardText,
  Copy,
  EnvelopeSimple,
  Link as LinkIcon,
  PauseCircle,
  Plus,
  ShieldCheck,
  Trash,
  UserCircle,
  Clock,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  inviteExpiryLabel,
  inviteLinkFor,
  levelLabel,
  type AccessLogEntry,
  type AppUser,
  type PermissionLevel,
  type PropertyAssignment,
} from "@/lib/mock-access";
import { properties as allProperties, units as allUnits } from "@/lib/mock-data";

export const fieldClass = "mt-1 min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm";
const selectClass = "min-h-10 rounded-xl border border-input bg-card px-2 text-sm";

export function relativeTime(isoDate?: string) {
  if (!isoDate) return "Never";
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return new Date(isoDate).toLocaleDateString("en-CA");
}

export function StatusBadge({ status }: { status: AppUser["status"] }) {
  const map = {
    active: { label: "Active", cls: "bg-success-soft text-success", Icon: CheckCircle },
    invited: { label: "Invited", cls: "bg-action-soft text-action", Icon: Clock },
    suspended: { label: "Suspended", cls: "bg-maple-soft text-maple", Icon: PauseCircle },
  } as const;
  const { label, cls, Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      <Icon weight="duotone" className="h-4 w-4" aria-hidden="true" />
      {label}
    </span>
  );
}

export function LevelPill({ level }: { level: PermissionLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        level === "full" ? "bg-navy-soft text-navy" : "bg-surface-sunk text-muted-foreground"
      }`}
    >
      {levelLabel(level)}
    </span>
  );
}

export function copyText(text: string, what: string) {
  void navigator.clipboard
    ?.writeText(text)
    .then(() => toast.success(`${what} copied`))
    .catch(() => toast.error("Could not copy — select the link and copy it manually."));
}

/* ------------------------------------------------------------------ */
/* Invite dialog                                                       */
/* ------------------------------------------------------------------ */
export function InviteDialog({
  open,
  onOpenChange,
  seatsLeft,
  seats,
  onInvite,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  seatsLeft: number;
  seats: number;
  onInvite: (name: string, email: string) => AppUser;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [created, setCreated] = useState<AppUser | null>(null);

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setName("");
      setEmail("");
      setCreated(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Invite a property manager</DialogTitle>
          <DialogDescription>
            They set their own password from a secure link — you never see or choose it.
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-surface-sunk p-4">
              <p className="text-sm font-semibold text-navy">{created.name}</p>
              <p className="text-xs text-muted-foreground">{created.email}</p>
              <p className="mt-2 text-xs text-muted-foreground">{inviteExpiryLabel(created)}</p>
              <code className="mt-3 block truncate rounded-lg border border-border bg-card px-2 py-1.5 text-[11px]">
                {inviteLinkFor(created)}
              </code>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyText(inviteLinkFor(created), "Invite link")}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
              >
                <Copy weight="duotone" className="h-5 w-5" aria-hidden="true" /> Copy link
              </button>
              <button
                type="button"
                onClick={() => toast.success(`Invite emailed to ${created.email}`)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90"
              >
                <EnvelopeSimple weight="duotone" className="h-5 w-5" aria-hidden="true" /> Send invite
              </button>
              <button
                type="button"
                onClick={() => close(false)}
                className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-muted-foreground hover:bg-navy-soft"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim() || !email.trim()) return;
              if (seatsLeft === 0) {
                toast.error(
                  seats >= 10
                    ? "You've reached the maximum of 10 property managers per account."
                    : `Your plan includes ${seats} manager seats. Add more units to unlock more.`,
                );
                return;
              }
              setCreated(onInvite(name.trim(), email.trim()));
            }}
          >
            <label className="block text-sm font-medium">
              Their name
              <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Dee Nakamura" />
            </label>
            <label className="block text-sm font-medium">
              Their email
              <input type="email" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.ca" />
            </label>
            <button
              type="submit"
              disabled={seatsLeft === 0}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90 disabled:opacity-40"
            >
              <LinkIcon weight="duotone" className="h-5 w-5" aria-hidden="true" />
              Generate secure invite
            </button>
            <p className="text-xs text-muted-foreground">
              {seatsLeft} of {seats} manager {seats === 1 ? "seat" : "seats"} still free.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Confirmation modal                                                  */
/* ------------------------------------------------------------------ */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  destructive = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ------------------------------------------------------------------ */
/* Manager detail drawer                                               */
/* ------------------------------------------------------------------ */
export function PmDrawer({
  pm,
  onOpenChange,
  assignments,
  ownerPropertyIds,
  setAssignment,
  removeAssignment,
  onSuspendToggle,
  onRemove,
  onResendInvite,
}: {
  pm: AppUser | null;
  onOpenChange: (v: boolean) => void;
  assignments: PropertyAssignment[];
  ownerPropertyIds: string[];
  setAssignment: (pmUserId: string, propertyId: string, level: PermissionLevel) => void;
  removeAssignment: (pmUserId: string, propertyId: string) => void;
  onSuspendToggle: (pm: AppUser) => void;
  onRemove: (pm: AppUser) => void;
  onResendInvite: (pm: AppUser) => void;
}) {
  const [addId, setAddId] = useState("");
  const [addLevel, setAddLevel] = useState<PermissionLevel>("full");

  const mine = pm ? assignments.filter((a) => a.pmUserId === pm.id) : [];
  const assignedIds = new Set(mine.map((a) => a.propertyId));
  const available = ownerPropertyIds.filter((id) => !assignedIds.has(id));

  return (
    <Sheet open={!!pm} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {pm && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="font-display text-xl font-bold">{pm.name}</SheetTitle>
              <SheetDescription>{pm.email}</SheetDescription>
            </SheetHeader>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={pm.status} />
              <span className="text-xs text-muted-foreground" suppressHydrationWarning>Last activity {relativeTime(pm.lastActivityAt)}</span>
            </div>

            {pm.status === "invited" && (
              <div className="mt-4 rounded-2xl bg-surface-sunk p-4">
                <p className="text-xs text-muted-foreground">{inviteExpiryLabel(pm)}</p>
                <code className="mt-2 block truncate rounded-lg border border-border bg-card px-2 py-1.5 text-[11px]">
                  {inviteLinkFor(pm)}
                </code>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyText(inviteLinkFor(pm), "Invite link")}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-3 text-xs font-semibold text-navy hover:bg-navy-soft"
                  >
                    <Copy weight="duotone" className="h-4 w-4" aria-hidden="true" /> Copy link
                  </button>
                  <button
                    type="button"
                    onClick={() => onResendInvite(pm)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-3 text-xs font-semibold text-navy hover:bg-navy-soft"
                  >
                    <EnvelopeSimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> Resend invite
                  </button>
                </div>
              </div>
            )}

            <section className="mt-6">
              <h3 className="font-display text-sm font-bold text-navy">Property assignments</h3>
              <ul className="mt-3 space-y-2">
                {mine.length === 0 && (
                  <li className="rounded-2xl bg-surface-sunk p-4 text-sm text-muted-foreground">
                    No properties yet — add one below and they'll see only that.
                  </li>
                )}
                {mine.map((a) => {
                  const p = allProperties.find((x) => x.id === a.propertyId);
                  if (!p) return null;
                  const doors = allUnits.filter((u) => u.propertyId === p.id).length;
                  return (
                    <li key={a.propertyId} className="flex flex-wrap items-center gap-2 rounded-2xl border border-border p-3">
                      <Buildings weight="duotone" className="h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy">{p.name}</p>
                        <p className="tnum truncate text-xs text-muted-foreground">
                          {p.city}, {p.province} · {doors} {doors === 1 ? "door" : "doors"}
                        </p>
                      </div>
                      <label className="text-xs">
                        <span className="sr-only">Access level for {p.name}</span>
                        <select
                          className={selectClass}
                          value={a.level}
                          onChange={(e) => setAssignment(pm.id, p.id, e.target.value as PermissionLevel)}
                        >
                          <option value="full">Full manager</option>
                          <option value="limited">Limited</option>
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeAssignment(pm.id, p.id)}
                        aria-label={`Remove ${pm.name} from ${p.name}`}
                        className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground hover:bg-maple-soft hover:text-maple"
                      >
                        <Trash weight="duotone" className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>

              {available.length > 0 && (
                <div className="mt-3 flex flex-wrap items-end gap-2 rounded-2xl bg-surface-sunk p-3">
                  <label className="min-w-40 flex-1 text-xs font-medium">
                    Add a property
                    <select className={`${selectClass} mt-1 w-full`} value={addId} onChange={(e) => setAddId(e.target.value)}>
                      <option value="">Choose…</option>
                      {available.map((id) => (
                        <option key={id} value={id}>
                          {allProperties.find((p) => p.id === id)?.name ?? id}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-medium">
                    Level
                    <select
                      className={`${selectClass} mt-1 w-full`}
                      value={addLevel}
                      onChange={(e) => setAddLevel(e.target.value as PermissionLevel)}
                    >
                      <option value="full">Full manager</option>
                      <option value="limited">Limited</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={!addId}
                    onClick={() => {
                      setAssignment(pm.id, addId, addLevel);
                      setAddId("");
                    }}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90 disabled:opacity-40"
                  >
                    <Plus weight="duotone" className="h-4 w-4" aria-hidden="true" /> Add
                  </button>
                </div>
              )}
            </section>

            <section className="mt-6 rounded-2xl bg-surface-sunk p-4 text-xs text-muted-foreground">
              <p>
                <strong className="text-navy">Full manager</strong> — everything on that property except billing and
                deleting it.
              </p>
              <p className="mt-1">
                <strong className="text-navy">Limited</strong> — view and day-to-day work only. Rent, reports and
                tenant-sensitive details are hidden entirely.
              </p>
            </section>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => onSuspendToggle(pm)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
              >
                <PauseCircle weight="duotone" className="h-5 w-5" aria-hidden="true" />
                {pm.status === "suspended" ? "Reinstate access" : "Suspend access"}
              </button>
              <button
                type="button"
                onClick={() => onRemove(pm)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-maple/40 px-4 text-sm font-semibold text-maple hover:bg-maple-soft"
              >
                <Trash weight="duotone" className="h-5 w-5" aria-hidden="true" /> Remove from team
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Permission matrix                                                   */
/* ------------------------------------------------------------------ */
export function PermissionMatrix({
  pms,
  propertyIds,
  assignments,
  setAssignment,
  removeAssignment,
}: {
  pms: AppUser[];
  propertyIds: string[];
  assignments: PropertyAssignment[];
  setAssignment: (pmUserId: string, propertyId: string, level: PermissionLevel) => void;
  removeAssignment: (pmUserId: string, propertyId: string) => void;
}) {
  const rows = useMemo(
    () => propertyIds.map((id) => allProperties.find((p) => p.id === id)).filter(Boolean),
    [propertyIds],
  ) as (typeof allProperties)[number][];

  if (pms.length === 0) return null;

  return (
    <div className="card-soft overflow-x-auto p-1">
      <table className="w-full min-w-160 border-collapse text-sm">
        <caption className="sr-only">Which property manager can do what on each property</caption>
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 bg-card px-3 py-3 text-left font-display text-sm font-bold text-navy">
              Property
            </th>
            {pms.map((pm) => (
              <th key={pm.id} scope="col" className="px-3 py-3 text-left text-xs font-semibold text-navy">
                <span className="block truncate">{pm.name}</span>
                <span className="block text-[10px] font-normal uppercase tracking-widest text-muted-foreground">
                  {pm.status}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-border">
              <th scope="row" className="sticky left-0 bg-card px-3 py-2 text-left">
                <span className="block truncate text-sm font-semibold text-navy">{p.name}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {p.city}, {p.province}
                </span>
              </th>
              {pms.map((pm) => {
                const level = assignments.find((a) => a.pmUserId === pm.id && a.propertyId === p.id)?.level ?? "none";
                return (
                  <td key={pm.id} className="px-3 py-2">
                    <label>
                      <span className="sr-only">
                        {pm.name} access on {p.name}
                      </span>
                      <select
                        className={`${selectClass} w-full`}
                        value={level}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "none") removeAssignment(pm.id, p.id);
                          else setAssignment(pm.id, p.id, v as PermissionLevel);
                        }}
                      >
                        <option value="none">No access</option>
                        <option value="full">Full manager</option>
                        <option value="limited">Limited</option>
                      </select>
                    </label>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Access log                                                          */
/* ------------------------------------------------------------------ */
export function AccessLog({ entries }: { entries: AccessLogEntry[] }) {
  return (
    <ol className="space-y-2">
      {entries.length === 0 && (
        <li className="rounded-2xl bg-surface-sunk p-4 text-sm text-muted-foreground">Nothing recorded yet.</li>
      )}
      {entries.map((e) => (
        <li key={e.id} className="flex items-start gap-3 rounded-2xl border border-border p-3">
          <ClipboardText weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm text-navy">{e.detail}</p>
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {e.actorName} · {new Date(e.at).toLocaleString("en-CA")} · {relativeTime(e.at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* What a manager sees (read-only, shown to the PM themselves)         */
/* ------------------------------------------------------------------ */
export function MyAccessCard({ user, assignments }: { user: AppUser; assignments: PropertyAssignment[] }) {
  return (
    <section className="card-soft p-5">
      <div className="flex items-center gap-3">
        <UserCircle weight="duotone" className="h-7 w-7 text-navy" aria-hidden="true" />
        <div>
          <h2 className="font-display text-lg font-bold">Your access</h2>
          <p className="text-sm text-muted-foreground">Only the owner can change this.</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {assignments.length === 0 && (
          <li className="rounded-2xl bg-surface-sunk p-4 text-sm text-muted-foreground">
            You have no properties assigned yet.
          </li>
        )}
        {assignments.map((a) => {
          const p = allProperties.find((x) => x.id === a.propertyId);
          if (!p) return null;
          return (
            <li key={a.propertyId} className="flex items-center gap-3 rounded-2xl border border-border p-3">
              <ShieldCheck weight="duotone" className="h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">{p.name}</span>
              <LevelPill level={a.level} />
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        Signed in as {user.name} · {user.email}
      </p>
    </section>
  );
}
