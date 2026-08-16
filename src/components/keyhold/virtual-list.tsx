/**
 * VIRTUALISED LIST — plain windowing, no dependency.
 *
 * Long lists (rent rows, tenants, documents, search results) render only the
 * slice that's on screen plus a small overscan, so a mid-range phone stays
 * smooth. Falls back to rendering everything when the list is short.
 */
import { useCallback, useRef, useState, type ReactNode } from "react";

export function VirtualList<T>({
  items,
  rowHeight,
  height,
  overscan = 6,
  threshold = 40,
  renderRow,
  className = "",
  label,
}: {
  items: T[];
  rowHeight: number;
  /** viewport height in px */
  height: number;
  overscan?: number;
  /** below this many items, skip windowing entirely */
  threshold?: number;
  renderRow: (item: T, index: number) => ReactNode;
  className?: string;
  label?: string;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const frame = useRef<number | null>(null);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const next = e.currentTarget.scrollTop;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setScrollTop(next));
  }, []);

  if (items.length <= threshold) {
    return (
      <div
        className={`overflow-y-auto ${className}`}
        style={{ maxHeight: height }}
        aria-label={label}
      >
        {items.map((item, i) => renderRow(item, i))}
      </div>
    );
  }

  const total = items.length * rowHeight;
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(items.length, Math.ceil((scrollTop + height) / rowHeight) + overscan);
  const slice = items.slice(start, end);

  return (
    <div
      className={`overflow-y-auto ${className}`}
      style={{ height }}
      onScroll={onScroll}
      aria-label={label}
    >
      <div style={{ height: total, position: "relative" }}>
        <div style={{ position: "absolute", top: start * rowHeight, left: 0, right: 0 }}>
          {slice.map((item, i) => renderRow(item, start + i))}
        </div>
      </div>
    </div>
  );
}
