import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { TitleSummary } from "@/lib/catalog/types";
import { formatDate, formatRating, KIND_LABEL, primaryRating } from "@/lib/catalog/format";
import { cn } from "@/lib/utils";

export function RatingPill({ t, className }: { t: TitleSummary; className?: string }) {
  const r = primaryRating(t);
  if (!r) {
    return (
      <span className={cn("text-[11px] text-muted-foreground/80", className)} title="No rating published by the source">
        Not rated
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold text-warning", className)}>
      <Star className="h-3 w-3 fill-current" aria-hidden />
      {formatRating(r)}
      <span className="font-normal text-muted-foreground">{r.source}</span>
    </span>
  );
}

export function TitleCard({ t, showKind = false, className }: { t: TitleSummary; showKind?: boolean | undefined; className?: string | undefined }) {
  const date = formatDate(t.releaseDate);
  const genre = t.genres[0];
  return (
    <Link
      to="/title/$kind/$id"
      params={{ kind: t.kind, id: t.id }}
      className={cn("group block w-[140px] shrink-0 sm:w-[160px] lg:w-[184px] focus-visible:outline-none", className)}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-surface-raised shadow-card ring-1 ring-border transition-all duration-300 group-hover:-translate-y-1 group-hover:ring-primary/70 group-focus-visible:ring-2 group-focus-visible:ring-primary">
        {t.poster ? (
          <img
            src={t.poster}
            alt={`${t.title} poster`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center p-3 text-center font-display text-lg font-bold uppercase text-muted-foreground">
            {t.title}
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-1.5">
          {t.ageRating ? (
            <span className="rounded-sm bg-background/80 px-1.5 py-0.5 text-[10px] font-bold text-foreground backdrop-blur">
              {t.ageRating}
            </span>
          ) : (
            <span />
          )}
          {showKind && (
            <span className="rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
              {KIND_LABEL[t.kind]}
            </span>
          )}
        </div>
        {t.episodeInfo && (
          <span className="absolute bottom-1.5 left-1.5 rounded-sm bg-background/85 px-1.5 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur">
            {t.episodeInfo}
          </span>
        )}
      </div>
      <div className="mt-2 space-y-0.5 px-0.5">
        <p className="line-clamp-1 text-sm font-semibold text-foreground">{t.title}</p>
        <p className="line-clamp-1 text-[11px] text-muted-foreground">
          {[t.year, genre, t.duration].filter(Boolean).join(" · ")}
        </p>
        <RatingPill t={t} />
        {date && (
          <p className="line-clamp-1 text-[10px] text-muted-foreground/80">
            {t.releaseLabel} {date}
          </p>
        )}
      </div>
    </Link>
  );
}

export function TitleCardSkeleton() {
  return (
    <div className="w-[140px] shrink-0 sm:w-[160px] lg:w-[184px]">
      <div className="aspect-[2/3] animate-pulse rounded-md bg-surface-raised" />
      <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-surface-raised" />
      <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded bg-surface-raised" />
    </div>
  );
}
