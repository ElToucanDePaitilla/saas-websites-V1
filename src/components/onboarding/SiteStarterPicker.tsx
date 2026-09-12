"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NAV_PRESETS,
  presetChildLabels,
  presetRootLabels,
  type NavPresetId,
} from "@/lib/navigation";
import { persistApplyPreset } from "@/lib/persistence-client";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * SÉLECTEUR DE MODÈLES — écran de bienvenue (site vierge, Étape 4.4 / 10.1)
 * ----------------------------------------------------------------------------
 * Client Component island embarqué dans le Server Component `WelcomeOnboarding`
 * (rendu sur `/` quand aucune page d'accueil n'existe).
 *
 * Sur un site vierge, **aucun store n'est monté** (le layout public rend un
 * shell sans chrome) : l'application d'un modèle passe donc par l'API serveur
 * `POST /api/navigation/presets` (transaction atomique — cf.
 * `persistApplyPreset`), et non par le store client du Back-Office.
 *
 * Un modèle est un **état de départ** : il structure le menu principal mais ne
 * crée ni page ni contenu. Après application, l'écran propose l'étape suivante
 * logique — créer et publier la page d'accueil.
 *
 * Références : plans/ROADMAP-4.4-nav-presets-onboarding.md §4.2 —
 *              plans/ROADMAP-10.1-site-starter-onboarding.md §D-3
 * ============================================================================
 */

export function SiteStarterPicker() {
  const [pendingId, setPendingId] = React.useState<NavPresetId | null>(null);
  const [busyId, setBusyId] = React.useState<NavPresetId | null>(null);
  const [appliedId, setAppliedId] = React.useState<NavPresetId | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const pendingPreset =
    NAV_PRESETS.find((preset) => preset.id === pendingId) ?? null;
  const pendingPreview = pendingId
    ? presetRootLabels(pendingId).join(" · ")
    : "";

  async function apply(presetId: NavPresetId) {
    setPendingId(null);
    setBusyId(presetId);
    setError(null);
    try {
      await persistApplyPreset(presetId);
      setAppliedId(presetId);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Application impossible."
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {NAV_PRESETS.map((preset) => {
          const isBusy = busyId === preset.id;
          const isApplied = appliedId === preset.id;
          const children = presetChildLabels(preset.id);
          return (
            <div
              key={preset.id}
              className={cn(
                "flex flex-col gap-3 rounded-lg border p-4",
                isApplied
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background/60"
              )}
            >
              <p className="text-sm font-semibold text-foreground">
                {preset.profile}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {preset.tagline}
              </p>
              <div className="rounded-md border border-border/60 bg-background/60 px-2.5 py-2 text-xs text-foreground">
                <p className="leading-5">
                  {presetRootLabels(preset.id).join(" · ")}
                </p>
                {children.length > 0 ? (
                  <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                    Sous-menu : {children.join(" · ")}
                  </p>
                ) : null}
              </div>
              <Button
                size="sm"
                variant={isApplied ? "secondary" : "default"}
                className="mt-auto w-full"
                disabled={busyId !== null}
                onClick={() => setPendingId(preset.id)}
              >
                {isBusy ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Application…
                  </>
                ) : isApplied ? (
                  <>
                    <Check />
                    Modèle appliqué
                  </>
                ) : (
                  "Appliquer ce modèle"
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : null}

      {appliedId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3">
          <p className="text-xs leading-relaxed text-foreground">
            Le menu principal est prêt. Créez et publiez maintenant votre{" "}
            <strong className="font-semibold">page d’accueil</strong> : elle
            s’affichera sur <span className="font-mono">/</span>.
          </p>
          <Button asChild size="sm" className="shrink-0">
            <Link href="/admin/pages">
              Créer ma page d’accueil
              <ArrowRight />
            </Link>
          </Button>
        </div>
      ) : null}

      {/* ---- Dialog de confirmation d'application ---- */}
      <Dialog
        open={pendingPreset !== null}
        onOpenChange={(open) => !open && setPendingId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Appliquer le modèle « {pendingPreset?.profile} » ?
            </DialogTitle>
            <DialogDescription>
              Le menu principal sera remplacé par la structure :{" "}
              <span className="font-medium text-foreground">
                {pendingPreview}
              </span>
              . Les modèles agissent sur la navigation uniquement : ils ne
              créent ni pages ni contenus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingId(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (pendingId) {
                  void apply(pendingId);
                }
              }}
            >
              <Wand2 />
              Appliquer le modèle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
