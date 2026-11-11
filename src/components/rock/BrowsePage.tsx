import type { BrowseData } from "@/lib/catalog/types";
import { Hero } from "./Hero";
import { Rail } from "./Rail";
import { SourceErrors } from "./PageStates";

export function BrowsePage({ data, label }: { data: BrowseData; label: string }) {
  return (
    <div className="pb-16">
      <Hero items={data.featured} />
      <div className="relative z-10 -mt-12 space-y-10 md:-mt-16">
        <p className="px-4 text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground md:px-10">
          Browse {label} · released titles only
        </p>
        <SourceErrors errors={data.errors} />
        {data.rows.map((r) => (
          <Rail key={r.id} title={r.title} items={r.items} notice={r.notice} />
        ))}
      </div>
    </div>
  );
}
