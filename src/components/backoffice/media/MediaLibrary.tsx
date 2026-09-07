"use client";

import * as React from "react";
import { Loader2, Trash2, UploadCloud } from "lucide-react";

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
  deleteMediaRequest,
  uploadMedia,
  useMediaAssets,
  type MediaAsset,
} from "@/lib/media-client";

/** Affiche une métadonnée EXIF connue (clé → libellé). */
const EXIF_LABELS: Record<string, string> = {
  FocalLength: "Focale",
  FNumber: "Ouverture",
  ExposureTime: "Vitesse",
  ISO: "ISO",
  Make: "Boîtier",
  Model: "Boîtier",
  LensModel: "Objectif",
  focale: "Focale",
  ouverture: "Ouverture",
  vitesse: "Vitesse",
  iso: "ISO",
  boitier: "Boîtier",
  objectif: "Objectif",
};

function exifValueToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

/** Formate la vitesse « 1/200 » correctement. */
function formatExposureTime(value: unknown): string | null {
  if (typeof value !== "number") return null;
  if (value >= 1) return `${value} s`;
  const divisor = Math.round(1 / value);
  return `1/${divisor} s`;
}

function ExifChips({ asset }: { asset: MediaAsset }) {
  const raw =
    asset.exifData && typeof asset.exifData === "object"
      ? (asset.exifData as Record<string, unknown>)
      : {};

  const chips: string[] = [];
  const focal = raw.FocalLength;
  if (typeof focal === "number") chips.push(`Focale ${focal} mm`);
  const fNumber = raw.FNumber;
  if (typeof fNumber === "number") chips.push(`f/${fNumber}`);
  const exposure = raw.ExposureTime ?? raw.exposureTime;
  const exposureText =
    typeof exposure === "number" ? formatExposureTime(exposure) : null;
  if (exposureText) chips.push(exposureText);
  const iso = raw.ISO;
  if (typeof iso === "number") chips.push(`ISO ${iso}`);
  const make = raw.Make;
  const model = raw.Model;
  if (typeof make === "string") chips.push(make);
  if (typeof model === "string") chips.push(model);

  // Repli : champs custom éventuels déjà formatés.
  for (const key of Object.keys(raw)) {
    if (chips.length >= 6) break;
    if (EXIF_LABELS[key]) {
      const text = exifValueToString(raw[key]);
      if (text && !chips.includes(text)) chips.push(text);
    }
  }

  if (chips.length === 0) return null;
  return (
    <p className="mt-1 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
      {chips.map((chip) => (
        <span key={chip} className="rounded bg-muted px-1.5 py-0.5">
          {chip}
        </span>
      ))}
    </p>
  );
}

export function MediaLibrary() {
  const { assets, loading, error, demo, refresh } = useMediaAssets();
  const [busy, setBusy] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<MediaAsset | null>(
    null
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await uploadMedia(file);
      await refresh();
    } catch (caught) {
      console.error("Upload :", caught);
    } finally {
      setBusy(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMediaRequest(deleteTarget.id);
      await refresh();
    } catch (caught) {
      console.error("Suppression :", caught);
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <section aria-labelledby="media-library-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="media-library-title" className="text-lg font-medium">
            Médias
          </h2>
          <p className="text-sm text-muted-foreground">
            {demo
              ? "Mode démo — médiathèque en lecture seule (Supabase Storage non configuré)."
              : "Déposez vos images (JPG, PNG, WebP, AVIF) pour les optimiser et les utiliser dans vos pages."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!demo && (
            <Button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="size-4" />
              {busy ? "Upload…" : "Importer"}
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Chargement…
        </div>
      ) : assets.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Aucune image. {demo ? "" : "Importez votre première image."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((asset) => (
            <article
              key={asset.id}
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              <div className="group relative aspect-[4/3] bg-muted">
                <MediaImage
                  src={asset.url}
                  alt={asset.filename}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  blurDataUrl={asset.blurDataUrl}
                  className="object-cover"
                />
                {!demo && (
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(asset)}
                    aria-label={`Supprimer ${asset.filename}`}
                    className="absolute right-2 top-2 rounded-md bg-background/80 p-1.5 text-muted-foreground opacity-0 backdrop-blur transition group-hover:opacity-100 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium" title={asset.filename}>
                  {asset.filename}
                </p>
                {asset.width && asset.height ? (
                  <p className="text-xs text-muted-foreground">
                    {asset.width} × {asset.height}
                  </p>
                ) : null}
                <ExifChips asset={asset} />
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette image ?</DialogTitle>
            <DialogDescription>
              L’objet Storage et la ligne média seront retirés définitivement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
