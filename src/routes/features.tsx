import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/keyhold/marketing-shell";
import { 
  CurrencyDollar, 
  Wrench, 
  FileText, 
  Monitor, 
  ChartBar, 
  ArrowRight,
  ShieldCheck,
  TrendUp,
  Files
} from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
const Lottie = (props: any) => null;

// Placeholder Lottie animations - in a real app these would be local JSON files
const lottieUrls = {
  money: "https://assets9.lottiefiles.com/packages/lf20_ygiqavvw.json",
  tools: "https://assets2.lottiefiles.com/packages/lf20_w51pcehl.json",
  docs: "https://assets8.lottiefiles.com/packages/lf20_49rpk5pv.json",
  portal: "https://assets5.lottiefiles.com/packages/lf20_aljrkqsc.json",
  chart: "https://assets1.lottiefiles.com/packages/lf20_qp1q7mct.json",
};

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Keyhold" },
      { name: "description", content: "Everything you need to manage your rentals calmly. Rent tracking, maintenance, leases, and reporting." },
      { property: "og:title", content: "Keyhold Features - Built for Canadian Landlords" },
      { property: "og:image", content: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200" }
    ],
  }),
  component: FeaturesOverviewPage,
});

interface FeatureDetail {
  id: string;
  icon: any;
  label: string;
  href: string;
  desc: string;
  longDesc: string;
  lottie: string;
  image: string;
  color: string;
  benefits: string[];
}

const featureDetails: FeatureDetail[] = [
  {
    id: "rent",
    icon: CurrencyDollar,
    label: "Rent Tracking",
    href: "/features/rent",
    desc: "Automated receipts and overdue tracking.",
    longDesc: "Keyhold automates the most stressful part of landlording. From bank-synced payments to automated overdue notices, you'll never have to manually check who paid again. Our system handles partial payments, late fees, and generates professional receipts automatically.",
    lottie: lottieUrls.money,
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1000",
    color: "bg-emerald-500",
    benefits: ["Auto-matching payments", "Automated late notices", "Bank-grade security", "Arrears management"]
  },
  {
    id: "maintenance",
    icon: Wrench,
    label: "Maintenance",
    href: "/features/maintenance",
    desc: "Tenant portal for repair requests.",
    longDesc: "Stop receiving maintenance texts at 2 AM. Tenants submit requests via their portal with photos and priority levels. You can assign vendors, track costs, and keep tenants updated automatically. Every repair is logged for your tax records and property history.",
    lottie: lottieUrls.tools,
    image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=1000",
    color: "bg-blue-500",
    benefits: ["Tenant photo uploads", "Vendor coordination", "Cost tracking", "Recurring inspections"]
  },
  {
    id: "leases",
    icon: FileText,
    label: "Leases & Canadian Forms",
    href: "/features/leases",
    desc: "Provincial standard leases and LTB forms.",
    longDesc: "Stay compliant without the legal fees. We provide the Ontario Standard Lease and equivalents for other provinces, pre-filled with your data. Need to serve an N1 or N4? Generate, sign, and serve them digitally with a full audit trail.",
    lottie: lottieUrls.docs,
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1000",
    color: "bg-maple",
    benefits: ["Ontario Standard Lease", "LTB/RTB form library", "Digital signing", "Automated renewals"]
  },
  {
    id: "portal",
    icon: Monitor,
    label: "Tenant Portal",
    href: "/features/portal",
    desc: "A clean interface for your tenants.",
    longDesc: "Give your tenants a professional experience. The mobile-friendly portal lets them pay rent, download documents, report issues, and view their lease. A happy tenant stays longer and takes better care of your property.",
    lottie: lottieUrls.portal,
    image: "https://images.unsplash.com/photo-1551288049-bbda38a5f97f?auto=format&fit=crop&q=80&w=1000",
    color: "bg-indigo-500",
    benefits: ["Mobile-first design", "Self-service payments", "Document vault", "Announcement board"]
  },
  {
    id: "reports",
    icon: ChartBar,
    label: "Reporting & T776",
    href: "/features/reports",
    desc: "Tax-ready records for your accountant.",
    longDesc: "Tax season shouldn't be a nightmare. Keyhold categorizes every expense and income line. When it's time to file, generate a T776-ready package in one click. See your ROI, cap rates, and cash flow trends in real-time.",
    lottie: lottieUrls.chart,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000",
    color: "bg-orange-500",
    benefits: ["One-click T776 exports", "Cash flow analysis", "Expense categorization", "Portfolio ROI charts"]
  }
];

function FeaturesOverviewPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <MarketingShell>
      <div className="relative bg-surface" ref={containerRef}>
        {/* Hero Section */}
        <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="z-10 max-w-4xl"
          >
            <span className="inline-block rounded-full bg-navy/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-navy">
              Platform Overview
            </span>
            <h1 className="mt-8 font-display text-5xl font-extrabold tracking-tight text-navy sm:text-7xl">
              Professional tools for the <span className="text-action underline decoration-action/20 underline-offset-8">independent</span> landlord.
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-xl text-muted-foreground leading-relaxed">
              We've automated the repetitive, secured the legal, and simplified the financial. 
              Everything you need to manage 2–20 units with professional confidence.
            </p>
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Link to="/signup" className="inline-flex min-h-14 items-center rounded-full bg-navy px-8 text-lg font-bold text-white shadow-xl shadow-navy/20 transition-transform hover:scale-105 active:scale-95">
                Start for free
              </Link>
              <a href="#details" className="inline-flex min-h-14 items-center rounded-full border border-navy/10 bg-white px-8 text-lg font-bold text-navy hover:bg-navy-soft">
                Explore features
              </a>
            </div>
          </motion.div>
          
          {/* Abstract background shapes */}
          <div className="absolute inset-0 -z-0 pointer-events-none">
            <div className="absolute -top-[10%] -left-[10%] h-[50%] w-[50%] rounded-full bg-action/5 blur-3xl" />
            <div className="absolute top-[40%] -right-[10%] h-[60%] w-[50%] rounded-full bg-navy/5 blur-3xl" />
          </div>
        </section>

        {/* Feature Detail Sections */}
        <div id="details" className="relative space-y-0">
          {featureDetails.map((feature, index) => (
            <FeatureSection key={feature.id} feature={feature} index={index} />
          ))}
        </div>

        {/* Final CTA */}
        <section className="bg-navy py-32 text-center text-primary-foreground">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="font-display text-4xl font-extrabold sm:text-5xl">Ready to get your time back?</h2>
            <p className="mt-6 text-xl text-primary-foreground/70">
              Join landlords across Canada who upgraded from spreadsheets to Keyhold.
            </p>
            <div className="mt-12">
              <Link to="/signup" className="inline-flex min-h-16 items-center rounded-full bg-action px-12 text-xl font-extrabold text-white shadow-2xl shadow-black/20 transition-all hover:scale-105 hover:bg-action/90 active:scale-95">
                Build your portfolio now
              </Link>
            </div>
            <p className="mt-8 text-sm text-primary-foreground/50">
              No credit card required · 14-day full access demo
            </p>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}

function FeatureSection({ feature, index }: { feature: FeatureDetail; index: number }) {
  const isEven = index % 2 === 0;
  
  return (
    <section className="relative min-h-screen py-24 lg:py-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`grid items-center gap-16 lg:min-h-screen lg:grid-cols-2 ${!isEven ? 'lg:direction-rtl' : ''}`}>
          
          {/* Content Side */}
          <motion.div 
            initial={{ opacity: 0, x: isEven ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`flex flex-col justify-center ${!isEven ? 'lg:order-2' : ''}`}
          >
            <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color} text-white shadow-lg`}>
              <feature.icon weight="duotone" className="h-8 w-8" />
            </div>
            <h2 className="mt-8 font-display text-4xl font-extrabold text-navy sm:text-5xl">
              {feature.label}
            </h2>
            <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
              {feature.longDesc}
            </p>
            
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {feature.benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-sm font-semibold text-navy">
                  <ShieldCheck weight="fill" className="h-5 w-5 text-action" />
                  {benefit}
                </li>
              ))}
            </ul>
            
            <div className="mt-12">
              <Link 
                to={feature.href as any}
                className="group inline-flex items-center gap-2 text-lg font-bold text-action hover:underline"
              >
                Deep dive into {feature.label.toLowerCase()}
                <ArrowRight weight="bold" className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          {/* Visual Side */}
          <div className={`relative h-[400px] w-full lg:h-[600px] ${!isEven ? 'lg:order-1' : ''}`}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1 }}
              className="relative h-full w-full"
            >
              {/* Screenshot Frame */}
              <div className="absolute inset-0 z-10 overflow-hidden rounded-3xl border border-navy/5 bg-white shadow-2xl">
                <img 
                  src={feature.image} 
                  alt={feature.label}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/40 to-transparent" />
              </div>
              
              {/* Lottie Overlay */}
              <div className="absolute -bottom-10 -right-10 z-20 h-48 w-48 rounded-full bg-white p-4 shadow-xl lg:-bottom-12 lg:-right-12 lg:h-64 lg:w-64">
                <Lottie 
                  animationData={{ 
                    v: "5.5.7",
                    fr: 30,
                    ip: 0,
                    op: 60,
                    w: 500,
                    h: 500,
                    nm: "Placeholder",
                    ddd: 0,
                    assets: [],
                    layers: [] // Real apps would pass the JSON here
                  }} 
                  loop={true} 
                  className="h-full w-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <feature.icon weight="duotone" className="h-16 w-16 text-action opacity-20" />
                </div>
              </div>

              {/* Decorative Blobs */}
              <div className={`absolute -inset-4 -z-10 rounded-[40px] ${feature.color} opacity-10 blur-2xl`} />
            </motion.div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
