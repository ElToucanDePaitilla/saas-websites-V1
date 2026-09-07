/**
 * ============================================================================
 * RÉSOLUTION MÉDIA — EXIF & blur depuis la BDD (Étape 6.2)
 * ----------------------------------------------------------------------------
 * Helper **serveur** : pour une liste d'URL d'images (contenus de modules),
 * retourne les métadonnées (`exifData`, `blurDataUrl`) depuis la table `media`.
 * En cas de BDD indisponible / non migrée → `{}` (rendu sans EXIF/blur, jamais
 * bloquant).
 *
 * Référence : plans/ROADMAP-6.2-gallery-optimization.md §3
 * ============================================================================
 */

import { and, eq, inArray } from "drizzle-orm";

import { DEMO_PROFILE_ID } from "@/db/constants";
import { getDatabase } from "@/db/index";
import { media } from "@/db/schema";

export interface ResolvedMediaMeta {
  exifData: unknown;
  blurDataUrl: string | null;
}

/** Retourne les métadonnées média des URLs données (repli `{}`). */
export async function resolveMediaMetaByUrls(
  urls: string[],
  photographerId: string = DEMO_PROFILE_ID
): Promise<Record<string, ResolvedMediaMeta>> {
  const uniqueUrls = Array.from(new Set(urls.filter((url) => url !== "")));
  if (uniqueUrls.length === 0) {
    return {};
  }
  try {
    const database = getDatabase();
    const rows = await database
      .select({
        url: media.url,
        exifData: media.exifData,
        blurDataUrl: media.blurDataUrl,
      })
      .from(media)
      .where(
        and(eq(media.photographerId, photographerId), inArray(media.url, uniqueUrls))
      );
    const result: Record<string, ResolvedMediaMeta> = {};
    for (const row of rows) {
      result[row.url] = {
        exifData: row.exifData,
        blurDataUrl: row.blurDataUrl,
      };
    }
    return result;
  } catch {
    return {};
  }
}
