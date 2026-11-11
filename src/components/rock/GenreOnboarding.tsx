import { useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { library, useLibrary } from "@/lib/library/store";
import { Button } from "@/components/ui/button";

const GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Science Fiction",
  "Thriller", "Family", "History", "Music", "War", "Western",
];

export function GenreOnboarding() {
  const profile = useLibrary();
  const [selected, setSelected] = useState<string[]>(profile.preferredGenres);
  const [showAll, setShowAll] = useState(false);

  if (profile.preferencesCompleted) return null;

  const toggle = (genre: string) => {
    setSelected((current) =>
      current.includes(genre) ? current.filter((g) => g !== genre) : [...current, genre],
    );
  };

  const finish = (skip = false) => {
    library.setPreferences(skip ? [] : selected, true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm" role="presentation">
      <section
        aria-labelledby="genre-onboarding-title"
        aria-modal="true"
        className="my-auto w-full max-w-2xl rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-8"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-4 w-4" /> Your ROCK PLAY profile
            </p>
            <h2 id="genre-onboarding-title" className="mt-3 text-3xl font-bold uppercase sm:text-4xl">
              What do you love watching?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose as many genres as you like. We'll use them to personalise your recommendations. You can change them later.
            </p>
          </div>
          <button aria-label="Skip preferences" onClick={() => finish(true)} className="rounded-full p-2 text-muted-foreground hover:bg-surface-raised hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(showAll ? GENRES : GENRES.slice(0, 12)).map((genre) => {
            const active = selected.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(genre)}
                className={`flex min-h-12 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors ${active ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"}`}
              >
                {genre}
                {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <button className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show fewer" : "Show all genres"}
          </button>
          <span className="text-xs text-muted-foreground">{selected.length} selected</span>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => finish(true)}>Skip for now</Button>
          <Button onClick={() => finish()} disabled={selected.length === 0}>Save preferences</Button>
        </div>
      </section>
    </div>
  );
}
