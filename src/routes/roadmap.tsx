import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/keyhold/marketing-shell";
import { CheckCircle, Rocket, CalendarBlank } from "@phosphor-icons/react";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap & Changelog — Keyhold" },
      { name: "description", content: "See what we've shipped and what's coming next for Canadian property management." },
    ],
  }),
  component: RoadmapPage,
});

function RoadmapPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-4xl px-4 py-20">
        <h1 className="font-display text-4xl font-extrabold text-navy text-center">What's cooking at Keyhold</h1>
        <p className="mt-6 text-lg text-muted-foreground text-center max-w-2xl mx-auto">
          We're shipping new features every week. Here's a transparent look at where we've been and where we're headed.
        </p>

        <div className="mt-20 grid gap-12 lg:grid-cols-3">
          <section>
            <div className="flex items-center gap-2 font-bold text-success uppercase tracking-widest text-xs">
                <CheckCircle weight="bold" className="h-4 w-4" /> Shipped Recently
            </div>
            <div className="mt-6 space-y-4">
              <div className="card-soft p-5 border-l-4 border-l-success">
                <p className="font-bold text-navy">Online Rent Payments</p>
                <p className="mt-1 text-xs text-muted-foreground">Full Stripe & PAD integration.</p>
              </div>
              <div className="card-soft p-5 border-l-4 border-l-success">
                <p className="font-bold text-navy">OSL Generator</p>
                <p className="mt-1 text-xs text-muted-foreground">Automatic Ontario Standard Leases.</p>
              </div>
              <div className="card-soft p-5 border-l-4 border-l-success">
                <p className="font-bold text-navy">iCal Subscriptions</p>
                <p className="mt-1 text-xs text-muted-foreground">Sync to Google & Apple Calendar.</p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 font-bold text-action uppercase tracking-widest text-xs">
                <Rocket weight="bold" className="h-4 w-4" /> In Progress
            </div>
            <div className="mt-6 space-y-4">
              <div className="card-soft p-5 border-l-4 border-l-action">
                <p className="font-bold text-navy">T776 Tax Engine</p>
                <p className="mt-1 text-xs text-muted-foreground">Automatic tax-ready PDF exports.</p>
              </div>
              <div className="card-soft p-5 border-l-4 border-l-action">
                <p className="font-bold text-navy">Bulk Doc Sharing</p>
                <p className="mt-1 text-xs text-muted-foreground">Share docs with all tenants at once.</p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 font-bold text-muted-foreground uppercase tracking-widest text-xs">
                <CalendarBlank weight="bold" className="h-4 w-4" /> Next Up
            </div>
            <div className="mt-6 space-y-4">
              <div className="card-soft p-5">
                <p className="font-bold text-navy">BC & AB Compliance</p>
                <p className="mt-1 text-xs text-muted-foreground">Dedicated forms for western provinces.</p>
              </div>
              <div className="card-soft p-5">
                <p className="font-bold text-navy">Mobile App (Beta)</p>
                <p className="mt-1 text-xs text-muted-foreground">Native iOS and Android notifications.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MarketingShell>
  );
}
