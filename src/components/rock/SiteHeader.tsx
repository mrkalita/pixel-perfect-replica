import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Puzzle, Search, Settings, UserRound, Bookmark, Tv } from "lucide-react";
import { Logo } from "./Logo";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const NAV = [
  { to: "/", label: "Home" },
  { to: "/movies", label: "Movies" },
  { to: "/series", label: "Series" },
  { to: "/anime", label: "Anime" },
  { to: "/live-tv", label: "Live TV" },
  { to: "/my-space", label: "My Space" },
  { to: "/extensions", label: "Extensions" },
] as const;

export function SiteHeader() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={cn(
        "safe-top fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        solid ? "bg-background/95 backdrop-blur-md border-b border-border" : "bg-nav-fade",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1800px] items-center gap-6 px-4 md:px-10">
        <Logo />
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-5 text-sm">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  activeOptions={{ exact: n.to === "/" }}
                  className="text-muted-foreground transition-colors hover:text-foreground data-[status=active]:font-semibold data-[status=active]:text-foreground"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            to="/search"
            search={{ q: "" }}
            aria-label="Search"
            className="grid h-10 w-10 place-items-center rounded-full text-foreground/90 hover:bg-foreground/10"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Popover>
            <PopoverTrigger
              aria-label="Notifications"
              className="grid h-10 w-10 place-items-center rounded-full text-foreground/90 hover:bg-foreground/10"
            >
              <Bell className="h-5 w-5" />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 border-border bg-popover">
              <p className="font-display text-lg font-bold uppercase">Notifications</p>
              <p className="mt-2 text-sm text-muted-foreground">
                You're all caught up. New-episode alerts for titles in My List arrive once accounts are switched on.
              </p>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Profile menu"
              className="ml-1 grid h-9 w-9 place-items-center rounded-md bg-gradient-primary text-primary-foreground"
            >
              <UserRound className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-border bg-popover">
              <DropdownMenuLabel>
                Guest
                <span className="block text-xs font-normal text-muted-foreground">Saved on this device only</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/my-space"><Bookmark /> My Space</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="lg:hidden">
                <Link to="/live-tv"><Tv /> Live TV</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="lg:hidden">
                <Link to="/extensions"><Puzzle /> Extensions</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings"><Settings /> Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>Sign in with Google — coming soon</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
