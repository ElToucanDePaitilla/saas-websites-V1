"use client";

import * as React from "react";
import { ImagePlus, Loader2, UploadCloud } from "lucide-react";

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
import {
  uploadMedia,
  useMediaAssets,
  type MediaAsset,
} from "@/lib/media-client";

/**
 * ============================================================================
 * MEDIA PICKER — sélecteur d'images (Étape 6.1)
 * ----------------------------------------------------------------------------
 * Dialog listant la médiathèque (BDD ou jeu de démo) : un clic choisit un actif
 * et appelle `onPick(asset)` (l'appelant en tire `{ url, alt }`).
 * Réutilisé par la Media Library et les éditeurs de modules (via MediaFields).
 * ============================================================================
 */

export function MediaPicker({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (asset: MediaAsset) => void;
}) {
  const { assets, loading, demo, refresh } = useMediaAssets();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handlePick(asset: MediaAsset) {
    onPick(asset);
    onOpenChange(false);
  }

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      // Upload local puis sélection immédiate du nouvel actif.
      const asset = await uploadMedia(file);
      await refresh();
      handlePick(asset);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload impossible.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choisir une image</DialogTitle>
          <DialogDescription>
            {demo
              ? "Mode démo : images d’exemple en lecture seule."
              : "Sélectionnez une image de votre médiathèque."}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Chargement…
          </div>
        ) : assets.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {demo
              ? "Aucune image d’exemple."
              : "Aucune image — utilisez « Importer depuis l’ordinateur » ci-dessous."}
          </p>
        ) : (
          <div className="grid max-h-[50vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => handlePick(asset)}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted transition hover:ring-2 hover:ring-ring"
              >
                <MediaImage
                  src={asset.url}
                  alt={asset.filename}
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  blurDataUrl={asset.blurDataUrl}
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        )}

        <DialogFooter className="justify-between">
          {!demo ? (
            <div className="flex flex-1 items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {busy ? "Upload en cours…" : "JPG, PNG, WebP, AVIF — 15 Mo max."}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy || loading}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="size-4" />
                Importer depuis l’ordinateur
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                className="hidden"
                onChange={(event) => handleFiles(event.target.files)}
              />
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              Mode démo — import désactivé.
            </span>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Bouton déclencheur compact du sélecteur (réutilisable). */
export function MediaPickButton({
  onPick,
  className,
}: {
  onPick: (asset: MediaAsset) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
      >
        <ImagePlus className="size-4" />
        Médiathèque
      </Button>
      <MediaPicker open={open} onOpenChange={setOpen} onPick={onPick} />
    </>
  );
}
