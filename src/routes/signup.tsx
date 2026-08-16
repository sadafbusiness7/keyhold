import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowLeft, CheckCircle, UsersThree, Eye, EyeSlash, House } from "@phosphor-icons/react";
import { toast } from "sonner";
import { AuthShell, SocialButtons, OrDivider, authField } from "@/components/keyhold/auth-shell";
import { managerSeatsFor, monthlyTotal } from "@/components/keyhold/pricing-calculator";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your landlord account — Keyhold" },
      { name: "description", content: "Sign up as a landlord in three short steps: your details, how many units you manage, and inviting your property managers." },
      { property: "og:title", content: "Create your landlord account — Keyhold" },
      { property: "og:description", content: "Landlord accounts include property manager seats that grow with your portfolio, up to 10." },
    ],
  }),
  component: SignUp,
});

const steps = ["Your account", "Your portfolio", "Your managers"] as const;

function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [units, setUnits] = useState(8);
  const [managers, setManagers] = useState<string[]>([]);
  const [managerEmail, setManagerEmail] = useState("");

  const seats = managerSeatsFor(units);
  const price = units <= 12 ? "4.99" : Math.round(monthlyTotal(units)).toLocaleString("en-CA");
  const fill = ((units - 1) / 49) * 100;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Set up once. Keyhold keeps the rest calm."
      points={[
        "Landlord accounts own the portfolio and the billing",
        "Invite property managers — seats grow with your doors",
        "Tenants get their own portal, invited from inside",
      ]}
      footer={
        <>
          Already with us?{" "}
          <Link to="/signin" className="font-semibold text-action">
            Sign in
          </Link>
          .
        </>
      }
    >
      <p className="mt-2 text-muted-foreground">
        Keyhold accounts are created by landlords. Managers and tenants join by invitation.
      </p>

      {/* Step rail */}
      <ol className="mt-6 flex items-center gap-2" aria-label="Sign up progress">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col gap-1.5">
            <span
              className={`h-1.5 rounded-full transition-colors ${i <= step ? "bg-action" : "bg-border"}`}
              aria-hidden="true"
            />
            <span className={`text-[11px] font-semibold ${i === step ? "text-navy" : "text-muted-foreground"}`}>
              {s}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="mt-6">
          <SocialButtons
            onPick={(p) => {
              toast.success(`Continuing with ${p === "google" ? "Google" : "Apple"}…`);
              setStep(1);
            }}
          />
          <OrDivider label="or sign up with email and password" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) { toast.error("Tell us your name."); return; }
              if (!email.includes("@")) { toast.error("Enter a valid email address."); return; }
              if (password.length < 8) { toast.error("Use at least 8 characters for your password."); return; }
              setStep(1);
            }}
          >
            <label htmlFor="su-name" className="text-sm font-medium">Your name</label>
            <input id="su-name" className={authField} value={name} onChange={(e) => setName(e.target.value)} placeholder="Mr. J" />

            <label htmlFor="su-email" className="mt-4 block text-sm font-medium">Email address</label>
            <input id="su-email" type="email" autoComplete="email" className={authField} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.ca" />

            <label htmlFor="su-password" className="mt-4 block text-sm font-medium">Create a password</label>
            <div className="relative">
              <input
                id="su-password"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                className={`${authField} pr-12`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-navy-soft"
              >
                {show ? <EyeSlash weight="duotone" className="h-5 w-5" /> : <Eye weight="duotone" className="h-5 w-5" />}
              </button>
            </div>

            <button type="submit" className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-action text-sm font-semibold text-primary-foreground hover:bg-action/90">
              Continue <ArrowRight weight="duotone" className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}

      {step === 1 && (
        <div className="mt-6">
          <label htmlFor="su-units" className="font-display text-base font-bold text-navy">
            How many units do you manage?
          </label>
          <div className="mt-4 flex items-center gap-4">
            <input
              id="su-units"
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
            <span className="tnum grid h-12 w-16 shrink-0 place-items-center rounded-xl border border-border bg-card/80 font-display text-lg font-bold text-navy">
              {units}
            </span>
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-surface-sunk p-5">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="money text-4xl font-extrabold text-navy">CA${price}</span>
              <span className="text-sm text-muted-foreground">per month</span>
            </p>
            <p className="tnum mt-3 flex items-center gap-2 text-sm font-semibold text-success">
              <UsersThree weight="duotone" className="h-5 w-5" aria-hidden="true" />
              {seats} property manager {seats === 1 ? "seat" : "seats"} included
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Seats grow as your portfolio grows, up to 10 managers per account.
            </p>
          </div>

          <div className="mt-5 flex gap-3">
            <BackButton onClick={() => setStep(0)} />
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-action text-sm font-semibold text-primary-foreground hover:bg-action/90"
            >
              Continue <ArrowRight weight="duotone" className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6">
          <p className="font-display text-base font-bold text-navy">Invite your property managers</p>
          <p className="tnum mt-1 text-sm text-muted-foreground">
            {managers.length} of {seats} seats used · optional, you can do this later
          </p>

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const value = managerEmail.trim();
              if (!value.includes("@")) { toast.error("Enter a valid email address."); return; }
              if (managers.length >= seats) {
                toast.error(`Your plan includes ${seats} manager seats. Add more units to unlock more.`);
                return;
              }
              setManagers((m) => [...m, value]);
              setManagerEmail("");
            }}
          >
            <input
              type="email"
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              placeholder="manager@example.ca"
              className={`${authField} mt-0 flex-1`}
            />
            <button
              type="submit"
              disabled={managers.length >= seats}
              className="min-h-12 shrink-0 rounded-full border border-border bg-card/80 px-4 text-sm font-semibold text-navy hover:bg-navy-soft disabled:opacity-40"
            >
              Add
            </button>
          </form>

          <ul className="mt-3 space-y-2">
            {managers.map((m) => (
              <li key={m} className="flex items-center justify-between gap-2 rounded-xl bg-surface-sunk px-3 py-2 text-sm">
                <span className="truncate text-navy">{m}</span>
                <button type="button" className="text-xs font-semibold text-maple" onClick={() => setManagers((prev) => prev.filter((x) => x !== m))}>
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex gap-3">
            <BackButton onClick={() => setStep(1)} />
            <button
              type="button"
              onClick={() => {
                toast.success("Account ready — welcome to Keyhold.");
                navigate({ to: "/app" });
              }}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-action text-sm font-semibold text-primary-foreground hover:bg-action/90"
            >
              <CheckCircle weight="duotone" className="h-5 w-5" aria-hidden="true" />
              Finish and open Keyhold
            </button>
          </div>

          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <House weight="duotone" className="mt-0.5 h-4 w-4 shrink-0 text-navy" aria-hidden="true" />
            Tenants don&apos;t sign up here — you invite them from a unit and they get their own portal.
          </p>
        </div>
      )}
    </AuthShell>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-card/80 px-5 text-sm font-semibold text-navy hover:bg-navy-soft"
    >
      <ArrowLeft weight="duotone" className="h-5 w-5" aria-hidden="true" />
      Back
    </button>
  );
}
