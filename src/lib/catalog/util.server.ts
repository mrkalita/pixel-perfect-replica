// Server-only helpers shared by the metadata adapters.
type Entry = { exp: number; val: unknown };
const cache = new Map<string, Entry>();

export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  ttlMs = 10 * 60_000,
): Promise<T> {
  const key = `${init?.method ?? "GET"} ${url} ${typeof init?.body === "string" ? init.body : ""}`;
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.val as T;
  const res = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", "User-Agent": "ROCKPLAY/1.0", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${new URL(url).host} responded ${res.status}`);
  const val = (await res.json()) as T;
  cache.set(key, { exp: Date.now() + ttlMs, val });
  if (cache.size > 500) {
    const first = cache.keys().next().value;
    if (first) cache.delete(first);
  }
  return val;
}

export function stripHtml(s: string | null | undefined): string | null {
  if (!s) return null;
  const out = s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return out || null;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** True only when the date has arrived (never treat future dates as released). */
export function isReleased(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return iso.slice(0, 10) <= todayIso();
}

export function formatMinutes(min: number | null | undefined): string | null {
  if (!min || min <= 0) return null;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

export async function settle<T>(label: string, p: Promise<T>, errors: string[], fallback: T): Promise<T> {
  try {
    return await p;
  } catch (e) {
    console.error(`[catalog] ${label}:`, e);
    errors.push(label);
    return fallback;
  }
}

export function dedupe<T extends { id: string; kind: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = `${i.kind}:${i.id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
