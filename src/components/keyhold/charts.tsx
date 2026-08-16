import { useEffect, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartBar } from "@phosphor-icons/react";
import { EmptyState } from "./empty-state";

/** True when the user asked for less motion. Charts then render instantly. */
export function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const on = () => setReduce(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduce;
}

const cents = (v: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(v / 100);

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export function ChartCard({
  title,
  hint,
  empty,
  children,
  className = "",
}: {
  title: string;
  hint: string;
  empty: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card-soft p-4 ${className}`}>
      <header className="mb-3">
        <h3 className="font-display text-base font-bold text-navy">{title}</h3>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </header>
      {empty ? (
        <EmptyState Icon={ChartBar} title="Nothing to chart yet" body="This appears as soon as there's data in range." />
      ) : (
        <div className="h-56 w-full">{children}</div>
      )}
    </section>
  );
}

function TooltipBox({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; dataKey?: string | number }[];
  label?: string | number;
  format: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-navy">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{p.name}</span>
          <span className="tnum font-semibold text-foreground">{format(Number(p.value ?? 0))}</span>
        </p>
      ))}
    </div>
  );
}

const legendStyle = { fontSize: 12 } as const;

/** Rent collected against expected, last 6 months. */
export function RentBarChart({ data }: { data: { label: string; expectedCents: number; collectedCents: number }[] }) {
  const reduce = useReducedMotion();
  const empty = data.every((d) => d.expectedCents === 0 && d.collectedCents === 0);
  return (
    <ChartCard title="Rent collected vs expected" hint="Last six months, all properties you can see." empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 4 }} barGap={4}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} width={54} tickFormatter={(v: number) => cents(v)} />
          <Tooltip cursor={{ fill: "var(--surface-sunk)" }} content={<TooltipBox format={cents} />} />
          <Legend wrapperStyle={legendStyle} />
          <Bar dataKey="expectedCents" name="Expected" fill="var(--navy-soft)" stroke="var(--navy)" radius={[4, 4, 0, 0]} isAnimationActive={!reduce} animationDuration={900} />
          <Bar dataKey="collectedCents" name="Collected" fill="var(--success)" radius={[4, 4, 0, 0]} isAnimationActive={!reduce} animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Income against approved expenses, grouped bars. */
export function IncomeExpenseChart({ data }: { data: { label: string; incomeCents: number; expenseCents: number }[] }) {
  const reduce = useReducedMotion();
  const empty = data.every((d) => d.incomeCents === 0 && d.expenseCents === 0);
  return (
    <ChartCard title="Income vs expenses" hint="Rent received against approved bills, by month." empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 4 }} barGap={4}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} width={54} tickFormatter={(v: number) => cents(v)} />
          <Tooltip cursor={{ fill: "var(--surface-sunk)" }} content={<TooltipBox format={cents} />} />
          <Legend wrapperStyle={legendStyle} />
          <Bar dataKey="incomeCents" name="Income" fill="var(--success)" radius={[4, 4, 0, 0]} isAnimationActive={!reduce} animationDuration={900} />
          <Bar dataKey="expenseCents" name="Expenses" fill="var(--maple)" radius={[4, 4, 0, 0]} isAnimationActive={!reduce} animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Collection rate over time. */
export function CollectionRateChart({ data }: { data: { label: string; ratePct: number }[] }) {
  const reduce = useReducedMotion();
  return (
    <ChartCard title="Collection rate" hint="Share of expected rent collected each month." empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} width={40} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip content={<TooltipBox format={(v) => `${v}%`} />} />
          <Legend wrapperStyle={legendStyle} />
          <Line
            type="monotone"
            dataKey="ratePct"
            name="Collected %"
            stroke="var(--action)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--action)" }}
            isAnimationActive={!reduce}
            animationDuration={900}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Occupancy trend. */
export function OccupancyChart({ data }: { data: { label: string; ratePct: number }[] }) {
  const reduce = useReducedMotion();
  return (
    <ChartCard title="Occupancy trend" hint="Homes lived in as a share of all homes." empty={data.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} width={40} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip content={<TooltipBox format={(v) => `${v}%`} />} />
          <Legend wrapperStyle={legendStyle} />
          <Line
            type="monotone"
            dataKey="ratePct"
            name="Occupied %"
            stroke="var(--success)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--success)" }}
            isAnimationActive={!reduce}
            animationDuration={900}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

const SLICE_COLORS = ["var(--action)", "var(--success)", "var(--warning)", "var(--maple)", "var(--navy)"];

/** Maintenance spend by category, with a written legend (never colour-only). */
export function MaintenanceDonut({ data }: { data: { name: string; valueCents: number }[] }) {
  const reduce = useReducedMotion();
  const total = data.reduce((s, d) => s + d.valueCents, 0);
  return (
    <ChartCard title="Maintenance cost by category" hint="Approved bills, grouped by the work that caused them." empty={total === 0}>
      <div className="flex h-full flex-col gap-3 sm:flex-row sm:items-center">
        <div className="h-40 w-full sm:h-full sm:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<TooltipBox format={cents} />} />
              <Pie
                data={data}
                dataKey="valueCents"
                nameKey="name"
                innerRadius="58%"
                outerRadius="86%"
                paddingAngle={data.length > 1 ? 2 : 0}
                isAnimationActive={!reduce}
                animationDuration={900}
              >
                {data.map((d, i) => (
                  <Cell key={d.name} fill={SLICE_COLORS[i % SLICE_COLORS.length]} stroke="var(--card)" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="w-full space-y-1.5 sm:w-1/2">
          {data.map((d, i) => (
            <li key={d.name} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: SLICE_COLORS[i % SLICE_COLORS.length] }}
                />
                <span className="truncate text-foreground">{d.name}</span>
              </span>
              <span className="tnum shrink-0 font-semibold text-navy">
                {cents(d.valueCents)} · {total ? Math.round((d.valueCents / total) * 100) : 0}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}

/** Income, expenses and what's left over, month by month. */
export function ExpenseTrendChart({
  data,
}: {
  data: { label: string; incomeCents: number; expenseCents: number; noiCents: number }[];
}) {
  const reduce = useReducedMotion();
  const empty = data.every((d) => d.incomeCents === 0 && d.expenseCents === 0);
  return (
    <ChartCard title="Expense and income trend" hint="Money in, approved bills out, and what's left each month." empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} width={54} tickFormatter={(v: number) => cents(v)} />
          <Tooltip content={<TooltipBox format={cents} />} />
          <Legend wrapperStyle={legendStyle} />
          <Line type="monotone" dataKey="incomeCents" name="Income" stroke="var(--success)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--success)" }} isAnimationActive={!reduce} animationDuration={900} />
          <Line type="monotone" dataKey="expenseCents" name="Expenses" stroke="var(--maple)" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 3, fill: "var(--maple)" }} isAnimationActive={!reduce} animationDuration={900} />
          <Line type="monotone" dataKey="noiCents" name="Net operating income" stroke="var(--action)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--action)" }} isAnimationActive={!reduce} animationDuration={900} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Net operating income per property for the chosen period. */
export function NoiByPropertyChart({
  data,
}: {
  data: { property: string; incomeCents: number; expenseCents: number; noiCents: number }[];
}) {
  const reduce = useReducedMotion();
  const empty = data.every((d) => d.incomeCents === 0 && d.expenseCents === 0);
  return (
    <ChartCard title="Net operating income by property" hint="Rent received less approved bills, per property." empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 4 }} barGap={4}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="property" {...axis} interval={0} height={40} />
          <YAxis {...axis} width={54} tickFormatter={(v: number) => cents(v)} />
          <Tooltip cursor={{ fill: "var(--surface-sunk)" }} content={<TooltipBox format={cents} />} />
          <Legend wrapperStyle={legendStyle} />
          <Bar dataKey="incomeCents" name="Income" fill="var(--success)" radius={[4, 4, 0, 0]} isAnimationActive={!reduce} animationDuration={900} />
          <Bar dataKey="expenseCents" name="Expenses" fill="var(--maple)" radius={[4, 4, 0, 0]} isAnimationActive={!reduce} animationDuration={900} />
          <Bar dataKey="noiCents" name="Net" fill="var(--action)" radius={[4, 4, 0, 0]} isAnimationActive={!reduce} animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Generic two-series comparison: property vs property, or period vs period. */
export function ComparisonChart({
  title,
  hint,
  data,
  seriesA,
  seriesB,
  money: asMoney = true,
}: {
  title: string;
  hint: string;
  data: { label: string; a: number; b: number }[];
  seriesA: string;
  seriesB: string;
  money?: boolean;
}) {
  const reduce = useReducedMotion();
  const format = asMoney ? cents : (v: number) => `${v}%`;
  const empty = data.length === 0 || data.every((d) => d.a === 0 && d.b === 0);
  return (
    <ChartCard title={title} hint={hint} empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 4 }} barGap={4}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" {...axis} interval={0} height={40} />
          <YAxis {...axis} width={54} tickFormatter={format} />
          <Tooltip cursor={{ fill: "var(--surface-sunk)" }} content={<TooltipBox format={format} />} />
          <Legend wrapperStyle={legendStyle} />
          <Bar dataKey="a" name={seriesA} fill="var(--navy-soft)" stroke="var(--navy)" radius={[4, 4, 0, 0]} isAnimationActive={!reduce} animationDuration={900} />
          <Bar dataKey="b" name={seriesB} fill="var(--action)" radius={[4, 4, 0, 0]} isAnimationActive={!reduce} animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** Leases ending each month over the next year. */
export function LeaseExpiryChart({ data }: { data: { label: string; leases: number }[] }) {
  const reduce = useReducedMotion();
  return (
    <ChartCard title="Lease expiry schedule" hint="How many tenancies end in each of the next twelve months." empty={data.every((d) => d.leases === 0)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" {...axis} interval={0} height={40} />
          <YAxis {...axis} width={32} allowDecimals={false} />
          <Tooltip cursor={{ fill: "var(--surface-sunk)" }} content={<TooltipBox format={(v) => `${v} lease${v === 1 ? "" : "s"}`} />} />
          <Legend wrapperStyle={legendStyle} />
          <Bar dataKey="leases" name="Leases ending" fill="var(--warning)" radius={[4, 4, 0, 0]} isAnimationActive={!reduce} animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
