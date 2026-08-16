/**
 * PLAN ENGINE — pure volume-curve maths for the subscription surface.
 * Mirrors the public pricing calculator so the in-app numbers can never drift.
 * All money in integer cents.
 */

export type PlanId = "solo" | "growing" | "portfolio" | "manager";

export const PLANS: { id: PlanId; name: string; min: number; max: number; blurb: string }[] = [
  { id: "solo", name: "Solo", min: 1, max: 12, blurb: "Same price for 1 or 12 homes." },
  { id: "growing", name: "Growing", min: 13, max: 25, blurb: "$1.30 for each home past 12." },
  { id: "portfolio", name: "Portfolio", min: 26, max: 40, blurb: "$1.15 for each home past 25." },
  { id: "manager", name: "Manager", min: 41, max: 50, blurb: "$1.00 for each home past 40." },
];

const PRICE_AT_12 = 499;
const PRICE_AT_25 = PRICE_AT_12 + 13 * 130;
const PRICE_AT_40 = PRICE_AT_25 + 15 * 115;

/** Monthly price, in cents, for a given number of homes. */
export function monthlyCents(units: number): number {
  const u = Math.min(50, Math.max(1, Math.round(units)));
  if (u <= 12) return PRICE_AT_12;
  if (u <= 25) return PRICE_AT_12 + (u - 12) * 130;
  if (u <= 40) return PRICE_AT_25 + (u - 25) * 115;
  return PRICE_AT_40 + (u - 40) * 100;
}

export function planFor(units: number) {
  const u = Math.max(1, Math.round(units));
  return PLANS.find((p) => u >= p.min && u <= p.max) ?? PLANS[PLANS.length - 1]!;
}

/** Manager seats included at this size. */
export function seatsFor(units: number): number {
  const u = Math.min(50, Math.max(1, Math.round(units)));
  if (u <= 12) return 2;
  return Math.min(10, Math.max(2, Math.ceil(2 * Math.pow(u / 12, 1.2))));
}

/** Points for the pricing curve chart. */
export function priceCurve(maxUnits = 50) {
  return Array.from({ length: maxUnits }, (_, i) => {
    const units = i + 1;
    return { units, cents: monthlyCents(units), label: String(units) };
  });
}

/**
 * Mid-cycle change: you pay for the days left on the new price, minus the
 * unused days already paid at the old price.
 */
export function prorationCents(args: {
  oldCents: number;
  newCents: number;
  daysLeft: number;
  daysInPeriod?: number;
}): number {
  const days = args.daysInPeriod ?? 30;
  const share = Math.max(0, Math.min(1, args.daysLeft / days));
  return Math.round((args.newCents - args.oldCents) * share);
}

export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.max(0, Math.round((b - a) / 86_400_000));
}
