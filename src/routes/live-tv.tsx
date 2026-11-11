import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Radio, Search, Star } from "lucide-react";
import { PROVIDER_REFERENCES } from "@/lib/providers/registry";
import { PageHeader } from "@/components/rock/PageStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES = ["All", "Sports", "News", "Movies", "Entertainment", "Kids", "Music", "Favourites"];

export const Route = createFileRoute("/live-tv")({
  head: () => ({
    meta: [
      { title: "Live TV — ROCK PLAY" },
      { name: "description", content: "Live channels, now playing and programme guide from authorised Live TV providers." },
      { property: "og:title", content: "Live TV — ROCK PLAY" },
      { property: "og:description", content: "Live channels and programme guide on ROCK PLAY." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LiveTv,
});

function LiveTv() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const live = PROVIDER_REFERENCES.filter((p) => p.categories.includes("live"));
  return (
    <div className="pb-16">
      <PageHeader eyebrow="Live" title="Live TV">
        Channels, now-playing info and the programme guide come from an authorised Live TV provider.
      </PageHeader>
      <div className="mx-auto max-w-[1800px] space-y-6 px-4 md:px-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="rail-scroll">
            <div className="flex w-max gap-2">
              {CATEGORIES.map((c) => (
                <Button key={c} variant="chip" size="sm" data-active={cat === c} onClick={() => setCat(c)}>
                  {c === "Favourites" && <Star />} {c}
                </Button>
              ))}
            </div>
          </div>
          <div className="relative md:ml-auto md:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search channels" aria-label="Search channels" className="bg-surface pl-9" />
          </div>
        </div>

        <div className="grid place-items-center rounded-xl border border-dashed border-border bg-surface/60 px-6 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
            <Radio className="h-7 w-7" />
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold uppercase">No live channels yet</h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            {q ? `No channels match "${q}". ` : ""}ROCK PLAY only shows channels from providers that hold the rights to stream them. Your reference{" "}
            {live.map((p) => p.name).join(", ")} hasn't been authorised, so it isn't queried.
          </p>
          <Button variant="hero" className="mt-6" asChild>
            <Link to="/extensions">Open Extension Store</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
