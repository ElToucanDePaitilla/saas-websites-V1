"use client";

import {
  galleryBadgeDisplayLabels,
  galleryBadgeDisplayOrder,
  galleryBadgePositionLabels,
  galleryBadgePositionOrder,
  galleryBadgeStyleLabels,
  galleryBadgeStyleOrder,
  type GalleryBadgeDisplay,
  type GalleryBadgePosition,
  type GalleryBadgeSettings,
  type GalleryBadgeStyle,
} from "@/lib/pages";

import { HelpTip, SelectField } from "../form-fields";
import { SwitchField } from "./fields";

/**
 * ============================================================================
 * INFOS EN PIED DE COUVERTURE — Portfolio (Étape 11.20.c)
 * ----------------------------------------------------------------------------
 * Nom de l'album et nombre de photos affichés **par-dessus la couverture** :
 * quand, quoi, où et dans quel style.
 *
 * **Pourquoi ce bloc a déménagé.** Il vivait dans la zone « Les albums », à côté
 * du compteur et de l'import de dossier — donc du **contenu** — alors qu'il décrit
 * l'**aspect** d'une couverture. Il rejoint « Format des couvertures des albums »,
 * où il voisine avec l'arrondi, l'encadrement et l'ombre : tout ce qui habille
 * une vignette se règle désormais au même endroit.
 *
 * Aucun changement de données : les mêmes champs de `badge` (sans migration).
 * ============================================================================
 */

type AlbumCoverBadgePanelProps = {
  badge: GalleryBadgeSettings;
  onChange: (patch: Partial<GalleryBadgeSettings>) => void;
};

export function AlbumCoverBadgePanel({
  badge,
  onChange,
}: AlbumCoverBadgePanelProps) {
  return (
    <div className="grid gap-3 rounded-md border border-dashed border-border bg-background/40 p-3">
      <div className="flex items-center gap-1.5">
        <p className="text-[13px] font-semibold leading-snug text-foreground">
          Affichage des infos en pied de couverture des albums
        </p>
        <HelpTip tip="Nom de l’album et nombre de photos affichés par-dessus la couverture. Ces réglages valent pour toutes les couvertures de la galerie, jamais pour un album en particulier." />
      </div>

      {/* 1. QUAND afficher (aucun / permanent / au survol). */}
      <SelectField<GalleryBadgeDisplay>
        label="Quand afficher ces informations ?"
        value={badge.display}
        options={galleryBadgeDisplayOrder.map((value) => ({
          value,
          label: galleryBadgeDisplayLabels[value],
        }))}
        onChange={(display) => onChange({ display })}
      />

      {badge.display === "hover" ? (
        <p className="text-xs text-muted-foreground">
          Au survol de la souris — et toujours visible sur téléphone et
          tablette, où le doigt ne peut pas survoler la couverture.
        </p>
      ) : null}

      {badge.display === "none" ? (
        <p className="rounded-md border border-dashed border-border bg-background/50 px-3 py-2 text-xs text-muted-foreground">
          Aucune information ne sera affichée sur les couvertures : les réglages
          de contenu, de position et de style sont sans objet.
        </p>
      ) : (
        <>
          {/* 2. QUOI afficher. */}
          <div className="grid gap-2">
            <p className="text-xs font-medium text-foreground">
              Que faut-il afficher ?
            </p>
            <SwitchField
              label="Le nom de l’album"
              checked={badge.showLabel}
              onChange={(showLabel) => onChange({ showLabel })}
            />
            <SwitchField
              label="Le nombre de photos"
              checked={badge.showCount}
              onChange={(showCount) => onChange({ showCount })}
            />
          </div>

          {/* 3. COMMENT l'afficher (position + style). */}
          <div className="grid gap-3 sm:grid-cols-2">
            <SelectField<GalleryBadgePosition>
              label="Position"
              value={badge.position}
              options={galleryBadgePositionOrder.map((value) => ({
                value,
                label: galleryBadgePositionLabels[value],
              }))}
              onChange={(position) => onChange({ position })}
              tip="Le texte se place en bas ou en haut de la couverture. « En pied » n’est donc qu’un des choix possibles."
            />
            <SelectField<GalleryBadgeStyle>
              label="Style"
              value={badge.style}
              options={galleryBadgeStyleOrder.map((value) => ({
                value,
                label: galleryBadgeStyleLabels[value],
              }))}
              onChange={(style) => onChange({ style })}
            />
          </div>
        </>
      )}
    </div>
  );
}
