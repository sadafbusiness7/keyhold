import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/keyhold/marketing-shell";
import { Monitor, CheckCircle, Smartphone, ShieldCheck } from "@phosphor-icons/react";

export const Route = createFileRoute("/features/portal")({
  head: () => ({
    meta: [
      { title: "Tenant Portal — Keyhold" },
      { name: "description", content: "Empower your tenants. Secure portal for payments, maintenance requests, and document access." },
    ],
  }),
  component: PortalFeaturePage,
});

function PortalFeaturePage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1 flex justify-center">
                <div className="relative w-full max-w-sm">
                    <div className="absolute -inset-4 rounded-[3rem] border-8 border-navy/5 bg-navy/5 blur-xl" />
                    <div className="relative overflow-hidden rounded-[2.5rem] border-[8px] border-navy bg-white aspect-[9/19] shadow-2xl">
                        <div className="absolute top-0 w-full h-8 bg-navy flex justify-center items-end pb-1">
                            <div className="h-4 w-20 rounded-full bg-black/20" />
                        </div>
                        <div className="p-6 pt-12 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-navy-soft flex items-center justify-center text-navy font-bold">JD</div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter leading-none">Welcome back</p>
                                    <p className="text-sm font-bold text-navy">Jane Doe</p>
                                </div>
                            </div>
                            <div className="card-soft p-4 bg-navy text-primary-foreground">
                                <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Rent Due Sept 1</p>
                                <p className="mt-1 text-2xl font-bold">$1,850.00</p>
                                <button className="mt-4 w-full rounded-xl bg-action py-2 text-xs font-bold">Pay Rent</button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="card-soft p-3 bg-surface-sunk text-center">
                                    <Smartphone className="mx-auto h-5 w-5 text-navy" />
                                    <p className="mt-2 text-[8px] font-bold text-navy uppercase">Support</p>
                                </div>
                                <div className="card-soft p-3 bg-surface-sunk text-center">
                                    <ShieldCheck className="mx-auto h-5 w-5 text-navy" />
                                    <p className="mt-2 text-[8px] font-bold text-navy uppercase">Docs</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="order-1 lg:order-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-soft text-navy">
                    <Monitor weight="duotone" className="h-6 w-6" />
                </div>
                <h1 className="mt-6 font-display text-5xl font-extrabold text-navy leading-tight">Empower your <br /><span className="text-navy/60">tenants.</span></h1>
                <p className="mt-8 text-xl text-muted-foreground leading-relaxed">
                    A professional landlord provides a professional experience. Give your tenants a secure, mobile-first portal 
                    to handle everything without ever needing to call you.
                </p>
                <div className="mt-12 space-y-6">
                    <div className="flex gap-4">
                        <CheckCircle weight="fill" className="h-6 w-6 text-success shrink-0" />
                        <div>
                            <p className="font-bold text-navy text-lg">One-Click Payments</p>
                            <p className="text-muted-foreground">Tenants can save their payment methods and even set up Autopay to ensure they never miss a due date.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <CheckCircle weight="fill" className="h-6 w-6 text-success shrink-0" />
                        <div>
                            <p className="font-bold text-navy text-lg">Self-Service Requests</p>
                            <p className="text-muted-foreground">Maintenance issues are reported with photos and status tracking so tenants stay informed.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <CheckCircle weight="fill" className="h-6 w-6 text-success shrink-0" />
                        <div>
                            <p className="font-bold text-navy text-lg">Document Vault</p>
                            <p className="text-muted-foreground">Every tenant has access to their lease, insurance documents, and rent receipts in one secure place.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </MarketingShell>
  );
}
