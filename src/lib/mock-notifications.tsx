/**
 * MOCK NOTIFICATION / ACTIVITY / AUDIT STORE — prototype only.
 * ------------------------------------------------------------
 * Isolated from every other mock layer: it seeds itself from mock-data ids so
 * deep links always land on a real record, and exposes write actions the rest
 * of the app calls when something happens.
 *
 * Future tables: notifications, activity_log, audit_log (all append-only).
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  ago,
  DAY,
  HOUR,
  MINUTE,
  type ActivityEntry,
  type AppNotification,
  type AuditEntry,
  type EntityType,
} from "@/lib/activity-engine";

/* ------------------------------- seeds ----------------------------------- */

const seedNotifications: AppNotification[] = [
  {
    id: "nt1",
    at: ago(18 * MINUTE),
    kind: "rent-received",
    category: "rent",
    title: "Rent received — Marie Tremblay",
    body: "CA$2,350.00 by e-Transfer for 412 Lansdowne Ave · Main floor. The invoice is now paid in full.",
    to: "/app/rent",
    entityType: "invoice",
    entityId: "r1",
    unitId: "u1",
    propertyId: "p1",
    read: false,
    dismissed: false,
  },
  {
    id: "nt2",
    at: ago(2 * HOUR),
    kind: "maintenance-urgent",
    category: "maintenance",
    title: "Urgent repair — no hot water",
    body: "Grace Okafor at 88 Ottawa St N · Unit A reported no hot water. Marked as an emergency.",
    to: "/app/maintenance",
    entityType: "maintenance",
    entityId: "m1",
    unitId: "u3",
    propertyId: "p2",
    read: false,
    dismissed: false,
  },
  {
    id: "nt3",
    at: ago(5 * HOUR),
    kind: "rent-overdue",
    category: "rent",
    title: "Rent overdue — Grace Okafor",
    body: "CA$1,895.00 was due on August 1 and is still unpaid. 11 days late.",
    to: "/app/rent",
    entityType: "invoice",
    entityId: "r3",
    unitId: "u3",
    propertyId: "p2",
    read: false,
    dismissed: false,
  },
  {
    id: "nt4",
    at: ago(9 * HOUR),
    kind: "payment-failed",
    category: "rent",
    title: "Payment failed — Liam Gallagher",
    body: "An e-Transfer of CA$495.00 was returned by the bank (NSF). No fee has been applied yet.",
    to: "/app/rent",
    entityType: "invoice",
    entityId: "r4",
    unitId: "u4",
    propertyId: "p2",
    read: false,
    dismissed: false,
  },
  {
    id: "nt5",
    at: ago(1 * DAY - 3 * HOUR),
    kind: "maintenance-submitted",
    category: "maintenance",
    title: "New repair request — kitchen tap drips",
    body: "Marie Tremblay at 412 Lansdowne Ave · Main floor. Not urgent; available weekdays after 4pm.",
    to: "/app/maintenance",
    entityType: "maintenance",
    entityId: "m2",
    unitId: "u1",
    propertyId: "p1",
    read: true,
    dismissed: false,
  },
  {
    id: "nt6",
    at: ago(1 * DAY - 30 * MINUTE),
    kind: "lease-expiring",
    category: "leases",
    title: "Lease ends in 19 days — Grace Okafor",
    body: "88 Ottawa St N · Unit A ends August 31. Your renewal lead time is 90 days, so this one is late to start.",
    to: "/app/renewals",
    entityType: "lease",
    entityId: "l3",
    unitId: "u3",
    propertyId: "p2",
    read: false,
    dismissed: false,
  },
  {
    id: "nt7",
    at: ago(2 * DAY),
    kind: "lease-expiring",
    category: "leases",
    title: "Lease ends in 19 days — Wen & Alice Zhou",
    body: "27 Birchmount Rd ends August 31. Month-to-month, so a renewal offer is optional.",
    to: "/app/renewals",
    entityType: "lease",
    entityId: "l5",
    unitId: "u6",
    propertyId: "p3",
    read: true,
    dismissed: false,
  },
  {
    id: "nt8",
    at: ago(6 * DAY),
    kind: "notice-served",
    category: "leases",
    title: "N4 notice served — Unit A",
    body: "Served to Grace Okafor by hand on August 6. A copy is saved on the tenant and lease record.",
    to: "/app/notices",
    entityType: "document",
    entityId: "d2",
    unitId: "u3",
    propertyId: "p2",
    read: true,
    dismissed: false,
  },
  {
    id: "nt9",
    at: ago(3 * DAY),
    kind: "insurance-expiring",
    category: "leases",
    title: "Tenant insurance expires in 22 days",
    body: "Dev Sharma's policy for 412 Lansdowne Ave · Basement suite expires September 3.",
    to: "/app/tenants",
    entityType: "tenant",
    entityId: "t2",
    unitId: "u2",
    propertyId: "p1",
    read: false,
    dismissed: false,
  },
  {
    id: "nt10",
    at: ago(4 * DAY),
    kind: "document-expiring",
    category: "system",
    title: "Document expiring — Fire safety inspection 2026",
    body: "88 Ottawa St N. This document is marked as expiring and should be replaced.",
    to: "/app/documents",
    entityType: "document",
    entityId: "d4",
    propertyId: "p2",
    read: true,
    dismissed: false,
  },
  {
    id: "nt11",
    at: ago(5 * DAY),
    kind: "team-member-added",
    category: "system",
    title: "Team member invited — Dee Nakamura",
    body: "Invited as a property manager. The invite link expires in 7 days.",
    to: "/app/team",
    entityType: "user",
    entityId: "u_dee",
    read: true,
    dismissed: false,
  },
  {
    id: "nt12",
    at: ago(8 * DAY),
    kind: "import-complete",
    category: "system",
    title: "Import complete — 3 properties, 6 units, 5 tenants",
    body: "Two rows were skipped for a missing lease end date. You can still undo this import.",
    to: "/app/import",
    entityType: "import",
    entityId: "imp_1",
    read: true,
    dismissed: false,
  },
];

const seedActivity: ActivityEntry[] = [
  // invoice r1
  { id: "ac1", at: ago(18 * MINUTE), actorName: "Mr. J (you)", entityType: "invoice", entityId: "r1", action: "Recorded a payment", detail: "CA$2,350.00 by e-Transfer, reference ET-88214", field: "Status", before: "Due", after: "Paid" },
  { id: "ac2", at: ago(11 * DAY), actorName: "Keyhold (automatic)", entityType: "invoice", entityId: "r1", action: "Invoice created", detail: "August rent for 412 Lansdowne Ave · Main floor" },
  // invoice r3
  { id: "ac3", at: ago(5 * HOUR), actorName: "Keyhold (automatic)", entityType: "invoice", entityId: "r3", action: "Marked overdue", field: "Status", before: "Due", after: "Overdue" },
  { id: "ac4", at: ago(6 * DAY), actorName: "Priya Raman", entityType: "invoice", entityId: "r3", action: "Sent a reminder", detail: "Email and SMS to grace.okafor@example.ca" },
  { id: "ac5", at: ago(11 * DAY), actorName: "Keyhold (automatic)", entityType: "invoice", entityId: "r3", action: "Invoice created", detail: "August rent for 88 Ottawa St N · Unit A" },
  // invoice r4
  { id: "ac6", at: ago(9 * HOUR), actorName: "Keyhold (automatic)", entityType: "invoice", entityId: "r4", action: "Payment returned (NSF)", detail: "e-Transfer of CA$495.00 reversed by the bank", field: "Balance", before: "CA$0.00", after: "CA$495.00" },
  { id: "ac7", at: ago(9 * DAY), actorName: "Priya Raman", entityType: "invoice", entityId: "r4", action: "Recorded a payment", detail: "CA$1,000.00 by e-Transfer" },
  // maintenance
  { id: "ac8", at: ago(2 * HOUR), actorName: "Grace Okafor (tenant)", entityType: "maintenance", entityId: "m1", action: "Request submitted", detail: "No hot water — tank pilot light out" },
  { id: "ac9", at: ago(100 * MINUTE), actorName: "Priya Raman", entityType: "maintenance", entityId: "m1", action: "Raised the priority", field: "Priority", before: "Normal", after: "Emergency" },
  { id: "ac10", at: ago(80 * MINUTE), actorName: "Priya Raman", entityType: "maintenance", entityId: "m1", action: "Assigned a vendor", detail: "Hamilton Plumbing Co — attending 9:00am" },
  { id: "ac11", at: ago(7 * DAY), actorName: "Marie Tremblay (tenant)", entityType: "maintenance", entityId: "m2", action: "Request submitted", detail: "Kitchen tap drips" },
  { id: "ac12", at: ago(14 * DAY), actorName: "Sam Beaulieu", entityType: "maintenance", entityId: "m3", action: "Status changed", field: "Status", before: "Open", after: "In progress" },
  // leases
  { id: "ac13", at: ago(6 * DAY), actorName: "Priya Raman", entityType: "lease", entityId: "l3", action: "Notice generated", detail: "N4 — non-payment of rent, served by hand August 6" },
  { id: "ac14", at: ago(40 * DAY), actorName: "Mr. J (you)", entityType: "lease", entityId: "l3", action: "Rent changed", field: "Monthly rent", before: "CA$1,840.00", after: "CA$1,895.00" },
  { id: "ac15", at: ago(2 * DAY), actorName: "Keyhold (automatic)", entityType: "lease", entityId: "l5", action: "Renewal reminder", detail: "Lease ends August 31 — renewal window open" },
  { id: "ac16", at: ago(120 * DAY), actorName: "Mr. J (you)", entityType: "lease", entityId: "l1", action: "Lease signed", detail: "All signers complete — locked" },
  // tenants
  { id: "ac17", at: ago(3 * DAY), actorName: "Keyhold (automatic)", entityType: "tenant", entityId: "t2", action: "Insurance expiring", detail: "Policy expires September 3" },
  { id: "ac18", at: ago(6 * DAY), actorName: "Priya Raman", entityType: "tenant", entityId: "t3", action: "Contacted the tenant", detail: "Rent reminder sent by email and SMS" },
  { id: "ac19", at: ago(60 * DAY), actorName: "Mr. J (you)", entityType: "tenant", entityId: "t1", action: "Contact updated", field: "Phone", before: "(416) 555-0100", after: "(416) 555-0142" },
  // property / unit
  { id: "ac20", at: ago(4 * DAY), actorName: "Mr. J (you)", entityType: "property", entityId: "p2", action: "Document uploaded", detail: "Fire safety inspection 2026.pdf" },
  { id: "ac21", at: ago(30 * DAY), actorName: "Priya Raman", entityType: "property", entityId: "p1", action: "Property details updated", field: "Name", before: "Lansdowne duplex", after: "412 Lansdowne Ave" },
  { id: "ac22", at: ago(45 * DAY), actorName: "Mr. J (you)", entityType: "unit", entityId: "u5", action: "Rent changed", field: "Advertised rent", before: "CA$1,195.00", after: "CA$1,250.00" },
  { id: "ac23", at: ago(21 * DAY), actorName: "Sam Beaulieu", entityType: "unit", entityId: "u1", action: "Inspection completed", detail: "Annual inspection — no issues found" },
];

const seedAudit: AuditEntry[] = [
  { id: "au1", at: ago(12 * MINUTE), actorId: "u_owner", actorName: "Mr. J (you)", area: "auth", action: "Signed in", entityType: "account", entityId: "u_owner", detail: "Email and password, MFA passed", ip: "142.116.24.9" },
  { id: "au2", at: ago(3 * HOUR), actorId: "u_priya", actorName: "Priya Raman", area: "auth", action: "Signed in", entityType: "account", entityId: "u_priya", detail: "Email and password", ip: "99.243.17.201" },
  { id: "au3", at: ago(18 * MINUTE), actorId: "u_owner", actorName: "Mr. J (you)", area: "money", action: "Payment recorded", entityType: "invoice", entityId: "r1", detail: "CA$2,350.00 e-Transfer against invoice r1" },
  { id: "au4", at: ago(9 * HOUR), actorId: "u_priya", actorName: "Priya Raman", area: "money", action: "Payment edited", entityType: "invoice", entityId: "r4", detail: "Marked an e-Transfer of CA$495.00 as returned (NSF)" },
  { id: "au5", at: ago(2 * DAY), actorId: "u_owner", actorName: "Mr. J (you)", area: "money", action: "Late fee waived", entityType: "invoice", entityId: "r4", detail: "CA$25.00 waived — reason: bank error confirmed by tenant" },
  { id: "au6", at: ago(6 * DAY), actorId: "u_priya", actorName: "Priya Raman", area: "records", action: "Notice generated", entityType: "lease", entityId: "l3", detail: "N4 notice for 88 Ottawa St N · Unit A" },
  { id: "au7", at: ago(5 * DAY), actorId: "u_owner", actorName: "Mr. J (you)", area: "access", action: "Team member invited", entityType: "user", entityId: "u_dee", detail: "Dee Nakamura invited as a property manager" },
  { id: "au8", at: ago(7 * DAY), actorId: "u_owner", actorName: "Mr. J (you)", area: "access", action: "Permission level changed", entityType: "property", entityId: "p3", detail: "Priya Raman changed from Full manager to Limited on 27 Birchmount Rd" },
  { id: "au9", at: ago(10 * DAY), actorId: "u_owner", actorName: "Mr. J (you)", area: "data", action: "Data exported", entityType: "account", entityId: "u_owner", detail: "Full portfolio export (CSV) downloaded" },
  { id: "au10", at: ago(15 * DAY), actorId: "u_owner", actorName: "Mr. J (you)", area: "billing", action: "Subscription changed", entityType: "account", entityId: "u_owner", detail: "Plan changed from 6 homes to 12 homes" },
  { id: "au11", at: ago(20 * DAY), actorId: "u_sam", actorName: "Sam Beaulieu", area: "records", action: "Record deleted", entityType: "document", entityId: "d9", detail: "Deleted duplicate receipt 'Furnace service (copy).pdf'" },
  { id: "au12", at: ago(28 * DAY), actorId: "u_owner", actorName: "Mr. J (you)", area: "access", action: "Owner access granted", entityType: "user", entityId: "u_joseph", detail: "Joseph Nkemelu granted statements and properties on 88 Ottawa St N" },
];

/* ------------------------------- store ----------------------------------- */

type NotifyInput = Omit<AppNotification, "id" | "at" | "read" | "dismissed"> & { at?: string };
type ActivityInput = Omit<ActivityEntry, "id" | "at"> & { at?: string };
type AuditInput = Omit<AuditEntry, "id" | "at"> & { at?: string };

type NotificationsValue = {
  notifications: AppNotification[];
  activity: ActivityEntry[];
  audit: AuditEntry[];
  unreadCount: number;
  activityFor: (entityType: EntityType, entityId: string) => ActivityEntry[];
  markRead: (id: string) => void;
  markUnread: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearDismissed: () => void;
  notify: (input: NotifyInput) => void;
  logActivity: (input: ActivityInput) => void;
  logAudit: (input: AuditInput) => void;
};

const Ctx = createContext<NotificationsValue | null>(null);

let seq = 0;
const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${seq++}`;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotifications);
  const [activity, setActivity] = useState<ActivityEntry[]>(seedActivity);
  const [audit, setAudit] = useState<AuditEntry[]>(seedAudit);

  const markRead = useCallback((id: string) => {
    setNotifications((rows) => rows.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);
  const markUnread = useCallback((id: string) => {
    setNotifications((rows) => rows.map((n) => (n.id === id ? { ...n, read: false } : n)));
  }, []);
  const markAllRead = useCallback(() => {
    setNotifications((rows) => rows.map((n) => ({ ...n, read: true })));
  }, []);
  const dismiss = useCallback((id: string) => {
    setNotifications((rows) => rows.map((n) => (n.id === id ? { ...n, dismissed: true, read: true } : n)));
  }, []);
  const clearDismissed = useCallback(() => {
    setNotifications((rows) => rows.map((n) => ({ ...n, dismissed: true, read: true })));
  }, []);

  const notify = useCallback((input: NotifyInput) => {
    setNotifications((rows) => [
      { ...input, at: input.at ?? new Date().toISOString(), id: nextId("nt"), read: false, dismissed: false },
      ...rows,
    ]);
  }, []);

  const logActivity = useCallback((input: ActivityInput) => {
    setActivity((rows) => [{ ...input, at: input.at ?? new Date().toISOString(), id: nextId("ac") }, ...rows]);
  }, []);

  const logAudit = useCallback((input: AuditInput) => {
    setAudit((rows) => [{ ...input, at: input.at ?? new Date().toISOString(), id: nextId("au") }, ...rows]);
  }, []);

  const value = useMemo<NotificationsValue>(() => {
    const activityFor = (entityType: EntityType, entityId: string) =>
      activity
        .filter((a) => a.entityType === entityType && a.entityId === entityId)
        .sort((a, b) => b.at.localeCompare(a.at));
    return {
      notifications,
      activity,
      audit,
      unreadCount: notifications.filter((n) => !n.read && !n.dismissed).length,
      activityFor,
      markRead,
      markUnread,
      markAllRead,
      dismiss,
      clearDismissed,
      notify,
      logActivity,
      logAudit,
    };
  }, [notifications, activity, audit, markRead, markUnread, markAllRead, dismiss, clearDismissed, notify, logActivity, logAudit]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotifications() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}

/** Safe outside the manager app (tenant and owner portals). */
export const useOptionalNotifications = () => useContext(Ctx);
