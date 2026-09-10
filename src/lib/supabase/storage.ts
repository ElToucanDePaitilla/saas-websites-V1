/**
 * ============================================================================
 * STORAGE SUPABASE — helpers médias (Étape 6.1)
 * ----------------------------------------------------------------------------
 * Helpers **serveur** autour du bucket `portfolio-media` :
 *   - `uploadImage(client, photographerId, file)` : upload sous
 *     `{photographerId}/{uuid}.{ext}` + retour de l'URL publique ;
 *   - `deleteImage(client, path)` : suppression d'un objet.
 *
 * Le client (session utilisateur `src/lib/supabase/server.ts`) respecte les
 * politiques Storage de la migration 0002 (Owner via préfixe `auth.uid()`).
 *
 * Référence : plans/ROADMAP-6.1-media-storage.md §2-§3
 * ============================================================================
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** Nom du bucket public des images du portfolio. */
export const MEDIA_BUCKET = "portfolio-media";

/** Extension de fichier depuis un type MIME image. */
export function extensionFromMime(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    case "image/gif":
      return "gif";
    case "image/svg+xml":
      return "svg";
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    default:
      return "bin";
  }
}

/** Upload d'une image (préfixe propriétaire) → { path, publicUrl }. */
export async function uploadImage(
  client: SupabaseClient,
  photographerId: string,
  file: File,
  mimeType: string
): Promise<{ path: string; publicUrl: string }> {
  const extension = extensionFromMime(mimeType);
  const objectPath = `${photographerId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await client.storage
    .from(MEDIA_BUCKET)
    .upload(objectPath, file, { contentType: mimeType });
  if (error) {
    throw new Error(`Upload Storage refusé : ${error.message}`);
  }

  const publicUrl = client.storage
    .from(MEDIA_BUCKET)
    .getPublicUrl(objectPath).data.publicUrl;
  return { path: objectPath, publicUrl };
}

/** Supprime un objet du bucket (path complet). */
export async function deleteImage(
  client: SupabaseClient,
  path: string
): Promise<void> {
  const { error } = await client.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) {
    throw new Error(`Suppression Storage refusée : ${error.message}`);
  }
}

/** Extrait le path Storage d'une URL publique (`…/portfolio-media/<path>`). */
export function storagePathFromUrl(publicUrl: string): string | null {
  const marker = `/object/public/${MEDIA_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) {
    return null;
  }
  return publicUrl.slice(index + marker.length);
}
