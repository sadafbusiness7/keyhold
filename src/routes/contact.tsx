import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/keyhold/marketing-shell";
import { Envelope, ChatCircleDots, MapPin } from "@phosphor-icons/react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Keyhold" },
      { name: "description", content: "Need help? Get in touch with the Keyhold team. We're based in Hamilton, Ontario." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-16 lg:grid-cols-2">
            <div>
                <h1 className="font-display text-4xl font-extrabold text-navy">We're here to help.</h1>
                <p className="mt-6 text-lg text-muted-foreground">
                    Whether you're a landlord with a question or a tenant needing assistance, our team is ready to support you.
                </p>

                <div className="mt-12 space-y-8">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-soft text-navy shrink-0">
                            <Envelope weight="duotone" className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-bold text-navy">Email us</p>
                            <a href="mailto:hello@keyhold.ca" className="text-muted-foreground hover:text-action transition-colors">hello@keyhold.ca</a>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-soft text-navy shrink-0">
                            <ChatCircleDots weight="duotone" className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-bold text-navy">Live chat</p>
                            <p className="text-muted-foreground">Available Mon–Fri, 9am–5pm EST for premium users.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-soft text-navy shrink-0">
                            <MapPin weight="duotone" className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-bold text-navy">Headquarters</p>
                            <p className="text-muted-foreground">Hamilton, Ontario, Canada</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-soft p-10 bg-white shadow-xl shadow-navy/5">
                <h3 className="font-display text-2xl font-extrabold text-navy">Send a message</h3>
                <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Name</label>
                            <input type="text" className="w-full rounded-xl border border-border px-4 py-3 focus:border-action focus:ring-2 focus:ring-action/10" placeholder="Jane Doe" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</label>
                            <input type="email" className="w-full rounded-xl border border-border px-4 py-3 focus:border-action focus:ring-2 focus:ring-action/10" placeholder="jane@example.com" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Message</label>
                        <textarea rows={4} className="w-full rounded-xl border border-border px-4 py-3 focus:border-action focus:ring-2 focus:ring-action/10" placeholder="How can we help?" />
                    </div>
                    <button type="submit" className="w-full rounded-xl bg-navy py-4 font-bold text-white hover:bg-navy/90 transition-colors">Send message</button>
                </form>
            </div>
        </div>
      </div>
    </MarketingShell>
  );
}
