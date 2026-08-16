import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { EnvelopeSimple, Eye, EyeSlash, SignIn as SignInIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { AuthShell, SocialButtons, OrDivider, authField } from "@/components/keyhold/auth-shell";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign in — Keyhold" },
      { name: "description", content: "Sign in to Keyhold with email and password, Google or Apple — as a landlord, property manager or tenant." },
      { property: "og:title", content: "Sign in — Keyhold" },
      { property: "og:description", content: "Landlord, property manager or tenant — sign in and pick up where you left off." },
    ],
  }),
  component: SignIn,
});

const roles = [
  { id: "landlord", label: "I'm a landlord", to: "/app" },
  { id: "pm", label: "I manage properties for owners", to: "/app" },
  { id: "tenant", label: "I rent a home", to: "/portal" },
] as const;

function SignIn() {
  const navigate = useNavigate();
  const [role, setRole] = useState<(typeof roles)[number]["id"]>("landlord");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const destination = roles.find((r) => r.id === role)!.to;

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. Your morning view is ready."
      points={[
        "Rent collected so far this month",
        "Anything overdue, pulled to the top",
        "Repairs waiting on you",
      ]}
      footer={
        <>
          New to Keyhold?{" "}
          <Link to="/signup" className="font-semibold text-action">
            Create a landlord account
          </Link>
          .
        </>
      }
    >
      <p className="mt-2 text-muted-foreground">Choose how you use Keyhold, then sign in.</p>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-navy">Who are you signing in as?</legend>
        <div className="mt-2 space-y-2">
          {roles.map((r) => (
            <label
              key={r.id}
              className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-card/80 px-3 text-sm"
            >
              <input
                type="radio"
                name="role"
                checked={role === r.id}
                onChange={() => setRole(r.id)}
                className="h-4 w-4 accent-[var(--action)]"
              />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        <SocialButtons
          onPick={(p) => {
            toast.success(`Signing in with ${p === "google" ? "Google" : "Apple"}…`);
            navigate({ to: destination });
          }}
        />
      </div>

      <OrDivider label="or use your email and password" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!email.includes("@")) {
            toast.error("Enter a valid email address.");
            return;
          }
          if (password.length < 8) {
            toast.error("Your password needs at least 8 characters.");
            return;
          }
          toast.success("Welcome back.");
          navigate({ to: destination });
        }}
      >
        <label htmlFor="email" className="text-sm font-medium">Email address</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.ca"
          className={authField}
        />

        <div className="mt-4 flex items-baseline justify-between">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <button
            type="button"
            onClick={() => toast.success("If that email exists, we sent a reset link.")}
            className="text-xs font-semibold text-action"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={`${authField} pr-12`}
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

        <button
          type="submit"
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-action text-sm font-semibold text-primary-foreground hover:bg-action/90"
        >
          <SignInIcon weight="duotone" className="h-5 w-5" aria-hidden="true" />
          Sign in
        </button>

        <button
          type="button"
          onClick={() => {
            if (!email.includes("@")) {
              toast.error("Enter your email first and we'll send a link.");
              return;
            }
            toast.success("Check your inbox — we sent you a sign-in link.");
            navigate({ to: destination });
          }}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-card/80 text-sm font-semibold text-navy hover:bg-navy-soft"
        >
          <EnvelopeSimple weight="duotone" className="h-5 w-5" aria-hidden="true" />
          Email me a sign-in link instead
        </button>
      </form>
    </AuthShell>
  );
}
