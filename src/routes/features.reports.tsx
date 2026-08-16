import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/keyhold/marketing-shell";
import { ChartBar, CheckCircle, FilePdf, Calculator } from "@phosphor-icons/react";

export const Route = createFileRoute("/features/reports")({
  head: () => ({
    meta: [
      { title: "Financial Reporting & T776 Exports — Keyhold" },
      { name: "description", content: "Tax season just got easier. CRA-ready T776 reporting, income statements, and expense tracking for Canadian landlords." },
    ],
  }),
  component: ReportsFeaturePage,
});

function ReportsFeaturePage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-action-soft text-action">
                    <ChartBar weight="duotone" className="h-6 w-6" />
                </div>
                <h1 className="mt-6 font-display text-5xl font-extrabold text-navy leading-tight">Tax season, <br /><span className="text-action">solved.</span></h1>
                <p className="mt-8 text-xl text-muted-foreground leading-relaxed">
                    Stop dreading April. Keyhold organizes your income and expenses throughout the year and generates 
                    CRA-ready reports that your accountant will love.
                </p>
                <div className="mt-12 space-y-6">
                    <div className="flex gap-4">
                        <CheckCircle weight="fill" className="h-6 w-6 text-success shrink-0" />
                        <div>
                            <p className="font-bold text-navy text-lg">CRA-Ready T776 Export</p>
                            <p className="text-muted-foreground">Download a PDF or CSV structured exactly like the Statement of Real Estate Rentals form.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <CheckCircle weight="fill" className="h-6 w-6 text-success shrink-0" />
                        <div>
                            <p className="font-bold text-navy text-lg">Expense Categorization</p>
                            <p className="text-muted-foreground">Track property taxes, insurance, repairs, and utilities with photo evidence of every receipt.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <CheckCircle weight="fill" className="h-6 w-6 text-success shrink-0" />
                        <div>
                            <p className="font-bold text-navy text-lg">Portfolio Insights</p>
                            <p className="text-muted-foreground">See your net operating income, cash flow, and ROI across your entire portfolio at a glance.</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="card-soft p-8 bg-white border-2 border-border shadow-2xl space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-navy text-lg">Annual Summary</h4>
                        <p className="text-xs text-muted-foreground">Fiscal Year 2026</p>
                    </div>
                    <button className="flex items-center gap-2 rounded-xl bg-navy-soft px-4 py-2 text-xs font-bold text-navy">
                        <FilePdf weight="fill" /> Export T776
                    </button>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="card-soft bg-success-soft/20 p-5 text-center">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Gross Income</p>
                        <p className="mt-1 text-2xl font-bold text-success">$64,200.00</p>
                    </div>
                    <div className="card-soft bg-warning-soft/20 p-5 text-center">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Total Expenses</p>
                        <p className="mt-1 text-2xl font-bold text-warning">$18,450.00</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold text-navy">
                        <span>Property Tax</span>
                        <span>$4,100.00</span>
                    </div>
                    <div className="w-full h-2 bg-navy-soft rounded-full overflow-hidden">
                        <div className="h-full bg-navy w-1/4" />
                    </div>
                    <div className="flex justify-between text-xs font-bold text-navy pt-2">
                        <span>Maintenance</span>
                        <span>$2,850.00</span>
                    </div>
                    <div className="w-full h-2 bg-navy-soft rounded-full overflow-hidden">
                        <div className="h-full bg-navy w-1/6" />
                    </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center gap-3 text-xs text-muted-foreground">
                    <Calculator weight="duotone" className="h-5 w-5" />
                    <span>Automatic CCA calculations coming in Q4</span>
                </div>
            </div>
        </div>
      </div>
    </MarketingShell>
  );
}
