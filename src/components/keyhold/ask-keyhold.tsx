/**
 * ASK KEYHOLD — the in-app assistant.
 * Two jobs: answer questions about the signed-in user's OWN scoped data, and
 * walk them through a screen. It reports figures the rent engine calculated,
 * never derives money, never decides anything legal, and never acts without an
 * explicit confirmation step.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChatCircleText, X, PaperPlaneTilt, ArrowSquareOut, ShieldCheck, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useRent } from "@/lib/mock-rent";
import { useOptionalAccess, usePermissions } from "@/lib/mock-access";
import { properties as allProperties } from "@/lib/mock-data";
import { balanceCents, invoiceStatus, paidCents, periodOf, toCents } from "@/lib/rent-engine";
import {
  answer,
  limitKey,
  MONTHLY_LIMIT,
  SUGGESTIONS,
  GUEST_SUGGESTIONS,
  type AssistantAnswer,
  type AssistantScope,
  type ConfirmPlan,
} from "@/lib/assistant-engine";

/** Public screens sit outside <AccessProvider>; the assistant still loads. */
export function AskKeyhold({ bottomClass = "bottom-5" }: { bottomClass?: string } = {}) {
  const ctx = useOptionalAccess();
  return ctx ? <ScopedAssistant bottomClass={bottomClass} /> : <Assistant scope={guestScope()} userId="guest" bottomClass={bottomClass} />;
}

function guestScope(): AssistantScope {
  return {
    signedIn: false,
    role: "guest",
    canSeeFinancials: false,
    today: "",
    unpaid: [],
    rentRoll: { billedCents: 0, collectedCents: 0, outstandingCents: 0, units: 0, occupied: 0 },
    leasesEnding: [],
    openRepairs: [],
    vacancies: [],
  };
}

function ScopedAssistant({ bottomClass }: { bottomClass: string }) {
  const p = usePermissions();
  const r = useRent();

  const scope = useMemo<AssistantScope>(() => {
    const period = periodOf(r.today);
    const unitIds = new Set(p.units.map((u) => u.id));
    const where = (unitId: string) => {
      const unit = p.units.find((u) => u.id === unitId);
      const prop = allProperties.find((x) => x.id === unit?.propertyId);
      return unit ? `${prop?.address ?? prop?.name ?? "Property"} · ${unit.label}` : "Unit";
    };
    const money = p.canSeeFinancials();

    const current = r.invoices.filter((i) => i.period === period && unitIds.has(i.unitId));
    // Money is never derived here — every figure below comes from rent-engine.
    const billedCents = current.reduce((s, i) => s + i.amountCents, 0);
    const collectedCents = current.reduce((s, i) => s + paidCents(i, r.payments) + i.creditAppliedCents, 0);
    const outstandingCents = current.reduce((s, i) => s + balanceCents(i, r.payments), 0);

    const byTenant = new Map<string, { balanceCents: number; overdue: boolean; unitId: string }>();
    for (const inv of current) {
      const bal = balanceCents(inv, r.payments);
      if (bal <= 0) continue;
      const prev = byTenant.get(inv.tenantId) ?? { balanceCents: 0, overdue: false, unitId: inv.unitId };
      byTenant.set(inv.tenantId, {
        balanceCents: prev.balanceCents + bal,
        overdue: prev.overdue || invoiceStatus(inv, r.payments, r.today) === "overdue",
        unitId: inv.unitId,
      });
    }

    const in90 = new Date(`${r.today}T00:00:00`);
    in90.setDate(in90.getDate() + 90);

    return {
      signedIn: true,
      role: p.isOwner ? "owner" : p.isPm ? "pm" : "tenant",
      canSeeFinancials: money,
      today: r.today,
      unpaid: money
        ? [...byTenant.entries()].map(([tenantId, v]) => {
            const t = p.tenants.find((x) => x.id === tenantId);
            return {
              tenantId,
              name: t?.name ?? "Tenant",
              email: t?.email ?? "",
              where: where(v.unitId),
              balanceCents: v.balanceCents,
              overdue: v.overdue,
            };
          })
        : [],
      rentRoll: {
        billedCents,
        collectedCents,
        outstandingCents,
        units: p.units.length,
        occupied: p.units.filter((u) => u.tenantId).length,
      },
      leasesEnding: p.leases
        .filter((l) => {
          const end = new Date(`${l.end}T00:00:00`);
          return end >= new Date(`${r.today}T00:00:00`) && end <= in90;
        })
        .sort((a, b) => a.end.localeCompare(b.end))
        .map((l) => ({
          name: p.tenants.find((t) => t.id === l.tenantId)?.name ?? "Tenant",
          where: where(l.unitId),
          end: l.end,
          type: l.type,
        })),
      openRepairs: p.tickets
        .filter((t) => t.status !== "resolved")
        .map((t) => ({ title: t.title, where: where(t.unitId), status: t.status === "emergency" ? "emergency" : t.status === "in-progress" ? "in progress" : "open" })),
      vacancies: p.units.filter((u) => !u.tenantId).map((u) => ({ where: where(u.id), rentCents: toCents(u.rent) })),
    };
  }, [p, r]);

  return <Assistant scope={scope} userId={p.user.id} bottomClass={bottomClass} />;
}

type Turn =
  | { from: "you"; text: string }
  | { from: "keyhold"; text: string; reply?: AssistantAnswer }
  | { from: "keyhold"; text: string; done: true };

function Assistant({ scope, userId, bottomClass = "bottom-5" }: { scope: AssistantScope; userId: string; bottomClass?: string }) {
  const [open, setOpen] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState("");
  const [used, setUsed] = useState(0);
  const [pending, setPending] = useState<ConfirmPlan | null>(null);
  const [log, setLog] = useState<Turn[]>([
    {
      from: "keyhold",
      text: scope.signedIn
        ? "Hello. Ask me about your own rent, leases, repairs and vacancies, or how to do something in Keyhold. I report figures the system worked out — I never do the maths myself, and I never decide anything legal. Anything I send waits for your confirmation."
        : "Hello. Ask me anything about Keyhold — what it does, what it costs, the Canadian rules it handles, or how to bring your records across. Your own portfolio answers appear once you sign in.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const key = limitKey(userId, scope.today || new Date().toISOString().slice(0, 10));
  useEffect(() => {
    const stored = Number(window.localStorage.getItem(key) ?? "0");
    setUsed(Number.isFinite(stored) ? stored : 0);
  }, [key]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [log, thinking]);

  const left = Math.max(0, MONTHLY_LIMIT - used);

  const send = (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    setDraft("");
    if (left <= 0) {
      setLog((l) => [
        ...l,
        { from: "you", text: q },
        {
          from: "keyhold",
          text: `You've used all ${MONTHLY_LIMIT} questions for this month. Nothing is lost — your counter resets on the 1st, and every screen still works as normal.`,
        },
      ]);
      return;
    }
    setLog((l) => [...l, { from: "you", text: q }]);
    setThinking(true);
    window.setTimeout(() => {
      const reply = answer(q, scope);
      setLog((l) => [...l, { from: "keyhold", text: reply.text, reply }]);
      setThinking(false);
      const next = used + 1;
      setUsed(next);
      window.localStorage.setItem(key, String(next));
    }, 550);
  };

  const confirmSend = () => {
    if (!pending) return;
    setLog((l) => [...l, { from: "keyhold", text: pending.successText, done: true }]);
    toast.success(pending.successText);
    setPending(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed right-5 z-40 ${bottomClass} inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-navy/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action`}
        aria-haspopup="dialog"
      >
        <ChatCircleText weight="duotone" className="h-5 w-5" aria-hidden="true" />
        Ask Keyhold
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-0 sm:p-5">
          <button className="absolute inset-0 bg-navy/30" aria-label="Close assistant" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Ask Keyhold"
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
            className="relative flex h-[85vh] w-full flex-col rounded-t-3xl border border-border bg-card shadow-xl sm:h-[34rem] sm:w-[26rem] sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <h2 className="font-display text-base font-bold">Ask Keyhold</h2>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {left} of {MONTHLY_LIMIT} left this month
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-navy hover:bg-navy-soft"
                aria-label="Close assistant"
              >
                <X weight="duotone" className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
              {log.map((m, i) =>
                m.from === "you" ? (
                  <p key={i} className="ml-auto max-w-[85%] rounded-2xl bg-action px-3 py-2 text-sm text-primary-foreground">
                    {m.text}
                  </p>
                ) : (
                  <Bubble key={i} turn={m} onConfirm={setPending} />
                ),
              )}

              {thinking && (
                <p className="flex items-center gap-1.5 rounded-2xl bg-surface-sunk px-3 py-2 text-sm text-muted-foreground">
                  <Dot delay="0ms" /> <Dot delay="150ms" /> <Dot delay="300ms" />
                  <span className="sr-only">Keyhold is looking that up</span>
                </p>
              )}

              {left > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {(scope.signedIn ? SUGGESTIONS : GUEST_SUGGESTIONS).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-border px-3 py-2 text-xs font-medium text-navy hover:bg-navy-soft"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={endRef} />
            </div>

            {pending && <ConfirmCard plan={pending} onCancel={() => setPending(null)} onConfirm={confirmSend} />}

            <form
              className="flex items-center gap-2 border-t border-border p-3"
              onSubmit={(e) => {
                e.preventDefault();
                send(draft);
              }}
            >
              <label className="sr-only" htmlFor="ask-keyhold-input">
                Your question
              </label>
              <input
                id="ask-keyhold-input"
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={left <= 0}
                placeholder={left > 0 ? "Type your question" : "You're out of questions this month"}
                className="min-h-11 flex-1 rounded-full border border-input bg-background px-4 text-sm placeholder:text-muted-foreground disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={left <= 0 || thinking}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy text-primary-foreground disabled:opacity-50"
                aria-label="Send question"
              >
                <PaperPlaneTilt weight="duotone" className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-navy/50 motion-safe:animate-pulse"
      style={{ animationDelay: delay }}
      aria-hidden="true"
    />
  );
}

function Bubble({ turn, onConfirm }: { turn: Turn & { from: "keyhold" }; onConfirm: (p: ConfirmPlan) => void }) {
  const reply = "reply" in turn ? turn.reply : undefined;
  const done = "done" in turn;
  return (
    <div
      className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm ${
        done ? "border border-evergreen/30 bg-evergreen-soft text-navy" : "bg-surface-sunk text-foreground"
      }`}
    >
      <p className="flex gap-1.5">
        {done && <CheckCircle weight="duotone" className="mt-0.5 h-4 w-4 shrink-0 text-evergreen" aria-hidden="true" />}
        <span>{turn.text}</span>
      </p>

      {reply?.steps && (
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-navy">
          {reply.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      )}

      {reply?.bullets && (
        <ul className="mt-2 space-y-1 text-sm tabular-nums text-navy">
          {reply.bullets.map((b) => (
            <li key={b} className="border-l-2 border-action/40 pl-2">
              {b}
            </li>
          ))}
        </ul>
      )}

      {reply?.note && (
        <p className="mt-2 flex gap-1.5 rounded-xl border border-border bg-card p-2 text-xs leading-relaxed text-navy">
          <ShieldCheck weight="duotone" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{reply.note}</span>
        </p>
      )}

      {reply?.source && (
        <a
          href={reply.source.url}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy-soft"
        >
          <ArrowSquareOut weight="duotone" className="h-4 w-4" aria-hidden="true" />
          {reply.source.label}
        </a>
      )}

      {reply?.actions && reply.actions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {reply.actions.map((a) =>
            a.kind === "navigate" ? (
              <Link
                key={a.label}
                to={a.to}
                className="inline-flex min-h-9 items-center rounded-full border border-navy/20 bg-card px-3 text-xs font-semibold text-navy hover:bg-navy-soft"
              >
                {a.label}
              </Link>
            ) : (
              <button
                key={a.label}
                type="button"
                onClick={() => onConfirm(a.plan)}
                className="inline-flex min-h-9 items-center rounded-full bg-action px-3 text-xs font-semibold text-primary-foreground hover:bg-action/90"
              >
                {a.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/** Nothing is ever sent without this panel: exactly who, exactly what. */
function ConfirmCard({ plan, onCancel, onConfirm }: { plan: ConfirmPlan; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="max-h-[55%] overflow-y-auto border-t border-border bg-navy-soft/60 p-3">
      <p className="font-display text-sm font-bold text-navy">{plan.title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{plan.channel} · nothing sends until you confirm</p>
      <ul className="mt-2 space-y-1">
        {plan.recipients.map((rcp) => (
          <li key={rcp.email || rcp.name} className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-navy">
            <span className="font-semibold">{rcp.name}</span> · {rcp.email}
            <span className="block tabular-nums text-muted-foreground">{rcp.detail}</span>
          </li>
        ))}
      </ul>
      <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-border bg-card p-3 font-sans text-xs leading-relaxed text-navy">
        {plan.message}
      </pre>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90"
        >
          Send now
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-card px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
