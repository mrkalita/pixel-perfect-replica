import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { animeQuery } from "@/lib/catalog/queries";
import { BrowsePage } from "@/components/rock/BrowsePage";
import { BrowseSkeleton, PageError } from "@/components/rock/PageStates";

export const Route = createFileRoute("/anime")({
  head: () => ({
    meta: [
      { title: "Anime — ROCK PLAY" },
      { name: "description", content: "New anime episodes, trending, popular and top rated anime." },
      { property: "og:title", content: "Anime — ROCK PLAY" },
      { property: "og:description", content: "New anime episodes, trending, popular and top rated anime." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(animeQuery()).then(() => undefined),
  pendingComponent: BrowseSkeleton,
  errorComponent: ({ error }) => <PageError error={error} />,
  notFoundComponent: () => <PageError error={new Error("Not found")} />,
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(animeQuery());
  return <BrowsePage data={data} label="Anime" />;
}
