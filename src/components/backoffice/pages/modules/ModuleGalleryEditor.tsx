"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { GalleryImage, ModuleContent } from "@/lib/pages";

import { MediaFields, TextField } from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Galerie » (Étape 3.4)
 * ----------------------------------------------------------------------------
 * Formule le contenu de la galerie photo masonry : titre de section et liste de
 * visuels (URL + alt SEO) avec ajout / suppression. Contrôlé par le store :
 * chaque changement reconstruit le tableau `images` (immuable) puis commit en bloc.
 *
 * Note : le réordonnancement des images n'est pas au périmètre de l'Étape 3.4
 * (ordre d'ajout conservé) — plan §1.3.3.
 *
 * Référence : plans/ROADMAP-3.4-crud-expanded.md §1.3.3
 * ============================================================================
 */

type ModuleGalleryEditorProps = {
  content: Extract<ModuleContent, { type: "gallery" }>;
  onChangeContent: (content: Extract<ModuleContent, { type: "gallery" }>) => void;
};

export function ModuleGalleryEditor({
  content,
  onChangeContent,
}: ModuleGalleryEditorProps) {
  function updateImage(imageId: string, patch: Partial<GalleryImage>) {
    onChangeContent({
      ...content,
      images: content.images.map((image) =>
        image.id === imageId ? { ...image, ...patch } : image
      ),
    });
  }

  function removeImage(imageId: string) {
    onChangeContent({
      ...content,
      images: content.images.filter((image) => image.id !== imageId),
    });
  }

  function addImage() {
    onChangeContent({
      ...content,
      images: [
        ...content.images,
        { id: crypto.randomUUID(), url: "", alt: "Nouvelle photo" },
      ],
    });
  }

  return (
    <div className="grid gap-4">
      <TextField
        label="Titre de la section"
        value={content.heading}
        onChange={(heading) => onChangeContent({ ...content, heading })}
      />

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Visuels ({content.images.length})
          </p>
          <Button type="button" variant="outline" size="sm" onClick={addImage}>
            <Plus />
            Ajouter
          </Button>
        </div>

        {content.images.map((image, imageIndex) => (
          <div
            key={image.id}
            className="grid gap-3 rounded-md border border-border bg-background/50 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Photo {imageIndex + 1}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Supprimer la photo ${imageIndex + 1}`}
                title="Supprimer ce visuel"
                onClick={() => removeImage(image.id)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </div>
            <MediaFields
              value={{ url: image.url, alt: image.alt }}
              labelUrl="URL de l’image"
              labelAlt="Texte alternatif (SEO)"
              onChange={(media) => updateImage(image.id, media)}
            />
          </div>
        ))}

        {content.images.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-background/50 px-3 py-4 text-center text-xs text-muted-foreground">
            Aucun visuel. Cliquez sur « Ajouter » pour insérer la première image.
          </p>
        ) : null}
      </div>
    </div>
  );
}
