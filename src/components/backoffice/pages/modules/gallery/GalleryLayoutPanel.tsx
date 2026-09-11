"use client";

import {
  galleryDisplayLabels,
  galleryDisplayOrder,
  type GalleryDisplayMode,
  type GalleryLayoutOptions,
} from "@/lib/pages";

import { SelectField, TextField } from "../form-fields";

/**
 * ============================================================================
 * BLOC « DISPOSITION DE LA GRILLE » — Galeries (Phase 11 / révisé en 11.17)
 * ----------------------------------------------------------------------------
 * Type de grille, colonnes, écarts et arrondi — réglages communs aux trois
 * variantes.
 *
 * Étape 11.17 :
 *   - le bloc n'a **plus sa propre boîte ni son titre** : ils sont fournis par
 *     `EditorZone`, qui porte le titre (« Disposition des photos ») et la phrase
 *     de portée. Le panneau ne rend plus que les champs.
 *   - les **réglages de survol** (effet de survol, voile dégradé) sont partis
 *     dans `GalleryHoverPanel` : ils étaient auparavant éclatés entre ce panneau
 *     et `ModuleSettingsForm`, deux contrôles écrivant la même valeur
 *     (plans/ROADMAP-11.17-editor-zones-ux.md §0.4 et §3.2).
 *
 * Référence : plans/ROADMAP-11.17-editor-zones-ux.md §4.3
 * ============================================================================
 */

type GalleryLayoutPanelProps = {
  layout: GalleryLayoutOptions;
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
  onChange,
}: GalleryLayoutPanelProps) {
  return (
    <div className="grid gap-3">
      <SelectField<GalleryDisplayMode>
        label="Type de grille"
        value={layout.display}
        options={galleryDisplayOrder.map((value) => ({
          value,
          label: galleryDisplayLabels[value],
        }))}
        onChange={(display) => onChange({ display })}
        hint="Grille régulière : toutes les photos ont la même hauteur. Mosaïque : les colonnes gardent des hauteurs libres."
      />

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
    </div>
  );
}
