import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/keyhold/marketing-shell";
import { UsersThree, Heart, GlobeHemisphereWest, Sparkle } from "@phosphor-icons/react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Keyhold" },
      { name: "description", content: "Keyhold is built in Hamilton, ON for Canadian landlords who want to spend less time on paperwork and more time on what matters." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-action-soft text-action">
            <Sparkle weight="duotone" className="h-6 w-6" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-extrabold text-navy">Built by landlords, for landlords.</h1>
        <p className="mt-8 text-xl text-muted-foreground leading-relaxed">
            Managing property in Canada shouldn't require a degree in law or an addiction to spreadsheets. 
            We built Keyhold to give self-managing landlords the same power as professional management firms, 
            without the complexity or the cost.
        </p>

        <div className="mt-20 grid gap-12 text-left sm:grid-cols-3">
            <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white">
                    <GlobeHemisphereWest weight="duotone" className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-bold text-navy">Canadian First</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    We specialize in Canadian law, LTB forms, and CRA-ready reporting. No more US-centric tools.
                </p>
            </div>
            <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white">
                    <Heart weight="duotone" className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-bold text-navy">Calm UX</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Software should reduce stress, not create it. Every screen is designed for clarity and peace of mind.
                </p>
            </div>
            <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white">
                    <UsersThree weight="duotone" className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-bold text-navy">Community Driven</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Our roadmap is shaped by the landlords who use it. We build what you actually need.
                </p>
            </div>
        </div>

        <div className="mt-20 card-soft bg-surface-sunk p-10">
            <h2 className="font-display text-2xl font-extrabold text-navy">Based in Hamilton, Ontario</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
                We're a small, dedicated team building from the heart of Southern Ontario. 
                We understand the local market because we're part of it.
            </p>
        </div>
      </div>
    </MarketingShell>
  );
}
