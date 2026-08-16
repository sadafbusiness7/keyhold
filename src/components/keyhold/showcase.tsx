import { applyZoneDark } from "@/lib/theme";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Pinned 3D parallax stage. Layers marked with data-depth move, tilt and
 * scale on scrub, giving a deep, cinematic reveal of the dashboard shots.
 * With reduced motion the stage renders flat and static (no pin, no tilt).
 */
export function ParallaxStage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    if (!wrap || !stage || prefersReduced()) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const layers = gsap.utils.toArray<HTMLElement>("[data-depth]", stage);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2,
        },
      });

      // Whole stage settles from a steep tilt to flat as you scroll through.
      tl.fromTo(
        stage,
        { rotateX: 16, rotateY: -8, scale: 0.9 },
        { rotateX: 0, rotateY: 0, scale: 1, ease: "none" },
        0,
      );

      layers.forEach((layer) => {
        const depth = Number(layer.dataset["depth"] ?? 0);
        tl.fromTo(
          layer,
          { yPercent: 18 * depth, z: -180 * depth, opacity: depth > 1 ? 0.35 : 0.6 },
          { yPercent: -14 * depth, z: 60 * depth, opacity: 1, ease: "none", force3D: true },
          0,
        );
      });
    }, wrap);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapRef} className={className}>
      <div className="sticky top-0 flex min-h-dvh items-center overflow-hidden py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6" style={{ perspective: "1400px" }}>
          <div
            ref={stageRef}
            className="relative"
            style={{ transformStyle: "preserve-3d", willChange: "transform" }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Switches the whole site to dark while this section owns the viewport,
 * and switches back when you scroll away. Works with reduced motion too —
 * the theme just changes without the crossfade.
 */
/**
 * Screenshot wrapper: gentle scroll parallax plus a pointer-driven 3D tilt,
 * so product shots feel alive instead of pasted in. Static with reduced motion.
 */
export function TiltCard({
  children,
  className,
  parallax = 40,
}: {
  children: React.ReactNode;
  className?: string;
  parallax?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner || prefersReduced()) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        inner,
        { yPercent: parallax / 8 },
        {
          yPercent: -parallax / 8,
          ease: "none",
          force3D: true,
          scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: 0.6 },
        },
      );
    }, wrap);

    const rx = gsap.quickTo(inner, "rotateX", { duration: 0.5, ease: "power3.out" });
    const ry = gsap.quickTo(inner, "rotateY", { duration: 0.5, ease: "power3.out" });
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 9);
      rx(-py * 7);
    };
    const onLeave = () => {
      rx(0);
      ry(0);
    };
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);

    return () => {
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      ctx.revert();
    };
  }, [parallax]);

  return (
    <div ref={wrapRef} className={className} style={{ perspective: "1200px" }}>
      <div ref={innerRef} style={{ transformStyle: "preserve-3d", willChange: "transform" }}>
        {children}
      </div>
    </div>
  );
}

/**
 * Switches the whole site to dark while this section owns the viewport,
 * and switches back when you scroll away.
 */
export function DarkModeZone({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = (on: boolean) => applyZoneDark(on);

    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        set(e.isIntersecting && e.intersectionRatio > 0.35);
      },
      { threshold: [0, 0.35, 0.6, 1] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      set(false);
    };
  }, []);

  return (
    <section ref={ref} className={className}>
      {children}
    </section>
  );
}

export type DeckSlide = { key: string; label: string; node: React.ReactNode };

/**
 * One pinned stage that walks through a deck of dashboard shots as you scroll.
 * Each slide gets a generous scroll budget so there's time to read it, and
 * slides cross-fade with a relaxed rise. Fully fluid: the stack is a CSS grid
 * with every slide in the same cell, so no absolute positioning or measuring.
 */
export function ScrollDeck({
  slides,
  header,
}: {
  slides: DeckSlide[];
  header?: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let raf = 0;
    const read = () => {
      const r = wrap.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      setProgress(p);
      setActive(Math.min(slides.length - 1, Math.floor(p * slides.length * 0.9999)));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [slides.length]);

  const goTo = (i: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const total = wrap.offsetHeight - window.innerHeight;
    const y = wrap.offsetTop + total * ((i + 0.5) / slides.length);
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div ref={wrapRef} style={{ height: `calc(100svh + ${slides.length * 85}svh)` }}>
      <div className="sticky top-0 flex min-h-svh flex-col justify-center overflow-hidden py-10 sm:py-14">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          {header}

          {/* step rail */}
          <div className="mx-auto mt-5 mb-5 flex max-w-2xl items-center justify-center gap-1.5 sm:gap-2">
            {slides.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => goTo(i)}
                aria-label={s.label}
                aria-current={i === active}
                className={`group h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                  i === active ? "bg-action" : i < active ? "bg-action/35" : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.14em] text-action tnum">
            {String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")} ·{" "}
            <span className="text-muted-foreground">{slides[active]?.label}</span>
          </p>

          <div className="grid">
            {slides.map((s, i) => (
              <div
                key={s.key}
                aria-hidden={i !== active}
                className={`col-start-1 row-start-1 min-w-0 transition-all duration-700 ease-out motion-reduce:transition-none ${
                  i === active
                    ? "translate-y-0 scale-100 opacity-100"
                    : `pointer-events-none scale-[0.97] opacity-0 ${i < active ? "-translate-y-5" : "translate-y-5"}`
                }`}
              >
                {s.node}
              </div>
            ))}
          </div>
        </div>

        <div aria-hidden="true" className="mx-auto mt-6 h-0.5 w-full max-w-5xl overflow-hidden rounded-full bg-border/70 px-4">
          <span className="block h-full rounded-full bg-action/70" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
