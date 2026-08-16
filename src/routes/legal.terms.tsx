import { createFileRoute } from "@tanstack/react-router";
import { LEGAL_DOCS } from "@/lib/legal-content";
import { LegalPage } from "@/components/keyhold/legal-ui";

const doc = LEGAL_DOCS.terms;

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Keyhold" },
      { name: "description", content: "The agreement between you and Keyhold: what we provide, what you agree to, fees, cancellation and the limits of both." },
      { property: "og:title", content: "Terms of Service — Keyhold" },
      { property: "og:description", content: "Keyhold's terms of service for Canadian landlords. Draft wording, pending legal review." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <LegalPage doc={doc} />,
});
