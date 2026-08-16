/**
 * HOMEPAGE FEATURE SURFACE
 * A single source of truth for "everything Keyhold does": used by the marketing
 * navbar (Features mega-menu) and by the tabbed feature showcase section.
 * All visuals are token-driven mock screenshots — no real data, no dark forcing.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CurrencyDollar,
  Wrench,
  FileText,
  Users,
  ChartLineUp,
  Receipt,
  Storefront,
  UsersThree,
  Bell,
  Stamp,
  ClipboardText,
  HandCoins,
  Folders,
  CheckCircle,
  ArrowUpRight,
  Buildings,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { cad } from "@/lib/mock-data";

type Tone = "action" | "success" | "warning" | "maple" | "navy";

const tint: Record<Tone, string> = {
  action: "var(--action)",
  success: "var(--success)",
  warning: "var(--warning)",
  maple: "var(--maple)",
  navy: "var(--navy)",
};
const rail: Record<Tone, string> = {
  action: "bg-action",
  success: "bg-success",
  warning: "bg-warning",
  maple: "bg-maple",
  navy: "bg-navy",
};

function Chip({ tone = "navy", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10.5px] font-bold tracking-tight shadow-sm border-none" style={{ color: `color-mix(in oklch, ${tint[tone]} 85%, var(--foreground))`, background: `color-mix(in oklch, ${tint[tone]} 12%, var(--card))` } as React.CSSProperties}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tint[tone] }} />
      {children}
    </span>
  );
}

function Stat({ label, value, tone, hint }: { label: string; value: string; tone: Tone; hint?: string }) {
  return (
    <div className="card-tint min-w-0 p-3" style={{ "--tint": tint[tone] } as React.CSSProperties}>
      <p className="truncate text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="money mt-1 truncate text-lg font-extrabold text-navy sm:text-xl">{value}</p>
      {hint ? <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Row({
  title,
  sub,
  tone,
  state,
  right,
}: {
  title: string;
  sub: string;
  tone: Tone;
  state?: string;
  right?: string;
}) {
  return (
    <li className="relative overflow-hidden rounded-xl border border-border bg-card p-2.5 pl-4">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${rail[tone]}`} />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-navy">{title}</p>
          <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
        </div>
        <div className="shrink-0 text-right">
          {right ? <p className="money text-[13px] font-extrabold text-navy">{right}</p> : null}
          {state ? (
            <span className="mt-1 inline-flex">
              <Chip tone={tone}>{state}</Chip>
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function Bars({ values, tone = "action", caption }: { values: number[]; tone?: Tone; caption: string }) {
  const max = Math.max(...values);
  return (
    <div>
      <div className="flex h-24 items-end gap-1.5" aria-hidden="true">
        {values.map((v, i) => (
          <span
            key={i}
            className="flex-1 rounded-t-md"
            style={{
              height: `${(v / max) * 100}%`,
              background: `linear-gradient(180deg, ${tint[tone]}, color-mix(in oklab, ${tint[tone]} 35%, transparent))`,
            }}
          />
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{caption}</p>
    </div>
  );
}

function Meter({ label, pct, tone }: { label: string; pct: number; tone: Tone }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="tnum text-[11px] font-bold text-navy">{pct}%</p>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-sunk">
        <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: tint[tone] }} />
      </div>
    </div>
  );
}

/** Rich app-chrome frame: navy title bar + tinted body, so shots never read as flat white. */
function Shot({ title, crumb, tone, children }: { title: string; crumb: string; tone: Tone; children: React.ReactNode }) {
  return (
    <div
      className="shine-sweep overflow-hidden rounded-[22px] border border-border shadow-xl"
      style={{ "--tint": tint[tone] } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 bg-navy px-4 py-2.5">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-maple/70" />
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <p className="ml-2 truncate font-display text-xs font-bold text-primary-foreground">{title}</p>
        <span className="ms-auto hidden truncate rounded-full bg-primary-foreground/15 px-2.5 py-1 text-[10px] font-semibold text-primary-foreground sm:block">
          {crumb}
        </span>
      </div>
      <div
        className="p-4 sm:p-5"
        style={{
          backgroundImage: `linear-gradient(160deg, color-mix(in oklab, ${tint[tone]} 14%, var(--card)) 0%, color-mix(in oklab, ${tint[tone]} 5%, var(--card)) 45%, var(--surface-sunk) 100%)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------- modules --------------------------------- */

export type FeatureModule = {
  key: string;
  nav: string;
  Icon: React.ComponentType<any>;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  tone: Tone;
  shotTitle: string;
  crumb: string;
  shot: React.ReactNode;
};

export const featureModules: FeatureModule[] = [
  {
    key: "rent",
    nav: "Rent & payments",
    Icon: CurrencyDollar,
    eyebrow: "Rent & payments",
    title: "Every dollar, tracked to the unit.",
    body: "Invoices generate monthly, payments post instantly, and NSF or partial payments are handled without spreadsheet gymnastics.",
    points: [
      "Automatic monthly invoices with late-fee caps per province",
      "e-Transfer, cheque, cash and card — one ledger",
      "NSF reversal, void and partial-payment handling",
      "Receipts tenants can download themselves",
    ],
    tone: "success",
    shotTitle: "Rent — August 2026",
    crumb: "6 properties · 20 doors",
    shot: (
      <div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Collected" value={cad(24180)} tone="success" hint="92% of expected" />
          <Stat label="Still owed" value={cad(2115)} tone="maple" hint="2 tenants late" />
          <Stat label="Late fees held" value={cad(120)} tone="warning" hint="Awaiting review" />
        </div>
        <ul className="mt-3 space-y-2">
          <Row title="Marie Tremblay" sub="412 Lansdowne · Main floor" tone="success" state="Paid" right={cad(2350)} />
          <Row title="Grace Okafor" sub="88 Ottawa St N · Unit A" tone="maple" state="Overdue 9d" right={cad(1895)} />
          <Row title="Liam Byrne" sub="14 Rosewell Cres" tone="warning" state="Due soon" right={cad(2100)} />
        </ul>
      </div>
    ),
  },
  {
    key: "leases",
    nav: "Leases & renewals",
    Icon: FileText,
    eyebrow: "Leases, renewals & notices",
    title: "Guided leases, signed and filed.",
    body: "A seven-step wizard builds a province-correct lease, collects e-signatures with a full audit trail, then tracks the renewal months ahead.",
    points: [
      "Ontario Standard Lease and provincial variants",
      "E-signature with timestamped audit trail",
      "Renewal pipeline with offer generation",
      "LTB / provincial notices prefilled for review",
    ],
    tone: "action",
    shotTitle: "Leases — renewal pipeline",
    crumb: "Step 5 of 7",
    shot: (
      <div>
        <div className="mb-3 flex items-center gap-1.5">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= 4 ? "bg-action" : "bg-border"}`} />
          ))}
        </div>
        <ul className="space-y-2">
          <Row title="Grace Okafor — renewal offer" sub="Ends Sep 30 · +2.5% guideline" tone="warning" state="Awaiting review" />
          <Row title="Marie Tremblay" sub="Signed Jul 2 · Ontario Standard Lease" tone="success" state="Signed" />
          <Row title="Dev Sharma" sub="Converted to month-to-month" tone="action" state="Rolling" />
          <Row title="N4 — 88 Ottawa St N Unit A" sub="Drafted from your records" tone="maple" state="Draft" />
        </ul>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-action-soft px-3 py-2 text-[11px] font-semibold text-action">
          <CheckCircle weight="duotone" className="h-4 w-4 shrink-0" aria-hidden="true" />
          Signature audit trail captured — IP, device and timestamp.
        </div>
      </div>
    ),
  },
  {
    key: "maintenance",
    nav: "Maintenance & vendors",
    Icon: Wrench,
    eyebrow: "Maintenance & vendors",
    title: "Repairs triaged before you open the app.",
    body: "Tenants report with photos from their phone. Emergencies float to the top, vendors get assigned, and spend is tracked per property.",
    points: [
      "Urgency triage — emergency never waits behind a light bulb",
      "Vendor directory with spend and response times",
      "Photo threads tenants can follow without calling",
      "Costs roll straight into your expense reports",
    ],
    tone: "maple",
    shotTitle: "Maintenance board",
    crumb: "4 open · 1 emergency",
    shot: (
      <div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { h: "Emergency", t: "maple" as Tone, n: 1 },
            { h: "In progress", t: "action" as Tone, n: 2 },
            { h: "Resolved 30d", t: "success" as Tone, n: 11 },
          ].map((c) => (
            <div key={c.h} className="card-tint p-3" style={{ "--tint": tint[c.t] } as React.CSSProperties}>
              <Chip tone={c.t}>{c.h}</Chip>
              <p className="money mt-2 text-2xl font-extrabold text-navy tnum">{c.n}</p>
            </div>
          ))}
        </div>
        <ul className="mt-3 space-y-2">
          <Row title="No heat — furnace not starting" sub="88 Ottawa St N · Unit A · Fenwick HVAC" tone="maple" state="Dispatched" />
          <Row title="Kitchen tap dripping" sub="412 Lansdowne · Main · quoted" tone="action" state="Scheduled" right={cad(180)} />
          <Row title="Front door lock replaced" sub="14 Rosewell Cres · invoice attached" tone="success" state="Closed" right={cad(240)} />
        </ul>
      </div>
    ),
  },
  {
    key: "leasing",
    nav: "Listings & applicants",
    Icon: Storefront,
    eyebrow: "Vacancy, listings & applicants",
    title: "Fill a vacancy without a spreadsheet.",
    body: "Publish a listing page, collect applications, and move candidates through a drag-and-drop pipeline into a signed lease.",
    points: [
      "Public listing page per unit with photos and terms",
      "Applicant pipeline: new → screening → offer → signed",
      "Screening notes and documents kept on the applicant",
      "One click from approved applicant to lease wizard",
    ],
    tone: "navy",
    shotTitle: "Applicants — 88 Ottawa St N",
    crumb: "12 applied",
    shot: (
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { h: "New", t: "navy" as Tone, items: ["A. Nadeau", "P. Singh", "R. Cole"] },
          { h: "Screening", t: "action" as Tone, items: ["J. Okonkwo", "M. Lévesque"] },
          { h: "Offer", t: "warning" as Tone, items: ["S. Patel"] },
          { h: "Signed", t: "success" as Tone, items: ["K. Zhou"] },
        ].map((c) => (
          <div
            key={c.h}
            className="rounded-2xl p-2.5"
            style={{ background: `color-mix(in oklab, ${tint[c.t]} 10%, var(--card))` } as React.CSSProperties}
          >
            <Chip tone={c.t}>{c.h}</Chip>
            <ul className="mt-2 space-y-1.5">
              {c.items.map((i) => (
                <li key={i} className="truncate rounded-lg border border-border bg-card px-2 py-1.5 text-[11px] font-semibold text-navy">
                  {i}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    ),
  },
  {
    key: "tenants",
    nav: "Tenants & portal",
    Icon: Users,
    eyebrow: "Tenants, portal & messages",
    title: "One card per person, one inbox for all of it.",
    body: "Contact details, balance, documents and history in one place — plus a tenant portal for payments, requests and insurance uploads.",
    points: [
      "Tenant portal: pay rent, report repairs, read notices",
      "Two-pane messaging with templates and read state",
      "Insurance certificates with expiry tracking",
      "Full per-record activity timeline (before → after)",
    ],
    tone: "action",
    shotTitle: "Messages",
    crumb: "3 unread",
    shot: (
      <div className="grid gap-3 sm:grid-cols-[minmax(0,150px)_minmax(0,1fr)]">
        <ul className="space-y-1.5">
          {["Marie Tremblay", "Grace Okafor", "Liam Byrne"].map((n, i) => (
            <li
              key={n}
              className={`truncate rounded-xl px-2.5 py-2 text-[11px] font-semibold ${
                i === 0 ? "bg-navy text-primary-foreground" : "border border-border bg-card text-navy"
              }`}
            >
              {n}
            </li>
          ))}
        </ul>
        <div className="space-y-2">
          <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-card px-3 py-2 text-[11px] text-navy">
            Hi — the furnace is making a noise again.
          </p>
          <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-action px-3 py-2 text-[11px] font-medium text-primary-foreground">
            Fenwick HVAC is booked for Thursday 9am.
          </p>
          <div className="rounded-xl border border-border bg-card p-2.5">
            <Chip tone="success">Insurance on file</Chip>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Renews Mar 2027 · certificate attached</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "reports",
    nav: "Reports & insights",
    Icon: ChartLineUp,
    eyebrow: "Reports & insights",
    title: "Eleven reports and a live analytics board.",
    body: "Rent roll, NOI, delinquency, security-deposit ledger and more — plus a filterable dashboard with trends by property and period.",
    points: [
      "Rent roll, NOI, income vs expense, deposit ledger",
      "Filter the dashboard by property and 3/6/12 months",
      "Sparkline KPIs with month-over-month deltas",
      "Export any report to PDF or CSV",
    ],
    tone: "action",
    shotTitle: "Insights — portfolio",
    crumb: "Last 6 months",
    shot: (
      <div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="NOI year to date" value={cad(64210)} tone="success" hint="+8.4% vs 2025" />
          <Stat label="Collection rate" value="98%" tone="action" hint="6-month average" />
          <Stat label="Avg days vacant" value="11" tone="warning" hint="Down from 19" />
        </div>
        <div className="mt-3 rounded-2xl border border-border bg-card p-3">
          <Bars values={[52, 64, 58, 76, 88, 96, 91, 98]} tone="action" caption="Monthly collection, Jan–Aug" />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Meter label="Occupancy" pct={94} tone="success" />
          <Meter label="Repairs closed in 7 days" pct={88} tone="action" />
        </div>
      </div>
    ),
  },
  {
    key: "canada",
    nav: "Canadian compliance",
    Icon: Stamp,
    eyebrow: "Built for Canada",
    title: "T776, rent reporting and guideline increases.",
    body: "CRA-mapped tax packages, opt-in credit-bureau rent reporting for tenants, and Ontario rent-increase automation with legal notice dates.",
    points: [
      "T776 package with CRA line mapping per property",
      "Ontario guideline increase with 90-day N1 dates",
      "Opt-in rent reporting to credit bureaus",
      "Provincial notice rules and late-fee caps built in",
    ],
    tone: "maple",
    shotTitle: "Tax package — 2026 (T776)",
    crumb: "CRA line mapping",
    shot: (
      <div>
        <ul className="space-y-2">
          <Row title="Line 8299 — Gross rents" sub="All properties" tone="success" right={cad(287400)} />
          <Row title="Line 8960 — Repairs & maintenance" sub="42 invoices" tone="maple" right={cad(18240)} />
          <Row title="Line 9180 — Property taxes" sub="6 properties" tone="navy" right={cad(21100)} />
          <Row title="Line 9945 — CCA (optional)" sub="Class 1 · your accountant decides" tone="warning" state="Review" />
        </ul>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-maple-soft px-3 py-2 text-[11px] font-semibold text-maple">
          <Receipt weight="duotone" className="h-4 w-4 shrink-0" aria-hidden="true" />
          Ontario 2026 guideline applied — N1 notices dated 90 days ahead.
        </div>
      </div>
    ),
  },
  {
    key: "owners",
    nav: "Owners & team",
    Icon: UsersThree,
    eyebrow: "Owners, team & payouts",
    title: "Scoped access and owner statements.",
    body: "Invite property managers with a permission matrix and property assignments. Owners get a read-only portal and monthly disbursement statements.",
    points: [
      "Permission matrix per manager, per property",
      "Owner portal: statements, properties, tenants — read only",
      "Management fee calculation and payout PDFs",
      "Owner-only audit log of every sensitive action",
    ],
    tone: "navy",
    shotTitle: "Team & access",
    crumb: "Owner view",
    shot: (
      <div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-2 border-b border-border bg-surface-sunk px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <span>Member</span><span>Rent</span><span>Leases</span><span>Money</span>
          </div>
          {[
            { n: "You (Owner)", v: ["Full", "Full", "Full"], t: "success" as Tone },
            { n: "Priya — Manager", v: ["Edit", "Edit", "View"], t: "action" as Tone },
            { n: "Sam — Limited", v: ["View", "—", "—"], t: "warning" as Tone },
          ].map((r) => (
            <div key={r.n} className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-2 border-b border-border px-3 py-2 last:border-0">
              <span className="truncate text-[12px] font-semibold text-navy">{r.n}</span>
              {r.v.map((v, i) => (
                <span key={i} className="tnum text-[11px] font-semibold text-muted-foreground">{v}</span>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Stat label="Owner payout — August" value={cad(18420)} tone="success" hint="After 6% management fee" />
          <Stat label="Statements sent" value="4 owners" tone="navy" hint="PDF + email" />
        </div>
      </div>
    ),
  },
  {
    key: "ops",
    nav: "Inspections & documents",
    Icon: ClipboardText,
    eyebrow: "Operations",
    title: "Inspections, documents, assets, announcements.",
    body: "Run a room-by-room inspection from your phone, file every document against the right unit, track appliances and broadcast to tenants.",
    points: [
      "Mobile inspection flow with photos and side-by-side compare",
      "Folder-based document vault per property and unit",
      "Appliance and asset registry with warranty dates",
      "Announcements to a building or the whole portfolio",
    ],
    tone: "success",
    shotTitle: "Inspection — 412 Lansdowne, Main",
    crumb: "Move-out · 6 rooms",
    shot: (
      <div>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { r: "Kitchen", s: "Good", t: "success" as Tone },
            { r: "Bathroom", s: "Needs work", t: "warning" as Tone },
            { r: "Living room", s: "Good", t: "success" as Tone },
            { r: "Bedroom 1", s: "Good", t: "success" as Tone },
            { r: "Basement", s: "Damage", t: "maple" as Tone },
            { r: "Exterior", s: "Good", t: "success" as Tone },
          ].map((x) => (
            <div key={x.r} className="rounded-xl border border-border bg-card px-2.5 py-2">
              <p className="truncate text-[12px] font-semibold text-navy">{x.r}</p>
              <span className="mt-1 inline-flex"><Chip tone={x.t}>{x.s}</Chip></span>
            </div>
          ))}
        </div>
        <ul className="mt-3 space-y-2">
          <Row title="Furnace — Lennox EL296" sub="Installed 2021 · warranty to 2031" tone="navy" state="Asset" />
          <Row title="Fire safety inspection 2026" sub="Filed to 412 Lansdowne · PDF" tone="success" state="Filed" />
        </ul>
      </div>
    ),
  },
  {
    key: "alerts",
    nav: "Notifications & audit",
    Icon: Bell,
    eyebrow: "Accountability",
    title: "Nothing slips, and everything is on the record.",
    body: "A notification centre with deep links, per-record activity timelines, an owner-only audit log and a daily or weekly email digest.",
    points: [
      "Bell with unread count and one-click deep links",
      "Activity timeline showing before → after on every change",
      "Owner-only audit log of sensitive actions",
      "Email digest: daily or weekly, your choice",
    ],
    tone: "warning",
    shotTitle: "Notifications",
    crumb: "5 new",
    shot: (
      <div>
        <ul className="space-y-2">
          <Row title="Payment received — Marie Tremblay" sub="2 minutes ago · e-Transfer" tone="success" right={cad(2350)} />
          <Row title="Rent overdue — Grace Okafor" sub="9 days · reminder sent" tone="maple" state="Action" />
          <Row title="Lease expires in 60 days" sub="88 Ottawa St N · Unit A" tone="warning" state="Renewal" />
          <Row title="Permission changed — Sam" sub="By you · logged to audit" tone="navy" state="Audit" />
        </ul>
        <div className="mt-3 rounded-xl border border-border bg-card p-3">
          <p className="text-[11px] font-bold text-navy">Change history — Unit A rent</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            <span className="line-through">{cad(1850)}</span> → <span className="font-bold text-navy">{cad(1895)}</span> · guideline increase · Aug 1
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "setup",
    nav: "Import & setup",
    Icon: Folders,
    eyebrow: "Getting started",
    title: "Bring your spreadsheet, keep your evening.",
    body: "Upload a CSV or Excel file, map your columns, fix flagged rows and import — with undo. A guided checklist walks you through first-run setup.",
    points: [
      "CSV / Excel upload with column mapping",
      "Row-level validation: errors and warnings before import",
      "One-click undo on any import batch",
      "Setup checklist that tracks your progress",
    ],
    tone: "action",
    shotTitle: "Import data — properties.csv",
    crumb: "Step 3: validate",
    shot: (
      <div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Rows read" value="128" tone="navy" />
          <Stat label="Ready to import" value="121" tone="success" />
          <Stat label="Need attention" value="7" tone="warning" />
        </div>
        <ul className="mt-3 space-y-2">
          <Row title="Row 42 — missing rent amount" sub="Column “monthly_rent” is blank" tone="warning" state="Warning" />
          <Row title="Row 77 — duplicate unit" sub="412 Lansdowne · Main already exists" tone="maple" state="Error" />
          <Row title="Column mapping saved" sub="tenant_name → Tenant · rent → Monthly rent" tone="success" state="Mapped" />
        </ul>
      </div>
    ),
  },
  {

    key: "team",
    nav: "Team & access",
    Icon: UsersThree,
    eyebrow: "Team & access",
    title: "Decide exactly what each person can see.",
    body: "Invite property managers by magic link, assign them only the properties they handle, and set what they can view, edit or approve with a plain-language permission matrix.",
    points: [
      "Owner, manager and limited access levels",
      "Per-property assignments — scoped dashboards and reports",
      "Permission matrix: view, edit, approve, per module",
      "Invite by magic link, revoke access in one click",
    ],
    tone: "navy",
    shotTitle: "Team & access — permissions",
    crumb: "Owner view",
    shot: (
      <div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="People" value="4" tone="navy" />
          <Stat label="Full access" value="1" tone="success" />
          <Stat label="Limited" value="2" tone="warning" />
        </div>
        <ul className="mt-3 space-y-2">
          <Row title="Priya N. — Manager" sub="88 Ottawa St N · 27 Birchmount Rd" tone="success" state="Full" />
          <Row title="Jordan L. — Manager" sub="1290 Danforth Ave · view + edit only" tone="warning" state="Limited" />
          <Row title="Invite sent — accountant@firm.ca" sub="Reports and payouts, read-only" tone="navy" state="Pending" />
        </ul>
      </div>
    ),
  },
];


/** Grouped links for the navbar mega-menu. */
export const featureMenu: { heading: string; items: { key: string; label: string; blurb: string; Icon: React.ComponentType<any> }[] }[] = [
  {
    heading: "Money",
    items: [
      { key: "rent", label: "Rent & payments", blurb: "Invoices, NSF, late fees", Icon: CurrencyDollar },
      { key: "reports", label: "Reports & insights", blurb: "11 reports, live analytics", Icon: ChartLineUp },
      { key: "owners", label: "Owners & payouts", blurb: "Statements, management fees", Icon: HandCoins },
    ],
  },
  {
    heading: "Tenancy",
    items: [
      { key: "leases", label: "Leases & renewals", blurb: "Wizard, e-sign, notices", Icon: FileText },
      { key: "tenants", label: "Tenants & portal", blurb: "Messaging, insurance", Icon: Users },
      { key: "leasing", label: "Listings & applicants", blurb: "Vacancy to signed lease", Icon: Storefront },
    ],
  },
  {
    heading: "Operations",
    items: [
      { key: "maintenance", label: "Maintenance & vendors", blurb: "Triage, dispatch, spend", Icon: Wrench },
      { key: "ops", label: "Inspections & documents", blurb: "Assets, announcements", Icon: ClipboardText },
      { key: "alerts", label: "Notifications & audit", blurb: "Digest, activity history", Icon: Bell },
    ],
  },
  {
    heading: "Canada & setup",
    items: [
      { key: "canada", label: "Canadian compliance", blurb: "T776, N1, rent reporting", Icon: Stamp },
      { key: "setup", label: "Import & setup", blurb: "CSV mapping with undo", Icon: Folders },
      { key: "team", label: "Team & access", blurb: "Permission matrix", Icon: UsersThree },
    ],
  },
];

/* ------------------------------ tab switcher ------------------------------ */

/**
 * Module switcher. On large screens the chips simply wrap onto two tidy rows
 * (no scrollbar at all). On narrow screens they scroll horizontally with the
 * native bar hidden and paging arrows that fade in only when there is overflow.
 */
function FeatureTabs({ active, onSelect }: { active: string; onSelect: (k: string) => void }) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [edge, setEdge] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });

  const measure = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdge({ left: el.scrollLeft > 4, right: max > 4 && el.scrollLeft < max - 4 });
  }, []);

  useEffect(() => {
    measure();
    const el = railRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const page = (dir: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <div className="relative mt-8 lg:mt-10">
      <div
        ref={railRef}
        onScroll={measure}
        className="-mx-4 overflow-x-auto scroll-smooth px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        <div role="tablist" aria-label="Features" className="flex min-w-max gap-2 lg:min-w-0 lg:flex-wrap lg:justify-start">
          {featureModules.map((m) => {
            const on = m.key === active;
            return (
              <button
                key={m.key}
                id={`feature-tab-${m.key}`}
                role="tab"
                aria-selected={on}
                type="button"
                onClick={() => onSelect(m.key)}
                className={`inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold transition-colors ${
                  on
                    ? "border-navy bg-navy text-primary-foreground shadow-sm"
                    : "border-border bg-card text-navy hover:bg-navy-soft"
                }`}
              >
                <m.Icon weight="duotone" className="h-4 w-4 shrink-0" aria-hidden="true" />
                {m.nav}
              </button>
            );
          })}
        </div>
      </div>

      {/* edge fades + paging arrows (mobile / tablet only) */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-surface-sunk to-transparent transition-opacity lg:hidden ${edge.left ? "opacity-100" : "opacity-0"}`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-surface-sunk to-transparent transition-opacity lg:hidden ${edge.right ? "opacity-100" : "opacity-0"}`}
      />
      <button
        type="button"
        onClick={() => page(-1)}
        aria-label="Previous features"
        tabIndex={edge.left ? 0 : -1}
        className={`absolute left-0 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-navy shadow-md transition-opacity hover:bg-navy-soft lg:hidden ${
          edge.left ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <CaretLeft weight="bold" className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => page(1)}
        aria-label="More features"
        tabIndex={edge.right ? 0 : -1}
        className={`absolute right-0 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-navy shadow-md transition-opacity hover:bg-navy-soft lg:hidden ${
          edge.right ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <CaretRight weight="bold" className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/* ------------------------------- section --------------------------------- */


export function FeatureShowcase() {
  const [active, setActive] = useState(featureModules[0]!.key);
  const mod = featureModules.find((m) => m.key === active) ?? featureModules[0]!;
  const sectionRef = useRef<HTMLElement | null>(null);

  // Deep links from the navbar mega-menu: #features-<moduleKey> selects that
  // module and scrolls the showcase into view.
  useEffect(() => {
    const apply = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash.startsWith("features-")) return;
      const key = hash.slice("features-".length);
      if (!featureModules.some((m) => m.key === key)) return;
      setActive(key);
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  return (
    <section ref={sectionRef} id="features" className="relative overflow-hidden border-y border-border bg-surface-sunk">
      <div className="texture-dots absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">Every feature</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-5xl">
            The whole platform, <span className="text-success">screen by screen.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Twelve modules built for Canadian landlords and small property managers. Pick one to see the real screen.
          </p>
        </div>

        {/* module switcher */}
        <FeatureTabs active={mod.key} onSelect={setActive} />


        <div className="mt-6 grid items-center gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">{mod.eyebrow}</p>
            <h3 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{mod.title}</h3>
            <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-muted-foreground">{mod.body}</p>
            <ul className="mt-5 space-y-2.5">
              {mod.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-foreground">
                  <CheckCircle weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0">
            <Shot title={mod.shotTitle} crumb={mod.crumb} tone={mod.tone}>
              {mod.shot}
            </Shot>
          </div>
        </div>

        {/* everything else at a glance */}
        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featureMenu.map((g) => (
            <div key={g.heading} className="card-soft min-w-0 p-5">
              <p className="font-display text-sm font-extrabold uppercase tracking-wider text-navy">{g.heading}</p>
              <ul className="mt-3 space-y-3">
                {g.items.map((i) => (
                  <li key={i.key} className="flex items-start gap-2.5">
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-action-soft text-action">
                      <i.Icon weight="duotone" className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-navy">{i.label}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{i.blurb}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-5">
          <Buildings weight="duotone" className="h-6 w-6 shrink-0 text-navy" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">
            From two units to two hundred and fifty — the same calm system, priced per home.
          </p>
          <a
            href="#pricing"
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90"
          >
            See pricing <ArrowUpRight weight="duotone" className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}

/** Navbar mega-menu contents (rendered inside a popover in the header). */
export function FeatureMenuPanel({ onPick }: { onPick?: () => void }) {
  return (
    <div className="grid gap-6 p-5 sm:grid-cols-2 lg:grid-cols-4">
      {featureMenu.map((g) => (
        <div key={g.heading} className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{g.heading}</p>
          <ul className="mt-2 space-y-1">
            {g.items.map((i) => (
              <li key={i.key}>
                <a
                  href={`#features-${i.key}`}
                  onClick={onPick}
                  className="flex items-start gap-2.5 rounded-xl p-2 hover:bg-navy-soft"
                >
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-action-soft text-action">
                    <i.Icon weight="duotone" className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-navy">{i.label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{i.blurb}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
