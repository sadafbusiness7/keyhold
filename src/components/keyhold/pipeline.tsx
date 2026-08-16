import type { CSSProperties, ReactNode } from "react";
import type { ProspectStatus, ScreeningStatus } from "@/lib/mock-leasing";

export type TagTone = "navy" | "action" | "success" | "warning" | "maple";

const tintVar: Record<TagTone, string> = {
  navy: "var(--navy)",
  action: "var(--action)",
  success: "var(--success)",
  warning: "var(--warning)",
  maple: "var(--maple)",
};

export function Tag({ tone = "navy", children, className = "" }: { tone?: TagTone; children: ReactNode; className?: string }) {
  return (
    <span className={`kh-tag ${className}`} style={{ "--tint": tintVar[tone] } as CSSProperties}>
      {children}
    </span>
  );
}

export const prospectTone: Record<ProspectStatus, TagTone> = {
  new: "action",
  screening: "warning",
  references: "warning",
  approved: "success",
  declined: "maple",
};

export const prospectLabel: Record<ProspectStatus, string> = {
  new: "New",
  screening: "Screening requested",
  references: "References received",
  approved: "Approved",
  declined: "Declined",
};

export const screeningLabel: Record<ScreeningStatus, string> = {
  none: "Not started",
  invited: "Invited",
  "in-progress": "In progress",
  complete: "Complete",
};

export const screeningTone: Record<ScreeningStatus, TagTone> = {
  none: "navy",
  invited: "action",
  "in-progress": "warning",
  complete: "success",
};

/** Legal guardrail shown wherever screening happens. */
export function ScreeningNotice() {
  return (
    <p className="rounded-xl border border-border bg-navy-soft p-3 text-xs leading-relaxed text-navy">
      Screening must follow human-rights, privacy and tenancy law. A report is one input only —
      <strong> the human decides, never the system.</strong> Keep consent on file and treat every applicant equally.
    </p>
  );
}

export const field =
  "mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm";
