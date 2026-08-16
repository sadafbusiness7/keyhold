import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import {
  CheckCircle,
  WarningOctagon,
  Wrench,
  FileText,
  CalendarBlank,
  ArrowRight,
  ArrowUpRight,
  Receipt,
  CurrencyDollar,
  ChatCircleDots,
  Buildings,
  ChatCircleText,
  Key,
  CaretDown,
  Sun,
  Moon,
  ShieldCheck,
  Scales,
  Lock,
  CreditCard,
  Detective,
  Calculator,
  Wheelchair,
  Quotes,
  Star,
} from "@phosphor-icons/react";
import p1 from "@/assets/people/p1.jpg";
import p2 from "@/assets/people/p2.jpg";
import p3 from "@/assets/people/p3.jpg";
import p4 from "@/assets/people/p4.jpg";
import { AskKeyhold } from "@/components/keyhold/ask-keyhold";
import { RevealPanel, CountUp, useSmoothScroll } from "@/components/keyhold/scroll-story";
import { LazyLottie } from "@/components/keyhold/lazy-lottie";
import { ScrollDeck, TiltCard } from "@/components/keyhold/showcase";
import { PricingCalculator } from "@/components/keyhold/pricing-calculator";
import { FeatureShowcase, FeatureMenuPanel, featureMenu } from "@/components/keyhold/home-features";





import { cad } from "@/lib/mock-data";
import { useTheme } from "@/lib/theme";
import { ThemeToggleButton } from "@/components/keyhold/appearance-menu";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Keyhold — Rental management built for Canadian landlords" },
      {
        name: "description",
        content:
          "Keyhold is calm rental software for Canadian landlords with 2–20 units. See who paid, what's overdue and what needs repair. CA$4.99/month.",
      },
      { property: "og:title", content: "Keyhold — Rental management built for Canadian landlords" },
      {
        property: "og:description",
        content: "Keyhold is calm rental software for Canadian landlords with 2–20 units. See who paid, what's overdue and what needs repair. CA$4.99/month.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

/* ---------------------------------- data --------------------------------- */

const navLinks = [
  { label: "What it answers", href: "#answers" },
  { label: "A look inside", href: "#showcase" },
  { label: "Pricing", href: "#pricing" },
];

/** Shown in the top bar only — the docked pill has no room for these. */
const topOnlyLinks = [
  { label: "Reviews", href: "#reviews" },
  { label: "About", href: "#about" },
];

const testimonials = [
  {
    quote:
      "I run six units in Hamilton and used to keep everything in a binder and three spreadsheets. First month on Keyhold I caught a late payment I would have missed entirely. I genuinely love it.",
    name: "Danielle Rousseau",
    role: "6 units · Hamilton, ON",
    avatar: p1,
    tone: "success" as const,
  },
  {
    quote:
      "The Ontario Standard Lease and N4 forms alone paid for the year. My tenants get their receipts without emailing me at 11pm. Best CA$4.99 I spend each month.",
    name: "Ravi Balakrishnan",
    role: "11 units · Mississauga, ON",
    avatar: p2,
    tone: "action" as const,
  },
  {
    quote:
      "I switched from a US property tool that had no idea what an LTB filing was. Keyhold is built for how we actually rent in Canada. My accountant was thrilled with the QuickBooks export.",
    name: "Adaeze Nwosu",
    role: "4 units · Ottawa, ON",
    avatar: p3,
    tone: "maple" as const,
  },
  {
    quote:
      "Sixty-one years old and I set the whole thing up on a Sunday afternoon. Maintenance requests come in with photos now instead of a voicemail I can't hear properly. Absolutely love it.",
    name: "Gordon Whyte",
    role: "8 units · Winnipeg, MB",
    avatar: p4,
    tone: "warning" as const,
  },
];

const badges: { Icon: React.ComponentType<any>; label: string; note: string; tone: keyof typeof tintVar }[] = [
  { Icon: ShieldCheck, label: "PIPEDA compliant", note: "Canadian privacy law", tone: "success" },
  { Icon: Scales, label: "LTB current forms", note: "N4, N9, N12 & more", tone: "navy" },
  { Icon: FileText, label: "Ontario Standard Lease", note: "Latest ministry version", tone: "action" },
  { Icon: Lock, label: "Data stored in Canada", note: "Encrypted at rest", tone: "maple" },
  { Icon: CreditCard, label: "Stripe payments", note: "Card & PAD, PCI-DSS", tone: "action" },
  { Icon: Detective, label: "SingleKey screening", note: "Canadian tenant reports", tone: "warning" },
  { Icon: Calculator, label: "QuickBooks export", note: "Clean bookkeeping", tone: "success" },
  { Icon: Wheelchair, label: "AODA / WCAG 2.1 AA", note: "Accessible by design", tone: "navy" },
];



const previewRows = [
  { name: "Marie Tremblay", place: "412 Lansdowne Ave · Main floor", amount: 2350, tone: "success" as const, state: "Paid" },
  { name: "Dev Sharma", place: "412 Lansdowne Ave · Basement suite", amount: 1575, tone: "success" as const, state: "Paid" },
  { name: "Grace Okafor", place: "88 Ottawa St N · Unit A", amount: 1895, tone: "maple" as const, state: "Overdue" },
  { name: "Liam Byrne", place: "14 Rosewell Cres", amount: 2100, tone: "warning" as const, state: "Due soon" },
];

const answers = [
  { Icon: CheckCircle, title: "Who paid", body: "Every payment for the month in one list, with the date and method." },
  { Icon: WarningOctagon, title: "What's overdue", body: "Late balances surface first, with the amount owed spelled out." },
  { Icon: Wrench, title: "What needs repair", body: "Repairs sorted by urgency so the furnace never waits behind a light bulb." },
  { Icon: FileText, title: "Which lease expires next", body: "Renewal dates in plain language, early enough to act on." },
  { Icon: CalendarBlank, title: "What's happening this week", body: "Inspections, move-ins and rent dates on one calm calendar." },
];

const assistantSteps = [
  {
    title: "Ask it anything",
    body: "Type the question the way you'd say it out loud.",
    points: ["\u201cWho hasn't paid this month?\u201d", "\u201cWhat's my rent roll?\u201d", "\u201cWhen does Priya's lease end?\u201d"],
  },
  {
    title: "It helps you act",
    body: "It turns the answer into the next step, filled in with your own records.",
    points: ["Records a payment against the right unit", "Drafts a renewal for you to read", "Prepares official forms with your details"],
  },
  {
    title: "You stay in control",
    body: "Nothing sensitive happens on its own.",
    points: [
      "Sensitive actions need your confirmation",
      "Nothing irreversible without your click",
      "Never makes eviction or screening decisions",
    ],
  },
];

const assistantStats: { headline: string; body: string; invert?: boolean }[] = [
  {
    headline: "Minutes, not hours",
    body: "Prepare an Ontario lease with AI assist — you review each section before it's final.",
  },
  {
    headline: "Less manual filing",
    body: "The assistant sorts receipts, leases and notices into the right unit so you stop hunting through email.",
    invert: true,
  },
  {
    headline: "Official forms",
    body: "Always the current LTB version, filled from your records and held for your review before anything is sent.",
  },
];

const bentoItems: {
  Icon: React.ComponentType<any>;
  title: string;
  body: string;
  wide?: boolean;
}[] = [
  {
    Icon: FileText,
    title: "Leases & Ontario forms",
    body: "AI-assisted official LTB forms and Ontario Standard Leases, signed electronically after your review.",
  },
  {
    Icon: CurrencyDollar,
    title: "Rent & payments",
    body: "Track what's paid and what's overdue, send reminders, and collect online through Stripe.",
  },
  {
    Icon: Wrench,
    title: "Maintenance & tenant portal",
    body: "Tenants send requests with photos from their phone and follow the status without calling you.",
  },
  {
    Icon: Buildings,
    wide: true,
    title: "Multi-property & teams",
    body: "From two units to 250, with roles for your team and plain reporting for owners.",
  },
];

function BentoCard({
  Icon,
  title,
  body,
  className,
  children,
}: {
  Icon: React.ComponentType<{ weight?: "duotone"; className?: string; "aria-hidden"?: boolean }>;
  title: string;
  body: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`card-soft relative min-w-0 p-6 ${className ?? ""}`}>
      <ArrowUpRight
        weight="duotone"
        className="absolute right-5 top-5 h-5 w-5 text-muted-foreground"
        aria-hidden="true"
      />
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy-soft text-navy">
        <Icon weight="duotone" className="h-6 w-6" aria-hidden={true} />
      </span>
      <p className="mt-4 pr-8 font-display text-lg font-bold text-navy">{title}</p>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{body}</p>
      {children}
    </div>
  );
}

/* -------------------------------- fragments ------------------------------- */

const toneRail: Record<string, string> = {
  success: "bg-success",
  maple: "bg-maple",
  warning: "bg-warning",
  action: "bg-action",
  navy: "bg-navy",
};
/* Signature status tag — squared pill, tone bar, tracked-out label. */
const tintVar: Record<string, string> = {
  success: "var(--success)",
  maple: "var(--maple)",
  warning: "var(--warning)",
  action: "var(--action)",
  navy: "var(--navy)",
};

function Tag({
  tone = "navy",
  children,
  className = "",
}: {
  tone?: keyof typeof tintVar;
  children: React.ReactNode;
  className?: string;
}) {
  const color = tintVar[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10.5px] font-bold tracking-tight shadow-sm border-none ${className}`} style={{ color: `color-mix(in oklch, ${color} 85%, var(--foreground))`, background: `color-mix(in oklch, ${color} 12%, var(--card))` } as React.CSSProperties}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}

function RentRowCard({ row }: { row: (typeof previewRows)[number] }) {
  return (
    <li className="card-tint relative overflow-hidden p-3 pl-4" style={{ "--tint": tintVar[row.tone] } as React.CSSProperties}>
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${toneRail[row.tone]}`} />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-navy">{row.name}</p>
          <p className="truncate text-xs text-muted-foreground">{row.place}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="money text-sm font-extrabold text-navy">{cad(row.amount)}</p>
          <Tag tone={row.tone} className="mt-1">{row.state}</Tag>
        </div>
      </div>
    </li>
  );
}

function HeroCard({
  title,
  sub,
  tone = "navy",
  children,
}: {
  title: string;
  sub: string;
  tone?: "navy" | "action" | "success" | "maple" | "warning";
  children: React.ReactNode;
}) {
  const solidClass = {
    navy: "card-solid-navy",
    action: "card-solid-action",
    success: "card-solid-success",
    maple: "card-solid-maple",
    warning: "card-solid-warning",
  }[tone];

  return (
    <div className={`${solidClass} min-w-0 p-5 sm:p-6 transition-transform hover:scale-[1.02] duration-500`}>
      <p className="font-display text-sm font-bold text-navy">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function CollectedCard() {
  return (
    <HeroCard title="Collected this month" sub="August 2026 · 6 units" tone="success">
      <div className="absolute -right-2 -top-2 h-16 w-16 opacity-20 group-hover:opacity-40 transition-opacity">
        <LazyLottie getData={() => import("@/assets/lottie/success-check.json")} loop />
      </div>
      <CountUp value={6025} format={cad} className="money text-3xl font-extrabold text-navy" />
      <p className="mt-1 text-xs text-muted-foreground tnum">of {cad(7920)} expected · up from {cad(5480)} in July</p>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2">
        <LazyLottie getData={() => import("@/assets/lottie/success-check.json")} className="h-7 w-7 shrink-0" />
        <span className="text-xs font-semibold text-success">July finished at 100% collected</span>
      </div>

      <svg viewBox="0 0 240 72" className="mt-4 h-20 w-full" role="img" aria-label="Rent collected trending up over six months">
        <defs>
          <linearGradient id="kh-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--success)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--success)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 58 L48 50 L96 54 L144 34 L192 26 L240 12 L240 72 L0 72 Z" fill="url(#kh-area)" />
        <path
          d="M0 58 L48 50 L96 54 L144 34 L192 26 L240 12"
          fill="none"
          stroke="var(--success)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="240" cy="12" r="4.5" fill="var(--success)" />
      </svg>
    </HeroCard>
  );
}

const sources = [
  { label: "Stripe", note: "Card & pre-authorized debit" },
  { label: "SingleKey", note: "Tenant screening" },
  { label: "QuickBooks", note: "Bookkeeping export" },
];

function SourcesCard() {
  return (
    <HeroCard title="Connect your sources" sub="Bring in what you already use" tone="warning">
      <ul className="space-y-2.5">
        {sources.map((s, idx) => (
          <li
            key={s.label}
            className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/40 bg-card/60 px-3 py-2.5 backdrop-blur-sm"
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning font-display text-xs font-extrabold text-white">
              {s.label.slice(0, 2)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-navy">{s.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{s.note}</span>
            </span>
          </li>
        ))}
      </ul>
    </HeroCard>
  );
}

const askChips = ["Who hasn't paid this month?", "Prepare Priya's renewal", "What's my rent roll?"];

function AskCard() {
  return (
    <HeroCard title="Ask Keyhold" sub="Plain questions, plain answers" tone="action">
      <div className="absolute -right-4 -top-4 h-20 w-20 opacity-10 group-hover:opacity-25 transition-opacity pointer-events-none">
        <LazyLottie getData={() => import("@/assets/lottie/hero-spark.json")} loop />
      </div>
      <div className="flex flex-wrap gap-2">
        {askChips.map((q) => (
          <span
            key={q}
            className="rounded-full border border-action/20 bg-action/10 px-3 py-2 text-xs font-medium text-navy"
          >
            {q}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-action-soft px-3 py-2.5 text-xs font-medium text-action border border-action/10">
        <ChatCircleDots weight="duotone" className="h-4 w-4 shrink-0" aria-hidden="true" />
        Answers use only your own Keyhold records.
      </div>
    </HeroCard>
  );
}


function FeatureBlock({
  eyebrow,
  title,
  body,
  points,
  reverse,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  reverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
      <div className={`min-w-0 ${reverse ? "lg:order-2" : ""}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">{eyebrow}</p>
        <h3 className="mt-3 font-display text-2xl font-extrabold text-navy sm:text-3xl">{title}</h3>
        <p className="mt-3 max-w-prose text-base leading-relaxed text-muted-foreground">{body}</p>
        <ul className="mt-5 space-y-2.5">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-sm text-foreground">
              <CheckCircle weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className={`min-w-0 ${reverse ? "lg:order-1" : ""}`}>{children}</div>
    </div>
  );
}

function ScreenshotCard({
  title,
  stat,
  tone,
  children,
}: {
  title: string;
  stat?: React.ReactNode;
  tone?: keyof typeof tintVar;
  children: React.ReactNode;
}) {
  const t = tintVar[tone ?? "action"];
  return (
    <RevealPanel>
      <TiltCard>
        <div className="shine-sweep min-w-0 overflow-hidden rounded-[22px] border border-border shadow-xl">
          <div className="flex items-center gap-2 bg-navy px-4 py-2.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-maple/70" />
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-warning/70" />
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-success/70" />
            <p className="ml-2 truncate font-display text-xs font-bold text-primary-foreground sm:text-sm">{title}</p>
          </div>
          <div
            className="p-4 sm:p-5"
            style={{
              backgroundImage: `linear-gradient(160deg, color-mix(in oklab, ${t} 14%, var(--card)) 0%, color-mix(in oklab, ${t} 5%, var(--card)) 45%, var(--surface-sunk) 100%)`,
            }}
          >
            {children}
            {stat ? <div className="mt-4 border-t border-border pt-4">{stat}</div> : null}
          </div>
        </div>
      </TiltCard>
    </RevealPanel>
  );
}


/* --------------------------- scroll showcase ------------------------------ */

/** Browser-style frame used for every dashboard shot in the deck. */
function ShotFrame({
  title,
  tone = "navy",
  children,
}: {
  title: string;
  tone?: keyof typeof tintVar;
  children: React.ReactNode;
}) {
  const t = tintVar[tone];
  return (
    <div className="shine-sweep relative z-10 mx-auto w-full max-w-3xl overflow-hidden rounded-[22px] border border-border shadow-xl">
      <div className="flex items-center gap-2 bg-navy px-4 py-2.5">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-maple/70" />
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <p className="ml-2 truncate font-display text-xs font-bold text-primary-foreground sm:text-sm">{title}</p>
      </div>
      <div
        className="p-4 sm:p-5"
        style={{
          backgroundImage: `linear-gradient(160deg, color-mix(in oklab, ${t} 14%, var(--card)) 0%, color-mix(in oklab, ${t} 5%, var(--card)) 45%, var(--surface-sunk) 100%)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}


/** A deck slide: the dashboard shot plus a short, readable caption beside it. */
function Slide({
  eyebrow,
  title,
  body,
  tone,
  lottie,
  frameTitle,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  tone: keyof typeof tintVar;
  lottie: () => Promise<any>;
  frameTitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-10">
      <div className="min-w-0 text-center lg:text-left">
        <div className="flex items-center justify-center gap-3 lg:justify-start">
          <LazyLottie getData={lottie} className="h-10 w-10 shrink-0 sm:h-12 sm:w-12" loop />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">{eyebrow}</p>
        </div>
        <h3 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground lg:mx-0">{body}</p>
      </div>
      <div className="min-w-0">
        <ShotFrame title={frameTitle} tone={tone}>
          {children}
        </ShotFrame>
      </div>
    </div>
  );
}

const successLottie = () => import("@/assets/lottie/success-check.json");
const pulseLottie = () => import("@/assets/lottie/cta-pulse.json");
const sparkLottie = () => import("@/assets/lottie/hero-spark.json");

function MiniStat({ label, value, tone }: { label: string; value: React.ReactNode; tone: keyof typeof tintVar }) {
  return (
    <div className="card-tint p-3" style={{ "--tint": tintVar[tone] } as React.CSSProperties}>
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      <p className="money mt-1 text-lg font-extrabold text-navy sm:text-xl">{value}</p>
    </div>
  );
}

function RowLine({
  title,
  sub,
  tone,
  state,
  right,
}: {
  title: string;
  sub: string;
  tone: keyof typeof tintVar;
  state?: string;
  right?: string;
}) {
  return (
    <li className="relative overflow-hidden rounded-xl border border-border bg-card p-3 pl-4">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${toneRail[tone] ?? "bg-action"}`} />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-navy">{title}</p>
          <p className="truncate text-[11px] text-muted-foreground">{sub}</p>
        </div>
        <div className="shrink-0 text-right">
          {right ? <p className="money text-sm font-extrabold text-navy">{right}</p> : null}
          {state ? <Tag tone={tone} className="mt-1">{state}</Tag> : null}
        </div>
      </div>
    </li>
  );
}

const deckSlides = [
  {
    key: "rent",
    label: "Rent",
    node: (
      <Slide
        eyebrow="Rent"
        title="Your whole month, on one calm screen."
        body="Collected, expected and still owed — updated the moment a payment lands."
        tone="success"
        lottie={successLottie}
        frameTitle="Dashboard — August 2026"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <MiniStat label="Collected" value={<CountUp value={6025} format={(n) => cad(n)} />} tone="success" />
          <MiniStat label="Expected" value={cad(7920)} tone="navy" />
          <MiniStat label="Still owed" value={cad(1895)} tone="maple" />
        </div>
        <ul className="mt-4 space-y-2">
          {previewRows.slice(0, 3).map((r) => (
            <RentRowCard key={r.name} row={r} />
          ))}
        </ul>
      </Slide>
    ),
  },
  {
    key: "repairs",
    label: "Repairs",
    node: (
      <Slide
        eyebrow="Repairs"
        title="Every repair, sorted by urgency."
        body="The furnace never waits behind a light bulb. Contractors pinged automatically."
        tone="maple"
        lottie={pulseLottie}
        frameTitle="Maintenance board"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { title: "Emergency", tone: "maple" as const, items: [{ t: "No heat — furnace", s: "88 Ottawa St N · Unit A" }] },
            {
              title: "Being fixed",
              tone: "action" as const,
              items: [
                { t: "Kitchen tap dripping", s: "412 Lansdowne · Main" },
                { t: "Garage door sensor", s: "14 Rosewell Cres" },
              ],
            },
            { title: "Resolved", tone: "success" as const, items: [{ t: "Front door lock", s: "14 Rosewell Cres" }] },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-2xl p-3"
              style={{ "--tint": tintVar[c.tone], background: "color-mix(in oklab, var(--tint) 9%, var(--card))" } as React.CSSProperties}
            >
              <div className="flex items-center justify-between gap-2">
                <Tag tone={c.tone}>{c.title}</Tag>
                <span className="money text-xs font-extrabold text-navy tnum">{c.items.length}</span>
              </div>
              <ul className="mt-3 space-y-2">
                {c.items.map((i) => (
                  <li key={i.t} className="relative overflow-hidden rounded-xl border border-border bg-card p-3 pl-4">
                    <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${toneRail[c.tone]}`} />
                    <p className="truncate text-xs font-semibold text-navy">{i.t}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{i.s}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Slide>
    ),
  },
  {
    key: "leases",
    label: "Leases",
    node: (
      <Slide
        eyebrow="Leases"
        title="Renewals handled weeks ahead."
        body="Renewal dates in plain language, early enough to actually act on them."
        tone="action"
        lottie={sparkLottie}
        frameTitle="Leases — renewal timeline"
      >
        <ul className="space-y-2">
          <RowLine title="Marie Tremblay" sub="412 Lansdowne · Main" tone="success" state="Secure" right="Nov 30, 2026" />
          <RowLine title="Grace Okafor" sub="88 Ottawa St N · Unit A" tone="warning" state="Renew soon" right="Sep 30, 2026" />
          <RowLine title="Dev Sharma" sub="412 Lansdowne · Basement" tone="action" state="Rolling" right="Month-to-month" />
        </ul>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-action-soft px-4 py-3">
          <FileText weight="duotone" className="h-5 w-5 shrink-0 text-action" aria-hidden="true" />
          <p className="text-xs font-semibold text-action">Grace's renewal is drafted — waiting on your review.</p>
        </div>
      </Slide>
    ),
  },
  {
    key: "tenants",
    label: "Tenants",
    node: (
      <Slide
        eyebrow="Tenants"
        title="Everyone, and everything about them."
        body="Contact details, unit, balance and history — one card per person."
        tone="navy"
        lottie={sparkLottie}
        frameTitle="Tenants — 20 doors"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { n: "Marie Tremblay", p: "412 Lansdowne · Main", t: "success" as const, s: "Paid" },
            { n: "Grace Okafor", p: "88 Ottawa St N · Unit A", t: "maple" as const, s: "Overdue" },
            { n: "Dev Sharma", p: "412 Lansdowne · Basement", t: "success" as const, s: "Paid" },
            { n: "Liam Byrne", p: "14 Rosewell Cres", t: "warning" as const, s: "Due soon" },
          ].map((x) => (
            <div key={x.n} className="card-tint flex min-w-0 items-center gap-3 p-3" style={{ "--tint": tintVar[x.t] } as React.CSSProperties}>
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card font-display text-xs font-extrabold text-navy">
                {x.n.split(" ").map((w) => w[0]).join("")}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-navy">{x.n}</p>
                <p className="truncate text-[11px] text-muted-foreground">{x.p}</p>
              </div>
              <Tag tone={x.t} className="ml-auto shrink-0">{x.s}</Tag>
            </div>
          ))}
        </div>
      </Slide>
    ),
  },
  {
    key: "calendar",
    label: "Calendar",
    node: (
      <Slide
        eyebrow="Calendar"
        title="What's happening this week."
        body="Inspections, move-ins, repairs and rent dates on one calm calendar."
        tone="warning"
        lottie={pulseLottie}
        frameTitle="Calendar — week of Aug 10"
      >
        <ul className="space-y-2">
          <RowLine title="Plumber at 88 Ottawa St N" sub="Aug 10 · 9:00am · Unit A" tone="maple" state="Booked" />
          <RowLine title="Fence repair" sub="Aug 12 · 8:30am · 27 Birchmount Rd" tone="action" state="Scheduled" />
          <RowLine title="Rent due — Zhou family" sub="Aug 15 · 27 Birchmount Rd" tone="warning" state="Due soon" right={cad(3100)} />
          <RowLine title="Unit inspection" sub="Aug 20 · 1:00pm · Basement suite" tone="navy" state="Planned" />
        </ul>
      </Slide>
    ),
  },
  {
    key: "documents",
    label: "Documents",
    node: (
      <Slide
        eyebrow="Documents"
        title="Filed against the right unit."
        body="Leases, notices, receipts and inspections — never hunted for in email again."
        tone="success"
        lottie={successLottie}
        frameTitle="Documents"
      >
        <ul className="space-y-2">
          <RowLine title="Standard Lease — Lansdowne main floor" sub="Lease · updated Jul 2" tone="action" state="PDF" />
          <RowLine title="N4 notice — Unit A" sub="LTB notice · updated Aug 6" tone="maple" state="PDF" />
          <RowLine title="Furnace service receipt" sub="Receipt · updated Jun 19" tone="success" state="PDF" />
          <RowLine title="Fire safety inspection 2026" sub="Inspection · updated May 11" tone="navy" state="PDF" />
        </ul>
      </Slide>
    ),
  },
  {
    key: "reports",
    label: "Reports",
    node: (
      <Slide
        eyebrow="Reports"
        title="Tax time without the shoebox."
        body="Income, expenses and collection trends, ready to hand to your accountant."
        tone="action"
        lottie={sparkLottie}
        frameTitle="Reports — 2026 year to date"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <MiniStat label="Income YTD" value={<CountUp value={78420} format={(n) => cad(n)} />} tone="success" />
          <MiniStat label="Expenses YTD" value={cad(14210)} tone="maple" />
          <MiniStat label="Collection rate" value={<CountUp value={98} format={(n) => `${Math.round(n)}%`} />} tone="action" />
        </div>
        <div className="mt-4 flex items-end gap-2" aria-hidden="true">
          {[52, 64, 58, 76, 88, 96, 91, 98].map((h, i) => (
            <span key={i} className="flex-1 rounded-t bg-action/70" style={{ height: `${h * 0.6}px` }} />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Monthly collection, Jan–Aug</p>
      </Slide>
    ),
  },
  {
    key: "ask",
    label: "Ask Keyhold",
    node: (
      <Slide
        eyebrow="Ask Keyhold"
        title="Plain questions, plain answers."
        body="Ask the way you'd say it out loud. Answers use only your own records."
        tone="navy"
        lottie={sparkLottie}
        frameTitle="Ask Keyhold"
      >
        <div className="space-y-3">
          <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-action px-3 py-2 text-xs font-medium text-primary-foreground">
            Who hasn't paid this month?
          </p>
          <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-surface-sunk px-3 py-2 text-xs text-navy">
            Grace Okafor is overdue {cad(1895)} at 88 Ottawa St N · Unit A. Liam Byrne is due Aug 15.
            <div className="mt-2 flex flex-wrap gap-2">
              <Tag tone="maple">Overdue</Tag>
              <Tag tone="warning">Due soon</Tag>
            </div>
          </div>
          <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-action px-3 py-2 text-xs font-medium text-primary-foreground">
            Draft the N4 for Unit A
          </p>
          <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-surface-sunk px-3 py-2 text-xs text-navy">
            Drafted from your records — review before anything is sent.
          </div>
        </div>
      </Slide>
    ),
  },
];

/** One pinned stage that walks through eight dashboards as you scroll. */
function ParallaxSection() {
  return (
    <section id="showcase" aria-labelledby="showcase-heading" className="relative">
      <ScrollDeck
        slides={deckSlides}
        header={
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">A look inside</p>
            <h2
              id="showcase-heading"
              className="mt-2 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-4xl"
            >
              Eight screens, <span className="text-success">one calm system.</span>
            </h2>
          </div>
        }
      />
    </section>
  );
}



/* ---------------------------------- page ---------------------------------- */

/* -------------------------- hero widget slider ---------------------------- */

function MiniWidget({
  title,
  tone = "navy",
  children,
}: {
  title: string;
  tone?: "navy" | "action" | "success" | "maple" | "warning";
  children: React.ReactNode;
}) {
  const solidClass = {
    navy: "card-solid-navy",
    action: "card-solid-action",
    success: "card-solid-success",
    maple: "card-solid-maple",
    warning: "card-solid-warning",
  }[tone];

  return (
    <div className={`${solidClass} w-[260px] shrink-0 p-4 sm:w-[300px] transition-transform hover:scale-[1.02] duration-500 rounded-[28px]`}>
      <p className="font-display text-sm font-bold text-navy">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function OccupancyWidget() {
  return (
    <MiniWidget title="Homes lived in" tone="success">
      <p className="money text-3xl font-extrabold text-navy">6 of 7</p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-sunk">
        <span className="block h-full w-[86%] rounded-full bg-success" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">One suite turning over on Sep 1</p>
    </MiniWidget>
  );
}

function MaintenanceWidget() {
  return (
    <MiniWidget title="Maintenance" tone="maple">
      <ul className="space-y-2">
        <li className="relative overflow-hidden rounded-xl border border-border bg-card p-3 pl-4">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-maple" />
          <p className="truncate text-xs font-semibold text-navy">No heat — furnace</p>
          <p className="truncate text-[11px] text-muted-foreground">Emergency · 88 Ottawa St N</p>
        </li>
        <li className="relative overflow-hidden rounded-xl border border-border bg-card p-3 pl-4">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-warning" />
          <p className="truncate text-xs font-semibold text-navy">Kitchen tap dripping</p>
          <p className="truncate text-[11px] text-muted-foreground">Open · 412 Lansdowne Ave</p>
        </li>
      </ul>
    </MiniWidget>
  );
}

function RentRollWidget() {
  return (
    <MiniWidget title="Rent roll" tone="navy">
      <ul className="space-y-2">
        {previewRows.slice(0, 3).map((r) => (
          <RentRowCard key={r.name} row={r} />
        ))}
      </ul>
    </MiniWidget>
  );
}

function LeaseWidget() {
  return (
    <MiniWidget title="Next renewal" tone="warning">
      <p className="money text-3xl font-extrabold text-navy tnum">62 days</p>
      <p className="mt-1 text-xs text-muted-foreground">Grace Okafor · ends Sep 30, 2026</p>
      <Tag tone="warning" className="mt-3">Draft renewal ready</Tag>
    </MiniWidget>
  );
}

function WeekWidget() {
  return (
    <MiniWidget title="This week" tone="action">
      <ul className="space-y-2.5">
        {[
          { t: "Rent due — all units", d: "Aug 1" },
          { t: "Move-in inspection", d: "Aug 14 · Unit B" },
          { t: "Furnace service call", d: "Aug 16" },
        ].map((e) => (
          <li key={e.t} className="flex items-start gap-2.5">
            <CalendarBlank weight="duotone" className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-navy">{e.t}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{e.d}</span>
            </span>
          </li>
        ))}
      </ul>
    </MiniWidget>
  );
}

function ReceiptWidget() {
  return (
    <MiniWidget title="Latest payment" tone="success">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
          <Receipt weight="duotone" className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="money text-xl font-extrabold text-navy">{cad(2350)}</p>
          <p className="truncate text-[11px] text-muted-foreground">Marie Tremblay · e-Transfer</p>
        </div>
      </div>
    </MiniWidget>
  );
}

function WideWidget({ children }: { children: React.ReactNode }) {
  return <div className="w-[300px] shrink-0 sm:w-[340px]">{children}</div>;
}

const rowOne = [
  <WideWidget key="collected"><CollectedCard /></WideWidget>,
  <RentRollWidget key="rent" />,
  <MaintenanceWidget key="maint" />,
  <WideWidget key="ask"><AskCard /></WideWidget>,
  <OccupancyWidget key="occ" />,
];

const rowTwo = [
  <LeaseWidget key="lease" />,
  <WideWidget key="sources"><SourcesCard /></WideWidget>,
  <WeekWidget key="week" />,
  <ReceiptWidget key="receipt" />,
];

function MarqueeRow({ items, reverse, duration }: { items: React.ReactNode[]; reverse?: boolean; duration: string }) {
  return (
    <div className="marquee-mask overflow-hidden" aria-hidden="true">
      <div
        className={reverse ? "marquee-track-reverse" : "marquee-track"}
        style={{ ["--marquee-duration" as string]: duration }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-stretch gap-4 pr-4 sm:gap-6 sm:pr-6">
            {items}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Continuously moving showcase of real dashboard widgets. */
function HeroWidgetSlider() {
  return (
    <div className="relative mt-12 sm:mt-16">
      <div className="space-y-4 sm:space-y-6">
        <MarqueeRow items={rowOne} duration="52s" />
        <MarqueeRow items={rowTwo} duration="66s" reverse />
      </div>
      <p className="mt-6 px-4 text-center text-sm text-muted-foreground sm:px-6">
        Live widgets from inside Keyhold — rent, repairs, renewals and this week's calendar.
      </p>
    </div>
  );
}

/** True once the referenced section has scrolled entirely out of view. */
function useScrolledPast(ref: React.RefObject<HTMLElement | null>) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => setPast(!entries[0]?.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return past;
}

/**
 * Once the hero is fully behind you, the top nav hands over to this centred,
 * stacked glass bar docked near the bottom of the page.
 */
/** Desktop "Features" mega-menu: hover or focus to open, lists every module. */
function FeaturesMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-navy"
      >
        Features
        <CaretDown weight="bold" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <div
        className={`absolute left-1/2 top-full z-50 w-[52rem] max-w-[94vw] -translate-x-1/2 pt-3 transition-[opacity,transform] duration-200 ${
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
          <FeatureMenuPanel onPick={() => setOpen(false)} />
          <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-sunk px-5 py-3">
            <p className="text-xs text-muted-foreground">
              Every module is included on every plan
            </p>
            <a href="#features" onClick={() => setOpen(false)} className="text-xs font-semibold text-action hover:underline">
              See every screen →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Compact light/dark switch used in the docked bar (focus-safe when hidden). */
function DockedThemeToggle({ disabled }: { disabled: boolean }) {
  const { resolved, toggle } = useTheme();
  const label = resolved === "dark" ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      tabIndex={disabled ? -1 : 0}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-navy transition-colors hover:bg-navy-soft"
    >
      {resolved === "dark" ? (
        <Sun weight="duotone" className="h-4.5 w-4.5" aria-hidden="true" />
      ) : (
        <Moon weight="duotone" className="h-4.5 w-4.5" aria-hidden="true" />
      )}
      <span className="sr-only">{label}</span>
    </button>
  );
}

function DockedNav({ docked }: { docked: boolean }) {

  return (
    <div
      className={`fixed inset-x-0 bottom-4 z-50 flex justify-center px-3 transition-[opacity,transform] duration-500 sm:bottom-6 ${
        docked ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-10 opacity-0"
      }`}
      aria-hidden={!docked}
    >
      <nav
        aria-label="Site"
        className="glass-surface flex w-full max-w-[calc(100vw-1.5rem)] items-center justify-between gap-1.5 rounded-full border border-border p-1.5 pl-3 shadow-xl sm:max-w-2xl sm:gap-4 sm:p-2 sm:pl-4 lg:max-w-4xl xl:max-w-5xl"
      >
        <span className="flex shrink-0 items-center gap-2">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy">
            <Key weight="duotone" className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
          </span>
          <span className="hidden font-display text-sm font-extrabold text-navy sm:inline">Keyhold</span>
        </span>

        {/* Center: Navigation Links */}
        <div className="hidden min-w-0 flex-1 items-center justify-center gap-4 lg:flex xl:gap-8">
          {[{ label: "Features", href: "#features" }, ...navLinks].map((l) => (
            <a
              key={l.href}
              href={l.href}
              tabIndex={docked ? 0 : -1}
              className="whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-navy"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Spacer for mobile to push actions to the right */}
        <div className="flex-1 lg:hidden" aria-hidden="true" />

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <DockedThemeToggle disabled={!docked} />
          <Link
            to="/signin"
            tabIndex={docked ? 0 : -1}
            className="hidden min-h-9 items-center whitespace-nowrap rounded-full px-3 text-sm font-semibold text-navy hover:bg-navy-soft md:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            tabIndex={docked ? 0 : -1}
            className="inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-action px-3.5 text-sm font-semibold text-primary-foreground hover:bg-action/90 sm:px-5 sm:gap-2"
          >
            <span className="hidden xs:inline">Start free</span>
            <span className="xs:hidden">Join</span>
            <ArrowRight weight="duotone" className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </nav>

    </div>
  );
}

/* ------------------------- testimonials / badges / about ------------------ */

function TestimonialCard({ t }: { t: (typeof testimonials)[number] }) {
  const color = tintVar[t.tone];
  return (
    <figure
      className="card-tint relative flex h-full min-w-0 flex-col p-6"
      style={{ "--tint": color } as React.CSSProperties}
    >
      <Quotes
        weight="fill"
        className="absolute right-5 top-5 h-7 w-7 opacity-25"
        style={{ color }}
        aria-hidden="true"
      />
      <div className="flex gap-0.5" aria-label="Five out of five stars">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} weight="fill" className="h-4 w-4" style={{ color }} aria-hidden="true" />
        ))}
      </div>
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">“{t.quote}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        <img
          src={t.avatar}
          alt=""
          loading="lazy"
          width={816}
          height={816}
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-bold text-navy">{t.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{t.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

function TestimonialsSection() {
  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">Loved by Canadian landlords</p>
        <h2 id="reviews-heading" className="mt-3 display-2 text-navy">
          Small landlords who stopped dreading the first of the month.
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Real operators with a handful of units, from Hamilton to Winnipeg.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {testimonials.map((t) => (
          <RevealPanel key={t.name} className="h-full">
            <TestimonialCard t={t} />
          </RevealPanel>
        ))}
      </div>
    </section>
  );
}

function BadgesSection() {
  return (
    <section aria-labelledby="badges-heading" className="border-y border-border bg-surface-sunk">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <h2 id="badges-heading" className="font-display text-xl font-extrabold text-navy sm:text-2xl">
          Compliant where it counts, connected to what you already use.
        </h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((b) => {
            const color = tintVar[b.tone];
            return (
              <li
                key={b.label}
                className="flex min-w-0 items-center gap-3 rounded-2xl border p-3.5"
                style={
                  {
                    borderColor: `color-mix(in oklab, ${color} 28%, transparent)`,
                    background: `color-mix(in oklab, ${color} 8%, var(--card))`,
                  } as React.CSSProperties
                }
              >
                <span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `color-mix(in oklab, ${color} 18%, var(--card))`, color }}
                >
                  <b.Icon weight="duotone" className="h-5 w-5" aria-hidden={true} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-navy">{b.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{b.note}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-xs text-muted-foreground">
          Keyhold is software, not a law firm. Forms follow the current published versions; you review everything before it's sent.
        </p>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">About Keyhold</p>
          <h2 id="about-heading" className="mt-3 display-2 text-navy">
            Built in Canada, for the landlord with a few doors.
          </h2>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
            Keyhold started because the existing options were either built for 500-unit portfolios in the
            United States, or they were a spreadsheet. Neither knew what an LTB filing was, and neither
            helped at 9pm when a furnace quit.
          </p>
          <p className="mt-3 max-w-prose text-base leading-relaxed text-muted-foreground">
            We make one thing: calm rental software for Canadian landlords with 2–20 units. Plain language,
            current provincial forms, and a flat CA$4.99 a month — no per-unit pricing, no sales call, no
            upsell to a tier you don't need.
          </p>
        </div>

        <ul className="grid gap-3 self-start sm:grid-cols-2 lg:grid-cols-1">
          {[
            { k: "Flat CA$4.99", v: "Per month, every plan, no per-unit fees." },
            { k: "2–20 units", v: "The size we design every screen around." },
            { k: "Canadian by default", v: "Provincial forms, CAD, data held in Canada." },
          ].map((s) => (
            <li key={s.k} className="card-soft min-w-0 p-5">
              <p className="font-display text-lg font-extrabold text-navy">{s.k}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.v}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Home() {
  useSmoothScroll();
  const heroRef = useRef<HTMLElement>(null);
  const docked = useScrolledPast(heroRef);
  return (

    <div className="min-h-dvh">
      {/* 1. Nav */}
      <header
        className={`glass-surface sticky top-0 z-40 border-b border-border transition-[opacity,transform] duration-500 ${
          docked ? "pointer-events-none -translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        }`}
        aria-hidden={docked}
      >

        <nav className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy">
              <Key weight="duotone" className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-extrabold text-navy">Keyhold</span>
          </Link>
          <ul className="hidden items-center justify-center gap-8 lg:flex">
            <li>
              <FeaturesMenu />
            </li>
            {navLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-sm font-medium text-muted-foreground hover:text-navy">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 justify-self-end">
            <ThemeToggleButton />
            <Link
              to="/signin"
              className="hidden min-h-11 items-center rounded-full px-4 text-sm font-semibold text-navy hover:bg-navy-soft sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex min-h-11 items-center rounded-full bg-action px-5 text-sm font-semibold text-primary-foreground hover:bg-action/90"
            >
              Start free
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* 2. Hero */}
        <section ref={heroRef} className="hero-aurora relative overflow-hidden pb-16 pt-14 sm:pb-24 sm:pt-24">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-soft py-1.5 pl-2 pr-3 text-xs font-semibold text-navy">
              <LazyLottie getData={() => import("@/assets/lottie/hero-spark.json")} className="h-5 w-5 shrink-0" loop />
              For landlords with 2–20 units
            </span>
            <h1 className="display-hero mt-6 text-navy">
              Rental management,{" "}
              <span className="text-success">built for Canadian landlords.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Track rent as it comes in, keep every lease organized, and resolve maintenance without chasing texts.
              Canadian forms and provincial notice dates are built in, so nothing gets missed.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-action px-7 text-base font-semibold text-primary-foreground hover:bg-action/90"
              >
                Start free <ArrowRight weight="duotone" className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                to="/signin"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-card px-7 text-base font-semibold text-navy hover:bg-navy-soft"
              >
                Sign in
              </Link>
            </div>
          </div>

          <HeroWidgetSlider />
        </section>


        {/* 3. Trust strip */}
        <section className="border-y border-border bg-surface-sunk">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-5 text-center text-sm font-medium text-navy sm:flex-row sm:justify-center sm:gap-6 sm:px-6">
            <span>Built for Canadian landlords</span>
            <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-border sm:block" />
            <span className="tnum">CA$4.99/month</span>
            <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-border sm:block" />
            <span>No base fees</span>
          </div>
        </section>

        {/* 4. Five questions */}
        <section id="answers" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 className="max-w-2xl font-display text-3xl font-extrabold text-navy sm:text-4xl">
            Five questions Keyhold answers before your coffee.
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {answers.map(({ Icon, title, body }) => (
              <li key={title} className="card-soft min-w-0 p-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-action-soft text-action">
                  <Icon weight="duotone" className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-4 font-display text-base font-bold text-navy">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* 4b. Every feature, module by module */}
        <FeatureShowcase />

        {/* 5-7. Feature deep dives */}
        <section id="deep-dive" className="mx-auto max-w-6xl space-y-20 px-4 py-16 sm:space-y-28 sm:px-6 sm:py-24">

          <FeatureBlock
            eyebrow="Rent & payments"
            title="Know who paid, down to the dollar."
            body="Record e-transfers, cheques and cash in a couple of taps. Balances update immediately and overdue rent is impossible to miss."
            points={["One ledger for every unit", "Receipts your tenants can download", "Overdue amounts shown in plain dollars"]}
          >
            <ScreenshotCard
              tone="success"
              title="Rent — August 2026"
              stat={
                <p className="text-sm text-muted-foreground">
                  <CountUp value={6025} format={(n) => cad(n)} className="money text-2xl font-extrabold text-navy" /> collected
                  of {cad(7920)} expected
                </p>
              }
            >
              <ul className="space-y-2">
                {previewRows.map((r) => (
                  <RentRowCard key={r.name} row={r} />
                ))}
              </ul>
            </ScreenshotCard>
          </FeatureBlock>

          <FeatureBlock
            eyebrow="Maintenance & tenant portal"
            title="Repairs arrive sorted by urgency."
            body="Tenants report an issue from their phone with a photo. You see what's an emergency and what can wait until Thursday."
            points={["Emergency repairs float to the top", "Photos and notes on every request", "Tenants get updates without phoning you"]}
            reverse
          >
            <ScreenshotCard
              tone="maple"
              title="Maintenance"
              stat={
                <p className="text-sm text-muted-foreground">
                  <CountUp value={94} format={(n) => `${Math.round(n)}%`} className="money text-2xl font-extrabold text-navy" />{" "}
                  of requests closed within a week
                </p>
              }
            >
              <ul className="space-y-2">
                <li className="relative overflow-hidden rounded-xl border border-border bg-card p-3 pl-4">
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-maple" />
                  <div className="flex items-start gap-3">
                    <Wrench weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-maple" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy">No heat — furnace not starting</p>
                      <p className="truncate text-xs text-muted-foreground">88 Ottawa St N · Unit A · Emergency</p>
                    </div>
                  </div>
                </li>
                <li className="relative overflow-hidden rounded-xl border border-border bg-card p-3 pl-4">
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-warning" />
                  <div className="flex items-start gap-3">
                    <ChatCircleDots weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy">Kitchen tap dripping</p>
                      <p className="truncate text-xs text-muted-foreground">412 Lansdowne Ave · Main floor · Open</p>
                    </div>
                  </div>
                </li>
                <li className="relative overflow-hidden rounded-xl border border-border bg-card p-3 pl-4">
                  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-success" />
                  <div className="flex items-start gap-3">
                    <CheckCircle weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy">Front door lock replaced</p>
                      <p className="truncate text-xs text-muted-foreground">14 Rosewell Cres · Resolved</p>
                    </div>
                  </div>
                </li>
              </ul>
            </ScreenshotCard>
          </FeatureBlock>

          <FeatureBlock
            eyebrow="Leases & notices"
            title="Leases and Canadian notice forms, prefilled."
            body="Start a lease or a notice with your property and tenant details already filled in. Renewal dates are tracked so nothing lapses quietly."
            points={["Province-aware lease and notice templates", "Renewal reminders weeks ahead", "Signed documents stored with the unit"]}
          >
            <ScreenshotCard
              tone="action"
              title="Leases"
              stat={
                <p className="text-sm text-muted-foreground">
                  <CountUp value={62} format={(n) => Math.round(n).toString()} className="money text-2xl font-extrabold text-navy" />{" "}
                  days until the next renewal deadline
                </p>
              }
            >
              <ul className="space-y-2">
                {[
                  { t: "Marie Tremblay", s: "Ends Nov 30, 2026", tone: "success" },
                  { t: "Grace Okafor", s: "Ends Sep 30, 2026", tone: "warning" },
                  { t: "Dev Sharma", s: "Month-to-month", tone: "success" },
                ].map((l) => (
                  <li key={l.t} className="relative overflow-hidden rounded-xl border border-border bg-card p-3 pl-4">
                    <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${toneRail[l.tone]}`} />
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <FileText weight="duotone" className="h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
                        <p className="truncate text-sm font-semibold text-navy">{l.t}</p>
                      </div>
                      <Tag tone={l.tone as keyof typeof tintVar} className="shrink-0">{l.s}</Tag>
                    </div>
                  </li>
                ))}
              </ul>
            </ScreenshotCard>
          </FeatureBlock>
        </section>

        {/* 7b. Ask Keyhold story */}
        <section id="assistant" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">Ask Keyhold</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-5xl">
              Ask it. <span className="text-muted-foreground">It works inside your portal.</span>
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Not a chatbot bolted on the side. It's an assistant that helps you record rent, prepare renewals, draft
              notices and answer everyday questions about your units — in plain English, using only your own records.
            </p>
          </div>

          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {assistantSteps.map((s, i) => (
              <RevealPanel key={s.title} className="h-full">
                <li className="card-soft min-w-0 h-full list-none p-6">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-action-soft font-display text-sm font-extrabold text-action tnum">
                    {i + 1}
                  </span>
                  <p className="mt-4 font-display text-lg font-bold text-navy">{s.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  <ul className="mt-4 space-y-2">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm text-foreground">
                        <CheckCircle weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </li>
              </RevealPanel>
            ))}
          </ol>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {assistantStats.map((s) => (
              <RevealPanel key={s.headline}>
                <div className={`card-soft min-w-0 h-full p-6 ${s.invert ? "bg-navy text-primary-foreground" : ""}`}>
                  <p
                    className={`font-display text-3xl font-extrabold tracking-tight sm:text-4xl ${
                      s.invert ? "text-primary-foreground" : "text-navy"
                    }`}
                  >
                    {s.headline}
                  </p>
                  <p className={`mt-3 text-sm leading-relaxed ${s.invert ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                    {s.body}
                  </p>
                </div>
              </RevealPanel>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Keyhold's assistant is AI-assisted, not legal advice. Every form and notice is prepared for your review and
            needs your confirmation before it's sent or filed.
          </p>
        </section>

        {/* 7c. Bento — breadth */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-action">One calm platform</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-5xl">
              Everything in one place. <span className="text-muted-foreground">Built for Canada.</span>
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <RevealPanel className="md:col-span-2 lg:row-span-2">
              <BentoCard
                Icon={ChatCircleText}
                title="Ask Keyhold — AI assist"
                body="Ask a question in plain English and it prepares the next step from your own records."
                className="h-full"
              >
                <div className="mt-5 space-y-3">
                  <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-navy px-4 py-3 text-sm text-primary-foreground">
                    Prepare the rent increase notice for Marie.
                  </p>
                  <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-sunk px-4 py-3 text-sm text-navy">
                    Done — the notice is ready for your review. It uses the 2026 guideline and a 1 December start date.
                  </p>
                  <Tag tone="success">Renewal prepared</Tag>
                </div>
              </BentoCard>
            </RevealPanel>

            {bentoItems.map((b) => (
              <RevealPanel key={b.title} className={b.wide ? "md:col-span-2 lg:col-span-1" : ""}>
                <BentoCard Icon={b.Icon} title={b.title} body={b.body} className="h-full" />
              </RevealPanel>
            ))}
          </div>
        </section>


        {/* 7d. Scroll showcase — 3D parallax dashboard reveal */}
        <ParallaxSection />

        {/* 7e. Testimonials */}
        <TestimonialsSection />

        {/* 7f. Compliance & integration badges */}
        <BadgesSection />

        {/* 7g. About */}
        <AboutSection />

        {/* 8. Pricing */}
        <PricingCalculator />


        {/* 9. Final CTA */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="card-soft grid items-center gap-6 p-8 text-center sm:p-12">
            <LazyLottie
              getData={() => import("@/assets/lottie/cta-pulse.json")}
              className="mx-auto h-14 w-14"
              loop
            />
            <h2 className="font-display text-3xl font-extrabold text-navy sm:text-4xl">

              Start your next rent month in Keyhold.
            </h2>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground">
              Add your properties in a few minutes. Keyhold takes it from there.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-action px-7 text-base font-semibold text-primary-foreground hover:bg-action/90"
              >
                Start free <ArrowRight weight="duotone" className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                to="/signin"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-card px-7 text-base font-semibold text-navy hover:bg-navy-soft"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy">
                <Key weight="duotone" className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
              </span>
              <span className="font-display text-lg font-extrabold text-navy">Keyhold</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Calm rental management for Canadian landlords with 2–20 units.
            </p>
          </div>
          <div>
            <p className="font-display text-sm font-bold text-navy">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-navy">Features</a></li>
              <li><a href="#pricing" className="hover:text-navy">Pricing</a></li>
              <li><Link to="/portal" className="hover:text-navy">Tenant portal</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-display text-sm font-bold text-navy">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/app/support" className="hover:text-navy">Support</Link></li>
              <li><Link to="/signin" className="hover:text-navy">Sign in</Link></li>
              <li><Link to="/legal/privacy" className="hover:text-navy">Privacy (PIPEDA)</Link></li>
              <li><Link to="/legal/terms" className="hover:text-navy">Terms</Link></li>
              <li><Link to="/legal/security" className="hover:text-navy">Security</Link></li>
              <li><Link to="/legal/accessibility" className="hover:text-navy">Accessibility</Link></li>
              <li><Link to="/legal/cookies" className="hover:text-navy">Cookies</Link></li>
              <li className="flex items-center gap-1.5"><Receipt weight="duotone" className="h-4 w-4" aria-hidden="true" />CA$4.99/month</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
            © 2026 Keyhold. Made in Canada.
          </p>
        </div>
      </footer>

      <DockedNav docked={docked} />
      <AskKeyhold />

    </div>
  );
}
