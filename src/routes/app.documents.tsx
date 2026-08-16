import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/keyhold/app-shell";
import { DocumentsScreen } from "@/components/keyhold/document-panels";

export const Route = createFileRoute("/app/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Keyhold" },
      {
        name: "description",
        content: "Leases, notices, receipts and inspection reports filed by property, with expiry reminders and version history.",
      },
      { property: "og:title", content: "Documents — Keyhold" },
      { property: "og:description", content: "Every paper you might need, filed where you'd look for it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  return (
    <>
      <PageHeader title="Documents" subtitle="Filed by property, tagged by tenant, with expiry dates you won't miss." />
      <DocumentsScreen />
    </>
  );
}
