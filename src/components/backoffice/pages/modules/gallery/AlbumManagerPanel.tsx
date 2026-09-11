"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  createGalleryAlbum,
  galleryBadgeDisplayLabels,
  galleryBadgeDisplayOrder,
  galleryBadgePositionLabels,
  galleryBadgePositionOrder,
  galleryBadgeStyleLabels,
  galleryBadgeStyleOrder,
  type GalleryAlbum,
  type GalleryBadgeDisplay,
  type GalleryBadgePosition,
  type GalleryBadgeSettings,
  type GalleryBadgeStyle,
} from "@/lib/pages";

import { HelpTip, SelectField, TextAreaField, TextField } from "../form-fields";
import { SwitchField } from "./fields";
import { GalleryImagesPanel } from "./GalleryImagesPanel";

/**
 * ============================================================================
 * GESTIONNAIRE D'ALBUMS — variante PORTFOLIO (Phase 11)
 * ----------------------------------------------------------------------------
 * Albums (Mariage, Portrait, Corporate, Paysage…) : création, renommage,
 * description, choix de la couverture, réordonnancement, suppression et
 * édition des photos de chaque album (via `GalleryImagesPanel`).
 * Inclut le paramétrage du **badge de l'album** (visibilité, style, position).
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
    onChange([...albums, createGalleryAlbum("Nouvel album")]);
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {albums.length} album{albums.length > 1 ? "s" : ""}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={addAlbum}>
          <Plus />
          Ajouter un album
        </Button>
      </div>

      {/* Phrase de cadrage : explique ce qu'est un album à un non-technicien. */}
      <p className="text-xs text-muted-foreground">
        Un album regroupe des photos autour d’un thème : mariage, portrait,
        corporate… Un dossier importé devient un album.
      </p>

      {/* Affichage sur les couvertures — réglage GLOBAL aux albums de la galerie.
          Bordure en pointillés = bloc IMBRIQUÉ dans une zone d'édition (11.17),
          par opposition au cadre plein d'une `EditorZone`. */}
      <div className="grid gap-3 rounded-md border border-dashed border-border bg-background/40 p-3">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Affichage sur les couvertures
          </p>
          <HelpTip tip="Nom et nombre de photos affichés par-dessus la photo de couverture. Ces réglages s’appliquent à toutes les couvertures d’albums, pas à un album en particulier." />
        </div>

        {/* 1. QUAND afficher (aucun / permanent / au survol). */}
        <SelectField<GalleryBadgeDisplay>
          label="Quand afficher ces informations ?"
          value={badge.display}
          options={galleryBadgeDisplayOrder.map((value) => ({
            value,
            label: galleryBadgeDisplayLabels[value],
          }))}
          onChange={(display) => onChangeBadge({ display })}
        />

        {badge.display === "hover" ? (
          <p className="text-xs text-muted-foreground">
            Au survol de la souris — et toujours visible sur téléphone et
            tablette, où le doigt ne peut pas survoler la photo.
          </p>
        ) : null}

        {badge.display === "none" ? (
          <p className="rounded-md border border-dashed border-border bg-background/50 px-3 py-2 text-xs text-muted-foreground">
            Aucune information ne sera affichée sur les couvertures : les
            réglages de contenu, de position et de style sont sans objet.
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
                onChange={(showLabel) => onChangeBadge({ showLabel })}
              />
              <SwitchField
                label="Le nombre de photos"
                checked={badge.showCount}
                onChange={(showCount) => onChangeBadge({ showCount })}
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
          </>
        )}
      </div>

      {albums.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-background/50 px-3 py-4 text-center text-xs text-muted-foreground">
          Aucun album. Cliquez sur « Ajouter un album », puis importez ses photos
          (un dossier complet crée idéalement un album).
        </p>
      ) : (
        <ul className="grid gap-4">
          {albums.map((album, albumIndex) => {
            const visibleImages = album.images.filter(
              (image) => image.url !== ""
            );
            // Repère lisible : numéro d'ordre + nom réel de l'album (Étape 11.17).
            const albumName = album.label.trim();
            const albumHeading = `Album ${albumIndex + 1} — ${
              albumName !== "" ? albumName : "à nommer"
            }`;
            return (
              <li
                key={album.id}
                className="grid gap-3 rounded-md border border-border bg-card p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {albumHeading}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      disabled={albumIndex === 0}
                      onClick={() => moveAlbum(albumIndex, albumIndex - 1)}
                      aria-label="Monter l’album"
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
                      aria-label="Descendre l’album"
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => removeAlbum(album.id)}
                      aria-label="Supprimer l’album"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="Nom de l’album"
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
                  label="Description de l’album"
                  value={album.description}
                  placeholder="Ex. Cérémonies, préparatifs et portraits de mariés…"
                  onChange={(description) =>
                    updateAlbum(album.id, { description })
                  }
                />

                <GalleryImagesPanel
                  title={`Photos de l’album (${album.images.length})`}
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
