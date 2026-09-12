"use client";

import {
  galleryDisplayDescriptions,
  galleryDisplayLabels,
  galleryDisplayOrder,
  type GalleryDisplayMode,
  type GalleryLayoutOptions,
} from "@/lib/pages";

import { SelectField, TextField } from "../form-fields";

/**
 * ============================================================================
 * PANNEAU « DISPOSITION DES VIGNETTES » — Galerie (Phase 11, réorganisé 11.20.c)
 * ----------------------------------------------------------------------------
 * Uniquement **l'agencement** : combien de vignettes par ligne, avec quel
 * espacement, et sous quel format (toutes identiques / chacune le sien).
 *
 * **L'arrondi n'est plus ici** : il est passé dans le bloc « Format des
 * couvertures » (`EffectSettingsPanel`), aux côtés de l'encadrement et de
 * l'ombre portée — c'est là qu'on décide de l'aspect d'une vignette, et c'est
 * cette proximité qui manquait (constat de recette : l'arrondi *paraissait*
 * incompatible avec l'encadrement, faute d'être réglé au même endroit).
 *
 * Ordre des champs : du plus structurant (le nombre de colonnes) au plus
 * qualitatif (le format d'affichage), pour qu'un non-technicien descende la
 * logique au lieu de rencontrer un choix de style avant de savoir combien de
 * colonnes il aura.
 *
 * Les libellés restent **neutres** (« vignettes », « format ») : cette zone est
 * partagée par les trois variantes, c'est la **sous-zone parente** qui nomme
 * l'objet (couvertures d'albums ou photos).
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TextField
          label="Nombre de colonnes"
          type="number"
          value={String(layout.columns)}
          onChange={(value) => {
            const parsed = parseBounded(value, 1, 6);
            if (parsed !== null) {
              onChange({ columns: parsed });
            }
          }}
          hint="Vignettes par ligne (1 à 6). Réduit automatiquement sur mobile."
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
          hint="Espace entre deux vignettes (px)."
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
      </div>

      {/* Chaque option porte **sa propre explication** dans la liste déroulante :
          aucune phrase d'aide sous le champ, qui ne ferait que la redire. */}
      <SelectField<GalleryDisplayMode>
        label="Format d’affichage"
        value={layout.display}
        options={galleryDisplayOrder.map((value) => ({
          value,
          label: galleryDisplayLabels[value],
          description: galleryDisplayDescriptions[value],
        }))}
        onChange={(display) => onChange({ display })}
        tip="Comment les vignettes se présentent les unes par rapport aux autres. Cela ne change que la forme des cases, jamais les images."
      />
    </div>
  );
}
