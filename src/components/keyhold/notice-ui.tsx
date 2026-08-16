/**
 * Shared UI for Provincial Notices: the legal guardrails that must be visible
 * on every screen where a notice is created, generated or served.
 */
import { Scales, ArrowSquareOut, ChatCircleText } from "@phosphor-icons/react";
import { NOTICE_SOURCES, fullDate, type NoticeType } from "@/lib/notices-engine";
import { LegalDisclaimer } from "./legal-ui";

/** "General information, not legal advice" — required near every notice. */
export function LegalNotice({ className = "", type }: { className?: string; type?: NoticeType }) {
  if (type) {
    const s = NOTICE_SOURCES[type];
    return (
      <LegalDisclaimer
        className={className}
        source={{ label: `${s.authority} · ${s.formName}`, url: s.url, version: s.version, effectiveDate: s.effectiveDate }}
      >
        Keyhold fills in the form from your records and keeps a copy. Confirm the current form and the rules for your
        situation with the Landlord and Tenant Board, or get legal advice.
      </LegalDisclaimer>
    );
  }
  return (
    <p className={`flex gap-2 rounded-xl border border-border bg-navy-soft p-3 text-xs leading-relaxed text-navy ${className}`}>
      <Scales weight="duotone" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        <strong>General information, not legal advice.</strong> Keyhold fills in the form from your records and keeps a
        copy. Confirm the current form and the rules for your situation with the Landlord and Tenant Board, or get legal
        advice.
      </span>
    </p>
  );
}


/** The official source, its version and effective date. */
export function SourceLink({ type }: { type: NoticeType }) {
  const s = NOTICE_SOURCES[type];
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy-soft"
    >
      <ArrowSquareOut weight="duotone" className="h-4 w-4" aria-hidden="true" />
      {s.authority} · {s.formName} · {s.version} · effective {fullDate(s.effectiveDate)}
    </a>
  );
}

/** Says plainly what the assistant did and did not do. */
export function AiPrefillNote({ children }: { children?: React.ReactNode }) {
  return (
    <p className="flex gap-2 rounded-xl border border-action/25 bg-action-soft p-3 text-xs leading-relaxed text-navy">
      <ChatCircleText weight="duotone" className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden="true" />
      <span>
        {children ?? "Keyhold pre-filled these fields from your property, lease and rent records and explained them in plain language."}{" "}
        <strong>You review and confirm before anything is generated or served.</strong> Keyhold never decides to serve a
        notice.
      </span>
    </p>
  );
}
