import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { homeQuery } from "@/lib/catalog/queries";
import { Hero } from "@/components/rock/Hero";
import { Rail } from "@/components/rock/Rail";
import { BrowseSkeleton, PageError, SourceErrors } from "@/components/rock/PageStates";
import { ContinueWatchingRail, RecommendedRail } from "@/components/rock/PersonalRows";
import { Button } from "@/components/ui/button";

type Show = "movie" | "series" | "anime";
const FILTERS: { value: Show | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "movie", label: "Movies" },
  { value: "series", label: "Series" },
  { value: "anime", label: "Anime" },
];

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): { show?: Show } => {
    const v = s["show"];
    return v === "movie" || v === "series" || v === "anime" ? { show: v } : {};
  },
  head: () => ({
    meta: [
      { title: "ROCK PLAY — Latest Movies, Series & Anime" },
      { name: "description", content: "The newest released movies, fresh series episodes and new anime — all in one cinematic home." },
      { property: "og:title", content: "ROCK PLAY — Latest Movies, Series & Anime" },
      { property: "og:description", content: "The newest released movies, fresh series episodes and new anime." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery()).then(() => undefined),
  pendingComponent: BrowseSkeleton,
  errorComponent: ({ error }) => <PageError error={error} />,
  notFoundComponent: () => <PageError error={new Error("Not found")} />,
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(homeQuery());
  const { show } = Route.useSearch();
  const rows = data.rows.filter((r) => !show || r.kind === show || (r.kind === "mixed" && r.id !== "live-tv"));
  const shownRows = show
    ? rows.map((r) => (r.kind === "mixed" ? { ...r, items: r.items.filter((i) => i.kind === show) } : r))
    : rows;
  const featured = show ? data.featured.filter((f) => f.kind === show) : data.featured;
  const before = shownRows.slice(0, 3);
  const after = shownRows.slice(3);

  return (
    <div className="pb-16">
      <Hero items={featured.length ? featured : data.featured} />
      <div className="relative z-10 -mt-12 space-y-10 md:-mt-16">
        <div className="flex flex-wrap items-center gap-2 px-4 md:px-10" role="group" aria-label="Filter by type">
          {FILTERS.map((f) => (
            <Button key={f.label} variant="chip" size="sm" data-active={show === f.value} asChild>
              <Link to="/" search={f.value ? { show: f.value } : {}} resetScroll={false}>
                {f.label}
              </Link>
            </Button>
          ))}
        </div>
        <SourceErrors errors={data.errors} />
        {before.map((r) => (
          <Rail key={r.id} title={r.title} items={r.items} notice={r.notice} showKind={r.kind === "mixed"} />
        ))}
        {!show && <ContinueWatchingRail />}
        {after.map((r) => (
          <Rail key={r.id} title={r.title} items={r.items} notice={r.notice} showKind={r.kind === "mixed"} />
        ))}
        {!show && <RecommendedRail rows={data.rows} />}
      </div>
    </div>
  );
}
