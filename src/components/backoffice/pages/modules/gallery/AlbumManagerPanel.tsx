"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  createGalleryAlbum,
  galleryBadgePositionLabels,
  galleryBadgePositionOrder,
  galleryBadgeStyleLabels,
  galleryBadgeStyleOrder,
  type GalleryAlbum,
  type GalleryBadgePosition,
  type GalleryBadgeSettings,
  type GalleryBadgeStyle,
} from "@/lib/pages";

import { SelectField, TextAreaField, TextField } from "../form-fields";
import { SwitchField } from "./fields";
import { GalleryImagesPanel } from "./GalleryImagesPanel";

/**
 * ============================================================================
 * GESTIONNAIRE D'ALBUMS — variante PORTFOLIO (Phase 11)
 * ----------------------------------------------------------------------------
 * Thématiques (Mariage, Portrait, Corporate, Paysage…) : création, renommage,
 * description, choix de la couverture, réordonnancement, suppression et
 * édition des photos de chaque album (via `GalleryImagesPanel`).
 * Inclut le paramétrage du **badge de thématique** (visibilité, style, position).
 * ============================================================================
 */

type AlbumManagerPanelProps = {
  albums: GalleryAlbum[];
  onChange: (albums: GalleryAlbum[]) => void;
  badge: GalleryBadgeSettings;
  onChangeBadge: (patch: Partial<GalleryBadgeSettings>) => void;
  demo?: boolean;
};

export function AlbumManagerPanel({
  albums,
  onChange,
  badge,
  onChangeBadge,
  demo,
}: AlbumManagerPanelProps) {
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

  function addAlbum() {
    onChange([...albums, createGalleryAlbum("Nouvelle thématique")]);
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Thématiques ({albums.length})
        </p>
        <Button type="button" variant="outline" size="sm" onClick={addAlbum}>
          <Plus />
          Ajouter une thématique
        </Button>
      </div>

      {/* Paramétrage du badge de thématique (surimpression). */}
      <div className="grid gap-3 rounded-md border border-border bg-background/50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Badge de thématique
        </p>
        <div className="grid gap-2">
          <SwitchField
            label="Afficher le nom du thème"
            checked={badge.showLabel}
            onChange={(showLabel) => onChangeBadge({ showLabel })}
          />
          <SwitchField
            label="Afficher le nombre de photos"
            checked={badge.showCount}
            onChange={(showCount) => onChangeBadge({ showCount })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField<GalleryBadgePosition>
            label="Position"
            value={badge.position}
            options={galleryBadgePositionOrder.map((value) => ({
              value,
              label: galleryBadgePositionLabels[value],
            }))}
            onChange={(position) => onChangeBadge({ position })}
          />
          <SelectField<GalleryBadgeStyle>
            label="Style"
            value={badge.style}
            options={galleryBadgeStyleOrder.map((value) => ({
              value,
              label: galleryBadgeStyleLabels[value],
            }))}
            onChange={(style) => onChangeBadge({ style })}
          />
        </div>
      </div>

      {albums.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-background/50 px-3 py-4 text-center text-xs text-muted-foreground">
          Aucune thématique. Cliquez sur « Ajouter une thématique » puis importez
          les photos de l’album (un dossier complet crée idéalement un album).
        </p>
      ) : (
        <ul className="grid gap-4">
          {albums.map((album, albumIndex) => {
            const visibleImages = album.images.filter(
              (image) => image.url !== ""
            );
            return (
              <li
                key={album.id}
                className="grid gap-3 rounded-md border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Thématique {albumIndex + 1}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      disabled={albumIndex === 0}
                      onClick={() => moveAlbum(albumIndex, albumIndex - 1)}
                      aria-label="Monter la thématique"
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      disabled={albumIndex === albums.length - 1}
                      onClick={() => moveAlbum(albumIndex, albumIndex + 1)}
                      aria-label="Descendre la thématique"
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => removeAlbum(album.id)}
                      aria-label="Supprimer la thématique"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="Nom du thème"
                    value={album.label}
                    placeholder="Ex. Mariage"
                    onChange={(label) => updateAlbum(album.id, { label })}
                  />
                  <SelectField
                    label="Photo de couverture"
                    value={album.coverImageId ?? ""}
                    options={[
                      { value: "", label: "Première photo" },
                      ...visibleImages.map((image, imageIndex) => ({
                        value: image.id,
                        label:
                          image.title && image.title.trim() !== ""
                            ? `Photo ${imageIndex + 1} — ${image.title}`
                            : `Photo ${imageIndex + 1}`,
                      })),
                    ]}
                    onChange={(coverImageId) =>
                      updateAlbum(album.id, {
                        coverImageId:
                          coverImageId === "" ? null : coverImageId,
                      })
                    }
                    disabled={visibleImages.length === 0}
                    hint="Image affichée en couverture sur la page publique."
                  />
                </div>

                <TextAreaField
                  label="Description du thème"
                  value={album.description}
                  placeholder="Ex. Cérémonies, préparatifs et portraits de mariés…"
                  onChange={(description) =>
                    updateAlbum(album.id, { description })
                  }
                />

                <GalleryImagesPanel
                  title={`Photos de la thématique (${album.images.length})`}
                  images={album.images}
                  onChange={(images) => updateAlbum(album.id, { images })}
                  emptyHint="Aucune photo dans cet album. Importez un dossier complet ou plusieurs photos."
                  folderLabel="Importer un dossier (album)"
                  demo={demo}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
