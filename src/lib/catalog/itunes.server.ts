// Movies metadata from the public Apple TV / iTunes Store catalogue (no key required).
import type { TitleDetail, TitleSummary } from "./types";
import { dedupe, fetchJson, formatMinutes, isReleased } from "./util.server";

const COUNTRY = "us";

export const MOVIE_GENRES: { id: number; name: string }[] = [
  { id: 4401, name: "Action & Adventure" },
  { id: 4416, name: "Thriller" },
  { id: 4404, name: "Comedy" },
  { id: 4407, name: "Drama" },
  { id: 4409, name: "Horror" },
  { id: 4414, name: "Sci-Fi & Fantasy" },
  { id: 4413, name: "Romance" },
  { id: 4411, name: "Kids & Family" },
  { id: 4406, name: "Documentary" },
];

interface FeedEntry {
  id: { attributes: { "im:id": string } };
}
interface Feed {
  feed: { entry?: FeedEntry[] | FeedEntry };
}
interface Track {
  kind?: string;
  trackId: number;
  trackName: string;
  artistName?: string;
  artworkUrl100?: string;
  releaseDate?: string;
  primaryGenreName?: string;
  contentAdvisoryRating?: string;
  trackTimeMillis?: number;
  longDescription?: string;
  shortDescription?: string;
  previewUrl?: string;
  trackViewUrl?: string;
  country?: string;
}

function art(url: string | undefined, size: string): string | null {
  if (!url) return null;
  return url.replace(/\/[^/]+$/, `/${size}`);
}

function toSummary(t: Track): TitleSummary {
  const date = t.releaseDate ? t.releaseDate.slice(0, 10) : null;
  return {
    id: String(t.trackId),
    kind: "movie",
    title: t.trackName,
    poster: art(t.artworkUrl100, "400x600bb.jpg"),
    backdrop: art(t.artworkUrl100, "1600x900cc.jpg"),
    year: date ? Number(date.slice(0, 4)) : null,
    releaseDate: date,
    releaseLabel: "Release date",
    genres: t.primaryGenreName ? [t.primaryGenreName] : [],
    ratings: [],
    duration: formatMinutes(t.trackTimeMillis ? t.trackTimeMillis / 60000 : null),
    episodeInfo: null,
    ageRating: t.contentAdvisoryRating && t.contentAdvisoryRating !== "Unrated" ? t.contentAdvisoryRating : null,
    overview: t.longDescription ?? t.shortDescription ?? null,
    language: null,
    source: "Apple TV store",
  };
}

async function lookup(ids: string[]): Promise<Track[]> {
  const out: Track[] = [];
  for (let i = 0; i < ids.length; i += 150) {
    const chunk = ids.slice(i, i + 150);
    const r = await fetchJson<{ results: Track[] }>(
      `https://itunes.apple.com/lookup?id=${chunk.join(",")}&country=${COUNTRY}`,
    );
    out.push(...r.results.filter((t) => t.kind === "feature-movie"));
  }
  return out;
}

async function feedIds(genre?: number, limit = 100): Promise<string[]> {
  const url = `https://itunes.apple.com/${COUNTRY}/rss/topmovies/limit=${limit}${genre ? `/genre=${genre}` : ""}/json`;
  const f = await fetchJson<Feed>(url);
  const entries = f.feed.entry ? (Array.isArray(f.feed.entry) ? f.feed.entry : [f.feed.entry]) : [];
  return entries.map((e) => e.id.attributes["im:id"]);
}

/** Chart order (= what people are buying/renting now), released titles only. */
export async function topMovies(genre?: number, limit = 100): Promise<TitleSummary[]> {
  const ids = await feedIds(genre, limit);
  const tracks = await lookup(ids);
  const byId = new Map(tracks.map((t) => [String(t.trackId), t]));
  return dedupe(
    ids
      .map((id) => byId.get(id))
      .filter((t): t is Track => !!t && isReleased(t.releaseDate))
      .map(toSummary),
  );
}

export function recentlyReleased(movies: TitleSummary[]): TitleSummary[] {
  return [...movies].sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "")).slice(0, 24);
}

export async function searchMovies(q: string): Promise<TitleSummary[]> {
  const r = await fetchJson<{ results: Track[] }>(
    `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&country=${COUNTRY}&limit=50`,
  );
  return dedupe(
    r.results.filter((t) => t.kind === "feature-movie" && isReleased(t.releaseDate)).map(toSummary),
  ).slice(0, 24);
}

export async function movieDetail(id: string): Promise<TitleDetail | null> {
  const [t] = await lookup([id]);
  if (!t) return null;
  const base = toSummary(t);
  let similar: TitleSummary[] = [];
  const genre = MOVIE_GENRES.find((g) => g.name === t.primaryGenreName);
  try {
    similar = (await topMovies(genre?.id, 40)).filter((m) => m.id !== base.id).slice(0, 18);
  } catch {
    similar = [];
  }
  return {
    ...base,
    director: t.artistName ?? null,
    directorLabel: "Director",
    cast: [],
    production: [
      ...(t.country ? [{ label: "Store region", value: t.country }] : []),
      ...(base.ageRating ? [{ label: "Age rating", value: base.ageRating }] : []),
    ],
    seasons: [],
    episodes: [],
    trailer: t.previewUrl ? { type: "video", url: t.previewUrl, source: "Official studio preview via Apple" } : null,
    similar,
    imdbId: null,
    sourceUrl: t.trackViewUrl ?? null,
  };
}
