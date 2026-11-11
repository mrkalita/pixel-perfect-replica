import { Link } from "@tanstack/react-router";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" aria-label="ROCK PLAY home" className="group flex items-center gap-1.5 select-none">
      <span className="grid h-7 w-7 place-items-center rounded-sm bg-gradient-primary shadow-glow transition-transform group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-primary-foreground" aria-hidden>
          <path d="M7 4.5v15l12-7.5z" />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-2xl font-extrabold uppercase leading-none tracking-wide text-foreground">
          Rock<span className="text-primary">Play</span>
        </span>
      )}
    </Link>
  );
}
