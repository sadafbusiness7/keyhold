import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { 
  Key, 
  ArrowRight, 
  UserSwitch, 
  ShieldCheck, 
  CheckCircle,
  Buildings,
  Users,
  CurrencyDollar,
  Wrench,
  FileText
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { AuthShell } from "@/components/keyhold/auth-shell";
import { usePermissions } from "@/lib/mock-access";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo Mode — Keyhold" },
      { name: "description", content: "Explore Keyhold instantly with a fully populated Canadian sandbox." },
    ],
  }),
  component: DemoMode,
});

const ROLES = [
  { id: "u_owner", label: "Landlord", description: "Full control, billing, and team management", icon: Buildings },
  { id: "u_priya", label: "Property Manager", description: "Daily operations across assigned units", icon: Users },
  { id: "t3", label: "Tenant", description: "Pay rent and report repairs from a mobile portal", icon: UserSwitch },
] as const;

function DemoMode() {
  const navigate = useNavigate();
  const { setCurrentUserId } = usePermissions();
  const [selectedRole, setSelectedRole] = useState<typeof ROLES[number]["id"]>("u_owner");

  const enterDemo = () => {
    setCurrentUserId(selectedRole);
    const role = ROLES.find(r => r.id === selectedRole);
    toast.success(`Welcome to the demo as ${role?.label}`);
    
    if (selectedRole === "t3") {
      navigate({ to: "/portal" });
    } else {
      navigate({ to: "/app" });
    }
  };

  return (
    <AuthShell
      title="Try Keyhold instantly"
      subtitle="The sandbox is ready. No account required."
      points={[
        "6 properties, 40+ units populated",
        "Realistic Canadian rent data",
        "Open maintenance requests",
        "Switch roles to see every view",
      ]}
      footer={
        <div className="text-center">
          <p className="text-muted-foreground mb-4 italic text-xs">
            Data resets when you close your browser. Sending and destructive actions are disabled in demo mode.
          </p>
          <Link to="/signup" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-action text-sm font-semibold text-primary-foreground hover:bg-action/90">
            Create your own real account <ArrowRight weight="bold" className="h-4 w-4" />
          </Link>
        </div>
      }
    >
      <div className="mt-8 space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-navy">Who would you like to explore as?</p>
          <div className="grid gap-3">
            {ROLES.map((role) => {
              const active = selectedRole === role.id;
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
                    active 
                      ? "border-action bg-action-soft ring-1 ring-action" 
                      : "border-border bg-card/50 hover:border-navy-soft hover:bg-navy-soft/30"
                  }`}
                >
                  <div className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${active ? "bg-action text-white" : "bg-navy-soft text-navy"}`}>
                    <Icon weight="duotone" className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-bold ${active ? "text-navy" : "text-navy/80"}`}>{role.label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{role.description}</p>
                  </div>
                  {active && (
                    <div className="ml-auto mt-1 text-action">
                      <CheckCircle weight="fill" className="h-5 w-5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={enterDemo}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-navy text-sm font-semibold text-primary-foreground hover:bg-navy/90"
        >
          Explore the demo <ArrowRight weight="bold" className="h-4 w-4" />
        </button>
      </div>
    </AuthShell>
  );
}
