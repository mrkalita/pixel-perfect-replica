// Anime metadata from the public AniList GraphQL API (no key required).
import type { Person, TitleDetail, TitleSummary } from "./types";
import { dedupe, fetchJson, formatMinutes, stripHtml } from "./util.server";

const API = "https://graphql.anilist.co";

const FIELDS = `
  id title { english romaji } coverImage { extraLarge large } bannerImage
  startDate { year month day } averageScore genres episodes duration format status
  isAdult countryOfOrigin description(asHtml: false) nextAiringEpisode { episode airingAt }
`;

interface Media {
  id: number;
  title: { english: string | null; romaji: string | null };
  coverImage: { extraLarge: string | null; large: string | null };
  bannerImage: string | null;
  startDate: { year: number | null; month: number | null; day: number | null };
  averageScore: number | null;
  genres: string[];
  episodes: number | null;
  duration: number | null;
  format: string | null;
  status: string | null;
  isAdult: boolean;
  countryOfOrigin: string | null;
  description: string | null;
  nextAiringEpisode: { episode: number; airingAt: number } | null;
}

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const r = await fetchJson<{ data: T; errors?: { message: string }[] }>(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (r.errors?.length) throw new Error(r.errors[0]?.message ?? "AniList error");
  return r.data;
}

function dateOf(d: Media["startDate"]): string | null {
  if (!d.year) return null;
  const mm = String(d.month ?? 1).padStart(2, "0");
  const dd = String(d.day ?? 1).padStart(2, "0");
  return d.month && d.day ? `${d.year}-${mm}-${dd}` : null;
}

function episodeLabel(m: Media): string | null {
  if (m.format === "MOVIE") return "Film";
  if (m.status === "RELEASING" && m.nextAiringEpisode) {
    const out = m.nextAiringEpisode.episode - 1;
    return out > 0 ? `${out} episode${out === 1 ? "" : "s"} out` : "Airing";
  }
  return m.episodes ? `${m.episodes} episodes` : null;
}

function toSummary(m: Media, extra?: Partial<TitleSummary>): TitleSummary {
  return {
    id: String(m.id),
    kind: "anime",
    title: m.title.english ?? m.title.romaji ?? "Untitled",
    poster: m.coverImage.extraLarge ?? m.coverImage.large,
    backdrop: m.bannerImage,
    year: m.startDate.year,
    releaseDate: dateOf(m.startDate),
    releaseLabel: m.format === "MOVIE" ? "Release date" : "First aired",
    genres: m.genres,
    ratings: [{ source: "AniList", value: m.averageScore, scale: 100 }],
    duration: (() => {
      const d = formatMinutes(m.duration);
      return d ? (m.format === "MOVIE" ? d : `${d} / ep`) : null;
    })(),
    episodeInfo: episodeLabel(m),
    ageRating: null,
    overview: stripHtml(m.description),
    language: "Japanese",
    source: "AniList",
    ...extra,
  };
}

const clean = (list: Media[]) => dedupe(list.filter((m) => !m.isAdult).map((m) => toSummary(m)));

const PAGE = (alias: string, args: string, n = 24) =>
  `${alias}: Page(perPage: ${n}) { media(type: ANIME, isAdult: false, status_not_in: [NOT_YET_RELEASED, CANCELLED], ${args}) { ${FIELDS} } }`;

export async function animeHome() {
  const now = Math.floor(Date.now() / 1000);
  const q = `query ($from: Int, $to: Int) {
    ${PAGE("trending", "sort: TRENDING_DESC")}
    ${PAGE("popular", "sort: POPULARITY_DESC")}
    ${PAGE("top", "sort: SCORE_DESC")}
    aired: Page(perPage: 50) { airingSchedules(airingAt_greater: $from, airingAt_lesser: $to, sort: TIME_DESC) {
      episode airingAt media { ${FIELDS} }
    } }
  }`;
  type R = Record<"trending" | "popular" | "top", { media: Media[] }> & {
    aired: { airingSchedules: { episode: number; airingAt: number; media: Media }[] };
  };
  const d = await gql<R>(q, { from: now - 3 * 86400, to: now });
  const newEpisodes = dedupe(
    d.aired.airingSchedules
      .filter((s) => !s.media.isAdult && s.media.countryOfOrigin === "JP" && s.airingAt <= now)
      .map((s) =>
        toSummary(s.media, {
          episodeInfo: `Episode ${s.episode}`,
          releaseDate: new Date(s.airingAt * 1000).toISOString().slice(0, 10),
          releaseLabel: "Episode aired",
        }),
      ),
  );
  return { trending: clean(d.trending.media), popular: clean(d.popular.media), top: clean(d.top.media), newEpisodes };
}

export const ANIME_GENRES = ["Action", "Fantasy", "Romance", "Comedy", "Sci-Fi", "Slice of Life", "Mystery", "Sports"];

export async function animeByGenre() {
  const q = `query { ${ANIME_GENRES.map((g, i) => PAGE(`g${i}`, `genre: "${g}", sort: POPULARITY_DESC`, 20)).join("\n")} }`;
  const d = await gql<Record<string, { media: Media[] }>>(q);
  return ANIME_GENRES.map((g, i) => ({ genre: g, items: clean(d[`g${i}`]?.media ?? []) }));
}

export async function searchAnime(search: string): Promise<TitleSummary[]> {
  const q = `query ($s: String) { ${PAGE("r", "search: $s, sort: SEARCH_MATCH", 24)} }`;
  const d = await gql<{ r: { media: Media[] } }>(q, { s: search });
  return clean(d.r.media);
}

export async function animeDetail(id: string): Promise<TitleDetail | null> {
  const n = Number(id);
  if (!Number.isFinite(n)) return null;
  const q = `query ($id: Int) { Media(id: $id, type: ANIME) { ${FIELDS}
    siteUrl idMal source season seasonYear
    studios(isMain: true) { nodes { name } }
    staff(perPage: 25) { edges { role node { name { full } } } }
    characters(perPage: 16, sort: [ROLE, RELEVANCE]) { edges { role node { name { full } image { large } }
      voiceActors(language: JAPANESE) { name { full } } } }
    trailer { id site }
    recommendations(perPage: 18, sort: RATING_DESC) { nodes { mediaRecommendation { ${FIELDS} } } }
  } }`;
  type D = Media & {
    siteUrl: string;
    source: string | null;
    season: string | null;
    seasonYear: number | null;
    studios: { nodes: { name: string }[] };
    staff: { edges: { role: string; node: { name: { full: string } } }[] };
    characters: {
      edges: { role: string; node: { name: { full: string }; image: { large: string | null } }; voiceActors: { name: { full: string } }[] }[];
    };
    trailer: { id: string; site: string } | null;
    recommendations: { nodes: { mediaRecommendation: Media | null }[] };
  };
  let m: D;
  try {
    m = (await gql<{ Media: D }>(q, { id: n })).Media;
  } catch {
    return null;
  }
  if (!m || m.isAdult || m.status === "NOT_YET_RELEASED") return null;
  const base = toSummary(m);
  const directors = m.staff.edges.filter((e) => /^director$/i.test(e.role)).map((e) => e.node.name.full);
  const cast: Person[] = m.characters.edges.map((e) => ({
    name: e.node.name.full,
    role: e.voiceActors[0] ? `Voiced by ${e.voiceActors[0].name.full}` : e.role,
    image: e.node.image.large,
  }));
  const production = [
    m.studios.nodes.length ? { label: "Studio", value: m.studios.nodes.map((s) => s.name).join(", ") } : null,
    m.format ? { label: "Format", value: m.format.replace(/_/g, " ") } : null,
    m.source ? { label: "Source material", value: m.source.replace(/_/g, " ").toLowerCase() } : null,
    m.season && m.seasonYear ? { label: "Season", value: `${m.season.toLowerCase()} ${m.seasonYear}` } : null,
    m.status ? { label: "Status", value: m.status.replace(/_/g, " ").toLowerCase() } : null,
  ].filter((x): x is { label: string; value: string } => !!x);
  const released = m.nextAiringEpisode ? m.nextAiringEpisode.episode - 1 : m.episodes ?? 0;
  return {
    ...base,
    director: directors.length ? directors.join(", ") : null,
    directorLabel: "Director",
    cast,
    production,
    seasons: [],
    episodes: Array.from({ length: Math.min(released, 200) }, (_, i) => ({
      season: 1,
      number: i + 1,
      name: `Episode ${i + 1}`,
      airdate: null,
      runtime: m.duration,
    })),
    trailer:
      m.trailer?.site === "youtube"
        ? { type: "youtube", url: `https://www.youtube-nocookie.com/embed/${m.trailer.id}?autoplay=1&rel=0`, source: "YouTube (linked by AniList)" }
        : null,
    similar: clean(m.recommendations.nodes.map((r) => r.mediaRecommendation).filter((x): x is Media => !!x && x.status !== "NOT_YET_RELEASED")),
    imdbId: null,
    sourceUrl: m.siteUrl,
  };
}
