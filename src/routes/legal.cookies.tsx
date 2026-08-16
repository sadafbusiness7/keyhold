import { createFileRoute } from "@tanstack/react-router";
import { LEGAL_DOCS } from "@/lib/legal-content";
import { LegalPage } from "@/components/keyhold/legal-ui";

const doc = LEGAL_DOCS.cookies;

export const Route = createFileRoute("/legal/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Notice — Keyhold" },
      { name: "description", content: "The cookies Keyhold stores in your browser, what each is for, and how to turn the optional ones off." },
      { property: "og:title", content: "Cookie Notice — Keyhold" },
      { property: "og:description", content: "Essential, preference and analytics cookies — no advertising, no selling." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <LegalPage doc={doc} />,
});
