import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingShell } from "@/components/keyhold/marketing-shell";
import { ArrowRight } from "@phosphor-icons/react";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Landlord Resources — Keyhold Blog" },
      { name: "description", content: "Expert advice on Ontario property management, RTA compliance, and tax optimization for landlords." },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h1 className="font-display text-4xl font-extrabold text-navy">Landlord Resources</h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            Guides, news, and insights to help you manage your properties more effectively in Canada.
        </p>

        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
                { 
                    title: "The Ultimate Guide to the Ontario Standard Lease", 
                    category: "Compliance", 
                    date: "Aug 12, 2026",
                    desc: "Everything you need to know about the mandatory OSL and what clauses you can (and can't) add."
                },
                { 
                    title: "How to Calculate Rent Increases in 2026", 
                    category: "Financials", 
                    date: "Aug 05, 2026",
                    desc: "A breakdown of the 2.5% guideline and how to serve an N1 notice correctly."
                },
                { 
                    title: "LTB Filing Guide for Self-Managing Landlords", 
                    category: "Guides", 
                    date: "Jul 28, 2026",
                    desc: "Step-by-step instructions for filing N4 and L1 applications via the LTB portal."
                },
            ].map(post => (
                <div key={post.title} className="group cursor-pointer flex flex-col">
                    <div className="aspect-[16/9] w-full rounded-3xl bg-navy-soft overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-navy/5 to-navy/20 group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="mt-6 flex items-center gap-3">
                        <span className="text-xs font-bold text-action uppercase tracking-widest">{post.category}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{post.date}</span>
                    </div>
                    <h3 className="mt-3 text-2xl font-extrabold text-navy group-hover:underline leading-tight">{post.title}</h3>
                    <p className="mt-4 text-muted-foreground text-sm flex-1 leading-relaxed">{post.desc}</p>
                    <div className="mt-6 flex items-center gap-2 text-sm font-bold text-navy">
                        Read more <ArrowRight weight="bold" />
                    </div>
                </div>
            ))}
        </div>
      </div>
    </MarketingShell>
  );
}
