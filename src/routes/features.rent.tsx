import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/keyhold/marketing-shell";
import { CurrencyDollar, CheckCircle, ShieldCheck, ChartLineUp } from "@phosphor-icons/react";

export const Route = createFileRoute("/features/rent")({
  head: () => ({
    meta: [
      { title: "Automated Rent Collection — Keyhold" },
      { name: "description", content: "Stop chasing checks. Automated rent collection, receipts, and overdue tracking for Canadian landlords." },
    ],
  }),
  component: RentFeaturePage,
});

function RentFeaturePage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-action-soft text-action">
                    <CurrencyDollar weight="duotone" className="h-6 w-6" />
                </div>
                <h1 className="mt-6 font-display text-5xl font-extrabold text-navy leading-tight">Rent tracking, <br /><span className="text-action">automated.</span></h1>
                <p className="mt-8 text-xl text-muted-foreground leading-relaxed">
                    Stop manually checking your bank account every month. Keyhold tracks every payment, issues professional receipts, 
                    and sends gentle reminders to tenants so you don't have to.
                </p>
                <div className="mt-12 space-y-6">
                    <div className="flex gap-4">
                        <CheckCircle weight="fill" className="h-6 w-6 text-success shrink-0" />
                        <div>
                            <p className="font-bold text-navy text-lg">Online Payments (Stripe/PAD)</p>
                            <p className="text-muted-foreground">Accept bank transfers and cards with zero management overhead.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <CheckCircle weight="fill" className="h-6 w-6 text-success shrink-0" />
                        <div>
                            <p className="font-bold text-navy text-lg">Smart Receipts</p>
                            <p className="text-muted-foreground">Legally compliant receipts sent instantly after payment is confirmed.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <CheckCircle weight="fill" className="h-6 w-6 text-success shrink-0" />
                        <div>
                            <p className="font-bold text-navy text-lg">Automated N4 Calculations</p>
                            <p className="text-muted-foreground">If a payment is late, we calculate the exact amount and dates for an N4 notice.</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="card-soft p-1 bg-surface-sunk overflow-hidden border-2 border-border shadow-2xl">
                <div className="bg-white p-8 space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <h4 className="font-bold text-navy">Rent Dashboard</h4>
                        <span className="text-xs font-bold text-success bg-success-soft px-2 py-1 rounded-full uppercase tracking-tighter">98% Collected</span>
                    </div>
                    {[
                        { name: "Unit 102", status: "Paid", amount: "$1,850" },
                        { name: "Unit 204", status: "Pending", amount: "$2,100" },
                        { name: "Unit 305", status: "Overdue", amount: "$1,600" },
                    ].map(item => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-navy">{item.name}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                item.status === 'Paid' ? 'bg-success-soft text-success' : 
                                item.status === 'Overdue' ? 'bg-warning-soft text-warning' : 'bg-surface-sunk text-muted-foreground'
                            }`}>{item.status}</span>
                            <span className="font-mono text-navy">{item.amount}</span>
                        </div>
                    ))}
                    <div className="pt-4 border-t border-border flex justify-between items-center text-xs">
                        <span className="text-muted-foreground italic">Last update: 2 minutes ago</span>
                        <span className="text-action font-bold">View Ledger →</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </MarketingShell>
  );
}
