import { Link } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import type { TitleSummary } from "@/lib/catalog/types";
import { formatDate, KIND_LABEL } from "@/lib/catalog/format";
import { Button } from "@/components/ui/button";
import { PlayButton } from "./PlayDialog";
import { RatingPill } from "./TitleCard";
import { cn } from "@/lib/utils";

export function Hero({ items }: { items: TitleSummary[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || items.length < 2) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % items.length), 9000);
    return () => window.clearInterval(t);
  }, [paused, items.length]);

  if (!items.length) return <div className="h-24" />;
  const t = items[Math.min(i, items.length - 1)];
  const date = formatDate(t.releaseDate);

  return (
    <section
      className="relative isolate h-[78svh] min-h-[520px] max-h-[860px] w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured titles"
    >
      <div key={`${t.kind}:${t.id}`} className="absolute inset-0 -z-10 animate-in fade-in duration-1000">
        {t.backdrop ? (
          <img src={t.backdrop} alt="" className="h-full w-full object-cover object-[center_25%] animate-kenburns" />
        ) : t.poster ? (
          <>
            <img src={t.poster} alt="" className="h-full w-full scale-125 object-cover opacity-60 blur-2xl" />
            <img
              src={t.poster}
              alt=""
              className="absolute right-[8%] top-1/2 hidden h-[72%] -translate-y-1/2 rotate-2 rounded-lg shadow-card ring-1 ring-border md:block"
            />
          </>
        ) : null}
        <div className="absolute inset-0 bg-hero-fade-x" />
        <div className="absolute inset-0 bg-hero-fade-y" />
      </div>

      <div key={`c-${t.kind}:${t.id}`} className="mx-auto flex h-full max-w-[1800px] flex-col justify-end px-4 pb-16 md:px-10 md:pb-24">
        <div className="max-w-2xl animate-rise">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-primary">
            <span className="h-px w-8 bg-primary" /> {KIND_LABEL[t.kind]} · Featured
          </p>
          <h1 className="text-balance font-display text-5xl font-black uppercase leading-[0.9] text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
            {t.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/85">
            <RatingPill t={t} className="text-sm" />
            {t.year && <span>{t.year}</span>}
            {t.ageRating && <span className="rounded-sm border border-foreground/40 px-1.5 text-xs">{t.ageRating}</span>}
            {t.duration && <span>{t.duration}</span>}
            {t.episodeInfo && <span>{t.episodeInfo}</span>}
            {t.genres.slice(0, 3).length > 0 && <span className="text-muted-foreground">{t.genres.slice(0, 3).join(" · ")}</span>}
          </div>
          {date && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t.releaseLabel} {date} · via {t.source}
            </p>
          )}
          {t.overview && <p className="mt-4 line-clamp-3 max-w-xl text-sm text-foreground/80 md:text-base">{t.overview}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <PlayButton t={t} />
            <Button variant="glass" size="xl" asChild>
              <Link to="/title/$kind/$id" params={{ kind: t.kind, id: t.id }}>
                <Info /> More Info
              </Link>
            </Button>
          </div>
        </div>
        {items.length > 1 && (
          <div className="mt-8 flex gap-2" role="tablist" aria-label="Choose featured title">
            {items.map((x, idx) => (
              <button
                key={`${x.kind}:${x.id}`}
                role="tab"
                aria-selected={idx === i}
                aria-label={x.title}
                onClick={() => setI(idx)}
                className={cn(
                  "h-1 rounded-full transition-all",
                  idx === i ? "w-10 bg-primary" : "w-5 bg-foreground/30 hover:bg-foreground/60",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[78svh] min-h-[520px] max-h-[860px] w-full bg-surface">
      <div className="absolute bottom-24 left-4 space-y-4 md:left-10">
        <div className="h-4 w-32 animate-pulse rounded bg-surface-raised" />
        <div className="h-20 w-[min(560px,80vw)] animate-pulse rounded bg-surface-raised" />
        <div className="h-4 w-80 animate-pulse rounded bg-surface-raised" />
        <div className="flex gap-3">
          <div className="h-12 w-32 animate-pulse rounded bg-surface-raised" />
          <div className="h-12 w-36 animate-pulse rounded bg-surface-raised" />
        </div>
      </div>
    </div>
  );
}
