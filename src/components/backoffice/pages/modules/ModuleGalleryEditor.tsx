"use client";

import * as React from "react";
import {
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
  ImagePlus,
  Images,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MediaImage } from "@/components/common/MediaImage";
import { MediaUploadButton } from "@/components/backoffice/media/MediaUploadButton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  isMediaDemoMode,
  uploadMedia,
} from "@/lib/media-client";
import {
  resolveGalleryLayout,
  type GalleryImage,
  type GalleryLayoutOptions,
  type GalleryVariant,
  type ModuleContent,
} from "@/lib/pages";
import { cn } from "@/lib/utils";

import { TextAreaField, TextField } from "./form-fields";

/**
 * ============================================================================
 * ÉDITEUR DE CONTENU — Module « Galerie » (Étape 3.4)
 * ----------------------------------------------------------------------------
 * Formulaire du contenu de la galerie photo masonry : titre de section puis
 * **mini-galerie** de vignettes (une par photo), chacune avec ses actions CRUD :
 *   - œil      : masquer / afficher la photo sur le site public ;
 *   - crayon   : éditer la photo (URL / upload local) et son texte alternatif ;
 *   - poubelle : supprimer la photo.
 * Contrôlé par le store : chaque changement reconstruit le tableau `images`
 * (immuable) puis commit en bloc.
 *
 * Ajout de photos :
 *   - import groupé (plusieurs photos ou **dossier entier** non compressé) ;
 *   - bouton « Ajouter » (emplacement vide, à compléter via le crayon).
 * Type MIME image uniquement, 15 Mo max/fichier (règles serveur miroir).
 * Upload désactivé en mode démo (Supabase Storage non configuré).
 *
 * Référence : plans/ROADMAP-3.4-crud-expanded.md §1.3.3
 * ============================================================================
 */

type ModuleGalleryEditorProps = {
  content: Extract<ModuleContent, { type: "gallery" }>;
  onChangeContent: (content: Extract<ModuleContent, { type: "gallery" }>) => void;
};

/** Types MIME image acceptés (miroir client de /api/media). */
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

/** Taille maximale par fichier (miroir serveur : 15 Mo). */
const MAX_FILE_BYTES = 15 * 1024 * 1024;

/** Nombre de photos conseillé par import (reste fluide, évite les timeouts). */
const RECOMMENDED_BATCH = 50;

/** Nom de base d'un fichier (sans extension) pour pré-remplir l'alt. */
function baseNameWithoutExtension(name: string): string {
  const lastDot = name.lastIndexOf(".");
  return (lastDot > 0 ? name.slice(0, lastDot) : name).trim();
}

export function ModuleGalleryEditor({
  content,
  onChangeContent,
}: ModuleGalleryEditorProps) {
  const demo = isMediaDemoMode();

  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState<{
    done: number;
    total: number;
  } | null>(null);
  const [importError, setImportError] = React.useState<string | null>(null);

  const multiInputRef = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null);

  /** Id de la photo dont le dialog d'édition est ouvert (null = fermé). */
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const editingImage =
    content.images.find((image) => image.id === editingId) ?? null;

  /** Index de la vignette actuellement déplacée (glisser-déposer, null sinon). */
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);

  function updateImage(imageId: string, patch: Partial<GalleryImage>) {
    onChangeContent({
      ...content,
      images: content.images.map((image) =>
        image.id === imageId ? { ...image, ...patch } : image
      ),
    });
  }

  /** Déplace une photo de `from` vers `to` dans le tableau `images`. */
  function moveImage(from: number, to: number) {
    if (from === to || from < 0 || to < 0) {
      return;
    }
    const next = Array.from(content.images);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChangeContent({ ...content, images: next });
  }

  /** Dépose la vignette glissée sur la vignette cible (`dropIndex`). */
  function handleDropOn(dropIndex: number) {
    if (dragIndex === null) {
      return;
    }
    moveImage(dragIndex, dropIndex);
    setDragIndex(null);
  }

  function removeImage(imageId: string) {
    onChangeContent({
      ...content,
      images: content.images.filter((image) => image.id !== imageId),
    });
  }

  function addImage() {
    const newImage: GalleryImage = {
      id: crypto.randomUUID(),
      url: "",
      alt: "Nouvelle photo",
    };
    onChangeContent({
      ...content,
      images: [...content.images, newImage],
    });
    setEditingId(newImage.id);
  }

  /** Ajoute des visuels déjà uploadés (URL + nom de fichier) à la galerie. */
  function appendUploaded(
    uploaded: {
      url: string;
      alt: string;
      filename: string;
      width: number | null;
      height: number | null;
    }[]
  ) {
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
    onChangeContent({ ...content, images: [...content.images, ...newImages] });
  }

  function resetInputs() {
    if (multiInputRef.current) {
      multiInputRef.current.value = "";
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
  }

  /** Import groupé : filtre les images valides puis uploade séquentiellement. */
  async function handleImport(files: FileList | null) {
    const fileList = Array.from(files ?? []);
    if (fileList.length === 0) {
      return;
    }

    const valid = fileList.filter(
      (file) =>
        file.size > 0 &&
        file.size <= MAX_FILE_BYTES &&
        ALLOWED_IMAGE_TYPES.has(file.type)
    );
    const ignored = fileList.length - valid.length;

    if (valid.length === 0) {
      setImportError(
        "Aucune image valide détectée (JPG, PNG, WebP, AVIF, GIF — 15 Mo max par fichier)."
      );
      resetInputs();
      return;
    }

    setBusy(true);
    setImportError(null);
    setProgress({ done: 0, total: valid.length });

    const uploaded: {
      url: string;
      alt: string;
      filename: string;
      width: number | null;
      height: number | null;
    }[] = [];
    let failures = 0;

    for (let index = 0; index < valid.length; index += 1) {
      const file = valid[index];
      try {
        const asset = await uploadMedia(file);
        uploaded.push({
          url: asset.url,
          alt: baseNameWithoutExtension(file.name),
          filename: file.name,
          width: asset.width,
          height: asset.height,
        });
      } catch {
        failures += 1;
      }
      setProgress({ done: index + 1, total: valid.length });
    }

    appendUploaded(uploaded);

    const summary: string[] = [];
    if (ignored > 0) {
      summary.push(
        `${ignored} fichier(s) ignoré(s) (non-image ou > 15 Mo).`
      );
    }
    if (failures > 0) {
      summary.push(`${failures} upload(s) en échec.`);
    }
    if (summary.length > 0) {
      setImportError(summary.join(" "));
    }

    setBusy(false);
    setProgress(null);
    resetInputs();
  }

  /** Sélecteur de dossier entier (attribut non standard webkitdirectory). */
  function openFolderPicker() {
    const input = folderInputRef.current;
    if (!input) {
      return;
    }
    input.setAttribute("webkitdirectory", "");
    input.click();
  }

  const importHint = demo
    ? "Upload désactivé en mode démo (Supabase Storage non configuré)."
    : "Plusieurs photos ou un dossier entier. JPG, PNG, WebP, AVIF, GIF — " +
      "15 Mo max/fichier. " +
      `Conseil : ${RECOMMENDED_BATCH} photos max par import pour rester fluide.`;

  const layout = resolveGalleryLayout(content.layout);

  /** Met à jour une valeur de mise en page (persistée sur `content.layout`). */
  function updateLayout(patch: Partial<GalleryLayoutOptions>) {
    onChangeContent({ ...content, layout: { ...layout, ...patch } });
  }

  return (
    <div className="grid gap-4">
      <TextField
        label="Titre de la section"
        value={content.heading}
        onChange={(heading) => onChangeContent({ ...content, heading })}
      />

      {/* ---- Mise en page de la galerie (public) ---- */}
      <div className="grid gap-2 rounded-md border border-border bg-background/50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Mise en page
        </p>

        {/* Type d'affichage */}
        <div className="grid gap-1.5 sm:max-w-xs">
          <Label
            className="text-xs font-medium text-foreground"
            htmlFor="gallery-variant"
          >
            Type de galerie
          </Label>
          <Select
            value={layout.variant}
            onValueChange={(variant) =>
              updateLayout({ variant: variant as GalleryVariant })
            }
          >
            <SelectTrigger id="gallery-variant" className="w-full">
              <SelectValue placeholder="Choisir un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uniform">Uniforme</SelectItem>
              <SelectItem value="masonry">Masonry</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Uniforme : grille régulière, toutes les vignettes au même format.
            Masonry : colonnes à hauteurs libres, effet éditorial.
          </p>
        </div>

        {/* Cliquabilité (diaporama) */}
        <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border bg-background/40 px-3 py-2">
          <div>
            <Label htmlFor="gallery-clickable" className="text-xs font-medium text-foreground">
              Photos cliquables
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Activé : un clic ouvre le diaporama. Désactivé : exposition statique.
            </p>
          </div>
          <Switch
            id="gallery-clickable"
            checked={layout.clickable}
            onCheckedChange={(clickable) => updateLayout({ clickable })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TextField
            label="Colonnes"
            type="number"
            value={String(layout.columns)}
            onChange={(value) => {
              const parsed = Number.parseInt(value, 10);
              if (!Number.isNaN(parsed)) {
                updateLayout({ columns: Math.min(Math.max(parsed, 1), 6) });
              }
            }}
            hint="Photos par ligne (1 à 6)."
          />
          <TextField
            label="Écart horizontal"
            type="number"
            value={String(layout.gapHorizontal)}
            onChange={(value) => {
              const parsed = Number.parseInt(value, 10);
              if (!Number.isNaN(parsed)) {
                updateLayout({ gapHorizontal: Math.max(parsed, 0) });
              }
            }}
            hint="Espace entre deux photos, en px."
          />
          <TextField
            label="Écart vertical"
            type="number"
            value={String(layout.gapVertical)}
            onChange={(value) => {
              const parsed = Number.parseInt(value, 10);
              if (!Number.isNaN(parsed)) {
                updateLayout({ gapVertical: Math.max(parsed, 0) });
              }
            }}
            hint="Espace entre deux lignes, en px."
          />
          <TextField
            label="Arrondi des coins"
            type="number"
            value={String(layout.radius)}
            onChange={(value) => {
              const parsed = Number.parseInt(value, 10);
              if (!Number.isNaN(parsed)) {
                updateLayout({ radius: Math.max(parsed, 0) });
              }
            }}
            hint="Courbure des coins des photos, en px."
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Ces réglages s’appliquent à l’affichage public de la galerie.
        </p>
      </div>

      {/* Import groupé depuis l’ordinateur (photo unique, multiple, dossier). */}
      {!demo ? (
        <div className="grid gap-2 rounded-md border border-dashed border-border bg-background/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Importer des photos
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => multiInputRef.current?.click()}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Images className="size-4" />
              )}
              Choisir des photos
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={openFolderPicker}
            >
              <FolderOpen className="size-4" />
              Choisir un dossier
            </Button>
            {progress ? (
              <span className="text-xs text-muted-foreground">
                Import {progress.done}/{progress.total}…
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{importHint}</p>
          {importError ? (
            <p role="alert" className="text-xs text-destructive">
              {importError}
            </p>
          ) : null}

          {/* Plusieurs photos à la fois */}
          <input
            ref={multiInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="hidden"
            onChange={(event) => handleImport(event.target.files)}
          />
          {/* Dossier complet (non compressé) */}
          <input
            ref={folderInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="hidden"
            onChange={(event) => handleImport(event.target.files)}
          />
        </div>
      ) : null}

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Photos ({content.images.length})
          </p>
          <Button type="button" variant="outline" size="sm" onClick={addImage}>
            <Plus />
            Ajouter
          </Button>
        </div>

        {content.images.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-background/50 px-3 py-4 text-center text-xs text-muted-foreground">
            Aucune photo. Importez une ou plusieurs photos, un dossier complet,
            ou cliquez sur « Ajouter ».
          </p>
        ) : (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {content.images.map((image, imageIndex) => {
              const hidden = image.hidden === true;
              const isDragging = dragIndex === imageIndex;
              return (
                <li
                  key={image.id}
                  draggable
                  onDragStart={(event) => {
                    // Ne démarre pas le glissement depuis les boutons d'action.
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
                  {/* Vignette (ou emplacement vide si aucune image). */}
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

                  {/* Indicateur masquée (site public). */}
                  {hidden ? (
                    <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur">
                      <EyeOff className="size-3" />
                      Masquée
                    </span>
                  ) : null}

                  {/* Actions CRUD fixes — boutons ronds sur fond plein (icônes blanches). */}
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
        )}

        {/* Conseil : actions des vignettes. */}
        {content.images.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Glissez-déposez une photo pour changer son ordre. Sous chaque photo :
            l’œil la masque (orange lorsqu’elle est cachée), le crayon la modifie
            et la poubelle la supprime.
          </p>
        ) : null}
      </div>

      {/* ---- Dialog d'édition d'une photo (upload local + alt SEO) ---- */}
      <Dialog open={editingImage !== null} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Éditer la photo</DialogTitle>
            <DialogDescription>
              Renseignez le texte alternatif pour le SEO et l’accessibilité.
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

              {/* Nom du fichier source (lorsqu'il est connu). */}
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
                hint="Court titre affiché au survol de la photo (vide par défaut)."
                onChange={(title) => updateImage(editingImage.id, { title })}
              />

              <TextAreaField
                label="Description"
                value={editingImage.description ?? ""}
                placeholder="Ex. Première danse des mariés au coucher du soleil…"
                hint="Texte libre affiché sous le titre (vide par défaut)."
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

              {/* Remplacement de l'image — upload local direct (pas d'URL). */}
              {!demo ? (
                <MediaUploadButton
                  label="Remplacer par une photo de l’ordinateur"
                  onUploaded={(url, filename) =>
                    updateImage(editingImage.id, {
                      url,
                      filename,
                      alt: editingImage.alt || baseNameWithoutExtension(filename),
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
