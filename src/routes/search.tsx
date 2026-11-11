import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon, ShieldAlert } from "lucide-react";
import { searchQuery } from "@/lib/catalog/queries";
import type { Kind, TitleSummary } from "@/lib/catalog/types";
import { primaryRating } from "@/lib/catalog/format";
import { compatibleProviders, PROVIDER_REFERENCES } from "@/lib/providers/registry";
import { TitleCard, TitleCardSkeleton } from "@/components/rock/TitleCard";
import { PageError, SourceErrors } from "@/components/rock/PageStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchParams {
  q: string;
  type?: Kind | undefined;
  year?: number | undefined;
  genre?: string | undefined;
  rating?: number | undefined;
  lang?: string | undefined;
  avail?: "available" | undefined;
}

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => {
    const out: SearchParams = { q: typeof s.q === "string" ? s.q.slice(0, 100) : "" };
    if (s.type === "movie" || s.type === "series" || s.type === "anime") out.type = s.type;
    if (Number(s.year) > 1900) out.year = Number(s.year);
    if (typeof s.genre === "string" && s.genre) out.genre = s.genre;
    if (Number(s.rating) > 0) out.rating = Number(s.rating);
    if (typeof s.lang === "string" && s.lang) out.lang = s.lang;
    if (s.avail === "available") out.avail = "available";
    return out;
  },
  loaderDeps: ({ search }) => ({ q: search.q.trim() }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(searchQuery(deps.q)).then(() => undefined),
  head: () => ({
    meta: [
      { title: "Search — ROCK PLAY" },
      { name: "description", content: "Search released movies, series and anime across every ROCK PLAY catalogue." },
      { property: "og:title", content: "Search — ROCK PLAY" },
      { property: "og:description", content: "Search released movies, series and anime." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  pendingComponent: SearchPending,
  errorComponent: ({ error }) => <PageError error={error} />,
  notFoundComponent: () => <PageError error={new Error("Not found")} />,
  component: SearchPage,
});

function SearchBox({ initial }: { initial: string }) {
  const navigate = useNavigate({ from: "/search" });
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial]);
  useEffect(() => {
    if (value.trim() === initial.trim()) return;
    const t = window.setTimeout(
      () => navigate({ search: (prev) => ({ ...prev, q: value }), replace: true, resetScroll: false }),
      400,
    );
    return () => window.clearTimeout(t);
  }, [value, initial, navigate]);
  return (
    <div className="relative">
      <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        autoFocus
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search movies, series, anime…"
        aria-label="Search titles"
        className="h-14 rounded-lg border-border bg-surface pl-12 text-lg"
      />
    </div>
  );
}

function SearchPending() {
  const { q } = Route.useSearch();
  return (
    <div className="mx-auto max-w-[1800px] px-4 pt-24 md:px-10">
      <SearchBox initial={q} />
      <div className="mt-8 flex flex-wrap gap-4">
        {Array.from({ length: 12 }, (_, i) => (
          <TitleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function SearchPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const { data } = useSuspenseQuery(searchQuery(search.q.trim()));

  const genres = useMemo(() => [...new Set(data.results.flatMap((r) => r.genres))].sort(), [data.results]);
  const languages = useMemo(
    () => [...new Set(data.results.map((r) => r.language).filter((x): x is string => !!x))].sort(),
    [data.results],
  );

  const filtered = data.results.filter((t: TitleSummary) => {
    if (search.type && t.kind !== search.type) return false;
    if (search.year && t.year !== search.year) return false;
    if (search.genre && !t.genres.includes(search.genre)) return false;
    if (search.lang && t.language !== search.lang) return false;
    if (search.rating) {
      const r = primaryRating(t);
      if (!r || r.value == null || (r.value / r.scale) * 10 < search.rating) return false;
    }
    if (search.avail === "available") return false; // no authorised provider holds any title yet
    return true;
  });

  const set = (patch: Partial<SearchParams>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true, resetScroll: false });

  const authorised = (["movie", "series", "anime"] as const).reduce((n, k) => n + compatibleProviders(k).length, 0);

  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-16 pt-24 md:px-10">
      <SearchBox initial={search.q} />

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
        {([undefined, "movie", "series", "anime"] as const).map((k) => (
          <Button key={k ?? "all"} variant="chip" size="sm" data-active={search.type === k} onClick={() => set({ type: k })}>
            {k ? { movie: "Movies", series: "Series", anime: "Anime" }[k] : "All"}
          </Button>
        ))}
        <Filter label="Year" value={search.year ? String(search.year) : ""} onChange={(v) => set({ year: v ? Number(v) : undefined })}>
          {Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Filter>
        <Filter label="Genre" value={search.genre ?? ""} onChange={(v) => set({ genre: v || undefined })}>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </Filter>
        <Filter label="Rating" value={search.rating ? String(search.rating) : ""} onChange={(v) => set({ rating: v ? Number(v) : undefined })}>
          {[9, 8, 7, 6, 5].map((r) => (
            <option key={r} value={r}>{r}+ / 10</option>
          ))}
        </Filter>
        <Filter label="Language" value={search.lang ?? ""} onChange={(v) => set({ lang: v || undefined })}>
          {languages.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </Filter>
        <Filter
          label="Availability"
          value={search.avail ?? ""}
          onChange={(v) => set({ avail: v === "available" ? "available" : undefined })}
        >
          <option value="available">Playable now</option>
        </Filter>
      </div>

      <SourceErrors errors={data.errors} />

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_320px]">
        <section aria-label="Catalogue results">
          <h2 className="font-display text-2xl font-bold uppercase">
            {search.q.trim().length < 2 ? "Start typing to search" : `Catalogue · ${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
          </h2>
          {search.q.trim().length >= 2 && filtered.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {search.avail ? "No title is playable yet — no authorised provider is installed." : "No released titles match. Try another spelling or remove a filter."}
            </p>
          )}
          <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-4 gap-y-6 lg:grid-cols-[repeat(auto-fill,minmax(170px,1fr))]">
            {filtered.map((t) => (
              <li key={`${t.kind}:${t.id}`}>
                <TitleCard t={t} showKind className="w-full sm:w-full lg:w-full" />
              </li>
            ))}
          </ul>
        </section>
        <aside aria-label="Provider availability" className="h-fit rounded-lg border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold uppercase">
            <ShieldAlert className="h-5 w-5 text-primary" /> Provider availability
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Being in the catalogue doesn't mean a title can be played. ROCK PLAY only checks providers that are authorised.
          </p>
          <p className="mt-3 text-sm">
            <span className="font-semibold">{authorised}</span> authorised provider{authorised === 1 ? "" : "s"} searched ·{" "}
            <span className="font-semibold">0</span> matches
          </p>
          <ul className="mt-3 space-y-1.5 text-xs">
            {PROVIDER_REFERENCES.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <span className="text-muted-foreground">{p.name}</span>
                <span className="text-warning">skipped · not authorised</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-active={!!value}
        className="h-8 cursor-pointer appearance-none rounded-full border border-border bg-surface px-3 pr-7 text-xs text-muted-foreground hover:text-foreground data-[active=true]:border-foreground data-[active=true]:bg-foreground data-[active=true]:text-background"
      >
        <option value="">{label}: any</option>
        {children}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">▾</span>
    </label>
  );
}
