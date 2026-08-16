/**
 * LAZY CHARTS — Recharts is heavy, so no screen pays for it until a chart is
 * actually on the page. Each wrapper keeps the same name and props as the real
 * chart and shows the standard skeleton (never a spinner) while the chunk
 * loads, and the standard error block if it fails.
 */
import { lazy, Suspense, type ComponentProps } from "react";
import type * as C from "./charts";
import { ModuleBoundary, SkeletonCard } from "./module-boundary";

const load = () => import("./charts");

function wrap<K extends keyof typeof C>(key: K, height: string) {
  const Lazy = lazy(() =>
    load().then((m) => ({ default: m[key] as unknown as React.ComponentType<Record<string, unknown>> })),
  );
  return function LazyChart(props: ComponentProps<(typeof C)[K] extends React.ComponentType<infer _P> ? (typeof C)[K] : never>) {
    return (
      <ModuleBoundary name="This chart">
        {/* Reserve the height up front so the chart measures correctly the
            moment its chunk arrives — otherwise it can mount at zero size. */}
        <div className={`min-${height} w-full`}>
          <Suspense fallback={<SkeletonCard height={height} />}>
            <Lazy {...(props as Record<string, unknown>)} />
          </Suspense>
        </div>
      </ModuleBoundary>
    );
  };
}

export const RentBarChart = wrap("RentBarChart", "h-72");
export const IncomeExpenseChart = wrap("IncomeExpenseChart", "h-72");
export const CollectionRateChart = wrap("CollectionRateChart", "h-72");
export const OccupancyChart = wrap("OccupancyChart", "h-72");
export const MaintenanceDonut = wrap("MaintenanceDonut", "h-72");
export const ExpenseTrendChart = wrap("ExpenseTrendChart", "h-72");
export const NoiByPropertyChart = wrap("NoiByPropertyChart", "h-72");
export const ComparisonChart = wrap("ComparisonChart", "h-72");
export const LeaseExpiryChart = wrap("LeaseExpiryChart", "h-72");
