"use client";

import type { DragEvent } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

import { MediaImage } from "@/components/common/MediaImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  galleryAlbumCover,
  galleryAlbumPhotoCount,
  type GalleryAlbum,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 * VIGNETTE D'ALBUM — Portfolio (Étape 11.20, lot B)
 * ----------------------------------------------------------------------------
 * Une cellule de la grille d'albums : couverture, nom, nombre de photos et
 * numéro d'ordre. Les **actions** (masquer, éditer, monter/descendre,
 * supprimer) sont révélées au survol **et au focus clavier** (`group-focus-within`)
 * — jamais uniquement à la souris (accessibilité, décision A-4/§5.2).
 *
 * Signale explicitement les cas **invisibles sur le site public** :
 *   - album **masqué** → badge « Masqué » permanent ;
 *   - album **sans photo** → mention « Aucune photo — invisible sur le site ».
 *
 * Composant **présentationnel** : aucune mutation, tout remonte par callbacks.
 * ============================================================================
 */

/** Câblage du glisser-déposer fourni par la grille (lot D). Optionnel : la
 *  vignette reste utilisable sans, le déplacement clavier ↑/↓ ne dépendant
 *  jamais du glisser (décision A-4/§5.2). */
export type AlbumThumbnailDnd = {
  /** Vrai pendant que cette vignette est déplacée. */
  dragging: boolean;
  /** Vrai lorsque cette vignette est la cible du dépôt. */
  dropTarget: boolean;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
};

type AlbumThumbnailProps = {
  album: GalleryAlbum;
  /** Position dans la grille (0-based) — affichée 1-based. */
  index: number;
  total: number;
  /** true si cet album est en cours d'édition. */
  active?: boolean;
  /** Glisser-déposer (lot D) — absent pour une vignette non déplaçable. */
  dnd?: AlbumThumbnailDnd;
  onOpen: () => void;
  onToggleHidden: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function AlbumThumbnail({
  album,
  index,
  total,
  active = false,
  dnd,
  onOpen,
  onToggleHidden,
  onRemove,
  onMoveUp,
  onMoveDown,
}: AlbumThumbnailProps) {
  const cover = galleryAlbumCover(album);
  const photoCount = galleryAlbumPhotoCount(album);
  const name = album.label.trim();
  const hasPhoto = cover !== null && cover.url !== "";

  return (
    <div
      draggable={dnd !== undefined}
      onDragStart={dnd?.onDragStart}
      onDragOver={dnd?.onDragOver}
      onDrop={dnd?.onDrop}
      onDragEnd={dnd?.onDragEnd}
      title={
        dnd !== undefined
          ? "Glissez la vignette pour déplacer l’album dans la grille"
          : undefined
      }
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-card transition-colors",
        active ? "border-primary ring-2 ring-primary/30" : "border-border",
        album.hidden && "opacity-80",
        dnd !== undefined && "cursor-grab active:cursor-grabbing",
        dnd?.dragging && "opacity-40 ring-2 ring-ring",
        dnd?.dropTarget && "border-primary ring-2 ring-primary ring-offset-1"
      )}
    >
      {/* Zone d'ouverture : couverture + libellés (bouton plein cadre). */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ouvrir l’album ${name !== "" ? name : "à nommer"}`}
        className="block w-full text-left"
      >
        <div className="relative aspect-[4/3] w-full bg-muted/40">
          {hasPhoto && cover ? (
            <MediaImage
              src={cover.url}
              alt={cover.alt !== "" ? cover.alt : name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center px-2 text-center text-[11px] leading-tight text-muted-foreground">
              Aucune photo — invisible sur le site
            </span>
          )}

          {/* Numéro d'ordre : la grille n'a pas d'axe de lecture évident (D-6). */}
          <span className="absolute left-1.5 top-1.5 rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
            {index + 1}
          </span>

          {/* Masquage : visible en permanence, jamais uniquement au survol (D-7). */}
          {album.hidden ? (
            <Badge
              variant="destructive"
              className="absolute right-1.5 top-1.5 rounded-sm px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide"
            >
              Masqué
            </Badge>
          ) : null}
        </div>

        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium text-foreground">
            {name !== "" ? name : "à nommer"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {photoCount} photo{photoCount > 1 ? "s" : ""}
          </p>
        </div>
      </button>

      {/* Actions — révélées au survol ET au focus clavier. Le repère
          `data-album-actions` empêche un clic sur une action de démarrer un
          glisser (lot D) ; la zone d'ouverture, elle, reste saisissable. */}
      <div
        data-album-actions="true"
        className="absolute bottom-[3.25rem] right-1.5 flex items-center gap-0.5 rounded bg-background/85 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onToggleHidden}
          aria-pressed={album.hidden}
          aria-label={album.hidden ? "Afficher l’album" : "Masquer l’album"}
          title={album.hidden ? "Afficher sur le site" : "Masquer du site"}
        >
          {album.hidden ? (
            <EyeOff className="size-3.5" />
          ) : (
            <Eye className="size-3.5" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onMoveUp}
          disabled={index === 0}
          aria-label="Déplacer l’album vers la gauche"
          title="Déplacer vers la gauche"
        >
          <ArrowUp className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onMoveDown}
          disabled={index === total - 1}
          aria-label="Déplacer l’album vers la droite"
          title="Déplacer vers la droite"
        >
          <ArrowDown className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onOpen}
          aria-label="Modifier l’album"
          title="Modifier l’album"
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-destructive hover:text-destructive"
          onClick={onRemove}
          aria-label="Supprimer l’album"
          title="Supprimer l’album"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
