import type { Metadata } from "next";

import { MediaLibrary } from "@/components/backoffice/media/MediaLibrary";

export const metadata: Metadata = {
  title: "Médias — Administration",
};

/**
 * ============================================================================
 * PAGE — Médiathèque Back-Office `/admin/media` (Étape 6.1)
 * ----------------------------------------------------------------------------
 * Grille des images (upload, suppression, métadonnées EXIF) + mode démo quand
 * Supabase Storage n'est pas configuré. Rendu serveur léger : l'interactivité
 * (upload/liste) est client (`MediaLibrary`).
 * ============================================================================
 */
export default function MediaAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-wide">
          Médiathèque
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez et optimisez les images de votre portfolio (upload, EXIF,
          vignettes WebP/AVIF).
        </p>
      </div>
      <MediaLibrary />
    </div>
  );
}
