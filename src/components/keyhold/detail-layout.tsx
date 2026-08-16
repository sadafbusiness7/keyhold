import { ReactNode } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { CaretRight, House } from "@phosphor-icons/react";

export type BreadcrumbItem = {
  label: string;
  to?: string;
  params?: Record<string, string>;
};

export function DetailBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground" aria-label="Breadcrumb">
      <Link to="/app" className="hover:text-navy">
        <House weight="duotone" className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <CaretRight weight="bold" className="h-2 w-2" />
          {item.to ? (
            <Link to={item.to as any} className="hover:text-navy">
              {item.label}
            </Link>
          ) : (
            <span className="text-navy">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

export function DetailTabs({ 
  tabs, 
  activeTab, 
  onTabChange 
}: { 
  tabs: { key: string; label: string }[]; 
  activeTab: string;
  onTabChange: (key: string) => void;
}) {
  return (
    <div className="border-b border-border">
      <div className="mx-auto flex max-w-full overflow-x-auto no-scrollbar">
        <div className="flex gap-1 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              aria-current={activeTab === tab.key ? "page" : undefined}
              className={`flex min-h-10 items-center whitespace-nowrap rounded-full px-5 text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? "bg-navy text-primary-foreground"
                  : "text-muted-foreground hover:bg-navy-soft hover:text-navy"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DetailHeader({
  title,
  subtitle,
  status,
  actions,
  stats,
}: {
  title: string;
  subtitle?: string;
  status?: ReactNode;
  actions?: ReactNode;
  stats?: { label: string; value: string | ReactNode }[];
}) {
  return (
    <div className="texture-bloom mb-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold text-navy">{title}</h1>
            {status}
          </div>
          {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>

      {stats && stats.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-6 sm:grid-cols-4 lg:flex lg:gap-12">
          {stats.map((stat, i) => (
            <div key={i}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </p>
              <div className="mt-1 font-display text-lg font-bold text-navy">{stat.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DetailSection({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="space-y-4">
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4">
          {title && <h3 className="font-display text-lg font-bold text-navy">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
