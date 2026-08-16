import { useMemo, useState } from "react";
import {
  Receipt,
  FileText,
  Wrench,
  ChatCircleDots,
  Warning,
  Phone,
  CalendarBlank,
  CheckCircle,
  DownloadSimple,
  PaperPlaneTilt,
  Paperclip,
  BellRinging,
  Lock,
  UserCircle,
  ShieldWarning,
  Key as KeyIcon,
  WifiHigh,
  Clock,
  TrendUp,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { RailCard, StatusLabel } from "@/components/keyhold/status";
import { EmptyState } from "@/components/keyhold/empty-state";
import {
  cad,
  longDate,
  documents as allDocuments,
  leases as allLeases,
  threads as allThreads,
  tenantById,
  unitById,
  propertyById,
  unitAddress,
} from "@/lib/mock-data";
import { useRent } from "@/lib/mock-rent";
import {
  activePayments,
  balanceCents,
  downloadFile,
  invoiceStatus,
  money,
  paidCents,
  toCsv,
  yearlyReceipt,
  type Invoice,
} from "@/lib/rent-engine";
import { useMaintenance } from "@/lib/mock-maintenance";
import { useNotices } from "@/lib/mock-notices";
import { useCanada, CONSENT_TEXT, CREDIT_PARTNER } from "@/lib/mock-canada";
import { CATEGORIES, PREFERRED_TIMES, URGENCY, type Urgency } from "@/lib/maintenance-engine";

/* ————————————————————— scope: this tenant, nothing else ————————————————————— */
export const PORTAL_TENANT_ID = "t3";
export const PORTAL_UNIT_ID = "u3";

export function usePortalScope() {
  const rent = useRent();
  const maintenance = useMaintenance();
  const notices = useNotices();

  return useMemo(() => {
    const tenant = tenantById(PORTAL_TENANT_ID)!;
    const unit = unitById(PORTAL_UNIT_ID);
    const property = propertyById(unit.propertyId);
    const lease = allLeases.find((l) => l.tenantId === PORTAL_TENANT_ID) ?? null;

    // Only this tenant's invoices, payments, requests, notices, threads.
    const invoices = rent.invoices
      .filter((i) => i.tenantId === PORTAL_TENANT_ID)
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
    const payments = rent.payments.filter((p) => p.tenantId === PORTAL_TENANT_ID && !p.reversedOn);
    const openInvoices = invoices.filter((i) => balanceCents(i, rent.payments) > 0);
    const hero = openInvoices[openInvoices.length - 1] ?? invoices[0] ?? null;
    const balanceOwed = openInvoices.reduce((s, i) => s + balanceCents(i, rent.payments), 0);
    const requests = maintenance.requestsForTenant(PORTAL_TENANT_ID);
    const myNotices = notices.noticesForTenant(PORTAL_TENANT_ID);
    const thread = allThreads.find((t) => t.tenantId === PORTAL_TENANT_ID) ?? null;
    const docs = allDocuments.filter(
      (d) => d.linkedTo.includes(unitAddress(PORTAL_UNIT_ID)) || d.linkedTo === property.name,
    );

    return {
      rent,
      maintenance,
      tenant,
      unit,
      property,
      lease,
      invoices,
      payments,
      hero,
      balanceOwed,
      requests,
      notices: myNotices,
      thread,
      docs,
      creditCents: rent.creditFor(PORTAL_TENANT_ID),
      today: rent.today,
    };
  }, [rent, maintenance, notices]);
}

/* ————————————————————————— shared bits ————————————————————————— */
export const field =
  "mt-1 min-h-12 w-full rounded-xl border border-input bg-card px-3 text-base sm:text-sm";
const primaryBtn =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-action px-5 text-base font-semibold text-primary-foreground hover:bg-action/90 sm:w-auto";
const quietBtn =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-border px-5 text-base font-semibold text-navy hover:bg-navy-soft sm:w-auto";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 font-display text-lg font-bold text-navy">{children}</h2>;
}

function statusOf(invoice: Invoice, rent: ReturnType<typeof useRent>) {
  return invoiceStatus(invoice, rent.payments, rent.today);
}

function receiptText(scope: ReturnType<typeof usePortalScope>, invoice: Invoice) {
  const lines = activePayments(scope.rent.payments, invoice.id);
  return toCsv(
    ["Receipt for", "Home", "Charge", "Payment date", "Method", "Amount"],
    lines.map((p) => [
      scope.tenant.name,
      unitAddress(PORTAL_UNIT_ID),
      invoice.description,
      p.receivedOn,
      p.method,
      money(p.amountCents),
    ]),
  );
}

/* ————————————————————————— 1. home ————————————————————————— */
export function PortalHome({ scope, go }: { scope: ReturnType<typeof usePortalScope>; go: (tab: PortalTab) => void }) {
  const [showPayment, setShowPayment] = useState(false);
  const { hero, rent, requests, thread, lease } = scope;

  const openRequests = requests.filter((r) => r.status !== "resolved" && r.status !== "cancelled");
  const heroStatus = hero ? statusOf(hero, rent) : "paid";
  const heroBalance = hero ? balanceCents(hero, rent.payments) : 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Hello {scope.tenant.name.split(" ")[0]}</p>
        <h1 className="font-display text-2xl font-extrabold text-navy">Your home</h1>
        <p className="text-sm text-muted-foreground">{unitAddress(PORTAL_UNIT_ID)}</p>
      </div>

      {/* Rent hero */}
      <RailCard status={heroStatus} className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-navy">Your rent</h2>
          <StatusLabel status={heroStatus} />
        </div>
        <p className="money mt-2 text-4xl font-extrabold text-navy">
          {money(heroBalance > 0 ? heroBalance : (hero?.amountCents ?? 0))}
        </p>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarBlank weight="duotone" className="h-4 w-4" aria-hidden="true" />
          {heroBalance > 0 ? "Due" : "Paid for"} {hero ? longDate(hero.dueDate) : "—"}
        </p>
        {heroBalance > 0 && heroBalance < (hero?.amountCents ?? 0) && (
          <p className="mt-1 text-sm text-warning">Part paid — {money(heroBalance)} still to go.</p>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {heroBalance > 0 ? (
            <button type="button" className={primaryBtn} onClick={() => setShowPayment(true)}>
              Pay rent
            </button>

          ) : (
            <button
              type="button"
              className={primaryBtn}
              onClick={() => hero && downloadFile(`receipt-${hero.id}.csv`, receiptText(scope, hero))}
            >
              <Receipt weight="duotone" className="h-5 w-5" aria-hidden="true" /> View receipt
            </button>
          )}
          <button type="button" className={quietBtn} onClick={() => go("rent")}>
            See all rent
          </button>
        </div>
      </RailCard>

      {/* Open repair */}
      <section aria-labelledby="home-repairs">
        <h2 id="home-repairs" className="mb-3 font-display text-lg font-bold text-navy">Repairs</h2>
        {openRequests.length === 0 ? (
          <div className="card-soft p-5">
            <p className="text-sm text-muted-foreground">Nothing being fixed right now.</p>
            <button type="button" className={`${quietBtn} mt-3`} onClick={() => go("repairs")}>
              <Wrench weight="duotone" className="h-5 w-5" aria-hidden="true" /> Report an issue
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {openRequests.map((r) => (
              <RailCard as="li" key={r.id} status={r.status} className="p-4">
                <button type="button" className="block w-full text-left" onClick={() => go("repairs")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusLabel status={r.status} />
                    <p className="font-display font-bold text-navy">{r.subcategory}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Reported {longDate(r.openedOn)}</p>
                </button>
              </RailCard>
            ))}
          </ul>
        )}
      </section>

      {/* Next date + messages */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card-soft p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-navy">
            <Clock weight="duotone" className="h-5 w-5 text-action" aria-hidden="true" /> Next important date
          </p>
          <p className="tnum mt-2 text-base font-bold text-navy">{lease ? longDate(lease.end) : "—"}</p>
          <p className="text-sm text-muted-foreground">Your lease end date</p>
        </div>
        <button type="button" onClick={() => go("messages")} className="card-soft p-4 text-left">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-navy">
            <ChatCircleDots weight="duotone" className="h-5 w-5 text-action" aria-hidden="true" /> Messages
          </p>
          <p className="mt-2 text-base font-bold text-navy">
            {thread?.unread ? "1 unread message" : "No unread messages"}
          </p>
          <p className="line-clamp-1 text-sm text-muted-foreground">{thread?.last ?? "Say hello any time."}</p>
        </button>
      </div>

      <PortalCreditCard />

      {showPayment && hero && (
        <PortalPaymentFlow
          invoice={hero}
          scope={scope}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>

  );
}

/* —————————————————— credit building (opt-in) —————————————————— */
export function PortalCreditCard() {
  const canada = useCanada();
  const [showConsent, setShowConsent] = useState(false);
  const enrollment = canada.enrollmentFor(PORTAL_TENANT_ID);
  const history = canada.reportsFor(PORTAL_TENANT_ID);
  const enrolled = enrollment.status === "enrolled";

  return (
    <section className="card-soft p-4">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-navy">
        <TrendUp weight="duotone" className="h-5 w-5 text-action" aria-hidden="true" /> Build your credit with on-time rent
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        If you opt in, your monthly rent payments are shared with {CREDIT_PARTNER} so they can appear on your credit file. Late and missed
        payments are reported too, and no change to your credit score is promised. You can withdraw your consent at any time.
      </p>

      <p className="mt-3 text-sm font-semibold text-navy">
        Status: {enrolled ? "Enrolled" : enrollment.status === "revoked" ? "Consent withdrawn" : "Not enrolled"}
        {enrollment.consentAt ? (
          <span className="block text-xs font-normal text-muted-foreground">
            Consent recorded {new Date(enrollment.consentAt).toLocaleString("en-CA")}
          </span>
        ) : null}
      </p>

      {enrolled && history.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {history.map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded-lg bg-navy-soft px-3 py-2">
              <span className="tnum">{r.period}</span>
              <span className="font-semibold text-navy">
                {r.status === "reported-on-time"
                  ? "Reported — on time"
                  : r.status === "reported-late"
                    ? "Reported — late"
                    : r.status === "pending"
                      ? "Reports after the month closes"
                      : "Not reported"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {showConsent && !enrolled && (
        <div className="mt-3 rounded-xl border border-border p-3">
          <p className="text-sm text-navy">{CONSENT_TEXT}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={primaryBtn}
              onClick={() => {
                canada.enroll(PORTAL_TENANT_ID);
                setShowConsent(false);
                toast.success("You're enrolled. Your consent has been recorded with a timestamp.");
              }}
            >
              I consent — start reporting
            </button>
            <button type="button" className={quietBtn} onClick={() => setShowConsent(false)}>
              Not now
            </button>
          </div>
        </div>
      )}

      <div className="mt-3">
        {enrolled ? (
          <button
            type="button"
            className={quietBtn}
            onClick={() => {
              canada.revoke(PORTAL_TENANT_ID);
              toast.success("Consent withdrawn. Reporting stops with this month.");
            }}
          >
            Withdraw consent
          </button>
        ) : (
          !showConsent && (
            <button type="button" className={primaryBtn} onClick={() => setShowConsent(true)}>
              Read the consent and opt in
            </button>
          )
        )}
      </div>
    </section>
  );
}

/* ————————————————————————— 2. rent ————————————————————————— */
export function PortalRent({ scope }: { scope: ReturnType<typeof usePortalScope> }) {
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const { rent, invoices, payments, balanceOwed, creditCents } = scope;

  const year = Number(rent.today.slice(0, 4));

  const downloadYearly = (y: number) => {
    const { lines, totalCents } = yearlyReceipt({ tenantId: PORTAL_TENANT_ID, year: y, invoices: rent.invoices, payments: rent.payments });
    if (lines.length === 0) {
      toast.error(`No payments recorded in ${y}.`);
      return;
    }
    downloadFile(
      `rent-receipt-${y}.csv`,
      toCsv(
        ["Tenant", "Home", "Year", "Date", "For", "Method", "Amount"],
        [
          ...lines.map((l) => [scope.tenant.name, unitAddress(PORTAL_UNIT_ID), String(y), l.date, l.description, l.method, money(l.amountCents)]),
          ["", "", "", "", "Total paid", "", money(totalCents)],
        ],
      ),
    );
    toast.success(`Your ${y} rent receipt is downloading.`);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-navy">Rent</h1>

      <PortalAutopayCard scope={scope} />
      <PortalDeposits scope={scope} />

      <RailCard status={balanceOwed > 0 ? "overdue" : "paid"} className="p-5">

        <p className="text-sm text-muted-foreground">What you owe right now</p>
        <p className="money mt-1 text-4xl font-extrabold text-navy">{money(balanceOwed)}</p>
        {creditCents > 0 && (
          <p className="mt-1 text-sm text-success">You have {money(creditCents)} in credit on your account.</p>
        )}
        <button
          type="button"
          className={`${primaryBtn} mt-4`}
          onClick={() => {
            const openInvoices = invoices.filter(i => balanceCents(i, rent.payments) > 0);
            if (openInvoices.length > 0) {
              setPaymentInvoice(openInvoices[0]!);
            }
          }}
        >
          Pay rent
        </button>
      </RailCard>

      {paymentInvoice && (
        <PortalPaymentFlow
          invoice={paymentInvoice}
          scope={scope}
          onClose={() => setPaymentInvoice(null)}
        />
      )}


      <section aria-labelledby="tax-receipt" className="card-soft p-5">
        <h2 id="tax-receipt" className="font-display text-lg font-bold text-navy">Yearly rent receipt</h2>
        <p className="mt-1 text-sm text-muted-foreground">For your taxes — every payment you made in one file.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button type="button" className={primaryBtn} onClick={() => downloadYearly(year)}>
            <DownloadSimple weight="duotone" className="h-5 w-5" aria-hidden="true" /> {year} receipt
          </button>
          <button type="button" className={quietBtn} onClick={() => downloadYearly(year - 1)}>
            {year - 1} receipt
          </button>
        </div>
      </section>

      <section aria-labelledby="rent-history">
        <SectionTitle>Your payment history</SectionTitle>
        {invoices.length === 0 ? (
          <EmptyState Icon={Receipt} title="Nothing here yet" body="Your rent invoices and receipts will show up here." />
        ) : (
          <ul className="space-y-3">
            {invoices.map((i) => {
              const st = statusOf(i, rent);
              const paid = paidCents(i, rent.payments) + i.creditAppliedCents;
              const owed = Math.max(balanceCents(i, rent.payments), 0);
              const paidLines = payments.filter((p) => p.invoiceId === i.id);
              return (
                <RailCard as="li" key={i.id} status={st} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display font-bold text-navy">{i.description}</p>
                      <p className="tnum text-sm text-muted-foreground">Due {longDate(i.dueDate)}</p>
                    </div>
                    <StatusLabel status={st} />
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Charged</dt>
                      <dd className="money font-bold text-navy">{money(i.amountCents)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Paid</dt>
                      <dd className="money font-bold text-success">{money(paid)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Still owed</dt>
                      <dd className={`money font-bold ${owed ? "text-maple" : "text-success"}`}>{money(owed)}</dd>
                    </div>
                  </dl>
                  {paidLines.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                      {paidLines.map((p) => (
                        <li key={p.id} className="tnum">
                          {longDate(p.receivedOn)} · {p.method} · {money(p.amountCents)}
                        </li>
                      ))}
                    </ul>
                  )}
                  {paidLines.length > 0 && (
                    <button
                      type="button"
                      className={`${quietBtn} mt-3`}
                      onClick={() => {
                        downloadFile(`receipt-${i.id}.csv`, receiptText(scope, i));
                        toast.success("Receipt downloading.");
                      }}
                    >
                      <DownloadSimple weight="duotone" className="h-5 w-5" aria-hidden="true" /> Download receipt
                    </button>
                  )}
                </RailCard>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ————————————————————————— 3. maintenance ————————————————————————— */
export function PortalRepairs({ scope, urgentFirst = false }: { scope: ReturnType<typeof usePortalScope>; urgentFirst?: boolean }) {
  const { maintenance, requests } = scope;
  const [category, setCategory] = useState(CATEGORIES[0]!.name);
  const [subcategory, setSubcategory] = useState(CATEGORIES[0]!.subs[0]!);
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<Urgency>(urgentFirst ? "emergency" : "soon");
  const [permission, setPermission] = useState(true);
  const [preferredTime, setPreferredTime] = useState(PREFERRED_TIMES[0]!);
  const [photos, setPhotos] = useState<string[]>([]);
  const [sent, setSent] = useState<{ manager: string; channel: string } | null>(null);
  const [replyTo, setReplyTo] = useState<Record<string, string>>({});
  const subs = CATEGORIES.find((c) => c.name === category)?.subs ?? [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-navy">Repairs</h1>

      <section aria-labelledby="report-issue">
        <SectionTitle>Report an issue</SectionTitle>
        {sent ? (
          <RailCard status="resolved" className="p-5">
            <p className="inline-flex items-center gap-2 font-semibold text-success">
              <CheckCircle weight="duotone" className="h-5 w-5" aria-hidden="true" /> Sent
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {sent.manager} was told straight away by {sent.channel}. You'll get a message when someone is booked.
            </p>
            <button type="button" className={`${quietBtn} mt-4`} onClick={() => setSent(null)}>
              Report something else
            </button>
          </RailCard>
        ) : (
          <form
            className="card-soft space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (description.trim().length < 5) {
                toast.error("Please describe the problem in a sentence or two.");
                return;
              }
              const { manager, channel } = maintenance.createRequest({
                unitId: PORTAL_UNIT_ID,
                tenantId: PORTAL_TENANT_ID,
                category,
                subcategory,
                description: description.trim(),
                photos,
                urgency,
                permissionToEnter: permission,
                preferredTime,
                source: "tenant",
              });
              setSent({ manager: manager.name, channel });
              setDescription("");
              setPhotos([]);
              toast.success(`Sent — ${manager.name} was notified by ${channel}.`);
            }}
          >
            <div>
              <label htmlFor="p-cat" className="text-sm font-medium">What kind of problem?</label>
              <select
                id="p-cat"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubcategory(CATEGORIES.find((c) => c.name === e.target.value)!.subs[0]!);
                }}
                className={field}
              >
                {CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="p-sub" className="text-sm font-medium">More precisely</label>
              <select id="p-sub" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className={field}>
                {subs.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="p-desc" className="text-sm font-medium">Tell us what's happening</label>
              <textarea
                id="p-desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="The kitchen tap drips all day, even when it's turned off tight."
                className="mt-1 w-full rounded-xl border border-input bg-card p-3 text-base sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="p-photos" className="text-sm font-medium">Add photos (optional)</label>
              <input
                id="p-photos"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setPhotos(Array.from(e.target.files ?? []).map((f) => f.name))}
                className="mt-1 block w-full text-sm file:mr-3 file:min-h-12 file:rounded-full file:border-0 file:bg-navy-soft file:px-4 file:text-sm file:font-semibold file:text-navy"
              />
              {photos.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{photos.join(", ")}</p>}
            </div>
            <fieldset>
              <legend className="text-sm font-medium">How urgent is it?</legend>
              <div className="mt-2 space-y-2">
                {URGENCY.map((o) => (
                  <label key={o.id} className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-3 text-sm">
                    <input
                      type="radio"
                      name="p-urgency"
                      checked={urgency === o.id}
                      onChange={() => setUrgency(o.id)}
                      className="h-5 w-5 accent-[var(--action)]"
                    />
                    <span>
                      <span className="font-semibold text-navy">{o.label}</span>{" "}
                      <span className="text-muted-foreground">— {o.help}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-3 text-sm">
              <input
                type="checkbox"
                checked={permission}
                onChange={(e) => setPermission(e.target.checked)}
                className="h-5 w-5 accent-[var(--action)]"
              />
              It's okay to enter my home when I'm not there
            </label>
            <div>
              <label htmlFor="p-time" className="text-sm font-medium">Best time to come by</label>
              <select id="p-time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className={field}>
                {PREFERRED_TIMES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <button type="submit" className={`${primaryBtn} w-full`}>Send request</button>
          </form>
        )}
      </section>

      <section aria-labelledby="my-requests">
        <SectionTitle>Your requests</SectionTitle>
        {requests.length === 0 ? (
          <EmptyState Icon={Wrench} title="Nothing reported yet" body="When you report something, you'll be able to follow it here step by step." />
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => (
              <RailCard as="li" key={r.id} status={r.status} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusLabel status={r.status} />
                  <StatusLabel status={r.urgency} />
                  <p className="font-display font-bold text-navy">{r.subcategory}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Reported {longDate(r.openedOn)}</p>
                <p className="mt-2 text-sm">{r.description}</p>

                <ol className="mt-3 space-y-2 border-l border-border pl-4">
                  {r.log.map((entry) => (
                    <li key={entry.id} className="relative text-sm">
                      <span aria-hidden="true" className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-action" />
                      <span className="font-medium text-navy">{entry.actor}</span>{" "}
                      <span className="text-muted-foreground">{entry.text}</span>
                    </li>
                  ))}
                </ol>

                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const body = (replyTo[r.id] ?? "").trim();
                    if (!body) return;
                    scope.maintenance.addMessage(r.id, scope.tenant.name, body);
                    setReplyTo((prev) => ({ ...prev, [r.id]: "" }));
                    toast.success("Message sent.");
                  }}
                >
                  <label htmlFor={`msg-${r.id}`} className="sr-only">Message about {r.subcategory}</label>
                  <input
                    id={`msg-${r.id}`}
                    value={replyTo[r.id] ?? ""}
                    onChange={(e) => setReplyTo((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    placeholder="Add a note…"
                    className="min-h-12 w-full min-w-0 flex-1 rounded-full border border-input bg-card px-4 text-base sm:text-sm"
                  />
                  <button type="submit" className="grid min-h-12 min-w-12 shrink-0 place-items-center rounded-full bg-action text-primary-foreground">
                    <PaperPlaneTilt weight="duotone" className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">Send</span>
                  </button>
                </form>
              </RailCard>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ————————————————————————— 4. lease & documents ————————————————————————— */
export function PortalDocs({ scope }: { scope: ReturnType<typeof usePortalScope> }) {
  const { lease, docs, notices, property } = scope;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-navy">Lease & documents</h1>

      <section aria-labelledby="your-lease" className="card-soft p-5">
        <h2 id="your-lease" className="font-display text-lg font-bold text-navy">Your lease</h2>
        <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Type</dt>
            <dd className="font-medium">{lease?.type ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Started</dt>
            <dd className="tnum font-medium">{lease ? longDate(lease.start) : "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Monthly rent</dt>
            <dd className="money text-lg font-extrabold text-navy">{lease ? cad(lease.rent) : "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Deposit held</dt>
            <dd className="money text-lg font-extrabold text-navy">{lease ? cad(lease.depositHeld) : "—"}</dd>
          </div>
        </dl>
        <button
          type="button"
          className={`${quietBtn} mt-4`}
          onClick={() => toast.success("Your lease PDF is downloading.")}
        >
          <FileText weight="duotone" className="h-5 w-5" aria-hidden="true" /> View or download lease
        </button>
      </section>

      <section aria-labelledby="your-notices">
        <SectionTitle>Notices you've received</SectionTitle>
        {notices.length === 0 ? (
          <EmptyState Icon={FileText} title="No notices" body="If your landlord ever sends you a formal notice, a copy stays here." />
        ) : (
          <ul className="space-y-3">
            {notices.map((n) => (
              <li key={n.id} className="card-soft p-4">
                <p className="font-display font-bold text-navy">Form {n.type.toUpperCase()}</p>
                <p className="tnum mt-1 text-sm text-muted-foreground">
                  Dated {longDate(n.createdOn)}
                  {n.service ? ` · delivered ${n.service.method}` : ""}
                </p>
                <button
                  type="button"
                  className={`${quietBtn} mt-3`}
                  onClick={() => toast.success(`${n.fileName} is downloading.`)}
                >
                  <DownloadSimple weight="duotone" className="h-5 w-5" aria-hidden="true" /> Download copy
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="shared-docs">
        <SectionTitle>Building documents</SectionTitle>
        {docs.length === 0 ? (
          <EmptyState Icon={FileText} title="Nothing shared yet" body="Anything your landlord shares for your building will appear here." />
        ) : (
          <ul className="space-y-3">
            {docs.map((d) => (
              <li key={d.id} className="card-soft flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy">{d.name}</p>
                  <p className="text-sm text-muted-foreground">{d.kind} · {d.size}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success(`${d.name} is downloading.`)}
                  className="grid min-h-12 min-w-12 shrink-0 place-items-center rounded-full border border-border text-navy"
                >
                  <DownloadSimple weight="duotone" className="h-5 w-5" aria-hidden="true" />
                  <span className="sr-only">Download {d.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="shared-info" className="card-soft p-5">
        <h2 id="shared-info" className="font-display text-lg font-bold text-navy">Good to know</h2>
        <p className="mt-1 text-sm text-muted-foreground">Shared with you for {property.name}.</p>
        <ul className="mt-3 space-y-3 text-sm">
          <li className="flex items-center gap-3">
            <KeyIcon weight="duotone" className="h-5 w-5 text-action" aria-hidden="true" />
            <span>Front door code — <span className="tnum font-bold text-navy">4821#</span></span>
          </li>
          <li className="flex items-center gap-3">
            <WifiHigh weight="duotone" className="h-5 w-5 text-action" aria-hidden="true" />
            <span>Common area wifi — <span className="font-bold text-navy">Ottawa-Guest / welcome2026</span></span>
          </li>
          <li className="flex items-center gap-3">
            <CalendarBlank weight="duotone" className="h-5 w-5 text-action" aria-hidden="true" />
            <span>Bins go out Tuesday night, recycling every other week.</span>
          </li>
        </ul>
      </section>
    </div>
  );
}

/* ————————————————————————— 5. messages ————————————————————————— */
export function PortalMessages({ scope }: { scope: ReturnType<typeof usePortalScope> }) {
  const [draft, setDraft] = useState("");
  const [extra, setExtra] = useState<{ id: string; body: string }[]>([]);
  const thread = scope.thread;

  return (
    <div className="flex min-h-[60vh] flex-col space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy">Messages</h1>
        <p className="text-sm text-muted-foreground">With your property manager. Only you two can see this.</p>
      </div>

      <div className="card-soft flex-1 space-y-3 p-4">
        {(thread?.messages ?? []).map((m) => (
          <div key={m.id} className={m.from === "tenant" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                m.from === "tenant" ? "bg-action text-primary-foreground" : "bg-surface-sunk text-foreground"
              }`}
            >
              <p>{m.body}</p>
              <p className={`tnum mt-1 text-xs ${m.from === "tenant" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{m.when}</p>
            </div>
          </div>
        ))}
        {extra.map((m) => (
          <div key={m.id} className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl bg-action px-4 py-2.5 text-sm text-primary-foreground">
              <p>{m.body}</p>
              <p className="tnum mt-1 text-xs text-primary-foreground/70">Just now</p>
            </div>
          </div>
        ))}
      </div>

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const body = draft.trim();
          if (!body) return;
          setExtra((prev) => [...prev, { id: `m-${Date.now()}`, body }]);
          setDraft("");
          toast.success("Message sent.");
        }}
      >
        <button
          type="button"
          onClick={() => toast.success("Attachment added.")}
          className="grid min-h-12 min-w-12 shrink-0 place-items-center rounded-full border border-border text-navy"
        >
          <Paperclip weight="duotone" className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Add an attachment</span>
        </button>
        <label htmlFor="portal-msg" className="sr-only">Write a message</label>
        <input
          id="portal-msg"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          className="min-h-12 w-full min-w-0 flex-1 rounded-full border border-input bg-card px-4 text-base sm:text-sm"
        />
        <button type="submit" className="grid min-h-12 min-w-12 shrink-0 place-items-center rounded-full bg-action text-primary-foreground">
          <PaperPlaneTilt weight="duotone" className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Send</span>
        </button>
      </form>
    </div>
  );
}

/* ————————————————————————— 6. profile ————————————————————————— */
export function PortalProfile({ scope }: { scope: ReturnType<typeof usePortalScope> }) {
  const { tenant } = scope;
  const [email, setEmail] = useState(tenant.email);
  const [phone, setPhone] = useState(tenant.phone);
  const [prefs, setPrefs] = useState({ rent: true, repairs: true, messages: true, news: false });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold text-navy">Profile</h1>

      <form
        className="card-soft space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Your details are saved.");
        }}
      >
        <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold text-navy">
          <UserCircle weight="duotone" className="h-5 w-5 text-action" aria-hidden="true" /> Your details
        </h2>
        <div>
          <label htmlFor="pf-name" className="text-sm font-medium">Name</label>
          <input id="pf-name" defaultValue={tenant.name} className={field} />
        </div>
        <div>
          <label htmlFor="pf-email" className="text-sm font-medium">Email</label>
          <input id="pf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="pf-phone" className="text-sm font-medium">Mobile</label>
          <input id="pf-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
        </div>
        <button type="submit" className={`${primaryBtn} w-full`}>Save changes</button>
      </form>

      <section aria-labelledby="pf-notify" className="card-soft p-5">
        <h2 id="pf-notify" className="inline-flex items-center gap-2 font-display text-lg font-bold text-navy">
          <BellRinging weight="duotone" className="h-5 w-5 text-action" aria-hidden="true" /> Tell me about
        </h2>
        <div className="mt-3 space-y-2">
          {[
            { key: "rent" as const, label: "Rent due and receipts" },
            { key: "repairs" as const, label: "Updates on my repairs" },
            { key: "messages" as const, label: "New messages" },
            { key: "news" as const, label: "Building news" },
          ].map((o) => (
            <label key={o.key} className="flex min-h-12 items-center gap-3 rounded-xl border border-border px-3 text-sm">
              <input
                type="checkbox"
                checked={prefs[o.key]}
                onChange={(e) => setPrefs({ ...prefs, [o.key]: e.target.checked })}
                className="h-5 w-5 accent-[var(--action)]"
              />
              {o.label}
            </label>
          ))}
        </div>
      </section>

      <form
        className="card-soft space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Password changed.");
        }}
      >
        <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold text-navy">
          <Lock weight="duotone" className="h-5 w-5 text-action" aria-hidden="true" /> Change password
        </h2>
        <div>
          <label htmlFor="pf-old" className="text-sm font-medium">Current password</label>
          <input id="pf-old" type="password" autoComplete="current-password" className={field} />
        </div>
        <div>
          <label htmlFor="pf-new" className="text-sm font-medium">New password</label>
          <input id="pf-new" type="password" autoComplete="new-password" className={field} />
        </div>
        <button type="submit" className={`${quietBtn} w-full`}>Update password</button>
      </form>
    </div>
  );
}

/* ————————————————————————— SOS ————————————————————————— */
const SOS_KINDS = [
  { id: "Fire, smoke or gas smell", call911: true },
  { id: "Someone is hurt or in danger", call911: true },
  { id: "Flooding or burst pipe", call911: false },
  { id: "No heat in winter", call911: false },
  { id: "No power in the whole home", call911: false },
  { id: "Break-in or broken lock", call911: false },
];

export function PortalSos({ scope, onClose }: { scope: ReturnType<typeof usePortalScope>; onClose: () => void }) {
  const [kind, setKind] = useState<string | null>(null);
  const chosen = SOS_KINDS.find((k) => k.id === kind);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="inline-flex items-center gap-2 font-display text-lg font-extrabold text-maple">
          <ShieldWarning weight="duotone" className="h-6 w-6" aria-hidden="true" /> Urgent help
        </p>
        <button type="button" onClick={onClose} className="min-h-12 rounded-full border border-border px-4 text-sm font-semibold text-navy">
          Close
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
        <RailCard status="emergency" className="p-5">
          <p className="font-display text-base font-bold text-maple">If anyone is in danger right now, call 911.</p>
          <p className="mt-1 text-sm">
            Fire, smoke, a gas smell, or someone hurt — call emergency services first. Keyhold is not an emergency
            service and no one is watching this screen 24/7.
          </p>
          <a href="tel:911" className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-maple px-5 text-lg font-bold text-primary-foreground">
            <Phone weight="duotone" className="h-6 w-6" aria-hidden="true" /> Call 911
          </a>
        </RailCard>

        <fieldset>
          <legend className="mb-2 font-display text-base font-bold text-navy">What's happening?</legend>
          <div className="space-y-2">
            {SOS_KINDS.map((k) => (
              <label key={k.id} className="flex min-h-14 items-center gap-3 rounded-xl border border-border px-4 text-sm">
                <input
                  type="radio"
                  name="sos"
                  checked={kind === k.id}
                  onChange={() => setKind(k.id)}
                  className="h-5 w-5 accent-[var(--maple)]"
                />
                <span className="font-medium text-navy">{k.id}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {chosen?.call911 && (
          <p className="rounded-xl bg-maple-soft p-4 text-sm font-semibold text-maple">
            Please call 911 now. Send this to your landlord afterwards, not instead.
          </p>
        )}

        <div className="space-y-2 pb-8">
          <button
            type="button"
            disabled={!kind}
            onClick={() => {
              const { manager, channel } = scope.maintenance.createRequest({
                unitId: PORTAL_UNIT_ID,
                tenantId: PORTAL_TENANT_ID,
                category: "Emergency",
                subcategory: kind!,
                description: `Urgent report from the tenant portal: ${kind}.`,
                photos: [],
                urgency: "emergency",
                permissionToEnter: true,
                preferredTime: "Any time",
                source: "tenant",
              });
              toast.success(`${manager.name} was alerted by ${channel}.`);
              onClose();
            }}
            className="min-h-14 w-full rounded-full bg-maple px-5 text-base font-bold text-primary-foreground disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              <Warning weight="duotone" className="h-5 w-5" aria-hidden="true" /> Alert my landlord now
            </span>
          </button>
          <a
            href="tel:19055550177"
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full border border-border px-5 text-base font-semibold text-navy"
          >
            <Phone weight="duotone" className="h-5 w-5" aria-hidden="true" /> Call your landlord
          </a>
        </div>
      </div>
    </div>
  );
}

export type PortalTab = "home" | "rent" | "repairs" | "docs" | "messages" | "profile";

/* ————————————————————————— 7. payment flow ————————————————————————— */
import { Bank, CreditCard, CaretRight, X } from "@phosphor-icons/react";
import type { SavedPaymentMethod } from "@/lib/rent-engine";

export function PortalPaymentFlow({
  invoice,
  scope,
  onClose,
}: {
  invoice: Invoice;
  scope: ReturnType<typeof usePortalScope>;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"review" | "method" | "confirm" | "success">("review");
  const [method, setMethod] = useState<SavedPaymentMethod | null>(
    scope.rent.methodsForTenant(scope.tenant.id).find((m) => m.isDefault) || null
  );

  const balance = balanceCents(invoice, scope.rent.payments);
  const credit = Math.min(balance, scope.creditCents);
  const subtotal = balance - credit;

  const getFee = (m: SavedPaymentMethod | null) => {
    if (!m) return 0;
    if (m.type === "bank") return 0; // CAD standard: no PAD fees for tenants
    return Math.round(subtotal * 0.0275); // 2.75% for cards
  };

  const fee = getFee(method);
  const total = subtotal + fee;

  const handlePay = () => {
    if (!method) return;
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)).then(() => {
        scope.rent.recordPayment({
          invoiceId: invoice.id,
          amountCents: subtotal,
          method: method.type === "bank" ? "Bank account" : "Credit card",
          receivedOn: scope.today,
          reference: `Live-Demo-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
          feeCents: fee,
        } as any);

        setStep("success");
      }),
      {
        loading: "Contacting bank...",
        success: "Payment received.",
        error: "Payment failed.",
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background sm:mx-auto sm:max-w-2xl sm:border-x sm:border-border">
      {/* Demo Watermark */}
      <div className="bg-navy px-4 py-1 text-center text-[10px] font-bold uppercase tracking-widest text-primary-foreground/50">
        Demo Mode — No real money will be moved
      </div>

      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-lg font-bold text-navy">
          {step === "success" ? "Payment complete" : "Pay rent"}
        </h2>
        {step !== "success" && (
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-navy-soft"
          >
            <X weight="duotone" className="h-5 w-5" />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {step === "review" && (
          <div className="space-y-6">
            <RailCard status="due-soon" className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount due</p>
              <p className="money mt-1 text-4xl font-extrabold text-navy">{money(balance)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{invoice.description}</p>
            </RailCard>

            <div className="space-y-3">
              <SectionTitle>Summary</SectionTitle>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rent balance</span>
                  <span className="money font-medium text-navy">{money(balance)}</span>
                </div>
                {credit > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Credit on file</span>
                    <span className="money font-medium">- {money(credit)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between font-bold text-navy">
                  <span>Subtotal</span>
                  <span className="money">{money(subtotal)}</span>
                </div>
              </div>
            </div>

            <button type="button" className={primaryBtn} onClick={() => setStep("method")}>
              Next: Payment method <CaretRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        )}

        {step === "method" && (
          <div className="space-y-6">
            <SectionTitle>Select payment method</SectionTitle>
            <div className="space-y-3">
              {scope.rent.methodsForTenant(scope.tenant.id).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMethod(m);
                    setStep("confirm");
                  }}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${
                    method?.id === m.id ? "border-action bg-action/5" : "border-border hover:border-action/50"
                  }`}
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-navy-soft text-navy">
                    {m.type === "bank" ? <Bank weight="duotone" className="h-6 w-6" /> : <CreditCard weight="duotone" className="h-6 w-6" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-navy">{m.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.brand} •••• {m.last4}
                    </p>
                  </div>
                  {m.type === "card" && (
                    <span className="rounded-lg bg-navy-soft px-2 py-0.5 text-[10px] font-bold text-navy">
                      2.75% fee
                    </span>
                  )}
                  <CaretRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
              <button
                type="button"
                className={quietBtn}
                onClick={() => toast.info("In a real app, this would open a bank/Stripe connection.")}
              >
                + Add new method
              </button>
            </div>
            <button type="button" className={quietBtn} onClick={() => setStep("review")}>
              Back
            </button>
          </div>
        )}

        {step === "confirm" && method && (
          <div className="space-y-6">
            <div className="card-soft p-5 space-y-4">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-navy-soft text-navy">
                  {method.type === "bank" ? <Bank weight="duotone" className="h-6 w-6" /> : <CreditCard weight="duotone" className="h-6 w-6" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Paying with</p>
                  <p className="font-bold text-navy">{method.label} (•••• {method.last4})</p>
                </div>
                <button type="button" className="text-xs font-bold text-action" onClick={() => setStep("method")}>
                  Change
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="money font-medium text-navy">{money(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processing fee</span>
                  <span className={`money font-medium ${fee > 0 ? "text-navy" : "text-success"}`}>
                    {fee > 0 ? money(fee) : "CAbash.00"}
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-navy text-lg">Total</span>
                  <span className="money font-extrabold text-navy text-2xl">{money(total)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-navy-soft p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-navy">Fee Disclosure</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {method.type === "bank"
                  ? "Standard bank transfers (PAD) have no processing fees on Keyhold. The amount will be debited from your account within 1-3 business days."
                  : "Credit card payments incur a 2.75% processing fee. This fee is non-refundable and goes directly to the payment processor."}
              </p>
            </div>

            <button type="button" className={primaryBtn} onClick={handlePay}>
              Confirm & Pay {money(total)}
            </button>
            <button type="button" className={quietBtn} onClick={() => setStep("method")}>
              Back
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-success text-primary-foreground shadow-lg shadow-success/20">
              <CheckCircle weight="fill" className="h-12 w-12" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-extrabold text-navy">Success!</h3>
              <p className="mt-2 text-muted-foreground">
                Your payment of {money(total)} has been received.
              </p>
            </div>
            <div className="card-soft w-full p-4 text-left space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Next steps</p>
              <p className="text-sm text-navy">
                • You will receive a confirmation email shortly.<br />
                • The rent balance will update in your portal in a few moments.<br />
                • A receipt is now available in your history.
              </p>
            </div>
            <button type="button" className={primaryBtn} onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PortalAutopayCard({ scope }: { scope: ReturnType<typeof usePortalScope> }) {
  const autopay = scope.lease ? scope.rent.autopayForLease(scope.lease.id) : null;
  const methods = scope.rent.methodsForTenant(scope.tenant.id);
  const defaultMethod = methods.find(m => m.isDefault) || methods[0];

  if (!scope.lease) return null;

  return (
    <section className="card-soft p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-navy">Autopay</h2>
        <div className={`kh-tag ${autopay?.enabled ? "bg-success-soft text-success" : "bg-navy-soft text-navy"}`}>
          {autopay?.enabled ? "Active" : "Not enrolled"}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        When active, rent is automatically paid on the 1st of each month using your default method.
      </p>

      {autopay?.enabled ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-navy-soft p-4">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-navy shadow-sm">
              <Bank weight="duotone" className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Method</p>
              <p className="font-bold text-navy">
                {methods.find(m => m.id === autopay.methodId)?.label || "Bank account"}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border p-3 space-y-2">
            <p className="inline-flex items-center gap-2 text-xs font-bold text-navy">
              <Clock weight="duotone" className="h-4 w-4" /> Pre-charge notice
            </p>
            <p className="text-xs text-muted-foreground">
              We will send you a reminder 3 days before each charge. You can cancel or pause autopay at any time before the due date.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              scope.rent.toggleAutopay(scope.lease!.id, scope.tenant.id, "", false);
              toast.success("Autopay disabled. You will need to pay manually next month.");
            }}
            className={quietBtn}
          >
            Cancel autopay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium text-navy">Benefit from on-time payments automatically.</p>
          <button
            type="button"
            disabled={methods.length === 0}
            onClick={() => {
              if (defaultMethod) {
                scope.rent.toggleAutopay(scope.lease!.id, scope.tenant.id, defaultMethod.id, true);
                toast.success("Autopay enabled starting next month.");
              }
            }}
            className={primaryBtn}
          >
            {methods.length === 0 ? "Add a method to enable" : `Enable with ${defaultMethod?.label}`}
          </button>
        </div>
      )}
    </section>
  );
}
