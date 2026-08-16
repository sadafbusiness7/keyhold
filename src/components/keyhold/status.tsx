import type { CSSProperties, ReactNode } from "react";

export type Tone = "success" | "warning" | "maple" | "action" | "navy";

const tintVar: Record<Tone, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  maple: "var(--maple)",
  action: "var(--action)",
  navy: "var(--navy)",
};

const toneClass: Record<Tone, { rail: string; text: string; chip: string }> = {
  success: { rail: "bg-success", text: "text-success", chip: "bg-success-soft text-success" },
  warning: { rail: "bg-warning", text: "text-warning", chip: "bg-warning-soft text-warning" },
  maple: { rail: "bg-maple", text: "text-maple", chip: "bg-maple-soft text-maple" },
  action: { rail: "bg-action", text: "text-action", chip: "bg-action-soft text-action" },
  navy: { rail: "bg-navy", text: "text-navy", chip: "bg-navy-soft text-navy" },
};


export type StatusKey =
  | "paid"
  | "due-soon"
  | "overdue"
  | "partial"
  | "void"
  | "emergency"
  | "open"
  | "in-progress"
  | "resolved"
  | "occupied"
  | "vacant"
  | "new"
  | "assigned"
  | "scheduled"
  | "completed"
  | "cancelled"
  | "draft"
  | "awaiting-approval"
  | "approved"
  | "rejected"
  | "urgent"
  | "soon"
  | "whenever";

export const statusMeta: Record<StatusKey, { label: string; tone: Tone }> = {
  paid: { label: "Paid", tone: "success" },
  "due-soon": { label: "Due soon", tone: "warning" },
  overdue: { label: "Overdue", tone: "maple" },
  partial: { label: "Part paid", tone: "warning" },
  void: { label: "Voided", tone: "navy" },
  emergency: { label: "Emergency", tone: "maple" },
  open: { label: "Open", tone: "warning" },
  "in-progress": { label: "Being fixed", tone: "action" },
  resolved: { label: "Resolved", tone: "success" },
  occupied: { label: "Lived in", tone: "success" },
  vacant: { label: "Empty", tone: "warning" },
  // maintenance requests & work orders
  new: { label: "New", tone: "action" },
  assigned: { label: "Assigned", tone: "action" },
  scheduled: { label: "Scheduled", tone: "action" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "navy" },
  // bills
  draft: { label: "Draft", tone: "navy" },
  "awaiting-approval": { label: "Needs approval", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "maple" },
  // urgency
  urgent: { label: "Urgent", tone: "warning" },
  soon: { label: "Soon", tone: "action" },
  whenever: { label: "Whenever", tone: "navy" },
};

/**
 * Signature status marker: squared, tracked-out type with a tone square —
 * deliberately no glyph icons.
 */
export function StatusLabel({ status, className = "" }: { status: StatusKey; className?: string }) {
  const { label, tone } = statusMeta[status];
  return (
    <span className={`kh-tag ${className}`} style={{ "--tint": tintVar[tone] } as CSSProperties}>
      {label}
    </span>
  );
}


/** Card or row with the signature 4px status rail on the left edge. */
export function RailCard({
  status,
  children,
  as: As = "div",
  className = "",
}: {
  status: StatusKey;
  children: ReactNode;
  as?: "div" | "li" | "article";
  className?: string;
}) {
  const { tone } = statusMeta[status];
  return (
    <As
      className={`relative overflow-hidden card-soft pl-5 ${className}`}
    >
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${toneClass[tone].rail}`} />
      {children}
    </As>
  );
}

export function toneText(tone: Tone) {
  return toneClass[tone].text;
}
export function toneChip(tone: Tone) {
  return toneClass[tone].chip;
}
export function toneRail(tone: Tone) {
  return toneClass[tone].rail;
}
