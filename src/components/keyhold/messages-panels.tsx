/**
 * Messaging UI panels — presentation only. All state lives in mock-messages.tsx.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowBendUpLeft,
  ArrowBendUpRight,
  Archive,
  BellSlash,
  Bell,
  Copy,
  DotsThreeVertical,
  Envelope,
  EnvelopeOpen,
  MagnifyingGlass,
  Paperclip,
  PaperPlaneTilt,
  TextAa,
  Trash,
  Warning,
  X,
  CheckCircle,
  Circle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  contactById,
  contacts,
  conversationContext,
  conversationKind,
  conversationPropertyName,
  conversationTitle,
  dayKey,
  dayLabel,
  fillTemplate,
  initialsOf,
  lastMessage,
  shortStamp,
  statusLabel,
  timeLabel,
  useMessages,
  YOU,
  type Attachment,
  type Contact,
  type Conversation,
  type ContactKind,
  type Message,
} from "@/lib/mock-messages";

export type ListFilter = "all" | "unread" | "tenant" | "vendor" | "team";

const filterTabs: { id: ListFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "tenant", label: "Tenants" },
  { id: "vendor", label: "Vendors" },
  { id: "team", label: "Team" },
];

const kindLabel: Record<ContactKind, string> = { tenant: "Tenant", vendor: "Vendor", team: "Team" };

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-navy-soft font-semibold text-navy ${
        size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm"
      }`}
    >
      {initialsOf(name)}
    </span>
  );
}

function StatusChip({ status }: { status: NonNullable<Message["status"]> }) {
  const tone =
    status === "failed"
      ? "bg-maple-soft text-maple"
      : status === "opened"
        ? "bg-success-soft text-success"
        : "bg-surface-sunk text-muted-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>{statusLabel[status]}</span>;
}

/* ——— conversation list ——————————————————————————————— */
export function ConversationList({
  conversations,
  activeId,
  onSelect,
  query,
  onQuery,
  filter,
  onFilter,
  showArchived,
  onShowArchived,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  query: string;
  onQuery: (v: string) => void;
  filter: ListFilter;
  onFilter: (f: ListFilter) => void;
  showArchived: boolean;
  onShowArchived: (v: boolean) => void;
}) {
  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="relative">
        <MagnifyingGlass
          weight="duotone"
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <label htmlFor="conversation-search" className="sr-only">
          Search conversations
        </label>
        <input
          id="conversation-search"
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search people or messages"
          className="min-h-11 w-full rounded-full border border-input bg-background pl-9 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div role="tablist" aria-label="Filter conversations" className="flex flex-wrap gap-1.5">
        {filterTabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={filter === t.id}
            onClick={() => onFilter(t.id)}
            className={`min-h-9 rounded-full px-3 text-xs font-semibold transition-colors ${
              filter === t.id ? "bg-navy text-primary-foreground" : "bg-surface-sunk text-navy hover:bg-navy-soft"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={showArchived}
          onClick={() => onShowArchived(!showArchived)}
          className={`min-h-9 rounded-full px-3 text-xs font-semibold transition-colors ${
            showArchived ? "bg-action text-primary-foreground" : "bg-surface-sunk text-navy hover:bg-navy-soft"
          }`}
        >
          Archived
        </button>
      </div>

      {conversations.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Nothing matches that search.
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {conversations.map((c) => {
            const on = c.id === activeId;
            const last = lastMessage(c);
            const title = conversationTitle(c);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-current={on ? "true" : undefined}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${
                    on ? "border-action bg-action-soft" : "border-border bg-card hover:bg-navy-soft"
                  }`}
                >
                  <Avatar name={title} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-sm ${c.unread ? "font-bold text-navy" : "font-semibold text-navy"}`}>
                        {title}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {last ? shortStamp(last.at) : ""}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="rounded-full bg-surface-sunk px-1.5 py-0.5 font-medium">
                        {kindLabel[conversationKind(c)]}
                      </span>
                      <span className="truncate">{conversationContext(c)}</span>
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {last ? `${last.senderId === YOU ? "You: " : ""}${last.body}` : "No messages yet"}
                      </span>
                      {c.muted && <BellSlash weight="duotone" className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Muted" />}
                      {c.unread && (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-action px-1.5 text-[11px] font-bold text-primary-foreground">
                          <span className="sr-only">Unread</span>1
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ——— thread ——————————————————————————————————————— */
export function ThreadView({
  conversation,
  onBack,
  onForward,
}: {
  conversation: Conversation;
  onBack: () => void;
  onForward: (message: Message) => void;
}) {
  const { send, setRead, toggleArchive, toggleMute, deleteConversation, deleteMessage, templates } = useMessages();
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [confirmConversation, setConfirmConversation] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<Message | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const primary = contactById(conversation.participantIds[0] ?? "");

  useEffect(() => {
    setDraft("");
    setAttachments([]);
    setReplyTo(null);
  }, [conversation.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [conversation.messages.length, conversation.id]);

  const grouped = useMemo(() => {
    const days: { key: string; messages: Message[] }[] = [];
    for (const m of conversation.messages) {
      const key = dayKey(m.at);
      const bucket = days[days.length - 1];
      if (bucket && bucket.key === key) bucket.messages.push(m);
      else days.push({ key, messages: [m] });
    }
    return days;
  }, [conversation.messages]);

  function submit() {
    const body = draft.trim();
    if (!body) return;
    send(conversation.id, replyTo ? `Re: “${replyTo.body.slice(0, 40)}” — ${body}` : body, attachments);
    setDraft("");
    setAttachments([]);
    setReplyTo(null);
    toast.success("Message sent");
  }

  return (
    <section className="card-soft flex min-h-[32rem] flex-col p-0" aria-label={`Conversation with ${conversationTitle(conversation)}`}>
      <header className="flex items-start gap-3 border-b border-border p-4">
        <button
          type="button"
          onClick={onBack}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-navy hover:bg-navy-soft lg:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft weight="bold" className="h-5 w-5" />
        </button>
        <Avatar name={conversationTitle(conversation)} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-lg font-bold text-navy">{conversationTitle(conversation)}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {conversation.subject} · {conversationContext(conversation)}
            {conversationPropertyName(conversation) ? ` · ${conversationPropertyName(conversation)}` : ""}
          </p>
          {primary && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {kindLabel[primary.kind]}
              {primary.role ? ` · ${primary.role}` : ""} · {primary.email}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-navy hover:bg-navy-soft"
            aria-label="Conversation actions"
          >
            <DotsThreeVertical weight="bold" className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setRead(conversation.id, conversation.unread)}>
              {conversation.unread ? <EnvelopeOpen className="h-4 w-4" /> : <Envelope className="h-4 w-4" />}
              {conversation.unread ? "Mark as read" : "Mark as unread"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toggleMute(conversation.id)}>
              {conversation.muted ? <Bell className="h-4 w-4" /> : <BellSlash className="h-4 w-4" />}
              {conversation.muted ? "Unmute" : "Mute"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toggleArchive(conversation.id)}>
              <Archive className="h-4 w-4" />
              {conversation.archived ? "Unarchive" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setConfirmConversation(true)}>
              <Trash className="h-4 w-4" />
              Delete conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {grouped.map((day) => (
          <div key={day.key} className="space-y-3">
            <div className="flex items-center gap-3" role="separator" aria-label={dayLabel(day.messages[0]!.at)}>
              <span className="h-px flex-1 bg-border" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {dayLabel(day.messages[0]!.at)}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
            {day.messages.map((m) => {
              const mine = m.senderId === YOU;
              const sender = contactById(m.senderId);
              return (
                <article key={m.id} className={`group flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    {mine ? "You" : sender?.name ?? "Unknown"} {m.senderEmail ? `(${m.senderEmail})` : ""} · {timeLabel(m.at)}
                  </p>

                  <div
                    className={`mt-1 max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      mine ? "bg-action text-primary-foreground" : "bg-surface-sunk text-foreground"
                    }`}
                  >
                    {m.forwardedFrom && <p className="mb-1 text-[11px] opacity-80">Forwarded from {m.forwardedFrom}</p>}
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    {m.attachments.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {m.attachments.map((a) => (
                          <li key={a.id} className="flex items-center gap-1.5 text-xs opacity-90">
                            <Paperclip weight="duotone" className="h-3.5 w-3.5" aria-hidden="true" />
                            {a.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    {mine && m.status && <StatusChip status={m.status} />}
                    <MessageActions
                      onReply={() => setReplyTo(m)}
                      onForward={() => onForward(m)}
                      onCopy={async () => {
                        await navigator.clipboard?.writeText(m.body);
                        toast.success("Message copied");
                      }}
                      onDelete={() => setConfirmMessage(m)}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="space-y-2 border-t border-border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {replyTo && (
          <div className="flex items-center gap-2 rounded-xl bg-surface-sunk px-3 py-2 text-xs text-muted-foreground">
            <ArrowBendUpLeft weight="duotone" className="h-4 w-4" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">Replying to “{replyTo.body}”</span>
            <button type="button" onClick={() => setReplyTo(null)} className="rounded-full p-1 hover:bg-navy-soft" aria-label="Cancel reply">
              <X weight="bold" className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {attachments.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {attachments.map((a) => (
              <li key={a.id} className="flex items-center gap-1.5 rounded-full bg-surface-sunk px-3 py-1 text-xs">
                <Paperclip weight="duotone" className="h-3.5 w-3.5" aria-hidden="true" />
                {a.name}
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                  className="rounded-full p-0.5 hover:bg-navy-soft"
                  aria-label={`Remove ${a.name}`}
                >
                  <X weight="bold" className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <label htmlFor="reply-body" className="sr-only">
          Write a message
        </label>
        <textarea
          id="reply-body"
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Write a message… (Ctrl + Enter to send)"
          className="w-full resize-y rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              setAttachments((prev) => [
                ...prev,
                ...files.map((f) => ({ id: `${f.name}-${f.size}-${Math.random()}`, name: f.name, size: f.size })),
              ]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-navy hover:bg-navy-soft"
          >
            <Paperclip weight="duotone" className="h-4 w-4" aria-hidden="true" />
            Attach
          </button>
          <TemplateMenu
            templates={templates}
            contact={primary}
            onInsert={(body) => setDraft((prev) => (prev ? `${prev}\n${body}` : body))}
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-primary-foreground hover:bg-navy/90 disabled:opacity-50"
          >
            <PaperPlaneTilt weight="duotone" className="h-4 w-4" aria-hidden="true" />
            Send
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmConversation}
        onOpenChange={setConfirmConversation}
        title="Delete this conversation?"
        body="The whole history with this person will be removed from Keyhold. This cannot be undone."
        onConfirm={() => {
          deleteConversation(conversation.id);
          toast.success("Conversation deleted");
        }}
      />
      <ConfirmDialog
        open={confirmMessage !== null}
        onOpenChange={(v) => !v && setConfirmMessage(null)}
        title="Delete this message?"
        body="The message will be removed from the thread. This cannot be undone."
        onConfirm={() => {
          if (confirmMessage) deleteMessage(conversation.id, confirmMessage.id);
          setConfirmMessage(null);
          toast.success("Message deleted");
        }}
      />
    </section>
  );
}

function MessageActions({
  onReply,
  onForward,
  onCopy,
  onDelete,
}: {
  onReply: () => void;
  onForward: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-navy-soft hover:text-navy focus-visible:opacity-100"
        aria-label="Message actions"
      >
        <DotsThreeVertical weight="bold" className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onReply}>
          <ArrowBendUpLeft className="h-4 w-4" />
          Reply
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onForward}>
          <ArrowBendUpRight className="h-4 w-4" />
          Forward
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onCopy}>
          <Copy className="h-4 w-4" />
          Copy text
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={onDelete}>
          <Trash className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TemplateMenu({
  templates,
  contact,
  onInsert,
}: {
  templates: { id: string; name: string; body: string }[];
  contact: Contact | null;
  onInsert: (body: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-navy hover:bg-navy-soft">
        <TextAa weight="duotone" className="h-4 w-4" aria-hidden="true" />
        Template
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-w-xs">
        {templates.map((t) => (
          <DropdownMenuItem key={t.id} onSelect={() => onInsert(fillTemplate(t.body, contact))}>
            {t.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  body: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ——— compose ——————————————————————————————————————— */
export function ComposeDialog({
  open,
  onOpenChange,
  forwarding,
  onSent,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  forwarding: Message | null;
  onSent: (conversationId: string) => void;
}) {
  const { startConversation, templates } = useMessages();
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setPicked([]);
    setSubject(forwarding ? "Forwarded message" : "");
    setBody(forwarding ? forwarding.body : "");
    setAttachments(forwarding ? forwarding.attachments : []);
  }, [open, forwarding]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.role ?? "").toLowerCase().includes(q))
      .slice(0, 40);
  }, [search]);

  const firstPicked = contactById(picked[0] ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{forwarding ? "Forward message" : "New message"}</DialogTitle>
          <DialogDescription>
            Pick one person, or several for a group message. Everything stays attached to their home.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (picked.length === 0 || !body.trim()) return;
            const id = startConversation(picked, subject, body.trim(), attachments);
            toast.success(picked.length > 1 ? "Group message sent" : "Message sent");
            onOpenChange(false);
            onSent(id);
          }}
        >
          <div className="space-y-2">
            <label htmlFor="recipient-search" className="text-sm font-semibold text-navy">
              To
            </label>
            {picked.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {picked.map((id) => {
                  const c = contactById(id);
                  return (
                    <li key={id} className="flex items-center gap-1 rounded-full bg-action-soft px-3 py-1 text-xs font-medium text-navy">
                      {c?.name}
                      <button
                        type="button"
                        onClick={() => setPicked((prev) => prev.filter((p) => p !== id))}
                        className="rounded-full p-0.5 hover:bg-navy-soft"
                        aria-label={`Remove ${c?.name}`}
                      >
                        <X weight="bold" className="h-3 w-3" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <input
              id="recipient-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tenants, vendors or team"
              className="min-h-11 w-full rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <ul className="max-h-44 space-y-1 overflow-y-auto rounded-2xl border border-border p-1">
              {results.map((c) => {
                const on = picked.includes(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setPicked((prev) => (on ? prev.filter((p) => p !== c.id) : [...prev, c.id]))}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-navy-soft"
                    >
                      <Avatar name={c.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-navy">{c.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {kindLabel[c.kind]}
                          {c.role ? ` · ${c.role}` : ""} · {c.email}
                        </span>
                      </span>
                      {on ? (
                        <CheckCircle weight="fill" className="h-5 w-5 text-action" aria-hidden="true" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                );
              })}
              {results.length === 0 && <li className="p-3 text-sm text-muted-foreground">No one matches that search.</li>}
            </ul>
          </div>

          <div className="space-y-1">
            <label htmlFor="compose-subject" className="text-sm font-semibold text-navy">
              Subject <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="compose-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="min-h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="compose-body" className="text-sm font-semibold text-navy">
              Message
            </label>
            <textarea
              id="compose-body"
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full resize-y rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {attachments.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {attachments.map((a) => (
                <li key={a.id} className="flex items-center gap-1.5 rounded-full bg-surface-sunk px-3 py-1 text-xs">
                  <Paperclip weight="duotone" className="h-3.5 w-3.5" aria-hidden="true" />
                  {a.name}
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                    className="rounded-full p-0.5 hover:bg-navy-soft"
                    aria-label={`Remove ${a.name}`}
                  >
                    <X weight="bold" className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setAttachments((prev) => [
                  ...prev,
                  ...files.map((f) => ({ id: `${f.name}-${f.size}-${Math.random()}`, name: f.name, size: f.size })),
                ]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-navy hover:bg-navy-soft"
            >
              <Paperclip weight="duotone" className="h-4 w-4" aria-hidden="true" />
              Attach
            </button>
            <TemplateMenu
              templates={templates}
              contact={firstPicked}
              onInsert={(t) => {
                setBody((prev) => (prev ? `${prev}\n${t}` : t));
                const tpl = templates.find((x) => fillTemplate(x.body, firstPicked) === t);
                if (tpl && !subject) setSubject(tpl.subject);
              }}
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-medium text-navy hover:bg-navy-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={picked.length === 0 || !body.trim()}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90 disabled:opacity-50"
            >
              <PaperPlaneTilt weight="duotone" className="h-4 w-4" aria-hidden="true" />
              Send
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ——— loading / error ——————————————————————————————— */
export function MessagesSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading conversations…</span>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-sunk" />
        ))}
      </div>
      <div className="h-[32rem] animate-pulse rounded-3xl bg-surface-sunk" />
    </div>
  );
}

export function MessagesError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="card-soft flex flex-col items-center gap-3 p-10 text-center">
      <Warning weight="duotone" className="h-8 w-8 text-maple" aria-hidden="true" />
      <h2 className="font-display text-lg font-bold text-navy">We couldn't load your messages</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        The connection dropped on the way. Nothing was lost — try loading the inbox again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 items-center rounded-full bg-navy px-5 text-sm font-semibold text-primary-foreground hover:bg-navy/90"
      >
        Try again
      </button>
    </div>
  );
}
