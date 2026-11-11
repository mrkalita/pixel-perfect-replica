import { queryOptions } from "@tanstack/react-query";
import { getAnime, getHome, getMovies, getSeries, getTitle, searchCatalog } from "./catalog.functions";
import type { Kind } from "./types";

const REFRESH = 30 * 60_000;

export const homeQuery = () =>
  queryOptions({ queryKey: ["home"], queryFn: () => getHome(), staleTime: 10 * 60_000, refetchInterval: REFRESH });
export const moviesQuery = () =>
  queryOptions({ queryKey: ["browse", "movies"], queryFn: () => getMovies(), staleTime: 10 * 60_000, refetchInterval: REFRESH });
export const seriesQuery = () =>
  queryOptions({ queryKey: ["browse", "series"], queryFn: () => getSeries(), staleTime: 10 * 60_000, refetchInterval: REFRESH });
export const animeQuery = () =>
  queryOptions({ queryKey: ["browse", "anime"], queryFn: () => getAnime(), staleTime: 10 * 60_000, refetchInterval: REFRESH });
export const titleQuery = (kind: Kind, id: string) =>
  queryOptions({ queryKey: ["title", kind, id], queryFn: () => getTitle({ data: { kind, id } }), staleTime: 30 * 60_000 });
export const searchQuery = (q: string) =>
  queryOptions({ queryKey: ["search", q], queryFn: () => searchCatalog({ data: { q } }), staleTime: 5 * 60_000 });
