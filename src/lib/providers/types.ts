// Common provider/extension contract. Every playback source implements ProviderAdapter.
import type { Kind, TitleSummary } from "@/lib/catalog/types";

export type ProviderCategory = Kind | "live";

/**
 * authorised   – integration permission + official API/embed/SDK confirmed.
 * unverified   – a reference URL only; no permission or documentation supplied.
 * unsupported  – checked and does not permit integration.
 */
export type AuthorizationStatus = "authorised" | "unverified" | "unsupported";

export interface ProviderCapabilities {
  search: boolean;
  playbackHandoff: boolean;
  cast: boolean;
  download: boolean;
}

export interface ProviderManifest {
  id: string;
  name: string;
  referenceUrl: string;
  categories: ProviderCategory[];
  authorization: AuthorizationStatus;
  integration: "none" | "official-api" | "embed" | "sdk" | "deep-link";
  capabilities: ProviderCapabilities;
  /** What is still needed before this provider can be used. */
  requirements: string[];
  notes: string;
}

export interface ProviderMatch {
  providerId: string;
  title: string;
  confidence: number;
  handoffUrl: string;
}

export interface ProviderAdapter {
  manifest: ProviderManifest;
  healthCheck(): Promise<{ ok: boolean; message: string }>;
  search(t: TitleSummary): Promise<ProviderMatch[]>;
}
