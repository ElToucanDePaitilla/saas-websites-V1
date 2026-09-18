/**
 * ============================================================================
 * REPOSITORY SITE_TOP_BANNER — mini-bandeau Alerte / Promo
 * ----------------------------------------------------------------------------
 * Couche **purement serveur** (jamais importée par un Client Component) :
 *   - `getTopBanner(photographerId)` : lit la ligne unique du photographe et
 *     décode `data` (JSONB typé `TopBanner`) via `TopBannerSchema` (parse
 *     tolérant) — retourne `null` si absente ou invalide ;
 *   - `upsertTopBanner(photographerId, value)` : insère ou remplace la ligne
 *     (PK = photographer_id) et met à jour `updated_at`.
 *
 * Aucune lecture publique : le bandeau est alimenté côté serveur (rôle service)
 * via `loadInitialData` — RLS owner-only posée en migration 0012.
 * ============================================================================
 */

import { eq, sql } from "drizzle-orm";

import { TopBannerSchema } from "../../lib/schemas/persistence";
import { normalizeTopBanner, type TopBanner } from "../../lib/top-banner";
import { getDatabase } from "../index";
import { siteTopBanner } from "../schema";

/**
 * Décode un `data` JSONB vers un `TopBanner` complet (tolérant) : normalise
 * d'abord la forme stockée (champs manquants, JSONB ancien), puis valide via
 * Zod. Retourne `null` si le stockage est vide/inexploitable.
 */
function decodeTopBanner(data: unknown): TopBanner | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const normalized = normalizeTopBanner(data);
  const parsed = TopBannerSchema.safeParse(normalized);
  return parsed.success ? parsed.data : normalized;
}

/** Lecture de la configuration d'un photographe (ou `null` si aucune ligne). */
export async function getTopBanner(
  photographerId: string
): Promise<TopBanner | null> {
  const database = getDatabase();
  const rows = await database
    .select({ data: siteTopBanner.data })
    .from(siteTopBanner)
    .where(eq(siteTopBanner.photographerId, photographerId))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return null;
  }
  return decodeTopBanner(row.data);
}

/** Écrit (insert ou upsert) la configuration complète d'un photographe. */
export async function upsertTopBanner(
  photographerId: string,
  value: TopBanner
): Promise<void> {
  const parsed = decodeTopBanner(value);
  if (!parsed) {
    throw new Error("Bandeau d'alerte invalide (validation refusée)");
  }
  const database = getDatabase();
  await database
    .insert(siteTopBanner)
    .values({
      photographerId,
      data: parsed,
    })
    .onConflictDoUpdate({
      target: siteTopBanner.photographerId,
      set: {
        data: sql`excluded.data`,
        updatedAt: sql`now()`,
      },
    });
}
