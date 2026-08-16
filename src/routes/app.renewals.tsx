import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowsClockwise, BellRinging } from "@phosphor-icons/react";
import { toast } from "sonner";
import { RequireFinancials } from "@/components/keyhold/access-guard";
import { PageHeader } from "@/components/keyhold/app-shell";
import { EmptyState } from "@/components/keyhold/empty-state";
import { RenewalDrawer, RenewalRow, btn } from "@/components/keyhold/renewal-panels";
import { usePermissions } from "@/lib/mock-access";
import { useCanada } from "@/lib/mock-canada";
import { useLeases, daysUntil, type LeaseRecord } from "@/lib/mock-leases";
import { useSettings } from "@/lib/mock-settings";
import {
  BUCKET_LABEL,
  RENEWAL_STATUSES,
  bucketFor,
  renewalStatusLabel,
  useRenewals,
  type RenewalBucket,
  type RenewalStatus,
} from "@/lib/mock-renewals";
import { unitById, longDate } from "@/lib/mock-data";
import { NOTICE_SOURCES } from "@/lib/notices-engine";

export const Route = createFileRoute("/app/renewals")({
  head: () => ({
    meta: [
      { title: "Renewals pipeline — Keyhold" },
      {
        name: "description",
        content: "Leases expiring in 30, 60 or 90 days, renewal offers with guideline rent increases, and move-out checklists.",
      },
      { property: "og:title", content: "Renewals pipeline — Keyhold" },
      { property: "og:description", content: "Track every expiring lease from offer to signed new term — or a clean move-out." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireFinancials title="Renewals">
      <RenewalsPage />
    </RequireFinancials>
  ),
});

function RenewalsPage() {
  const perms = usePermissions();
  const leases = useLeases();
  const renewals = useRenewals();
  const settings = useSettings();
  const canada = useCanada();

  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RenewalStatus | "all">("all");

  const today = renewals.today;
  const leadDays = settings.lease.renewalLeadDays;
  const guideline = canada.guidelineFor(Number(today.slice(0, 4)) + 1) ?? canada.guidelineFor(Number(today.slice(0, 4)));
  const visible = useMemo(() => new Set(perms.properties.map((p) => p.id)), [perms.properties]);

  const expiring = useMemo(
    () =>
      leases.leases
        .filter((l) => l.status === "active")
        .filter((l) => visible.has(unitById(l.unitId).propertyId))
        .filter((l) => bucketFor(l) !== null)
        .sort((a, b) => daysUntil(a.endDate) - daysUntil(b.endDate)),
    [leases.leases, visible],
  );

  const filtered = expiring.filter((l) => filter === "all" || renewals.statusOf(l.id) === filter);
  const groups: { bucket: RenewalBucket; rows: LeaseRecord[] }[] = (["30", "60", "90"] as RenewalBucket[]).map((bucket) => ({
    bucket,
    rows: filtered.filter((l) => bucketFor(l) === bucket),
  }));

  const dueReminders = expiring.filter(
    (l) => daysUntil(l.endDate) <= leadDays && renewals.statusOf(l.id) === "not-started",
  );

  const openLease = openId ? leases.leases.find((l) => l.id === openId) ?? null : null;

  if (!expiring.length) {
    return (
      <>
        <PageHeader title="Renewals" subtitle="Every lease ending in the next 90 days, in one pipeline." />
        <EmptyState
          Icon={ArrowsClockwise}
          title="Nothing expiring in the next 90 days"
          body="Leases move into this pipeline automatically 90 days before the end of the term."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Renewals" subtitle="Offer, response, new term — or a clean move-out. Ontario increases run through the guideline calculator." />

      {dueReminders.length > 0 && (
        <div className="card-soft mb-5 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="flex items-start gap-2 text-sm text-navy">
            <BellRinging weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-action" aria-hidden="true" />
            <span>
              <span className="font-semibold">{dueReminders.length} renewal{dueReminders.length === 1 ? "" : "s"} due to start.</span>{" "}
              Your lease settings ask for {leadDays} days' lead time.
            </span>
          </p>
          <button type="button" className={btn} onClick={() => setOpenId(dueReminders[0]!.id)}>
            Start the first one
          </button>
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter by renewal status">
        {(["all", ...RENEWAL_STATUSES] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={filter === s}
            onClick={() => setFilter(s as RenewalStatus | "all")}
            className={`min-h-11 rounded-full px-4 text-sm font-semibold ${
              filter === s ? "bg-navy text-primary-foreground" : "border border-border text-navy hover:bg-navy-soft"
            }`}
          >
            {s === "all" ? `All (${expiring.length})` : renewalStatusLabel[s as RenewalStatus]}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {groups.map(({ bucket, rows }) => (
          <section key={bucket}>
            <h2 className="mb-2 font-display text-base font-bold text-navy">
              {BUCKET_LABEL[bucket]} <span className="tnum text-sm font-semibold text-muted-foreground">({rows.length})</span>
            </h2>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing in this group.</p>
            ) : (
              <ul className="space-y-2">
                {rows.map((l) => (
                  <RenewalRow key={l.id} lease={l} status={renewals.statusOf(l.id)} onOpen={() => setOpenId(l.id)} />
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {openLease && (
        <RenewalDrawer
          lease={openLease}
          record={renewals.forLease(openLease.id)}
          today={today}
          guidelinePct={guideline?.pct ?? 2.5}
          guidelineUrl={guideline?.sourceUrl ?? NOTICE_SOURCES.N1.url}
          defaultTermMonths={settings.lease.defaultTermMonths}
          onClose={() => setOpenId(null)}
          onStart={(offer) => renewals.startRenewal(openLease.id, offer)}
          onSend={() => {
            renewals.sendOffer(openLease.id);
            toast.success("Renewal offer sent to the tenant.");
          }}
          onRespond={(accepted) => renewals.recordResponse(openLease.id, accepted)}
          onComplete={() => {
            const id = renewals.completeRenewal(openLease.id);
            if (id) toast.success("New term created and invoicing scheduled.");
          }}
          onEnd={(moveOut, reason) => {
            renewals.startEnding(openLease.id, moveOut, reason);
            toast.success(`Move-out started — keys due ${longDate(moveOut)}.`);
          }}
          onToggleStep={(key) => renewals.toggleStep(openLease.id, key)}
          onForwarding={(v) => renewals.setForwardingAddress(openLease.id, v)}
        />
      )}
    </>
  );
}
