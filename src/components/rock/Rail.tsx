import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import type { TitleSummary } from "@/lib/catalog/types";
import { TitleCard, TitleCardSkeleton } from "./TitleCard";

interface RailProps {
  title: string;
  items?: TitleSummary[];
  notice?: string | undefined;
  empty?: ReactNode;
  showKind?: boolean | undefined;
  action?: ReactNode;
}

/**
 * Horizontal carousel. Uses native overflow scrolling only: no scroll-snap, no wheel
 * listeners, so vertical page scrolling is never trapped.
 */
export function Rail({ title, items = [], notice, empty, showKind, action }: RailProps) {
  const ref = useRef<HTMLDivElement>(null);
  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  const hasItems = items.length > 0;

  return (
    <section className="group/rail relative" aria-label={title}>
      <div className="mb-3 flex items-end justify-between gap-4 px-4 md:px-10">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-foreground md:text-2xl">{title}</h2>
        {action}
      </div>
      {notice || !hasItems ? (
        <div className="mx-4 flex items-start gap-3 rounded-lg border border-dashed border-border bg-surface/60 p-4 text-sm text-muted-foreground md:mx-10">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <div>{notice ?? empty ?? "Nothing here right now."}</div>
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            aria-label={`Scroll ${title} left`}
            onClick={() => page(-1)}
            className="absolute inset-y-0 left-0 z-10 hidden w-10 items-center justify-center bg-gradient-to-r from-background to-transparent text-foreground opacity-0 transition-opacity group-hover/rail:opacity-100 focus-visible:opacity-100 md:flex"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <div ref={ref} className="rail-scroll" tabIndex={-1}>
            <ul className="flex w-max gap-3 px-4 pb-2 pt-1 md:gap-4 md:px-10">
              {items.map((t) => (
                <li key={`${t.kind}:${t.id}`}>
                  <TitleCard t={t} showKind={showKind} />
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            aria-label={`Scroll ${title} right`}
            onClick={() => page(1)}
            className="absolute inset-y-0 right-0 z-10 hidden w-10 items-center justify-center bg-gradient-to-l from-background to-transparent text-foreground opacity-0 transition-opacity group-hover/rail:opacity-100 focus-visible:opacity-100 md:flex"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </div>
      )}
    </section>
  );
}

export function RailSkeleton() {
  return (
    <section aria-hidden className="px-4 md:px-10">
      <div className="mb-3 h-6 w-48 animate-pulse rounded bg-surface-raised" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 8 }, (_, i) => (
          <TitleCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
