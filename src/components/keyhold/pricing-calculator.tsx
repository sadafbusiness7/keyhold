import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle,
  ArrowRight,
  Lightning,
  Buildings,
  ChatCircleDots,
} from "@phosphor-icons/react";

/* ------------------------------ pricing logic ----------------------------- */

const PRICE_AT_12 = 4.99;
const PRICE_AT_25 = 4.99 + 13 * 1.3; // 21.89
const PRICE_AT_40 = PRICE_AT_25 + 15 * 1.15; // 39.14

export function monthlyTotal(units: number): number {
  const u = Math.min(50, Math.max(1, Math.round(units)));
  if (u <= 12) return PRICE_AT_12;
  if (u <= 25) return 4.99 + (u - 12) * 1.3;
  if (u <= 40) return PRICE_AT_25 + (u - 25) * 1.15;
  return PRICE_AT_40 + (u - 40) * 1.0;
}

const PER_UNIT_FLOOR = 0.8;

function perDoor(units: number): number {
  return Math.max(PER_UNIT_FLOOR, monthlyTotal(units) / units);
}

/**
 * Manager seats included with a plan. 2 seats up to 12 units, then it ramps
 * up faster than the door count until it caps at 10 seats.
 */
export function managerSeatsFor(units: number): number {
  const u = Math.min(50, Math.max(1, Math.round(units)));
  if (u <= 12) return 2;
  return Math.min(10, Math.max(2, Math.ceil(2 * Math.pow(u / 12, 1.2))));
}

type Tier = {
  id: string;
  name: string;
  min: number;
  max: number;
  price: string;
  who: string;
  tint: string;
  bullets: string[];
};

const tiers: Tier[] = [
  {
    id: "solo",
    name: "Solo",
    min: 1,
    max: 12,
    price: "$4.99 flat",
    who: "Single & multi-property landlords",
    tint: "tint-success",
    bullets: ["Same price for 1 or 12 units", "Rent tracking & receipts", "Tenant portal included"],
  },
  {
    id: "growing",
    name: "Growing",
    min: 13,
    max: 25,
    price: "from $16/mo",
    who: "Growing owners",
    tint: "tint-action",
    bullets: ["$1.30 per extra door", "Maintenance board", "Lease reminders"],
  },
  {
    id: "portfolio",
    name: "Portfolio",
    min: 26,
    max: 40,
    price: "from $23/mo",
    who: "Professionalizing landlords",
    tint: "tint-navy",
    bullets: ["$1.15 per extra door", "Owner-ready reports", "Bulk rent runs"],
  },
  {
    id: "manager",
    name: "Manager",
    min: 41,
    max: 50,
    price: "from $40/mo",
    who: "Small property managers",
    tint: "tint-maple",
    bullets: ["$1.00 per extra door", "Multi-owner views", "Priority support"],
  },
];

function tierFor(units: number): Tier {
  return tiers.find((t) => units >= t.min && units <= t.max) ?? tiers[0]!;
}

/* ------------------------------ count animation --------------------------- */

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function useAnimatedNumber(value: number, reduced: boolean) {
  const [shown, setShown] = useState(value);
  const raf = useRef<number | null>(null);
  const from = useRef(value);

  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    const start = performance.now();
    const startVal = from.current;
    const dur = 380;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = startVal + (value - startVal) * eased;
      setShown(next);
      from.current = next;
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, reduced]);

  return reduced ? value : shown;
}

/* --------------------------------- section -------------------------------- */

export function PricingCalculator() {
  const [units, setUnits] = useState(8);
  const reduced = useReducedMotion();

  const total = monthlyTotal(units);
  const animatedTotal = useAnimatedNumber(total, reduced);
  const animatedPer = useAnimatedNumber(perDoor(units), reduced);

  const active = tierFor(units);
  const isTierOne = units <= 12;
  const totalLabel = isTierOne
    ? "4.99"
    : Math.round(animatedTotal).toLocaleString("en-CA");
  const perLabel = animatedPer.toFixed(2);
  const fill = ((units - 1) / 49) * 100;

  return (
    <section id="pricing" className="relative border-y border-border bg-surface-sunk">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          {/* Message */}
          <div className="min-w-0">
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-action">
              Pricing
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-navy sm:text-4xl">
              No base subscription fees. Ever.
              <span className="block text-action">
                The more you manage, the less you pay per door.
              </span>
            </h2>
            <p className="mt-5 max-w-prose text-base leading-relaxed text-muted-foreground">
              We help small landlords and property managers have a calm life. Move the slider and see
              exactly what you would pay — no sales call, no hidden platform fee, no contract.
            </p>
            <ul className="mt-6 space-y-2.5">
              {["No setup or base fee", "Cancel any time, export your records", "Canadian dollars, taxes shown up front"].map(
                (p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                    {p}
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Calculator */}
          <div className="card-soft min-w-0 p-5 sm:p-8">
            <label htmlFor="units-slider" className="font-display text-base font-bold text-navy">
              How many units do you manage?
            </label>

            <div className="mt-4 flex items-center gap-4">
              <input
                id="units-slider"
                type="range"
                min={1}
                max={50}
                step={1}
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                aria-valuetext={`${units} units`}
                className="kh-range flex-1"
                style={{ "--kh-fill": `${fill}%` } as React.CSSProperties}
              />
              <input
                type="number"
                min={1}
                max={50}
                value={units}
                aria-label="Number of units"
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isNaN(v)) setUnits(Math.min(50, Math.max(1, Math.round(v))));
                }}
                className="tnum h-12 w-20 shrink-0 rounded-xl border border-border bg-card text-center font-display text-lg font-bold text-navy"
              />
            </div>
            <div className="tnum mt-1 flex justify-between text-xs text-muted-foreground">
              <span>1 unit</span>
              <span>50 units</span>
            </div>

            {/* Price */}
            <div className="mt-6 rounded-[18px] border border-border bg-surface-sunk p-5 sm:p-6">
              <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="money text-5xl font-extrabold text-navy sm:text-6xl">
                  CA${totalLabel}
                </span>
                <span className="text-sm text-muted-foreground">per month</span>
              </p>
              <p className="tnum mt-3 text-base font-semibold text-success">
                That&apos;s about ${perLabel} per door
              </p>
              <p className="tnum mt-1 text-sm text-muted-foreground">
                {units} {units === 1 ? "unit" : "units"} · {active.name} tier
                {units > 12 ? " · per-door price drops as you grow" : " · flat rate up to 12 units"}
              </p>
              <p className="tnum mt-3 border-t border-border pt-3 text-sm text-navy">
                Includes <strong className="font-bold">{managerSeatsFor(units)}</strong> property
                manager {managerSeatsFor(units) === 1 ? "seat" : "seats"}
                <span className="text-muted-foreground"> (up to 10 as you grow)</span>
              </p>
            </div>

            {units === 50 ? (
              <div className="card-tint tint-maple mt-5 flex items-start gap-3 p-5">
                <Buildings weight="duotone" className="mt-0.5 h-6 w-6 shrink-0 text-maple" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-navy">
                    Managing more than 50 doors?
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    You&apos;re the kind of grower we love — reach out and we&apos;ll keep it fair.
                  </p>
                  <a
                    href="mailto:hello@keyhold.ca?subject=More%20than%2050%20doors"
                    className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-navy hover:bg-navy-soft"
                  >
                    <ChatCircleDots weight="duotone" className="h-4 w-4" aria-hidden="true" />
                    Talk to us
                  </a>
                </div>
              </div>
            ) : (
              <Link
                to="/app"
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-action px-6 text-base font-semibold text-primary-foreground hover:bg-action/90"
              >
                Start free <ArrowRight weight="duotone" className="h-5 w-5" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>

        {/* Tier cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t) => {
            const isActive = t.id === active.id;
            return (
              <div
                key={t.id}
                aria-current={isActive ? "true" : undefined}
                className={`card-tint ${t.tint} flex flex-col p-5 transition-all duration-300 ${
                  isActive
                    ? "-translate-y-1 ring-2 ring-[color-mix(in_oklab,var(--tint)_60%,transparent)]"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-base font-extrabold text-navy">{t.name}</p>
                  {isActive ? (
                    <span className="kh-tag" style={{ "--tint": "var(--action)" } as React.CSSProperties}>
                      <Lightning weight="duotone" className="h-3.5 w-3.5" aria-hidden="true" />
                      Your plan
                    </span>
                  ) : null}
                </div>
                <p className="tnum mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {t.min}–{t.max} units
                </p>
                <p className="money mt-3 text-2xl font-extrabold text-navy">{t.price}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t.who}</p>
                <ul className="mt-4 flex-1 space-y-1.5">
                  {t.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle weight="duotone" className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/app"
                  className={`mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold ${
                    isActive
                      ? "bg-action text-primary-foreground hover:bg-action/90"
                      : "border border-border bg-card text-navy hover:bg-navy-soft"
                  }`}
                >
                  Start free
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
          Payment processing fees, when you collect rent online, are charged by the payment provider and
          shown before you confirm. Keyhold adds nothing on top.
        </p>
      </div>
    </section>
  );
}
