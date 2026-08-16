import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { 
  Info, 
  ArrowRight, 
  Buildings, 
  CurrencyDollar, 
  Wrench, 
  Users, 
  FileText,
  X
} from "@phosphor-icons/react";
import { usePermissions } from "@/lib/mock-access";

interface Step {
  id: string;
  target: string;
  question: string;
  answer: string;
  icon: typeof Info;
}

const STEPS: Step[] = [
  {
    id: "portfolio",
    target: "portfolio-heading",
    question: "How many properties and units am I actually managing?",
    answer: "Your morning view gives you an instant count of occupied vs vacant homes across your entire portfolio.",
    icon: Buildings
  },
  {
    id: "rent",
    target: "risk-heading",
    question: "Who owes me money and how much is overdue?",
    answer: "We surface every unpaid invoice immediately under 'What could go wrong' so you never miss a payment.",
    icon: CurrencyDollar
  },
  {
    id: "maintenance",
    target: "risk-heading",
    question: "What maintenance issues are currently impacting my tenants?",
    answer: "Emergency repairs are flagged at the very top. You can handle them with one click before they escalate.",
    icon: Wrench
  },
  {
    id: "leases",
    target: "time-heading",
    question: "Which leases are expiring soon?",
    answer: "We track renewals 60-90 days out, giving you plenty of time to serve N1s or sign extensions.",
    icon: FileText
  },
  {
    id: "team",
    target: "quick-heading",
    question: "Are my property managers handling their assigned tasks?",
    answer: "Role-based access lets you delegate while staying in control. You see what they see, but with owner-level overrides.",
    icon: Users
  }
];

export function DemoTour() {
  const { isDemo } = usePermissions();
  const search = useRouterState({ select: (s) => s.location.search }) as { tour?: string };
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isDemo && search.tour === "start") {
      setIsVisible(true);
    }
  }, [isDemo, search.tour]);

  if (!isVisible) return null;

  const step = STEPS[currentStep];
  const Icon = step.icon;

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
      // Scroll to target
      document.getElementById(step.target)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setIsVisible(false);
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 z-[110] w-[90vw] max-w-md -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative overflow-hidden rounded-3xl bg-navy p-6 text-white shadow-2xl ring-1 ring-white/10">
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute right-4 top-4 text-white/40 hover:text-white"
        >
          <X weight="bold" className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-action">
            <Icon weight="duotone" className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Landlord Question {currentStep + 1} of {STEPS.length}
            </p>
            <h4 className="font-display text-base font-bold leading-tight">
              {step.question}
            </h4>
          </div>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-white/70">
          {step.answer}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 rounded-full transition-all ${i === currentStep ? "w-4 bg-action" : "w-1 bg-white/20"}`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="flex h-10 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-navy hover:bg-white/90"
          >
            {currentStep === STEPS.length - 1 ? "Finish tour" : "Next question"}
            <ArrowRight weight="bold" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
