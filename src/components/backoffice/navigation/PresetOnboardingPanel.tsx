"use client";

import * as React from "react";
import { Wand2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * PANEL — Modèles de navigation (Étape 4.4)
 * ----------------------------------------------------------------------------
 * Client Component **présentational** (aucune logique de store ici) : affiche
 * les 3 cartes de profil issues de `NAV_PRESETS` (spec §7.2-D) avec leur
 * structure « starter », un badge « Modèle actif » sur la carte correspondant à
 * `appliedPresetId`, et un **Dialog de confirmation** avant application (le
 * menu principal actuel est remplacé).
 *
 * Sémantique : un modèle est un **état de départ**. Il n'est donc affiché par
 * défaut que lorsque la navigation est vide (`NavigationManager`) ; le reste du
 * temps il est accessible via la « Zone de réinitialisation ».
 *
 * L'orchestration inter-stores (`PagesStore.updatePage` pour `inMenu` +
 * `NavigationStore.applyPreset`) reste dans `NavigationManager` — ce composant
 * reçoit `appliedPresetId`, `onApply` et un `onClose` facultatif en propriétés.
 *
 * Référence : plans/ROADMAP-4.4-nav-presets-onboarding.md §4.2
 * ============================================================================
 */

/** Aperçu plat des libellés racine d'un modèle (ex. « Accueil · Portfolio »). */
function rootPreview(presetId: NavPresetId): string {
  return presetRootLabels(presetId).join(" · ");
}

export function PresetOnboardingPanel({
  appliedPresetId,
  onApply,
  onClose,
}: {
  appliedPresetId: NavPresetId | null;
  /** Applique le modèle (orchestration store côté appelant). */
  onApply: (presetId: NavPresetId) => void;
  /**
   * Ferme le panneau (affiché à la demande depuis la Zone de réinitialisation).
   * Absent quand le panneau est le point de départ (navigation vide).
   */
  onClose?: () => void;
}) {
  const [pendingId, setPendingId] = React.useState<NavPresetId | null>(null);

  const pendingPreset =
    NAV_PRESETS.find((preset) => preset.id === pendingId) ?? null;
  const pendingPreview = pendingId ? rootPreview(pendingId) : "";
  const pendingChildren = pendingId ? presetChildLabels(pendingId) : [];

  function confirmApply() {
    if (!pendingId) {
      return;
    }
    onApply(pendingId);
    setPendingId(null);
  }

  return (
    <section
      aria-labelledby="presets-onboarding-title"
      className="rounded-lg border border-border bg-card"
    >
      {/* En-tête de section */}
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2
            id="presets-onboarding-title"
            className="flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <Wand2 aria-hidden="true" className="size-4 text-muted-foreground" />
            Modèles de navigation
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Repartez d’une structure de menu prête à l’emploi selon votre
            profil. Appliquer un modèle{" "}
            <strong className="font-semibold text-foreground">
              remplace tout le menu principal actuel
            </strong>{" "}
            et réorganise les pages affichées au menu (les pages retirées
            restent créées).
          </p>
        </div>
        {onClose ? (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            aria-label="Fermer les modèles de navigation"
            onClick={onClose}
          >
            <X />
          </Button>
        ) : null}
      </div>

      {/* Cartes de profils */}
      <div className="grid gap-3 p-3 sm:grid-cols-3">
        {NAV_PRESETS.map((preset) => {
          const isActive = appliedPresetId === preset.id;
          const children = presetChildLabels(preset.id);
          return (
            <div
              key={preset.id}
              className={cn(
                "flex flex-col gap-3 rounded-md border p-3.5 transition-colors",
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background/50"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-5 text-foreground">
                  {preset.profile}
                </p>
                {isActive ? (
                  <Badge className="shrink-0 rounded-sm px-1.5 py-0">
                    Modèle actif
                  </Badge>
                ) : null}
              </div>

              <p className="text-xs leading-5 text-muted-foreground">
                {preset.tagline}
              </p>

              <div className="rounded-md border border-border/60 bg-background/60 px-2.5 py-2 text-xs text-foreground">
                <p className="leading-5">{rootPreview(preset.id)}</p>
                {children.length > 0 ? (
                  <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                    Sous-menu : {children.join(" · ")}
                  </p>
                ) : null}
              </div>

              <Button
                size="sm"
                variant={isActive ? "secondary" : "default"}
                className="mt-auto w-full"
                onClick={() => setPendingId(preset.id)}
              >
                {isActive ? "Réappliquer" : "Appliquer"}
              </Button>
            </div>
          );
        })}
      </div>

      {/* ---- Dialog de confirmation d'application ---- */}
      <Dialog open={pendingPreset !== null} onOpenChange={(open) => !open && setPendingId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Appliquer le modèle « {pendingPreset?.profile} » ?
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">
                Attention : tout le menu principal actuel sera remplacé
              </span>{" "}
              par la structure : {pendingPreview}
              {pendingChildren.length > 0
                ? ` (sous-menu : ${pendingChildren.join(" · ")})`
                : ""}
              . Les pages non retenues par ce profil seront retirées du menu
              (case « Ajouter au menu » décochée) mais restent créées dans les
              Pages. Le pied de page n’est pas modifié.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingId(null)}>
              Annuler
            </Button>
            <Button onClick={confirmApply}>
              <Wand2 />
              Appliquer le modèle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
