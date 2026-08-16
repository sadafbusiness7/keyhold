import { createFileRoute } from "@tanstack/react-router";
import { LEGAL_DOCS } from "@/lib/legal-content";
import { LegalPage } from "@/components/keyhold/legal-ui";

const doc = LEGAL_DOCS.security;

export const Route = createFileRoute("/legal/security")({
  head: () => ({
    meta: [
      { title: "Security — Keyhold" },
      { name: "description", content: "How Keyhold protects rental records, what we ask of you, and how to report a security concern." },
      { property: "og:title", content: "Security — Keyhold" },
      { property: "og:description", content: "Encryption, least-privilege access, audit logging, breach response and responsible disclosure." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <LegalPage doc={doc} />,
});
