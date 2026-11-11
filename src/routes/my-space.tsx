import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, HardDrive, Settings, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { favouriteGenres, useLibrary } from "@/lib/library/store";
import { PageHeader } from "@/components/rock/PageStates";
import { Rail } from "@/components/rock/Rail";
import { TitleCard } from "@/components/rock/TitleCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/my-space")({
  head: () => ({
    meta: [
      { title: "My Space — ROCK PLAY" },
      { name: "description", content: "Your list, viewing history, downloads and favourite genres on ROCK PLAY." },
      { property: "og:title", content: "My Space — ROCK PLAY" },
      { property: "og:description", content: "Your list, history, downloads and favourite genres." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MySpace,
});

function useStorageEstimate() {
  const [est, setEst] = useState<{ usage: number; quota: number } | null>(null);
  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => setEst({ usage: e.usage ?? 0, quota: e.quota ?? 0 })).catch(() => setEst(null));
  }, []);
  return est;
}

const gb = (n: number) => `${(n / 1024 ** 3).toFixed(n > 1024 ** 3 ? 1 : 2)} GB`;

function MySpace() {
  const lib = useLibrary();
  const genres = favouriteGenres(lib, 8);
  const storage = useStorageEstimate();
  const continueItems = lib.watched.filter((h) => (h.progress ?? 0) < 0.95).map((h) => h.title);

  return (
    <div className="pb-16">
      <PageHeader eyebrow="Guest profile" title="My Space">
        Saved on this device. Sign in with Google (coming in a later stage) to sync your list and progress across devices.
      </PageHeader>

      <div className="space-y-12">
        <section className="mx-auto max-w-[1800px] px-4 md:px-10" aria-labelledby="mylist">
          <h2 id="mylist" className="font-display text-2xl font-bold uppercase">
            My List <span className="text-muted-foreground">({lib.myList.length})</span>
          </h2>
          {lib.myList.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nothing saved yet. Tap <span className="font-semibold text-foreground">+ My List</span> on any title page.
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-4 gap-y-6 lg:grid-cols-[repeat(auto-fill,minmax(170px,1fr))]">
              {lib.myList.map((t) => (
                <li key={`${t.kind}:${t.id}`}>
                  <TitleCard t={t} showKind className="w-full sm:w-full lg:w-full" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <Rail title="Continue Watching" items={continueItems} showKind empty="Nothing in progress yet. Playback progress appears here once an authorised provider is connected." />
        <Rail title="Watch History" items={lib.watched.map((h) => h.title)} showKind empty="No watch history yet — nothing has been played." />
        <Rail title="Recently Viewed" items={lib.viewed.map((h) => h.title)} showKind empty="Title pages you open show up here." />

        <section className="mx-auto grid max-w-[1800px] gap-6 px-4 md:grid-cols-3 md:px-10">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold uppercase">
              <Download className="h-5 w-5 text-primary" /> Downloads
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No downloads. Downloading is only offered for providers that explicitly permit offline viewing — none are installed yet.
            </p>
            {storage && storage.quota > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3.5 w-3.5" /> Browser storage
                  </span>
                  <span>
                    {gb(storage.usage)} of {gb(storage.quota)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-raised">
                  <div className="h-full bg-primary" style={{ width: `${Math.max(1, (storage.usage / storage.quota) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="font-display text-xl font-bold uppercase">Favourite Genres</h2>
            {genres.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Save or open a few titles and your top genres show here.</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {genres.map((g, i) => (
                  <li
                    key={g.genre}
                    className={i < 3 ? "rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground" : "rounded-full bg-surface-raised px-3 py-1 text-xs"}
                  >
                    {g.genre}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold uppercase">
              <UserRound className="h-5 w-5 text-primary" /> Account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Guest · this device only</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="glass" size="sm" disabled>
                Sign in with Google — coming soon
              </Button>
              <Button variant="glass" size="sm" asChild>
                <Link to="/settings">
                  <Settings /> Settings
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
