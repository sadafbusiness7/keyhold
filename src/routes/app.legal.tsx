import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowSquareOut, Scales } from "@phosphor-icons/react";
import { PageHeader } from "@/components/keyhold/app-shell";
import { LegalDocBody, LegalNav, DocDisclaimer } from "@/components/keyhold/legal-ui";
import { LEGAL_DOCS, LEGAL_LAST_REVIEWED, legalDocList, type LegalDocId } from "@/lib/legal-content";
import { dayOnly } from "@/lib/mock-consent";

export const Route = createFileRoute("/app/legal")({
  head: () => ({
    meta: [
      { title: "Legal & privacy — Keyhold" },
      { name: "description", content: "Read Keyhold's terms, PIPEDA privacy policy, cookie notice, accessibility statement and security page without leaving the app." },
      { property: "og:title", content: "Legal & privacy — Keyhold" },
      { property: "og:description", content: "The documents your tenants may ask about, plus links to consent records and privacy rights." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppLegalPage,
});

function AppLegalPage() {
  const [docId, setDocId] = useState<LegalDocId>("privacy");
  const doc = LEGAL_DOCS[docId];

  return (
    <>
      <PageHeader
        title="Legal & privacy"
        subtitle={`Draft wording, pending review by Canadian counsel. Last internal review ${dayOnly(LEGAL_LAST_REVIEWED)}.`}
      />

      <div className="card-soft p-4 sm:p-5">
        <DocDisclaimer docId="privacy">
          These pages describe how Keyhold handles information. They are not advice about your obligations as a
          landlord.
        </DocDisclaimer>

        <div className="mt-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Legal documents">
          {legalDocList().map((d) => (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={docId === d.id}
              onClick={() => setDocId(d.id)}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold ${
                docId === d.id ? "bg-navy text-primary-foreground" : "border border-border text-navy hover:bg-navy-soft"
              }`}
            >
              {d.short}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <h2 className="sr-only">{doc.title}</h2>
          <LegalDocBody doc={doc} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href={doc.path}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
          >
            <ArrowSquareOut weight="duotone" className="h-4 w-4" aria-hidden="true" /> Open the public page to share
          </a>
          <Link
            to="/app/settings"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
          >
            <Scales weight="duotone" className="h-4 w-4" aria-hidden="true" /> Consent records & privacy rights
          </Link>
        </div>
      </div>

      <div className="mt-4 card-soft p-4 sm:p-5">
        <h2 className="font-display text-base font-bold text-navy">Share with a tenant</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Public links you can paste into a message, lease package or listing.
        </p>
        <div className="mt-3">
          <LegalNav />
        </div>
      </div>
    </>
  );
}
