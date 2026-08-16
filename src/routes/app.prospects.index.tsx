import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  UserFocus,
  ArrowRight,
  Plus,
  Eye,
  EnvelopeSimple,
  Archive,
  Trash,
  Kanban,
  Rows,
  FileText,
  Check,
  Prohibit,
  Scales,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageHeader } from "@/components/keyhold/app-shell";
import { EmptyState } from "@/components/keyhold/empty-state";
import { RequireFinancials } from "@/components/keyhold/access-guard";
import { Tag, prospectLabel, prospectTone, screeningLabel, screeningTone } from "@/components/keyhold/pipeline";
import { DataList } from "@/components/keyhold/data-list";
import { CompareApplicants, DecisionDialog, type CompareRow } from "@/components/keyhold/leasing-panels";
import { useLeasing, prospectStages, type ProspectStatus } from "@/lib/mock-leasing";
import { cad, longDate, unitAddress } from "@/lib/mock-data";

export const Route = createFileRoute("/app/prospects/")({
  head: () => ({
    meta: [
      { title: "Prospects pipeline — Keyhold" },
      { name: "description", content: "Every rental application from first enquiry to approved, in one calm pipeline." },
      { property: "og:title", content: "Prospects pipeline — Keyhold" },
      { property: "og:description", content: "New, screening, references, approved — see where each applicant stands." },
    ],
  }),
  component: () => (
    <RequireFinancials title="Prospects">
      <ProspectsPage />
    </RequireFinancials>
  ),
});

function ProspectsPage() {
  const { prospects, applications, listings, setProspectStatus } = useLeasing();
  const navigate = useNavigate();
  const [view, setView] = useState<"board" | "list">("board");
  const [compare, setCompare] = useState<CompareRow[] | null>(null);
  const [decision, setDecision] = useState<{ row: CompareRow; outcome: "approved" | "declined" } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const rows: CompareRow[] = prospects.map((p) => {
    const app = applications.find((a) => a.id === p.applicationId)!;
    const listing = listings.find((l) => l.id === app.listingId);
    return { prospect: p, app, home: listing ? unitAddress(listing.unitId) : "—", rent: listing?.rent ?? 0 };
  });

  const openCompare = (selected: CompareRow[]) => {
    if (selected.length < 2 || selected.length > 3) {
      toast("Pick 2 or 3 applicants", { description: "Side-by-side compare works with two or three applications at a time." });
      return;
    }
    setCompare(selected);
  };

  const moveTo = (prospectId: string, stage: ProspectStatus) => {
    const row = rows.find((r) => r.prospect.id === prospectId);
    if (!row || row.prospect.status === stage) return;
    if (stage === "approved" || stage === "declined") {
      setDecision({ row, outcome: stage });
      return;
    }
    setProspectStatus(prospectId, stage);
    toast.success(`${row.app.fullName} moved to ${prospectLabel[stage]}.`);
  };


  return (
    <>
      <PageHeader
        title="Prospects"
        subtitle="Applications move left to right. Nothing is ever re-typed — each step fills the next."
        action={
          <Link
            to="/app/listings"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
          >
            <Plus weight="duotone" className="h-5 w-5" aria-hidden="true" />
            Publish a listing
          </Link>
        }
      />

      <div className="mb-4 inline-flex rounded-full border border-border p-1" role="group" aria-label="Prospect view">
        {([
          { key: "board", label: "Board", Icon: Kanban },
          { key: "list", label: "List", Icon: Rows },
        ] as const).map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            aria-pressed={view === key}
            onClick={() => setView(key)}
            className={`inline-flex min-h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
              view === key ? "bg-navy text-primary-foreground" : "text-navy hover:bg-navy-soft"
            }`}
          >
            <Icon weight="duotone" className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {view === "list" ? (
        <DataList
          name="Prospects"
          items={rows}
          getId={(r) => r.prospect.id}
          searchPlaceholder="Search applicant, home or stage"
          dateOf={(r) => r.app.moveIn}
          columns={[
            {
              key: "name",
              label: "Applicant",
              locked: true,
              value: (r) => r.app.fullName,
              render: (r) => <span className="font-display font-bold text-navy">{r.app.fullName}</span>,
            },
            { key: "home", label: "Home", value: (r) => r.home },
            {
              key: "stage",
              label: "Stage",
              sortable: false,
              value: (r) => prospectLabel[r.prospect.status],
              render: (r) => <Tag tone={prospectTone[r.prospect.status]}>{prospectLabel[r.prospect.status]}</Tag>,
            },
            {
              key: "screening",
              label: "Screening",
              sortable: false,
              value: (r) => screeningLabel[r.prospect.screening.status],
              render: (r) =>
                r.prospect.screening.status === "none" ? (
                  <span className="text-xs text-muted-foreground">Not started</span>
                ) : (
                  <Tag tone={screeningTone[r.prospect.screening.status]}>{screeningLabel[r.prospect.screening.status]}</Tag>
                ),
            },
            { key: "movein", label: "Move-in", value: (r) => r.app.moveIn, render: (r) => <span className="tnum">{longDate(r.app.moveIn)}</span> },
            {
              key: "income",
              label: "Income",
              align: "right",
              value: (r) => r.app.monthlyIncome,
              render: (r) => <span className="money">{cad(r.app.monthlyIncome)}/mo</span>,
            },
            { key: "email", label: "Email", defaultHidden: true, value: (r) => r.app.email },
          ]}
          filters={[
            {
              key: "stage",
              label: "Stage",
              options: prospectStages.map((st) => ({ value: st.key, label: st.label })),
              match: (r, v) => r.prospect.status === v,
            },
            {
              key: "screening",
              label: "Screening",
              options: [
                { value: "none", label: "Not started" },
                { value: "started", label: "In progress" },
                { value: "complete", label: "Complete" },
              ],
              match: (r, v) =>
                v === "none" ? r.prospect.screening.status === "none" : v === "complete" ? r.prospect.screening.status === "complete" : r.prospect.screening.status !== "none" && r.prospect.screening.status !== "complete",
            },
          ]}
          emptyIcon={UserFocus}
          emptyTitle="No applications yet"
          emptyBody="Publish a listing and share its public link — applications land here automatically."
          rowActions={[
            {
              key: "view",
              label: "Open applicant",
              Icon: Eye,
              onSelect: (r) => navigate({ to: "/app/prospects/$prospectId", params: { prospectId: r.prospect.id } }),
            },
            { key: "email", label: "Email applicant", Icon: EnvelopeSimple },
            { key: "approve", label: "Approve applicant", Icon: Check, onSelect: (r) => setDecision({ row: r, outcome: "approved" }) },
            { key: "decline", label: "Decline with a reason", Icon: Prohibit, onSelect: (r) => setDecision({ row: r, outcome: "declined" }) },
            {
              key: "lease",
              label: "Start lease",
              Icon: FileText,
              onSelect: (r) => navigate({ to: "/app/leases/wizard/$prospectId", params: { prospectId: r.prospect.id } }),
            },
            { key: "archive", label: "Archive", Icon: Archive },
            {
              key: "delete",
              label: "Delete application",
              Icon: Trash,
              destructive: true,
              confirm: (r) => `${r.app.fullName}'s application, screening result and documents will be deleted for good.`,
            },
          ]}
          bulkActions={[
            { key: "compare", label: "Compare side by side", Icon: Scales, onSelect: (sel) => openCompare(sel) },
            { key: "email", label: "Email applicants", Icon: EnvelopeSimple },
            { key: "archive", label: "Archive", Icon: Archive },
            {
              key: "delete",
              label: "Delete applications",
              Icon: Trash,
              destructive: true,
              confirm: (sel) => `${sel.length} applications and their screening results will be deleted.`,
            },
          ]}
          quickView={(r) => ({
            title: r.app.fullName,
            subtitle: r.home,
            fields: [
              { label: "Stage", value: <Tag tone={prospectTone[r.prospect.status]}>{prospectLabel[r.prospect.status]}</Tag> },
              { label: "Move-in", value: longDate(r.app.moveIn) },
              { label: "Income", value: `${cad(r.app.monthlyIncome)}/mo` },
              { label: "Email", value: r.app.email },
              { label: "Phone", value: r.app.phone },
            ],
            actions: (
              <Link
                to="/app/prospects/$prospectId"
                params={{ prospectId: r.prospect.id }}
                className="inline-flex min-h-11 items-center rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90"
              >
                Open full applicant
              </Link>
            ),
          })}
        />
      ) : prospects.length === 0 ? (
        <EmptyState Icon={UserFocus} title="No applications yet" body="Publish a listing and share its public link — applications land here automatically." />
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <p className="mb-2 text-xs text-muted-foreground">
            Drag a card to move it, or use the stage menu on each card. Approving or declining always asks for a reason.
          </p>
          <div className="grid min-w-[900px] grid-cols-5 gap-3">
            {prospectStages.map((stage) => {
              const column = prospects.filter((p) => p.status === stage.key);
              return (
                <section
                  key={stage.key}
                  aria-labelledby={`stage-${stage.key}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (dragId) moveTo(dragId, stage.key); setDragId(null); }}
                  className="rounded-2xl border border-border bg-navy-soft/40 p-2"
                >
                  <h2 id={`stage-${stage.key}`} className="flex items-center justify-between px-2 py-2 font-display text-xs font-extrabold uppercase tracking-widest text-navy">
                    {stage.label}
                    <span className="tnum text-muted-foreground">{column.length}</span>
                  </h2>
                  <ul className="space-y-2">
                    {column.map((p) => {
                      const app = applications.find((a) => a.id === p.applicationId)!;
                      const listing = listings.find((l) => l.id === app.listingId);
                      return (
                        <li
                          key={p.id}
                          draggable
                          onDragStart={() => setDragId(p.id)}
                          onDragEnd={() => setDragId(null)}
                          className="rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                        >
                          <Link to="/app/prospects/$prospectId" params={{ prospectId: p.id }} className="block">
                            <p className="font-display text-sm font-bold text-navy">{app.fullName}</p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {listing ? unitAddress(listing.unitId) : "—"}
                            </p>
                            <p className="tnum mt-1 text-xs text-muted-foreground">
                              Move-in {longDate(app.moveIn)} · {cad(app.monthlyIncome)}/mo income
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <Tag tone={prospectTone[p.status]}>{prospectLabel[p.status]}</Tag>
                              {p.screening.status !== "none" && (
                                <Tag tone={screeningTone[p.screening.status]}>Screening {screeningLabel[p.screening.status]}</Tag>
                              )}
                            </div>
                          </Link>
                          <label className="mt-2 block text-xs font-medium text-muted-foreground" htmlFor={`stage-select-${p.id}`}>
                            Stage
                          </label>
                          <select
                            id={`stage-select-${p.id}`}
                            value={p.status}
                            onChange={(e) => moveTo(p.id, e.target.value as ProspectStatus)}
                            className="mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-2 text-xs"
                          >
                            {prospectStages.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                          </select>
                        </li>
                      );
                    })}
                    {column.length === 0 && (
                      <li className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                        Nothing here
                      </li>
                    )}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => openCompare(rows.filter((r) => r.prospect.status !== "declined").slice(0, 3))}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold text-navy hover:bg-navy-soft"
        >
          <Scales weight="duotone" className="h-4 w-4" aria-hidden="true" /> Compare top applicants
        </button>
        <Link to="/app/add-tenant" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold text-navy hover:bg-navy-soft">
          Add an existing tenant
          <ArrowRight weight="duotone" className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {compare && <CompareApplicants rows={compare} onClose={() => setCompare(null)} />}
      {decision && (
        <DecisionDialog
          prospect={decision.row.prospect}
          applicantName={decision.row.app.fullName}
          outcome={decision.outcome}
          onClose={() => setDecision(null)}
        />
      )}
    </>
  );
}
