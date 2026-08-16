import { useEffect, useRef, useState } from "react";

const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type LottieComponent = React.ComponentType<Record<string, unknown>>;

/**
 * Lazily loads both the Lottie player and its animation JSON, only once the
 * placeholder scrolls into view — so nothing blocks first paint.
 * With reduced motion the animation renders frozen on its first frame.
 */
export function LazyLottie({
  getData,
  className,
  loop = false,
}: {
  getData: () => Promise<{ default: unknown }>;
  className?: string;
  loop?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [Player, setPlayer] = useState<LottieComponent | null>(null);
  const [data, setData] = useState<unknown>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let alive = true;
    Promise.all([import("lottie-react"), getData()]).then(([mod, json]) => {
      if (!alive) return;
      const resolved = (mod as { default?: unknown }).default;
      const player = (
        typeof resolved === "function" || (resolved && typeof resolved === "object" && "$$typeof" in (resolved as object))
          ? resolved
          : (resolved as { default?: unknown } | undefined)?.default
      ) as LottieComponent;
      setPlayer(() => player);
      setData(json.default);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const reduced = prefersReduced();

  return (
    <div ref={ref} className={className} aria-hidden="true">
      {Player && data ? (
        <Player
          animationData={data}
          loop={reduced ? false : loop}
          autoplay={!reduced}
          initialSegment={reduced ? [0, 1] : undefined}
          style={{ width: "100%", height: "100%" }}
        />
      ) : null}
    </div>
  );
}
