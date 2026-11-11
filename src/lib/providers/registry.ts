import type { ProviderManifest } from "./types";

const REQUIREMENTS = [
  "Written permission from the site owner to integrate",
  "An official API, embed player, SDK or deep-link scheme with documentation",
  "Confirmation that the content is licensed for distribution",
];

const none = { search: false, playbackHandoff: false, cast: false, download: false };

/** User-supplied provider references. Untrusted until authorisation is confirmed. */
export const PROVIDER_REFERENCES: ProviderManifest[] = [
  {
    id: "bingr",
    name: "Bingr",
    referenceUrl: "https://bingr.one/home",
    categories: ["movie", "series"],
    authorization: "unverified",
    integration: "none",
    capabilities: none,
    requirements: REQUIREMENTS,
    notes: "No public API, embed terms or integration permission has been supplied for this site.",
  },
  {
    id: "anikoto",
    name: "AnikotoTV",
    referenceUrl: "https://anikototv.to/home",
    categories: ["anime"],
    authorization: "unverified",
    integration: "none",
    capabilities: none,
    requirements: REQUIREMENTS,
    notes: "No public API, embed terms or integration permission has been supplied for this site.",
  },
  {
    id: "fmovies",
    name: "FMovies",
    referenceUrl: "https://fmoviess.tv/home-backup",
    categories: ["movie", "series"],
    authorization: "unverified",
    integration: "none",
    capabilities: none,
    requirements: REQUIREMENTS,
    notes: "No public API, embed terms or integration permission has been supplied for this site.",
  },
  {
    id: "pvrplay",
    name: "PVR Play Sports",
    referenceUrl: "https://ghar-baithe-free-movies-dekho-bina-rukawat-pvrplay-hd.pvrplay.fun/sports",
    categories: ["live"],
    authorization: "unverified",
    integration: "none",
    capabilities: none,
    requirements: [...REQUIREMENTS, "Broadcast rights for the channels it carries"],
    notes: "No public API, embed terms or integration permission has been supplied for this site.",
  },
];

export const CATEGORY_LABEL: Record<string, string> = {
  movie: "Movies",
  series: "Series",
  anime: "Anime",
  live: "Live TV",
};

/** Providers that may be queried for a given content type. Only authorised ones qualify. */
export function compatibleProviders(category: string): ProviderManifest[] {
  return PROVIDER_REFERENCES.filter(
    (p) => p.authorization === "authorised" && p.capabilities.search && p.categories.includes(category as never),
  );
}
