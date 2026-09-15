"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  CONTENT_COLUMN_COUNTS,
  contentGapLabels,
  contentGapOrder,
  contentMaxWidthLabels,
  contentMaxWidthOrder,
  contentStackAtLabels,
  contentStackAtOrder,
  type ContentColumnCount,
  type ContentColumnsLayout,
  type ContentContainer,
} from "@/lib/pages";

import { EDITOR_TYPE } from "../editor-type";
import { EditorSubZone } from "../EditorZone";
import { SelectField } from "../form-fields";
import { ToggleRow } from "./EditorToggleRow";

/**
 * ============================================================================
 * RÉGLAGES DE MISE EN PAGE — section « Contenu en colonnes » (Étape 12.1)
 * ----------------------------------------------------------------------------
 * Reprend **la boîte de dialogue « Colonnes » de Word**, dans le vocabulaire de
 * l'utilisateur et sans aucun jargon (P4) :
 *
 *   | Word                          | Ici                                    |
 *   |-------------------------------|----------------------------------------|
 *   | Préréglages Une…Quatre        | Nombre de colonnes                     |
 *   | case « Largeur identique »    | « Colonnes de même largeur » (cochée)  |
 *   | Largeur (par colonne)         | Répartition (curseurs + pourcentages)  |
 *   | Espacement                    | Espacement                             |
 *   | case « Ligne entre les … »    | « Séparateur vertical »                |
 *   | Aperçu                        | l'aperçu de la section, en direct      |
 *
 * Deux principes tenus par la construction :
 *   - **« Colonnes de même largeur » est cochée par défaut** : l'utilisateur
 *     obtient un partage équilibré sans rien régler, et ne découvre les réglages
 *     individuels qu'après l'avoir décochée ;
 *   - **aucun réglage en pixels** : tout est jeton, et la largeur de chaque
 *     colonne est *déduite* des autres — le total fait toujours 100 %.
 * ============================================================================
 */

/** Libellés de l'alignement vertical (le résultat, pas la technique). */
const VERTICAL_ALIGN_OPTIONS = [
  {
    value: "stretch" as const,
    label: "Toutes de la même hauteur",
    description:
      "Les colonnes s’étirent jusqu’à la hauteur de la plus haute. Recommandé quand elles portent un fond ou un encadré.",
  },
  {
    value: "start" as const,
    label: "Alignées en haut",
    description:
      "Chaque colonne s’arrête à la fin de son contenu. Recommandé pour du texte de longueurs différentes.",
  },
  {
    value: "center" as const,
    label: "Centrées verticalement",
    description:
      "Les colonnes sont centrées les unes par rapport aux autres — utile face à une grande photo.",
  },
];

type ContentLayoutControlsProps = {
  layout: ContentColumnsLayout;
  containers: ContentContainer[];
  /** Parts relatives (0–1) de chaque colonne — calculées par le domaine. */
  fractions: number[];
  onLayoutChange: (patch: Partial<ContentColumnsLayout>) => void;
  onCountChange: (count: ContentColumnCount) => void;
  onWeightChange: (containerId: string, weight: number) => void;
};

export function ContentLayoutControls({
  layout,
  containers,
  fractions,
  onLayoutChange,
  onCountChange,
  onWeightChange,
}: ContentLayoutControlsProps) {
  return (
    <div className="grid gap-4">
      {/* --- Nombre de colonnes ------------------------------------------- */}
      <div className="grid gap-1.5">
        <p className={EDITOR_TYPE.fieldLabel}>Nombre de colonnes</p>
        <div
          role="group"
          aria-label="Nombre de colonnes"
          className="flex flex-wrap gap-2"
        >
          {CONTENT_COLUMN_COUNTS.map((count) => (
            <Button
              key={count}
              type="button"
              size="sm"
              variant={count === containers.length ? "default" : "outline"}
              aria-pressed={count === containers.length}
              onClick={() => onCountChange(count)}
            >
              {count}
            </Button>
          ))}
        </div>
        <p className={EDITOR_TYPE.hint}>
          Sur téléphone, les colonnes s’empilent les unes au-dessus des autres :
          rien n’est perdu.
        </p>
      </div>

      {/* --- Largeur identique / répartition ------------------------------ */}
      <ToggleRow
        id="content-same-width"
        label="Colonnes de même largeur"
        hint="Décochez pour régler la largeur de chaque colonne."
        checked={layout.sameWidth}
        onChange={(sameWidth) => onLayoutChange({ sameWidth })}
      />

      {!layout.sameWidth && containers.length > 1 ? (
        <EditorSubZone title="Répartition des colonnes">
          {containers.map((container, index) => (
            <div key={container.id} className="grid gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label
                  htmlFor={`content-weight-${container.id}`}
                  className={EDITOR_TYPE.fieldLabel}
                >
                  Colonne {index + 1}
                </Label>
                <span className={EDITOR_TYPE.annotation}>
                  {Math.round((fractions[index] ?? 0) * 100)} %
                </span>
              </div>
              <input
                id={`content-weight-${container.id}`}
                type="range"
                min={1}
                max={5}
                step={1}
                value={container.weight}
                onChange={(event) =>
                  onWeightChange(container.id, Number(event.target.value))
                }
                className="accent-primary w-full"
              />
            </div>
          ))}
          <p className={EDITOR_TYPE.hint}>
            Les pourcentages sont calculés à partir des autres colonnes : le total
            fait toujours 100 %.
          </p>
        </EditorSubZone>
      ) : null}

      {/* --- Largeur totale ----------------------------------------------- */}
      <SelectField
        label="Largeur de la section"
        value={layout.maxWidth}
        options={contentMaxWidthOrder.map((value) => ({
          value,
          label: contentMaxWidthLabels[value],
        }))}
        onChange={(maxWidth) => onLayoutChange({ maxWidth })}
        hint="Jusqu’où la section s’étend sur la page."
      />

      {/* --- Espacement et séparateur ------------------------------------- */}
      <SelectField
        label="Espacement entre les colonnes"
        value={layout.gap}
        options={contentGapOrder.map((value) => ({
          value,
          label: contentGapLabels[value],
        }))}
        onChange={(gap) => onLayoutChange({ gap })}
        hint="S’applique aussi à l’écart vertical lorsque les colonnes s’empilent."
      />

      <ToggleRow
        id="content-separator"
        label="Séparateur vertical"
        hint="Un trait fin entre les colonnes — uniquement lorsqu’elles sont côte à côte."
        checked={layout.separator}
        onChange={(separator) => onLayoutChange({ separator })}
      />

      {/* --- Comportement responsive et vertical -------------------------- */}
      <SelectField
        label="Empiler les colonnes à partir de"
        value={layout.stackAt}
        options={contentStackAtOrder.map((value) => ({
          value,
          label: contentStackAtLabels[value],
        }))}
        onChange={(stackAt) => onLayoutChange({ stackAt })}
        hint="En dessous de cette taille d’écran, les colonnes passent l’une sous l’autre."
      />

      <SelectField
        label="Alignement vertical des colonnes"
        value={layout.verticalAlign}
        options={VERTICAL_ALIGN_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
          description: option.description,
        }))}
        onChange={(verticalAlign) => onLayoutChange({ verticalAlign })}
      />
    </div>
  );
}
