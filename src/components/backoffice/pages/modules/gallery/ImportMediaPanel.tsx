"use client";

import * as React from "react";
import { FolderOpen, Images, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isMediaDemoMode, uploadMedia } from "@/lib/media-client";

/**
 * ============================================================================
 * IMPORT MÉDIA — panneau réutilisable (Phase 11)
 * ----------------------------------------------------------------------------
 * Extraction de l'import de l'historique « Galerie photo masonry », partagé par
 * les trois variantes de galerie (et par album en Portfolio) :
 *   - sélection de **plusieurs photos** ;
 *   - sélection d'un **dossier complet non compressé** (`webkitdirectory`) ;
 *   - filtres MIME image + 15 Mo max/fichier (miroir serveur) ;
 *   - upload séquentiel avec progression et synthèse des erreurs ;
 *   - désactivation propre en mode démo (Storage non configuré).
 * Les assets uploadés sont remontés au parent (`onImported`) qui décide où les
 * rattacher (galerie ou album).
 * ============================================================================
 */

/** Un média uploadé prêt à être rattaché. */
export type UploadedImage = {
  url: string;
  alt: string;
  filename: string;
  width: number | null;
  height: number | null;
};

type ImportMediaPanelProps = {
  onImported: (assets: UploadedImage[]) => void;
  /** Sur-titre du panneau (défaut : « Importer des photos »). */
  title?: string;
  /** Libellé du bouton « dossier » (défaut : « Choisir un dossier »). */
  folderLabel?: string;
  /** Force le mode démo (sinon détecté automatiquement). */
  demo?: boolean;
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

export function ImportMediaPanel({
  onImported,
  title = "Importer des photos",
  folderLabel = "Choisir un dossier",
  demo,
}: ImportMediaPanelProps) {
  const demoMode = demo ?? isMediaDemoMode();

  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState<{
    done: number;
    total: number;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const multiInputRef = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null);

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
      setError(
        "Aucune image valide détectée (JPG, PNG, WebP, AVIF, GIF — 15 Mo max par fichier)."
      );
      resetInputs();
      return;
    }

    setBusy(true);
    setError(null);
    setProgress({ done: 0, total: valid.length });

    const uploaded: UploadedImage[] = [];
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

    if (uploaded.length > 0) {
      onImported(uploaded);
    }

    const summary: string[] = [];
    if (ignored > 0) {
      summary.push(`${ignored} fichier(s) ignoré(s) (non-image ou > 15 Mo).`);
    }
    if (failures > 0) {
      summary.push(`${failures} upload(s) en échec.`);
    }
    setError(summary.length > 0 ? summary.join(" ") : null);

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

  const hint = demoMode
    ? "Upload désactivé en mode démo (Supabase Storage non configuré)."
    : "Plusieurs photos ou un dossier entier. JPG, PNG, WebP, AVIF, GIF — " +
      "15 Mo max/fichier. " +
      `Conseil : ${RECOMMENDED_BATCH} photos max par import pour rester fluide.`;

  return (
    <div className="grid gap-2 rounded-md border border-dashed border-border bg-background/50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>

      {demoMode ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : (
        <>
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
              {folderLabel}
            </Button>
            {progress ? (
              <span className="text-xs text-muted-foreground">
                Import {progress.done}/{progress.total}…
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </>
      )}

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}

      {/* Plusieurs photos à la fois. */}
      <input
        ref={multiInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={(event) => void handleImport(event.target.files)}
      />
      {/* Dossier complet (non compressé). */}
      <input
        ref={folderInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={(event) => void handleImport(event.target.files)}
      />
    </div>
  );
}
