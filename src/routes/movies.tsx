import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { moviesQuery } from "@/lib/catalog/queries";
import { BrowsePage } from "@/components/rock/BrowsePage";
import { BrowseSkeleton, PageError } from "@/components/rock/PageStates";

export const Route = createFileRoute("/movies")({
  head: () => ({
    meta: [
      { title: "Movies — ROCK PLAY" },
      { name: "description", content: "Recently released and trending movies, by genre." },
      { property: "og:title", content: "Movies — ROCK PLAY" },
      { property: "og:description", content: "Recently released and trending movies, by genre." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(moviesQuery()).then(() => undefined),
  pendingComponent: BrowseSkeleton,
  errorComponent: ({ error }) => <PageError error={error} />,
  notFoundComponent: () => <PageError error={new Error("Not found")} />,
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(moviesQuery());
  return <BrowsePage data={data} label="Movies" />;
}
