import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/keyhold/marketing-shell";
import { Wrench, CheckCircle, WarningCircle, UserFocus } from "@phosphor-icons/react";

export const Route = createFileRoute("/features/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance & Repair Tracking — Keyhold" },
      { name: "description", content: "Stay on top of repairs. Tenant requests, photo uploads, and maintenance history all in one place." },
    ],
  }),
  component: MaintenanceFeaturePage,
});

function MaintenanceFeaturePage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div className="order-2 lg:order-1 card-soft p-1 bg-surface-sunk overflow-hidden border-2 border-border shadow-2xl">
                <div className="bg-white p-8 space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <h4 className="font-bold text-navy">Open Requests</h4>
                        <span className="text-xs font-bold text-action bg-action-soft px-2 py-1 rounded-full uppercase tracking-tighter">2 New</span>
                    </div>
                    <div className="space-y-4">
                        <div className="card-soft p-4 border-l-4 border-l-warning">
                            <p className="text-xs font-bold text-muted-foreground uppercase">Unit 202 • Leaky Sink</p>
                            <p className="mt-1 text-sm font-bold text-navy italic">"Water is pooling under the cabinet since this morning."</p>
                            <div className="mt-3 flex gap-2">
                                <div className="h-10 w-10 rounded-md bg-navy-soft" />
                                <div className="h-10 w-10 rounded-md bg-navy-soft" />
                            </div>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-border text-center text-xs">
                        <span className="text-action font-bold">Launch Maintenance Triage →</span>
                    </div>
                </div>
            </div>

            <div className="order-1 lg:order-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning-soft text-warning">
                    <Wrench weight="duotone" className="h-6 w-6" />
                </div>
                <h1 className="mt-6 font-display text-5xl font-extrabold text-navy leading-tight">Repairs handled with <span className="text-warning">calm.</span></h1>
                <p className="mt-8 text-xl text-muted-foreground leading-relaxed">
                    No more late-night texts about dripping faucets. Tenants submit requests through their portal with photos, 
                    allowing you to triage issues before sending a contractor.
                </p>
                <div className="mt-12 space-y-6">
                    <div className="flex gap-4">
                        <CheckCircle weight="fill" className="h-6 w-6 text-success shrink-0" />
                        <div>
                            <p className="font-bold text-navy text-lg">Integrated Chat</p>
                            <p className="text-muted-foreground">Keep all maintenance communication tied to the specific request, not your personal SMS.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <CheckCircle weight="fill" className="h-6 w-6 text-success shrink-0" />
                        <div>
                            <p className="font-bold text-navy text-lg">Photo Documentation</p>
                            <p className="text-muted-foreground">Tenants upload evidence, providing you with a clear maintenance history for every unit.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <CheckCircle weight="fill" className="h-6 w-6 text-success shrink-0" />
                        <div>
                            <p className="font-bold text-navy text-lg">Work Order Tracking</p>
                            <p className="text-muted-foreground">Assign tasks, track completion dates, and store invoices for tax season.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </MarketingShell>
  );
}
