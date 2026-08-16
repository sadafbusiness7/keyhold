import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/keyhold/app-shell";
import { NotificationCentre } from "@/components/keyhold/notification-panels";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Keyhold" },
      { name: "description", content: "Everything that happened across your rentals: rent, repairs, leases and account changes, grouped by day." },
      { property: "og:title", content: "Notifications — Keyhold" },
      { property: "og:description", content: "Everything that happened across your rentals: rent, repairs, leases and account changes, grouped by day." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <>
      <PageHeader title="Notifications" subtitle="What happened, when, and where to go about it." />
      <NotificationCentre />
    </>
  );
}
