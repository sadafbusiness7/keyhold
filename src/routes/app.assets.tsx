import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/keyhold/app-shell";
import { AssetsScreen } from "@/components/keyhold/asset-panels";

export const Route = createFileRoute("/app/assets")({
  head: () => ({
    meta: [
      { title: "Assets — Keyhold" },
      {
        name: "description",
        content: "Appliances, equipment and warranties per unit, plus door codes and wifi shared to the right tenants.",
      },
      { property: "og:title", content: "Assets — Keyhold" },
      { property: "og:description", content: "Serial numbers, warranty dates and access codes, all in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssetsPage,
});

function AssetsPage() {
  return (
    <>
      <PageHeader title="Assets" subtitle="What's in each unit, when the warranty ends, and who gets the door code." />
      <AssetsScreen />
    </>
  );
}
