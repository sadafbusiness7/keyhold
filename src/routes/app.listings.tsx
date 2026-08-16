import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Storefront, LinkSimple, Plus, PencilSimple, HouseLine, Copy, ChatCircleDots } from "@phosphor-icons/react";
import { PageHeader } from "@/components/keyhold/app-shell";
import { EmptyState } from "@/components/keyhold/empty-state";
import { Tag, field } from "@/components/keyhold/pipeline";
import { DataList } from "@/components/keyhold/data-list";
import { ListingEditor } from "@/components/keyhold/leasing-panels";
import { useLeasing, unitTypesFor, type Listing } from "@/lib/mock-leasing";
import { cad, longDate, unitAddress, propertyById, units } from "@/lib/mock-data";
import { usePermissions } from "@/lib/mock-access";
import { daysUntilVacant, lostRent, vacancyDays } from "@/lib/leasing-engine";

export const Route = createFileRoute("/app/listings")({
  head: () => ({
    meta: [
      { title: "Vacancies & listings — Keyhold" },
      { name: "description", content: "Every empty or soon-empty home, what it's costing you, and the listing that fills it." },
      { property: "og:title", content: "Vacancies & listings — Keyhold" },
      { property: "og:description", content: "Days vacant, lost rent, listing status and copy-ready descriptions for Kijiji, Facebook, Rentals.ca and Zumper." },
    ],
  }),
  component: ListingsPage,
});

const TODAY = () => new Date().toISOString().slice(0, 10);

/** MOCK: a stable "empty since" date per unit so the numbers never jitter. */
function vacantSinceFor(unitId: string, today: string) {
  const seed = unitId.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const days = 8 + (seed % 70);
  return new Date(Date.parse(`${today}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);
}

type Tab = "vacancies" | "listings";

function ListingsPage() {
  const [tab, setTab] = useState<Tab>("vacancies");
  const { listings } = useLeasing();
  const { canSee } = usePermissions();
  const visible = listings.filter((l) => canSee(l.propertyId));
  const [publishOpen, setPublishOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Vacancies & listings"
        subtitle="An empty home costs money every day. See what's open, what it's costing, and get it listed."
        action={
          <button
            type="button"
            onClick={() => { setTab("listings"); setPublishOpen(true); }}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
          >
            <Plus weight="duotone" className="h-5 w-5" aria-hidden="true" /> Publish a listing
          </button>
        }
      />

      <div className="mb-4 inline-flex rounded-full border border-border p-1" role="tablist" aria-label="Vacancy views">
        {([
          { key: "vacancies", label: "Vacancies", Icon: HouseLine },
          { key: "listings", label: `Listings (${visible.length})`, Icon: Storefront },
        ] as const).map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
              tab === key ? "bg-navy text-primary-foreground" : "text-navy hover:bg-navy-soft"
            }`}
          >
            <Icon weight="duotone" className="h-4 w-4" aria-hidden="true" /> {label}
          </button>
        ))}
      </div>

      {tab === "vacancies" ? <VacanciesTab /> : <ListingsTab publishOpen={publishOpen} setPublishOpen={setPublishOpen} />}
    </>
  );
}

/* ————————————————————————— vacancies ————————————————————————— */

type VacancyRow = {
  unitId: string;
  propertyId: string;
  home: string;
  kind: string;
  rent: number;
  state: "vacant" | "soon";
  since: string;
  days: number;
  lost: number;
  listingStatus: string;
  listing: Listing | null;
  applications: number;
};

function VacanciesTab() {
  const { listings, applications, prospects } = useLeasing();
  const { canSee } = usePermissions();
  const today = TODAY();

  const rows = useMemo<VacancyRow[]>(() => {
    const out: VacancyRow[] = [];
    for (const u of units) {
      if (!canSee(u.propertyId)) continue;
      const listing = listings.find((l) => l.unitId === u.id && l.status !== "leased") ?? null;
      const apps = listing
        ? applications.filter((a) => a.listingId === listing.id).filter((a) => {
            const p = prospects.find((pr) => pr.applicationId === a.id);
            return !p || p.status !== "declined";
          }).length
        : 0;
      const listingStatus = !listing ? "Not listed" : apps > 0 ? "Application received" : "Listed";
      if (!u.tenantId) {
        const since = vacantSinceFor(u.id, today);
        const days = vacancyDays(since, today);
        out.push({
          unitId: u.id, propertyId: u.propertyId, home: unitAddress(u.id), kind: u.kind,
          rent: listing?.rent ?? u.rent, state: "vacant", since, days,
          lost: lostRent(listing?.rent ?? u.rent, days), listingStatus, listing, applications: apps,
        });
        continue;
      }
      if (u.leaseEnd) {
        const until = daysUntilVacant(u.leaseEnd, today);
        if (until > 0 && until <= 90) {
          out.push({
            unitId: u.id, propertyId: u.propertyId, home: unitAddress(u.id), kind: u.kind,
            rent: listing?.rent ?? u.rent, state: "soon", since: u.leaseEnd, days: until,
            lost: 0, listingStatus, listing, applications: apps,
          });
        }
      }
    }
    return out.sort((a, b) => (a.state === b.state ? b.days - a.days : a.state === "vacant" ? -1 : 1));
  }, [listings, applications, prospects, canSee, today]);

  const emptyNow = rows.filter((r) => r.state === "vacant");
  const totalLost = emptyNow.reduce((s, r) => s + r.lost, 0);
  const monthlyExposure = emptyNow.reduce((s, r) => s + r.rent, 0);

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Empty right now" value={String(emptyNow.length)} note={`${rows.length - emptyNow.length} emptying within 90 days`} />
        <SummaryCard label="Rent lost so far" value={cad(totalLost)} note="Asking rent × days empty ÷ 30" tone="maple" />
        <SummaryCard label="Monthly exposure" value={cad(monthlyExposure)} note="If nothing is filled this month" tone="warning" />
      </div>

      <DataList
        name="Vacancies"
        items={rows}
        getId={(r) => r.unitId}
        searchPlaceholder="Search home, type or listing status"
        emptyIcon={HouseLine}
        emptyTitle="Every home is full"
        emptyBody="Nothing is empty and no lease ends in the next 90 days. Enjoy it."
        columns={[
          {
            key: "home",
            label: "Home",
            locked: true,
            value: (r) => r.home,
            render: (r) => (
              <div>
                <span className="font-display font-bold text-navy">{r.home}</span>
                <span className="block text-xs text-muted-foreground">{r.kind}</span>
              </div>
            ),
          },
          {
            key: "state",
            label: "State",
            sortable: false,
            value: (r) => (r.state === "vacant" ? "Empty" : "Emptying soon"),
            render: (r) =>
              r.state === "vacant" ? <Tag tone="maple">Empty</Tag> : <Tag tone="warning">Emptying soon</Tag>,
          },
          {
            key: "days",
            label: "Days",
            align: "right",
            value: (r) => r.days,
            render: (r) => (
              <span className="tnum">{r.state === "vacant" ? `${r.days} empty` : `${r.days} to go`}</span>
            ),
          },
          {
            key: "since",
            label: "Since / until",
            value: (r) => r.since,
            render: (r) => <span className="tnum">{longDate(r.since)}</span>,
          },
          { key: "rent", label: "Asking rent", align: "right", value: (r) => r.rent, render: (r) => <span className="money">{cad(r.rent)}</span> },
          {
            key: "listing",
            label: "Listing",
            sortable: false,
            value: (r) => r.listingStatus,
            render: (r) => (
              <Tag tone={r.listingStatus === "Application received" ? "success" : r.listingStatus === "Listed" ? "action" : "navy"}>
                {r.listingStatus}
              </Tag>
            ),
          },
          {
            key: "lost",
            label: "Lost rent",
            align: "right",
            value: (r) => r.lost,
            render: (r) => <span className="money text-maple">{r.lost > 0 ? cad(r.lost) : "—"}</span>,
          },
        ]}
        filters={[
          {
            key: "state",
            label: "State",
            options: [
              { value: "vacant", label: "Empty now" },
              { value: "soon", label: "Emptying within 90 days" },
            ],
            match: (r, v) => r.state === v,
          },
          {
            key: "listing",
            label: "Listing status",
            options: [
              { value: "Not listed", label: "Not listed" },
              { value: "Listed", label: "Listed" },
              { value: "Application received", label: "Application received" },
            ],
            match: (r, v) => r.listingStatus === v,
          },
        ]}
        quickView={(r) => ({
          title: r.home,
          subtitle: `${r.kind} · ${propertyById(r.propertyId).name}`,
          fields: [
            { label: "State", value: r.state === "vacant" ? `Empty ${r.days} days` : `Empties in ${r.days} days` },
            { label: r.state === "vacant" ? "Empty since" : "Lease ends", value: longDate(r.since) },
            { label: "Asking rent", value: `${cad(r.rent)}/month` },
            { label: "Lost rent so far", value: r.lost > 0 ? cad(r.lost) : "None yet" },
            { label: "Listing", value: r.listingStatus },
            { label: "Live applications", value: String(r.applications) },
          ],
          actions: r.listing ? (
            <Link
              to="/listing/$slug"
              params={{ slug: r.listing.slug }}
              className="inline-flex min-h-11 items-center rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90"
            >
              View public listing
            </Link>
          ) : undefined,
        })}
      />
    </>
  );
}

function SummaryCard({ label, value, note, tone = "navy" }: { label: string; value: string; note: string; tone?: "navy" | "maple" | "warning" }) {
  const colour = tone === "maple" ? "text-maple" : tone === "warning" ? "text-warning" : "text-navy";
  return (
    <div className="card-soft p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`money font-display text-2xl font-extrabold ${colour}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

/* ————————————————————————— listings ————————————————————————— */

function ListingsTab({ publishOpen, setPublishOpen }: { publishOpen: boolean; setPublishOpen: (v: boolean) => void }) {
  const { listings, addListing } = useLeasing();
  const { properties, canSee } = usePermissions();
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const vacant = units.filter((u) => !u.tenantId && u.propertyId === propertyId);
  const [unitType, setUnitType] = useState(unitTypesFor(propertyId)[0] ?? "");
  const [unitId, setUnitId] = useState(vacant[0]?.id ?? "");
  const [headline, setHeadline] = useState("");
  const [rent, setRent] = useState("1800");
  const [editingId, setEditingId] = useState<string | null>(null);
  const visible = listings.filter((l) => canSee(l.propertyId));
  const editing = visible.find((l) => l.id === editingId) ?? null;

  return (
    <>
      {publishOpen && (
        <form
          className="card-soft mb-6 grid max-w-3xl gap-4 p-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!unitId || !headline) { toast.error("Pick a vacant home and add a headline."); return; }
            const created = addListing({
              propertyId, unitType, unitId, headline,
              rent: Number(rent) || 0,
              deposit: Number(rent) || 0,
              bedrooms: units.find((u) => u.id === unitId)?.bedrooms ?? 1,
            });
            toast.success("Listing created. Add photos and copy the description block.");
            setPublishOpen(false);
            setHeadline("");
            setEditingId(created.id);
          }}
        >
          <div>
            <label className="text-sm font-medium" htmlFor="lp">Property</label>
            <select id="lp" className={field} value={propertyId} onChange={(e) => { setPropertyId(e.target.value); setUnitType(unitTypesFor(e.target.value)[0] ?? ""); setUnitId(units.find((u) => !u.tenantId && u.propertyId === e.target.value)?.id ?? ""); }}>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="lt">Unit type</label>
            <select id="lt" className={field} value={unitType} onChange={(e) => setUnitType(e.target.value)}>
              {unitTypesFor(propertyId).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="lu">Vacant unit</label>
            <select id="lu" className={field} value={unitId} onChange={(e) => setUnitId(e.target.value)}>
              {vacant.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
              {vacant.length === 0 && <option value="">No vacancies here</option>}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="lr">Monthly rent (CAD)</label>
            <input id="lr" inputMode="decimal" className={`${field} tnum`} value={rent} onChange={(e) => setRent(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="lh">Headline</label>
            <input id="lh" className={field} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Bright 2 bedroom with balcony" />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="submit" className="min-h-11 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground">Create listing</button>
            <button type="button" className="min-h-11 rounded-full border border-border px-5 text-sm font-semibold text-navy hover:bg-navy-soft" onClick={() => setPublishOpen(false)}>Cancel</button>
          </div>
        </form>
      )}

      {visible.length === 0 ? (
        <EmptyState Icon={Storefront} title="No listings yet" body="Publish a vacant home to start collecting applications." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {visible.map((l) => (
            <li key={l.id} className="card-soft overflow-hidden">
              {l.photos[0] && <img src={l.photos[0]} alt={l.headline} loading="lazy" className="h-40 w-full object-cover" />}
              <div className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag tone={l.status === "published" ? "success" : l.status === "leased" ? "navy" : "warning"}>
                    {l.status === "published" ? "Listed" : l.status}
                  </Tag>
                  <Tag tone="action">{l.unitType}</Tag>
                  {l.inquiries.length > 0 && (
                    <Tag tone="warning">
                      <ChatCircleDots weight="duotone" className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                      {l.inquiries.length} enquir{l.inquiries.length === 1 ? "y" : "ies"}
                    </Tag>
                  )}
                </div>
                <h2 className="font-display text-base font-bold text-navy">{l.headline}</h2>
                <p className="text-sm text-muted-foreground">{propertyById(l.propertyId).name} · {unitAddress(l.unitId)}</p>
                <p className="tnum font-display text-xl font-extrabold text-navy">{cad(l.rent)}<span className="text-sm font-semibold text-muted-foreground">/month</span></p>
                <p className="tnum text-xs text-muted-foreground">Available {longDate(l.availableFrom)}</p>
                <p className="text-xs text-muted-foreground">
                  {l.postedTo.length === 0 ? "Not posted anywhere yet" : `Posted to ${l.postedTo.map((p) => p.channel).join(", ")}`}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingId(l.id)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-4 text-sm font-semibold text-primary-foreground hover:bg-navy/90"
                  >
                    <PencilSimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> Edit listing
                  </button>
                  <Link to="/listing/$slug" params={{ slug: l.slug }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft">
                    <LinkSimple weight="duotone" className="h-4 w-4" aria-hidden="true" /> Public link
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/listing/${l.slug}`;
                      navigator.clipboard.writeText(url).then(
                        () => toast.success("Public link copied."),
                        () => toast.error("Your browser blocked the clipboard."),
                      );
                    }}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft"
                  >
                    <Copy weight="duotone" className="h-4 w-4" aria-hidden="true" /> Copy link
                  </button>
                  <Link to="/app/prospects" className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold leading-[2.75rem] text-navy hover:bg-navy-soft">Applicants</Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && <ListingEditor listing={editing} onClose={() => setEditingId(null)} />}
    </>
  );
}
