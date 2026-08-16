import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { 
  Envelope, 
  DeviceMobile, 
  Desktop, 
  CaretRight, 
  Copy, 
  Check,
  Eye,
  EnvelopeSimple,
  TextT
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/keyhold/app-shell";
import { EMAIL_TEMPLATES } from "@/lib/email-templates";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings/emails")({
  component: EmailGalleryPage,
});

const DEMO_DATA = {
  INVITE: { tenantName: "Sarah Jenkins", propertyName: "Parkview Estates", inviteUrl: "#" },
  RENT_REMINDER: { tenantName: "Sarah Jenkins", amount: "$1,850.00", dueDate: "Sep 1, 2026", address: "123 Maple St, Unit 4B", payUrl: "#" },
  RENT_OVERDUE: { tenantName: "Sarah Jenkins", amount: "$1,850.00", days: 3, address: "123 Maple St, Unit 4B", payUrl: "#" },
  PAYMENT_RECEIPT: { tenantName: "Sarah Jenkins", amount: "$1,850.00", date: "Aug 1, 2026", address: "123 Maple St, Unit 4B", receiptUrl: "#" },
  MAINTENANCE_REQUEST: { tenantName: "Sarah Jenkins", category: "Plumbing", id: "REQ-992", address: "123 Maple St, Unit 4B", viewUrl: "#" },
  MAINTENANCE_UPDATE: { tenantName: "Sarah Jenkins", status: "In Progress", id: "REQ-992", note: "Plumber scheduled for Tuesday morning at 9am.", viewUrl: "#" },
  LEASE_EXPIRING: { tenantName: "Sarah Jenkins", expiryDate: "Dec 31, 2026", address: "123 Maple St, Unit 4B", actionUrl: "#" },
  NOTICE_SERVED: { tenantName: "Sarah Jenkins", noticeType: "N1 (Rent Increase)", address: "123 Maple St, Unit 4B", viewUrl: "#" },
  DOCUMENT_SHARED: { tenantName: "Sarah Jenkins", docName: "Building_Rules_2026.pdf", sharedBy: "Alex Chen", viewUrl: "#" },
  TEAM_INVITE: { name: "Alex Chen", orgName: "Keyhold Management", inviteUrl: "#" },
  PASSWORD_RESET: { name: "Sarah Jenkins", resetUrl: "#" },
  ONBOARDING: { name: "Alex Chen", setupUrl: "#" },
  MONTHLY_DIGEST: { name: "Alex Chen", month: "July 2026", income: "$42,500", occupancy: "98%", viewUrl: "#" },
  YEARLY_RECEIPT: { tenantName: "Sarah Jenkins", year: "2025", totalPaid: "$22,200.00", viewUrl: "#" },
};

function EmailGalleryPage() {
  const [selected, setSelected] = useState<keyof typeof EMAIL_TEMPLATES>("INVITE");
  const [view, setView] = useState<"html" | "text">("html");
  const [device, setDevice] = useState<"mobile" | "desktop">("desktop");
  const [copied, setCopied] = useState(false);

  const template = EMAIL_TEMPLATES[selected];
  const demoData = (DEMO_DATA as any)[selected];

  const handleCopyText = () => {
    navigator.clipboard.writeText(template.text(demoData));
    setCopied(true);
    toast.success("Text version copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <PageHeader 
        title="Email Templates" 
        subtitle="Preview transactional emails sent to tenants and team members."
      />

      <div className="flex flex-1 min-h-0 divide-x divide-border bg-background">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 flex flex-col min-h-0">
          <div className="p-4 border-b border-border bg-navy-soft/30">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tenant Templates</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {Object.entries(EMAIL_TEMPLATES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setSelected(key as any)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-between group ${
                  selected === key 
                    ? "bg-navy text-primary-foreground font-semibold" 
                    : "hover:bg-navy-soft text-navy"
                }`}
              >
                <span className="truncate pr-2">{key.replace(/_/g, " ").toLowerCase()}</span>
                <CaretRight weight="bold" className={`h-3 w-3 transition-transform ${selected === key ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-navy-soft/20">
          {/* Toolbar */}
          <div className="h-14 bg-card border-b border-border px-6 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-navy-soft p-1 rounded-lg">
                <button
                  onClick={() => setView("html")}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${view === "html" ? "bg-card text-navy shadow-sm" : "text-muted-foreground"}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Eye weight="bold" />
                    <span>Visual</span>
                  </div>
                </button>
                <button
                  onClick={() => setView("text")}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${view === "text" ? "bg-card text-navy shadow-sm" : "text-muted-foreground"}`}
                >
                  <div className="flex items-center gap-1.5">
                    <TextT weight="bold" />
                    <span>Plain Text</span>
                  </div>
                </button>
              </div>

              {view === "html" && (
                <div className="flex items-center gap-1 bg-navy-soft p-1 rounded-lg">
                  <button
                    onClick={() => setDevice("desktop")}
                    className={`p-1.5 rounded-md transition-all ${device === "desktop" ? "bg-card text-navy shadow-sm" : "text-muted-foreground"}`}
                    title="Desktop view"
                  >
                    <Desktop weight="bold" className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDevice("mobile")}
                    className={`p-1.5 rounded-md transition-all ${device === "mobile" ? "bg-card text-navy shadow-sm" : "text-muted-foreground"}`}
                    title="Mobile view"
                  >
                    <DeviceMobile weight="bold" className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground italic">Powered by Resend</span>
              <button 
                onClick={handleCopyText}
                className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-bold text-navy hover:bg-navy-soft"
              >
                {copied ? <Check weight="bold" className="text-success" /> : <Copy weight="bold" />}
                <span>Copy Text Version</span>
              </button>
            </div>
          </div>

          {/* Subject Line Bar */}
          <div className="px-6 py-3 bg-card border-b border-border flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider w-16">Subject:</span>
            <span className="text-sm font-semibold text-navy">{template.subject}</span>
          </div>

          {/* Actual Preview */}
          <div className="flex-1 overflow-y-auto p-8 flex justify-center">
            {view === "html" ? (
              <div 
                className={`bg-white shadow-2xl transition-all duration-300 origin-top ${
                  device === "mobile" ? "w-[375px]" : "w-[600px]"
                }`}
              >
                {template.render(demoData)}
              </div>
            ) : (
              <div className="w-[600px] bg-card border border-border rounded-2xl p-8 font-mono text-sm whitespace-pre-wrap text-navy shadow-inner">
                {template.text(demoData)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
