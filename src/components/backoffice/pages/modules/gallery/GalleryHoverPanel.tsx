"use client";

import {
  galleryHoverAnimationLabels,
  galleryHoverAnimationOrder,
  type GalleryHoverAnimation,
  type GalleryLayoutOptions,
  type GalleryModuleVariant,
} from "@/lib/pages";

import { SelectField } from "../form-fields";
import { SwitchField } from "./fields";

/**
 * ============================================================================
 * BLOC « AU SURVOL DES PHOTOS » — Galeries (Étape 11.17)
 * ----------------------------------------------------------------------------
 * Réunit les **deux seuls** réglages de survol de la galerie :
 *   - `layout.hoverAnimation` — zoom léger et élévation de la vignette ;
 *   - `layout.hoverOverlay`   — voile dégradé sombre sous la photo.
 *
 * Créé pour supprimer un doublon réel : `hoverAnimation` était exposé **deux
 * fois** — dans `ModuleSettingsForm` (« Réglages », en haut du formulaire) et
 * dans `GalleryLayoutPanel` (« Mise en page », bien plus bas) — les deux
 * écrivant la même valeur (plans/ROADMAP-11.17-editor-zones-ux.md §0.4).
 *
 * Le regroupement supprime aussi la collision de vocabulaire avec
 * « Animation d'entrée » (qui concerne, elle, l'apparition du bloc à
 * l'arrivée sur la page).
 *
 * Le voile reste indisponible sur la variante **dynamic** : exigence de
 * conception déjà documentée en Phase 11 (aucun voile sombre au survol).
 *
 * Référence : plans/ROADMAP-11.17-editor-zones-ux.md §4.3
 * ============================================================================
 */

type GalleryHoverPanelProps = {
  layout: GalleryLayoutOptions;
  variant: GalleryModuleVariant;
  onChange: (patch: Partial<GalleryLayoutOptions>) => void;
};

export function GalleryHoverPanel({
  layout,
  variant,
  onChange,
}: GalleryHoverPanelProps) {
  const dynamic = variant === "dynamic";

  return (
    <div className="grid gap-3">
      <SelectField<GalleryHoverAnimation>
        label="Effet au survol des photos"
        value={layout.hoverAnimation}
        options={galleryHoverAnimationOrder.map((value) => ({
          value,
          label: galleryHoverAnimationLabels[value],
        }))}
        onChange={(hoverAnimation) => onChange({ hoverAnimation })}
        hint="Au passage de la souris sur une photo : zoom léger et léger soulèvement."
      />

      {dynamic ? (
        <p className="text-xs text-muted-foreground">
          Cette variante n’applique aucun voile sombre au survol (choix de
          conception).
        </p>
      ) : (
        <SwitchField
          label="Voile dégradé au survol"
          description="Assombrit le bas de la photo pour améliorer la lisibilité d'un texte."
          checked={layout.hoverOverlay}
          onChange={(hoverOverlay) => onChange({ hoverOverlay })}
        />
      )}
    </div>
  );
}
