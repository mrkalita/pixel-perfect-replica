// Local library (My List, recently viewed, watch progress and genre preferences).
import { useSyncExternalStore } from "react";
import type { TitleSummary } from "@/lib/catalog/types";

export interface HistoryEntry {
  title: TitleSummary;
  at: string;
  progress?: number;
  episode?: string;
}

export interface LibraryState {
  myList: TitleSummary[];
  viewed: HistoryEntry[];
  watched: HistoryEntry[];
  preferredGenres: string[];
  preferencesCompleted: boolean;
}

const KEY = "rockplay.library.v1";
const EMPTY: LibraryState = {
  myList: [],
  viewed: [],
  watched: [],
  preferredGenres: [],
  preferencesCompleted: false,
};
let state: LibraryState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<LibraryState>;
      state = {
        ...EMPTY,
        ...saved,
        preferredGenres: Array.isArray(saved.preferredGenres) ? saved.preferredGenres : [],
        preferencesCompleted: saved.preferencesCompleted === true,
      };
    }
  } catch {
    state = EMPTY;
  }
}

function set(next: LibraryState) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or disabled */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useLibrary(): LibraryState {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => EMPTY,
  );
}

const keyOf = (t: { kind: string; id: string }) => `${t.kind}:${t.id}`;

function slim(t: TitleSummary): TitleSummary {
  return { ...t, overview: t.overview ? t.overview.slice(0, 300) : null };
}

export const library = {
  isInList: (s: LibraryState, t: { kind: string; id: string }) => s.myList.some((x) => keyOf(x) === keyOf(t)),
  toggleList(t: TitleSummary) {
    load();
    const has = state.myList.some((x) => keyOf(x) === keyOf(t));
    set({ ...state, myList: has ? state.myList.filter((x) => keyOf(x) !== keyOf(t)) : [slim(t), ...state.myList] });
    return !has;
  },
  recordView(t: TitleSummary) {
    load();
    const viewed = [{ title: slim(t), at: new Date().toISOString() }, ...state.viewed.filter((v) => keyOf(v.title) !== keyOf(t))].slice(0, 40);
    set({ ...state, viewed });
  },
  setPreferences(genres: string[], completed = true) {
    load();
    set({ ...state, preferredGenres: [...new Set(genres)].slice(0, 18), preferencesCompleted: completed });
  },
  clearViewed() {
    load();
    set({ ...state, viewed: [] });
  },
  clearWatched() {
    load();
    set({ ...state, watched: [] });
  },
  clearList() {
    load();
    set({ ...state, myList: [] });
  },
};

export function favouriteGenres(s: LibraryState, n = 6): { genre: string; count: number }[] {
  const counts = new Map<string, number>();
  const add = (t: TitleSummary, w: number) => t.genres.forEach((g) => counts.set(g, (counts.get(g) ?? 0) + w));
  s.myList.forEach((t) => add(t, 3));
  s.watched.forEach((h) => add(h.title, 2));
  s.viewed.forEach((h) => add(h.title, 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([genre, count]) => ({ genre, count }));
}
