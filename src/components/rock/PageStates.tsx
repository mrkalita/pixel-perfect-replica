import { useRouter } from "@tanstack/react-router";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { HeroSkeleton } from "./Hero";
import { RailSkeleton } from "./Rail";

export function BrowseSkeleton() {
  return (
    <div className="pb-24">
      <HeroSkeleton />
      <div className="-mt-10 space-y-10">
        <RailSkeleton />
        <RailSkeleton />
      </div>
    </div>
  );
}

export function PageError({ error }: { error: unknown }) {
  const router = useRouter();
  const { reset } = useQueryErrorResetBoundary();
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 pt-20">
      <div className="max-w-md text-center">
        <CircleAlert className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 font-display text-3xl font-bold uppercase">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "A metadata service didn't respond."}
        </p>
        <Button
          variant="hero"
          className="mt-6"
          onClick={() => {
            reset();
            router.invalidate();
          }}
        >
          Try again
        </Button>
      </div>
    </div>
  );
}

export function PageNotFound({ label = "title" }: { label?: string }) {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 pt-20 text-center">
      <div>
        <h1 className="font-display text-4xl font-bold uppercase">We couldn't find that {label}</h1>
        <p className="mt-2 text-sm text-muted-foreground">It may not be released yet, or the link is out of date.</p>
      </div>
    </div>
  );
}

export function SourceErrors({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <p className="mx-4 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning md:mx-10">
      Some sources didn't respond ({errors.join(", ")}). Showing everything else.
    </p>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mx-auto max-w-[1800px] px-4 pb-6 pt-24 md:px-10 md:pt-28">
      {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-primary">{eyebrow}</p>}
      <h1 className="font-display text-5xl font-black uppercase leading-none md:text-6xl">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-sm text-muted-foreground">{children}</div>}
    </header>
  );
}
