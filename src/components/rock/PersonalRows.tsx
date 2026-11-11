import { useMemo } from "react";
import type { Row, TitleSummary } from "@/lib/catalog/types";
import { favouriteGenres, library, useLibrary } from "@/lib/library/store";
import { dedupeClient } from "./dedupe";
import { Rail } from "./Rail";

export function ContinueWatchingRail() {
  const lib = useLibrary();
  const items = lib.watched.filter((h) => (h.progress ?? 0) < 0.95).map((h) => h.title);
  return (
    <Rail
      title="Continue Watching"
      items={items}
      showKind
      empty="Nothing in progress. Your place in each title and episode is saved here once you watch through an authorised provider."
    />
  );
}

export function RecommendedRail({ rows }: { rows: Row[] }) {
  const lib = useLibrary();
  const items = useMemo(() => {
    const genres = favouriteGenres(lib).map((g) => g.genre);
    if (!genres.length) return [];
    const pool = dedupeClient(rows.flatMap((r) => r.items));
    const score = (t: TitleSummary) => t.genres.reduce((s, g) => s + (genres.includes(g) ? genres.length - genres.indexOf(g) : 0), 0);
    return pool
      .filter((t) => !library.isInList(lib, t) && score(t) > 0)
      .sort((a, b) => score(b) - score(a))
      .slice(0, 24);
  }, [lib, rows]);
  return (
    <Rail
      title="Recommended For You"
      items={items}
      showKind
      empty="Add titles to My List or open a few title pages — recommendations are based on the genres you pick."
    />
  );
}
