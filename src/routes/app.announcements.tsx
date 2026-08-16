import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/keyhold/app-shell";
import { AnnouncementsScreen } from "@/components/keyhold/announcement-panels";

export const Route = createFileRoute("/app/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — Keyhold" },
      {
        name: "description",
        content: "Broadcast to all tenants, one property or one unit by email, SMS and portal — with a delivery report.",
      },
      { property: "og:title", content: "Announcements — Keyhold" },
      { property: "og:description", content: "Tell everyone once, and see who actually read it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  return (
    <>
      <PageHeader title="Announcements" subtitle="One message to a whole building — and proof it landed." />
      <AnnouncementsScreen />
    </>
  );
}
