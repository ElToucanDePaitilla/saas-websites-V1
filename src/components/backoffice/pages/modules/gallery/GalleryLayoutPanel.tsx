"use client";

import {
  galleryDisplayLabels,
  galleryDisplayOrder,
  galleryHoverAnimationLabels,
  galleryHoverAnimationOrder,
  type GalleryDisplayMode,
  type GalleryHoverAnimation,
  type GalleryLayoutOptions,
  type GalleryModuleVariant,
} from "@/lib/pages";

import { SelectField, TextField } from "../form-fields";
import { SwitchField } from "./fields";

/**
 * ============================================================================
 * PANNEAU MISE EN PAGE GALERIE (Phase 11)
 * ----------------------------------------------------------------------------
 * Réglages communs aux trois variantes : mode d'affichage (uniforme/masonry),
 * colonnes, écarts H/V, arrondi, animation au survol et voile dégradé.
 * Le voile est masqué sur la variante **dynamic** (exigence : aucun titre ni
 * voile sombre au survol).
 * ============================================================================
 */

type GalleryLayoutPanelProps = {
  layout: GalleryLayoutOptions;
  variant: GalleryModuleVariant;
  onChange: (patch: Partial<GalleryLayoutOptions>) => void;
};

/** Convertit une saisie en entier borné (retourne `null` si invalide). */
function parseBounded(value: string, min: number, max: number): number | null {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.min(Math.max(parsed, min), max);
}

export function GalleryLayoutPanel({
  layout,
  variant,
  onChange,
}: GalleryLayoutPanelProps) {
  const dynamic = variant === "dynamic";

  return (
    <div className="grid gap-3 rounded-md border border-border bg-background/50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Mise en page
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField<GalleryDisplayMode>
          label="Mode d'affichage"
          value={layout.display}
          options={galleryDisplayOrder.map((value) => ({
            value,
            label: galleryDisplayLabels[value],
          }))}
          onChange={(display) => onChange({ display })}
          hint="Uniforme : grille régulière. Masonry : colonnes à hauteurs libres."
        />

        <SelectField<GalleryHoverAnimation>
          label="Animation au survol"
          value={layout.hoverAnimation}
          options={galleryHoverAnimationOrder.map((value) => ({
            value,
            label: galleryHoverAnimationLabels[value],
          }))}
          onChange={(hoverAnimation) => onChange({ hoverAnimation })}
          hint="Zoom subtil et élévation de la vignette au survol."
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TextField
          label="Colonnes"
          type="number"
          value={String(layout.columns)}
          onChange={(value) => {
            const parsed = parseBounded(value, 1, 6);
            if (parsed !== null) {
              onChange({ columns: parsed });
            }
          }}
          hint="Photos par ligne (1 à 6). Réduit automatiquement sur mobile."
        />
        <TextField
          label="Écart horizontal"
          type="number"
          value={String(layout.gapHorizontal)}
          onChange={(value) => {
            const parsed = parseBounded(value, 0, 200);
            if (parsed !== null) {
              onChange({ gapHorizontal: parsed });
            }
          }}
          hint="Espace entre deux photos (px)."
        />
        <TextField
          label="Écart vertical"
          type="number"
          value={String(layout.gapVertical)}
          onChange={(value) => {
            const parsed = parseBounded(value, 0, 200);
            if (parsed !== null) {
              onChange({ gapVertical: parsed });
            }
          }}
          hint="Espace entre deux lignes (px)."
        />
        <TextField
          label="Arrondi des coins"
          type="number"
          value={String(layout.radius)}
          onChange={(value) => {
            const parsed = parseBounded(value, 0, 200);
            if (parsed !== null) {
              onChange({ radius: parsed });
            }
          }}
          hint="Courbure des coins (px)."
        />
      </div>

      {!dynamic ? (
        <SwitchField
          label="Voile dégradé au survol"
          description="Assombrit le bas de la photo pour améliorer la lisibilité d'un texte."
          checked={layout.hoverOverlay}
          onChange={(hoverOverlay) => onChange({ hoverOverlay })}
        />
      ) : null}

      <p className="text-xs text-muted-foreground">
        Ces réglages s’appliquent à l’affichage public de la galerie.
      </p>
    </div>
  );
}
