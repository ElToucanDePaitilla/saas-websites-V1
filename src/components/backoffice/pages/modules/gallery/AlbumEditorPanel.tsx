"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GalleryAlbum } from "@/lib/pages";

import { SelectField, TextAreaField, TextField } from "../form-fields";
import { GalleryImagesPanel } from "./GalleryImagesPanel";

/**
 * ============================================================================
 * ÉDITEUR D'ALBUM — Portfolio (Étape 11.20, lot C ; séparation 11.20.a)
 * ----------------------------------------------------------------------------
 * Formulaire d'**un album** : nom, description, photo de couverture et photos.
 * Réglages **propres à l'album** uniquement (décision A-2) : disposition,
 * effets, ombre, bordure, badge, diaporama et CTA appartiennent à la **galerie
 * entière** et ne figurent pas ici.
 *
 * **Aucun cadre propre, aucun titre propre.** Le cadre et le titre sont fournis
 * par la `EditorZone` parente, qui porte l'accent coloré : c'est ce qui matérialise
 * la **rupture de couleur** avec la zone « Les albums » située au-dessus (les
 * réglages de galerie). Avant la séparation, ce formulaire était rendu *dans* la
 * zone « Les albums » et héritait de sa barre d'accent, ce qui laissait croire
 * qu'il partageait sa portée — constat de recette.
 *
 * Le composant ne détient **aucun état** : chaque frappe remonte par `onPatch`
 * (modèle existant, aucune persistance supplémentaire).
 * ============================================================================
 */

type AlbumEditorPanelProps = {
  album: GalleryAlbum;
  /** Position de l'album dans la galerie (0-based) — affichée 1-based. */
  position: number;
  /** Nombre total d'albums de la galerie. */
  total: number;
  /** Patch **de cet album** (nom, description, couverture, photos). */
  onPatch: (patch: Partial<GalleryAlbum>) => void;
  /** Retour à la grille des albums. */
  onBack: () => void;
  demo?: boolean;
};

export function AlbumEditorPanel({
  album,
  position,
  total,
  onPatch,
  onBack,
  demo,
}: AlbumEditorPanelProps) {
  const topRef = React.useRef<HTMLDivElement>(null);
  const photos = album.images.filter((image) => image.url !== "");

  // Focus en tête de la vue d'album à l'ouverture (accessibilité clavier).
  React.useEffect(() => {
    topRef.current?.focus();
  }, []);

  return (
    <div className="grid gap-3">
      <div
        ref={topRef}
        tabIndex={-1}
        className="flex flex-wrap items-center justify-between gap-2 outline-none"
      >
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft />
          Retour vers la galerie des Albums
        </Button>
        {/* Micro-libellé (ML) : position de l'album, annotation et non titre. */}
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Album {position + 1} / {total}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Nom de l’album"
          value={album.label}
          placeholder="Ex. Mariage"
          onChange={(label) => onPatch({ label })}
        />
        <SelectField
          label="Photo de couverture"
          value={album.coverImageId ?? ""}
          options={[
            { value: "", label: "Première photo" },
            ...photos.map((image, imageIndex) => ({
              value: image.id,
              label:
                image.title && image.title.trim() !== ""
                  ? `Photo ${imageIndex + 1} — ${image.title}`
                  : `Photo ${imageIndex + 1}`,
            })),
          ]}
          onChange={(coverImageId) =>
            onPatch({ coverImageId: coverImageId === "" ? null : coverImageId })
          }
          disabled={photos.length === 0}
          hint="Image affichée en couverture sur la page publique."
        />
      </div>

      <TextAreaField
        label="Description de l’album"
        value={album.description}
        placeholder="Ex. Cérémonies, préparatifs et portraits de mariés…"
        onChange={(description) => onPatch({ description })}
      />

      <GalleryImagesPanel
        title={`Photos de l’album (${album.images.length})`}
        images={album.images}
        onChange={(images) => onPatch({ images })}
        emptyHint="Aucune photo dans cet album. Importez un dossier complet ou plusieurs photos."
        folderLabel="Importer un dossier (album)"
        demo={demo}
      />
    </div>
  );
}
