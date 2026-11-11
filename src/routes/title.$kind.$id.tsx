import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, Plus, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { titleQuery } from "@/lib/catalog/queries";
import type { Kind, TitleDetail } from "@/lib/catalog/types";
import { formatDate, formatRating, KIND_LABEL } from "@/lib/catalog/format";
import { library, useLibrary } from "@/lib/library/store";
import { PlayButton } from "@/components/rock/PlayDialog";
import { TrailerButton } from "@/components/rock/TrailerDialog";
import { Rail } from "@/components/rock/Rail";
import { PageError, PageNotFound } from "@/components/rock/PageStates";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const KINDS: Kind[] = ["movie", "series", "anime"];

export const Route = createFileRoute("/title/$kind/$id")({
  params: {
    parse: (p: { kind: string; id: string }) => {
      if (!KINDS.includes(p.kind as Kind)) throw notFound();
      return { kind: p.kind as Kind, id: p.id };
    },
    stringify: (p: { kind: Kind; id: string }) => ({ kind: p.kind, id: p.id }),
  },
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(titleQuery(params.kind, params.id));
    if (!d) throw notFound();
    return { title: d.title, overview: d.overview, poster: d.poster, kind: d.kind, year: d.year };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Unavailable — ROCK PLAY" }, { name: "robots", content: "noindex" }] };
    const t = `${loaderData.title}${loaderData.year ? ` (${loaderData.year})` : ""} — ROCK PLAY`;
    const d = (loaderData.overview ?? `${KIND_LABEL[loaderData.kind]} on ROCK PLAY`).slice(0, 155);
    const img = loaderData.poster?.startsWith("https://") ? loaderData.poster : null;
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "video.other" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
      ],
    };
  },
  errorComponent: ({ error }) => <PageError error={error} />,
  notFoundComponent: () => <PageNotFound />,
  component: TitlePage,
});

function TitlePage() {
  const { kind, id } = Route.useParams();
  const { data } = useSuspenseQuery(titleQuery(kind, id));
  if (!data) return <PageNotFound />;
  return <Detail t={data} />;
}

function Detail({ t }: { t: TitleDetail }) {
  const lib = useLibrary();
  const inList = library.isInList(lib, t);
  useEffect(() => {
    library.recordView(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.kind, t.id]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: t.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* user cancelled */
    }
  };

  const date = formatDate(t.releaseDate);
  const bg = t.backdrop ?? t.poster;

  return (
    <article className="pb-16">
      <section className="relative isolate min-h-[88svh] overflow-hidden">
        {bg && (
          <img
            src={bg}
            alt=""
            className={cn(
              "absolute inset-0 -z-10 h-full w-full object-cover object-[center_25%]",
              !t.backdrop && "scale-125 opacity-50 blur-2xl",
            )}
          />
        )}
        <div className="absolute inset-0 -z-10 bg-hero-fade-x" />
        <div className="absolute inset-0 -z-10 bg-hero-fade-y" />
        <div className="mx-auto flex min-h-[88svh] max-w-[1800px] flex-col justify-end gap-8 px-4 pb-12 pt-28 md:flex-row md:items-end md:px-10">
          {t.poster && (
            <img
              src={t.poster}
              alt={`${t.title} poster`}
              className="w-40 shrink-0 rounded-lg shadow-card ring-1 ring-border md:w-64"
            />
          )}
          <div className="max-w-3xl animate-rise">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              {KIND_LABEL[t.kind]} · {t.genres.slice(0, 3).join(" · ")}
            </p>
            <h1 className="text-balance font-display text-5xl font-black uppercase leading-[0.9] md:text-7xl">{t.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/85">
              {date && (
                <span>
                  {t.releaseLabel} <span className="font-semibold text-foreground">{date}</span>
                </span>
              )}
              {t.duration && <span>{t.duration}</span>}
              {t.episodeInfo && <span>{t.episodeInfo}</span>}
              {t.ageRating && <span className="rounded-sm border border-foreground/40 px-1.5 text-xs">{t.ageRating}</span>}
            </div>
            <Ratings t={t} />
            {t.overview && <p className="mt-5 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-foreground/85 md:text-base">{t.overview}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              <PlayButton t={t} />
              <TrailerButton trailer={t.trailer} title={t.title} />
              <Button
                variant="glass"
                size="xl"
                aria-pressed={inList}
                onClick={() => {
                  const added = library.toggleList(t);
                  toast(added ? "Added to My List" : "Removed from My List");
                }}
              >
                {inList ? <Check /> : <Plus />} {inList ? "In My List" : "My List"}
              </Button>
              <Button variant="glass" size="xl" onClick={share} aria-label="Share">
                <Share2 /> Share
              </Button>
              {t.similar.length > 0 && (
                <Button variant="glass" size="xl" asChild>
                  <a href="#more-like-this">
                    <Sparkles /> More Like This
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1800px] gap-10 px-4 md:px-10 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-10">
          {t.kind !== "movie" && t.episodes.length > 0 && <Episodes t={t} />}
          <Cast t={t} />
        </div>
        <aside className="space-y-6">
          <Facts t={t} />
        </aside>
      </div>

      {t.similar.length > 0 && (
        <div id="more-like-this" className="mt-12 scroll-mt-20">
          <Rail title="More Like This" items={t.similar} />
        </div>
      )}
    </article>
  );
}

function Ratings({ t }: { t: TitleDetail }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2 text-xs" aria-label="Ratings">
      {t.ratings.map((r) => {
        const v = formatRating(r);
        return (
          <li key={r.source} className="rounded-md border border-border bg-background/50 px-2.5 py-1.5 backdrop-blur">
            <span className="text-muted-foreground">{r.source} </span>
            {v ? <span className="font-bold text-warning">{v}</span> : <span className="text-muted-foreground">no rating yet</span>}
          </li>
        );
      })}
      {t.ratings.length === 0 && (
        <li className="rounded-md border border-border bg-background/50 px-2.5 py-1.5 text-muted-foreground backdrop-blur">
          {t.source}: no audience rating published
        </li>
      )}
      <li className="rounded-md border border-dashed border-border bg-background/40 px-2.5 py-1.5 text-muted-foreground backdrop-blur">
        IMDb: unavailable — needs licensed access
        {t.imdbId && (
          <a
            href={`https://www.imdb.com/title/${t.imdbId}/`}
            target="_blank"
            rel="noreferrer"
            className="ml-1.5 inline-flex items-center gap-0.5 text-foreground underline"
          >
            view <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </li>
    </ul>
  );
}

function Facts({ t }: { t: TitleDetail }) {
  const rows = [
    t.director ? { label: t.directorLabel, value: t.director } : { label: t.directorLabel, value: "Not listed by source" },
    { label: "Genres", value: t.genres.join(", ") || "Not listed" },
    ...(t.language ? [{ label: "Language", value: t.language }] : []),
    ...t.production.filter((p) => p.label !== "Language"),
  ];
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h2 className="font-display text-xl font-bold uppercase">Details</h2>
      <dl className="mt-3 space-y-3 text-sm">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">{r.label}</dt>
            <dd className="mt-0.5 break-words capitalize-first text-foreground">
              {/^https?:\/\//.test(r.value) ? (
                <a href={r.value} target="_blank" rel="noreferrer" className="underline">
                  {new URL(r.value).host}
                </a>
              ) : (
                r.value
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
        Metadata from{" "}
        {t.sourceUrl ? (
          <a href={t.sourceUrl} target="_blank" rel="noreferrer" className="underline">
            {t.source}
          </a>
        ) : (
          t.source
        )}
        .
      </p>
    </div>
  );
}

function Cast({ t }: { t: TitleDetail }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-bold uppercase">{t.kind === "anime" ? "Characters & Voice Cast" : "Cast"}</h2>
      {t.cast.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">The metadata source doesn't list the cast for this title.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {t.cast.map((p) => (
            <li key={`${p.name}-${p.role}`} className="flex items-center gap-3 rounded-lg bg-surface p-2">
              {p.image ? (
                <img src={p.image} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-md object-cover" />
              ) : (
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-surface-raised font-display text-xl font-bold text-muted-foreground">
                  {p.name[0]}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                {p.role && <p className="truncate text-xs text-muted-foreground">{p.role}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Episodes({ t }: { t: TitleDetail }) {
  const seasons = useMemo(() => [...new Set(t.episodes.map((e) => e.season))], [t.episodes]);
  const [season, setSeason] = useState(seasons.at(-1) ?? 1);
  const list = t.episodes.filter((e) => e.season === season);
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-2xl font-bold uppercase">Episodes</h2>
        {seasons.length > 1 && (
          <div className="rail-scroll max-w-full">
            <div className="flex w-max gap-1.5">
              {seasons.map((s) => (
                <Button key={s} variant="chip" size="sm" data-active={s === season} onClick={() => setSeason(s)}>
                  Season {s}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
      {t.kind === "series" && t.seasons.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t.seasons.length} released season{t.seasons.length === 1 ? "" : "s"} · {t.episodes.length} aired episodes
        </p>
      )}
      <ol className="mt-4 max-h-[480px] divide-y divide-border overflow-y-auto rounded-lg border border-border bg-surface">
        {[...list].reverse().map((e) => (
          <li key={`${e.season}-${e.number}-${e.name}`} className="flex items-center gap-4 px-4 py-3 text-sm">
            <span className="w-10 shrink-0 font-display text-xl font-bold text-muted-foreground">{e.number ?? "SP"}</span>
            <span className="min-w-0 flex-1 truncate">{e.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {[formatDate(e.airdate), e.runtime ? `${e.runtime}m` : null].filter(Boolean).join(" · ")}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
