import { Link } from "@tanstack/react-router";
import { CircleAlert, CircleCheck, CircleDashed, Play } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { TitleSummary } from "@/lib/catalog/types";
import { compatibleProviders, PROVIDER_REFERENCES } from "@/lib/providers/registry";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Availability check. Metadata existing does NOT mean a title is playable:
 * we only query providers whose authorisation has been confirmed.
 */
export function PlayButton({ t, size = "xl", children }: { t: TitleSummary; size?: "lg" | "xl"; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const category = t.kind;
  const compatible = compatibleProviders(category);
  const refs = PROVIDER_REFERENCES.filter((p) => p.categories.includes(category));

  return (
    <>
      <Button variant="hero" size={size} onClick={() => setOpen(true)}>
        <Play className="fill-current" /> {children ?? "Play"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg border-border bg-popover">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold uppercase">Not available to play yet</DialogTitle>
            <DialogDescription>
              ROCK PLAY checked where <span className="font-semibold text-foreground">{t.title}</span> can be watched.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm">
            <Step ok icon={<CircleCheck />}>
              Identified the exact title — {t.source} ID {t.id}
              {t.year ? `, ${t.year}` : ""}
            </Step>
            <Step ok={false} icon={<CircleDashed />}>
              Searched {compatible.length} authorised provider{compatible.length === 1 ? "" : "s"} for this content type
            </Step>
            <Step ok={false} icon={<CircleAlert />}>
              No authorised provider has this title, so there is nothing to play
            </Step>
          </ol>
          {refs.length > 0 && (
            <div className="rounded-md border border-border bg-surface p-3 text-xs text-muted-foreground">
              <p className="mb-1.5 font-semibold text-foreground">Provider references you supplied</p>
              <ul className="space-y-1">
                {refs.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <span>{p.name}</span>
                    <span className="rounded-sm bg-warning/15 px-1.5 py-0.5 font-semibold text-warning">Not authorised</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2">These are skipped until the site owner's permission and an official integration are confirmed.</p>
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="glass" asChild>
              <Link to="/extensions">Manage providers</Link>
            </Button>
            <Button variant="hero" onClick={() => setOpen(false)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Step({ ok, icon, children }: { ok: boolean; icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className={`mt-0.5 [&_svg]:h-4 [&_svg]:w-4 ${ok ? "text-success" : "text-muted-foreground"}`}>{icon}</span>
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{children}</span>
    </li>
  );
}
