import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChartLineUp, ShieldCheck, Info, Clock, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageHeader } from "@/components/keyhold/app-shell";
import { EmptyState } from "@/components/keyhold/empty-state";
import { usePermissions } from "@/lib/mock-access";
import { useCanada, CONSENT_TEXT, CREDIT_PARTNER, type CreditReport } from "@/lib/mock-canada";
import { tenants, unitById, unitAddress, longDate } from "@/lib/mock-data";
import { cad } from "@/lib/mock-data";

export const Route = createFileRoute("/app/credit-reporting")({
  head: () => ({
    meta: [
      { title: "Rent reporting to credit bureaus — Keyhold" },
      {
        name: "description",
        content: "See which tenants have opted in to rent reporting, when they consented, and the reporting status for each month.",
      },
      { property: "og:title", content: "Rent reporting to credit bureaus — Keyhold" },
      { property: "og:description", content: "Consent-based monthly rent reporting through a partner bureau service." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreditReportingPage,
});

const btn = "inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft";
const btnPrimary = "inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90";

export function reportChip(status: CreditReport["status"]) {
  if (status === "reported-on-time") return { label: "Reported on time", cls: "bg-success-soft text-navy", Icon: CheckCircle };
  if (status === "reported-late") return { label: "Reported late", cls: "bg-warning-soft text-navy", Icon: WarningCircle };
  if (status === "pending") return { label: "Pending", cls: "bg-navy-soft text-navy", Icon: Clock };
  return { label: "Not reported", cls: "bg-muted text-muted-foreground", Icon: Info };
}

function CreditReportingPage() {
  const perms = usePermissions();
  const canada = useCanada();
  const [confirming, setConfirming] = useState<string | null>(null);

  const visibleUnitIds = new Set(
    perms.properties.flatMap((p) => perms.units.filter((u) => u.propertyId === p.id).map((u) => u.id)),
  );
  const rows = tenants.filter((t) => visibleUnitIds.has(t.unitId)).slice(0, 12);

  if (!rows.length) {
    return (
      <>
        <PageHeader title="Rent reporting" />
        <EmptyState Icon={ChartLineUp} title="No tenants in your view" body="Rent reporting appears once a tenant is on a lease you manage." />
      </>
    );
  }

  const enrolledCount = rows.filter((t) => canada.enrollmentFor(t.id).status === "enrolled").length;

  return (
    <>
      <PageHeader
        title="Rent reporting to credit bureaus"
        subtitle="Tenants who opt in have their monthly rent payments reported through our partner bureau service."
      />

      <section className="mb-5 flex items-start gap-3 rounded-2xl border border-border bg-navy-soft p-4 text-sm text-navy">
        <ShieldCheck weight="duotone" className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p>
          Reporting is carried out by {CREDIT_PARTNER}, not by Keyhold. Enrolment requires the tenant's explicit consent, is recorded with a
          timestamp, and can be withdrawn at any time. On-time and late payments are both reported. No credit-score outcome is promised.
        </p>
      </section>

      <p className="mb-3 text-sm text-muted-foreground">
        {enrolledCount} of {rows.length} tenants enrolled.
      </p>

      <ul className="space-y-3">
        {rows.map((t) => {
          const enrollment = canada.enrollmentFor(t.id);
          const history = canada.reportsFor(t.id);
          const unit = unitById(t.unitId);
          return (
            <li key={t.id} className="card-soft p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-bold text-navy">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {unitAddress(t.unitId)} · {cad(unit.rent)}/month
                  </p>
                  {enrollment.consentAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Consent recorded {new Date(enrollment.consentAt).toLocaleString("en-CA")}
                      {enrollment.revokedAt ? ` · withdrawn ${new Date(enrollment.revokedAt).toLocaleString("en-CA")}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      enrollment.status === "enrolled" ? "bg-success-soft text-navy" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {enrollment.status === "enrolled" ? "Enrolled" : enrollment.status === "revoked" ? "Consent withdrawn" : "Not enrolled"}
                  </span>
                  {enrollment.status === "enrolled" ? (
                    <button
                      type="button"
                      className={btn}
                      onClick={() => {
                        canada.revoke(t.id);
                        toast.success(`${t.name}'s consent withdrawn. Reporting stops with this month.`);
                      }}
                    >
                      Withdraw consent
                    </button>
                  ) : (
                    <button type="button" className={btnPrimary} onClick={() => setConfirming(t.id)}>
                      Record consent
                    </button>
                  )}
                </div>
              </div>

              {confirming === t.id && (
                <div className="mt-3 rounded-xl border border-border p-3">
                  <p className="text-sm text-navy">{CONSENT_TEXT}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Only record this once {t.name} has agreed in writing. The timestamp is stored on their record.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className={btnPrimary}
                      onClick={() => {
                        canada.enroll(t.id);
                        setConfirming(null);
                        toast.success(`${t.name} enrolled. Consent recorded with a timestamp.`);
                      }}
                    >
                      {t.name} consented — enrol
                    </button>
                    <button type="button" className={btn} onClick={() => setConfirming(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {history.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {history.map((r) => {
                    const chip = reportChip(r.status);
                    return (
                      <li key={r.id} className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-display text-[10.5px] font-extrabold uppercase tracking-[0.07em] ${chip.cls}`}>
                        {r.period} · {chip.label}
                        {r.submittedOn ? <span className="font-normal"> ({longDate(r.submittedOn)})</span> : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
