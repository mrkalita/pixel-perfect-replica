import { format, parseISO } from "date-fns";
import type { Kind, Rating, TitleSummary } from "./types";

export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return format(parseISO(iso.slice(0, 10)), "d MMM yyyy");
  } catch {
    return null;
  }
}

export function formatRating(r: Rating): string | null {
  if (r.value == null) return null;
  return r.scale === 10 ? `${r.value.toFixed(1)}/10` : `${Math.round(r.value)}/${r.scale}`;
}

export function primaryRating(t: TitleSummary): Rating | null {
  return t.ratings.find((r) => r.value != null) ?? null;
}

export const KIND_LABEL: Record<Kind, string> = { movie: "Movie", series: "Series", anime: "Anime" };

export const titleKey = (t: { kind: string; id: string }) => `${t.kind}:${t.id}`;
