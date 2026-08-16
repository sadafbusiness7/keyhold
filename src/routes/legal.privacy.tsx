import { createFileRoute } from "@tanstack/react-router";
import { LEGAL_DOCS } from "@/lib/legal-content";
import { LegalPage } from "@/components/keyhold/legal-ui";

const doc = LEGAL_DOCS.privacy;

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Keyhold" },
      { name: "description", content: "PIPEDA-aligned privacy policy: what Keyhold collects, why, how long we keep it, our processors, and cross-border transfer." },
      { property: "og:title", content: "Privacy Policy — Keyhold" },
      { property: "og:description", content: "What Keyhold collects, why, retention periods, third-party processors and your PIPEDA rights." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <LegalPage doc={doc} />,
});
