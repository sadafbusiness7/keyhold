/**
 * Presentation pieces for the Leases module. No business rules live here —
 * the lease store (src/lib/mock-leases.tsx) owns state, this file draws it.
 */
import { useState, type ReactNode } from "react";
import {
  ArrowSquareOut,
  Scales,
  CheckCircle,
  Circle,
  PaperPlaneTilt,
  Eye,
  ChatCircleText,
  Lock,
  Receipt,
  Stamp,
  ClockCounterClockwise,
} from "@phosphor-icons/react";
import { Tag, type TagTone } from "@/components/keyhold/pipeline";
import {
  standardLeaseSource,
  signerLabel,
  statusLabel,
  type DisplayStatus,
  type LeaseAuditEntry,
  type LeaseInvoiceLink,
  type LeaseNoticeLink,
  type LeaseSigner,
} from "@/lib/mock-leases";
import { cad, longDate } from "@/lib/mock-data";

export const statusTone: Record<DisplayStatus, TagTone> = {
  draft: "navy",
  "out-for-signature": "action",
  active: "success",
  expiring: "warning",
  ended: "maple",
};

export function LeaseStatusTag({ status }: { status: DisplayStatus }) {
  return <Tag tone={statusTone[status]}>{statusLabel[status]}</Tag>;
}

/** "General information, not legal advice" + the official source and its version date. */
export function LeaseGuardrails({ province }: { province: string }) {
  const s = standardLeaseSource(province);
  return (
    <div className="space-y-2">
      <p className="flex gap-2 rounded-xl border border-border bg-navy-soft p-3 text-xs leading-relaxed text-navy">
        <Scales weight="duotone" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          <strong>General information, not legal advice.</strong> Keyhold fills the standard lease from your records and
          keeps a copy. Confirm the current form and the rules for your situation with your provincial tenancy authority,
          or get legal advice.
        </span>
      </p>
      <a
        href={s.url}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy-soft"
      >
        <ArrowSquareOut weight="duotone" className="h-4 w-4" aria-hidden="true" />
        {s.authority} · {s.formName} · {s.version} · effective {longDate(s.effectiveDate)}
      </a>
    </div>
  );
}

/** Says plainly that the assistant only pre-fills — the human confirms. */
export function AiConfirmNote({ children }: { children?: ReactNode }) {
  return (
    <p className="flex gap-2 rounded-xl border border-action/25 bg-action-soft p-3 text-xs leading-relaxed text-navy">
      <ChatCircleText weight="duotone" className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden="true" />
      <span>
        {children ?? "Keyhold pre-filled these fields from the property, unit and application, and explained them in plain language."}{" "}
        <strong>You review and confirm before anything is sent.</strong>
      </span>
    </p>
  );
}

export function WizardProgress({
  steps,
  step,
  onJump,
}: {
  steps: readonly string[];
  step: number;
  onJump: (i: number) => void;
}) {
  const pct = Math.round(((step + 1) / steps.length) * 100);
  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-sm font-bold text-navy">
          Step {step + 1} of {steps.length} · {steps[step]}
        </p>
        <p className="tnum text-xs text-muted-foreground">{pct}% complete</p>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-sunk)]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Lease wizard progress"
      >
        <div className="h-full rounded-full bg-action transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <ol className="flex flex-wrap gap-2">
        {steps.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => onJump(i)}
              aria-current={i === step ? "step" : undefined}
              className={`min-h-9 rounded-full border px-3 text-xs font-semibold ${
                i === step
                  ? "border-navy bg-navy text-primary-foreground"
                  : i < step
                    ? "border-success text-success"
                    : "border-border text-muted-foreground"
              }`}
            >
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Plain-language help: WHAT the field means and WHY it matters. */
export function StepHelp({ what, why }: { what: string; why: string }) {
  return (
    <div className="rounded-xl border border-border bg-navy-soft p-3 text-xs leading-relaxed text-navy">
      <p>
        <strong>What this is.</strong> {what}
      </p>
      <p className="mt-1">
        <strong>Why it matters.</strong> {why}
      </p>
    </div>
  );
}

const signerIcon = { "not-sent": Circle, sent: PaperPlaneTilt, viewed: Eye, signed: CheckCircle } as const;
const signerTone: Record<LeaseSigner["state"], TagTone> = {
  "not-sent": "navy",
  sent: "action",
  viewed: "warning",
  signed: "success",
};

export function SignerList({
  signers,
  onResend,
  onAdvance,
}: {
  signers: LeaseSigner[];
  onResend?: (id: string) => void;
  onAdvance?: (id: string) => void;
}) {
  if (signers.length === 0)
    return <p className="text-sm text-muted-foreground">Nobody has been asked to sign yet.</p>;
  return (
    <ul className="space-y-2">
      {signers.map((s) => {
        const Icon = signerIcon[s.state];
        return (
          <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
            <Icon weight="duotone" className="h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display font-bold text-navy">{s.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {s.role} · {s.email || "no email on file"}
                {s.updatedAt ? ` · ${longDate(s.updatedAt.slice(0, 10))}` : ""}
              </span>
            </span>
            <Tag tone={signerTone[s.state]}>{signerLabel[s.state]}</Tag>
            {s.state !== "signed" && onResend && (
              <button
                type="button"
                onClick={() => onResend(s.id)}
                className="min-h-9 rounded-full border border-border px-3 text-xs font-semibold text-navy hover:bg-navy-soft"
              >
                Resend
              </button>
            )}
            {s.state !== "signed" && onAdvance && (
              <button
                type="button"
                onClick={() => onAdvance(s.id)}
                className="min-h-9 rounded-full bg-action px-3 text-xs font-semibold text-primary-foreground hover:bg-action/90"
              >
                Simulate next
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function AuditTrail({ entries }: { entries: LeaseAuditEntry[] }) {
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;
  return (
    <ol className="space-y-3">
      {[...entries].reverse().map((e) => (
        <li key={e.id} className="flex gap-3 text-sm">
          <ClockCounterClockwise weight="duotone" className="mt-0.5 h-4 w-4 shrink-0 text-navy" aria-hidden="true" />
          <span>
            <span className="block text-navy">{e.what}</span>
            <span className="block text-xs text-muted-foreground">
              {e.who} · {new Date(e.at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function LinkedInvoices({ invoices }: { invoices: LeaseInvoiceLink[] }) {
  if (invoices.length === 0) return <p className="text-sm text-muted-foreground">No invoices are linked to this lease yet.</p>;
  return (
    <ul className="space-y-2">
      {invoices.map((i) => (
        <li key={i.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 text-sm">
          <Receipt weight="duotone" className="h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-navy">{i.label} · due {longDate(i.dueDate)}</span>
          <span className="money font-extrabold text-navy">{cad(i.amount)}</span>
          <Tag tone={i.paid ? "success" : "warning"}>{i.paid ? "Paid" : "Outstanding"}</Tag>
        </li>
      ))}
    </ul>
  );
}

export function LinkedNotices({ notices }: { notices: LeaseNoticeLink[] }) {
  if (notices.length === 0) return <p className="text-sm text-muted-foreground">No notices have been served under this lease.</p>;
  return (
    <ul className="space-y-2">
      {notices.map((n) => (
        <li key={n.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 text-sm">
          <Stamp weight="duotone" className="h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-navy">
            {n.type} · {n.summary}
          </span>
          <span className="text-xs text-muted-foreground">served {longDate(n.servedOn)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Simple mock document viewer — a paged preview of the lease content. */
export function DocumentViewer({ title, lines }: { title: string; lines: { label: string; value: string }[] }) {
  return (
    <div className="rounded-2xl border border-border bg-[var(--surface-sunk)] p-4">
      <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="font-display text-base font-extrabold text-navy">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">Preview — the signed PDF is stored with the lease record.</p>
        <dl className="mt-4 space-y-2 text-sm">
          {lines.map((l) => (
            <div key={l.label} className="flex flex-wrap justify-between gap-2 border-b border-border pb-2 last:border-0">
              <dt className="text-muted-foreground">{l.label}</dt>
              <dd className="text-navy">{l.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export function LockedBanner({ onRevert }: { onRevert: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-success/30 bg-success-soft p-3 text-sm text-navy">
      <Lock weight="duotone" className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        This lease is signed and locked. Editing it means reverting the signature — everyone would have to sign again.
      </span>
      <button
        type="button"
        onClick={onRevert}
        className="min-h-9 rounded-full border border-border bg-card px-3 text-xs font-semibold text-navy hover:bg-navy-soft"
      >
        Revert signature to edit
      </button>
    </div>
  );
}

/** Confirmation modal that names the consequence. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  destructive = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-lg">
        <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`min-h-11 rounded-full px-4 text-sm font-semibold text-primary-foreground ${
              destructive ? "bg-maple hover:bg-maple/90" : "bg-action hover:bg-action/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Small labelled block used across the detail page. */
export function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="card-soft p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="font-display text-base font-bold text-navy"
        >
          {title}
        </button>
        {action}
      </div>
      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}
