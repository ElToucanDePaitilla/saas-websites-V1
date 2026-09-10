"use client";

import * as React from "react";
import { Loader2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isMediaDemoMode, uploadMedia } from "@/lib/media-client";

/**
 * ============================================================================
 * UPLOAD LOCAL DIRECT — champ d'image d'un module (Étape 6.x)
 * ----------------------------------------------------------------------------
 * Bouton « cliquer ici pour uploader votre photo » : ouvre le gestionnaire de
 * fichiers local, uploade l'image (POST /api/media → Storage + ligne media),
 * puis retourne `{ url, alt }` pour pré-remplir le champ (ex. Hero/À propos).
 * Pas de sélecteur de médiathèque : upload direct. Désactivé en mode démo.
 * ============================================================================
 */

export function MediaUploadButton({
  onUploaded,
  label = "Cliquer ici pour uploader votre photo",
  accept = "image/jpeg,image/png,image/webp,image/avif,image/gif",
}: {
  /** Appelé avec l'URL publique et le nom du fichier une fois l'upload fait. */
  onUploaded: (url: string, alt: string) => void;
  label?: string;
  /** Types MIME acceptés par le sélecteur de fichier. */
  accept?: string;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const demo = isMediaDemoMode();

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const asset = await uploadMedia(file);
      onUploaded(asset.url, asset.filename);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload impossible.");
    } finally {
      setBusy(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  if (demo) {
    return (
      <p className="text-xs text-muted-foreground">
        Upload désactivé en mode démo (Supabase Storage non configuré).
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Upload en cours…
          </>
        ) : (
          <>
            <UploadCloud className="size-4" />
            {label}
          </>
        )}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
