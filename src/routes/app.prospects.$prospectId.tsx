import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ShieldCheck, FileText, ArrowLeft, CheckCircle } from "@phosphor-icons/react";
import { PageHeader } from "@/components/keyhold/app-shell";
import { RequireFinancials } from "@/components/keyhold/access-guard";
import { EmptyState } from "@/components/keyhold/empty-state";
import { Tag, ScreeningNotice, prospectLabel, prospectTone, screeningLabel, screeningTone } from "@/components/keyhold/pipeline";
import { useLeasing, prospectStages } from "@/lib/mock-leasing";
import { cad, longDate, unitAddress } from "@/lib/mock-data";

export const Route = createFileRoute("/app/prospects/$prospectId")({
  head: () => ({
    meta: [
      { title: "Prospect — Keyhold" },
      { name: "description", content: "Application details, screening status and the one-click path to a pre-filled lease." },
      { property: "og:title", content: "Prospect — Keyhold" },
      { property: "og:description", content: "Review, screen and approve an applicant, then create their lease." },
    ],
  }),
  component: () => (
    <RequireFinancials title="Prospect">
      <ProspectPage />
    </RequireFinancials>
  ),
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border py-2 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-navy">{value}</dd>
    </div>
  );
}

function ProspectPage() {
  const { prospectId } = Route.useParams();
  const navigate = useNavigate();
  const { prospects, applications, listings, setProspectStatus, requestScreening, advanceScreening, draftFromProspect } = useLeasing();

  const prospect = prospects.find((p) => p.id === prospectId);
  if (!prospect) {
    return (
      <>
        <PageHeader title="Prospect" />
        <EmptyState Icon={FileText} title="That application is gone" body="It may have been declined and removed from the pipeline." />
      </>
    );
  }
  const app = applications.find((a) => a.id === prospect.applicationId)!;
  const listing = listings.find((l) => l.id === app.listingId);

  return (
    <>
      <PageHeader
        title={app.fullName}
        subtitle={listing ? `${listing.headline} · ${unitAddress(listing.unitId)}` : "Application"}
        action={
          <Link to="/app/prospects" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
            <ArrowLeft weight="duotone" className="h-4 w-4" aria-hidden="true" /> Pipeline
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="card-soft p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone={prospectTone[prospect.status]}>{prospectLabel[prospect.status]}</Tag>
            <Tag tone={screeningTone[prospect.screening.status]}>Screening {screeningLabel[prospect.screening.status]}</Tag>
            {app.creditConsent && <Tag tone="success">Credit consent on file</Tag>}
          </div>

          <h2 className="mt-5 font-display text-base font-bold text-navy">Application</h2>
          <dl className="mt-2">
            <Row label="Email" value={app.email} />
            <Row label="Phone" value={app.phone} />
            <Row label="Employer" value={`${app.employer} · ${app.jobTitle}`} />
            <Row label="Monthly income" value={cad(app.monthlyIncome)} />
            <Row label="Preferred move-in" value={longDate(app.moveIn)} />
            <Row label="Occupants" value={app.occupants} />
            <Row label="Reference" value={`${app.referenceName} · ${app.referencePhone}`} />
            {app.guarantorName && <Row label="Guarantor" value={`${app.guarantorName} · ${app.guarantorPhone}`} />}
            <Row label="Documents" value={app.documents.join(", ") || "None uploaded"} />
            <Row label="Submitted" value={longDate(app.submittedOn)} />
          </dl>
          {app.note && <p className="mt-3 rounded-xl bg-navy-soft p-3 text-sm text-navy">“{app.note}”</p>}
        </section>

        <div className="space-y-6">
          <section className="card-soft p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
              <ShieldCheck weight="duotone" className="h-5 w-5" aria-hidden="true" /> Screening (SingleKey)
            </h2>
            <p className="tnum mt-2 text-sm text-muted-foreground">
              {prospect.screening.requestedOn ? `Requested ${longDate(prospect.screening.requestedOn)}` : "No request sent yet."}
              {prospect.screening.score ? ` · Score ${prospect.screening.score}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {prospect.screening.status === "none" ? (
                <button
                  type="button"
                  onClick={() => {
                    requestScreening(prospect.id);
                    toast.success(`Screening invite sent to ${app.fullName}.`);
                  }}
                  className="min-h-11 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
                >
                  Request screening
                </button>
              ) : prospect.screening.status === "complete" ? (
                <a href={prospect.screening.reportUrl} className="min-h-11 rounded-full border border-border px-5 text-sm font-semibold leading-[2.75rem] text-navy hover:bg-navy-soft">
                  Open report
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => advanceScreening(prospect.id)}
                  className="min-h-11 rounded-full border border-border px-5 text-sm font-semibold text-navy hover:bg-navy-soft"
                >
                  Refresh status
                </button>
              )}
            </div>
            <div className="mt-3">
              <ScreeningNotice />
            </div>
          </section>

          <section className="card-soft p-5">
            <h2 className="font-display text-base font-bold text-navy">Move this application</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {prospectStages.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    setProspectStatus(prospect.id, s.key);
                    toast.success(`Moved to ${s.label}.`);
                  }}
                  aria-pressed={prospect.status === s.key}
                  className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${
                    prospect.status === s.key ? "border-navy bg-navy text-primary-foreground" : "border-border text-navy hover:bg-navy-soft"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {prospect.status === "approved" && (
              <button
                type="button"
                onClick={() => {
                  draftFromProspect(prospect.id);
                  navigate({ to: "/app/leases/wizard/$prospectId", params: { prospectId: prospect.id } });
                }}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-success px-5 text-sm font-semibold text-primary-foreground hover:bg-success/90"
              >
                <CheckCircle weight="duotone" className="h-5 w-5" aria-hidden="true" />
                Create lease (pre-filled)
              </button>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
