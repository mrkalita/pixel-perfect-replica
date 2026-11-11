import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ExternalLink, Puzzle, ShieldAlert, ShieldCheck } from "lucide-react";
import { CATEGORY_LABEL, PROVIDER_REFERENCES } from "@/lib/providers/registry";
import type { ProviderManifest } from "@/lib/providers/types";
import { PageHeader } from "@/components/rock/PageStates";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const TABS = ["all", "movie", "series", "anime", "live"] as const;

export const Route = createFileRoute("/extensions")({
  head: () => ({
    meta: [
      { title: "Extension Store — ROCK PLAY" },
      { name: "description", content: "Install, enable and manage authorised playback providers for ROCK PLAY." },
      { property: "og:title", content: "Extension Store — ROCK PLAY" },
      { property: "og:description", content: "Manage authorised playback providers for ROCK PLAY." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Extensions,
});

function Extensions() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const list = PROVIDER_REFERENCES.filter((p) => tab === "all" || p.categories.includes(tab));
  return (
    <div className="pb-16">
      <PageHeader eyebrow="Providers" title="Extension Store">
        Each provider plugs in through its own adapter. A website address alone isn't enough: a provider becomes usable only
        once its owner's permission and an official API, embed, SDK or deep link are confirmed.
      </PageHeader>
      <div className="mx-auto max-w-[1800px] space-y-6 px-4 md:px-10">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Button key={t} variant="chip" size="sm" data-active={tab === t} onClick={() => setTab(t)}>
              {t === "all" ? "All" : CATEGORY_LABEL[t]}
            </Button>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="col-span-full flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
            <ShieldCheck className="h-5 w-5 shrink-0 text-success" />
            <span>
              <span className="font-semibold">Installed &amp; authorised: 0.</span>{" "}
              <span className="text-muted-foreground">Available references awaiting authorisation: {PROVIDER_REFERENCES.length}.</span>
            </span>
          </div>
          {list.map((p) => (
            <ProviderCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProviderCard({ p }: { p: ProviderManifest }) {
  const usable = p.authorization === "authorised";
  return (
    <article className="flex flex-col rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-surface-raised font-display text-xl font-black uppercase text-primary">
            {p.name[0]}
          </span>
          <div>
            <h2 className="font-display text-xl font-bold uppercase leading-none">{p.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{p.categories.map((c) => CATEGORY_LABEL[c]).join(" · ")}</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          {usable ? "Enabled" : "Off"}
          <Switch checked={false} disabled={!usable} aria-label={`Enable ${p.name}`} />
        </label>
      </div>
      <p className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-sm bg-warning/15 px-2 py-1 text-xs font-semibold text-warning">
        <ShieldAlert className="h-3.5 w-3.5" /> Unsupported — authorisation not verified
      </p>
      <p className="mt-3 text-sm text-muted-foreground">{p.notes}</p>
      <div className="mt-3 text-xs">
        <p className="font-semibold text-foreground">Needed before it can be enabled</p>
        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-muted-foreground">
          {p.requirements.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {(["search", "playbackHandoff", "cast", "download"] as const).map((c) => (
          <div key={c} className="rounded-md bg-surface-raised px-2 py-1.5">
            <dt className="text-muted-foreground">{{ search: "Search", playbackHandoff: "Playback", cast: "Cast", download: "Downloads" }[c]}</dt>
            <dd className="font-semibold">{p.capabilities[c] ? "Supported" : "Not available"}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-auto flex items-center justify-between gap-2 pt-5 text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Puzzle className="h-3.5 w-3.5" /> Health check: skipped
        </span>
        <a href={p.referenceUrl} target="_blank" rel="noreferrer nofollow" className="inline-flex items-center gap-1 text-muted-foreground underline hover:text-foreground">
          Reference <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </article>
  );
}
