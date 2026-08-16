import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowsClockwise, DoorOpen, FileText, PaperPlaneTilt, UploadSimple, PencilSimple } from "@phosphor-icons/react";
import { PageHeader } from "@/components/keyhold/app-shell";
import { ActivityFeed } from "@/components/keyhold/activity-feed";
import { EmptyState } from "@/components/keyhold/empty-state";
import { RequireFinancials } from "@/components/keyhold/access-guard";
import { field } from "@/components/keyhold/pipeline";
import {
  AuditTrail,
  ConfirmDialog,
  DocumentViewer,
  LeaseGuardrails,
  LeaseStatusTag,
  LinkedInvoices,
  LinkedNotices,
  LockedBanner,
  Panel,
  SignerList,
} from "@/components/keyhold/lease-panels";
import { displayStatus, monthlyTotal, useLeases, daysUntil } from "@/lib/mock-leases";
import { cad, longDate, unitAddress, propertyById } from "@/lib/mock-data";

export const Route = createFileRoute("/app/leases/$leaseId")({
  head: () => ({
    meta: [
      { title: "Lease detail — Keyhold" },
      { name: "description", content: "Document viewer, signature audit trail, linked invoices and notices for a single lease." },
      { property: "og:title", content: "Lease detail — Keyhold" },
      { property: "og:description", content: "Signature status per signer, renewal and move-out — all in one place." },
    ],
  }),
  component: () => (
    <RequireFinancials title="Lease detail">
      <LeaseDetailPage />
    </RequireFinancials>
  ),
});

function LeaseDetailPage() {
  const { leaseId } = Route.useParams();
  const navigate = useNavigate();
  const { byId, sendForSignature, resend, advanceSigner, uploadPaperLease, revertSignature, renew, endTenancy } = useLeases();
  const lease = byId(leaseId);
  const [confirm, setConfirm] = useState<null | "revert" | "end">(null);
  const [moveOut, setMoveOut] = useState(lease?.endDate ?? "");
  const [reason, setReason] = useState("Tenant giving notice");

  if (!lease) {
    return (
      <>
        <PageHeader title="Lease detail" />
        <EmptyState Icon={FileText} title="Lease not found" body="It may have been deleted. Head back to the lease list to pick another." />
      </>
    );
  }

  const status = displayStatus(lease);
  const property = propertyById(lease.propertyId);
  const total = monthlyTotal(lease);
  const days = daysUntil(lease.endDate);

  return (
    <>
      <PageHeader
        title={lease.tenants.map((t) => t.name).filter(Boolean).join(", ") || "New lease"}
        subtitle={`${unitAddress(lease.unitId)} · ${property.city}, ${property.province}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <LeaseStatusTag status={status} />
            {!lease.locked && (
              <Link
                to="/app/leases/wizard"
                search={{ leaseId: lease.id }}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
              >
                <PencilSimple weight="duotone" className="h-5 w-5" aria-hidden="true" />
                Edit in wizard
              </Link>
            )}
            {(status === "expiring" || status === "active" || status === "ended") && (
              <button
                type="button"
                onClick={() => {
                  const created = renew(lease.id, 12, lease.rent);
                  toast.success("Renewal drafted — check the term and rent, then send.");
                  navigate({ to: "/app/leases/wizard", search: { leaseId: created.id } });
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90"
              >
                <ArrowsClockwise weight="duotone" className="h-5 w-5" aria-hidden="true" />
                Renew
              </button>
            )}
          </div>
        }
      />

      {lease.locked && <LockedBanner onRevert={() => setConfirm("revert")} />}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Panel title="Lease document">
            <DocumentViewer
              title={`Residential tenancy agreement — ${property.name}`}
              lines={[
                { label: "Home", value: unitAddress(lease.unitId) },
                { label: "Tenants", value: lease.tenants.map((t) => t.name).filter(Boolean).join(", ") || "Not named yet" },
                { label: "Occupants", value: lease.occupants || "None recorded" },
                { label: "Term", value: `${lease.termType} · ${longDate(lease.startDate)} → ${longDate(lease.endDate)}` },
                { label: "Monthly total", value: cad(total) },
                { label: "Deposits", value: `${cad(lease.deposit)} rent + ${cad(lease.keyDeposit)} keys` },
                ...Object.entries(lease.standardAnswers).map(([k, v]) => ({ label: k[0]!.toUpperCase() + k.slice(1), value: v })),
                { label: "Custom clauses", value: lease.clauses || "None" },
                { label: "Attachments", value: lease.addenda.join(", ") || "None" },
              ]}
            />
            <div className="mt-3">
              <LeaseGuardrails province={lease.province} />
            </div>
          </Panel>

          <Panel title="Signatures">
            <SignerList
              signers={lease.signers}
              onResend={(sid) => {
                resend(lease.id, sid);
                toast.success("Signature request resent.");
              }}
              onAdvance={(sid) => advanceSigner(lease.id, sid)}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {!lease.locked && (
                <button
                  type="button"
                  onClick={() => {
                    sendForSignature(lease.id);
                    toast.success("Sent for signature.");
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90"
                >
                  <PaperPlaneTilt weight="duotone" className="h-5 w-5" aria-hidden="true" />
                  {lease.signers.length ? "Send again to unsigned" : "Send for signature"}
                </button>
              )}
              {!lease.locked && (
                <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
                  <UploadSimple weight="duotone" className="h-5 w-5" aria-hidden="true" />
                  Upload a signed paper lease
                  <input
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      uploadPaperLease(lease.id, f.name);
                      toast.success("Signed lease uploaded — this lease is now active and locked.");
                    }}
                  />
                </label>
              )}
            </div>
          </Panel>

          <Panel title="Signature audit trail">
            <AuditTrail entries={lease.audit} />
          </Panel>

          <ActivityFeed entityType="lease" entityId={lease.id} title="Lease activity" />
        </div>

        <div className="space-y-4">
          <Panel title="At a glance">
            <dl className="space-y-2 text-sm">
              {[
                ["Status", status === "expiring" ? `Expiring in ${days} days` : lease.status === "ended" ? "Ended" : lease.status.replace(/-/g, " ")],
                ["Term", `${lease.termType}`],
                ["Ends", longDate(lease.endDate)],
                ["Rent", cad(lease.rent)],
                ["Monthly total", cad(total)],
                ["Province", lease.province],
                ["Renewed from", lease.renewedFromId ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-wrap justify-between gap-2 border-b border-border pb-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-navy">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="Linked invoices">
            <LinkedInvoices invoices={lease.invoices} />
          </Panel>

          <Panel title="Linked notices">
            <LinkedNotices notices={lease.notices} />
          </Panel>

          {lease.status !== "ended" && (
            <Panel title="End tenancy">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium" htmlFor="moveout">Move-out date</label>
                  <input id="moveout" type="date" className={field} value={moveOut} onChange={(e) => setMoveOut(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="reason">Reason</label>
                  <select id="reason" className={field} value={reason} onChange={(e) => setReason(e.target.value)}>
                    <option>Tenant giving notice</option>
                    <option>Mutual agreement to end</option>
                    <option>Landlord notice already served</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirm("end")}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-maple/40 px-4 text-sm font-semibold text-maple hover:bg-maple-soft"
                >
                  <DoorOpen weight="duotone" className="h-5 w-5" aria-hidden="true" />
                  Start the move-out
                </button>
              </div>
            </Panel>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "revert"}
        title="Revert the signature?"
        body="The lease unlocks for editing and every signature is cleared. Each signer will have to sign the new version again."
        confirmLabel="Revert and unlock"
        destructive
        onConfirm={() => {
          revertSignature(lease.id);
          toast.success("Signature reverted — the lease is editable again.");
        }}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "end"}
        title="Start the move-out?"
        body={`The lease will be marked as ending ${moveOut ? longDate(moveOut) : "on the chosen date"}. Rent invoices stop after that date and the deposit goes into the move-out settlement.`}
        confirmLabel="Start move-out"
        destructive
        onConfirm={() => {
          endTenancy(lease.id, moveOut || lease.endDate, reason);
          toast.success("Move-out started.");
        }}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}
