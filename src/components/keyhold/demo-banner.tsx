import { Link } from "@tanstack/react-router";
import { Info, ArrowRight } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";

export function DemoBanner() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const height = ref.current.offsetHeight;
      document.documentElement.style.setProperty('--demo-banner-height', `${height}px`);
    }
    return () => {
      document.documentElement.style.setProperty('--demo-banner-height', '0px');
    };
  }, []);

  return (
    <div ref={ref} className="relative z-50 flex items-center justify-center gap-3 bg-action px-4 py-2 text-primary-foreground shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
        <Info weight="fill" className="h-4 w-4" />
        <span>Demo Mode</span>
      </div>
      <p className="hidden text-sm font-medium sm:block">
        You&apos;re exploring a sandbox — nothing here is real and actions are simulated.
      </p>
      <p className="text-sm font-medium sm:hidden">
        Demo mode: simulated data.
      </p>
      <Link
        to="/signup"
        className="ml-2 flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-action transition-transform hover:scale-105 active:scale-95"
      >
        Start free <ArrowRight weight="bold" className="h-3 w-3" />
      </Link>
    </div>
  );
}
