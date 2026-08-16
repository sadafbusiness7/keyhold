import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/keyhold/marketing-shell";
import { FileText, CheckCircle, SealCheck, Gavel } from "@phosphor-icons/react";

export const Route = createFileRoute("/features/leases")({
  head: () => ({
    meta: [
      { title: "Ontario Leases & LTB Forms — Keyhold" },
      { name: "description", content: "Native support for the Ontario Standard Lease and LTB forms. Automatic generation, legal compliance, and notice period calculations." },
    ],
  }),
  component: LeasesFeaturePage,
});

function LeasesFeaturePage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success-soft text-success">
                    <FileText weight="duotone" className="h-6 w-6" />
                </div>
                <h1 className="mt-6 font-display text-5xl font-extrabold text-navy leading-tight">Compliance, <br /><span className="text-success">simplified.</span></h1>
                <p className="mt-8 text-xl text-muted-foreground leading-relaxed">
                    The Residential Tenancies Act (RTA) is complex. Keyhold makes compliance effortless by providing 
                    native, pre-filled Ontario Standard Leases and every LTB form you'll ever need.
                </p>
                <div className="mt-12 space-y-6">
                    <div className="flex gap-4">
                        <CheckCircle weight="fill" className="h-6 w-6 text-success shrink-0" />
                        <div>
                            <p className="font-bold text-navy text-lg">Ontario Standard Lease (OSL)</p>
                            <p className="text-muted-foreground">Generate the mandatory 2026 OSL in seconds with your unit and tenant data pre-filled.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <CheckCircle weight="fill" className="h-6 w-6 text-success shrink-0" />
                        <div>
                            <p className="font-bold text-navy text-lg">LTB Notice Engine</p>
                            <p className="text-muted-foreground">Automatically calculate termination dates and serving requirements for N1, N4, N11, and N12 forms.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <CheckCircle weight="fill" className="h-6 w-6 text-success shrink-0" />
                        <div>
                            <p className="font-bold text-navy text-lg">Digital Signing</p>
                            <p className="text-muted-foreground">Send leases and amendments for secure digital signature directly within Keyhold.</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="card-soft p-1 bg-surface-sunk overflow-hidden border-2 border-border shadow-2xl relative">
                <div className="absolute top-6 right-6 z-10">
                    <div className="flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-white shadow-lg">
                        <SealCheck weight="fill" className="h-4 w-4 text-success" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">LTB Compliant</span>
                    </div>
                </div>
                <div className="bg-white p-8 space-y-6 opacity-80">
                    <div className="h-8 w-1/2 rounded-md bg-navy-soft" />
                    <div className="space-y-3">
                        <div className="h-3 w-full rounded-full bg-surface-sunk" />
                        <div className="h-3 w-5/6 rounded-full bg-surface-sunk" />
                        <div className="h-3 w-4/6 rounded-full bg-surface-sunk" />
                    </div>
                    <div className="card-soft border border-dashed p-4">
                        <div className="flex justify-between items-center text-xs font-bold text-navy uppercase tracking-widest mb-2">
                            <span>Clause 10: Pets</span>
                            <Gavel className="text-action" />
                        </div>
                        <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                            "The landlord cannot prohibit pets... A provision in a tenancy agreement prohibiting the presence of animals in or about the residential complex is void."
                        </p>
                    </div>
                    <div className="pt-8 grid grid-cols-2 gap-4">
                        <div className="h-10 rounded-xl bg-navy-soft" />
                        <div className="h-10 rounded-xl bg-navy-soft" />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </MarketingShell>
  );
}
