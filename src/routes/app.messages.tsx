import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChatCircleDots, PencilSimpleLine } from "@phosphor-icons/react";
import { PageHeader } from "@/components/keyhold/app-shell";
import { EmptyState } from "@/components/keyhold/empty-state";
import {
  ComposeDialog,
  ConversationList,
  MessagesError,
  MessagesSkeleton,
  ThreadView,
  type ListFilter,
} from "@/components/keyhold/messages-panels";
import {
  conversationKind,
  conversationTitle,
  lastMessage,
  useMessages,
  type Message,
} from "@/lib/mock-messages";

export const Route = createFileRoute("/app/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Keyhold" },
      { name: "description", content: "One tidy conversation with each tenant, vendor and teammate, kept with the home they belong to." },
      { property: "og:title", content: "Messages — Keyhold" },
      { property: "og:description", content: "Talk to tenants, vendors and your team without digging through email." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { conversations, setRead } = useMessages();
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ListFilter>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileThread, setMobileThread] = useState(false);
  const [compose, setCompose] = useState(false);
  const [forwarding, setForwarding] = useState<Message | null>(null);

  // MOCK: stands in for the initial fetch so loading/error states are real.
  useEffect(() => {
    if (phase !== "loading") return;
    const t = setTimeout(() => setPhase("ready"), 450);
    return () => clearTimeout(t);
  }, [phase]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations
      .filter((c) => c.archived === showArchived)
      .filter((c) => {
        if (filter === "unread") return c.unread;
        if (filter === "all") return true;
        return conversationKind(c) === filter;
      })
      .filter((c) => {
        if (!q) return true;
        return (
          conversationTitle(c).toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.messages.some((m) => m.body.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (lastMessage(b)?.at ?? "").localeCompare(lastMessage(a)?.at ?? ""));
  }, [conversations, filter, query, showArchived]);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  function openConversation(id: string) {
    setActiveId(id);
    setMobileThread(true);
    setRead(id, true);
  }

  if (phase === "loading") {
    return (
      <>
        <MessagesHeader onCompose={() => setCompose(true)} />
        <MessagesSkeleton />
      </>
    );
  }

  if (phase === "error") {
    return (
      <>
        <MessagesHeader onCompose={() => setCompose(true)} />
        <MessagesError onRetry={() => setPhase("loading")} />
      </>
    );
  }

  return (
    <>
      <MessagesHeader onCompose={() => setCompose(true)} />

      {conversations.length === 0 ? (
        <EmptyState
          Icon={ChatCircleDots}
          title="No conversations yet — message a tenant"
          body="Start a thread and it stays attached to the tenant, the unit and the property, so nothing gets lost in email."
        >
          <button
            type="button"
            onClick={() => setCompose(true)}
            className="inline-flex min-h-11 items-center rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
          >
            New message
          </button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className={mobileThread ? "hidden lg:block" : "block"}>
            <ConversationList
              conversations={visible}
              activeId={activeId}
              onSelect={openConversation}
              query={query}
              onQuery={setQuery}
              filter={filter}
              onFilter={setFilter}
              showArchived={showArchived}
              onShowArchived={(v) => {
                setShowArchived(v);
                setActiveId(null);
              }}
            />
          </div>

          <div className={mobileThread ? "block" : "hidden lg:block"}>
            {active ? (
              <ThreadView
                conversation={active}
                onBack={() => setMobileThread(false)}
                onForward={(m) => {
                  setForwarding(m);
                  setCompose(true);
                }}
              />
            ) : (
              <div className="card-soft grid min-h-[32rem] place-items-center p-8 text-center">
                <div>
                  <ChatCircleDots weight="duotone" className="mx-auto h-8 w-8 text-navy" aria-hidden="true" />
                  <h2 className="mt-2 font-display text-lg font-bold text-navy">Pick a conversation</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose someone on the left, or start a new message.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ComposeDialog
        open={compose}
        onOpenChange={(v) => {
          setCompose(v);
          if (!v) setForwarding(null);
        }}
        forwarding={forwarding}
        onSent={(id) => {
          setForwarding(null);
          openConversation(id);
        }}
      />
      <DemoEmailTrigger />
    </>

  );
}

function DemoEmailTrigger() {
  const { receiveEmail } = useMessages();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("grace.okafor@example.ca");
  const [subject, setSubject] = useState("Re: Hot water is out");
  const [body, setBody] = useState("The plumber was great! Everything is fixed now.");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-20 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-navy text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
        title="Simulate inbound email reply"
      >
        <ChatCircleDots weight="bold" className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-navy">Simulate Inbound Email</h3>
            <p className="mt-1 text-sm text-muted-foreground">This simulates a tenant replying to a notification email.</p>
            
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">From</label>
                <input 
                  value={from} 
                  onChange={e => setFrom(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Subject</label>
                <input 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Message</label>
                <textarea 
                  rows={3}
                  value={body} 
                  onChange={e => setBody(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  receiveEmail({ from, subject, body });
                  setOpen(false);
                }}
                className="flex-1 rounded-full bg-action py-2.5 text-sm font-bold text-primary-foreground hover:bg-action/90"
              >
                Trigger simulation
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border border-border py-2.5 text-sm font-bold text-navy hover:bg-navy-soft"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MessagesHeader({ onCompose }: { onCompose: () => void }) {

  return (
    <PageHeader
      title="Messages"
      subtitle="Conversations stay attached to the home."
      action={
        <button
          type="button"
          onClick={onCompose}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
        >
          <PencilSimpleLine weight="duotone" className="h-4 w-4" aria-hidden="true" />
          New message
        </button>
      }
    />
  );
}
