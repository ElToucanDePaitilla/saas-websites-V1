"use client";

import * as React from "react";
import { Wand2 } from "lucide-react";

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
  type NavPresetId,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * PANEL — Presets Onboarding de Navigation (Étape 4.4)
 * ----------------------------------------------------------------------------
 * Client Component **présentational** (aucune logique de store ici) : affiche
 * les 3 cartes de profil issues de `NAV_PRESETS` (spec §7.2-D) avec leur
 * structure « starter », un badge « Preset actif » sur la carte correspondant à
 * `appliedPresetId`, et un **Dialog de confirmation** avant application (le
 * menu principal actuel est remplacé).
 *
 * L'orchestration inter-stores (`PagesStore.updatePage` pour `inMenu` +
 * `NavigationStore.applyPreset`) reste dans `NavigationManager` — ce composant
 * reçoit `appliedPresetId` et `onApply` en propriétés.
 *
 * Référence : plans/ROADMAP-4.4-nav-presets-onboarding.md §4.2
 * ============================================================================
 */

/** Aperçu plat des libellés racine d'un preset (ex. « Accueil · Portfolio »). */
function rootLabels(presetId: NavPresetId): string {
  const preset = NAV_PRESETS.find((candidate) => candidate.id === presetId);
  if (!preset) {
    return "";
  }
  return preset.nodes.map((node) => node.label).join(" · ");
}

/** Labels des enfants (Niveau 2) d'un preset, toutes racines confondues. */
function childLabels(presetId: NavPresetId): string[] {
  const preset = NAV_PRESETS.find((candidate) => candidate.id === presetId);
  if (!preset) {
    return [];
  }
  return preset.nodes.flatMap((node) =>
    (node.children ?? []).map((child) => child.label)
  );
}

export function PresetOnboardingPanel({
  appliedPresetId,
  onApply,
}: {
  appliedPresetId: NavPresetId | null;
  onApply: (presetId: NavPresetId) => void;
}) {
  const [pendingId, setPendingId] = React.useState<NavPresetId | null>(null);

  const pendingPreset =
    NAV_PRESETS.find((preset) => preset.id === pendingId) ?? null;
  const pendingPreview = pendingId ? rootLabels(pendingId) : "";
  const pendingChildren = pendingId ? childLabels(pendingId) : [];

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
      <div className="border-b border-border px-4 py-3">
        <h2
          id="presets-onboarding-title"
          className="flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          <Wand2 aria-hidden="true" className="size-4 text-muted-foreground" />
          Presets Onboarding
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Démarrez le menu principal à partir d’un profil : appliquer un preset
          remplace la structure actuelle et réorganise les pages affichées au
          menu (les pages retirées restent créées).
        </p>
      </div>

      {/* Cartes de profils */}
      <div className="grid gap-3 p-3 sm:grid-cols-3">
        {NAV_PRESETS.map((preset) => {
          const isActive = appliedPresetId === preset.id;
          const children = childLabels(preset.id);
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
                    Preset actif
                  </Badge>
                ) : null}
              </div>

              <p className="text-xs leading-5 text-muted-foreground">
                {preset.tagline}
              </p>

              <div className="rounded-md border border-border/60 bg-background/60 px-2.5 py-2 text-xs text-foreground">
                <p className="leading-5">{rootLabels(preset.id)}</p>
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
              Appliquer le preset « {pendingPreset?.profile} » ?
            </DialogTitle>
            <DialogDescription>
              Le menu principal actuel sera remplacé par la structure :{" "}
              <span className="font-medium text-foreground">
                {pendingPreview}
              </span>
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
              Appliquer le preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
