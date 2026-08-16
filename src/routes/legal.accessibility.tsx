import { createFileRoute } from "@tanstack/react-router";
import { LEGAL_DOCS } from "@/lib/legal-content";
import { LegalPage } from "@/components/keyhold/legal-ui";

const doc = LEGAL_DOCS.accessibility;

export const Route = createFileRoute("/legal/accessibility")({
  head: () => ({
    meta: [
      { title: "Accessibility Statement — Keyhold" },
      { name: "description", content: "Keyhold's commitment to WCAG 2.1 Level AA: what we build in, the gaps we know about, and how to tell us." },
      { property: "og:title", content: "Accessibility Statement — Keyhold" },
      { property: "og:description", content: "WCAG 2.1 AA commitment, AODA alignment, known gaps and how to report a barrier." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <LegalPage doc={doc} />,
});
