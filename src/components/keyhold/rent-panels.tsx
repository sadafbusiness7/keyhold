/**
 * Rent side panels: invoice detail (with payment history + corrections),
 * record payment, manual charge, NSF reversal and move-out.
 * All arithmetic comes from rent-engine.ts — nothing is computed inline here.
 */
import { useState, type ReactNode } from "react";
import { X, Receipt, ArrowUUpLeft, PencilSimple, Coins, SignOut, PaperPlaneTilt, Prohibit, Bank, Calculator, Info } from "@phosphor-icons/react";
import { toast } from "sonner";
import { optimistic, settle } from "@/lib/optimistic";
import { ActivityFeed } from "./activity-feed";
import { StatusLabel } from "@/components/keyhold/status";
import { tenantById, unitAddress, longDate } from "@/lib/mock-data";
import { useRent, lastMonthHeldCents } from "@/lib/mock-rent";
import {
  activePayments,
  balanceCents,
  downloadFile,
  invoiceStatus,
  money,
  paidCents,
  parseAmountToCents,
  toCsv,
  calculateAccruedInterest,
  annualInterestOwing,
  LEGAL_DISCLAIMER,
  LTB_SOURCE_URL,
  type Invoice,
  type InvoiceKind,
  type PaymentMethod,
  type Deposit,
} from "@/lib/rent-engine";
import { downloadTablesPdf } from "@/lib/finance-engine";

const field = "mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm";
const methods: PaymentMethod[] = ["e-Transfer", "Cheque", "Cash", "Pre-authorized debit"];

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button className="absolute inset-0 bg-navy/40" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-label={title}
        className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-border bg-card"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-4">
          <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-11 w-11 place-items-center rounded-full text-navy hover:bg-navy-soft"
          >
            <X weight="duotone" className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-6 px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function InvoiceSheet({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const rent = useRent();
  const [mode, setMode] = useState<"none" | "pay" | "nsf" | "correct">("none");
  const [correctId, setCorrectId] = useState<string | null>(null);

  const live = rent.invoices.find((i) => i.id === invoice.id) ?? invoice;
  const history = rent.payments.filter((p) => p.invoiceId === live.id);
  const balance = balanceCents(live, rent.payments);
  const status = invoiceStatus(live, rent.payments, rent.today);
  const tenant = tenantById(live.tenantId);
  const credit = rent.creditFor(live.tenantId);
  const held = lastMonthHeldCents(live.tenantId);

  const downloadReceiptPdf = () => {
    const rows = activePayments(rent.payments, live.id);
    if (!rows.length) {
      toast.error("No payments to receipt yet.");
      return;
    }
    downloadTablesPdf(`receipt-${live.id}.pdf`, {
      title: "Rent receipt",
      subtitle: `${tenant?.name ?? "Tenant"} · ${live.unitId ? unitAddress(live.unitId) : "—"} · ${live.description}`,
      tables: [
        {
          title: "Payments received",
          headers: ["Date", "Method", "Reference", "Amount"],
          rows: rows.map((p) => [p.receivedOn, p.method, p.reference, money(p.amountCents)]),
        },
        {
          title: "Total",
          headers: ["Line", "Detail", "Amount"],
          rows: [["Total paid", live.description, money(paidCents(live, rent.payments))]],
        },
      ],
    });
    toast.success("Receipt PDF downloaded.");
  };

  const downloadReceipt = () => {
    const rows = activePayments(rent.payments, live.id).map((p) => [p.receivedOn, live.description, p.method, p.reference, money(p.amountCents)]);
    if (!rows.length) {
      toast.error("No payments to receipt yet.");
      return;
    }
    downloadFile(
      `receipt-${live.id}.csv`,
      toCsv(["Date", "For", "Method", "Reference", "Amount"], [
        ...rows,
        ["", "", "", "Total paid", money(paidCents(live, rent.payments))],
      ]),
    );
    toast.success("Receipt downloaded.");
  };

  return (
    <Sheet title="Invoice" onClose={onClose}>
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <StatusLabel status={status} />
          {!live.auto && <span className="rounded-full bg-navy-soft px-2.5 py-1 text-xs font-semibold text-navy">One-off charge</span>}
          {live.final && <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning">Final invoice</span>}
        </div>
        <h3 className="mt-3 font-display text-xl font-extrabold text-navy">{live.description}</h3>
        <p className="text-sm text-muted-foreground">
          {tenant?.name} · {live.unitId ? unitAddress(live.unitId) : "—"}
        </p>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <div>
            <dt className="text-muted-foreground">Charged</dt>
            <dd className="money text-lg font-extrabold text-navy">{money(live.amountCents)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Settled</dt>
            <dd className="money text-lg font-extrabold text-success">{money(paidCents(live, rent.payments) + live.creditAppliedCents)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Balance</dt>
            <dd className={`money text-lg font-extrabold ${balance > 0 ? "text-maple" : "text-success"}`}>{money(Math.max(balance, 0))}</dd>
          </div>
        </dl>
        <p className="tnum mt-2 text-sm text-muted-foreground">Due {longDate(live.dueDate)}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode(mode === "pay" ? "none" : "pay")}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
        >
          <Coins weight="duotone" className="h-5 w-5" /> Record payment
        </button>
        <button
          type="button"
          onClick={downloadReceipt}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold text-navy hover:bg-navy-soft"
        >
          <Receipt weight="duotone" className="h-5 w-5" /> Receipt CSV
        </button>
        <button
          type="button"
          onClick={downloadReceiptPdf}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold text-navy hover:bg-navy-soft"
        >
          <Receipt weight="duotone" className="h-5 w-5" /> Receipt PDF
        </button>
        <button
          type="button"
          onClick={() =>
            void optimistic({
              success: `Reminder sent to ${tenant?.name ?? "the tenant"}.`,
              failure: "The reminder didn't send — the tenant hasn't been contacted.",
              commit: settle,
            })
          }

          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold text-navy hover:bg-navy-soft"
        >
          <PaperPlaneTilt weight="duotone" className="h-5 w-5" /> Send reminder
        </button>
        {!live.voidedOn && (
          <button
            type="button"
            onClick={() => {
              if (!window.confirm(`Void this invoice? ${tenant?.name ?? "The tenant"} stops owing ${money(live.amountCents)} and the ledger keeps the record.`)) return;
              rent.voidInvoice(live.id, "Voided from the invoice");
              toast.success("Invoice voided.");
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-maple px-5 text-sm font-semibold text-maple hover:bg-maple-soft"
          >
            <Prohibit weight="duotone" className="h-5 w-5" /> Void invoice
          </button>
        )}
      </div>
      {live.voidedOn && (
        <p className="rounded-xl bg-navy-soft p-3 text-sm text-navy">
          Voided {longDate(live.voidedOn)} — {live.voidReason}. Nothing is owed on this invoice.
        </p>
      )}

      {mode === "pay" && (
        <PaymentForm
          balanceCents={Math.max(balance, 0)}
          onSubmit={(v) => {
            const result = rent.recordPayment({ invoiceId: live.id, ...v });
            if (!result) return;
            toast.success(
              result.overpaymentCents > 0
                ? `Payment recorded. ${money(result.overpaymentCents)} kept as a tenant credit.`
                : "Payment recorded.",
            );
            setMode("none");
          }}
        />
      )}

      {/* Credits & last month's rent */}
      <section className="rounded-2xl border border-border p-4">
        <h4 className="font-display text-sm font-bold text-navy">Credits & deposits</h4>
        <p className="tnum mt-1 text-sm text-muted-foreground">
          Credit on file <span className="money font-bold text-navy">{money(credit)}</span> · Last month's rent held{" "}
          <span className="money font-bold text-navy">{money(held)}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={credit <= 0 || balance <= 0}
            onClick={() => {
              const applied = rent.applyCredit(live.id);
              toast.success(applied ? `${money(applied)} of credit applied.` : "Nothing to apply.");
            }}
            className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft disabled:opacity-40"
          >
            Apply credit
          </button>
          <button
            type="button"
            disabled={held <= 0 || balance <= 0}
            onClick={() => {
              const applied = rent.applyLastMonth(live.id);
              toast.success(applied ? `${money(applied)} of last month's rent applied to the final invoice.` : "Nothing to apply.");
            }}
            className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-navy hover:bg-navy-soft disabled:opacity-40"
          >
            Apply last month's rent
          </button>
        </div>
      </section>

      {/* Payment history */}
      <section>
        <h4 className="mb-2 font-display text-sm font-bold text-navy">Payment history</h4>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((p) => (
              <li key={p.id} className={`rounded-xl border border-border p-3 text-sm ${p.reversedOn ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="money font-bold text-navy">{money(p.amountCents)}</p>
                    <p className="tnum text-xs text-muted-foreground">
                      {longDate(p.receivedOn)} · {p.method} · {p.reference}
                    </p>
                    {p.reversedOn && (
                      <p className="mt-1 text-xs font-semibold text-maple">
                        Reversed {longDate(p.reversedOn)} — {p.reversalReason === "nsf" ? "NSF" : "corrected"}
                      </p>
                    )}
                    {p.note && <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>}
                  </div>
                  {!p.reversedOn && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        aria-label="Correct this payment"
                        onClick={() => {
                          setCorrectId(p.id);
                          setMode("correct");
                        }}
                        className="grid h-10 w-10 place-items-center rounded-full text-navy hover:bg-navy-soft"
                      >
                        <PencilSimple weight="duotone" className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Mark as NSF"
                        onClick={() => {
                          setCorrectId(p.id);
                          setMode("nsf");
                        }}
                        className="grid h-10 w-10 place-items-center rounded-full text-maple hover:bg-maple-soft"
                      >
                        <ArrowUUpLeft weight="duotone" className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ActivityFeed entityType="invoice" entityId={live.id} title="Invoice activity" />

      {mode === "correct" && correctId && (
        <PaymentForm
          heading="Correct this payment"
          submitLabel="Save correction"
          balanceCents={Math.max(balance, 0)}
          onSubmit={(v) => {
            rent.correctPayment(correctId, v.amountCents, v.method, v.receivedOn);
            toast.success("Payment corrected. The original entry is kept and marked reversed.");
            setMode("none");
          }}
        />
      )}

      {mode === "nsf" && correctId && (
        <NsfForm
          onSubmit={(feeCents) => {
            rent.reverseForNsf(correctId, feeCents);
            toast.error("Payment reversed. NSF charge raised and the invoice is overdue again.");
            setMode("none");
          }}
        />
      )}
    </Sheet>
  );
}

function PaymentForm({
  balanceCents: balance,
  onSubmit,
  heading = "Record a payment",
  submitLabel = "Save payment",
}: {
  balanceCents: number;
  heading?: string;
  submitLabel?: string;
  onSubmit: (v: { amountCents: number; method: PaymentMethod; receivedOn: string; reference: string }) => void;
}) {
  const rent = useRent();
  const [amount, setAmount] = useState((balance / 100).toFixed(2));
  const [method, setMethod] = useState<PaymentMethod>("e-Transfer");
  const [receivedOn, setReceivedOn] = useState(rent.today);
  const [reference, setReference] = useState("");

  return (
    <form
      className="rounded-2xl border border-border bg-surface-sunk p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const cents = parseAmountToCents(amount);
        if (cents === null || cents <= 0) {
          toast.error("Enter an amount greater than zero.");
          return;
        }
        onSubmit({ amountCents: cents, method, receivedOn, reference });
      }}
    >
      <h4 className="font-display text-sm font-bold text-navy">{heading}</h4>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="pf-amount" className="text-sm font-medium">Amount (CAD)</label>
          <input id="pf-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${field} tnum`} />
          <p className="mt-1 text-xs text-muted-foreground">Partial payments are fine.</p>
        </div>
        <div>
          <label htmlFor="pf-method" className="text-sm font-medium">Method</label>
          <select id="pf-method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={field}>
            {methods.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pf-date" className="text-sm font-medium">Received on</label>
          <input id="pf-date" type="date" value={receivedOn} onChange={(e) => setReceivedOn(e.target.value)} className={`${field} tnum`} />
        </div>
        <div>
          <label htmlFor="pf-ref" className="text-sm font-medium">Reference (optional)</label>
          <input id="pf-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e-Transfer code, cheque #" className={field} />
        </div>
      </div>
      <button type="submit" className="mt-4 min-h-11 w-full rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90">
        {submitLabel}
      </button>
    </form>
  );
}

function NsfForm({ onSubmit }: { onSubmit: (feeCents: number) => void }) {
  const [fee, setFee] = useState("50.00");
  return (
    <form
      className="rounded-2xl border border-maple/40 bg-maple-soft p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(parseAmountToCents(fee) ?? 0);
      }}
    >
      <h4 className="font-display text-sm font-bold text-maple">Payment returned (NSF)</h4>
      <p className="mt-1 text-xs text-maple">
        The payment is reversed, an NSF charge is raised, and the invoice goes back to Overdue.
      </p>
      <label htmlFor="nsf-fee" className="mt-3 block text-sm font-medium">NSF charge (CAD)</label>
      <input id="nsf-fee" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} className={`${field} tnum`} />
      <button type="submit" className="mt-4 min-h-11 w-full rounded-full bg-maple px-5 text-sm font-semibold text-primary-foreground hover:bg-maple/90">
        Reverse payment
      </button>
    </form>
  );
}

export function ManualChargeSheet({ onClose }: { onClose: () => void }) {
  const rent = useRent();
  const tenantsWithLease = rent.leases.filter((l) => !rent.isMovedOut(l.tenantId));
  const [tenantId, setTenantId] = useState(tenantsWithLease[0]?.tenantId ?? "");
  const [kind, setKind] = useState<InvoiceKind>("utilities");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(rent.today);

  return (
    <Sheet title="One-off charge" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const cents = parseAmountToCents(amount);
          if (cents === null || cents <= 0) {
            toast.error("Enter an amount greater than zero.");
            return;
          }
          rent.addManualInvoice({
            tenantId,
            kind,
            description: description.trim() || (kind === "utilities" ? "Utilities" : kind === "damage" ? "Damage" : "Other charge"),
            amountCents: cents,
            dueDate,
          });
          toast.success("Charge added to the tenant's ledger.");
          onClose();
        }}
      >
        <p className="text-sm text-muted-foreground">
          Rent invoices generate on their own. Use this for utilities, damage or anything else.
        </p>
        <div>
          <label htmlFor="mc-tenant" className="text-sm font-medium">Tenant</label>
          <select id="mc-tenant" value={tenantId} onChange={(e) => setTenantId(e.target.value)} className={field}>
            {tenantsWithLease.map((l) => (
              <option key={l.tenantId} value={l.tenantId}>
                {tenantById(l.tenantId)?.name} — {unitAddress(l.unitId)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="mc-kind" className="text-sm font-medium">What is it for?</label>
          <select id="mc-kind" value={kind} onChange={(e) => setKind(e.target.value as InvoiceKind)} className={field}>
            <option value="utilities">Utilities</option>
            <option value="damage">Damage</option>
            <option value="other">Something else</option>
          </select>
        </div>
        <div>
          <label htmlFor="mc-desc" className="text-sm font-medium">Description</label>
          <input id="mc-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Water & sewer share — August" className={field} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="mc-amount" className="text-sm font-medium">Amount (CAD)</label>
            <input id="mc-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${field} tnum`} />
          </div>
          <div>
            <label htmlFor="mc-due" className="text-sm font-medium">Due</label>
            <input id="mc-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`${field} tnum`} />
          </div>
        </div>
        <button type="submit" className="min-h-11 w-full rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90">
          Add charge
        </button>
      </form>
    </Sheet>
  );
}

export function MoveOutSheet({ onClose }: { onClose: () => void }) {
  const rent = useRent();
  const options = rent.leases.filter((l) => !rent.isMovedOut(l.tenantId));
  const [tenantId, setTenantId] = useState(options[0]?.tenantId ?? "");
  const [date, setDate] = useState(rent.today);
  const [reason, setReason] = useState("End of tenancy");

  return (
    <Sheet title="Move a tenant out" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!tenantId) return;
          rent.moveOut(tenantId, date, reason);
          toast.success("Moved out. Future invoicing stopped and portal access disabled — records are kept.");
          onClose();
        }}
      >
        <p className="text-sm text-muted-foreground">
          This stops future invoices, disables their portal sign-in and moves them to the Moved out list. Nothing is deleted.
        </p>
        <div>
          <label htmlFor="mo-tenant" className="text-sm font-medium">Tenant</label>
          <select id="mo-tenant" value={tenantId} onChange={(e) => setTenantId(e.target.value)} className={field}>
            {options.map((l) => (
              <option key={l.tenantId} value={l.tenantId}>
                {tenantById(l.tenantId)?.name} — {unitAddress(l.unitId)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="mo-date" className="text-sm font-medium">Moved out on</label>
          <input id="mo-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${field} tnum`} />
        </div>
        <div>
          <label htmlFor="mo-reason" className="text-sm font-medium">Reason</label>
          <input id="mo-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={field} />
        </div>
        <button type="submit" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-primary-foreground hover:bg-navy/90">
          <SignOut weight="duotone" className="h-5 w-5" /> Complete move-out
        </button>
      </form>
    </Sheet>
  );
}

export function AddDepositSheet({ onClose }: { onClose: () => void }) {
  const rent = useRent();
  const options = rent.leases.filter((l) => !rent.isMovedOut(l.tenantId));
  const [tenantId, setTenantId] = useState(options[0]?.tenantId ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(rent.today);
  const [kind, setKind] = useState<Deposit["kind"]>("last-month");

  return (
    <Sheet title="Add a deposit" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const cents = parseAmountToCents(amount);
          if (cents === null || cents <= 0) {
            toast.error("Enter a valid deposit amount.");
            return;
          }
          const lease = rent.leases.find(l => l.tenantId === tenantId);
          if (!lease) return;
          
          rent.addDeposit({
            tenantId,
            leaseId: lease.id,
            kind,
            amountCents: cents,
            receivedOn: date,
          });
          toast.success("Deposit recorded and interest tracking started.");
          onClose();
        }}
      >
        <p className="text-sm text-muted-foreground">
          Track last month's rent or other security deposits. Interest accrues automatically.
        </p>
        <div>
          <label htmlFor="ad-tenant" className="text-sm font-medium">Tenant</label>
          <select id="ad-tenant" value={tenantId} onChange={(e) => setTenantId(e.target.value)} className={field}>
            {options.map((l) => (
              <option key={l.tenantId} value={l.tenantId}>
                {tenantById(l.tenantId)?.name} — {unitAddress(l.unitId)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ad-kind" className="text-sm font-medium">Deposit kind</label>
          <select id="ad-kind" value={kind} onChange={(e) => setKind(e.target.value as any)} className={field}>
            <option value="last-month">Last month's rent</option>
            <option value="security">Security deposit</option>
            <option value="pet">Pet deposit</option>
            <option value="key">Key deposit</option>
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="ad-amount" className="text-sm font-medium">Amount (CAD)</label>
            <input id="ad-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${field} tnum`} />
          </div>
          <div>
            <label htmlFor="ad-date" className="text-sm font-medium">Received on</label>
            <input id="ad-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${field} tnum`} />
          </div>
        </div>
        <button type="submit" className="min-h-11 w-full rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90">
          Record deposit
        </button>
      </form>
    </Sheet>
  );
}

export function DepositLedgerSheet({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const rent = useRent();
  const tenant = tenantById(tenantId);
  const deposits = rent.depositsForTenant(tenantId);

  return (
    <Sheet title="Deposit ledger" onClose={onClose}>
      <header>
        <h3 className="font-display text-xl font-extrabold text-navy">{tenant?.name}</h3>
        <p className="text-sm text-muted-foreground">Detailed history of held deposits and interest.</p>
      </header>

      {deposits.length === 0 ? (
        <p className="card-soft p-5 text-sm text-muted-foreground text-center">No deposits held for this tenant.</p>
      ) : (
        <ul className="space-y-4">
          {deposits.map(d => {
            const accrued = calculateAccruedInterest(d, rent.today, rent.interestPayments);
            const annual = annualInterestOwing(d);
            const payments = rent.interestForDeposit(d.id);
            
            return (
              <li key={d.id} className="card-soft overflow-hidden border border-border">
                <div className="bg-navy-soft px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="font-display font-bold text-navy uppercase tracking-wider text-xs">{d.kind.replace("-", " ")}</span>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Since {longDate(d.receivedOn)}</span>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Principal held</p>
                      <p className="money text-2xl font-extrabold text-navy">{money(d.amountCents)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Accrued interest</p>
                      <p className="money text-2xl font-extrabold text-success">+{money(accrued)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Annual owing</p>
                      <p className="tnum text-sm font-semibold text-navy">{money(annual)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Guideline rate</p>
                      <p className="tnum text-sm font-semibold text-navy">2.5%</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button 
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-action px-3 text-xs font-bold text-primary-foreground hover:bg-action/90 disabled:opacity-50"
                      disabled={accrued <= 0}
                      onClick={() => {
                        rent.recordInterestPaid(d.id, accrued, "applied");
                        toast.success(`${money(accrued)} interest applied to tenant credit.`);
                      }}
                    >
                      <Calculator weight="duotone" className="h-4 w-4" /> Apply to credit
                    </button>
                    <button 
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-bold text-navy hover:bg-navy-soft disabled:opacity-50"
                      disabled={accrued <= 0}
                      onClick={() => {
                        rent.recordInterestPaid(d.id, accrued, "paid");
                        toast.success(`${money(accrued)} interest recorded as paid.`);
                      }}
                    >
                      Record as paid
                    </button>
                  </div>
                  
                  {payments.length > 0 && (
                    <div className="mt-4 border-t border-border pt-3">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">Interest history</p>
                      <ul className="space-y-1">
                        {payments.map(p => (
                          <li key={p.id} className="flex justify-between text-[11px] text-muted-foreground">
                            <span>{longDate(p.paidOn)} · {p.method === "applied" ? "Applied to credit" : "Paid to tenant"}</span>
                            <span className="font-semibold text-navy">{money(p.amountCents)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 p-4 rounded-xl bg-navy-soft border border-action/20 flex gap-3">
        <Info weight="duotone" className="h-5 w-5 text-action shrink-0" />
        <div>
          <p className="text-xs leading-relaxed text-navy">
            {LEGAL_DISCLAIMER} Ontario requires annual interest on last month's rent at the guideline rate.
          </p>
          <a href={LTB_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-action hover:underline mt-1 block">
            Link to official source
          </a>
        </div>
      </div>
    </Sheet>
  );
}

export function TenantStatementSheet({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const rent = useRent();
  const tenant = tenantById(tenantId);
  const ledger = useMemo(() => rent.getLedger(tenantId), [rent, tenantId]);

  const downloadStatementCsv = () => {
    const headers = ["Date", "Description", "Type", "Amount", "Balance"];
    const rows = ledger.map(e => [
      e.date,
      e.description,
      e.type,
      money(e.amountCents),
      money(e.balanceCents)
    ]);
    downloadFile(`statement-${tenant?.name.replace(/\s+/g, "-").toLowerCase()}.csv`, toCsv(headers, rows));
  };

  const downloadStatementPdf = () => {
    downloadTablesPdf(`statement-${tenantId}.pdf`, {
      title: "Tenant Statement",
      subtitle: `${tenant?.name} · Statement as of ${longDate(rent.today)}`,
      tables: [{
        title: "Ledger History",
        headers: ["Date", "Description", "Type", "Amount", "Balance"],
        rows: ledger.map(e => [
          e.date,
          e.description,
          e.type,
          money(e.amountCents),
          money(e.balanceCents)
        ])
      }]
    });
  };

  return (
    <Sheet title="Tenant Statement" onClose={onClose}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-navy">{tenant?.name}</h3>
          <p className="text-xs text-muted-foreground">Full financial history</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadStatementCsv} className="p-2 rounded-full border border-border hover:bg-navy-soft" title="Export CSV">
            <DownloadSimple weight="duotone" className="h-5 w-5" />
          </button>
          <button onClick={downloadStatementPdf} className="p-2 rounded-full border border-border hover:bg-navy-soft" title="Export PDF">
            <FileText weight="duotone" className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-navy-soft text-navy uppercase font-bold tracking-tight">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ledger.map(e => (
              <tr key={e.id} className="hover:bg-navy-soft/30 transition-colors">
                <td className="px-3 py-2 tnum text-muted-foreground whitespace-nowrap">{e.date}</td>
                <td className="px-3 py-2">
                  <p className="font-bold text-navy">{e.description}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">{e.type}</p>
                </td>
                <td className={`px-3 py-2 tnum text-right font-bold ${e.amountCents > 0 ? "text-maple" : "text-success"}`}>
                  {money(Math.abs(e.amountCents))}
                </td>
                <td className="px-3 py-2 tnum text-right font-bold text-navy">{money(e.balanceCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 rounded-xl border border-dashed border-border text-center">
        <p className="text-xs text-muted-foreground">
          This statement includes all automated invoices, manual charges, payments, and adjustments.
        </p>
      </div>
    </Sheet>
  );
}

export function RecurringChargesSheet({ leaseId, tenantId, onClose }: { leaseId: string; tenantId: string; onClose: () => void }) {
  const rent = useRent();
  const charges = rent.recurringForTenant(tenantId).filter(c => c.leaseId === leaseId);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <Sheet title="Recurring Charges" onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Automated line items for this lease.</p>
        <button 
          onClick={() => setShowAdd(true)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-action px-3 text-xs font-bold text-primary-foreground hover:bg-action/90"
        >
          <Plus weight="bold" /> Add charge
        </button>
      </div>

      <ul className="space-y-3">
        {charges.map(c => (
          <li key={c.id} className="card-soft p-4 border-l-4 border-navy">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-navy">{c.description}</h4>
                <p className="text-xs text-muted-foreground">
                  Starts {longDate(c.startDate)} {c.endDate ? `· Ends ${longDate(c.endDate)}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="money text-lg font-extrabold text-navy">{money(c.amountCents)}</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">{c.frequency}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <span className={`text-[10px] font-bold uppercase ${c.taxable ? "text-maple" : "text-muted-foreground"}`}>
                {c.taxable ? "Taxable (HST/GST)" : "Non-taxable"}
              </span>
              <button 
                onClick={() => rent.endRecurringCharge(c.id, rent.today)}
                className="text-maple text-xs font-bold uppercase hover:underline"
              >
                End charge
              </button>
            </div>
          </li>
        ))}
        {charges.length === 0 && (
          <div className="text-center py-8 card-soft border-dashed">
            <Calculator weight="duotone" className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20" />
            <p className="text-sm text-muted-foreground">No recurring fees set up yet.</p>
          </div>
        )}
      </ul>

      {showAdd && (
        <div className="mt-6 border-t border-border pt-6">
          <h4 className="font-display font-bold text-navy mb-4">New recurring charge</h4>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
              <input placeholder="e.g. Parking spot #4" className={field} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Amount (CAD)</label>
                <input placeholder="0.00" className={field} />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Frequency</label>
                <select className={field}>
                  <option>Monthly</option>
                  <option>Yearly</option>
                </select>
              </div>
            </div>
            <button 
              onClick={() => {
                toast.success("Charge added.");
                setShowAdd(false);
              }}
              className="w-full min-h-11 rounded-full bg-navy text-primary-foreground font-bold hover:bg-navy/90"
            >
              Save recurring charge
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

export function AdjustmentSheet({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const rent = useRent();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState<"goodwill" | "damage" | "correction">("correction");

  return (
    <Sheet title="One-off Adjustment" onClose={onClose}>
      <p className="text-sm text-muted-foreground mb-6">
        Apply a direct credit or charge to the ledger. This action is audited and visible on the tenant statement.
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase">Adjustment Category</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["correction", "goodwill", "damage"] as const).map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-xs font-bold border ${
                  category === c ? "bg-navy text-primary-foreground border-navy" : "border-border text-navy hover:bg-navy-soft"
                }`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase">Amount (CAD)</label>
          <input 
            placeholder="0.00" 
            className={field}
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <p className="mt-1 text-[10px] text-muted-foreground italic">Use a negative sign for a charge (e.g. -50.00), positive for a credit.</p>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase">Reason for adjustment</label>
          <textarea 
            placeholder="Describe why this adjustment is being made..." 
            className={`${field} py-3 min-h-[100px] resize-none`}
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>

        <div className="pt-4">
          <button 
            disabled={!amount || !reason}
            onClick={() => {
              const cents = parseAmountToCents(amount);
              if (cents !== null) {
                rent.addAdjustment(tenantId, cents, reason, category);
                toast.success("Adjustment applied to ledger.");
                onClose();
              }
            }}
            className="w-full min-h-11 rounded-full bg-action text-primary-foreground font-bold hover:bg-action/90 disabled:opacity-50"
          >
            Apply to Ledger
          </button>
        </div>
      </div>
    </Sheet>
  );
}

