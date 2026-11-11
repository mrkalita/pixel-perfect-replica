import { Link } from "@tanstack/react-router";
import { Clapperboard, Home, MonitorPlay, Search, Sparkles, UserRound } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/movies", label: "Movies", icon: Clapperboard },
  { to: "/series", label: "Series", icon: MonitorPlay },
  { to: "/anime", label: "Anime", icon: Sparkles },
  { to: "/search", label: "Search", icon: Search },
  { to: "/my-space", label: "My Space", icon: UserRound },
] as const;

export function MobileNav() {
  return (
    <nav
      aria-label="Mobile"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden"
    >
      <ul className="grid grid-cols-6">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              {...(to === "/search" ? { search: { q: "" } } : {})}
              activeOptions={{ exact: to === "/" }}
              className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-muted-foreground data-[status=active]:text-primary"
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
