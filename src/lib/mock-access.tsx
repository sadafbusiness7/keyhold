/**
 * MOCK ACCESS LAYER — prototype only, NOT security.
 * -------------------------------------------------
 * This file is the single place that answers:
 *   "can THIS user see/do THIS on THIS property?"
 *
 * Shapes mirror a future backend (Supabase tables + row-level security):
 *   users                -> auth.users + profiles  { id, name, email, accountType, status }
 *   property_assignments -> join table             { pmUserId, propertyId, level }
 *   invites              -> invite tokens          { token, expiresAt }
 *   access_log           -> audit trail            { actorId, action, targetUserId, propertyId, at }
 * Swap the arrays below for queries and keep the same helper API.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { properties as allProperties, units as allUnits, tenants as allTenants, leases as allLeases, rentRows as allRentRows, tickets as allTickets } from "@/lib/mock-data";

/** "owner" is the account holder. "owner-client" is a property owner the manager reports to. */
export type AccountType = "owner" | "pm" | "tenant" | "owner-client";
export type PermissionLevel = "full" | "limited";
export type UserStatus = "invited" | "active" | "suspended";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  accountType: AccountType;
  status: UserStatus;
  /** ISO timestamp of the last thing they did in the app */
  lastActivityAt?: string;
  /** invite token + expiry — the owner never sees or sets a password */
  inviteToken?: string;
  inviteExpiresAt?: string;
  /** tenants only: the single unit they are attached to */
  unitId?: string;
};

export type PropertyAssignment = {
  pmUserId: string;
  propertyId: string;
  level: PermissionLevel;
};

export type AccessLogAction =
  | "invited"
  | "invite-resent"
  | "activated"
  | "granted"
  | "level-changed"
  | "revoked"
  | "suspended"
  | "reinstated"
  | "removed";

export type AccessLogEntry = {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  targetUserId: string;
  targetUserName: string;
  action: AccessLogAction;
  propertyId?: string;
  detail: string;
};

const DAY = 86_400_000;
const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

// MOCK users — Mr. J's account.
export const seedUsers: AppUser[] = [
  { id: "u_owner", name: "Mr. J (you)", email: "mrj@keyhold.ca", accountType: "owner", status: "active", lastActivityAt: iso(-2 * 60_000) },
  { id: "u_priya", name: "Priya Raman", email: "priya@keyhold.ca", accountType: "pm", status: "active", lastActivityAt: iso(-3 * 3_600_000) },
  { id: "u_sam", name: "Sam Beaulieu", email: "sam@keyhold.ca", accountType: "pm", status: "active", lastActivityAt: iso(-2 * DAY) },
  { id: "u_dee", name: "Dee Nakamura", email: "dee@keyhold.ca", accountType: "pm", status: "invited", inviteToken: "kh_inv_9f3ab2c1", inviteExpiresAt: iso(5 * DAY) },
  { id: "t3", name: "Grace Okafor", email: "grace.okafor@example.ca", accountType: "tenant", status: "active", unitId: "u3" },
  { id: "t1", name: "Marie Tremblay", email: "marie.tremblay@example.ca", accountType: "tenant", status: "active", unitId: "u1" },
  { id: "u_joseph", name: "Joseph Nkemelu", email: "mr.j@example.ca", accountType: "owner-client", status: "active", lastActivityAt: iso(-26 * 3_600_000) },
  { id: "u_dana", name: "Dana Whitecloud", email: "dana.w@example.ca", accountType: "owner-client", status: "invited", inviteToken: "kh_inv_own_4c81", inviteExpiresAt: iso(6 * DAY) },
];

/* ——— owner-portal access: which properties, and which sections, an owner sees ——— */
export const OWNER_SECTIONS = [
  { id: "statements", label: "Statements", help: "Monthly disbursement statements and PDFs" },
  { id: "properties", label: "Properties & units", help: "Units, current tenants (name + lease dates only)" },
  { id: "documents", label: "Documents", help: "Only documents you have shared" },
  { id: "reports", label: "Reports", help: "Income vs expense and occupancy" },
] as const;
export type OwnerSection = (typeof OWNER_SECTIONS)[number]["id"];
export const ALL_OWNER_SECTIONS: OwnerSection[] = OWNER_SECTIONS.map((s) => s.id);

/** owner_property_access -> { ownerUserId, propertyId, sections } */
export type OwnerAccess = {
  ownerUserId: string;
  propertyId: string;
  sections: OwnerSection[];
};

export const seedOwnerAccess: OwnerAccess[] = [
  { ownerUserId: "u_joseph", propertyId: "p2", sections: ["statements", "properties", "documents", "reports"] },
  { ownerUserId: "u_joseph", propertyId: "p4", sections: ["statements", "properties"] },
  { ownerUserId: "u_dana", propertyId: "p3", sections: ["statements", "properties"] },
];

// MOCK assignments — Priya runs Toronto/Hamilton, Sam runs Vancouver.
export const seedAssignments: PropertyAssignment[] = [
  { pmUserId: "u_priya", propertyId: "p1", level: "full" },
  { pmUserId: "u_priya", propertyId: "p2", level: "full" },
  { pmUserId: "u_priya", propertyId: "p3", level: "limited" },
  { pmUserId: "u_priya", propertyId: "p4", level: "full" },
  { pmUserId: "u_sam", propertyId: "p5", level: "limited" },
  { pmUserId: "u_sam", propertyId: "p6", level: "limited" },
];

const seedLog: AccessLogEntry[] = [
  {
    id: "log_seed_3",
    at: iso(-6 * DAY),
    actorId: "u_owner",
    actorName: "Mr. J (you)",
    targetUserId: "u_sam",
    targetUserName: "Sam Beaulieu",
    action: "granted",
    propertyId: "p5",
    detail: "Granted Sam Beaulieu limited access on Kitsilano Apartments",
  },
  {
    id: "log_seed_2",
    at: iso(-9 * DAY),
    actorId: "u_owner",
    actorName: "Mr. J (you)",
    targetUserId: "u_priya",
    targetUserName: "Priya Raman",
    action: "level-changed",
    propertyId: "p3",
    detail: "Changed Priya Raman to limited on Birchmount Townhome",
  },
  {
    id: "log_seed_1",
    at: iso(-21 * DAY),
    actorId: "u_owner",
    actorName: "Mr. J (you)",
    targetUserId: "u_priya",
    targetUserName: "Priya Raman",
    action: "invited",
    detail: "Invited priya@keyhold.ca as a property manager",
  },
];

export const levelLabel = (level: PermissionLevel) => (level === "full" ? "Full manager" : "Limited");

export function inviteLinkFor(user: AppUser) {
  const origin = typeof window === "undefined" ? "https://keyhold.ca" : window.location.origin;
  return `${origin}/signup?invite=${user.inviteToken ?? "expired"}`;
}

export function inviteExpiryLabel(user: AppUser) {
  if (!user.inviteExpiresAt) return null;
  const ms = new Date(user.inviteExpiresAt).getTime() - Date.now();
  if (ms <= 0) return "Invite expired";
  const days = Math.ceil(ms / DAY);
  return `Invite expires in ${days} ${days === 1 ? "day" : "days"}`;
}

type Ctx = {
  users: AppUser[];
  assignments: PropertyAssignment[];
  accessLog: AccessLogEntry[];
  currentUser: AppUser;
  /** demo aid only — remove with the demo menu */
  setCurrentUserId: (id: string) => void;
  invitePm: (name: string, email: string) => AppUser;
  resendInvite: (pmUserId: string) => AppUser | null;
  setAssignment: (pmUserId: string, propertyId: string, level: PermissionLevel) => void;
  removeAssignment: (pmUserId: string, propertyId: string) => void;
  setUserStatus: (pmUserId: string, status: UserStatus) => void;
  removeUser: (pmUserId: string) => void;
  // —— owner portal access ——
  ownerAccess: OwnerAccess[];
  inviteOwner: (name: string, email: string) => AppUser;
  setOwnerAccess: (ownerUserId: string, propertyId: string, sections: OwnerSection[]) => void;
  removeOwnerAccess: (ownerUserId: string, propertyId: string) => void;
};

const AccessContext = createContext<Ctx | null>(null);

export function AccessProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(seedUsers);
  const [ownerAccess, setOwnerAccessRows] = useState<OwnerAccess[]>(seedOwnerAccess);
  const [assignments, setAssignments] = useState<PropertyAssignment[]>(seedAssignments);
  const [accessLog, setAccessLog] = useState<AccessLogEntry[]>(seedLog);
  const [currentUserId, setCurrentUserId] = useState("u_owner");


  const currentUser: AppUser = users.find((u) => u.id === currentUserId) ?? seedUsers[0]!;
  const actorId = currentUser.id;
  const actorName = currentUser.name;

  const log = useCallback(
    (entry: Omit<AccessLogEntry, "id" | "at" | "actorId" | "actorName">) =>
      setAccessLog((prev) => [
        { id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, at: new Date().toISOString(), actorId, actorName, ...entry },
        ...prev,
      ]),
    [actorId, actorName],
  );

  const value = useMemo<Ctx>(() => {
    const nameOf = (id: string) => users.find((u) => u.id === id)?.name ?? "Unknown";
    const propName = (id: string) => allProperties.find((p) => p.id === id)?.name ?? id;

    return {
      users,
      assignments,
      accessLog,
      currentUser,
      setCurrentUserId,
      invitePm: (name, email) => {
        const user: AppUser = {
          id: `u_pm_${Date.now()}`,
          name,
          email,
          accountType: "pm",
          status: "invited",
          inviteToken: `kh_inv_${Math.random().toString(36).slice(2, 10)}`,
          inviteExpiresAt: iso(7 * DAY),
        };
        setUsers((prev) => [...prev, user]);
        log({ targetUserId: user.id, targetUserName: name, action: "invited", detail: `Invited ${email} as a property manager` });
        return user;
      },
      resendInvite: (pmUserId) => {
        const target = users.find((u) => u.id === pmUserId);
        if (!target) return null;
        const updated: AppUser = {
          ...target,
          inviteToken: `kh_inv_${Math.random().toString(36).slice(2, 10)}`,
          inviteExpiresAt: iso(7 * DAY),
          status: "invited",
        };
        setUsers((prev) => prev.map((u) => (u.id === pmUserId ? updated : u)));
        log({ targetUserId: pmUserId, targetUserName: nameOf(pmUserId), action: "invite-resent", detail: "New invite link generated, valid 7 days" });
        return updated;
      },

      setAssignment: (pmUserId, propertyId, level) => {
        const existing = assignments.find((a) => a.pmUserId === pmUserId && a.propertyId === propertyId);
        setAssignments((prev) => [
          ...prev.filter((a) => !(a.pmUserId === pmUserId && a.propertyId === propertyId)),
          { pmUserId, propertyId, level },
        ]);
        log({
          targetUserId: pmUserId,
          targetUserName: nameOf(pmUserId),
          propertyId,
          action: existing ? "level-changed" : "granted",
          detail: `${existing ? "Changed" : "Granted"} ${nameOf(pmUserId)} to ${levelLabel(level).toLowerCase()} on ${propName(propertyId)}`,
        });
      },
      removeAssignment: (pmUserId, propertyId) => {
        setAssignments((prev) => prev.filter((a) => !(a.pmUserId === pmUserId && a.propertyId === propertyId)));
        log({
          targetUserId: pmUserId,
          targetUserName: nameOf(pmUserId),
          propertyId,
          action: "revoked",
          detail: `Removed ${nameOf(pmUserId)} from ${propName(propertyId)}`,
        });
      },
      setUserStatus: (pmUserId, status) => {
        setUsers((prev) => prev.map((u) => (u.id === pmUserId ? { ...u, status } : u)));
        log({
          targetUserId: pmUserId,
          targetUserName: nameOf(pmUserId),
          action: status === "suspended" ? "suspended" : status === "active" ? "reinstated" : "invited",
          detail:
            status === "suspended"
              ? `Suspended ${nameOf(pmUserId)} — access to every assigned property paused`
              : `Reinstated ${nameOf(pmUserId)} — assignments restored`,
        });
      },
      removeUser: (pmUserId) => {
        const name = nameOf(pmUserId);
        setAssignments((prev) => prev.filter((a) => a.pmUserId !== pmUserId));
        setOwnerAccessRows((prev) => prev.filter((a) => a.ownerUserId !== pmUserId));
        setUsers((prev) => prev.filter((u) => u.id !== pmUserId));
        if (currentUser.id === pmUserId) setCurrentUserId("u_owner");
        log({ targetUserId: pmUserId, targetUserName: name, action: "removed", detail: `Removed ${name} from the team and deleted all assignments` });
      },

      ownerAccess,
      inviteOwner: (name, email) => {
        const user: AppUser = {
          id: `u_own_${Date.now()}`,
          name,
          email,
          accountType: "owner-client",
          status: "invited",
          inviteToken: `kh_inv_own_${Math.random().toString(36).slice(2, 10)}`,
          inviteExpiresAt: iso(7 * DAY),
        };
        setUsers((prev) => [...prev, user]);
        log({ targetUserId: user.id, targetUserName: name, action: "invited", detail: `Invited ${email} as a property owner — magic link, no password set by you` });
        return user;
      },
      setOwnerAccess: (ownerUserId, propertyId, sections) => {
        const existing = ownerAccess.find((a) => a.ownerUserId === ownerUserId && a.propertyId === propertyId);
        if (sections.length === 0) {
          setOwnerAccessRows((prev) => prev.filter((a) => !(a.ownerUserId === ownerUserId && a.propertyId === propertyId)));
          log({
            targetUserId: ownerUserId,
            targetUserName: nameOf(ownerUserId),
            propertyId,
            action: "revoked",
            detail: `Removed ${nameOf(ownerUserId)}'s owner-portal access to ${propName(propertyId)}`,
          });
          return;
        }
        setOwnerAccessRows((prev) => [
          ...prev.filter((a) => !(a.ownerUserId === ownerUserId && a.propertyId === propertyId)),
          { ownerUserId, propertyId, sections },
        ]);
        log({
          targetUserId: ownerUserId,
          targetUserName: nameOf(ownerUserId),
          propertyId,
          action: existing ? "level-changed" : "granted",
          detail: `${existing ? "Updated" : "Granted"} ${nameOf(ownerUserId)} owner-portal access to ${propName(propertyId)} (${sections.join(", ")})`,
        });
      },
      removeOwnerAccess: (ownerUserId, propertyId) => {
        setOwnerAccessRows((prev) => prev.filter((a) => !(a.ownerUserId === ownerUserId && a.propertyId === propertyId)));
        log({
          targetUserId: ownerUserId,
          targetUserName: nameOf(ownerUserId),
          propertyId,
          action: "revoked",
          detail: `Removed ${nameOf(ownerUserId)} from ${propName(propertyId)} in the owner portal`,
        });
      },
    };
  }, [users, assignments, accessLog, currentUser, ownerAccess, log]);

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess must be used inside <AccessProvider>");
  return ctx;
}

/** Same context, but safe on public screens that sit outside the provider. */
export function useOptionalAccess() {
  return useContext(AccessContext);
}

/** The one helper every screen asks. */
export function usePermissions() {
  const {
    currentUser,
    assignments,
    users,
    accessLog,
    invitePm,
    resendInvite,
    setAssignment,
    removeAssignment,
    setUserStatus,
    removeUser,
    setCurrentUserId,
    ownerAccess,
    inviteOwner,
    setOwnerAccess,
    removeOwnerAccess,
  } = useAccess();

  return useMemo(() => {
    const isOwner = currentUser.accountType === "owner";
    const isPm = currentUser.accountType === "pm";
    const isTenant = currentUser.accountType === "tenant";
    const isOwnerClient = currentUser.accountType === "owner-client";
    const isSuspended = currentUser.status === "suspended";

    // A suspended or not-yet-accepted manager sees nothing at all.
    const pmActive = isPm && currentUser.status === "active";
    const myAssignments = pmActive ? assignments.filter((a) => a.pmUserId === currentUser.id) : [];

    const tenantUnit = isTenant ? allUnits.find((u) => u.id === currentUser.unitId) ?? null : null;

    const ownerClientActive = isOwnerClient && currentUser.status === "active";
    const myOwnerAccess = ownerClientActive ? ownerAccess.filter((a) => a.ownerUserId === currentUser.id) : [];
    const ownerAccessFor = (ownerUserId: string) => ownerAccess.filter((a) => a.ownerUserId === ownerUserId);

    const visiblePropertyIds = isOwner
      ? allProperties.filter((p) => p.ownerId === "u_owner").map((p) => p.id)
      : isPm
        ? myAssignments.map((a) => a.propertyId)
        : isOwnerClient
          ? myOwnerAccess.map((a) => a.propertyId)
          : tenantUnit
            ? [tenantUnit.propertyId]
            : [];

    const levelFor = (propertyId: string): PermissionLevel | null => {
      if (isOwner) return "full";
      if (isPm) return myAssignments.find((a) => a.propertyId === propertyId)?.level ?? null;
      return null;
    };

    const canSee = (propertyId: string) => visiblePropertyIds.includes(propertyId);
    const canSeeFinancials = (propertyId?: string) => {
      if (isTenant) return false; // tenants only ever see their own rent, handled in the portal
      if (isOwnerClient) return false; // owners read money in their own portal, never in the app
      if (isOwner) return true;
      if (!pmActive) return false;
      if (propertyId) return levelFor(propertyId) === "full";
      return myAssignments.some((a) => a.level === "full");
    };
    const canSeeTenantSensitive = canSeeFinancials;

    const properties = allProperties.filter((p) => canSee(p.id));
    const units = isTenant
      ? allUnits.filter((u) => u.id === currentUser.unitId)
      : allUnits.filter((u) => canSee(u.propertyId));
    const unitIds = new Set(units.map((u) => u.id));
    const tenants = allTenants.filter((t) => unitIds.has(t.unitId));
    const leases = allLeases.filter((l) => unitIds.has(l.unitId));
    // financial rows are additionally filtered by level
    const rentRows = allRentRows.filter((r) => {
      const unit = allUnits.find((u) => u.id === r.unitId);
      return !!unit && unitIds.has(unit.id) && canSeeFinancials(unit.propertyId);
    });
    const tickets = allTickets.filter((t) => unitIds.has(t.unitId));

    /** Assignments for any manager — owner-facing views need this. */
    const assignmentsFor = (pmUserId: string) => assignments.filter((a) => a.pmUserId === pmUserId);

    return {
      user: currentUser,
      users,
      accessLog,
      isOwner,
      isPm,
      isTenant,
      isOwnerClient,
      isSuspended,
      assignments,
      assignmentsFor,
      myAssignments,
      ownerAccess,
      ownerAccessFor,
      myOwnerAccess,
      /** owner portal: can this owner open this section on this property? */
      ownerCanSee: (propertyId: string, section: OwnerSection) =>
        myOwnerAccess.some((a) => a.propertyId === propertyId && a.sections.includes(section)),
      ownerSections: Array.from(new Set(myOwnerAccess.flatMap((a) => a.sections))) as OwnerSection[],
      inviteOwner,
      setOwnerAccess,
      removeOwnerAccess,
      visiblePropertyIds,
      levelFor,
      canSee,
      canSeeFinancials,
      canSeeTenantSensitive,
      canManageTeam: isOwner,
      canSeeBilling: isOwner,
      canSeeSettings: isOwner,
      canSeeReports: isOwner || (pmActive && myAssignments.some((a) => a.level === "full")),
      properties,
      units,
      tenants,
      leases,
      rentRows,
      tickets,
      // team mutations (owner only in the UI)
      invitePm,
      resendInvite,
      setAssignment,
      removeAssignment,
      setUserStatus,
      removeUser,
      setCurrentUserId,
    };
  }, [
    currentUser,
    assignments,
    users,
    accessLog,
    invitePm,
    resendInvite,
    setAssignment,
    removeAssignment,
    setUserStatus,
    removeUser,
    setCurrentUserId,
    ownerAccess,
    inviteOwner,
    setOwnerAccess,
    removeOwnerAccess,
  ]);
}
