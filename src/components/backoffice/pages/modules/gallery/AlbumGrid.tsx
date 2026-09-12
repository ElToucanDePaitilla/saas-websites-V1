"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { createGalleryAlbum, type GalleryAlbum } from "@/lib/pages";
import { cn } from "@/lib/utils";

import { AlbumThumbnail } from "./AlbumThumbnail";

/**
 * ============================================================================
 * GRILLE D'ALBUMS — Portfolio (Étape 11.20, lots B & D)
 * ----------------------------------------------------------------------------
 * Remplace la liste d'albums **dépliés en permanence** (hauteur proportionnelle
 * au nombre d'albums × photos) par une **grille de vignettes**, une par album.
 *
 * **Ce composant ne fait plus que la grille.** Il portait aussi la vue d'album
 * (lot C) ; celle-ci a été extraite dans [`AlbumEditorPanel`](AlbumEditorPanel.tsx)
 * et son état remonté à l'éditeur de galerie (11.20.a). Motif : tant que l'album
 * était rendu *à l'intérieur* de la `EditorZone` « Les albums », il héritait de
 * sa barre d'accent et semblait partager sa portée — la barre verticale ne
 * changeait donc pas de couleur au-dessus du bouton de retour. La vue d'album
 * est désormais une zone **sœur**, avec sa propre couleur d'accent.
 *
 * Décisions appliquées : D-1 (la vignette est le mode de liste), D-5 (un moyen
 * de réordonner **sans glisser** existe : ↑/↓), D-6 (numéro d'ordre affiché).
 *
 * **Lot D** : glisser-déposer **HTML5 natif** — mécanisme déjà éprouvé dans ce
 * projet sur une grille qui s'enroule (`GalleryImagesPanel`). Aucun
 * réordonnancement en direct : l'ordre n'est modifié **qu'au dépôt**, donc la
 * grille ne saute pas pendant le geste et `Échap` laisse un ordre intact **par
 * construction**. Les ↑/↓ restent le chemin **clavier** : le glisser est une
 * commodité, jamais le seul moyen.
 * ============================================================================
 */

type AlbumGridProps = {
  albums: GalleryAlbum[];
  onChange: (albums: GalleryAlbum[]) => void;
  /** Ouvre la vue d'édition d'un album (état porté par l'éditeur de galerie). */
  onOpenAlbum: (albumId: string) => void;
};

export function AlbumGrid({ albums, onChange, onOpenAlbum }: AlbumGridProps) {
  /* ------------------------------------------------------------------
     Glisser-déposer (lot D) — état local à la grille.
     ------------------------------------------------------------------ */
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [overIndex, setOverIndex] = React.useState<number | null>(null);
  const [dragMessage, setDragMessage] = React.useState("");

  // Échap interrompt un glisser en cours (critère §5.3). L'ordre n'ayant pas
  // été touché pendant le geste, l'ordre d'origine est restitué tel quel.
  React.useEffect(() => {
    if (dragIndex === null) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDragIndex(null);
        setOverIndex(null);
        setDragMessage("Déplacement annulé : l’ordre des albums est inchangé.");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dragIndex]);

  function updateAlbum(albumId: string, patch: Partial<GalleryAlbum>) {
    onChange(
      albums.map((album) =>
        album.id === albumId ? { ...album, ...patch } : album
      )
    );
  }

  function removeAlbum(albumId: string) {
    onChange(albums.filter((album) => album.id !== albumId));
  }

  function moveAlbum(from: number, to: number) {
    if (to < 0 || to >= albums.length) {
      return;
    }
    const next = Array.from(albums);
    const [moved] = next.splice(from, 1);
    if (moved === undefined) {
      return;
    }
    next.splice(to, 0, moved);
    onChange(next);
  }

  /* ------------------------------------------------------------------
     Glisser-déposer (lot D) — le dépôt déclenche le déplacement.
     ------------------------------------------------------------------ */

  function handleDragStart(index: number, event: React.DragEvent<HTMLDivElement>) {
    // Un geste partant d'une **action** (masquer, éditer, ↑/↓, supprimer) ne
    // doit pas démarrer un déplacement : seule la zone d'ouverture est
    // saisissable, comme dans la grille de photos.
    if ((event.target as HTMLElement).closest("[data-album-actions]") !== null) {
      event.preventDefault();
      return;
    }
    const album = albums[index];
    if (album === undefined) {
      return;
    }
    setDragIndex(index);
    setOverIndex(index);
    setDragMessage("");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", album.id);
  }

  function handleDragOver(index: number, event: React.DragEvent<HTMLDivElement>) {
    if (dragIndex === null) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (overIndex !== index) {
      setOverIndex(index);
    }
  }

  function handleDrop(index: number, event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      const moved = albums[dragIndex];
      moveAlbum(dragIndex, index);
      setDragMessage(
        `${moved?.label ?? "Album"} déplacé à la position ${index + 1} sur ${albums.length}.`
      );
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  /** Crée un album et **ouvre aussitôt sa vue** (enchaîner nommage + import). */
  function addAlbum() {
    const created = createGalleryAlbum("Nouvel album");
    onChange([...albums, created]);
    onOpenAlbum(created.id);
  }

  return (
    <div className="grid gap-2.5">
      <div
        className={cn(
          "grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4"
        )}
      >
        {/* Tuile « Nouvel album » — première cellule de la grille (§3.2). */}
        <button
          type="button"
          onClick={addAlbum}
          className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-background/50 p-2 text-center transition-colors hover:border-primary hover:bg-accent/40"
        >
          <Plus className="size-5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">
            Nouvel album
          </span>
        </button>

        {albums.map((album, index) => (
          <AlbumThumbnail
            key={album.id}
            album={album}
            index={index}
            total={albums.length}
            active={false}
            dnd={{
              dragging: dragIndex === index,
              dropTarget:
                overIndex === index &&
                dragIndex !== null &&
                dragIndex !== index,
              onDragStart: (event) => handleDragStart(index, event),
              onDragOver: (event) => handleDragOver(index, event),
              onDrop: (event) => handleDrop(index, event),
              onDragEnd: handleDragEnd,
            }}
            onOpen={() => onOpenAlbum(album.id)}
            onToggleHidden={() =>
              updateAlbum(album.id, { hidden: !album.hidden })
            }
            onRemove={() => removeAlbum(album.id)}
            onMoveUp={() => moveAlbum(index, index - 1)}
            onMoveDown={() => moveAlbum(index, index + 1)}
          />
        ))}
      </div>

      {/* Annonce du déplacement aux lecteurs d'écran (le glisser n'est pas
          accessible au clavier ; ↑/↓ restent le moyen nominal). */}
      <p role="status" aria-live="polite" className="sr-only">
        {dragMessage}
      </p>

      {albums.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-background/50 px-3 py-3 text-center text-xs text-muted-foreground">
          Chaque dossier importé devient un album. Cliquez sur « Nouvel album »
          pour commencer.
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Cliquez une vignette pour ouvrir l’album · glissez une vignette pour
          déplacer l’album (Échap annule) · actions au survol (ou au clavier) ·
          ↑ ↓ pour réordonner sans glisser.
        </p>
      )}
    </div>
  );
}
