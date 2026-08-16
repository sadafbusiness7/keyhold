import { useState } from "react";
import { 
  CheckCircle, 
  ArrowRight, 
  Trash, 
  Camera, 
  Wrench, 
  PaintBrush, 
  Key, 
  WarningCircle,
  Clock,
  CurrencyDollar,
  Check
} from "@phosphor-icons/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cad, type Unit, type UnitStatus } from "@/lib/mock-data";

type TurnoverStep = "inspection" | "damage" | "reconciliation" | "make-ready" | "ready";

interface TurnoverWorkflowProps {
  unit: Unit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (unitId: string, finalData: Partial<Unit>) => void;
}

export function TurnoverWorkflow({ unit, open, onOpenChange, onComplete }: TurnoverWorkflowProps) {
  const [step, setStep] = useState<TurnoverStep>("inspection");
  const [tasks, setTasks] = useState([
    { id: "1", label: "Cleaning", status: "todo", cost: 15000 },
    { id: "2", label: "Painting", status: "todo", cost: 45000 },
    { id: "3", label: "Lock change", status: "todo", cost: 8500 },
    { id: "4", label: "Appliance check", status: "todo", cost: 0 },
  ]);

  const totalCostCents = tasks.reduce((sum, t) => sum + (t.status === "done" ? t.cost : 0), 0) + 12000; // +120 for damage

  const handleNext = () => {
    if (step === "inspection") setStep("damage");
    else if (step === "damage") setStep("reconciliation");
    else if (step === "reconciliation") setStep("make-ready");
    else if (step === "make-ready") setStep("ready");
    else {
      onComplete(unit.id, {
        status: "listing" as UnitStatus,
        turnoverCostCents: totalCostCents,
        turnoverDays: 5,
        turnoverCompletedOn: new Date().toISOString().slice(0, 10),
      });
      toast.success(`Turnover complete for Unit ${unit.label}. Unit is now rent-ready.`);
      onOpenChange(false);

    }
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === "done" ? "todo" : "done" } : t));
  };

  const progress = step === "inspection" ? 20 : step === "damage" ? 40 : step === "reconciliation" ? 60 : step === "make-ready" ? 80 : 100;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-2 text-action mb-1">
            <ArrowsClockwise weight="bold" className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Unit Turnover</span>
          </div>
          <SheetTitle className="font-display text-2xl font-extrabold">Make-ready: Unit {unit.label}</SheetTitle>
          <SheetDescription>
            Guided workflow to prepare this unit for the next tenant.
          </SheetDescription>
        </SheetHeader>

        <div className="mb-8">
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            <span>Step {progress/20} of 5</span>
            <span>{progress}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-6 min-h-[400px]">
          {step === "inspection" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="rounded-xl border border-border p-4 bg-navy-soft/30">
                <h3 className="font-bold text-navy flex items-center gap-2">
                  <Camera weight="duotone" className="h-5 w-5" />
                  Move-out Inspection
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Document the unit condition. Compare photos against the move-in inspection from Sept 2025.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="aspect-square rounded-lg bg-muted flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-action transition-colors cursor-pointer group">
                  <Camera weight="duotone" className="h-8 w-8 text-muted-foreground group-hover:text-action" />
                  <span className="text-xs font-medium mt-2">Add Photo</span>
                </div>
                <div className="aspect-square rounded-lg bg-muted flex items-center justify-center relative group overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=400&q=70" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full"><Trash /></Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "damage" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="font-bold text-navy">Damage Assessment</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <div className="h-5 w-5 rounded bg-warning/20 flex items-center justify-center mt-0.5">
                    <WarningCircle weight="fill" className="text-warning h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Broken bedroom blind</p>
                    <p className="text-xs text-muted-foreground">Noted as 'New' in move-out vs 'Good' in move-in.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-navy">{cad(4500)}</p>
                    <button className="text-[10px] text-action font-bold uppercase hover:underline">Bill Tenant</button>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <div className="h-5 w-5 rounded bg-warning/20 flex items-center justify-center mt-0.5">
                    <WarningCircle weight="fill" className="text-warning h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Large scuff in hallway</p>
                    <p className="text-xs text-muted-foreground">Normal wear and tear.</p>
                  </div>
                  <div className="text-right text-muted-foreground">
                    <p className="text-sm font-bold">$0.00</p>
                    <span className="text-[10px] font-bold uppercase">Wear & Tear</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "reconciliation" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="font-bold text-navy">Deposit Reconciliation</h3>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-2 font-bold">Item</th>
                      <th className="text-right px-4 py-2 font-bold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-4 py-2">Security Deposit Held</td>
                      <td className="text-right px-4 py-2 font-medium text-green-600">{cad(unit.rent * 100)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">Damage: Broken blind</td>
                      <td className="text-right px-4 py-2 font-medium text-destructive">-{cad(4500)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">Cleaning Fee (contractual)</td>
                      <td className="text-right px-4 py-2 font-medium text-destructive">-{cad(7500)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-navy-soft/30 border-t border-border">
                    <tr className="font-bold text-navy">
                      <td className="px-4 py-3">Net Refund to Tenant</td>
                      <td className="text-right px-4 py-3">{cad(unit.rent * 100 - 12000)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                A formal Deposit Return statement will be generated and emailed to the tenant.
              </p>
            </div>
          )}

          {step === "make-ready" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="font-bold text-navy">Make-Ready Checklist</h3>
              <div className="space-y-2">
                {tasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-all text-left ${
                      task.status === "done" ? "bg-green-50 border-green-200" : "bg-card border-border hover:border-action"
                    }`}
                  >
                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                      task.status === "done" ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground"
                    }`}>
                      {task.status === "done" && <Check weight="bold" className="h-3 w-3" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${task.status === "done" ? "text-green-700 line-through" : "text-navy"}`}>
                        {task.label}
                      </p>
                      {task.cost > 0 && (
                        <p className="text-xs text-muted-foreground">Estimated cost: {cad(task.cost)}</p>
                      )}
                    </div>
                    {task.label === "Painting" ? <PaintBrush className="h-4 w-4 text-muted-foreground" /> : 
                     task.label === "Lock change" ? <Key className="h-4 w-4 text-muted-foreground" /> : 
                     <Wrench className="h-4 w-4 text-muted-foreground" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "ready" && (
            <div className="text-center py-8 space-y-4 animate-in zoom-in-95">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle weight="fill" className="h-12 w-12" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-navy">Unit is rent-ready!</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  Turnover completed in 5 days. Total make-ready cost: <strong>{cad(totalCostCents)}</strong>.
                </p>
              </div>
              <div className="bg-navy-soft/30 rounded-xl p-4 text-left max-w-sm mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Clock weight="duotone" className="h-4 w-4 text-navy" />
                  <span className="text-xs font-bold uppercase text-navy">Turnover Metrics</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Days Vacant</p>
                    <p className="text-lg font-bold text-navy tnum">5</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Cost</p>
                    <p className="text-lg font-bold text-navy tnum">{cad(totalCostCents)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="mt-8 pt-6 border-t border-border flex sm:justify-between items-center gap-4">
          <div className="text-left hidden sm:block">
             <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Total Cost Cents</p>
             <p className="text-lg font-bold text-navy tnum">{cad(totalCostCents)}</p>
          </div>
          <Button onClick={handleNext} className="rounded-full px-6 font-bold group">
            {step === "ready" ? "Mark Rent-Ready & Publish" : "Next Step"}
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

import { ArrowsClockwise } from "@phosphor-icons/react";
