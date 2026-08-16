import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, ShieldCheck, MagnifyingGlass } from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageHeader } from "@/components/keyhold/app-shell";
import { EmptyState } from "@/components/keyhold/empty-state";
import { usePermissions, inviteExpiryLabel, type AppUser } from "@/lib/mock-access";
import { OwnerAccessSection } from "@/components/keyhold/owner-access-panel";
import { managerSeatsFor } from "@/components/keyhold/pricing-calculator";
import {
  AccessLog,
  ConfirmDialog,
  InviteDialog,
  LevelPill,
  MyAccessCard,
  PermissionMatrix,
  PmDrawer,
  StatusBadge,
  relativeTime,
} from "@/components/keyhold/team-panels";

export const Route = createFileRoute("/app/team")({
  head: () => ({
    meta: [
      { title: "Team & access — Keyhold" },
      { name: "description", content: "Invite property managers and choose exactly which properties they can work on." },
      { property: "og:title", content: "Team & access — Keyhold" },
      { property: "og:description", content: "Assign managers to properties at full or limited access." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const perms = usePermissions();
  const {
    isOwner,
    isPm,
    user,
    users,
    assignments,
    accessLog,
    visiblePropertyIds,
    invitePm,
    resendInvite,
    setAssignment,
    removeAssignment,
    setUserStatus,
    removeUser,
    units: myUnits,
  } = perms;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [drawerPm, setDrawerPm] = useState<AppUser | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "suspend" | "reinstate" | "remove"; pm: AppUser } | null>(null);
  const [q, setQ] = useState("");

  const pms = useMemo(() => users.filter((u) => u.accountType === "pm"), [users]);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return pms;
    return pms.filter((p) => `${p.name} ${p.email} ${p.status}`.toLowerCase().includes(term));
  }, [pms, q]);

  if (isPm) {
    return (
      <>
        <PageHeader title="Your access" subtitle="The properties the owner has assigned to you." />
        <MyAccessCard user={user} assignments={perms.myAssignments} />
      </>
    );
  }

  if (!isOwner) {
    return (
      <>
        <PageHeader title="Team & access" />
        <EmptyState
          Icon={ShieldCheck}
          title="Only the owner can manage the team"
          body="Ask the property owner to change who can work on which properties."
        />
      </>
    );
  }

  const seats = managerSeatsFor(myUnits.length);
  const seatsLeft = Math.max(0, seats - pms.length);
  const liveDrawerPm = drawerPm ? users.find((u) => u.id === drawerPm.id) ?? null : null;

  return (
    <>
      <PageHeader
        title="Team & access"
        subtitle="Invite a property manager, then give them access to only the properties they look after."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
        >
          <Plus weight="duotone" className="h-5 w-5" aria-hidden="true" /> Invite property manager
        </button>
        <p className="tnum text-sm text-muted-foreground">
          {pms.length} of {seats} seats used · {myUnits.length} units on your plan
        </p>
        <label className="relative ml-auto">
          <span className="sr-only">Search managers</span>
          <MagnifyingGlass
            weight="duotone"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy"
            aria-hidden="true"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search managers"
            className="min-h-11 w-64 max-w-full rounded-full border border-input bg-card pl-9 pr-4 text-sm"
          />
        </label>
      </div>

      <section aria-labelledby="team-list" className="mb-10">
        <h2 id="team-list" className="mb-3 font-display text-lg font-bold">
          Property managers
        </h2>
        {shown.length === 0 ? (
          <EmptyState
            Icon={ShieldCheck}
            title={pms.length === 0 ? "No managers yet" : "No managers match that search"}
            body={pms.length === 0 ? "Invite someone and choose the properties they look after." : "Try a different name or email."}
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {shown.map((pm) => {
              const mine = assignments.filter((a) => a.pmUserId === pm.id);
              return (
                <li key={pm.id}>
                  <button
                    type="button"
                    onClick={() => setDrawerPm(pm)}
                    className="card-soft w-full p-4 text-left transition-colors hover:bg-navy-soft"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-display text-base font-bold text-navy">{pm.name}</span>
                      <StatusBadge status={pm.status} />
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{pm.email}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="tnum rounded-full bg-surface-sunk px-2.5 py-1 font-semibold text-navy">
                        {mine.length} {mine.length === 1 ? "property" : "properties"}
                      </span>
                      {mine.slice(0, 2).map((a) => (
                        <LevelPill key={a.propertyId} level={a.level} />
                      ))}
                      <span className="ml-auto" suppressHydrationWarning>
                        {pm.status === "invited" ? inviteExpiryLabel(pm) : `Last activity ${relativeTime(pm.lastActivityAt)}`}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="matrix" className="mb-10">
        <h2 id="matrix" className="mb-1 font-display text-lg font-bold">
          Permission matrix
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">Who can see what, at a glance. Change any cell to update access.</p>
        <PermissionMatrix
          pms={pms}
          propertyIds={visiblePropertyIds}
          assignments={assignments}
          setAssignment={setAssignment}
          removeAssignment={removeAssignment}
        />
      </section>

      <OwnerAccessSection />

      <section aria-labelledby="access-log" className="mb-10">
        <h2 id="access-log" className="mb-1 font-display text-lg font-bold">
          Access log
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">Every grant, change and removal — kept for your records.</p>
        <AccessLog entries={accessLog.slice(0, 25)} />
      </section>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} seats={seats} seatsLeft={seatsLeft} onInvite={invitePm} />

      <PmDrawer
        pm={liveDrawerPm}
        onOpenChange={(v) => !v && setDrawerPm(null)}
        assignments={assignments}
        ownerPropertyIds={visiblePropertyIds}
        setAssignment={setAssignment}
        removeAssignment={removeAssignment}
        onResendInvite={(pm) => {
          resendInvite(pm.id);
          toast.success(`New invite link created for ${pm.name}`);
        }}
        onSuspendToggle={(pm) => setConfirm({ kind: pm.status === "suspended" ? "reinstate" : "suspend", pm })}
        onRemove={(pm) => setConfirm({ kind: "remove", pm })}
      />

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        destructive={confirm?.kind !== "reinstate"}
        title={
          confirm?.kind === "remove"
            ? `Remove ${confirm.pm.name}?`
            : confirm?.kind === "reinstate"
              ? `Reinstate ${confirm?.pm.name}?`
              : `Suspend ${confirm?.pm.name}?`
        }
        body={
          confirm?.kind === "remove"
            ? `${confirm.pm.name} loses access to all ${assignments.filter((a) => a.pmUserId === confirm.pm.id).length} assigned properties immediately and is deleted from your team. This cannot be undone.`
            : confirm?.kind === "reinstate"
              ? `${confirm?.pm.name} regains access to every property still assigned to them.`
              : `${confirm?.pm.name} will be signed out and will see none of your properties until you reinstate them. Their assignments are kept.`
        }
        confirmLabel={confirm?.kind === "remove" ? "Remove access" : confirm?.kind === "reinstate" ? "Reinstate" : "Suspend"}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === "remove") {
            removeUser(confirm.pm.id);
            setDrawerPm(null);
            toast.success(`${confirm.pm.name} removed from your team`);
          } else {
            setUserStatus(confirm.pm.id, confirm.kind === "suspend" ? "suspended" : "active");
            toast.success(confirm.kind === "suspend" ? `${confirm.pm.name} suspended` : `${confirm.pm.name} reinstated`);
          }
          setConfirm(null);
        }}
      />
    </>
  );
}
