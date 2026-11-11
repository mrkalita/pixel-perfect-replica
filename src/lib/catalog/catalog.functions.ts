import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { BrowseData, HomeData, Row, SearchData, TitleDetail, TitleSummary } from "./types";
import { movieDetail, MOVIE_GENRES, recentlyReleased, searchMovies, topMovies } from "./itunes.server";
import {
  latestEpisodes,
  popularSeries,
  scheduleTrending,
  searchSeries,
  seriesBackdrop,
  seriesDetail,
  topRatedSeries,
} from "./tvmaze.server";
import { animeByGenre, animeDetail, animeHome, searchAnime } from "./anilist.server";
import { dedupe, settle } from "./util.server";

const TOP_RATED_MOVIES_NOTICE =
  "The current movie source publishes no audience ratings, so ROCK PLAY won't rank movies by rating. Connect a licensed ratings source (such as TMDB) to fill this row.";
const LIVE_TV_NOTICE =
  "No authorised Live TV provider is installed yet. Channels appear here once a provider with permission to stream is added in Extensions.";

function interleave(...lists: TitleSummary[][]): TitleSummary[] {
  const out: TitleSummary[] = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  return dedupe(out);
}

async function withSeriesBackdrop(t: TitleSummary | undefined) {
  if (!t) return undefined;
  return { ...t, backdrop: (await seriesBackdrop(t.id)) ?? t.backdrop };
}

const emptyAnime = { trending: [], popular: [], top: [], newEpisodes: [] } as Awaited<ReturnType<typeof animeHome>>;

export const getHome = createServerFn({ method: "GET" }).handler(async (): Promise<HomeData> => {
  const errors: string[] = [];
  const [movies, latest, trending, topSeries, anime] = await Promise.all([
    settle("Movies", topMovies(), errors, []),
    settle("Latest episodes", latestEpisodes(2), errors, []),
    settle("Trending series", scheduleTrending(), errors, []),
    settle("Top rated series", topRatedSeries(), errors, []),
    settle("Anime", animeHome(), errors, emptyAnime),
  ]);
  const [s1, s2] = await Promise.all([withSeriesBackdrop(trending[0]), withSeriesBackdrop(trending[1])]);
  const featured = [movies[0], s1, anime.trending.find((a) => a.backdrop), movies[1], s2]
    .filter((x): x is TitleSummary => !!x)
    .slice(0, 5);

  const rows: Row[] = [
    { id: "recent-movies", title: "Recently Released Movies", kind: "movie", items: recentlyReleased(movies) },
    { id: "latest-episodes", title: "Latest Series Episodes", kind: "series", items: latest.slice(0, 30) },
    { id: "new-anime", title: "New Anime Episodes", kind: "anime", items: anime.newEpisodes.slice(0, 30) },
    { id: "trending-movies", title: "Trending Movies", kind: "movie", items: movies.slice(0, 30) },
    { id: "trending-series", title: "Trending Series", kind: "series", items: trending },
    { id: "popular-anime", title: "Popular Anime", kind: "anime", items: anime.popular },
    { id: "top-movies", title: "Top Rated Movies", kind: "movie", items: [], notice: TOP_RATED_MOVIES_NOTICE },
    { id: "top-series", title: "Top Rated Series", kind: "series", items: topSeries },
    {
      id: "popular-week",
      title: "Most Popular This Week",
      kind: "mixed",
      items: interleave(movies.slice(0, 8), trending.slice(0, 8), anime.trending.slice(0, 8)),
    },
    { id: "live-tv", title: "Live TV Highlights", kind: "mixed", items: [], notice: LIVE_TV_NOTICE },
  ];
  return { featured, rows, errors, generatedAt: new Date().toISOString() };
});

export const getMovies = createServerFn({ method: "GET" }).handler(async (): Promise<BrowseData> => {
  const errors: string[] = [];
  const picks = MOVIE_GENRES.slice(0, 8);
  const [all, ...byGenre] = await Promise.all([
    settle("Movies", topMovies(), errors, []),
    ...picks.map((g) => settle(g.name, topMovies(g.id, 30), errors, [] as TitleSummary[])),
  ]);
  return {
    featured: all.slice(0, 4),
    rows: [
      { id: "recent", title: "Recently Released", kind: "movie", items: recentlyReleased(all) },
      { id: "trending", title: "Trending Now", kind: "movie", items: all.slice(0, 30) },
      ...picks.map((g, i) => ({ id: `g-${g.id}`, title: g.name, kind: "movie" as const, items: byGenre[i] })),
    ],
    errors,
  };
});

const SERIES_GENRES = ["Drama", "Comedy", "Crime", "Action", "Science-Fiction", "Thriller", "Mystery", "Fantasy", "Horror", "Romance"];

export const getSeries = createServerFn({ method: "GET" }).handler(async (): Promise<BrowseData> => {
  const errors: string[] = [];
  const [latest, trending, popular, top] = await Promise.all([
    settle("Latest episodes", latestEpisodes(2), errors, []),
    settle("Trending", scheduleTrending(), errors, []),
    settle("Popular", popularSeries(), errors, []),
    settle("Top rated", topRatedSeries(), errors, []),
  ]);
  const pool = dedupe([...trending, ...popular, ...top]);
  const featured = (await Promise.all(trending.slice(0, 3).map(withSeriesBackdrop))).filter(
    (x): x is TitleSummary => !!x,
  );
  return {
    featured,
    rows: [
      { id: "latest", title: "Latest Episodes", kind: "series", items: latest.slice(0, 30) },
      { id: "trending", title: "Trending Series", kind: "series", items: trending },
      { id: "top", title: "Top Rated", kind: "series", items: top },
      { id: "popular", title: "All-Time Popular", kind: "series", items: popular },
      ...SERIES_GENRES.map((g) => ({
        id: `g-${g}`,
        title: g.replace("-", " "),
        kind: "series" as const,
        items: pool.filter((s) => s.genres.includes(g)).slice(0, 24),
      })).filter((r) => r.items.length >= 4),
    ],
    errors,
  };
});

export const getAnime = createServerFn({ method: "GET" }).handler(async (): Promise<BrowseData> => {
  const errors: string[] = [];
  const [home, genres] = await Promise.all([
    settle("Anime", animeHome(), errors, emptyAnime),
    settle("Anime genres", animeByGenre(), errors, []),
  ]);
  return {
    featured: home.trending.filter((a) => a.backdrop).slice(0, 4),
    rows: [
      { id: "new", title: "New Episodes", kind: "anime", items: home.newEpisodes.slice(0, 30) },
      { id: "trending", title: "Trending Anime", kind: "anime", items: home.trending },
      { id: "popular", title: "Most Popular", kind: "anime", items: home.popular },
      { id: "top", title: "Top Rated", kind: "anime", items: home.top },
      ...genres.map((g) => ({ id: `g-${g.genre}`, title: g.genre, kind: "anime" as const, items: g.items })),
    ],
    errors,
  };
});

export const getTitle = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ kind: z.enum(["movie", "series", "anime"]), id: z.string().min(1).max(40) }).parse(d))
  .handler(async ({ data }): Promise<TitleDetail | null> => {
    try {
      if (data.kind === "movie") return await movieDetail(data.id);
      if (data.kind === "series") return await seriesDetail(data.id);
      return await animeDetail(data.id);
    } catch (e) {
      console.error("[catalog] title", data, e);
      throw new Error("The metadata service is temporarily unavailable.");
    }
  });

export const searchCatalog = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ q: z.string().trim().max(100) }).parse(d))
  .handler(async ({ data }): Promise<SearchData> => {
    const errors: string[] = [];
    if (data.q.length < 2) return { query: data.q, results: [], errors };
    const [m, s, a] = await Promise.all([
      settle("Movies", searchMovies(data.q), errors, []),
      settle("Series", searchSeries(data.q), errors, []),
      settle("Anime", searchAnime(data.q), errors, []),
    ]);
    return { query: data.q, results: interleave(m, s, a), errors };
  });
