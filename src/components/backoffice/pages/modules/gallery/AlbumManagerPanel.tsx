"use client";

import type { GalleryAlbum } from "@/lib/pages";

import { EDITOR_TYPE } from "../editor-type";
import { AlbumGrid } from "./AlbumGrid";

/**
 * ============================================================================
 * GESTIONNAIRE D'ALBUMS — variante PORTFOLIO (Phase 11, refonte 11.20)
 * ----------------------------------------------------------------------------
 * Le panneau ne conserve que la **composition** (§3.4 du plan 11.20) :
 *   1. **compteur d'albums** en phrase complète — « Nombre d'Albums actuellement
 *      créés : N » — pour qu'un non-technicien n'ait pas à interpréter un
 *      « N albums » télégraphique (11.23) ;
 *   2. phrase de cadrage (ce qu'est un album, pour un non-technicien) ;
 *   3. **grille de vignettes** (`AlbumGrid`) : création, masquage et
 *      réordonnancement.
 *
 * **11.23 — le bloc « Importer un dossier d'albums » a été retiré.** La création
 * d'albums passe désormais par **un seul parcours**, la tuile « + Nouvel album »
 * de la grille : le bloc encadré et son bouton « Choisir un dossier d'albums »
 * ouvraient une **seconde porte d'entrée** vers la même intention, avec un
 * paragraphe d'explication de surcroît (constat de recette). Le composant
 * `AlbumFolderImportPanel` a été **supprimé du projet**, ainsi que la phrase de
 * cadrage qui y renvoyait (« Un dossier importé devient un album ») : aucun
 * élément, style ni gestionnaire d'événement résiduel.
 *
 * **11.20.c — le bloc « Affichage sur les couvertures » a déménagé** dans la
 * zone « Format des couvertures des albums » ([`AlbumCoverBadgePanel`]) : il
 * décrit l'**aspect** d'une couverture, non le contenu de la galerie. Cette
 * zone-ci ne contient donc plus que le **contenu** — les albums — et leur
 * import ; tout ce qui habille une vignette vit désormais dans la zone
 * « Apparence », sous « Format des couvertures ».
 *
 * La liste d'albums dépliés en permanence a été retirée : sa hauteur croissait
 * en *albums × photos*, ce qui rendait la création de plusieurs dizaines
 * d'albums impraticable.
 *
 * **Séparation de la vue d'album (11.20.a).** Ce panneau ne rend **plus** le
 * formulaire d'album : il ne contient que les réglages de la **galerie entière**.
 * La vue d'album est rendue par l'éditeur de galerie, dans une `EditorZone`
 * **sœur** dotée d'une **autre couleur d'accent** — c'est ce qui fait changer la
 * barre verticale au-dessus du bouton de retour. Tant que le formulaire d'album
 * était rendu ici, *dans* la zone « Les albums », il héritait de la même barre et
 * semblait partager sa portée (constat de recette). Pendant l'édition, la grille
 * cède la place : `editingAlbumId !== null` la masque.
 * ============================================================================
 */

type AlbumManagerPanelProps = {
  albums: GalleryAlbum[];
  onChange: (albums: GalleryAlbum[]) => void;
  /**
   * Album ouvert dans la vue d'édition, ou `null`. La grille est **masquée**
   * pendant l'édition : la vue d'album est rendue ailleurs, dans sa propre zone
   * d'accent (11.20.a).
   */
  editingAlbumId: string | null;
  /** Ouvre la vue d'édition d'un album (état porté par l'éditeur de galerie). */
  onOpenAlbum: (albumId: string) => void;
};

export function AlbumManagerPanel({
  albums,
  onChange,
  editingAlbumId,
  onOpenAlbum,
}: AlbumManagerPanelProps) {
  return (
    <div className="grid gap-3">
      {/* Compteur en **phrase** (niveau ML-b de l'échelle des éditeurs) : c'est
          une annotation, non un niveau de structure — les capitales du
          micro-libellé ML conviendraient mal à une phrase complète. */}
      <p className={EDITOR_TYPE.annotation}>
        Nombre d’Albums actuellement créés : {albums.length}
      </p>

      {/* Phrase de cadrage : explique ce qu'est un album à un non-technicien.
          La mention « Un dossier importé devient un album » a disparu en 11.23,
          avec le parcours d'import groupé qu'elle décrivait. */}
      <p className="text-xs text-muted-foreground">
        Un album regroupe des photos autour d’un thème : mariage, portrait,
        corporate… Cliquez sur « Nouvel album » pour en créer un, puis nommez-le
        et ajoutez-y ses photos.
      </p>

      {/* Grille de vignettes (lot B). Pendant l'édition d'un album, elle cède
          la place : la vue d'album est rendue par l'éditeur de galerie, dans sa
          propre zone d'accent (11.20.a) — c'est ce qui fait changer la couleur
          de la barre verticale au-dessus du bouton de retour. */}
      {editingAlbumId === null ? (
        <AlbumGrid
          albums={albums}
          onChange={onChange}
          onOpenAlbum={onOpenAlbum}
        />
      ) : (
        <p className="rounded-md border border-dashed border-border bg-background/50 px-3 py-2 text-xs text-muted-foreground">
          La liste des albums est masquée pendant l’édition de l’un d’eux. Les
          réglages ci-dessus portent sur la galerie entière.
        </p>
      )}
    </div>
  );
}
