"use client";

import * as React from "react";
import { Eye, EyeOff, FileText, ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";

import { MediaImage } from "@/components/common/MediaImage";
import { MediaUploadButton } from "@/components/backoffice/media/MediaUploadButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isMediaDemoMode } from "@/lib/media-client";
import type { GalleryImage } from "@/lib/pages";
import { cn } from "@/lib/utils";

import { TextAreaField, TextField } from "../form-fields";
import { ImportMediaPanel, type UploadedImage } from "./ImportMediaPanel";

/**
 * ============================================================================
 * ÉDITEUR D'IMAGES DE GALERIE — réutilisable (Phase 11)
 * ----------------------------------------------------------------------------
 * Liste éditable de photos, partagée par les variantes static/dynamic et par
 * chaque album de la variante portfolio :
 *   - import multiple + dossier complet (via `ImportMediaPanel`) ;
 *   - glisser-déposer pour réordonner ;
 *   - actions par photo : œil (masquer/afficher), crayon (éditer), poubelle ;
 *   - dialog d'édition : titre, description, alt SEO, remplacement du fichier.
 * Contrôlé : chaque changement produit un nouveau tableau (`onChange`).
 * ============================================================================
 */

type GalleryImagesPanelProps = {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  /** Sur-titre du bloc (défaut « Photos »). */
  title?: string;
  /** Message affiché lorsque la liste est vide. */
  emptyHint?: string;
  /** Libellé du bouton d'import dossier. */
  folderLabel?: string;
  demo?: boolean;
};

/** Nom de base d'un fichier (sans extension) pour pré-remplir l'alt. */
function baseNameWithoutExtension(name: string): string {
  const lastDot = name.lastIndexOf(".");
  return (lastDot > 0 ? name.slice(0, lastDot) : name).trim();
}

export function GalleryImagesPanel({
  images,
  onChange,
  title = "Photos",
  emptyHint = "Aucune photo. Importez une ou plusieurs photos, un dossier complet, ou cliquez sur « Ajouter ».",
  folderLabel,
  demo,
}: GalleryImagesPanelProps) {
  const demoMode = demo ?? isMediaDemoMode();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);

  const editingImage =
    images.find((image) => image.id === editingId) ?? null;

  function updateImage(imageId: string, patch: Partial<GalleryImage>) {
    onChange(
      images.map((image) =>
        image.id === imageId ? { ...image, ...patch } : image
      )
    );
  }

  function moveImage(from: number, to: number) {
    if (from === to || from < 0 || to < 0) {
      return;
    }
    const next = Array.from(images);
    const [moved] = next.splice(from, 1);
    if (moved === undefined) {
      return;
    }
    next.splice(to, 0, moved);
    onChange(next);
  }

  function handleDropOn(dropIndex: number) {
    if (dragIndex === null) {
      return;
    }
    moveImage(dragIndex, dropIndex);
    setDragIndex(null);
  }

  function removeImage(imageId: string) {
    onChange(images.filter((image) => image.id !== imageId));
  }

  function addImage() {
    const newImage: GalleryImage = {
      id: crypto.randomUUID(),
      url: "",
      alt: "Nouvelle photo",
    };
    onChange([...images, newImage]);
    setEditingId(newImage.id);
  }

  function appendUploaded(uploaded: UploadedImage[]) {
    if (uploaded.length === 0) {
      return;
    }
    const newImages: GalleryImage[] = uploaded.map((item) => ({
      id: crypto.randomUUID(),
      url: item.url,
      alt: item.alt,
      filename: item.filename,
      width: item.width ?? undefined,
      height: item.height ?? undefined,
    }));
    onChange([...images, ...newImages]);
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title} ({images.length})
        </p>
        <Button type="button" variant="outline" size="sm" onClick={addImage}>
          <Plus />
          Ajouter
        </Button>
      </div>

      <ImportMediaPanel
        onImported={appendUploaded}
        demo={demoMode}
        folderLabel={folderLabel}
      />

      {images.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-background/50 px-3 py-4 text-center text-xs text-muted-foreground">
          {emptyHint}
        </p>
      ) : (
        <>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {images.map((image, imageIndex) => {
              const hidden = image.hidden === true;
              const isDragging = dragIndex === imageIndex;
              return (
                <li
                  key={image.id}
                  draggable
                  onDragStart={(event) => {
                    if ((event.target as HTMLElement).closest("button")) {
                      event.preventDefault();
                      return;
                    }
                    setDragIndex(imageIndex);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", image.id);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleDropOn(imageIndex);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  title="Glissez pour réordonner les photos"
                  className={cn(
                    "group relative aspect-[4/3] cursor-grab overflow-hidden rounded-md border border-border bg-muted active:cursor-grabbing",
                    hidden && "opacity-70",
                    isDragging &&
                      "border-ring opacity-40 ring-2 ring-ring ring-offset-1"
                  )}
                >
                  {image.url ? (
                    <MediaImage
                      src={image.url}
                      alt={image.alt || `Photo ${imageIndex + 1}`}
                      fill
                      sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImagePlus
                        className="size-6 text-muted-foreground/60"
                        aria-hidden="true"
                      />
                    </div>
                  )}

                  {hidden ? (
                    <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
                      <EyeOff className="size-3" />
                      Masquée
                    </span>
                  ) : null}

                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 p-1.5">
                    <button
                      type="button"
                      aria-pressed={hidden}
                      aria-label={
                        hidden
                          ? `Afficher la photo ${imageIndex + 1} sur le site`
                          : `Masquer la photo ${imageIndex + 1} sur le site`
                      }
                      title={hidden ? "Afficher sur le site public" : "Masquer du site public"}
                      onClick={() => updateImage(image.id, { hidden: !hidden })}
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-white shadow-sm transition-colors",
                        hidden
                          ? "bg-orange-500 hover:bg-orange-400"
                          : "bg-zinc-800 hover:bg-orange-500"
                      )}
                    >
                      {hidden ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      aria-label={`Modifier la photo ${imageIndex + 1}`}
                      title="Modifier (image et texte alternatif)"
                      onClick={() => setEditingId(image.id)}
                      className="flex size-6 items-center justify-center rounded-full bg-zinc-800 text-white shadow-sm transition-colors hover:bg-sky-500"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Supprimer la photo ${imageIndex + 1}`}
                      title="Supprimer cette photo"
                      onClick={() => removeImage(image.id)}
                      className="flex size-6 items-center justify-center rounded-full bg-zinc-800 text-white shadow-sm transition-colors hover:bg-red-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted-foreground">
            Glissez-déposez une photo pour changer son ordre. L’œil la masque
            (orange lorsqu’elle est cachée), le crayon la modifie et la poubelle
            la supprime.
          </p>
        </>
      )}

      {/* Dialog d'édition d'une photo (titre, description, alt SEO, remplacement). */}
      <Dialog
        open={editingImage !== null}
        onOpenChange={(open) => !open && setEditingId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Éditer la photo</DialogTitle>
            <DialogDescription>
              Renseignez le titre, la description et le texte alternatif (SEO).
            </DialogDescription>
          </DialogHeader>

          {editingImage ? (
            <div className="grid gap-3">
              {editingImage.url ? (
                <div className="relative aspect-[16/9] overflow-hidden rounded-md border border-border bg-muted">
                  <MediaImage
                    src={editingImage.url}
                    alt={editingImage.alt || "Aperçu de la photo"}
                    fill
                    sizes="(min-width: 640px) 448px, 100vw"
                    className="object-contain"
                  />
                </div>
              ) : null}

              {editingImage.filename ? (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate font-mono">
                    {editingImage.filename}
                  </span>
                </p>
              ) : null}

              <TextField
                label="Titre"
                value={editingImage.title ?? ""}
                placeholder="Ex. Mariage de Léa & Thomas"
                hint="Court titre affiché sur la vignette (Polaroid) ou dans le diaporama."
                onChange={(title) => updateImage(editingImage.id, { title })}
              />

              <TextAreaField
                label="Description"
                value={editingImage.description ?? ""}
                placeholder="Ex. Première danse des mariés au coucher du soleil…"
                hint="Texte libre affiché dans le diaporama."
                onChange={(description) =>
                  updateImage(editingImage.id, { description })
                }
              />

              <TextField
                label="Texte alternatif (SEO)"
                value={editingImage.alt}
                placeholder="Description de l’image"
                hint="Décrivez l’image pour le référencement et l’accessibilité."
                onChange={(alt) => updateImage(editingImage.id, { alt })}
              />

              {!demoMode ? (
                <MediaUploadButton
                  label="Remplacer par une photo de l’ordinateur"
                  onUploaded={(url, filename) =>
                    updateImage(editingImage.id, {
                      url,
                      filename,
                      alt:
                        editingImage.alt || baseNameWithoutExtension(filename),
                    })
                  }
                />
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" onClick={() => setEditingId(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
