/**
 * ============================================================================
 * REPOSITORY MEDIA — lecture/écriture des images (Étape 6.1)
 * ----------------------------------------------------------------------------
 * Table `media` (drizzle) : list, create, delete — toujours scopées au
 * `photographerId` (isolation multi-tenant, auth.uid() côté appelant).
 * Couche **purement serveur**.
 *
 * Référence : plans/ROADMAP-6.1-media-storage.md §1 & §3
 * ============================================================================
 */

import { and, desc, eq } from "drizzle-orm";

import { getDatabase } from "../index";
import { media, type MediaRow } from "../schema";

/** Actif média exposé à l'UI (domaine). */
export interface MediaAsset {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  width: number | null;
  height: number | null;
  exifData: unknown;
  blurDataUrl: string | null;
  createdAt: string;
}

function toMediaAsset(row: MediaRow): MediaAsset {
  return {
    id: row.id,
    url: row.url,
    filename: row.filename,
    size: row.size,
    mimeType: row.mimeType,
    width: row.width,
    height: row.height,
    exifData: row.exifData,
    blurDataUrl: row.blurDataUrl,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Liste les médias d'un photographe (plus récents en premier). */
export async function listMedia(
  photographerId: string
): Promise<MediaAsset[]> {
  const database = getDatabase();
  const rows = await database
    .select()
    .from(media)
    .where(eq(media.photographerId, photographerId))
    .orderBy(desc(media.createdAt));
  return rows.map(toMediaAsset);
}

/** Insère un média uploadé et le retourne. */
export async function createMedia(
  photographerId: string,
  data: {
    url: string;
    filename: string;
    size: number;
    mimeType: string;
    width?: number | null;
    height?: number | null;
    exifData?: unknown;
    blurDataUrl?: string | null;
  }
): Promise<MediaAsset> {
  const database = getDatabase();
  const [row] = await database
    .insert(media)
    .values({
      photographerId,
      url: data.url,
      filename: data.filename,
      size: data.size,
      mimeType: data.mimeType,
      width: data.width ?? null,
      height: data.height ?? null,
      exifData: data.exifData ?? {},
      blurDataUrl: data.blurDataUrl ?? null,
    })
    .returning();
  if (!row) {
    throw new Error("Échec de la création du média.");
  }
  return toMediaAsset(row);
}

/** Retourne un média (Owner) ou `null`. */
export async function getMedia(
  photographerId: string,
  mediaId: string
): Promise<MediaAsset | null> {
  const database = getDatabase();
  const [row] = await database
    .select()
    .from(media)
    .where(and(eq(media.id, mediaId), eq(media.photographerId, photographerId)))
    .limit(1);
  return row ? toMediaAsset(row) : null;
}

/** Supprime un média (Owner) — retourne true si une ligne a été retirée. */
export async function deleteMedia(
  photographerId: string,
  mediaId: string
): Promise<boolean> {
  const database = getDatabase();
  const deleted = await database
    .delete(media)
    .where(
      and(eq(media.id, mediaId), eq(media.photographerId, photographerId))
    )
    .returning({ id: media.id });
  return deleted.length > 0;
}
