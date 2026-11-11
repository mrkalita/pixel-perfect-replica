export type Kind = "movie" | "series" | "anime";

/** A rating from a named source. value === null means the source has no rating. */
export interface Rating {
  source: string;
  value: number | null;
  scale: number;
  note?: string;
}

export interface TitleSummary {
  /** Source-specific id; unique together with kind. */
  id: string;
  kind: Kind;
  title: string;
  poster: string | null;
  backdrop: string | null;
  year: number | null;
  /** ISO date (YYYY-MM-DD) of the release this card refers to. */
  releaseDate: string | null;
  /** What releaseDate means: e.g. "Release date", "Premiered", "Episode aired". */
  releaseLabel: string;
  genres: string[];
  ratings: Rating[];
  duration: string | null;
  episodeInfo: string | null;
  ageRating: string | null;
  overview: string | null;
  language: string | null;
  /** Where the metadata came from (shown to users). */
  source: string;
}

export interface Person {
  name: string;
  role: string | null;
  image: string | null;
}

export interface Season {
  number: number;
  episodeCount: number | null;
  premiere: string | null;
}

export interface Episode {
  season: number;
  number: number | null;
  name: string;
  airdate: string | null;
  runtime: number | null;
}

export interface Trailer {
  type: "youtube" | "video";
  url: string;
  source: string;
}

export interface TitleDetail extends TitleSummary {
  director: string | null;
  directorLabel: string;
  cast: Person[];
  production: { label: string; value: string }[];
  seasons: Season[];
  episodes: Episode[];
  trailer: Trailer | null;
  similar: TitleSummary[];
  imdbId: string | null;
  sourceUrl: string | null;
}

export interface Row {
  id: string;
  title: string;
  kind: Kind | "mixed";
  items: TitleSummary[];
  /** Shown instead of items when a row cannot be filled honestly. */
  notice?: string;
}

export interface HomeData {
  featured: TitleSummary[];
  rows: Row[];
  errors: string[];
  generatedAt: string;
}

export interface BrowseData {
  featured: TitleSummary[];
  rows: Row[];
  errors: string[];
}

export interface SearchData {
  query: string;
  results: TitleSummary[];
  errors: string[];
}
