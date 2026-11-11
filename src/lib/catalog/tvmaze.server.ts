// Series metadata from TVmaze (free public API, no key; attribution required).
import type { Episode, Person, TitleDetail, TitleSummary } from "./types";
import { dedupe, fetchJson, formatMinutes, isReleased, stripHtml, todayIso } from "./util.server";

const API = "https://api.tvmaze.com";

interface Show {
  id: number;
  name: string;
  type?: string;
  language?: string | null;
  genres?: string[];
  status?: string;
  runtime?: number | null;
  averageRuntime?: number | null;
  premiered?: string | null;
  ended?: string | null;
  officialSite?: string | null;
  rating?: { average: number | null };
  weight?: number;
  network?: { name: string; country?: { name: string } | null } | null;
  webChannel?: { name: string } | null;
  externals?: { imdb?: string | null };
  image?: { medium?: string; original?: string } | null;
  summary?: string | null;
  url?: string;
  _embedded?: {
    cast?: { person: { name: string; image?: { medium?: string } | null }; character: { name: string } }[];
    crew?: { type: string; person: { name: string } }[];
    seasons?: { number: number; episodeOrder: number | null; premiereDate: string | null }[];
    episodes?: { season: number; number: number | null; name: string; airdate: string | null; airstamp?: string | null; runtime: number | null }[];
  };
}
interface ScheduleItem {
  season: number;
  number: number | null;
  airdate: string;
  airstamp: string | null;
  show?: Show;
  _embedded?: { show: Show };
}

const isAnime = (s: Show) => s.type === "Animation" && s.language === "Japanese";

function toSummary(s: Show, extra?: Partial<TitleSummary>): TitleSummary {
  return {
    id: String(s.id),
    kind: "series",
    title: s.name,
    poster: s.image?.medium?.replace("medium_portrait", "original_untouched") ? s.image?.original ?? s.image?.medium ?? null : null,
    backdrop: null,
    year: s.premiered ? Number(s.premiered.slice(0, 4)) : null,
    releaseDate: s.premiered ?? null,
    releaseLabel: "Premiered",
    genres: s.genres ?? [],
    ratings: [{ source: "TVmaze", value: s.rating?.average ?? null, scale: 10 }],
    duration: (() => {
      const m = formatMinutes(s.averageRuntime ?? s.runtime);
      return m ? `${m} / ep` : null;
    })(),
    episodeInfo: s.status === "Ended" ? "Ended" : s.status ?? null,
    ageRating: null,
    overview: stripHtml(s.summary),
    language: s.language ?? null,
    source: "TVmaze",
    ...extra,
  };
}

function shiftDate(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Episodes that have actually aired (US broadcast + streaming), newest first, one per show. */
export async function latestEpisodes(days = 2): Promise<TitleSummary[]> {
  const now = Date.now();
  const dates = Array.from({ length: days }, (_, i) => shiftDate(i));
  const lists = await Promise.all(
    dates.flatMap((d) => [
      fetchJson<ScheduleItem[]>(`${API}/schedule?country=US&date=${d}`, undefined, 15 * 60_000),
      fetchJson<ScheduleItem[]>(`${API}/schedule/web?date=${d}`, undefined, 15 * 60_000),
    ]),
  );
  const items = lists
    .flat()
    .map((i) => ({ ...i, show: i.show ?? i._embedded?.show }))
    .filter((i): i is ScheduleItem & { show: Show } => !!i.show && !!i.show.image && !isAnime(i.show))
    .filter((i) => (i.airstamp ? Date.parse(i.airstamp) <= now : i.airdate <= todayIso()))
    .sort((a, b) => (b.airstamp ?? b.airdate).localeCompare(a.airstamp ?? a.airdate));
  return dedupe(
    items.map((i) =>
      toSummary(i.show, {
        episodeInfo: `S${i.season}${i.number != null ? ` · E${i.number}` : " · Special"}`,
        releaseDate: i.airdate,
        releaseLabel: "Episode aired",
        year: Number(i.airdate.slice(0, 4)),
      }),
    ),
  );
}

/** Shows currently airing, ranked by TVmaze's popularity weight. */
export async function trendingSeries(): Promise<TitleSummary[]> {
  const eps = await latestEpisodes(3);
  return eps; // ranked in popularShowsFromSchedule below when weights are needed
}

async function indexPages(pages: number[]): Promise<Show[]> {
  const lists = await Promise.all(pages.map((p) => fetchJson<Show[]>(`${API}/shows?page=${p}`, undefined, 6 * 3600_000)));
  return lists.flat().filter((s) => s.image && isReleased(s.premiered) && !isAnime(s));
}

export async function popularSeries(): Promise<TitleSummary[]> {
  const shows = await indexPages([0, 1, 2]);
  return shows.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)).slice(0, 40).map((s) => toSummary(s));
}

export async function topRatedSeries(): Promise<TitleSummary[]> {
  const shows = await indexPages([0, 1, 2]);
  return shows
    .filter((s) => (s.weight ?? 0) >= 80 && s.rating?.average)
    .sort((a, b) => (b.rating?.average ?? 0) - (a.rating?.average ?? 0))
    .slice(0, 30)
    .map((s) => toSummary(s));
}

export async function scheduleTrending(): Promise<TitleSummary[]> {
  const now = Date.now();
  const dates = [0, 1, 2, 3].map(shiftDate);
  const lists = await Promise.all(
    dates.flatMap((d) => [
      fetchJson<ScheduleItem[]>(`${API}/schedule?country=US&date=${d}`, undefined, 15 * 60_000),
      fetchJson<ScheduleItem[]>(`${API}/schedule/web?date=${d}`, undefined, 15 * 60_000),
    ]),
  );
  const shows = new Map<number, Show>();
  for (const i of lists.flat()) {
    const s = i.show ?? i._embedded?.show;
    if (!s || !s.image || isAnime(s)) continue;
    if (i.airstamp && Date.parse(i.airstamp) > now) continue;
    shows.set(s.id, s);
  }
  return [...shows.values()]
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
    .slice(0, 30)
    .map((s) => toSummary(s));
}

export async function seriesBackdrop(id: string): Promise<string | null> {
  try {
    const imgs = await fetchJson<{ type: string; resolutions: { original: { url: string; width: number } } }[]>(
      `${API}/shows/${id}/images`,
      undefined,
      24 * 3600_000,
    );
    const bg = imgs.find((i) => i.type === "background") ?? imgs.find((i) => i.type === "banner");
    return bg?.resolutions.original.url ?? null;
  } catch {
    return null;
  }
}

export async function searchSeries(q: string): Promise<TitleSummary[]> {
  const r = await fetchJson<{ show: Show }[]>(`${API}/search/shows?q=${encodeURIComponent(q)}`);
  return r.map((x) => x.show).filter((s) => isReleased(s.premiered) && !isAnime(s)).map((s) => toSummary(s));
}

export async function seriesDetail(id: string): Promise<TitleDetail | null> {
  let s: Show;
  try {
    s = await fetchJson<Show>(
      `${API}/shows/${encodeURIComponent(id)}?embed[]=cast&embed[]=crew&embed[]=seasons&embed[]=episodes`,
    );
  } catch {
    return null;
  }
  const base = toSummary(s);
  const now = Date.now();
  const cast: Person[] = (s._embedded?.cast ?? []).slice(0, 18).map((c) => ({
    name: c.person.name,
    role: c.character?.name ?? null,
    image: c.person.image?.medium ?? null,
  }));
  const creators = (s._embedded?.crew ?? []).filter((c) => c.type === "Creator").map((c) => c.person.name);
  const episodes: Episode[] = (s._embedded?.episodes ?? [])
    .filter((e) => (e.airstamp ? Date.parse(e.airstamp) <= now : isReleased(e.airdate)))
    .map((e) => ({ season: e.season, number: e.number, name: e.name, airdate: e.airdate, runtime: e.runtime }));
  const seasons = (s._embedded?.seasons ?? [])
    .filter((x) => isReleased(x.premiereDate))
    .map((x) => ({
      number: x.number,
      episodeCount: episodes.filter((e) => e.season === x.number).length || x.episodeOrder,
      premiere: x.premiereDate,
    }));
  const last = episodes.at(-1);
  let similar: TitleSummary[] = [];
  try {
    const pop = await popularSeries();
    similar = pop.filter((p) => p.id !== base.id && p.genres.some((g) => base.genres.includes(g))).slice(0, 18);
  } catch {
    similar = [];
  }
  const production = [
    s.network ? { label: "Network", value: `${s.network.name}${s.network.country ? ` (${s.network.country.name})` : ""}` } : null,
    s.webChannel ? { label: "Streaming channel", value: s.webChannel.name } : null,
    s.status ? { label: "Status", value: s.status } : null,
    s.language ? { label: "Language", value: s.language } : null,
    s.ended ? { label: "Ended", value: s.ended } : null,
    s.officialSite ? { label: "Official site", value: s.officialSite } : null,
  ].filter((x): x is { label: string; value: string } => !!x);
  return {
    ...base,
    backdrop: await seriesBackdrop(id),
    episodeInfo: last ? `Latest: S${last.season}${last.number != null ? ` · E${last.number}` : ""}` : base.episodeInfo,
    director: creators.length ? creators.join(", ") : null,
    directorLabel: "Created by",
    cast,
    production,
    seasons,
    episodes,
    trailer: null,
    similar,
    imdbId: s.externals?.imdb ?? null,
    sourceUrl: s.url ?? null,
  };
}
