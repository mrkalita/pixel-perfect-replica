import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { seriesQuery } from "@/lib/catalog/queries";
import { BrowsePage } from "@/components/rock/BrowsePage";
import { BrowseSkeleton, PageError } from "@/components/rock/PageStates";

export const Route = createFileRoute("/series")({
  head: () => ({
    meta: [
      { title: "Series — ROCK PLAY" },
      { name: "description", content: "Latest episodes, trending and top rated series." },
      { property: "og:title", content: "Series — ROCK PLAY" },
      { property: "og:description", content: "Latest episodes, trending and top rated series." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(seriesQuery()).then(() => undefined),
  pendingComponent: BrowseSkeleton,
  errorComponent: ({ error }) => <PageError error={error} />,
  notFoundComponent: () => <PageError error={new Error("Not found")} />,
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(seriesQuery());
  return <BrowsePage data={data} label="Series" />;
}
