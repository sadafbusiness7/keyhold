import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/keyhold/app-shell";
import { InspectionsScreen } from "@/components/keyhold/inspection-panels";

export const Route = createFileRoute("/app/inspections")({
  head: () => ({
    meta: [
      { title: "Inspections — Keyhold" },
      {
        name: "description",
        content: "Move-in and move-out inspections with photos, condition ratings, signatures and side-by-side comparison.",
      },
      { property: "og:title", content: "Inspections — Keyhold" },
      { property: "og:description", content: "Photo-backed inspection records that settle deposit disputes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InspectionsPage,
});

function InspectionsPage() {
  return (
    <>
      <PageHeader title="Inspections" subtitle="Room by room, with photos — the evidence you need at move-out." />
      <InspectionsScreen />
    </>
  );
}
