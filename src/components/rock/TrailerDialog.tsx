import { Film } from "lucide-react";
import { useState } from "react";
import type { Trailer } from "@/lib/catalog/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function TrailerButton({ trailer, title }: { trailer: Trailer | null; title: string }) {
  const [open, setOpen] = useState(false);
  if (!trailer) {
    return (
      <Button variant="glass" size="xl" disabled title="The metadata source lists no official trailer">
        <Film /> No trailer listed
      </Button>
    );
  }
  return (
    <>
      <Button variant="glass" size="xl" onClick={() => setOpen(true)}>
        <Film /> Watch Trailer
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl gap-3 border-border bg-background p-3 sm:p-4">
          <DialogTitle className="font-display text-xl font-bold uppercase">{title} — Trailer</DialogTitle>
          <DialogDescription className="text-xs">Source: {trailer.source}. Trailer only — not the full title.</DialogDescription>
          <div className="aspect-video w-full overflow-hidden rounded-md bg-surface">
            {open &&
              (trailer.type === "youtube" ? (
                <iframe
                  src={trailer.url}
                  title={`${title} trailer`}
                  className="h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                <video src={trailer.url} controls autoPlay playsInline className="h-full w-full bg-background" />
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
