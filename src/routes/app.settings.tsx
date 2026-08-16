import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Buildings,
  BellRinging,
  CurrencyDollar,
  FileText,
  Receipt,
  ChatText,
  EnvelopeSimple,
  ShieldCheck,
  Palette,
  Translate,

  ClockCounterClockwise,
  Handshake,
  Scales,
  Clock,
  Database,
  CreditCard,
} from "@phosphor-icons/react";
import { PageHeader } from "@/components/keyhold/app-shell";
import { EmptyState } from "@/components/keyhold/empty-state";
import { usePermissions } from "@/lib/mock-access";
import {
  BillingPanel,
  BusinessPanel,
  DataPanel,
  LeasePanel,
  NotificationsPanel,
  RentPanel,
  SecurityPanel,
  TaxPanel,
  TemplatesPanel,
} from "@/components/keyhold/settings-panels";
import { AuditLogPanel } from "@/components/keyhold/audit-panels";
import { BrandingPanel, LanguagePanel } from "@/components/keyhold/branding-panel";
import { ConsentPanel, PrivacyRightsPanel, RetentionPanel, SecurityExtrasPanel } from "@/components/keyhold/privacy-panels";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings & billing — Keyhold" },
      { name: "description", content: "Business profile, notifications, rent rules, lease defaults, tax, templates, security, privacy and your Keyhold plan." },
      { property: "og:title", content: "Settings & billing — Keyhold" },
      { property: "og:description", content: "Every Keyhold preference in one place, plus your plan and invoices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const SECTIONS = [
  { key: "business", label: "Business profile", Icon: Buildings },
  { key: "notifications", label: "Notifications", Icon: BellRinging },
  { key: "rent", label: "Rent & payments", Icon: CurrencyDollar },
  { key: "lease", label: "Lease settings", Icon: FileText },
  { key: "tax", label: "Tax settings", Icon: Receipt },
  { key: "templates", label: "Templates", Icon: ChatText },
  { key: "emails", label: "Email Gallery", Icon: EnvelopeSimple },
  { key: "branding", label: "Branding", Icon: Palette },
  { key: "language", label: "Language & region", Icon: Translate },

  { key: "security", label: "Security", Icon: ShieldCheck },
  { key: "audit", label: "Audit log", Icon: ClockCounterClockwise },
  { key: "consent", label: "Consent records", Icon: Handshake },
  { key: "privacy-rights", label: "Privacy rights", Icon: Scales },
  { key: "retention", label: "Data retention", Icon: Clock },
  { key: "data", label: "Data & privacy", Icon: Database },
  { key: "billing", label: "Plan & billing", Icon: CreditCard },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

function SettingsPage() {
  const { canSeeSettings, units } = usePermissions();
  const [section, setSection] = useState<SectionKey>("business");

  if (!canSeeSettings) {
    return (
      <>
        <PageHeader title="Settings" />
        <EmptyState
          Icon={ShieldCheck}
          title="Settings and billing are owner-only"
          body="Property managers work on their assigned properties; account settings stay with the owner."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Your business, your rules, and what Keyhold costs you." />

      <div className="grid gap-4 lg:grid-cols-[15rem_1fr]">
        <nav aria-label="Settings sections" className="lg:sticky lg:top-20 lg:self-start">
          <ul className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {SECTIONS.map(({ key, label, Icon }) => (
              <li key={key} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  aria-current={section === key ? "page" : undefined}
                  onClick={() => setSection(key)}
                  className={`flex min-h-11 w-full items-center gap-2 rounded-full px-3.5 text-sm font-semibold lg:rounded-xl ${
                    section === key ? "bg-navy text-primary-foreground" : "text-navy hover:bg-navy-soft"
                  }`}
                >
                  <Icon weight="duotone" className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-4">
          {section === "business" && <BusinessPanel />}
          {section === "notifications" && <NotificationsPanel />}
          {section === "rent" && <RentPanel />}
          {section === "lease" && <LeasePanel />}
          {section === "tax" && <TaxPanel />}
          {section === "templates" && <TemplatesPanel />}
          {section === "branding" && <BrandingPanel />}
          {section === "language" && <LanguagePanel />}
          {section === "emails" && (
            <div className="card-soft overflow-hidden h-[800px]">
              <iframe 
                src="/app/settings/emails" 
                className="w-full h-full border-0" 
                title="Email Template Gallery"
              />
            </div>
          )}

          {section === "security" && (
            <>
              <SecurityPanel />
              <SecurityExtrasPanel />
            </>
          )}
          {section === "audit" && <AuditLogPanel />}
          {section === "consent" && <ConsentPanel />}
          {section === "privacy-rights" && <PrivacyRightsPanel />}
          {section === "retention" && <RetentionPanel />}
          {section === "data" && <DataPanel />}
          {section === "billing" && <BillingPanel unitCount={units.length} />}
        </div>
      </div>
    </>
  );
}
