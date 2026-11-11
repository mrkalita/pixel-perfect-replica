import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { library, useLibrary } from "@/lib/library/store";
import { PageHeader } from "@/components/rock/PageStates";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ROCK PLAY" },
      { name: "description", content: "Region, data and account settings for ROCK PLAY." },
      { property: "og:title", content: "Settings — ROCK PLAY" },
      { property: "og:description", content: "Region, data and account settings for ROCK PLAY." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const lib = useLibrary();
  const rows = [
    {
      title: "Release region",
      body: "Release dates and episode schedules follow the United States. More regions arrive with a licensed metadata source.",
      action: null,
    },
    {
      title: "My List",
      body: `${lib.myList.length} saved title${lib.myList.length === 1 ? "" : "s"} on this device.`,
      action: (
        <Button variant="glass" size="sm" disabled={!lib.myList.length} onClick={() => { library.clearList(); toast("My List cleared"); }}>
          Clear
        </Button>
      ),
    },
    {
      title: "Recently viewed",
      body: `${lib.viewed.length} title page${lib.viewed.length === 1 ? "" : "s"} remembered for recommendations.`,
      action: (
        <Button variant="glass" size="sm" disabled={!lib.viewed.length} onClick={() => { library.clearViewed(); toast("Viewing history cleared"); }}>
          Clear
        </Button>
      ),
    },
    {
      title: "Account",
      body: "Google sign-in and cross-device sync are planned for a later stage.",
      action: <Button variant="glass" size="sm" disabled>Sign in with Google</Button>,
    },
  ];
  return (
    <div className="pb-16">
      <PageHeader eyebrow="Preferences" title="Settings" />
      <ul className="mx-auto max-w-3xl divide-y divide-border rounded-lg border border-border bg-surface px-4 md:mx-10">
        {rows.map((r) => (
          <li key={r.title} className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="font-semibold">{r.title}</p>
              <p className="text-sm text-muted-foreground">{r.body}</p>
            </div>
            {r.action}
          </li>
        ))}
      </ul>
    </div>
  );
}
