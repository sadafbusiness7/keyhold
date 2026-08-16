/**
 * MOCK MESSAGING STORE — prototype state only, NOT a backend.
 * -----------------------------------------------------------
 * Holds conversations, messages, contacts and saved templates in React state.
 * Shapes mirror future Supabase tables (conversations, conversation_members,
 * messages, message_templates) so a backend can drop in behind the same API.
 * Swap the seed arrays below for queries and keep the same helper API.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { tenants as allTenants, unitAddress, unitById, propertyById } from "@/lib/mock-data";

export type ContactKind = "tenant" | "vendor" | "team";
export type DeliveryStatus = "sent" | "delivered" | "opened" | "failed";

export type Contact = {
  id: string;
  name: string;
  kind: ContactKind;
  email: string;
  /** tenants only */
  unitId?: string;
  /** vendors / team */
  role?: string;
};

export type Attachment = { id: string; name: string; size: number };

export type Message = {
  id: string;
  conversationId: string;
  /** "you" is the signed-in manager in this prototype */
  senderId: string;
  senderEmail?: string;
  body: string;

  /** ISO datetime */
  at: string;
  status?: DeliveryStatus;
  attachments: Attachment[];
  forwardedFrom?: string;
};

export type Conversation = {
  id: string;
  participantIds: string[];
  subject: string;
  unitId: string | null;
  unread: boolean;
  archived: boolean;
  muted: boolean;
  messages: Message[];
};

export type Template = { id: string; name: string; subject: string; body: string };

export const YOU = "you";

// —— contacts ——————————————————————————————————————————————
const tenantContacts: Contact[] = allTenants.map((t) => ({
  id: t.id,
  name: t.name,
  kind: "tenant" as const,
  email: t.email,
  unitId: t.unitId,
}));

const vendorContacts: Contact[] = [
  { id: "v1", name: "Riverside Plumbing", kind: "vendor", email: "dispatch@riversideplumbing.ca", role: "Plumber" },
  { id: "v2", name: "Bright Spark Electric", kind: "vendor", email: "jobs@brightspark.ca", role: "Electrician" },
  { id: "v3", name: "Northline HVAC", kind: "vendor", email: "service@northlinehvac.ca", role: "HVAC" },
  { id: "v4", name: "Chen Handyman Services", kind: "vendor", email: "wei@chenhandy.ca", role: "Handyman" },
  { id: "v5", name: "Frostline Snow & Lawn", kind: "vendor", email: "book@frostline.ca", role: "Landscaping & snow" },
];

const teamContacts: Contact[] = [
  { id: "u_priya", name: "Priya Raman", kind: "team", email: "priya@keyhold.ca", role: "Property manager" },
  { id: "u_sam", name: "Sam Beaulieu", kind: "team", email: "sam@keyhold.ca", role: "Property manager" },
];

export const contacts: Contact[] = [...tenantContacts, ...vendorContacts, ...teamContacts];

export const contactById = (id: string): Contact | null =>
  id === YOU ? { id: YOU, name: "You", kind: "team", email: "mrj@keyhold.ca" } : contacts.find((c) => c.id === id) ?? null;

export const initialsOf = (name: string) =>
  name
    .replace(/[^\p{L}\s&]/gu, "")
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

// —— seeds ——————————————————————————————————————————————
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

const seedConversations: Conversation[] = [
  {
    id: "c1",
    participantIds: ["t3"],
    subject: "Hot water is out",
    unitId: "u3",
    unread: true,
    archived: false,
    muted: false,
    messages: [
      { id: "m1", conversationId: "c1", senderId: "t3", body: "Hi, we have no hot water since last night. Two kids at home.", at: "2026-08-13T21:41:00", attachments: [] },
      { id: "m2", conversationId: "c1", senderId: YOU, body: "Sorry about that, Grace. I've called a plumber now.", at: "2026-08-13T22:02:00", status: "opened", attachments: [] },
      { id: "m3", conversationId: "c1", senderId: YOU, body: "The plumber is booked for Monday 9am. Someone will need to be home.", at: "2026-08-14T08:12:00", status: "delivered", attachments: [{ id: "a1", name: "work-order-WO-1.pdf", size: 84300 }] },
      { id: "m4", conversationId: "c1", senderId: "t3", body: "Perfect, I'll be here. Thank you.", at: "2026-08-14T08:26:00", attachments: [] },
    ],
  },
  {
    id: "c2",
    participantIds: ["t1"],
    subject: "Kitchen tap",
    unitId: "u1",
    unread: true,
    archived: false,
    muted: false,
    messages: [
      { id: "m5", conversationId: "c2", senderId: "t1", body: "The kitchen tap drips a little. Not urgent at all.", at: "2026-08-05T11:20:00", attachments: [] },
      { id: "m6", conversationId: "c2", senderId: "t1", body: "Any weekday after 4pm works for me.", at: "2026-08-05T11:21:00", attachments: [] },
    ],
  },
  {
    id: "c3",
    participantIds: ["v1"],
    subject: "Monday call-out — 88 Gerrard",
    unitId: "u3",
    unread: false,
    archived: false,
    muted: false,
    messages: [
      { id: "m7", conversationId: "c3", senderId: YOU, body: "Can you take a no-hot-water call Monday 9am? Tank pilot is out.", at: "2026-08-13T22:05:00", status: "opened", attachments: [] },
      { id: "m8", conversationId: "c3", senderId: "v1", body: "Booked. Tony will be there 9–10am with a replacement thermocouple.", at: "2026-08-13T22:40:00", attachments: [] },
    ],
  },
  {
    id: "c4",
    participantIds: ["u_priya"],
    subject: "Weekly walkthrough notes",
    unitId: null,
    unread: false,
    archived: false,
    muted: true,
    messages: [
      { id: "m9", conversationId: "c4", senderId: "u_priya", body: "Walkthrough done at Riverdale. Photos are in Documents.", at: "2026-08-12T16:10:00", attachments: [] },
      { id: "m10", conversationId: "c4", senderId: YOU, body: "Thanks Priya — anything for the maintenance list?", at: "2026-08-12T16:44:00", status: "opened", attachments: [] },
      { id: "m11", conversationId: "c4", senderId: "u_priya", body: "Just the back gate latch. I've logged it.", at: "2026-08-12T17:02:00", attachments: [] },
    ],
  },
  {
    id: "c5",
    participantIds: ["t5"],
    subject: "August rent",
    unitId: "u6",
    unread: false,
    archived: false,
    muted: false,
    messages: [
      { id: "m12", conversationId: "c5", senderId: "t5", body: "Rent will be sent on the 15th as usual.", at: "2026-08-02T18:03:00", attachments: [] },
      { id: "m13", conversationId: "c5", senderId: YOU, body: "Noted, thank you. I'll watch for the transfer.", at: "2026-08-02T18:30:00", status: "failed", attachments: [] },
    ],
  },
  {
    id: "c6",
    participantIds: ["t4"],
    subject: "Parking spot swap",
    unitId: "u4",
    unread: false,
    archived: true,
    muted: false,
    messages: [
      { id: "m14", conversationId: "c6", senderId: "t4", body: "All sorted with spot 4 — thanks again.", at: "2026-07-22T09:15:00", attachments: [] },
    ],
  },
];

export const seedTemplates: Template[] = [
  { id: "tpl-1", name: "Rent reminder", subject: "A friendly rent reminder", body: "Hi {{first_name}}, this is a friendly reminder that rent for {{unit}} is due on the 1st. Thank you!" },
  { id: "tpl-2", name: "Entry notice (24h)", subject: "Notice of entry", body: "Hi {{first_name}}, we'll need access to {{unit}} tomorrow between 9am and 12pm for a repair. This is your 24 hours' written notice." },
  { id: "tpl-3", name: "Repair scheduled", subject: "Your repair is booked", body: "Hi {{first_name}}, the repair at {{unit}} is booked. The contractor will confirm a window with you directly." },
  { id: "tpl-4", name: "Lease renewal", subject: "Renewing your lease", body: "Hi {{first_name}}, your lease at {{unit}} ends soon. Would you like to renew? Happy to talk through the options." },
];

export function fillTemplate(body: string, contact: Contact | null) {
  const first = contact?.name.split(/[\s&]+/)[0] ?? "there";
  const unit = contact?.unitId ? unitAddress(contact.unitId) : "your home";
  return body.replaceAll("{{first_name}}", first).replaceAll("{{name}}", contact?.name ?? "there").replaceAll("{{unit}}", unit);
}

// —— helpers ——————————————————————————————————————————————
export const conversationKind = (c: Conversation): ContactKind =>
  contactById(c.participantIds[0] ?? "")?.kind ?? "team";

export const conversationTitle = (c: Conversation) =>
  c.participantIds.map((id) => contactById(id)?.name ?? "Unknown").join(", ");

export const conversationContext = (c: Conversation) => (c.unitId ? unitAddress(c.unitId) : "No property attached");

export const conversationPropertyName = (c: Conversation) =>
  c.unitId ? propertyById(unitById(c.unitId).propertyId).name : null;

export const lastMessage = (c: Conversation) => c.messages[c.messages.length - 1] ?? null;

export const dayKey = (iso: string) => iso.slice(0, 10);

export function dayLabel(iso: string) {
  const key = dayKey(iso);
  if (key === "2026-08-14") return "Today";
  if (key === "2026-08-13") return "Yesterday";
  return new Date(`${key}T12:00:00`).toLocaleDateString("en-CA", { weekday: "long", month: "short", day: "numeric" });
}

export function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
}

export function shortStamp(iso: string) {
  const key = dayKey(iso);
  if (key === "2026-08-14") return timeLabel(iso);
  if (key === "2026-08-13") return "Yesterday";
  return new Date(`${key}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export const statusLabel: Record<DeliveryStatus, string> = {
  sent: "Sent",
  delivered: "Delivered",
  opened: "Opened",
  failed: "Failed",
};

// —— store ——————————————————————————————————————————————
type Ctx = {
  conversations: Conversation[];
  templates: Template[];
  unreadCount: number;
  send: (conversationId: string, body: string, attachments?: Attachment[], forwardedFrom?: string) => void;
  startConversation: (participantIds: string[], subject: string, body: string, attachments?: Attachment[]) => string;
  setRead: (conversationId: string, read: boolean) => void;
  toggleArchive: (conversationId: string) => void;
  toggleMute: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  receiveEmail: (input: { from: string; subject: string; body: string }) => void;
};


const MessagesContext = createContext<Ctx | null>(null);

/** MOCK: fake a delivery lifecycle so the status chips are believable. */
function nextStatus(): DeliveryStatus {
  return "sent";
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(seedConversations);
  const [templates] = useState<Template[]>(seedTemplates);

  const value = useMemo<Ctx>(() => {
    const nowIso = () => new Date().toISOString().slice(0, 19);

    const appendMessage = (conversationId: string, message: Message) =>
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, messages: [...c.messages, message] } : c)),
      );

    return {
      conversations,
      templates,
      unreadCount: conversations.filter((c) => c.unread && !c.archived).length,
      send: (conversationId, body, attachments = [], forwardedFrom) =>
        appendMessage(conversationId, {
          id: uid("m"),
          conversationId,
          senderId: YOU,
          body,
          at: nowIso(),
          status: nextStatus(),
          attachments,
          ...(forwardedFrom ? { forwardedFrom } : {}),
        }),
      startConversation: (participantIds, subject, body, attachments = []) => {
        const id = uid("c");
        const first = contactById(participantIds[0] ?? "");
        const conversation: Conversation = {
          id,
          participantIds,
          subject: subject.trim() || "No subject",
          unitId: participantIds.length === 1 ? first?.unitId ?? null : null,
          unread: false,
          archived: false,
          muted: false,
          messages: [
            { id: uid("m"), conversationId: id, senderId: YOU, body, at: nowIso(), status: nextStatus(), attachments },
          ],
        };
        setConversations((prev) => [conversation, ...prev]);
        return id;
      },
      setRead: (conversationId, read) =>
        setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unread: !read } : c))),
      toggleArchive: (conversationId) =>
        setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, archived: !c.archived } : c))),
      toggleMute: (conversationId) =>
        setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, muted: !c.muted } : c))),
      deleteConversation: (conversationId) =>
        setConversations((prev) => prev.filter((c) => c.id !== conversationId)),
      deleteMessage: (conversationId, messageId) =>
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) } : c,
          ),
        ),
      receiveEmail: ({ from, subject, body }) => {
        // 1. Find matching contact by email
        const sender = contacts.find(c => c.email.toLowerCase() === from.toLowerCase());
        
        if (!sender) {
          toast.error(`Quarantined message from unknown sender: ${from}`);
          console.warn("Graceful quarantine: unknown sender", from);
          return;
        }

        // 2. Find existing conversation or start new one
        const existing = conversations.find(c => 
          c.participantIds.includes(sender.id) && 
          (c.subject.toLowerCase().includes(subject.toLowerCase()) || subject.toLowerCase().includes(c.subject.toLowerCase()))
        );

        if (existing) {
          appendMessage(existing.id, {
            id: uid("m"),
            conversationId: existing.id,
            senderId: sender.id,
            senderEmail: from,
            body,
            at: nowIso(),
            attachments: [],
          });
          setConversations(prev => prev.map(c => c.id === existing.id ? { ...c, unread: true } : c));
          toast.info(`New reply from ${sender.name}`);
        } else {
          const id = uid("c");
          const conversation: Conversation = {
            id,
            participantIds: [sender.id],
            subject: subject || "New Message",
            unitId: sender.unitId ?? null,
            unread: true,
            archived: false,
            muted: false,
            messages: [
              { id: uid("m"), conversationId: id, senderId: sender.id, senderEmail: from, body, at: nowIso(), attachments: [] },
            ],
          };
          setConversations(prev => [conversation, ...prev]);
          toast.info(`New conversation from ${sender.name}`);
        }
      },
    };
  }, [conversations, templates]);


  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

export function useMessages() {
  const ctx = useContext(MessagesContext);
  if (!ctx) throw new Error("useMessages must be used inside <MessagesProvider>");
  return ctx;
}

/** Safe on screens that may sit outside the provider (e.g. the nav badge). */
export function useOptionalMessages() {
  return useContext(MessagesContext);
}
