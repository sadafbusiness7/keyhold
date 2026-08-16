import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PaperPlaneTilt, EnvelopeSimple, UserPlus, TrendUp, Users, Info } from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageHeader } from "@/components/keyhold/app-shell";
import { RequireFinancials } from "@/components/keyhold/access-guard";
import { RailCard } from "@/components/keyhold/status";
import { Tag } from "@/components/keyhold/pipeline";
import { usePermissions } from "@/lib/mock-access";
import { useRent } from "@/lib/mock-rent";
import { balanceCents, invoiceStatus } from "@/lib/rent-engine";
import { propertyById, unitById, longDate, cad } from "@/lib/mock-data";
import { MERGE_TAGS, renderTemplate, useNotices } from "@/lib/mock-notices";
import { money, fullDate, startOfNextRentPeriod, addDays } from "@/lib/notices-engine";

export const Route = createFileRoute("/app/bulk")({
  head: () => ({
    meta: [
      { title: "Bulk actions — Keyhold" },
      { name: "description", content: "Email many tenants, send portal invitations and update rent in one pass, with {{first_name}} style templates." },
      { property: "og:title", content: "Bulk actions — Keyhold" },
      { property: "og:description", content: "Bulk tenant email, portal invitations and rent updates with merge tags." },
    ],
  }),
  component: () => (
    <RequireFinancials title="Bulk actions">
      <BulkPage />
    </RequireFinancials>
  ),
});

const field = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm";
const btn = "inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft";
const btnPrimary = "inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-4 text-sm font-semibold text-primary-foreground hover:bg-action/90 disabled:opacity-50";

type Tab = "email" | "invite" | "rent";

const templates: Record<string, { subject: string; body: string }> = {
  "Building notice": {
    subject: "A quick note about {{property}}",
    body: "Hi {{first_name}},\n\nA short update about {{property}}: the water will be off on Tuesday between 9am and noon while a valve is replaced.\n\nThank you,\nKeyhold",
  },
  "Friendly rent reminder": {
    subject: "Rent for {{unit}}",
    body: "Hi {{first_name}},\n\nThis is a friendly reminder that {{rent}} is due for {{unit}} at {{property}}. Your current balance is {{balance}}.\n\nThank you,\nKeyhold",
  },
  "Portal invitation": {
    subject: "Your Keyhold tenant portal",
    body: "Hi {{first_name}},\n\nYou can now see your rent, receipts and repair requests for {{unit}} online. Tap the link in this email to set your password.\n\nThank you,\nKeyhold",
  },
};

function BulkPage() {
  const perms = usePermissions();
  const rent = useRent();
  const store = useNotices();
  const [tab, setTab] = useState<Tab>("email");

  const people = useMemo(
    () =>
      perms.tenants.map((t) => {
        const unit = unitById(t.unitId);
        const property = propertyById(unit.propertyId);
        const balance =
          rent.invoices
            .filter((i) => i.tenantId === t.id && invoiceStatus(i, rent.payments, rent.today) !== "paid")
            .reduce((s, i) => s + balanceCents(i, rent.payments), 0) / 100;
        return {
          tenantId: t.id,
          name: t.name,
          email: t.email,
          unitId: unit.id,
          province: property.province,
          rent: store.rentOverrides[unit.id] ?? unit.rent,
          vars: {
            first_name: t.name.split(" ")[0]!,
            full_name: t.name,
            unit: unit.label,
            property: property.name,
            rent: cad(store.rentOverrides[unit.id] ?? unit.rent),
            balance: cad(Math.max(balance, 0)),
          } as Record<string, string>,
        };
      }),
    [perms.tenants, rent, store.rentOverrides],
  );

  const [selected, setSelected] = useState<string[]>([]);
  const chosen = people.filter((p) => selected.includes(p.tenantId));
  const toggle = (id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const [subject, setSubject] = useState(templates["Building notice"]!.subject);
  const [body, setBody] = useState(templates["Building notice"]!.body);

  const [percent, setPercent] = useState(2.5);
  const [effective, setEffective] = useState(startOfNextRentPeriod(addDays(rent.today, 90)));

  const preview = chosen[0];

  const send = (kind: "email" | "invite") => {
    store.logBulk(
      {
        kind,
        subject: kind === "invite" ? templates["Portal invitation"]!.subject : subject,
        body: kind === "invite" ? templates["Portal invitation"]!.body : body,
        recipients: chosen.map((c) => ({ tenantId: c.tenantId, name: c.name, email: c.email })),
      },
      rent.today,
    );
    toast.success(
      kind === "invite"
        ? `${chosen.length} portal invitation${chosen.length === 1 ? "" : "s"} queued.`
        : `${chosen.length} email${chosen.length === 1 ? "" : "s"} queued — each one personalised.`,
    );
    setSelected([]);
  };

  const applyRent = () => {
    chosen.forEach((c) => store.setRentOverride(c.unitId, Math.round(c.rent * (1 + percent / 100) * 100) / 100));
    store.logBulk(
      {
        kind: "rent-update",
        subject: `Rent updated by ${percent}% from ${fullDate(effective)}`,
        body: "Bulk rent update applied to the selected leases.",
        recipients: chosen.map((c) => ({ tenantId: c.tenantId, name: c.name, email: c.email })),
      },
      rent.today,
    );
    toast.success(`${chosen.length} lease${chosen.length === 1 ? "" : "s"} updated, effective ${fullDate(effective)}.`);
    setSelected([]);
  };

  return (
    <>
      <PageHeader title="Bulk actions" subtitle="Do one thing for many tenants at once — personalised, never generic." />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["email", "Bulk email", EnvelopeSimple],
            ["invite", "Portal invitations", UserPlus],
            ["rent", "Rent update", TrendUp],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
              tab === key ? "bg-navy text-primary-foreground" : "border border-border text-navy hover:bg-navy-soft"
            }`}
          >
            <Icon weight="duotone" className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          {tab !== "rent" && (
            <div className="rounded-2xl border border-border bg-card p-4">
              {tab === "email" && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(templates).map((name) => (
                      <button
                        key={name}
                        className={btn}
                        onClick={() => {
                          setSubject(templates[name]!.subject);
                          setBody(templates[name]!.body);
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  <label className="mt-4 block text-sm font-medium text-navy">
                    Subject
                    <input className={field} value={subject} onChange={(e) => setSubject(e.target.value)} />
                  </label>
                  <label className="mt-3 block text-sm font-medium text-navy">
                    Message
                    <textarea rows={8} className={field} value={body} onChange={(e) => setBody(e.target.value)} />
                  </label>
                  <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    Tags:
                    {MERGE_TAGS.map((t) => (
                      <button
                        key={t}
                        className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-navy hover:bg-navy-soft"
                        onClick={() => setBody((b) => `${b}${t}`)}
                      >
                        {t}
                      </button>
                    ))}
                  </p>
                </>
              )}
              {tab === "invite" && (
                <>
                  <p className="text-sm text-navy">
                    Invite tenants to the portal so they can see rent, receipts and repairs. Each invitation is
                    personalised with their name and unit.
                  </p>
                  <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-border bg-navy-soft p-3 text-xs text-navy">
                    {templates["Portal invitation"]!.body}
                  </pre>
                </>
              )}
              {preview && (
                <div className="mt-4 rounded-xl border border-action/25 bg-action-soft p-3">
                  <p className="text-xs font-semibold text-navy">Preview for {preview.name}</p>
                  <p className="mt-1 text-sm font-semibold text-navy">
                    {renderTemplate(tab === "invite" ? templates["Portal invitation"]!.subject : subject, preview.vars)}
                  </p>
                  <pre className="mt-1 whitespace-pre-wrap text-xs text-navy">
                    {renderTemplate(tab === "invite" ? templates["Portal invitation"]!.body : body, preview.vars)}
                  </pre>
                </div>
              )}
              <button className={`${btnPrimary} mt-4`} disabled={!chosen.length} onClick={() => send(tab === "invite" ? "invite" : "email")}>
                <PaperPlaneTilt weight="duotone" className="h-4 w-4" />
                {tab === "invite" ? "Send invitations" : "Send"} to {chosen.length} tenant{chosen.length === 1 ? "" : "s"}
              </button>
            </div>
          )}

          {tab === "rent" && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-navy">
                  Increase (%)
                  <input type="number" step="0.01" className={field} value={percent} onChange={(e) => setPercent(Number(e.target.value))} />
                </label>
                <label className="text-sm font-medium text-navy">
                  Takes effect
                  <input type="date" className={field} value={effective} onChange={(e) => setEffective(e.target.value)} />
                </label>
              </div>
              <p className="mt-3 flex gap-2 rounded-xl border border-border bg-navy-soft p-3 text-xs text-navy">
                <Info weight="duotone" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <strong>General information, not legal advice.</strong> In Ontario a rent increase needs a served N1
                  with at least 90 days' notice. Use{" "}
                  <Link to="/app/notices" className="font-semibold underline">
                    Provincial notices
                  </Link>{" "}
                  to generate and serve those first — this screen only updates what you charge.
                </span>
              </p>
              <ul className="mt-4 space-y-2">
                {chosen.map((c) => (
                  <li key={c.tenantId} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
                    <span className="min-w-0 truncate text-navy">{c.name}</span>
                    <span className="money shrink-0 font-bold text-navy tnum">
                      {money(c.rent)} → {money(Math.round(c.rent * (1 + percent / 100) * 100) / 100)}
                    </span>
                  </li>
                ))}
              </ul>
              <button className={`${btnPrimary} mt-4`} disabled={!chosen.length} onClick={applyRent}>
                <TrendUp weight="duotone" className="h-4 w-4" /> Update {chosen.length} lease{chosen.length === 1 ? "" : "s"} from {fullDate(effective)}
              </button>
            </div>
          )}

          {store.bulkLog.length > 0 && (
            <div>
              <h2 className="font-display text-lg font-bold text-navy">Recent bulk actions</h2>
              <ul className="mt-2 space-y-2">
                {store.bulkLog.map((b) => (
                  <RailCard as="li" key={b.id} status="resolved" className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag tone={b.kind === "rent-update" ? "warning" : "action"}>
                        {b.kind === "email" ? "Email" : b.kind === "invite" ? "Invitation" : "Rent update"}
                      </Tag>
                      <span className="text-sm font-semibold text-navy">{b.subject}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {b.recipients.length} tenant{b.recipients.length === 1 ? "" : "s"} · {longDate(b.sentOn)}
                    </p>
                  </RailCard>
                ))}
              </ul>
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display font-bold text-navy">Who it goes to</h2>
            <button className="text-xs font-semibold text-action" onClick={() => setSelected(selected.length ? [] : people.map((p) => p.tenantId))}>
              {selected.length ? "Clear" : `Select all (${people.length})`}
            </button>
          </div>
          <ul className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
            {people.map((p) => (
              <li key={p.tenantId}>
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-2.5 text-sm ${selected.includes(p.tenantId) ? "border-action bg-action-soft" : "border-border"}`}>
                  <input type="checkbox" className="mt-0.5 h-5 w-5" checked={selected.includes(p.tenantId)} onChange={() => toggle(p.tenantId)} />
                  <span className="min-w-0">
                    <span className="block font-semibold text-navy">{p.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{p.email}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Users weight="duotone" className="h-4 w-4" /> {chosen.length} selected
          </p>
        </aside>
      </div>
    </>
  );
}
